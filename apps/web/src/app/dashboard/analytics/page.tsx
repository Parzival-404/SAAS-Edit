import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";

const PLATFORM_LABELS: Record<string, string> = {
  TIKTOK: "TikTok",
  INSTAGRAM_REELS: "Instagram Reels",
  YOUTUBE_SHORTS: "YouTube Shorts",
};

function formatNumber(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("fr-FR").format(n);
}

function formatPercent(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

export default async function AnalyticsPage() {
  const userId = await requireUserId();

  const posts = await prisma.scheduledPost.findMany({
    where: { userId, status: "PUBLISHED" },
    include: {
      clip: { select: { id: true, title: true, thumbnailUrl: true, hook: true } },
      socialAccount: { select: { displayName: true } },
      metricsSnapshots: { orderBy: { capturedAt: "desc" }, take: 1 },
      commentInsight: true,
    },
  });

  const withMetrics = posts.map((post) => ({
    ...post,
    latest: post.metricsSnapshots[0] ?? null,
  }));

  const ranked = [...withMetrics].sort((a, b) => {
    const aRate = a.latest?.engagementRate ?? -1;
    const bRate = b.latest?.engagementRate ?? -1;
    return bRate - aRate;
  });

  const platformGroups = new Map<string, { count: number; totalViews: number; totalEngagement: number; withEngagement: number }>();
  for (const post of withMetrics) {
    const entry = platformGroups.get(post.platform) ?? {
      count: 0,
      totalViews: 0,
      totalEngagement: 0,
      withEngagement: 0,
    };
    entry.count += 1;
    entry.totalViews += post.latest?.views ?? 0;
    if (post.latest?.engagementRate != null) {
      entry.totalEngagement += post.latest.engagementRate;
      entry.withEngagement += 1;
    }
    platformGroups.set(post.platform, entry);
  }

  if (posts.length === 0) {
    return (
      <div>
        <PageHeader
          title="Analytics"
          description="Comparez les performances de vos clips publiés, plateforme par plateforme."
        />
        <p className="mt-6 text-sm text-slate-500">
          Aucun clip publié pour l&apos;instant. Une fois un post publié
          (onglet Publication), ses statistiques apparaîtront ici — mises à
          jour automatiquement par le worker.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <PageHeader
        title="Analytics"
        description="Comparez les performances de vos clips publiés, plateforme par plateforme."
      />

      <section>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Par plateforme</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {[...platformGroups.entries()].map(([platform, stats]) => (
            <div key={platform} className="card p-6">
              <p className="font-medium text-slate-900">{PLATFORM_LABELS[platform] ?? platform}</p>
              <p className="mt-1 text-sm text-slate-500">{stats.count} post(s) publié(s)</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                {formatNumber(stats.totalViews)}
              </p>
              <p className="text-xs text-slate-400">vues cumulées</p>
              <p className="mt-3 text-sm text-slate-600">
                Engagement moyen :{" "}
                <span className="font-medium text-slate-900">
                  {stats.withEngagement > 0
                    ? formatPercent(stats.totalEngagement / stats.withEngagement)
                    : "—"}
                </span>
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Classement des clips</h2>
        <div className="card mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-100 text-xs font-medium uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Clip</th>
                <th className="px-4 py-3">Plateforme</th>
                <th className="px-4 py-3">Vues</th>
                <th className="px-4 py-3">Likes</th>
                <th className="px-4 py-3">Commentaires</th>
                <th className="px-4 py-3">Partages</th>
                <th className="px-4 py-3">Engagement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ranked.map((post) => (
                <tr key={post.id}>
                  <td className="max-w-xs truncate px-4 py-3 font-medium text-slate-900">{post.clip.title}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {PLATFORM_LABELS[post.platform] ?? post.platform}
                  </td>
                  <td className="px-4 py-3">{formatNumber(post.latest?.views)}</td>
                  <td className="px-4 py-3">{formatNumber(post.latest?.likes)}</td>
                  <td className="px-4 py-3">{formatNumber(post.latest?.comments)}</td>
                  <td className="px-4 py-3">{formatNumber(post.latest?.shares)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {formatPercent(post.latest?.engagementRate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Analyse des commentaires</h2>
        <div className="mt-3 space-y-4">
          {withMetrics
            .filter((post) => post.commentInsight)
            .map((post) => (
              <div key={post.id} className="card p-6">
                <p className="font-medium text-slate-900">{post.clip.title}</p>
                <p className="mt-1 text-sm text-slate-600">{post.commentInsight!.summary}</p>
                <div className="mt-2 flex gap-4 text-xs text-slate-500">
                  <span>👍 {post.commentInsight!.positiveCount}</span>
                  <span>👎 {post.commentInsight!.negativeCount}</span>
                  <span>😐 {post.commentInsight!.neutralCount}</span>
                </div>
                {post.commentInsight!.contentIdeas.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium uppercase text-slate-500">
                      Idées de futurs clips
                    </p>
                    <ul className="mt-1 list-inside list-disc text-sm text-slate-600">
                      {post.commentInsight!.contentIdeas.map((idea) => (
                        <li key={idea}>{idea}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          {withMetrics.every((post) => !post.commentInsight) && (
            <p className="text-sm text-slate-500">
              Pas encore d&apos;analyse de commentaires disponible — le worker
              l&apos;exécute automatiquement une fois par jour pour chaque post
              publié.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
