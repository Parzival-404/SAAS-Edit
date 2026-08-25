import { createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import { runCommand } from "../lib/exec.js";
import { config } from "../config.js";
import type { TranscriptResult } from "../types.js";

const LOCAL_WHISPER_SCRIPT = fileURLToPath(
  new URL("../../scripts/transcribe_local.py", import.meta.url),
);

/**
 * Transcrit l'audio de la vidéo avec horodatage par segment.
 * Mode "api" : OpenAI Whisper API (simple, payant à l'usage).
 * Mode "local" : faster-whisper via un script Python (coûts réduits à
 * l'échelle, nécessite le binaire dans l'image worker — voir Dockerfile).
 */
export async function transcribeVideo(
  videoPath: string,
  workDir: string,
): Promise<TranscriptResult> {
  const audioPath = path.join(workDir, "audio.mp3");
  await runCommand("ffmpeg", [
    "-y",
    "-i",
    videoPath,
    "-vn",
    "-acodec",
    "libmp3lame",
    "-q:a",
    "4",
    audioPath,
  ]);

  if (config.whisperMode === "local") {
    return transcribeLocal(audioPath, workDir);
  }
  return transcribeWithOpenAI(audioPath);
}

async function transcribeWithOpenAI(audioPath: string): Promise<TranscriptResult> {
  const client = new OpenAI({ apiKey: config.openaiApiKey });

  const response = await client.audio.transcriptions.create({
    file: createReadStream(audioPath),
    model: "whisper-1",
    response_format: "verbose_json",
    timestamp_granularities: ["segment"],
  });

  const segments =
    (response as unknown as {
      segments?: { start: number; end: number; text: string }[];
    }).segments ?? [];

  return {
    language: response.language ?? "fr",
    fullText: response.text,
    segments: segments.map((s) => ({
      start: s.start,
      end: s.end,
      text: s.text.trim(),
    })),
  };
}

// Sous-traite à un script Python séparé (faster-whisper) qui écrit un JSON
// { language, fullText, segments } sur stdout — permet de découpler la
// version du modèle du reste du worker Node.
async function transcribeLocal(
  audioPath: string,
  workDir: string,
): Promise<TranscriptResult> {
  const { stdout } = await runCommand("python3", [
    LOCAL_WHISPER_SCRIPT,
    audioPath,
  ], { cwd: workDir });

  return JSON.parse(stdout) as TranscriptResult;
}
