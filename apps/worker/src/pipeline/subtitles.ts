import { writeFile } from "node:fs/promises";
import type { TranscriptSegment } from "../types.js";

export function formatAssTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

const ASS_HEADER = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, Outline, Shadow, Alignment, MarginL, MarginR, MarginV
Style: Default,Arial Black,72,&H00FFFFFF,&H00000000,&H80000000,1,4,0,2,60,60,220

[Events]
Format: Layer, Start, End, Style, Text
`;

/**
 * Génère un fichier .ass de sous-titres dynamiques (un bloc de quelques
 * mots à la fois) pour le segment [clipStart, clipEnd) d'une transcription,
 * avec des timestamps relatifs au début du clip.
 */
export async function generateSubtitleFile(
  segments: TranscriptSegment[],
  clipStart: number,
  clipEnd: number,
  outputPath: string,
): Promise<void> {
  const relevant = segments.filter((s) => s.end > clipStart && s.start < clipEnd);

  const lines = relevant.map((segment) => {
    const start = Math.max(0, segment.start - clipStart);
    const end = Math.min(clipEnd - clipStart, segment.end - clipStart);
    const text = segment.text.replace(/\n/g, " ").trim();
    return `Dialogue: 0,${formatAssTime(start)},${formatAssTime(end)},Default,${text}`;
  });

  await writeFile(outputPath, ASS_HEADER + lines.join("\n") + "\n", "utf-8");
}
