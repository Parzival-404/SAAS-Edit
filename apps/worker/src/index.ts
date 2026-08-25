import "dotenv/config";
import { Queue, Worker, type Job } from "bullmq";
import { config } from "./config.js";
import { processVideo } from "./pipeline/processVideo.js";
import { checkDueChannels } from "./pipeline/monitorChannels.js";
import type { VideoProcessingJobData } from "./types.js";

const VIDEO_QUEUE_NAME = "video-processing";
const CHANNEL_MONITOR_QUEUE_NAME = "channel-monitor-tick";
const connection = { url: config.redisUrl };

// ---- Traitement d'une vidéo (mode manuel + mode automatique) ----

const videoQueue = new Queue<VideoProcessingJobData>(VIDEO_QUEUE_NAME, { connection });

const videoWorker = new Worker<VideoProcessingJobData>(
  VIDEO_QUEUE_NAME,
  async (job: Job<VideoProcessingJobData>) => {
    console.log(`[worker] traitement de la vidéo ${job.data.sourceVideoId}`);
    await processVideo(job.data.sourceVideoId);
  },
  { connection, concurrency: 2 },
);

videoWorker.on("completed", (job) => {
  console.log(`[worker] job ${job.id} terminé`);
});

videoWorker.on("failed", (job, err) => {
  console.error(`[worker] job ${job?.id} en échec:`, err.message);
});

// ---- Mode automatique : tick périodique de surveillance des chaînes ----

const channelMonitorQueue = new Queue(CHANNEL_MONITOR_QUEUE_NAME, { connection });

const channelMonitorWorker = new Worker(
  CHANNEL_MONITOR_QUEUE_NAME,
  async () => {
    await checkDueChannels(videoQueue);
  },
  { connection, concurrency: 1 },
);

channelMonitorWorker.on("failed", (job, err) => {
  console.error("[channel-monitor] tick en échec:", err.message);
});

async function scheduleChannelMonitorTick(): Promise<void> {
  await channelMonitorQueue.upsertJobScheduler(
    "channel-monitor-tick",
    { every: config.channelMonitorTickMs },
    { name: "tick" },
  );
}

scheduleChannelMonitorTick().catch((err) => {
  console.error("[channel-monitor] impossible de programmer le tick:", err);
});

console.log("[worker] en écoute sur la file", VIDEO_QUEUE_NAME);
console.log(
  `[worker] surveillance des chaînes toutes les ${config.channelMonitorTickMs / 1000}s`,
);
