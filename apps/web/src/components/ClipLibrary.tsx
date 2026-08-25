"use client";

import { useState } from "react";

type Clip = {
  id: string;
  title: string;
  hook: string;
  description: string;
  hashtags: string[];
  titleVariants: string[];
  hookVariants: string[];
  status: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  durationSec: number;
  viralScore: number | null;
  sourceVideo: { title: string | null; youtubeUrl: string };
};

type SocialAccount = {
  id: string;
  platform: string;
  displayName: string;
};

export function ClipLibrary({
  initialClips,
  socialAccounts,
}: {
  initialClips: Clip[];
  socialAccounts: SocialAccount[];
}) {
  const [clips, setClips] = useState(initialClips);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [schedulingId, setSchedulingId] = useState<string | null>(null);

  async function saveClip(id: string, fields: Partial<Clip>) {
    const res = await fetch(`/api/clips/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (!res.ok) return;
    const data = await res.json();
    setClips((prev) => prev.map((c) => (c.id === id ? { ...c, ...data.clip } : c)));
    setEditingId(null);
  }

  if (clips.length === 0) {
    return (
      <p className="mt-6 text-sm text-slate-500">
        Aucun clip généré pour l&apos;instant. Ajoutez une vidéo depuis
        l&apos;onglet Vidéos.
      </p>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {clips.map((clip) => (
        <div key={clip.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex aspect-[9/16] items-center justify-center bg-slate-900">
            {clip.videoUrl ? (
              <video src={clip.videoUrl} controls className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm text-slate-400">
                {clip.status === "RENDERING" ? "Montage en cours..." : "En attente"}
              </span>
            )}
          </div>
          <div className="space-y-2 p-4">
            {editingId === clip.id ? (
              <ClipEditForm clip={clip} onSave={(fields) => saveClip(clip.id, fields)} />
            ) : schedulingId === clip.id ? (
              <ScheduleForm
                clip={clip}
                socialAccounts={socialAccounts}
                onDone={() => setSchedulingId(null)}
              />
            ) : (
              <>
                <p className="font-semibold">{clip.title}</p>
                <p className="text-sm text-slate-600">{clip.hook}</p>
                <div className="flex flex-wrap gap-1">
                  {clip.hashtags.map((tag) => (
                    <span key={tag} className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">
                      #{tag}
                    </span>
                  ))}
                </div>
                {clip.viralScore != null && (
                  <p className="text-xs text-slate-500">
                    Potentiel viral estimé : {Math.round(clip.viralScore * 100)}%
                  </p>
                )}
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => setEditingId(clip.id)}
                    className="text-sm font-medium text-brand-600 hover:underline"
                  >
                    Modifier
                  </button>
                  {clip.status === "READY" && (
                    <button
                      onClick={() => setSchedulingId(clip.id)}
                      className="text-sm font-medium text-brand-600 hover:underline"
                    >
                      Programmer
                    </button>
                  )}
                  {clip.videoUrl && (
                    <a
                      href={clip.videoUrl}
                      download
                      className="text-sm font-medium text-slate-600 hover:underline"
                    >
                      Télécharger
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ClipEditForm({
  clip,
  onSave,
}: {
  clip: Clip;
  onSave: (fields: Partial<Clip>) => void;
}) {
  const [title, setTitle] = useState(clip.title);
  const [hook, setHook] = useState(clip.hook);
  const [description, setDescription] = useState(clip.description);
  const [hashtags, setHashtags] = useState(clip.hashtags.join(", "));

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-slate-500">Titre</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
      />
      <VariantChips variants={clip.titleVariants} current={title} onPick={setTitle} />

      <label className="block text-xs font-medium text-slate-500">Hook (3 premières secondes)</label>
      <input
        value={hook}
        onChange={(e) => setHook(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
      />
      <VariantChips variants={clip.hookVariants} current={hook} onPick={setHook} />

      <label className="block text-xs font-medium text-slate-500">Description</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
      />
      <input
        value={hashtags}
        onChange={(e) => setHashtags(e.target.value)}
        placeholder="hashtags séparés par des virgules"
        className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
      />
      <button
        onClick={() =>
          onSave({
            title,
            hook,
            description,
            hashtags: hashtags.split(",").map((t) => t.trim()).filter(Boolean),
          })
        }
        className="rounded-md bg-brand-600 px-3 py-1 text-sm font-medium text-white hover:bg-brand-700"
      >
        Enregistrer
      </button>
    </div>
  );
}

const PLATFORM_LABELS: Record<string, string> = {
  TIKTOK: "TikTok",
  INSTAGRAM_REELS: "Instagram Reels",
  YOUTUBE_SHORTS: "YouTube Shorts",
};

function ScheduleForm({
  clip,
  socialAccounts,
  onDone,
}: {
  clip: Clip;
  socialAccounts: SocialAccount[];
  onDone: () => void;
}) {
  const [socialAccountId, setSocialAccountId] = useState(socialAccounts[0]?.id ?? "");
  const [caption, setCaption] = useState(`${clip.description}\n\n${clip.hashtags.map((h) => `#${h}`).join(" ")}`);
  const [scheduledFor, setScheduledFor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (socialAccounts.length === 0) {
    return (
      <div className="space-y-2 text-sm">
        <p className="text-slate-600">
          Aucun compte social connecté. Rendez-vous dans l&apos;onglet{" "}
          <span className="font-medium">Publication</span> pour en connecter un.
        </p>
        <button onClick={onDone} className="text-brand-600 hover:underline">
          Retour
        </button>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clipId: clip.id,
        socialAccountId,
        caption,
        hashtags: clip.hashtags,
        scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : undefined,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erreur lors de la programmation");
      return;
    }
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <label className="block text-xs font-medium text-slate-500">Compte</label>
      <select
        value={socialAccountId}
        onChange={(e) => setSocialAccountId(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
      >
        {socialAccounts.map((account) => (
          <option key={account.id} value={account.id}>
            {PLATFORM_LABELS[account.platform] ?? account.platform} — {account.displayName}
          </option>
        ))}
      </select>

      <label className="block text-xs font-medium text-slate-500">Légende</label>
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        rows={3}
        className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
      />

      <label className="block text-xs font-medium text-slate-500">
        Programmer pour (optionnel — sinon publication dès validation)
      </label>
      <input
        type="datetime-local"
        value={scheduledFor}
        onChange={(e) => setScheduledFor(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-brand-600 px-3 py-1 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Enregistrement..." : "Programmer"}
        </button>
        <button type="button" onClick={onDone} className="text-sm text-slate-500 hover:underline">
          Annuler
        </button>
      </div>
    </form>
  );
}

function VariantChips({
  variants,
  current,
  onPick,
}: {
  variants: string[];
  current: string;
  onPick: (value: string) => void;
}) {
  const alternatives = variants.filter((v) => v !== current);
  if (alternatives.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {alternatives.map((variant) => (
        <button
          key={variant}
          type="button"
          onClick={() => onPick(variant)}
          title="Utiliser cette variante"
          className="max-w-full truncate rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
        >
          {variant}
        </button>
      ))}
    </div>
  );
}
