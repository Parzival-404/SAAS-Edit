export const config = {
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",

  storage: {
    endpoint: process.env.STORAGE_ENDPOINT ?? "",
    region: process.env.STORAGE_REGION ?? "auto",
    bucket: process.env.STORAGE_BUCKET ?? "saas-edit-clips",
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY ?? "",
    publicBaseUrl: process.env.STORAGE_PUBLIC_BASE_URL ?? "",
  },

  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  whisperMode: (process.env.WHISPER_MODE as "api" | "local") ?? "api",

  tmpDir: process.env.WORKER_TMP_DIR ?? "/tmp/saas-edit",
};
