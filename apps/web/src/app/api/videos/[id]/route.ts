import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const video = await prisma.sourceVideo.findFirst({
    where: { id: params.id, userId },
    include: {
      clips: true,
      processingJobs: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!video) {
    return NextResponse.json({ error: "Vidéo introuvable" }, { status: 404 });
  }

  return NextResponse.json({ video });
}
