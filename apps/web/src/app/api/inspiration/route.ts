import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const createInspirationSchema = z.object({
  type: z.enum([
    "HOOK",
    "TITLE",
    "FORMAT",
    "REFERENCE",
    "TONE_GUIDELINE",
    "WORD_TO_AVOID",
    "TEMPLATE",
    "BRAND_PREFERENCE",
  ]),
  content: z.string().min(1).max(2000),
  notes: z.string().max(1000).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const items = await prisma.inspirationItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createInspirationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Champs invalides" }, { status: 400 });
  }

  const item = await prisma.inspirationItem.create({
    data: { ...parsed.data, userId },
  });

  return NextResponse.json({ item }, { status: 201 });
}
