"use client";

import { useState } from "react";

type Post = {
  id: string;
  platform: string;
  status: string;
  caption: string;
  scheduledFor: string | null;
  publishedAt: string | null;
  platformPostUrl: string | null;
  errorMessage: string | null;
  clip: { title: string | null; thumbnailUrl: string | null };
  socialAccount: { displayName: string; platform: string };
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  SCHEDULED: "Programmé",
  PUBLISHING: "Publication en cours",
  PUBLISHED: "Publié",
  FAILED: "Échec",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SCHEDULED: "bg-blue-100 text-blue-700",
  PUBLISHING: "bg-amber-100 text-amber-700",
  PUBLISHED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};

export function ScheduledPostBoard({ initialPosts }: { initialPosts: Post[] }) {
  const [posts, setPosts] = useState(initialPosts);

  async function validate(id: string) {
    const res = await fetch(`/api/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "SCHEDULED" }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...data.post } : p)));
  }

  async function cancel(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
  }

  if (posts.length === 0) {
    return (
      <p className="mt-6 text-sm text-slate-500">
        Aucune publication programmée. Depuis la bibliothèque de clips, cliquez sur
        &quot;Programmer&quot; sur un clip prêt.
      </p>
    );
  }

  return (
    <ul className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
      {posts.map((post) => (
        <li key={post.id} className="flex items-center gap-4 p-4">
          <div className="h-16 w-10 shrink-0 overflow-hidden rounded-md bg-slate-900">
            {post.clip.thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.clip.thumbnailUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{post.clip.title ?? "Clip"}</p>
            <p className="truncate text-sm text-slate-500">
              {post.socialAccount.displayName}
              {post.scheduledFor &&
                ` · programmé pour le ${new Date(post.scheduledFor).toLocaleString("fr-FR")}`}
            </p>
            {post.errorMessage && (
              <p className="truncate text-sm text-red-600">{post.errorMessage}</p>
            )}
            {post.platformPostUrl && (
              <a
                href={post.platformPostUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-brand-600 hover:underline"
              >
                Voir le post publié
              </a>
            )}
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[post.status] ?? ""}`}>
            {STATUS_LABELS[post.status] ?? post.status}
          </span>
          {post.status === "DRAFT" && (
            <button
              onClick={() => validate(post.id)}
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              Valider
            </button>
          )}
          {(post.status === "DRAFT" || post.status === "SCHEDULED") && (
            <button
              onClick={() => cancel(post.id)}
              className="text-sm text-slate-400 hover:text-red-600"
            >
              Annuler
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
