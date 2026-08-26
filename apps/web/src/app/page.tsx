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
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-[15px] font-semibold tracking-tight text-slate-900">
            SAAS-Edit
          </span>
          <nav className="flex items-center gap-3 text-sm font-medium">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              Se connecter
            </Link>
            <Link href="/register" className="btn-primary !px-5 !py-2 text-sm">
              Créer un compte
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto flex max-w-4xl flex-col items-center gap-7 px-6 pb-24 pt-24 text-center sm:pb-32 sm:pt-32">
          <span className="badge border border-slate-200 bg-white text-slate-600 shadow-soft">
            Agent IA de clipping vidéo
          </span>
          <h1 className="text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
            Vos vidéos YouTube,
            <br />
            transformées en clips qui performent.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-slate-500">
            Collez un lien YouTube ou connectez votre chaîne : l&apos;agent
            transcrit, repère les meilleurs moments, monte des clips
            verticaux avec sous-titres et hooks, prêts à télécharger ou
            publier.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
            <Link href="/register" className="btn-primary">
              Créer un compte
            </Link>
            <Link href="/login" className="btn-secondary">
              Se connecter
            </Link>
          </div>
        </section>

        <section className="border-t border-slate-200/70 bg-[#f5f5f7]">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <h2 className="text-center text-3xl font-semibold tracking-tight text-slate-900">
              Comment ça marche
            </h2>
            <div className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
              {STEPS.map((step, index) => (
                <div key={step.title}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <h3 className="mt-5 font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-slate-500">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-center text-3xl font-semibold tracking-tight text-slate-900">
            Fonctionnalités
          </h2>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="card p-6 transition-shadow duration-300 hover:shadow-soft-lg"
              >
                <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-slate-200/70 bg-[#f5f5f7]">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 py-24 text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
              Prêt à essayer ?
            </h2>
            <p className="text-slate-500">
              Créez un compte et générez vos premiers clips en quelques
              minutes.
            </p>
            <Link href="/register" className="btn-primary">
              Créer un compte gratuitement
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/70 py-10">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-slate-400">
          SAAS-Edit
        </div>
      </footer>
    </div>
  );
}
