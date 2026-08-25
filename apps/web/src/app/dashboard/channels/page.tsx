import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/db";
import { ChannelBoard } from "@/components/ChannelBoard";

export default async function ChannelsPage() {
  const userId = await requireUserId();

  const channels = await prisma.youtubeChannel.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Chaînes YouTube</h1>
      <p className="mt-1 text-slate-600">
        Connectez une chaîne pour que l&apos;agent détecte automatiquement les
        nouvelles vidéos et génère des clips sans intervention.
      </p>
      <div className="mt-6">
        <ChannelBoard
          initialChannels={channels.map((c) => ({
            ...c,
            lastCheckedAt: c.lastCheckedAt?.toISOString() ?? null,
          }))}
        />
      </div>
    </div>
  );
}
