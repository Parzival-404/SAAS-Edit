import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/db";
import { ChannelBoard } from "@/components/ChannelBoard";
import { PageHeader } from "@/components/PageHeader";

export default async function ChannelsPage() {
  const userId = await requireUserId();

  const channels = await prisma.youtubeChannel.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Chaînes YouTube"
        description="Connectez une chaîne pour que l'agent détecte automatiquement les nouvelles vidéos et génère des clips sans intervention."
      />
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
