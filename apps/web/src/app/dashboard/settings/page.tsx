import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/db";
import { SettingsForm } from "@/components/SettingsForm";
import { PageHeader } from "@/components/PageHeader";

export default async function SettingsPage() {
  const userId = await requireUserId();

  const settings =
    (await prisma.userSettings.findUnique({ where: { userId } })) ??
    (await prisma.userSettings.create({ data: { userId } }));

  return (
    <div>
      <PageHeader title="Paramètres" description="Définissez comment l'agent doit générer vos clips." />
      <div className="mt-6">
        <SettingsForm initialSettings={settings} />
      </div>
    </div>
  );
}
