-- CreateTable
CREATE TABLE "PostMetricsSnapshot" (
    "id" TEXT NOT NULL,
    "scheduledPostId" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "views" INTEGER,
    "likes" INTEGER,
    "comments" INTEGER,
    "shares" INTEGER,
    "engagementRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostMetricsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentInsight" (
    "id" TEXT NOT NULL,
    "scheduledPostId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "positiveCount" INTEGER NOT NULL DEFAULT 0,
    "negativeCount" INTEGER NOT NULL DEFAULT 0,
    "neutralCount" INTEGER NOT NULL DEFAULT 0,
    "topThemes" TEXT[],
    "faqs" TEXT[],
    "contentIdeas" TEXT[],
    "commentsAnalyzed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommentInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostMetricsSnapshot_scheduledPostId_capturedAt_idx" ON "PostMetricsSnapshot"("scheduledPostId", "capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommentInsight_scheduledPostId_key" ON "CommentInsight"("scheduledPostId");

-- AddForeignKey
ALTER TABLE "PostMetricsSnapshot" ADD CONSTRAINT "PostMetricsSnapshot_scheduledPostId_fkey" FOREIGN KEY ("scheduledPostId") REFERENCES "ScheduledPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentInsight" ADD CONSTRAINT "CommentInsight_scheduledPostId_fkey" FOREIGN KEY ("scheduledPostId") REFERENCES "ScheduledPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
