import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const updateClipSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  hook: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
  hashtags: z.array(z.string()).optional(),
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
  const parsed = updateClipSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Champs invalides" }, { status: 400 });
  }

  const existing = await prisma.clip.findFirst({
    where: { id: params.id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Clip introuvable" }, { status: 404 });
  }

  const clip = await prisma.clip.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json({ clip });
}
