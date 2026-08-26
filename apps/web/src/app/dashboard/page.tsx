import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/db";
import { VideoSubmitForm } from "@/components/VideoSubmitForm";
import { VideoList } from "@/components/VideoList";
import { PageHeader } from "@/components/PageHeader";

export default async function DashboardPage() {
  const userId = await requireUserId();

  const videos = await prisma.sourceVideo.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { clips: { select: { id: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Vos vidéos"
        description="Collez le lien d'une vidéo YouTube pour générer automatiquement des clips courts."
      />
      <div className="mt-6">
        <VideoSubmitForm />
      </div>
      <VideoList
        initialVideos={videos.map((v) => ({
          ...v,
          createdAt: v.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
