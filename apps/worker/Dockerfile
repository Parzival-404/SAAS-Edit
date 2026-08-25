# Image du worker de traitement vidéo — inclut ffmpeg + yt-dlp (Python)
FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg \
      python3 \
      python3-pip \
      curl \
    && pip3 install --no-cache-dir --break-system-packages yt-dlp \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .
RUN corepack enable && pnpm install --frozen-lockfile && pnpm --filter @saas-edit/worker build

CMD ["node", "apps/worker/dist/index.js"]
