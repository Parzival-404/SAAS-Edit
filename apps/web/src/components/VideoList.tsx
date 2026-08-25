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
    <ul className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
      {videos.map((video) => (
        <li key={video.id} className="flex items-center gap-4 p-4">
          <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-md bg-slate-100">
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
            <p className="truncate font-medium">{video.title ?? video.youtubeUrl}</p>
            <p className="truncate text-sm text-slate-500">{video.youtubeUrl}</p>
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
