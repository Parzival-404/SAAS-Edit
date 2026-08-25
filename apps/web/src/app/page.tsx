import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-8 px-6 text-center">
      <span className="rounded-full bg-brand-100 px-4 py-1 text-sm font-medium text-brand-700">
        Agent IA de clipping vidéo
      </span>
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Transformez vos vidéos YouTube en clips courts qui performent.
      </h1>
      <p className="max-w-2xl text-lg text-slate-600">
        Collez un lien YouTube, l&apos;agent transcrit, repère les meilleurs
        moments, monte des clips verticaux avec sous-titres et hooks, prêts à
        télécharger.
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
    </main>
  );
}
