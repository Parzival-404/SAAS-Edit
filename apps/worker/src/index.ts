import { Worker, type Job } from "bullmq";
import { config } from "./config.js";
import { processVideo } from "./pipeline/processVideo.js";

const QUEUE_NAME = "video-processing";

type VideoProcessingJobData = { sourceVideoId: string };

const worker = new Worker<VideoProcessingJobData>(
  QUEUE_NAME,
  async (job: Job<VideoProcessingJobData>) => {
    console.log(`[worker] traitement de la vidéo ${job.data.sourceVideoId}`);
    await processVideo(job.data.sourceVideoId);
  },
  {
    connection: { url: config.redisUrl },
    concurrency: 2,
  },
);

worker.on("completed", (job) => {
  console.log(`[worker] job ${job.id} terminé`);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] job ${job?.id} en échec:`, err.message);
});

console.log("[worker] en écoute sur la file", QUEUE_NAME);
