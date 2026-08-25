import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/db";
import { VideoSubmitForm } from "@/components/VideoSubmitForm";
import { VideoList } from "@/components/VideoList";

export default async function DashboardPage() {
  const userId = await requireUserId();

  const videos = await prisma.sourceVideo.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { clips: { select: { id: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Vos vidéos</h1>
      <p className="mt-1 text-slate-600">
        Collez le lien d&apos;une vidéo YouTube pour générer automatiquement des
        clips courts.
      </p>
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
