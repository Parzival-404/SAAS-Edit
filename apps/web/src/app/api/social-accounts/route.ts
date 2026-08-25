import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encryptSecret } from "@saas-edit/crypto";

const connectAccountSchema = z.object({
  platform: z.enum(["TIKTOK", "INSTAGRAM_REELS", "YOUTUBE_SHORTS"]),
  displayName: z.string().min(1).max(100),
  accessToken: z.string().min(1),
  refreshToken: z.string().optional(),
  externalAccountId: z.string().optional(),
});

// Ne jamais renvoyer les tokens (même chiffrés) au client.
function sanitize<T extends { accessTokenEncrypted: unknown; refreshTokenEncrypted: unknown }>(
  account: T,
) {
  const { accessTokenEncrypted, refreshTokenEncrypted, ...rest } = account;
  return rest;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const accounts = await prisma.socialAccount.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ accounts: accounts.map(sanitize) });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = connectAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Champs invalides" }, { status: 400 });
  }

  const { platform, displayName, accessToken, refreshToken, externalAccountId } = parsed.data;

  const account = await prisma.socialAccount.upsert({
    where: { userId_platform: { userId, platform } },
    update: {
      displayName,
      externalAccountId,
      accessTokenEncrypted: encryptSecret(accessToken),
      refreshTokenEncrypted: refreshToken ? encryptSecret(refreshToken) : null,
      status: "CONNECTED",
      errorMessage: null,
    },
    create: {
      userId,
      platform,
      displayName,
      externalAccountId,
      accessTokenEncrypted: encryptSecret(accessToken),
      refreshTokenEncrypted: refreshToken ? encryptSecret(refreshToken) : null,
    },
  });

  return NextResponse.json({ account: sanitize(account) }, { status: 201 });
}
