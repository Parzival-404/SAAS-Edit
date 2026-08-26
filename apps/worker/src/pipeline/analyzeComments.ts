import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config.js";
import { extractJson } from "./analyzeHighlights.js";
import type { CommentAnalysisResult } from "../types.js";

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

const EMPTY_RESULT: CommentAnalysisResult = {
  summary: "Aucun commentaire à analyser pour l'instant.",
  positiveCount: 0,
  negativeCount: 0,
  neutralCount: 0,
  topThemes: [],
  faqs: [],
  contentIdeas: [],
};

/**
 * Résume les réactions des commentaires d'un clip publié : sentiment
 * global, thèmes récurrents, questions fréquentes, idées de futurs clips.
 */
export async function analyzeComments(
  clipTitle: string,
  comments: string[],
): Promise<CommentAnalysisResult> {
  if (comments.length === 0) {
    return EMPTY_RESULT;
  }

  const commentsBlock = comments
    .slice(0, 200)
    .map((c, i) => `${i + 1}. ${c.replace(/\n/g, " ").trim()}`)
    .join("\n");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2048,
    system:
      "Tu es un analyste de communauté pour un créateur de contenu court-format. " +
      "Tu lis les commentaires d'un clip publié et tu en tires des insights " +
      "actionnables. Réponds uniquement avec un JSON valide, sans texte autour.",
    messages: [
      {
        role: "user",
        content: `Clip : "${clipTitle}"

Commentaires (${comments.length} au total, ${Math.min(comments.length, 200)} affichés) :
${commentsBlock}

Analyse ces commentaires et retourne un JSON avec :
- summary : résumé en 2-3 phrases des réactions principales
- positiveCount, negativeCount, neutralCount : nombre approximatif de commentaires dans chaque catégorie (la somme doit être proche de ${Math.min(comments.length, 200)})
- topThemes : 3-5 sujets/thèmes qui reviennent le plus
- faqs : questions fréquemment posées par les viewers (0-5)
- contentIdeas : idées de futurs clips suggérées par les réactions (2-5)

Réponds avec un JSON de la forme ${JSON.stringify(EMPTY_RESULT)}.`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Réponse Claude inattendue : aucun bloc texte");
  }

  const parsed = JSON.parse(extractJson(textBlock.text)) as Partial<CommentAnalysisResult>;
  return normalizeCommentAnalysis(parsed);
}

export function normalizeCommentAnalysis(
  result: Partial<CommentAnalysisResult>,
): CommentAnalysisResult {
  return {
    summary: result.summary ?? EMPTY_RESULT.summary,
    positiveCount: result.positiveCount ?? 0,
    negativeCount: result.negativeCount ?? 0,
    neutralCount: result.neutralCount ?? 0,
    topThemes: Array.isArray(result.topThemes) ? result.topThemes : [],
    faqs: Array.isArray(result.faqs) ? result.faqs : [],
    contentIdeas: Array.isArray(result.contentIdeas) ? result.contentIdeas : [],
  };
}
