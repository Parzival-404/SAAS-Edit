import { mkdir } from "node:fs/promises";
import path from "node:path";
import { runCommand } from "../lib/exec.js";
import { config } from "../config.js";

/**
 * Télécharge la vidéo YouTube via yt-dlp (usage : traitement pour le compte
 * de l'utilisateur qui a fourni le lien — respecter les CGU YouTube, pas de
 * redistribution de la source).
 */
export async function downloadYoutubeVideo(
  youtubeUrl: string,
  jobId: string,
): Promise<{ videoPath: string; workDir: string }> {
  const workDir = path.join(config.tmpDir, jobId);
  await mkdir(workDir, { recursive: true });

  const outputTemplate = path.join(workDir, "source.%(ext)s");

  await runCommand("yt-dlp", [
    "-f",
    "bestvideo[height<=1080]+bestaudio/best[height<=1080]",
    "--merge-output-format",
    "mp4",
    "-o",
    outputTemplate,
    youtubeUrl,
  ]);

  return { videoPath: path.join(workDir, "source.mp4"), workDir };
}
