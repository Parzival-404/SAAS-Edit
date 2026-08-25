import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/db";
import { SettingsForm } from "@/components/SettingsForm";

export default async function SettingsPage() {
  const userId = await requireUserId();

  const settings =
    (await prisma.userSettings.findUnique({ where: { userId } })) ??
    (await prisma.userSettings.create({ data: { userId } }));

  return (
    <div>
      <h1 className="text-2xl font-bold">Paramètres</h1>
      <p className="mt-1 text-slate-600">
        Définissez comment l&apos;agent doit générer vos clips.
      </p>
      <div className="mt-6">
        <SettingsForm initialSettings={settings} />
      </div>
    </div>
  );
}
