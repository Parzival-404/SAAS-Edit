import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/db";
import { SocialAccountBoard } from "@/components/SocialAccountBoard";
import { ScheduledPostBoard } from "@/components/ScheduledPostBoard";

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
      <div>
        <h1 className="text-2xl font-bold">Publication</h1>
        <p className="mt-1 text-slate-600">
          Connectez vos comptes TikTok, Instagram Reels et YouTube Shorts, puis
          programmez ou publiez vos clips.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold">Comptes connectés</h2>
        <div className="mt-3">
          <SocialAccountBoard initialAccounts={accounts} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Publications</h2>
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
