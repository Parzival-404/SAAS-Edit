import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const clips = await prisma.clip.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { sourceVideo: { select: { title: true, youtubeUrl: true } } },
  });

  return NextResponse.json({ clips });
}
