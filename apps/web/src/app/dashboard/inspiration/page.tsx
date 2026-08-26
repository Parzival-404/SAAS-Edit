import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/db";
import { InspirationBoard } from "@/components/InspirationBoard";
import { PageHeader } from "@/components/PageHeader";

export default async function InspirationPage() {
  const userId = await requireUserId();

  const items = await prisma.inspirationItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Base d'inspiration"
        description="Ajoutez des hooks, titres, formats et références qui marchent. L'agent s'en inspire pour générer vos futurs clips."
      />
      <div className="mt-6">
        <InspirationBoard initialItems={items} />
      </div>
    </div>
  );
}
