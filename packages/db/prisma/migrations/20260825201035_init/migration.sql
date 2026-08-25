-- CreateEnum
CREATE TYPE "Tone" AS ENUM ('FUNNY', 'PROFESSIONAL', 'VIRAL', 'DRAMA', 'EDUCATIONAL');

-- CreateEnum
CREATE TYPE "VideoStatus" AS ENUM ('PENDING', 'DOWNLOADING', 'TRANSCRIBING', 'ANALYZING', 'EDITING', 'EXPORTING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "ClipStatus" AS ENUM ('QUEUED', 'RENDERING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "InspirationType" AS ENUM ('HOOK', 'TITLE', 'FORMAT', 'REFERENCE', 'TONE_GUIDELINE', 'WORD_TO_AVOID', 'TEMPLATE', 'BRAND_PREFERENCE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "minClipsPerVideo" INTEGER NOT NULL DEFAULT 3,
    "maxClipsPerVideo" INTEGER NOT NULL DEFAULT 8,
    "targetClipDurationS" INTEGER NOT NULL DEFAULT 45,
    "tone" "Tone" NOT NULL DEFAULT 'VIRAL',
    "subtitleLanguage" TEXT NOT NULL DEFAULT 'fr',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceVideo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "youtubeUrl" TEXT NOT NULL,
    "youtubeVideoId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "durationSec" INTEGER,
    "thumbnailUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "viewCount" INTEGER,
    "likeCount" INTEGER,
    "status" "VideoStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessingJob" (
    "id" TEXT NOT NULL,
    "sourceVideoId" TEXT NOT NULL,
    "status" "VideoStatus" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessingJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transcript" (
    "id" TEXT NOT NULL,
    "sourceVideoId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "fullText" TEXT NOT NULL,
    "segments" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transcript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clip" (
    "id" TEXT NOT NULL,
    "sourceVideoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startSec" DOUBLE PRECISION NOT NULL,
    "endSec" DOUBLE PRECISION NOT NULL,
    "durationSec" DOUBLE PRECISION NOT NULL,
    "title" TEXT NOT NULL,
    "hook" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hashtags" TEXT[],
    "captionText" TEXT,
    "viralScore" DOUBLE PRECISION,
    "scoreReason" TEXT,
    "status" "ClipStatus" NOT NULL DEFAULT 'QUEUED',
    "videoUrl" TEXT,
    "thumbnailUrl" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspirationItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "InspirationType" NOT NULL,
    "content" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspirationItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE INDEX "SourceVideo_userId_idx" ON "SourceVideo"("userId");

-- CreateIndex
CREATE INDEX "SourceVideo_youtubeVideoId_idx" ON "SourceVideo"("youtubeVideoId");

-- CreateIndex
CREATE INDEX "ProcessingJob_sourceVideoId_idx" ON "ProcessingJob"("sourceVideoId");

-- CreateIndex
CREATE UNIQUE INDEX "Transcript_sourceVideoId_key" ON "Transcript"("sourceVideoId");

-- CreateIndex
CREATE INDEX "Clip_sourceVideoId_idx" ON "Clip"("sourceVideoId");

-- CreateIndex
CREATE INDEX "Clip_userId_idx" ON "Clip"("userId");

-- CreateIndex
CREATE INDEX "InspirationItem_userId_idx" ON "InspirationItem"("userId");

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceVideo" ADD CONSTRAINT "SourceVideo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessingJob" ADD CONSTRAINT "ProcessingJob_sourceVideoId_fkey" FOREIGN KEY ("sourceVideoId") REFERENCES "SourceVideo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_sourceVideoId_fkey" FOREIGN KEY ("sourceVideoId") REFERENCES "SourceVideo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clip" ADD CONSTRAINT "Clip_sourceVideoId_fkey" FOREIGN KEY ("sourceVideoId") REFERENCES "SourceVideo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clip" ADD CONSTRAINT "Clip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspirationItem" ADD CONSTRAINT "InspirationItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
