import path from "node:path";
import { runCommand } from "../lib/exec.js";
import { generateSubtitleFile } from "./subtitles.js";
import type { HighlightMoment, TranscriptSegment } from "../types.js";

/**
 * Découpe un extrait, recadre en 9:16 (crop centré sur la largeur — un
 * suivi de sujet/visage plus avancé est prévu en v2), incruste le titre
 * et les sous-titres dynamiques, exporte en mp4 vertical.
 */
export async function renderClip(params: {
  sourceVideoPath: string;
  workDir: string;
  clipId: string;
  moment: HighlightMoment;
  transcriptSegments: TranscriptSegment[];
}): Promise<{ videoPath: string; thumbnailPath: string }> {
  const { sourceVideoPath, workDir, clipId, moment, transcriptSegments } = params;

  const subtitlePath = path.join(workDir, `${clipId}.ass`);
  await generateSubtitleFile(
    transcriptSegments,
    moment.startSec,
    moment.endSec,
    subtitlePath,
  );

  const outputPath = path.join(workDir, `${clipId}.mp4`);
  const thumbnailPath = path.join(workDir, `${clipId}.jpg`);
  const duration = moment.endSec - moment.startSec;

  // Recadrage 9:16 : on prend toute la hauteur et on centre un crop de
  // largeur ih*9/16, puis on scale/pad à 1080x1920, on incruste le titre
  // en haut et les sous-titres (ass) en bas-centre.
  const escapedSubtitlePath = subtitlePath.replace(/:/g, "\\:");
  const filterGraph = [
    "crop=ih*9/16:ih",
    "scale=1080:1920",
    `drawtext=text='${escapeDrawtext(moment.title)}':fontcolor=white:fontsize=64:` +
      "fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:" +
      "x=(w-text_w)/2:y=100:box=1:boxcolor=black@0.55:boxborderw=20",
    `ass=${escapedSubtitlePath}`,
  ].join(",");

  await runCommand("ffmpeg", [
    "-y",
    "-ss",
    String(moment.startSec),
    "-i",
    sourceVideoPath,
    "-t",
    String(duration),
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

function escapeDrawtext(text: string): string {
  return text.replace(/'/g, "\\'").replace(/:/g, "\\:");
}
