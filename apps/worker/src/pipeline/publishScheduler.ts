import { prisma } from "@saas-edit/db";
import { decryptSecret } from "@saas-edit/crypto";
import { publishToPlaform, PublishError } from "./publishPost.js";

/**
 * Mode automatique / programmé : publie chaque ScheduledPost dont le
 * statut est SCHEDULED et dont la date programmée est atteinte (ou
 * absente = publication immédiate dès validation).
 */
export async function publishDuePosts(): Promise<void> {
  const now = new Date();

  const duePosts = await prisma.scheduledPost.findMany({
    where: {
      status: "SCHEDULED",
      OR: [{ scheduledFor: null }, { scheduledFor: { lte: now } }],
    },
    include: { clip: true, socialAccount: true },
  });

  for (const post of duePosts) {
    await publishOne(post);
  }
}

async function publishOne(
  post: Awaited<ReturnType<typeof prisma.scheduledPost.findMany>>[number] & {
    clip: NonNullable<Awaited<ReturnType<typeof prisma.clip.findFirst>>>;
    socialAccount: NonNullable<Awaited<ReturnType<typeof prisma.socialAccount.findFirst>>>;
  },
): Promise<void> {
  await prisma.scheduledPost.update({ where: { id: post.id }, data: { status: "PUBLISHING" } });

  try {
    if (!post.socialAccount.accessTokenEncrypted) {
      throw new PublishError("Compte social sans token d'accès enregistré");
    }
    const accessToken = decryptSecret(post.socialAccount.accessTokenEncrypted);

    const result = await publishToPlaform(post, post.clip, post.socialAccount, accessToken);

    await prisma.scheduledPost.update({
      where: { id: post.id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        platformPostId: result.platformPostId,
        platformPostUrl: result.platformPostUrl,
        errorMessage: null,
      },
    });
    console.log(`[publish] post ${post.id} publié sur ${post.platform} (${result.platformPostId})`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[publish] échec pour le post ${post.id}:`, message);
    await prisma.scheduledPost.update({
      where: { id: post.id },
      data: { status: "FAILED", errorMessage: message },
    });
    await prisma.socialAccount.update({
      where: { id: post.socialAccount.id },
      data: message.toLowerCase().includes("token") ? { status: "EXPIRED" } : {},
    });
  }
}
