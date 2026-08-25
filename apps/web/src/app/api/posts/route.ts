import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const createPostSchema = z.object({
  clipId: z.string().min(1),
  socialAccountId: z.string().min(1),
  caption: z.string().min(1).max(2200),
  hashtags: z.array(z.string()).default([]),
  scheduledFor: z.string().datetime().optional(),
});

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const clipId = new URL(request.url).searchParams.get("clipId");

  const posts = await prisma.scheduledPost.findMany({
    where: { userId, ...(clipId ? { clipId } : {}) },
    orderBy: { createdAt: "desc" },
    include: {
      clip: { select: { title: true, thumbnailUrl: true } },
      socialAccount: { select: { displayName: true, platform: true } },
    },
  });

  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Champs invalides" }, { status: 400 });
  }

  const [clip, socialAccount, settings] = await Promise.all([
    prisma.clip.findFirst({ where: { id: parsed.data.clipId, userId } }),
    prisma.socialAccount.findFirst({ where: { id: parsed.data.socialAccountId, userId } }),
    prisma.userSettings.findUnique({ where: { userId } }),
  ]);
  if (!clip) {
    return NextResponse.json({ error: "Clip introuvable" }, { status: 404 });
  }
  if (!socialAccount) {
    return NextResponse.json({ error: "Compte social introuvable" }, { status: 404 });
  }
  if (clip.status !== "READY" || !clip.videoUrl) {
    return NextResponse.json(
      { error: "Le clip doit être prêt (exporté) avant de pouvoir être programmé" },
      { status: 409 },
    );
  }

  // En mode validation manuelle (par défaut) : le post reste en
  // brouillon jusqu'à ce que l'utilisateur clique explicitement sur
  // "Valider". En mode automatique : programmé directement.
  const initialStatus = settings?.publishMode === "AUTOMATIC" ? "SCHEDULED" : "DRAFT";

  const post = await prisma.scheduledPost.create({
    data: {
      clipId: clip.id,
      userId,
      socialAccountId: socialAccount.id,
      platform: socialAccount.platform,
      caption: parsed.data.caption,
      hashtags: parsed.data.hashtags,
      scheduledFor: parsed.data.scheduledFor ? new Date(parsed.data.scheduledFor) : null,
      status: initialStatus,
    },
  });

  return NextResponse.json({ post }, { status: 201 });
}
