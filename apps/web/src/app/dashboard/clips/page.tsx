import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/db";
import { ClipLibrary } from "@/components/ClipLibrary";

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
      <h1 className="text-2xl font-bold">Bibliothèque de clips</h1>
      <p className="mt-1 text-slate-600">
        Prévisualisez, modifiez le titre/description/hashtags, téléchargez ou
        programmez vos clips.
      </p>
      <ClipLibrary initialClips={clips} socialAccounts={socialAccounts} />
    </div>
  );
}
