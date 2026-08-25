"use client";

import { useState } from "react";
import Image from "next/image";

type Channel = {
  id: string;
  title: string | null;
  thumbnailUrl: string | null;
  handle: string | null;
  channelId: string;
  monitoringEnabled: boolean;
  checkFrequencyMinutes: number;
  lastCheckedAt: string | null;
  errorMessage: string | null;
};

export function ChannelBoard({ initialChannels }: { initialChannels: Channel[] }) {
  const [channels, setChannels] = useState(initialChannels);
  const [input, setInput] = useState("");
  const [frequency, setFrequency] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addChannel(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, checkFrequencyMinutes: frequency }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erreur lors de l'ajout de la chaîne");
      return;
    }
    const data = await res.json();
    setChannels((prev) => [data.channel, ...prev]);
    setInput("");
  }

  async function toggleMonitoring(channel: Channel) {
    const res = await fetch(`/api/channels/${channel.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monitoringEnabled: !channel.monitoringEnabled }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setChannels((prev) => prev.map((c) => (c.id === channel.id ? data.channel : c)));
  }

  async function removeChannel(id: string) {
    setChannels((prev) => prev.filter((c) => c.id !== id));
    await fetch(`/api/channels/${id}`, { method: "DELETE" });
  }

  return (
    <div>
      <form onSubmit={addChannel} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row">
        <input
          required
          placeholder="Lien de la chaîne ou @handle"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2"
        />
        <select
          value={frequency}
          onChange={(e) => setFrequency(Number(e.target.value))}
          className="rounded-md border border-slate-300 px-3 py-2"
        >
          <option value={15}>Toutes les 15 min</option>
          <option value={30}>Toutes les 30 min</option>
          <option value={60}>Toutes les heures</option>
          <option value={360}>Toutes les 6h</option>
          <option value={1440}>Une fois par jour</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Ajout..." : "Connecter la chaîne"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <ul className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {channels.length === 0 && (
          <li className="p-4 text-sm text-slate-500">
            Aucune chaîne connectée. L&apos;agent surveillera automatiquement les
            chaînes ajoutées ici et générera des clips dès qu&apos;une nouvelle
            vidéo est publiée.
          </li>
        )}
        {channels.map((channel) => (
          <li key={channel.id} className="flex items-center gap-4 p-4">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-slate-100">
              {channel.thumbnailUrl && (
                <Image
                  src={channel.thumbnailUrl}
                  alt={channel.title ?? "Chaîne"}
                  fill
                  className="object-cover"
                  unoptimized
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{channel.title ?? channel.channelId}</p>
              <p className="truncate text-sm text-slate-500">
                Vérification toutes les {channel.checkFrequencyMinutes} min
                {channel.lastCheckedAt &&
                  ` · dernier contrôle ${new Date(channel.lastCheckedAt).toLocaleString("fr-FR")}`}
              </p>
              {channel.errorMessage && (
                <p className="truncate text-sm text-red-600">{channel.errorMessage}</p>
              )}
            </div>
            <button
              onClick={() => toggleMonitoring(channel)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                channel.monitoringEnabled
                  ? "bg-green-100 text-green-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {channel.monitoringEnabled ? "Surveillance active" : "En pause"}
            </button>
            <button
              onClick={() => removeChannel(channel.id)}
              className="text-sm text-slate-400 hover:text-red-600"
            >
              Retirer
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
