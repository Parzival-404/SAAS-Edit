import type { ScheduledPost, SocialAccount } from "@saas-edit/db";
import { safeText } from "../lib/httpUtils.js";
import { config } from "../config.js";

export class FetchCommentsError extends Error {}

/**
 * Récupère les commentaires (texte brut) d'un post publié, pour analyse
 * par le LLM. Ne lève une erreur que sur un vrai échec d'appel API —
 * "aucun commentaire" est un résultat valide (tableau vide).
 */
export async function fetchComments(
  post: ScheduledPost,
  socialAccount: SocialAccount,
  accessToken: string,
): Promise<string[]> {
  if (!post.platformPostId) {
    throw new FetchCommentsError("platformPostId manquant — le post n'a pas encore été publié");
  }

  switch (post.platform) {
    case "YOUTUBE_SHORTS":
      return fetchYoutubeComments(post.platformPostId, accessToken);
    case "INSTAGRAM_REELS":
      return fetchInstagramComments(post.platformPostId, accessToken);
    case "TIKTOK":
      // TikTok ne propose pas d'endpoint de lecture des commentaires
      // stable/documenté dans l'API grand public (Content Posting API v2)
      // au moment de l'écriture de ce code — seules les statistiques
      // agrégées (fetchMetrics.ts) sont disponibles. À réévaluer contre
      // la documentation TikTok à jour avant d'activer un vrai fetch ici.
      return [];
    default:
      throw new FetchCommentsError(`Plateforme non gérée: ${post.platform}`);
  }
}

/** YouTube Data API v3 — commentThreads.list */
async function fetchYoutubeComments(videoId: string, accessToken: string): Promise<string[]> {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/commentThreads?` +
      new URLSearchParams({
        part: "snippet",
        videoId,
        maxResults: String(Math.min(config.commentAnalysisMaxComments, 100)),
        order: "relevance",
        textFormat: "plainText",
      }),
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) {
    // Les commentaires peuvent être désactivés sur la vidéo (403) — ce
    // n'est pas une erreur d'intégration, juste "rien à analyser".
    if (res.status === 403) return [];
    throw new FetchCommentsError(`Échec de la récupération des commentaires YouTube (${res.status}): ${await safeText(res)}`);
  }
  const data = (await res.json()) as {
    items?: { snippet: { topLevelComment: { snippet: { textDisplay: string } } } }[];
  };
  return (data.items ?? []).map((item) => item.snippet.topLevelComment.snippet.textDisplay);
}

/** Instagram Graph API — {media-id}/comments */
async function fetchInstagramComments(mediaId: string, accessToken: string): Promise<string[]> {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${mediaId}/comments?` +
      new URLSearchParams({
        fields: "text",
        limit: String(config.commentAnalysisMaxComments),
        access_token: accessToken,
      }),
  );
  if (!res.ok) {
    throw new FetchCommentsError(`Échec de la récupération des commentaires Instagram (${res.status}): ${await safeText(res)}`);
  }
  const data = (await res.json()) as { data?: { text: string }[] };
  return (data.data ?? []).map((c) => c.text);
}
