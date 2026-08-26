import { prisma } from "@saas-edit/db";

/**
 * Résume les clips publiés les plus performants de l'utilisateur (par
 * taux d'engagement) pour les injecter dans le prompt d'analyse — la
 * boucle d'amélioration continue : Claude reconnaît lui-même les motifs
 * (longueur, ton, formulation des hooks...) plutôt qu'un scoring codé en
 * dur, cohérent avec la façon dont la base d'inspiration est déjà
 * utilisée.
 */
export async function getPerformanceLearningsBlock(userId: string): Promise<string | null> {
  const topPosts = await prisma.scheduledPost.findMany({
    where: {
      userId,
      status: "PUBLISHED",
      metricsSnapshots: { some: { engagementRate: { not: null } } },
    },
    include: {
      clip: { select: { title: true, hook: true, durationSec: true, hashtags: true } },
      metricsSnapshots: { orderBy: { capturedAt: "desc" }, take: 1 },
    },
  });

  const ranked = topPosts
    .filter((post) => post.metricsSnapshots[0]?.engagementRate != null)
    .sort((a, b) => b.metricsSnapshots[0].engagementRate! - a.metricsSnapshots[0].engagementRate!)
    .slice(0, 5);

  if (ranked.length === 0) return null;

  const lines = ranked.map((post) => {
    const rate = post.metricsSnapshots[0].engagementRate!;
    return `- Titre: "${post.clip.title}" | Hook: "${post.clip.hook}" | Durée: ${post.clip.durationSec}s | Hashtags: ${post.clip.hashtags.join(", ")} | Engagement: ${(rate * 100).toFixed(1)}%`;
  });

  return (
    "Clips précédents de cet utilisateur les mieux reçus par son audience " +
    "(du plus performant au moins performant) — inspire-toi de ce qui " +
    "fonctionne pour cette audience spécifique (longueur, ton, formulation " +
    "des hooks) sans copier mot pour mot :\n" +
    lines.join("\n")
  );
}
