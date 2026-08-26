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
    <form onSubmit={onSubmit} className="card flex flex-col gap-3 p-2 sm:flex-row sm:p-2">
      <input
        type="url"
        required
        placeholder="https://www.youtube.com/watch?v=..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="input flex-1 border-0 shadow-none focus:ring-0"
      />
      <button
        type="submit"
        disabled={loading}
        className="btn-primary shrink-0 disabled:opacity-50"
      >
        {loading ? "Ajout..." : "Générer des clips"}
      </button>
      {error && <p className="text-sm text-red-600 sm:ml-2 sm:self-center">{error}</p>}
    </form>
  );
}
