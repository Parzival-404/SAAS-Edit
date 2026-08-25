import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config.js";
import type { HighlightMoment, TranscriptResult } from "../types.js";

type AnalyzeOptions = {
  minClips: number;
  maxClips: number;
  targetClipDurationS: number;
  tone: string;
  inspiration: { type: string; content: string; notes: string | null }[];
};

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

/**
 * Envoie la transcription horodatée à Claude pour repérer les moments à
 * fort potentiel (drôle, choquant, émotionnel, utile, rythmé, autonome
 * hors-contexte) et générer titre/hook/description/hashtags pour chacun.
 */
export async function analyzeHighlights(
  transcript: TranscriptResult,
  options: AnalyzeOptions,
): Promise<HighlightMoment[]> {
  const transcriptForPrompt = transcript.segments
    .map((s) => `[${s.start.toFixed(1)}-${s.end.toFixed(1)}] ${s.text}`)
    .join("\n");

  const inspirationBlock = options.inspiration.length
    ? options.inspiration
        .map((i) => `- (${i.type}) ${i.content}${i.notes ? ` — ${i.notes}` : ""}`)
        .join("\n")
    : "Aucune référence fournie.";

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4096,
    system:
      "Tu es un monteur/éditeur spécialisé dans les clips courts viraux " +
      "(TikTok, Reels, Shorts). Tu analyses une transcription horodatée " +
      "et tu sélectionnes les meilleurs extraits à découper. Réponds " +
      "uniquement avec un JSON valide, sans texte autour.",
    messages: [
      {
        role: "user",
        content: `Ton souhaité : ${options.tone}
Nombre de clips à proposer : entre ${options.minClips} et ${options.maxClips}
Durée cible par clip : ~${options.targetClipDurationS} secondes (ne pas dépasser 50% d'écart)

Références/style de la marque (base d'inspiration) :
${inspirationBlock}

Règles :
- Choisis des extraits qui fonctionnent sans contexte (compréhensibles seuls).
- Privilégie phrases fortes, moments drôles/choquants/émotionnels/utiles/rythmés.
- Évite les moments mous, trop longs ou incompréhensibles hors contexte.
- Les extraits ne doivent pas se chevaucher.
- Pour chaque clip retourne : startSec, endSec, title (accrocheur, court), hook (phrase pour les 3 premières secondes), description (adaptée réseaux sociaux), hashtags (5-8, sans #), captionText (texte à afficher à l'écran), viralScore (0 à 1), scoreReason (courte justification).

Transcription horodatée :
${transcriptForPrompt}

Réponds avec un JSON de la forme { "clips": HighlightMoment[] }.`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Réponse Claude inattendue : aucun bloc texte");
  }

  const parsed = JSON.parse(extractJson(textBlock.text)) as {
    clips: HighlightMoment[];
  };

  return parsed.clips;
}

function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Impossible d'extraire le JSON de la réponse Claude");
  }
  return text.slice(start, end + 1);
}
