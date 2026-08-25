import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const existing = await prisma.inspirationItem.findFirst({
    where: { id: params.id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Élément introuvable" }, { status: 404 });
  }

  await prisma.inspirationItem.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
