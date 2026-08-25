const YOUTUBE_ID_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export function extractYoutubeVideoId(url: string): string | null {
  const match = url.match(YOUTUBE_ID_REGEX);
  return match ? match[1] : null;
}

export type YoutubeOEmbedMetadata = {
  title: string;
  authorName: string;
  thumbnailUrl: string;
};

/**
 * Récupère les métadonnées basiques via l'endpoint public oEmbed de YouTube
 * (pas de clé API requise). Pour durée/vues/likes, brancher la YouTube Data
 * API v3 avec une clé API en phase 2 (voir README, roadmap).
 */
export async function fetchYoutubeOEmbed(
  url: string,
): Promise<YoutubeOEmbedMetadata | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      title: string;
      author_name: string;
      thumbnail_url: string;
    };
    return {
      title: data.title,
      authorName: data.author_name,
      thumbnailUrl: data.thumbnail_url,
    };
  } catch {
    return null;
  }
}
