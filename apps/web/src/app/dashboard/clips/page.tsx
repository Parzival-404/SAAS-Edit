import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/db";
import { ClipLibrary } from "@/components/ClipLibrary";
import { PageHeader } from "@/components/PageHeader";

export default async function ClipsPage() {
  const userId = await requireUserId();

  const [clips, socialAccounts] = await Promise.all([
    prisma.clip.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { sourceVideo: { select: { title: true, youtubeUrl: true } } },
    }),
    prisma.socialAccount.findMany({
      where: { userId, status: "CONNECTED" },
      select: { id: true, platform: true, displayName: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Bibliothèque de clips"
        description="Prévisualisez, modifiez le titre/description/hashtags, téléchargez ou programmez vos clips."
      />
      <ClipLibrary initialClips={clips} socialAccounts={socialAccounts} />
    </div>
  );
}
