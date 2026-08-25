import Link from "next/link";

const STEPS = [
  {
    title: "Collez un lien ou connectez une chaîne",
    description:
      "Mode manuel : collez le lien d'une vidéo YouTube. Mode automatique : connectez une chaîne, l'agent surveille et détecte chaque nouvelle publication.",
  },
  {
    title: "L'agent analyse et monte",
    description:
      "Transcription, détection des meilleurs moments, recadrage 9:16 en suivant le sujet principal, sous-titres et titre incrustés, hooks générés.",
  },
  {
    title: "Validez et publiez",
    description:
      "Prévisualisez, ajustez titre/hook parmi les variantes proposées, puis téléchargez ou programmez la publication sur TikTok, Reels et Shorts.",
  },
];

const FEATURES = [
  {
    title: "Détection des meilleurs moments",
    description:
      "L'IA repère les phrases fortes, moments drôles, choquants ou utiles qui fonctionnent même sans contexte.",
  },
  {
    title: "Recadrage intelligent",
    description:
      "Suivi du sujet principal (détection de visage) pour un format vertical qui garde toujours l'essentiel au centre.",
  },
  {
    title: "Sous-titres et hooks",
    description:
      "Sous-titres dynamiques incrustés, titre accrocheur, et plusieurs variantes de titre/hook à comparer avant de publier.",
  },
  {
    title: "Mode automatique",
    description:
      "Connectez une chaîne YouTube : chaque nouvelle vidéo est détectée et transformée en clips sans intervention.",
  },
  {
    title: "Base d'inspiration",
    description:
      "Ajoutez vos hooks, formats et références qui marchent — l'agent s'en inspire pour générer vos futurs clips.",
  },
  {
    title: "Publication multi-plateforme",
    description:
      "Programmez ou publiez sur TikTok, Instagram Reels et YouTube Shorts, avec validation manuelle ou automatique.",
  },
];

export default function LandingPage() {
  return (
    <div>
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold text-brand-700">SAAS-Edit</span>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/login" className="text-slate-600 hover:text-brand-600">
              Se connecter
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-brand-600 px-4 py-2 text-white shadow hover:bg-brand-700"
            >
              Créer un compte
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-6 py-20 text-center">
          <span className="rounded-full bg-brand-100 px-4 py-1 text-sm font-medium text-brand-700">
            Agent IA de clipping vidéo
          </span>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Transformez vos vidéos YouTube en clips courts qui performent.
          </h1>
          <p className="max-w-2xl text-lg text-slate-600">
            Collez un lien YouTube ou connectez votre chaîne : l&apos;agent
            transcrit, repère les meilleurs moments, monte des clips verticaux
            avec sous-titres et hooks, prêts à télécharger ou publier.
          </p>
          <div className="flex gap-4">
            <Link
              href="/register"
              className="rounded-lg bg-brand-600 px-6 py-3 font-medium text-white shadow hover:bg-brand-700"
            >
              Créer un compte
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 hover:bg-slate-100"
            >
              Se connecter
            </Link>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="text-center text-2xl font-bold">Comment ça marche</h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              {STEPS.map((step, index) => (
                <div key={step.title}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center text-2xl font-bold">Fonctionnalités</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-16 text-center">
            <h2 className="text-2xl font-bold">Prêt à essayer ?</h2>
            <p className="text-slate-600">
              Créez un compte et générez vos premiers clips en quelques minutes.
            </p>
            <Link
              href="/register"
              className="rounded-lg bg-brand-600 px-6 py-3 font-medium text-white shadow hover:bg-brand-700"
            >
              Créer un compte gratuitement
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-slate-500">
          SAAS-Edit
        </div>
      </footer>
    </div>
  );
}
