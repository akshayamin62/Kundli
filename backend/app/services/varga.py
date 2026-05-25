"""
Varga (divisional chart) calculations — Parashari tradition.

Supported D-charts with their classical rules:
  D1   Rashi          — natal chart (no remapping)
  D2   Hora           — wealth / financial potential
  D3   Drekkana       — siblings, courage, vitality
  D4   Chaturthamsha  — fortune, immovable property
  D7   Saptamsa       — children, procreation
  D9   Navamsa        — spouse, dharma (most important varga)
  D10  Dashamsa       — career, profession, social status
  D12  Dwadashamsa    — parents, ancestral karma
  D16  Shodashamsa    — vehicles, comforts
  D20  Vimshamsha     — spiritual progress, upasana
  D24  Chaturvimshamsha — education, learning
  D27  Bhamsha        — strength, vitality (nakshatras)
  D30  Trimshamsha    — evils, misfortune
  D40  Khavedamsha    — auspicious / inauspicious effects
  D45  Akshavedamsha  — general indications
  D60  Shashtiamsa    — all results (karma in general)

Generic Parashari rule for any D-N not listed above:
  Odd signs  (1,3,5…) → count N divisions starting from Aries  (sign 0)
  Even signs (2,4,6…) → count N divisions starting from Libra  (sign 6)
"""

from __future__ import annotations

