import { rm } from "node:fs/promises";
import { prisma, VideoStatus } from "@saas-edit/db";
import { downloadYoutubeVideo } from "./downloadVideo.js";
import { transcribeVideo } from "./transcribe.js";
import { analyzeHighlights } from "./analyzeHighlights.js";
import { renderClip } from "./renderClip.js";
import { uploadFile } from "../lib/storage.js";

async function setStatus(sourceVideoId: string, status: VideoStatus) {
  await prisma.sourceVideo.update({ where: { id: sourceVideoId }, data: { status } });
  await prisma.processingJob.create({ data: { sourceVideoId, status } });
}

export async function processVideo(sourceVideoId: string): Promise<void> {
  const sourceVideo = await prisma.sourceVideo.findUniqueOrThrow({
    where: { id: sourceVideoId },
    include: { user: { include: { settings: true } } },
  });

  let workDir: string | undefined;

  try {
    await setStatus(sourceVideoId, "DOWNLOADING");
    const download = await downloadYoutubeVideo(sourceVideo.youtubeUrl, sourceVideoId);
    workDir = download.workDir;

    await setStatus(sourceVideoId, "TRANSCRIBING");
    const transcript = await transcribeVideo(download.videoPath, workDir);
    await prisma.transcript.create({
      data: {
        sourceVideoId,
        language: transcript.language,
        fullText: transcript.fullText,
        segments: transcript.segments,
      },
    });

    await setStatus(sourceVideoId, "ANALYZING");
    const inspiration = await prisma.inspirationItem.findMany({
      where: { userId: sourceVideo.userId },
    });
    const settings = sourceVideo.user.settings;
    const moments = await analyzeHighlights(transcript, {
      minClips: settings?.minClipsPerVideo ?? 3,
      maxClips: settings?.maxClipsPerVideo ?? 8,
      targetClipDurationS: settings?.targetClipDurationS ?? 45,
      tone: settings?.tone ?? "VIRAL",
      inspiration,
    });

    await setStatus(sourceVideoId, "EDITING");
    const clips = await Promise.all(
      moments.map((moment) =>
        prisma.clip.create({
          data: {
            sourceVideoId,
            userId: sourceVideo.userId,
            startSec: moment.startSec,
            endSec: moment.endSec,
            durationSec: moment.endSec - moment.startSec,
            title: moment.title,
            hook: moment.hook,
            description: moment.description,
            hashtags: moment.hashtags,
            captionText: moment.captionText,
            viralScore: moment.viralScore,
            scoreReason: moment.scoreReason,
            titleVariants: moment.titleVariants,
            hookVariants: moment.hookVariants,
            status: "QUEUED",
          },
        }),
      ),
    );

    await setStatus(sourceVideoId, "EXPORTING");
    for (const [index, clip] of clips.entries()) {
      const moment = moments[index];
      try {
        await prisma.clip.update({ where: { id: clip.id }, data: { status: "RENDERING" } });

        const rendered = await renderClip({
          sourceVideoPath: download.videoPath,
          workDir,
          clipId: clip.id,
          moment,
          transcriptSegments: transcript.segments,
        });

        const videoUrl = await uploadFile(
          rendered.videoPath,
          `clips/${sourceVideo.userId}/${clip.id}.mp4`,
          "video/mp4",
        );
        const thumbnailUrl = await uploadFile(
          rendered.thumbnailPath,
          `clips/${sourceVideo.userId}/${clip.id}.jpg`,
          "image/jpeg",
        );

        await prisma.clip.update({
          where: { id: clip.id },
          data: { status: "READY", videoUrl, thumbnailUrl },
        });
      } catch (err) {
        await prisma.clip.update({
          where: { id: clip.id },
          data: { status: "FAILED", errorMessage: (err as Error).message },
        });
      }
    }

    await setStatus(sourceVideoId, "READY");
  } catch (err) {
    await prisma.sourceVideo.update({
      where: { id: sourceVideoId },
      data: { status: "FAILED", errorMessage: (err as Error).message },
    });
    await prisma.processingJob.create({
      data: {
        sourceVideoId,
        status: "FAILED",
        errorMessage: (err as Error).message,
      },
    });
    throw err;
  } finally {
    if (workDir) {
      await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}
