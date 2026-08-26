import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/db";
import { SocialAccountBoard } from "@/components/SocialAccountBoard";
import { ScheduledPostBoard } from "@/components/ScheduledPostBoard";
import { PageHeader } from "@/components/PageHeader";

export default async function PublishingPage() {
  const userId = await requireUserId();

  const [accounts, posts] = await Promise.all([
    prisma.socialAccount.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, platform: true, displayName: true, status: true, errorMessage: true },
    }),
    prisma.scheduledPost.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        clip: { select: { title: true, thumbnailUrl: true } },
        socialAccount: { select: { displayName: true, platform: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Publication"
        description="Connectez vos comptes TikTok, Instagram Reels et YouTube Shorts, puis programmez ou publiez vos clips."
      />

      <section>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Comptes connectés</h2>
        <div className="mt-3">
          <SocialAccountBoard initialAccounts={accounts} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Publications</h2>
        <ScheduledPostBoard
          initialPosts={posts.map((p) => ({
            ...p,
            scheduledFor: p.scheduledFor?.toISOString() ?? null,
            publishedAt: p.publishedAt?.toISOString() ?? null,
          }))}
        />
      </section>
    </div>
  );
}