ZODIAC_SIGNS: list[str] = [
    "Aries", "Taurus", "Gemini", "Cancer",
    "Leo", "Virgo", "Libra", "Scorpio",
    "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

# Map D-N → human-readable name
VARGA_NAMES: dict[int, str] = {
    1:  "D1 – Rashi",
    2:  "D2 – Hora",
    3:  "D3 – Drekkana",
    4:  "D4 – Chaturthamsha",
    5:  "D5 – Panchamsha",
    6:  "D6 – Shashthamsha",
    7:  "D7 – Saptamsa",
    8:  "D8 – Ashtamsha",
    9:  "D9 – Navamsa",
    10: "D10 – Dashamsa",
    11: "D11 – Ekadashamsha",
    12: "D12 – Dwadashamsa",
    16: "D16 – Shodashamsha",
    20: "D20 – Vimshamsha",
    24: "D24 – Chaturvimshamsha",
    27: "D27 – Bhamsha",
    30: "D30 – Trimshamsha",
    40: "D40 – Khavedamsha",
    45: "D45 – Akshavedamsha",
    60: "D60 – Shashtiamsa",
}


def _slice(deg_in_sign: float, n: int) -> int:
    """Zero-based slice index (0 … n-1) within a sign."""
    # Guard against fp rounding at sign boundary
    s = int(deg_in_sign * n / 30.0)
    return min(s, n - 1)


def varga_sign_index(longitude: float, n: int) -> int:
    """
    Return the 0-based zodiac sign index (0=Aries … 11=Pisces) for a
    planet at *longitude* (0–360°) placed in the D-*n* divisional chart.
    """
    lon = longitude % 360.0
    sign_idx    = int(lon / 30.0)          # 0-based natal sign
    deg_in_sign = lon % 30.0               # degrees within that sign

    # ── D1: identical to natal ──────────────────────────────────────────
    if n == 1:
        return sign_idx

    # ── D2 Hora ─────────────────────────────────────────────────────────
    # Odd signs : 0-15° = Leo (4),  15-30° = Cancer (3)
    # Even signs: 0-15° = Cancer(3), 15-30° = Leo (4)
    if n == 2:
        first_half = deg_in_sign < 15.0
        if sign_idx % 2 == 0:   # odd sign (1,3,5…)
            return 4 if first_half else 3
        else:                    # even sign (2,4,6…)
            return 3 if first_half else 4

    # ── D3 Drekkana (trikona decanates) ─────────────────────────────────
    # Each decanate maps to same sign / 5th / 9th sign (120° apart)
    if n == 3:
        s = _slice(deg_in_sign, 3)   # 0, 1, 2
        return (sign_idx + s * 4) % 12

    # ── D4 Chaturthamsha ────────────────────────────────────────────────
    # Odd: Aries(0), Even: Capricorn(9) each subsequent slice +1
    if n == 4:
        s = _slice(deg_in_sign, 4)
        start = 0 if sign_idx % 2 == 0 else 9
        return (start + s) % 12

    # ── D7 Saptamsa ─────────────────────────────────────────────────────
    # Odd: count from same sign; Even: count from 7th sign (sign+6)
    if n == 7:
        s = _slice(deg_in_sign, 7)
        start = sign_idx if sign_idx % 2 == 0 else (sign_idx + 6) % 12
        return (start + s) % 12

    # ── D9 Navamsa (most important varga) ───────────────────────────────
    # Fire  (0,4,8)  → start Aries(0)
    # Earth (1,5,9)  → start Capricorn(9)
    # Air   (2,6,10) → start Libra(6)
    # Water (3,7,11) → start Cancer(3)
    if n == 9:
        s = _slice(deg_in_sign, 9)
        NAVAMSA_START = {0: 0, 1: 9, 2: 6, 3: 3,
                         4: 0, 5: 9, 6: 6, 7: 3,
                         8: 0, 9: 9, 10: 6, 11: 3}
        return (NAVAMSA_START[sign_idx] + s) % 12

    # ── D10 Dashamsa ────────────────────────────────────────────────────
    # Odd: count from same sign; Even: count from 9th sign (sign+8)
    if n == 10:
        s = _slice(deg_in_sign, 10)
        start = sign_idx if sign_idx % 2 == 0 else (sign_idx + 8) % 12
        return (start + s) % 12

    # ── D12 Dwadashamsa ─────────────────────────────────────────────────
    # Count from same sign for all signs
    if n == 12:
        s = _slice(deg_in_sign, 12)
        return (sign_idx + s) % 12

    # ── D16 Shodashamsha ────────────────────────────────────────────────
    # Odd: from Aries(0); Even: from Libra(6)
    if n == 16:
        s = _slice(deg_in_sign, 16)
        start = 0 if sign_idx % 2 == 0 else 6
        return (start + s) % 12

    # ── D20 Vimshamsha ──────────────────────────────────────────────────
    # Movable (0,3,6,9) → Aries(0); Fixed (1,4,7,10) → Sagittarius(8);
    # Dual   (2,5,8,11) → Leo(4)
    if n == 20:
        s = _slice(deg_in_sign, 20)
        modality = sign_idx % 3   # 0=movable, 1=fixed, 2=dual
        start = {0: 0, 1: 8, 2: 4}[modality]
        return (start + s) % 12

    # ── D24 Chaturvimshamsha ─────────────────────────────────────────────
    # Odd: Leo(4); Even: Cancer(3)
    if n == 24:
        s = _slice(deg_in_sign, 24)
        start = 4 if sign_idx % 2 == 0 else 3
        return (start + s) % 12

    # ── D27 Bhamsha ─────────────────────────────────────────────────────
    # Fire: Aries; Earth: Cancer; Air: Libra; Water: Capricorn
    if n == 27:
        s = _slice(deg_in_sign, 27)
        elem = sign_idx % 4
        start = {0: 0, 1: 3, 2: 6, 3: 9}[elem]
        return (start + s) % 12

    # ── D30 Trimshamsha (unequal divisions — simplified equal version) ──
    # Odd: Aries(0); Even: Libra(6)
    if n == 30:
        s = _slice(deg_in_sign, 30)
        start = 0 if sign_idx % 2 == 0 else 6
        return (start + s) % 12

    # ── D40 Khavedamsha ─────────────────────────────────────────────────
    # Odd: Aries(0); Even: Libra(6)
    if n == 40:
        s = _slice(deg_in_sign, 40)
        start = 0 if sign_idx % 2 == 0 else 6
        return (start + s) % 12

    # ── D45 Akshavedamsha ───────────────────────────────────────────────
    # Movable: Aries(0); Fixed: Leo(4); Dual: Sagittarius(8)
    if n == 45:
        s = _slice(deg_in_sign, 45)
        modality = sign_idx % 3
        start = {0: 0, 1: 4, 2: 8}[modality]
        return (start + s) % 12

    # ── D60 Shashtiamsa ─────────────────────────────────────────────────
    # Odd: Aries(0); Even: Libra(6)
    if n == 60:
        s = _slice(deg_in_sign, 60)
        start = 0 if sign_idx % 2 == 0 else 6
        return (start + s) % 12

    # ── Generic Parashari (all other D-N) ───────────────────────────────
    s = _slice(deg_in_sign, n)
    start = 0 if sign_idx % 2 == 0 else 6
    return (start + s) % 12
