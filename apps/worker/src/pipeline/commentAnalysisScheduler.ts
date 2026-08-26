import { prisma } from "@saas-edit/db";
import { decryptSecret } from "@saas-edit/crypto";
import { fetchComments } from "./fetchComments.js";
import { analyzeComments } from "./analyzeComments.js";
import { config } from "../config.js";

/**
 * Régénère périodiquement l'analyse des commentaires de chaque post
 * publié : résumé des réactions, sentiment, questions fréquentes, idées
 * de futurs clips.
 */
export async function refreshDueCommentAnalyses(): Promise<void> {
  const publishedPosts = await prisma.scheduledPost.findMany({
    where: { status: "PUBLISHED" },
    include: { socialAccount: true, clip: true, commentInsight: true },
  });

  const now = Date.now();
  const due = publishedPosts.filter((post) => {
    if (!post.commentInsight) return true;
    return now - post.commentInsight.updatedAt.getTime() >= config.commentAnalysisIntervalMs;
  });

  for (const post of due) {
    await refreshOne(post);
  }
}

async function refreshOne(
  post: Awaited<ReturnType<typeof prisma.scheduledPost.findMany>>[number] & {
    socialAccount: NonNullable<Awaited<ReturnType<typeof prisma.socialAccount.findFirst>>>;
    clip: NonNullable<Awaited<ReturnType<typeof prisma.clip.findFirst>>>;
  },
): Promise<void> {
  try {
    if (!post.socialAccount.accessTokenEncrypted) {
      throw new Error("Compte social sans token d'accès enregistré");
    }
    const accessToken = decryptSecret(post.socialAccount.accessTokenEncrypted);
    const comments = await fetchComments(post, post.socialAccount, accessToken);
    const analysis = await analyzeComments(post.clip.title, comments);

    await prisma.commentInsight.upsert({
      where: { scheduledPostId: post.id },
      update: { ...analysis, commentsAnalyzed: comments.length },
      create: { scheduledPostId: post.id, ...analysis, commentsAnalyzed: comments.length },
    });
    console.log(
      `[comments] analyse mise à jour pour le post ${post.id} (${comments.length} commentaires)`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[comments] échec de l'analyse pour le post ${post.id}:`, message);
  }
}
