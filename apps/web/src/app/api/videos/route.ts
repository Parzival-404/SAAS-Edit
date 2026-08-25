import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { videoQueue } from "@/lib/queue";
import { extractYoutubeVideoId, fetchYoutubeOEmbed } from "@/lib/youtube";

const createVideoSchema = z.object({
  youtubeUrl: z.string().url(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const videos = await prisma.sourceVideo.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { clips: { select: { id: true } } },
  });

  return NextResponse.json({ videos });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createVideoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Lien YouTube invalide" }, { status: 400 });
  }

  const youtubeVideoId = extractYoutubeVideoId(parsed.data.youtubeUrl);
  if (!youtubeVideoId) {
    return NextResponse.json(
      { error: "Impossible d'extraire l'identifiant de la vidéo YouTube" },
      { status: 400 },
    );
  }

  const metadata = await fetchYoutubeOEmbed(parsed.data.youtubeUrl);

  const sourceVideo = await prisma.sourceVideo.create({
    data: {
      userId,
      youtubeUrl: parsed.data.youtubeUrl,
      youtubeVideoId,
      title: metadata?.title,
      thumbnailUrl: metadata?.thumbnailUrl,
      status: "PENDING",
    },
  });

  await prisma.processingJob.create({
    data: { sourceVideoId: sourceVideo.id, status: "PENDING" },
  });

  await videoQueue.add(
    "process-video",
    { sourceVideoId: sourceVideo.id },
    { removeOnComplete: true, removeOnFail: false },
  );

  return NextResponse.json({ video: sourceVideo }, { status: 201 });
}
