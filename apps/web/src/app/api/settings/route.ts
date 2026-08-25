import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const updateSettingsSchema = z.object({
  minClipsPerVideo: z.number().int().min(1).max(20),
  maxClipsPerVideo: z.number().int().min(1).max(20),
  targetClipDurationS: z.number().int().min(10).max(180),
  tone: z.enum(["FUNNY", "PROFESSIONAL", "VIRAL", "DRAMA", "EDUCATIONAL"]),
  subtitleLanguage: z.string().min(2).max(10),
});

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Champs invalides" }, { status: 400 });
  }

  const settings = await prisma.userSettings.upsert({
    where: { userId },
    update: parsed.data,
    create: { userId, ...parsed.data },
  });

  return NextResponse.json({ settings });
}
