#!/usr/bin/env python3
"""Transcription locale via faster-whisper (mode WHISPER_MODE=local).

Usage: python3 transcribe_local.py <audio_path>
Écrit un JSON {language, fullText, segments} sur stdout.

Nécessite: pip install faster-whisper
"""
import json
import sys

from faster_whisper import WhisperModel

def main() -> None:
    audio_path = sys.argv[1]
    model = WhisperModel("small", device="cpu", compute_type="int8")
    segments_iter, info = model.transcribe(audio_path, vad_filter=True)

    segments = []
    full_text_parts = []
    for segment in segments_iter:
        text = segment.text.strip()
        segments.append({"start": segment.start, "end": segment.end, "text": text})
        full_text_parts.append(text)

    print(json.dumps({
        "language": info.language,
        "fullText": " ".join(full_text_parts),
        "segments": segments,
    }))

if __name__ == "__main__":
    main()
