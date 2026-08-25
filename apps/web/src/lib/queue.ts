import { Queue } from "bullmq";

const connection = {
  url: process.env.REDIS_URL ?? "redis://localhost:6379",
};

declare global {
  // eslint-disable-next-line no-var
  var __videoQueue: Queue | undefined;
}

export const VIDEO_PROCESSING_QUEUE = "video-processing";

export const videoQueue =
  global.__videoQueue ??
  new Queue(VIDEO_PROCESSING_QUEUE, {
    connection,
  });

if (process.env.NODE_ENV !== "production") {
  global.__videoQueue = videoQueue;
}

export type VideoProcessingJobData = {
  sourceVideoId: string;
};
