import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { resolveChannel, YoutubeApiError } from "@saas-edit/youtube-api";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const createChannelSchema = z.object({
  input: z.string().min(1),
  checkFrequencyMinutes: z.number().int().min(15).max(1440).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const channels = await prisma.youtubeChannel.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ channels });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (!process.env.YOUTUBE_API_KEY) {
    return NextResponse.json(
      { error: "YOUTUBE_API_KEY n'est pas configurée côté serveur" },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createChannelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Champs invalides" }, { status: 400 });
  }

  let resolved;
  try {
    resolved = await resolveChannel(parsed.data.input, process.env.YOUTUBE_API_KEY);
  } catch (err) {
    const message = err instanceof YoutubeApiError ? err.message : "Erreur inattendue";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const existing = await prisma.youtubeChannel.findUnique({
    where: { userId_channelId: { userId, channelId: resolved.channelId } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Cette chaîne est déjà connectée" },
      { status: 409 },
    );
  }

  const channel = await prisma.youtubeChannel.create({
    data: {
      userId,
      channelId: resolved.channelId,
      title: resolved.title,
      thumbnailUrl: resolved.thumbnailUrl,
      handle: resolved.handle,
      checkFrequencyMinutes: parsed.data.checkFrequencyMinutes ?? 30,
    },
  });

  return NextResponse.json({ channel }, { status: 201 });
}
