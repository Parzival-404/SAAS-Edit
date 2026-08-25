export type TranscriptSegment = {
  start: number;
  end: number;
  text: string;
};

export type TranscriptResult = {
  language: string;
  fullText: string;
  segments: TranscriptSegment[];
};

export type HighlightMoment = {
  startSec: number;
  endSec: number;
  title: string;
  hook: string;
  description: string;
  hashtags: string[];
  captionText: string;
  viralScore: number;
  scoreReason: string;
};
