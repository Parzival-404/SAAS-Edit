import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const updatePostSchema = z.object({
  caption: z.string().min(1).max(2200).optional(),
  hashtags: z.array(z.string()).optional(),
  scheduledFor: z.string().datetime().nullable().optional(),
  // "SCHEDULED" = valider le brouillon pour publication (immédiate si
  // scheduledFor est vide/passé, sinon à la date programmée).
  status: z.enum(["DRAFT", "SCHEDULED"]).optional(),
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
  const parsed = updatePostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Champs invalides" }, { status: 400 });
  }

  const existing = await prisma.scheduledPost.findFirst({ where: { id: params.id, userId } });
  if (!existing) {
    return NextResponse.json({ error: "Post introuvable" }, { status: 404 });
  }
  if (existing.status === "PUBLISHED" || existing.status === "PUBLISHING") {
    return NextResponse.json(
      { error: "Ce post a déjà été publié ou est en cours de publication" },
      { status: 409 },
    );
  }

  const { scheduledFor, ...rest } = parsed.data;
  const post = await prisma.scheduledPost.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(scheduledFor !== undefined
        ? { scheduledFor: scheduledFor ? new Date(scheduledFor) : null }
        : {}),
    },
  });

  return NextResponse.json({ post });
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

  const existing = await prisma.scheduledPost.findFirst({ where: { id: params.id, userId } });
  if (!existing) {
    return NextResponse.json({ error: "Post introuvable" }, { status: 404 });
  }
  if (existing.status === "PUBLISHED") {
    return NextResponse.json(
      { error: "Impossible d'annuler un post déjà publié" },
      { status: 409 },
    );
  }

  await prisma.scheduledPost.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
