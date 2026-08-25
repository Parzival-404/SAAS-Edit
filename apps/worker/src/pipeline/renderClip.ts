import path from "node:path";
import { fileURLToPath } from "node:url";
import { runCommand } from "../lib/exec.js";
import { generateSubtitleFile } from "./subtitles.js";
import { config } from "../config.js";
import type { HighlightMoment, TranscriptSegment } from "../types.js";

const TARGET_W = 1080;
const TARGET_H = 1920;

const SMART_CROP_SCRIPT = fileURLToPath(
  new URL("../../scripts/smart_crop.py", import.meta.url),
);

/**
 * Découpe un extrait, recadre en 9:16 en suivant le sujet principal
 * (détection de visage + lissage temporel, voir smart_crop.py), incruste
 * le titre et les sous-titres dynamiques, exporte en mp4 vertical.
 *
 * Si le recadrage intelligent échoue ou est désactivé, retombe sur un
 * crop centré statique — jamais d'échec total du clip pour cette seule
 * raison.
 */
export async function renderClip(params: {
  sourceVideoPath: string;
  workDir: string;
  clipId: string;
  moment: HighlightMoment;
  transcriptSegments: TranscriptSegment[];
}): Promise<{ videoPath: string; thumbnailPath: string }> {
  const { sourceVideoPath, workDir, clipId, moment, transcriptSegments } = params;
  const duration = moment.endSec - moment.startSec;

  const subtitlePath = path.join(workDir, `${clipId}.ass`);
  await generateSubtitleFile(
    transcriptSegments,
    moment.startSec,
    moment.endSec,
    subtitlePath,
  );

  // Extrait brut (vidéo + audio, pas encore recadré) sur lequel travailler
  // pour les deux étapes suivantes.
  const rawClipPath = path.join(workDir, `${clipId}_raw.mp4`);
  await runCommand("ffmpeg", [
    "-y",
    "-ss",
    String(moment.startSec),
    "-i",
    sourceVideoPath,
    "-t",
    String(duration),
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "18",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    rawClipPath,
  ]);

  const outputPath = path.join(workDir, `${clipId}.mp4`);
  const thumbnailPath = path.join(workDir, `${clipId}.jpg`);
  const escapedSubtitlePath = subtitlePath.replace(/:/g, "\\:");
  const wrappedTitle = wrapTitle(moment.title);
  const titleFilter =
    `drawtext=text='${escapeDrawtext(wrappedTitle)}':fontcolor=white:fontsize=64:line_spacing=8:` +
    "fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:" +
    "x=(w-text_w)/2:y=100:box=1:boxcolor=black@0.55:boxborderw=20";

  const croppedSilentPath = config.smartCropEnabled
    ? await trySmartCrop(rawClipPath, workDir, clipId)
    : null;

  if (croppedSilentPath) {
    // Déjà recadré en 1080x1920 (sans audio) par smart_crop.py : on
    // incruste juste titre + sous-titres et on remuxe l'audio du brut.
    await runCommand("ffmpeg", [
      "-y",
      "-i",
      croppedSilentPath,
      "-i",
      rawClipPath,
      "-map",
      "0:v:0",
      "-map",
      "1:a:0?",
      "-vf",
      [titleFilter, `ass=${escapedSubtitlePath}`].join(","),
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "20",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-shortest",
      outputPath,
    ]);
  } else {
    // Repli : crop centré statique directement sur l'extrait brut.
    const filterGraph = [
      "crop=ih*9/16:ih",
      `scale=${TARGET_W}:${TARGET_H}`,
      titleFilter,
      `ass=${escapedSubtitlePath}`,
    ].join(",");

    await runCommand("ffmpeg", [
      "-y",
      "-i",
      rawClipPath,
      "-vf",
      filterGraph,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "20",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      outputPath,
    ]);
  }

  await runCommand("ffmpeg", [
    "-y",
    "-i",
    outputPath,
    "-ss",
    "1",
    "-frames:v",
    "1",
    thumbnailPath,
  ]);

  return { videoPath: outputPath, thumbnailPath };
}

async function trySmartCrop(
  rawClipPath: string,
  workDir: string,
  clipId: string,
): Promise<string | null> {
  const outputPath = path.join(workDir, `${clipId}_cropped_silent.mp4`);
  try {
    await runCommand("python3", [
      SMART_CROP_SCRIPT,
      rawClipPath,
      outputPath,
      "--target-w",
      String(TARGET_W),
      "--target-h",
      String(TARGET_H),
    ]);
    return outputPath;
  } catch (err) {
    console.warn(
      `[render] recadrage intelligent indisponible pour le clip ${clipId}, repli sur crop centré:`,
      (err as Error).message,
    );
    return null;
  }
}

export function escapeDrawtext(text: string): string {
  return text.replace(/'/g, "\\'").replace(/:/g, "\\:");
}

/**
 * drawtext ne fait pas de retour à la ligne automatique : sans ça, un
 * titre un peu long déborde du cadre vertical. On le découpe en lignes
 * courtes (mots entiers) avant de l'incruster.
 */
export function wrapTitle(text: string, maxCharsPerLine = 22, maxLines = 3): string {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);

  if (lines.length > maxLines) {
    const truncated = lines.slice(0, maxLines);
    const lastIndex = maxLines - 1;
    truncated[lastIndex] = `${truncated[lastIndex].slice(0, maxCharsPerLine - 1).trimEnd()}…`;
    return truncated.join("\n");
  }
  return lines.join("\n");
}
