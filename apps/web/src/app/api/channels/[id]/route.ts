import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const updateChannelSchema = z.object({
  monitoringEnabled: z.boolean().optional(),
  checkFrequencyMinutes: z.number().int().min(15).max(1440).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateChannelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Champs invalides" }, { status: 400 });
  }

  const existing = await prisma.youtubeChannel.findFirst({
    where: { id: params.id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Chaîne introuvable" }, { status: 404 });
  }

  const channel = await prisma.youtubeChannel.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json({ channel });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const existing = await prisma.youtubeChannel.findFirst({
    where: { id: params.id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Chaîne introuvable" }, { status: 404 });
  }

  await prisma.youtubeChannel.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
