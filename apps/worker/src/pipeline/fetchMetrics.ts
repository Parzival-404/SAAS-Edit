import type { ScheduledPost, SocialAccount } from "@saas-edit/db";
import { safeText } from "../lib/httpUtils.js";

export class FetchMetricsError extends Error {}

export type PlatformMetrics = {
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
};

/**
 * Récupère les métriques actuelles (vues, likes, commentaires, partages)
 * d'un post publié, directement depuis l'API officielle de la plateforme.
 */
export async function fetchMetrics(
  post: ScheduledPost,
  socialAccount: SocialAccount,
  accessToken: string,
): Promise<PlatformMetrics> {
  if (!post.platformPostId) {
    throw new FetchMetricsError("platformPostId manquant — le post n'a pas encore été publié");
  }

  switch (post.platform) {
    case "YOUTUBE_SHORTS":
      return fetchYoutubeMetrics(post.platformPostId, accessToken);
    case "TIKTOK":
      return fetchTikTokMetrics(post.platformPostId, accessToken);
    case "INSTAGRAM_REELS":
      return fetchInstagramMetrics(post.platformPostId, accessToken);
    default:
      throw new FetchMetricsError(`Plateforme non gérée: ${post.platform}`);
  }
}

/** YouTube Data API v3 — videos.list?part=statistics */
async function fetchYoutubeMetrics(videoId: string, accessToken: string): Promise<PlatformMetrics> {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${encodeURIComponent(videoId)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) {
    throw new FetchMetricsError(`Échec de la récupération des stats YouTube (${res.status}): ${await safeText(res)}`);
  }
  const data = (await res.json()) as {
    items?: { statistics?: { viewCount?: string; likeCount?: string; commentCount?: string } }[];
  };
  const stats = data.items?.[0]?.statistics;
  if (!stats) {
    throw new FetchMetricsError("YouTube n'a renvoyé aucune statistique pour cette vidéo");
  }
  return {
    views: stats.viewCount ? Number(stats.viewCount) : null,
    likes: stats.likeCount ? Number(stats.likeCount) : null,
    comments: stats.commentCount ? Number(stats.commentCount) : null,
    // YouTube Data API n'expose pas de compteur de partages.
    shares: null,
  };
}

/** TikTok Content Posting API v2 — Query Video List (POST /v2/video/query/) */
async function fetchTikTokMetrics(videoId: string, accessToken: string): Promise<PlatformMetrics> {
  const res = await fetch(
    "https://open.tiktokapis.com/v2/video/query/?fields=id,like_count,comment_count,share_count,view_count",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({ filters: { video_ids: [videoId] } }),
    },
  );
  if (!res.ok) {
    throw new FetchMetricsError(`Échec de la récupération des stats TikTok (${res.status}): ${await safeText(res)}`);
  }
  const data = (await res.json()) as {
    data?: {
      videos?: {
        id: string;
        like_count?: number;
        comment_count?: number;
        share_count?: number;
        view_count?: number;
      }[];
    };
  };
  const video = data.data?.videos?.find((v) => v.id === videoId) ?? data.data?.videos?.[0];
  if (!video) {
    throw new FetchMetricsError("TikTok n'a renvoyé aucune vidéo pour cet id");
  }
  return {
    views: video.view_count ?? null,
    likes: video.like_count ?? null,
    comments: video.comment_count ?? null,
    shares: video.share_count ?? null,
  };
}

/** Instagram Graph API — {media-id}/insights */
async function fetchInstagramMetrics(mediaId: string, accessToken: string): Promise<PlatformMetrics> {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${mediaId}/insights?` +
      new URLSearchParams({ metric: "likes,comments,shares,plays,saved", access_token: accessToken }),
  );
  if (!res.ok) {
    throw new FetchMetricsError(`Échec de la récupération des stats Instagram (${res.status}): ${await safeText(res)}`);
  }
  const data = (await res.json()) as {
    data?: { name: string; values: { value: number }[] }[];
  };
  const metricValue = (name: string): number | null => {
    const entry = data.data?.find((m) => m.name === name);
    return entry?.values?.[0]?.value ?? null;
  };
  return {
    views: metricValue("plays"),
    likes: metricValue("likes"),
    comments: metricValue("comments"),
    shares: metricValue("shares"),
  };
}
