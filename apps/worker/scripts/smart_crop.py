#!/usr/bin/env python3
"""Recadrage 9:16 avec suivi du sujet principal pour SAAS-Edit.

Usage: python3 smart_crop.py <input> <output> [--target-w 1080] [--target-h 1920]

Détecte le plus grand visage sur des frames échantillonnées, lisse le
centre horizontal dans le temps (évite les à-coups), et écrit une vidéo
verticale silencieuse (pas d'audio) recadrée en suivant ce centre. Si
aucun visage n'est jamais détecté, revient à un crop centré statique —
comportement identique à la v1, jamais pire.

Fonctionne en deux passes pour rester à mémoire constante quelle que soit
la durée du clip : passe 1 = détection (pas de frames gardées en mémoire),
passe 2 = recadrage + écriture en streaming.
"""
import argparse
import sys

import cv2


def detect_face_center_x(frame, face_cascade, detect_scale: float) -> float | None:
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    small = cv2.resize(gray, None, fx=detect_scale, fy=detect_scale)
    faces = face_cascade.detectMultiScale(small, scaleFactor=1.2, minNeighbors=5, minSize=(30, 30))
    if len(faces) == 0:
        return None
    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
    return float((x + w / 2) / detect_scale)


def smooth_centers(raw_centers: list[float | None], alpha: float) -> list[float]:
    """Comble les échantillons manquants (frame non analysée / pas de visage)
    par la dernière valeur connue, puis lisse par moyenne mobile exponentielle
    pour éviter les mouvements de caméra saccadés."""
    filled: list[float | None] = list(raw_centers)
    last: float | None = None
    for i, v in enumerate(filled):
        if v is None:
            filled[i] = last
        else:
            last = v
    first_known = next((v for v in filled if v is not None), None)
    for i, v in enumerate(filled):
        if v is None:
            filled[i] = first_known

    smoothed: list[float] = []
    ema: float | None = None
    for v in filled:
        assert v is not None
        ema = v if ema is None else alpha * v + (1 - alpha) * ema
        smoothed.append(ema)
    return smoothed


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input")
    parser.add_argument("output")
    parser.add_argument("--target-w", type=int, default=1080)
    parser.add_argument("--target-h", type=int, default=1920)
    parser.add_argument("--sample-every", type=int, default=3, help="analyser 1 frame sur N")
    parser.add_argument("--detect-scale", type=float, default=0.5, help="downscale avant détection (vitesse)")
    parser.add_argument("--smoothing-alpha", type=float, default=0.12)
    args = parser.parse_args()

    cap = cv2.VideoCapture(args.input)
    if not cap.isOpened():
        print(f"Impossible d'ouvrir {args.input}", file=sys.stderr)
        sys.exit(1)

    fps = cap.get(cv2.CAP_PROP_FPS) or 25
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    if width <= 0 or height <= 0:
        print("Dimensions vidéo invalides", file=sys.stderr)
        sys.exit(1)

    crop_w = min(width, round(height * 9 / 16))
    crop_h = height

    cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    face_cascade = cv2.CascadeClassifier(cascade_path)
    if face_cascade.empty():
        print("Impossible de charger le classifieur de visages", file=sys.stderr)
        sys.exit(1)

    # ---- Passe 1 : détection (pas de frames gardées en mémoire) ----
    raw_centers: list[float | None] = []
    idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if idx % args.sample_every == 0:
            raw_centers.append(detect_face_center_x(frame, face_cascade, args.detect_scale))
        else:
            raw_centers.append(None)
        idx += 1
    cap.release()

    total_frames = len(raw_centers)
    if total_frames == 0:
        print("Aucune frame décodée", file=sys.stderr)
        sys.exit(1)

    any_face = any(c is not None for c in raw_centers)
    centers = smooth_centers(raw_centers, args.smoothing_alpha) if any_face else [width / 2.0] * total_frames

    # ---- Passe 2 : recadrage + écriture en streaming ----
    cap2 = cv2.VideoCapture(args.input)
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(args.output, fourcc, fps, (args.target_w, args.target_h))
    if not writer.isOpened():
        print(f"Impossible d'ouvrir en écriture {args.output}", file=sys.stderr)
        sys.exit(1)

    written = 0
    for center_x in centers:
        ret, frame = cap2.read()
        if not ret:
            break
        x0 = int(round(center_x - crop_w / 2))
        x0 = max(0, min(x0, width - crop_w))
        cropped = frame[0:crop_h, x0 : x0 + crop_w]
        resized = cv2.resize(cropped, (args.target_w, args.target_h), interpolation=cv2.INTER_AREA)
        writer.write(resized)
        written += 1

    cap2.release()
    writer.release()

    print(f"OK frames={written} any_face={any_face}")


if __name__ == "__main__":
    main()
