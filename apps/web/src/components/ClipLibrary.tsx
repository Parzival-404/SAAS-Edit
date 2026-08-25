"use client";

import { useState } from "react";

type Clip = {
  id: string;
  title: string;
  hook: string;
  description: string;
  hashtags: string[];
  status: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  durationSec: number;
  viralScore: number | null;
  sourceVideo: { title: string | null; youtubeUrl: string };
};

export function ClipLibrary({ initialClips }: { initialClips: Clip[] }) {
  const [clips, setClips] = useState(initialClips);
  const [editingId, setEditingId] = useState<string | null>(null);

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
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setEditingId(clip.id)}
                    className="text-sm font-medium text-brand-600 hover:underline"
                  >
                    Modifier
                  </button>
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
  const [description, setDescription] = useState(clip.description);
  const [hashtags, setHashtags] = useState(clip.hashtags.join(", "));

  return (
    <div className="space-y-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
      />
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
