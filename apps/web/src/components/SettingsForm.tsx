"use client";

import { useState } from "react";

type Settings = {
  minClipsPerVideo: number;
  maxClipsPerVideo: number;
  targetClipDurationS: number;
  tone: string;
  subtitleLanguage: string;
};

const TONE_LABELS: Record<string, string> = {
  FUNNY: "Drôle",
  PROFESSIONAL: "Professionnel",
  VIRAL: "Viral",
  DRAMA: "Drama",
  EDUCATIONAL: "Éducatif",
};

export function SettingsForm({ initialSettings }: { initialSettings: Settings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setLoading(false);
    if (res.ok) setSaved(true);
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-5 rounded-lg border border-slate-200 bg-white p-6">
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Clips minimum par vidéo
          <input
            type="number"
            min={1}
            max={20}
            value={settings.minClipsPerVideo}
            onChange={(e) =>
              setSettings((s) => ({ ...s, minClipsPerVideo: Number(e.target.value) }))
            }
            className="rounded-md border border-slate-300 px-3 py-2 font-normal"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Clips maximum par vidéo
          <input
            type="number"
            min={1}
            max={20}
            value={settings.maxClipsPerVideo}
            onChange={(e) =>
              setSettings((s) => ({ ...s, maxClipsPerVideo: Number(e.target.value) }))
            }
            className="rounded-md border border-slate-300 px-3 py-2 font-normal"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Durée cible des clips (secondes)
        <input
          type="number"
          min={10}
          max={180}
          value={settings.targetClipDurationS}
          onChange={(e) =>
            setSettings((s) => ({ ...s, targetClipDurationS: Number(e.target.value) }))
          }
          className="rounded-md border border-slate-300 px-3 py-2 font-normal"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Ton souhaité
        <select
          value={settings.tone}
          onChange={(e) => setSettings((s) => ({ ...s, tone: e.target.value }))}
          className="rounded-md border border-slate-300 px-3 py-2 font-normal"
        >
          {Object.entries(TONE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Langue des sous-titres
        <input
          value={settings.subtitleLanguage}
          onChange={(e) =>
            setSettings((s) => ({ ...s, subtitleLanguage: e.target.value }))
          }
          className="rounded-md border border-slate-300 px-3 py-2 font-normal"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? "Enregistrement..." : "Enregistrer"}
      </button>
      {saved && <p className="text-sm text-green-600">Paramètres enregistrés.</p>}
    </form>
  );
}
