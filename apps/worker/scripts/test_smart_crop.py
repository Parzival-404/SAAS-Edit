"""Tests pour la logique de lissage de smart_crop.py (pas de dépendance à
une vraie vidéo/webcam — juste la partie mathématique pure).

Lancer : pytest apps/worker/scripts/test_smart_crop.py
"""
from smart_crop import smooth_centers


def test_constant_stays_constant():
    assert smooth_centers([200.0] * 5, alpha=0.2) == [200.0] * 5


def test_follows_a_transition_smoothly():
    raw = [100.0, None, None, 100.0, None, None, 500.0, None, None, 500.0]
    out = smooth_centers(raw, alpha=0.5)
    assert out[0] == 100.0
    assert out[-1] > 400  # a bien suivi la transition vers 500
    # monotone croissant à partir de la transition (pas d'à-coup/oscillation)
    tail = out[6:]
    assert all(b >= a for a, b in zip(tail, tail[1:]))


def test_backfills_leading_gaps():
    raw = [None, None, 300.0, None, 300.0]
    out = smooth_centers(raw, alpha=0.5)
    assert out[0] == 300.0


def test_all_none_would_not_be_called_but_does_not_crash_on_single_value():
    # smart_crop.py n'appelle jamais smooth_centers si aucun visage n'a été
    # détecté (fallback géré en amont) ; on vérifie juste la robustesse du
    # cas limite à un seul échantillon.
    assert smooth_centers([42.0], alpha=0.3) == [42.0]


def test_alpha_closer_to_one_reacts_faster():
    raw = [0.0, 100.0, 100.0, 100.0]
    slow = smooth_centers(raw, alpha=0.1)
    fast = smooth_centers(raw, alpha=0.9)
    assert fast[1] > slow[1]
