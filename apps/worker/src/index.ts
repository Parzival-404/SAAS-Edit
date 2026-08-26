import "dotenv/config";
import { Queue, Worker, type Job } from "bullmq";
import { config } from "./config.js";
import { processVideo } from "./pipeline/processVideo.js";
import { checkDueChannels } from "./pipeline/monitorChannels.js";
import { publishDuePosts } from "./pipeline/publishScheduler.js";
import { refreshDueMetrics } from "./pipeline/analyticsScheduler.js";
import { refreshDueCommentAnalyses } from "./pipeline/commentAnalysisScheduler.js";
import type { VideoProcessingJobData } from "./types.js";

const VIDEO_QUEUE_NAME = "video-processing";
const CHANNEL_MONITOR_QUEUE_NAME = "channel-monitor-tick";
const PUBLISH_SCHEDULER_QUEUE_NAME = "publish-scheduler-tick";
const INSIGHTS_QUEUE_NAME = "insights-tick";
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

// ---- Publication : tick périodique qui publie les posts programmés dus ----

const publishSchedulerQueue = new Queue(PUBLISH_SCHEDULER_QUEUE_NAME, { connection });

const publishSchedulerWorker = new Worker(
  PUBLISH_SCHEDULER_QUEUE_NAME,
  async () => {
    await publishDuePosts();
  },
  { connection, concurrency: 1 },
);

publishSchedulerWorker.on("failed", (job, err) => {
  console.error("[publish] tick en échec:", err.message);
});

async function schedulePublishTick(): Promise<void> {
  await publishSchedulerQueue.upsertJobScheduler(
    "publish-scheduler-tick",
    { every: config.publishSchedulerTickMs },
    { name: "tick" },
  );
}

schedulePublishTick().catch((err) => {
  console.error("[publish] impossible de programmer le tick:", err);
});

// ---- Analytics + commentaires : tick périodique post-publication ----

const insightsQueue = new Queue(INSIGHTS_QUEUE_NAME, { connection });

const insightsWorker = new Worker(
  INSIGHTS_QUEUE_NAME,
  async () => {
    await refreshDueMetrics();
    await refreshDueCommentAnalyses();
  },
  { connection, concurrency: 1 },
);

insightsWorker.on("failed", (job, err) => {
  console.error("[insights] tick en échec:", err.message);
});

async function scheduleInsightsTick(): Promise<void> {
  await insightsQueue.upsertJobScheduler(
    "insights-tick",
    { every: config.analyticsTickMs },
    { name: "tick" },
  );
}

scheduleInsightsTick().catch((err) => {
  console.error("[insights] impossible de programmer le tick:", err);
});

console.log("[worker] en écoute sur la file", VIDEO_QUEUE_NAME);
console.log(
  `[worker] surveillance des chaînes toutes les ${config.channelMonitorTickMs / 1000}s`,
);
console.log(
  `[worker] publication programmée vérifiée toutes les ${config.publishSchedulerTickMs / 1000}s`,
);
console.log(
  `[worker] analytics/commentaires vérifiés toutes les ${config.analyticsTickMs / 1000}s`,
);
