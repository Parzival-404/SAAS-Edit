"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { StatusBadge } from "@/components/StatusBadge";

type VideoListItem = {
  id: string;
  title: string | null;
  thumbnailUrl: string | null;
  youtubeUrl: string;
  status: string;
  errorMessage: string | null;
  source: string;
  createdAt: string;
  clips: { id: string }[];
};

const TERMINAL_STATUSES = new Set(["READY", "FAILED"]);

export function VideoList({ initialVideos }: { initialVideos: VideoListItem[] }) {
  const [videos, setVideos] = useState(initialVideos);

  useEffect(() => {
    const stillProcessing = videos.some((v) => !TERMINAL_STATUSES.has(v.status));
    if (!stillProcessing) return;

    const interval = setInterval(async () => {
      const res = await fetch("/api/videos");
      if (!res.ok) return;
      const data = await res.json();
      setVideos(data.videos);
    }, 4000);

    return () => clearInterval(interval);
  }, [videos]);

  if (videos.length === 0) {
    return (
      <p className="mt-6 text-sm text-slate-500">
        Aucune vidéo pour l&apos;instant. Collez un lien YouTube ci-dessus pour
        démarrer.
      </p>
    );
  }


  return (
    <ul className="card mt-6 divide-y divide-slate-100">
      {videos.map((video) => (
        <li key={video.id} className="flex items-center gap-4 p-4 first:rounded-t-2xl last:rounded-b-2xl">
          <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100">
            {video.thumbnailUrl && (
              <Image
                src={video.thumbnailUrl}
                alt={video.title ?? "Miniature"}
                fill
                className="object-cover"
                unoptimized
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-medium text-slate-900">{video.title ?? video.youtubeUrl}</p>
              {video.source === "CHANNEL_MONITOR" && (
                <span className="badge shrink-0 bg-brand-50 text-brand-600">Auto</span>
              )}
            </div>
            <p className="truncate text-sm text-slate-400">{video.youtubeUrl}</p>
            {video.status === "FAILED" && video.errorMessage && (
              <p className="truncate text-sm text-red-600" title={video.errorMessage}>
                {video.errorMessage}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {video.clips.length > 0 && (
              <span className="text-sm text-slate-500">
                {video.clips.length} clip{video.clips.length > 1 ? "s" : ""}
              </span>
            )}
            <StatusBadge status={video.status} />
          </div>
        </li>
      ))}
    </ul>
  );
}
