"use client";

import { useState } from "react";

type SocialAccount = {
  id: string;
  platform: string;
  displayName: string;
  status: string;
  errorMessage: string | null;
};

const PLATFORM_LABELS: Record<string, string> = {
  TIKTOK: "TikTok",
  INSTAGRAM_REELS: "Instagram Reels",
  YOUTUBE_SHORTS: "YouTube Shorts",
};

export function SocialAccountBoard({
  initialAccounts,
}: {
  initialAccounts: SocialAccount[];
}) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [platform, setPlatform] = useState("TIKTOK");
  const [displayName, setDisplayName] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/social-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, displayName, accessToken }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erreur lors de la connexion du compte");
      return;
    }
    const data = await res.json();
    setAccounts((prev) => [data.account, ...prev.filter((a) => a.platform !== platform)]);
    setDisplayName("");
    setAccessToken("");
  }

  async function disconnect(id: string) {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    await fetch(`/api/social-accounts/${id}`, { method: "DELETE" });
  }

  return (
    <div>
      <form onSubmit={connect} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 sm:col-span-2"
        >
          {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          required
          placeholder="Nom / @handle du compte"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 sm:col-span-2"
        />
        <input
          required
          type="password"
          placeholder="Token d'accès API de la plateforme"
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 sm:col-span-2"
        />
        <p className="text-xs text-slate-500 sm:col-span-2">
          Nécessite un token obtenu via votre propre application développeur sur la
          plateforme (TikTok for Developers, Meta for Developers, Google Cloud Console).
          Chiffré avant stockage, jamais renvoyé en clair.
        </p>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50 sm:col-span-2 sm:w-fit"
        >
          {loading ? "Connexion..." : "Connecter le compte"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <ul className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {accounts.length === 0 && (
          <li className="p-4 text-sm text-slate-500">Aucun compte social connecté.</li>
        )}
        {accounts.map((account) => (
          <li key={account.id} className="flex items-center gap-4 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {PLATFORM_LABELS[account.platform] ?? account.platform} — {account.displayName}
              </p>
              {account.errorMessage && (
                <p className="text-sm text-red-600">{account.errorMessage}</p>
              )}
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                account.status === "CONNECTED"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {account.status === "CONNECTED" ? "Connecté" : account.status}
            </span>
            <button
              onClick={() => disconnect(account.id)}
              className="text-sm text-slate-400 hover:text-red-600"
            >
              Déconnecter
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
