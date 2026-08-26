import type { Clip, ScheduledPost, SocialAccount } from "@saas-edit/db";
import { safeText } from "../lib/httpUtils.js";

export class PublishError extends Error {}

export type PublishResult = {
  platformPostId: string;
  platformPostUrl: string | null;
};

/**
 * Publie un clip sur la plateforme du compte social associé. Chaque
 * adaptateur appelle l'API officielle correspondante avec le token
 * d'accès déchiffré de l'utilisateur — nécessite que ce compte ait été
 * connecté avec un token valide (obtenu via l'app développeur de
 * l'utilisateur/opérateur sur la plateforme concernée).
 */
export async function publishToPlaform(
  post: ScheduledPost,
  clip: Clip,
  socialAccount: SocialAccount,
  accessToken: string,
): Promise<PublishResult> {
  if (!clip.videoUrl) {
    throw new PublishError("Le clip n'a pas de vidéo exportée (videoUrl manquant)");
  }

  switch (post.platform) {
    case "YOUTUBE_SHORTS":
      return publishToYoutubeShorts(post, clip, accessToken);
    case "TIKTOK":
      return publishToTikTok(post, clip, accessToken);
    case "INSTAGRAM_REELS":
      return publishToInstagramReels(post, clip, socialAccount, accessToken);
    default:
      throw new PublishError(`Plateforme non gérée: ${post.platform}`);
  }
}

/**
 * YouTube Data API v3 — upload resumable (videos.insert).
 * https://developers.google.com/youtube/v3/guides/uploading_a_video
 */
async function publishToYoutubeShorts(
  post: ScheduledPost,
  clip: Clip,
  accessToken: string,
): Promise<PublishResult> {
  const videoRes = await fetch(clip.videoUrl!);
  if (!videoRes.ok || !videoRes.body) {
    throw new PublishError(`Impossible de récupérer le fichier vidéo du clip (${videoRes.status})`);
  }
  const videoBytes = await videoRes.arrayBuffer();

  const initRes = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": "video/mp4",
        "X-Upload-Content-Length": String(videoBytes.byteLength),
      },
      body: JSON.stringify({
        snippet: {
          title: clip.title.slice(0, 100),
          description: post.caption,
          tags: post.hashtags,
        },
        status: { privacyStatus: "public", selfDeclaredMadeForKids: false },
      }),
    },
  );
  if (!initRes.ok) {
    throw new PublishError(`Échec de l'initialisation de l'upload YouTube (${initRes.status}): ${await safeText(initRes)}`);
  }
  const uploadUrl = initRes.headers.get("location");
  if (!uploadUrl) {
    throw new PublishError("YouTube n'a pas renvoyé d'URL d'upload resumable");
  }

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4", "Content-Length": String(videoBytes.byteLength) },
    body: videoBytes,
  });
  if (!uploadRes.ok) {
    throw new PublishError(`Échec de l'upload vidéo YouTube (${uploadRes.status}): ${await safeText(uploadRes)}`);
  }

  const data = (await uploadRes.json()) as { id: string };
  return {
    platformPostId: data.id,
    platformPostUrl: `https://www.youtube.com/shorts/${data.id}`,
  };
}

/**
 * TikTok Content Posting API v2 — publication directe depuis une URL
 * publique (PULL_FROM_URL). Le domaine hébergeant videoUrl doit être
 * vérifié dans le TikTok Developer Portal de l'application utilisée.
 * https://developers.tiktok.com/doc/content-posting-api-reference-direct-post
 */
async function publishToTikTok(
  post: ScheduledPost,
  clip: Clip,
  accessToken: string,
): Promise<PublishResult> {
  const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      post_info: {
        title: post.caption,
        privacy_level: "PUBLIC_TO_EVERYONE",
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
      },
      source_info: {
        source: "PULL_FROM_URL",
        video_url: clip.videoUrl,
      },
    }),
  });
  if (!initRes.ok) {
    throw new PublishError(`Échec de la publication TikTok (${initRes.status}): ${await safeText(initRes)}`);
  }
  const data = (await initRes.json()) as { data?: { publish_id?: string } };
  const publishId = data.data?.publish_id;
  if (!publishId) {
    throw new PublishError("TikTok n'a pas renvoyé de publish_id");
  }

  // TikTok traite la publication de façon asynchrone : publish_id sert à
  // interroger /post/publish/status/fetch/ pour connaître le résultat
  // final et récupérer l'URL publique une fois publié.
  return { platformPostId: publishId, platformPostUrl: null };
}

/**
 * Instagram Graph API — Reels via Content Publishing (conteneur média
 * puis publication). Nécessite l'ID du compte Instagram Business/Creator
 * (SocialAccount.externalAccountId) et un token de page avec les
 * permissions instagram_content_publish.
 * https://developers.facebook.com/docs/instagram-platform/reels-publishing
 */
async function publishToInstagramReels(
  post: ScheduledPost,
  clip: Clip,
  socialAccount: SocialAccount,
  accessToken: string,
): Promise<PublishResult> {
  const igUserId = socialAccount.externalAccountId;
  if (!igUserId) {
    throw new PublishError(
      "externalAccountId (ID du compte Instagram Business) manquant pour ce compte connecté",
    );
  }

  const createRes = await fetch(
    `https://graph.facebook.com/v19.0/${igUserId}/media?` +
      new URLSearchParams({
        media_type: "REELS",
        video_url: clip.videoUrl!,
        caption: post.caption,
        access_token: accessToken,
      }),
    { method: "POST" },
  );
  if (!createRes.ok) {
    throw new PublishError(`Échec de la création du conteneur Reels (${createRes.status}): ${await safeText(createRes)}`);
  }
  const created = (await createRes.json()) as { id?: string };
  if (!created.id) {
    throw new PublishError("Instagram n'a pas renvoyé d'id de conteneur média");
  }

  const publishRes = await fetch(
    `https://graph.facebook.com/v19.0/${igUserId}/media_publish?` +
      new URLSearchParams({ creation_id: created.id, access_token: accessToken }),
    { method: "POST" },
  );
  if (!publishRes.ok) {
    throw new PublishError(`Échec de la publication Reels (${publishRes.status}): ${await safeText(publishRes)}`);
  }
  const published = (await publishRes.json()) as { id: string };

  return { platformPostId: published.id, platformPostUrl: null };
}
