import { prisma } from "@saas-edit/db";
import { decryptSecret } from "@saas-edit/crypto";
import { fetchMetrics, FetchMetricsError } from "./fetchMetrics.js";
import { config } from "../config.js";

/**
 * Relève périodiquement les métriques (vues, likes, commentaires,
 * partages) de chaque post publié, pour tracer leur évolution dans le
 * temps et permettre la comparaison entre clips (onglet Analytics).
 */
export async function refreshDueMetrics(): Promise<void> {
  const publishedPosts = await prisma.scheduledPost.findMany({
    where: { status: "PUBLISHED" },
    include: {
      socialAccount: true,
      metricsSnapshots: { orderBy: { capturedAt: "desc" }, take: 1 },
    },
  });

  const now = Date.now();
  const due = publishedPosts.filter((post) => {
    const last = post.metricsSnapshots[0];
    if (!last) return true;
    return now - last.capturedAt.getTime() >= config.analyticsRefreshIntervalMs;
  });

  for (const post of due) {
    await refreshOne(post);
  }
}

async function refreshOne(
  post: Awaited<ReturnType<typeof prisma.scheduledPost.findMany>>[number] & {
    socialAccount: NonNullable<Awaited<ReturnType<typeof prisma.socialAccount.findFirst>>>;
  },
): Promise<void> {
  try {
    if (!post.socialAccount.accessTokenEncrypted) {
      throw new FetchMetricsError("Compte social sans token d'accès enregistré");
    }
    const accessToken = decryptSecret(post.socialAccount.accessTokenEncrypted);
    const metrics = await fetchMetrics(post, post.socialAccount, accessToken);

    const engagementRate =
      metrics.views && metrics.views > 0
        ? ((metrics.likes ?? 0) + (metrics.comments ?? 0) + (metrics.shares ?? 0)) / metrics.views
        : null;

    await prisma.postMetricsSnapshot.create({
      data: {
        scheduledPostId: post.id,
        views: metrics.views,
        likes: metrics.likes,
        comments: metrics.comments,
        shares: metrics.shares,
        engagementRate,
      },
    });
    console.log(`[analytics] relevé mis à jour pour le post ${post.id} (${post.platform})`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[analytics] échec du relevé pour le post ${post.id}:`, message);
  }
}
