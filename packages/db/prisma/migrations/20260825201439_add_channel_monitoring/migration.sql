-- CreateEnum
CREATE TYPE "VideoSource" AS ENUM ('MANUAL', 'CHANNEL_MONITOR');

-- AlterTable
ALTER TABLE "SourceVideo" ADD COLUMN     "channelId" TEXT,
ADD COLUMN     "source" "VideoSource" NOT NULL DEFAULT 'MANUAL';

-- CreateTable
CREATE TABLE "YoutubeChannel" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "handle" TEXT,
    "title" TEXT,
    "thumbnailUrl" TEXT,
    "monitoringEnabled" BOOLEAN NOT NULL DEFAULT true,
    "checkFrequencyMinutes" INTEGER NOT NULL DEFAULT 30,
    "lastCheckedAt" TIMESTAMP(3),
    "lastSeenPublishedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YoutubeChannel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "YoutubeChannel_userId_idx" ON "YoutubeChannel"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "YoutubeChannel_userId_channelId_key" ON "YoutubeChannel"("userId", "channelId");

-- CreateIndex
CREATE INDEX "SourceVideo_channelId_idx" ON "SourceVideo"("channelId");

-- AddForeignKey
ALTER TABLE "SourceVideo" ADD CONSTRAINT "SourceVideo_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "YoutubeChannel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YoutubeChannel" ADD CONSTRAINT "YoutubeChannel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
