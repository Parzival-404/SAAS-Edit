import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/db";
import { InspirationBoard } from "@/components/InspirationBoard";

export default async function InspirationPage() {
  const userId = await requireUserId();

  const items = await prisma.inspirationItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Base d&apos;inspiration</h1>
      <p className="mt-1 text-slate-600">
        Ajoutez des hooks, titres, formats et références qui marchent. L&apos;agent
        s&apos;en inspire pour générer vos futurs clips.
      </p>
      <div className="mt-6">
        <InspirationBoard initialItems={items} />
      </div>
    </div>
  );
}
