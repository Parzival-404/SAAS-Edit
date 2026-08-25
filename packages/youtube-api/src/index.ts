const API_BASE = "https://www.googleapis.com/youtube/v3";

export class YoutubeApiError extends Error {}

export type ResolvedChannel = {
  channelId: string;
  title: string;
  thumbnailUrl: string | null;
  handle: string | null;
};

export type ChannelUploadVideo = {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  publishedAt: string;
};

/**
 * Accepte une URL de chaîne (youtube.com/@handle, /channel/UCxxxx, /c/nom,
 * /user/nom) ou directement un handle/ID, et résout les infos de la chaîne
 * via la YouTube Data API v3. Nécessite une clé API (lecture publique
 * uniquement, pas d'OAuth requis pour surveiller une chaîne publique).
 */
export async function resolveChannel(
  input: string,
  apiKey: string,
): Promise<ResolvedChannel> {
  const trimmed = input.trim();
  const channelIdMatch = trimmed.match(/(?:channel\/)?(UC[a-zA-Z0-9_-]{22})/);
  const handleMatch = trimmed.match(/(?:youtube\.com\/)?@([a-zA-Z0-9_.-]+)/);

  let data: YoutubeChannelListResponse;

  if (channelIdMatch) {
    data = await getJson<YoutubeChannelListResponse>(
      `${API_BASE}/channels?part=snippet&id=${channelIdMatch[1]}&key=${apiKey}`,
    );
  } else {
    const handle = handleMatch ? handleMatch[1] : trimmed.replace(/^@/, "");
    data = await getJson<YoutubeChannelListResponse>(
      `${API_BASE}/channels?part=snippet&forHandle=${encodeURIComponent(handle)}&key=${apiKey}`,
    );
  }

  const channel = data.items?.[0];
  if (!channel) {
    throw new YoutubeApiError(
      "Chaîne YouTube introuvable. Vérifiez le lien ou le handle (@nom).",
    );
  }

  return {
    channelId: channel.id,
    title: channel.snippet.title,
    thumbnailUrl: channel.snippet.thumbnails?.default?.url ?? null,
    handle: channel.snippet.customUrl ?? null,
  };
}

/**
 * Récupère les vidéos les plus récentes de la playlist "uploads" d'une
 * chaîne, en s'arrêtant dès qu'une vidéo déjà vue (publishedAfter) est
 * atteinte.
 */
export async function listRecentUploads(
  channelId: string,
  apiKey: string,
  publishedAfter?: Date,
  maxResults = 10,
): Promise<ChannelUploadVideo[]> {
  const channelData = await getJson<YoutubeChannelListResponse>(
    `${API_BASE}/channels?part=contentDetails&id=${channelId}&key=${apiKey}`,
  );
  const uploadsPlaylistId =
    channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) {
    throw new YoutubeApiError(`Chaîne introuvable ou sans playlist uploads: ${channelId}`);
  }

  const playlistData = await getJson<YoutubePlaylistItemsResponse>(
    `${API_BASE}/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${apiKey}`,
  );

  const videos: ChannelUploadVideo[] = (playlistData.items ?? []).map((item) => ({
    videoId: item.snippet.resourceId.videoId,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnailUrl: item.snippet.thumbnails?.medium?.url ?? item.snippet.thumbnails?.default?.url ?? null,
    publishedAt: item.snippet.publishedAt,
  }));

  if (!publishedAfter) return videos;
  return videos.filter((v) => new Date(v.publishedAt) > publishedAfter);
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new YoutubeApiError(`Erreur YouTube Data API (${res.status}): ${extractErrorMessage(body)}`);
  }
  return (await res.json()) as T;
}

function extractErrorMessage(rawBody: string): string {
  try {
    const parsed = JSON.parse(rawBody) as { error?: { message?: string } };
    return parsed.error?.message ?? rawBody;
  } catch {
    return rawBody;
  }
}

type YoutubeChannelListResponse = {
  items?: {
    id: string;
    snippet: {
      title: string;
      customUrl?: string;
      thumbnails?: { default?: { url: string } };
    };
    contentDetails?: {
      relatedPlaylists?: { uploads?: string };
    };
  }[];
};

type YoutubePlaylistItemsResponse = {
  items?: {
    snippet: {
      title: string;
      description: string;
      publishedAt: string;
      resourceId: { videoId: string };
      thumbnails?: { default?: { url: string }; medium?: { url: string } };
    };
  }[];
};
