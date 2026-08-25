import { prisma } from "@saas-edit/db";
import { listRecentUploads, YoutubeApiError } from "@saas-edit/youtube-api";
import { config } from "../config.js";
import type { Queue } from "bullmq";
import type { VideoProcessingJobData } from "../types.js";

/**
 * Mode automatique : parcourt les chaînes connectées dont l'intervalle de
 * surveillance est écoulé, détecte les nouvelles vidéos publiées depuis le
 * dernier contrôle, crée une SourceVideo pour chacune et enfile le
 * traitement — sans intervention utilisateur.
 */
export async function checkDueChannels(videoQueue: Queue<VideoProcessingJobData>): Promise<void> {
  if (!config.youtubeApiKey) {
    console.warn("[channel-monitor] YOUTUBE_API_KEY absente, contrôle ignoré");
    return;
  }

  const now = new Date();
  const channels = await prisma.youtubeChannel.findMany({
    where: { monitoringEnabled: true },
  });

  const due = channels.filter((channel) => {
    if (!channel.lastCheckedAt) return true;
    const dueAt = new Date(
      channel.lastCheckedAt.getTime() + channel.checkFrequencyMinutes * 60 * 1000,
    );
    return dueAt <= now;
  });

  for (const channel of due) {
    await checkChannel(channel, videoQueue);
  }
}

async function checkChannel(
  channel: Awaited<ReturnType<typeof prisma.youtubeChannel.findMany>>[number],
  videoQueue: Queue<VideoProcessingJobData>,
): Promise<void> {
  try {
    const uploads = await listRecentUploads(
      channel.channelId,
      config.youtubeApiKey,
      channel.lastSeenPublishedAt ?? undefined,
    );

    let latestPublishedAt = channel.lastSeenPublishedAt;

    for (const upload of uploads) {
      const existing = await prisma.sourceVideo.findFirst({
        where: { userId: channel.userId, youtubeVideoId: upload.videoId },
      });
      if (existing) continue;

      const sourceVideo = await prisma.sourceVideo.create({
        data: {
          userId: channel.userId,
          channelId: channel.id,
          source: "CHANNEL_MONITOR",
          youtubeUrl: `https://www.youtube.com/watch?v=${upload.videoId}`,
          youtubeVideoId: upload.videoId,
          title: upload.title,
          description: upload.description,
          thumbnailUrl: upload.thumbnailUrl,
          publishedAt: new Date(upload.publishedAt),
          status: "PENDING",
        },
      });

      await prisma.processingJob.create({
        data: { sourceVideoId: sourceVideo.id, status: "PENDING" },
      });

      await videoQueue.add(
        "process-video",
        { sourceVideoId: sourceVideo.id },
        { removeOnComplete: true, removeOnFail: false },
      );

      const publishedAt = new Date(upload.publishedAt);
      if (!latestPublishedAt || publishedAt > latestPublishedAt) {
        latestPublishedAt = publishedAt;
      }

      console.log(
        `[channel-monitor] nouvelle vidéo détectée sur ${channel.title ?? channel.channelId}: ${upload.title}`,
      );
    }

    await prisma.youtubeChannel.update({
      where: { id: channel.id },
      data: {
        lastCheckedAt: new Date(),
        lastSeenPublishedAt: latestPublishedAt,
        errorMessage: null,
      },
    });
  } catch (err) {
    const message =
      err instanceof YoutubeApiError ? err.message : (err as Error).message;
    console.error(`[channel-monitor] échec pour la chaîne ${channel.channelId}:`, message);
    await prisma.youtubeChannel.update({
      where: { id: channel.id },
      data: { lastCheckedAt: new Date(), errorMessage: message },
    });
  }
}
