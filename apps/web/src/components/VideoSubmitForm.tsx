"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function VideoSubmitForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ youtubeUrl: url }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erreur lors de l'ajout de la vidéo");
      return;
    }

    setUrl("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
      <input
        type="url"
        required
        placeholder="https://www.youtube.com/watch?v=..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="flex-1 rounded-lg border border-slate-300 px-4 py-3"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-brand-600 px-6 py-3 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? "Ajout..." : "Générer des clips"}
      </button>
      {error && <p className="text-sm text-red-600 sm:ml-4 sm:self-center">{error}</p>}
    </form>
  );
}
