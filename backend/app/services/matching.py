"""
Kundli Milan (Ashtakoot Guna Matching) service.

Calculates the 8-koot compatibility score between two birth charts using
the traditional Parashari / North Indian Ashtakoot system.

Koots and their maximum Gunas:
  1. Varna       (1)  – Spiritual compatibility / development
  2. Vasya       (2)  – Mutual attraction / control
  3. Tara        (3)  – Birth star compatibility / destiny
  4. Yoni        (4)  – Biological / sexual compatibility
  5. Graha Maitri(5)  – Moon sign lord friendship
  6. Gana        (6)  – Temperament (Deva / Manav / Rakshasa)
  7. Rashi/Bhakut(7)  – Moon sign compatibility
  8. Nadi        (8)  – Physical constitution / health
                 ─────
  Total          36 Gunas

Also calculates:
  • Mangal Dosha (Kuja Dosha) presence for both
  • Navamsa Lagna compatibility
  • Individual Nakshatra info
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Dict, Any

# ---------------------------------------------------------------------------
# Nakshatra data (0-indexed, 27 nakshatras)
# ---------------------------------------------------------------------------

NAKSHATRA_NAMES = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni",
    "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha",
    "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana",
    "Dhanishtha", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
]

ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

# Nakshatra lords (Dasha lords) — repeating cycle of 9, for 27 nakshatras
_NAK_LORDS = [
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
]

# Sign lords
_SIGN_LORDS = {
    "Aries": "Mars", "Taurus": "Venus", "Gemini": "Mercury",
    "Cancer": "Moon", "Leo": "Sun", "Virgo": "Mercury",
    "Libra": "Venus", "Scorpio": "Mars", "Sagittarius": "Jupiter",
    "Capricorn": "Saturn", "Aquarius": "Saturn", "Pisces": "Jupiter",
}

# ---------------------------------------------------------------------------
# 1. Varna (1 point) — spiritual/caste level
#    Brahmin(4) > Kshatriya(3) > Vaishya(2) > Shudra(1)
# ---------------------------------------------------------------------------

# Element-based Varna (BPHS / Parashari standard):
#   Fire  (Aries, Leo, Sagittarius)     → Kshatriya
#   Earth (Taurus, Virgo, Capricorn)    → Vaishya
#   Air   (Gemini, Libra, Aquarius)     → Shudra
#   Water (Cancer, Scorpio, Pisces)     → Brahmin
_VARNA = {
    "Aries": "Kshatriya", "Taurus": "Vaishya",   "Gemini": "Shudra",
    "Cancer": "Brahmin",  "Leo": "Kshatriya",    "Virgo": "Vaishya",
    "Libra": "Shudra",   "Scorpio": "Brahmin",  "Sagittarius": "Kshatriya",
    "Capricorn": "Vaishya", "Aquarius": "Shudra", "Pisces": "Brahmin",
}
_VARNA_RANK = {"Brahmin": 4, "Kshatriya": 3, "Vaishya": 2, "Shudra": 1}

def _varna_score(boy_sign: str, girl_sign: str) -> float:
    b = _VARNA_RANK.get(_VARNA.get(boy_sign, ""), 0)
    g = _VARNA_RANK.get(_VARNA.get(girl_sign, ""), 0)
    return 1.0 if b >= g else 0.0

# ---------------------------------------------------------------------------
# 2. Vasya (2 points) — mutual attraction
#    Lookup table from imarriages.com: rows=girl varga, cols=boy varga
# ---------------------------------------------------------------------------

_VASYA_VARGA: Dict[str, str] = {
    "Aries":       "Chatushpada",
    "Taurus":      "Chatushpada",
    "Leo":         "Vanachara",
    "Sagittarius": "Manava",
    "Capricorn":   "Jalchar",
    "Gemini":      "Manava",
    "Virgo":       "Manava",
    "Libra":       "Manava",
    "Aquarius":    "Manava",
    "Cancer":      "Jalchar",
    "Pisces":      "Jalchar",
    "Scorpio":     "Keeta",
}

_VASYA_ORDER = ["Chatushpada", "Manava", "Jalchar", "Vanachara", "Keeta"]
_VASYA_IDX: Dict[str, int] = {v: i for i, v in enumerate(_VASYA_ORDER)}

# Compatibility table[girl_varga_idx][boy_varga_idx]
#                   Chat  Mana  Jal   Vana  Keeta  ← boy
_VASYA_TABLE = [
    [2.0, 0.5, 1.0, 0.0, 2.0],  # Chatushpada (girl)
    [0.5, 2.0, 0.0, 0.0, 0.0],  # Manava      (girl)
    [1.0, 0.0, 2.0, 2.0, 2.0],  # Jalchar     (girl)
    [0.0, 0.0, 2.0, 2.0, 0.0],  # Vanachara   (girl)
    [2.0, 0.0, 2.0, 0.0, 2.0],  # Keeta       (girl)
]

def _vasya_score(boy_sign: str, girl_sign: str) -> float:
    bi = _VASYA_IDX.get(_VASYA_VARGA.get(boy_sign, ""), -1)
    gi = _VASYA_IDX.get(_VASYA_VARGA.get(girl_sign, ""), -1)
    if bi < 0 or gi < 0:
        return 0.0
    return _VASYA_TABLE[gi][bi]

# ---------------------------------------------------------------------------
# 3. Tara (3 points) — birth star compatibility
#    Count nakshatras from girl's to boy's, and vice versa (mod 9, 1-based)
#    Auspicious: 2 Sampat, 4 Kshema, 6 Sadhak, 8 Mitra, 9 Parama Mitra
#    Inauspicious: 3 Vipat, 5 Pratyak, 7 Nidhan  |  Neutral: 1 Janma
# ---------------------------------------------------------------------------

def _tara_index(from_nak: int, to_nak: int) -> int:
    """Return 1-indexed Tara position (1=Janma … 9=Ati-Mitra)."""
    return ((to_nak - from_nak) % 27) % 9 + 1

def _tara_score(boy_nak: int, girl_nak: int) -> float:
    # Auspicious taras: 1,2,4,6,8,9  |  Inauspicious: 3,5,7
    # Both directions are required — single-direction misses all 1.5 cases.
    b = _tara_index(girl_nak, boy_nak)   # boy's tara counted from girl's nak
    g = _tara_index(boy_nak, girl_nak)   # girl's tara counted from boy's nak
    AUSPICIOUS = {1, 2, 4, 6, 8, 9}
    b_ok = b in AUSPICIOUS
    g_ok = g in AUSPICIOUS
    if b_ok and g_ok:
        return 3.0
    elif b_ok or g_ok:
        return 1.5
    return 0.0

# ---------------------------------------------------------------------------
# 4. Yoni (4 points) — biological compatibility
#    Flat lookup table from imarriages.com Yoni Compatibility Chart
# ---------------------------------------------------------------------------

_YONI_ANIMAL = [
    "Horse",    # 0  Ashwini
    "Elephant", # 1  Bharani
    "Goat",     # 2  Krittika
    "Serpent",  # 3  Rohini
    "Serpent",  # 4  Mrigashira
    "Dog",      # 5  Ardra
    "Cat",      # 6  Punarvasu
    "Goat",     # 7  Pushya
    "Cat",      # 8  Ashlesha
    "Rat",      # 9  Magha
    "Rat",      # 10 Purva Phalguni
    "Cow",      # 11 Uttara Phalguni
    "Buffalo",  # 12 Hasta
    "Tiger",    # 13 Chitra
    "Buffalo",  # 14 Swati
    "Tiger",    # 15 Vishakha
    "Hare",     # 16 Anuradha
    "Hare",     # 17 Jyeshtha
    "Dog",      # 18 Mula
    "Monkey",   # 19 Purva Ashadha
    "Mongoose", # 20 Uttara Ashadha
    "Monkey",   # 21 Shravana
    "Lion",     # 22 Dhanishtha
    "Horse",    # 23 Shatabhisha
    "Lion",     # 24 Purva Bhadrapada
    "Cow",      # 25 Uttara Bhadrapada
    "Elephant", # 26 Revati
]

# Column/row order for _YONI_TABLE
_YONI_ORDER = [
    "Horse","Elephant","Goat","Serpent","Dog","Cat",
    "Rat","Cow","Buffalo","Tiger","Hare","Monkey","Mongoose","Lion",
]
_YONI_IDX: Dict[str, int] = {a: i for i, a in enumerate(_YONI_ORDER)}

# Flat 14×14 compatibility table (row=boy animal, col=girl animal)
# Source: imarriages.com Yoni Compatibility Chart
#               Horse Eleph Goat  Serp  Dog   Cat   Rat   Cow   Buff  Tiger Hare  Monk  Mong  Lion
_YONI_TABLE = [
    [4, 2, 2, 3, 2, 2, 2, 1, 0, 1, 3, 3, 2, 1],  # Horse
    [2, 4, 3, 3, 2, 2, 2, 2, 3, 1, 2, 3, 2, 0],  # Elephant
    [2, 3, 4, 2, 1, 2, 1, 3, 3, 1, 2, 0, 3, 1],  # Goat
    [3, 3, 2, 4, 2, 1, 1, 1, 1, 2, 2, 2, 0, 2],  # Serpent
    [2, 2, 1, 2, 4, 2, 1, 2, 2, 1, 0, 2, 1, 1],  # Dog
    [2, 2, 2, 1, 2, 4, 0, 2, 2, 1, 3, 3, 2, 1],  # Cat
    [2, 2, 1, 1, 1, 0, 4, 2, 2, 2, 2, 2, 1, 2],  # Rat
    [1, 2, 3, 1, 2, 2, 2, 4, 3, 0, 3, 2, 2, 1],  # Cow
    [0, 3, 3, 1, 2, 2, 2, 3, 4, 1, 2, 2, 2, 1],  # Buffalo
    [1, 1, 1, 2, 1, 1, 2, 0, 1, 4, 1, 1, 2, 1],  # Tiger
    [3, 2, 2, 2, 0, 3, 2, 3, 2, 1, 4, 2, 2, 1],  # Hare
    [3, 3, 0, 2, 2, 3, 2, 2, 2, 1, 2, 4, 3, 2],  # Monkey
    [2, 2, 3, 0, 1, 2, 1, 2, 2, 2, 2, 3, 4, 2],  # Mongoose
    [1, 0, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 2, 4],  # Lion
]

def _yoni_score(boy_nak: int, girl_nak: int) -> float:
    bi = _YONI_IDX[_YONI_ANIMAL[boy_nak]]
    gi = _YONI_IDX[_YONI_ANIMAL[girl_nak]]
    return float(_YONI_TABLE[bi][gi])

# ---------------------------------------------------------------------------
# 5. Graha Maitri (5 points) — Moon sign lord friendship
# ---------------------------------------------------------------------------

_PLANET_FRIENDS: Dict[str, List[str]] = {
    "Sun":     ["Moon", "Mars", "Jupiter"],
    "Moon":    ["Sun", "Mercury"],
    "Mars":    ["Sun", "Moon", "Jupiter"],
    "Mercury": ["Sun", "Venus"],
    "Jupiter": ["Sun", "Moon", "Mars"],
    "Venus":   ["Mercury", "Saturn"],
    "Saturn":  ["Mercury", "Venus"],
    "Rahu":    ["Venus", "Saturn"],
    "Ketu":    ["Mars", "Venus", "Saturn"],
}
_PLANET_ENEMIES: Dict[str, List[str]] = {
    "Sun":     ["Venus", "Saturn"],
    "Moon":    ["None"],
    "Mars":    ["Mercury"],
    "Mercury": ["Moon"],
    "Jupiter": ["Mercury", "Venus"],
    "Venus":   ["Sun", "Moon"],
    "Saturn":  ["Sun", "Moon", "Mars"],
    "Rahu":    ["Sun", "Moon", "Mars"],
    "Ketu":    ["Sun", "Moon"],
}

def _planet_rel(p1: str, p2: str) -> str:
    """friend / neutral / enemy"""
    if p2 in _PLANET_FRIENDS.get(p1, []):
        return "friend"
    if p2 in _PLANET_ENEMIES.get(p1, []):
        return "enemy"
    return "neutral"

def _graha_maitri_score(boy_sign: str, girl_sign: str) -> float:
    bl = _SIGN_LORDS.get(boy_sign, "")
    gl = _SIGN_LORDS.get(girl_sign, "")
    if bl == gl:
        return 5.0
    br = _planet_rel(bl, gl)
    gr = _planet_rel(gl, bl)
    if br == "friend" and gr == "friend":
        return 5.0
    if br == "friend" and gr == "neutral":
        return 4.0
    if br == "neutral" and gr == "friend":
        return 4.0
    if br == "neutral" and gr == "neutral":
        return 3.0
    if (br == "friend" and gr == "enemy") or (br == "enemy" and gr == "friend"):
        return 1.0
    if br == "neutral" and gr == "enemy":
        return 0.5
    if br == "enemy" and gr == "neutral":
        return 0.5
    return 0.0  # both enemy

# ---------------------------------------------------------------------------
# 6. Gana (6 points) — temperament
# ---------------------------------------------------------------------------

_GANA = {
    "Ashwini": "Deva", "Mrigashira": "Deva", "Punarvasu": "Deva",
    "Pushya": "Deva", "Hasta": "Deva", "Swati": "Deva",
    "Anuradha": "Deva", "Shravana": "Deva", "Revati": "Deva",
    "Bharani": "Manav", "Rohini": "Manav", "Ardra": "Manav",
    "Purva Phalguni": "Manav", "Uttara Phalguni": "Manav",
    "Purva Ashadha": "Manav", "Uttara Ashadha": "Manav",
    "Purva Bhadrapada": "Manav", "Uttara Bhadrapada": "Manav",
    "Krittika": "Rakshasa", "Ashlesha": "Rakshasa", "Magha": "Rakshasa",
    "Chitra": "Rakshasa", "Vishakha": "Rakshasa", "Jyeshtha": "Rakshasa",
    "Mula": "Rakshasa", "Dhanishtha": "Rakshasa", "Shatabhisha": "Rakshasa",
}

def _gana_score(boy_nak_name: str, girl_nak_name: str) -> float:
    # bg = boy's gana, gg = girl's gana
    # Direction matters: girl's gana >= boy's is more acceptable
    # Hierarchy: Deva(3) > Manav(2) > Rakshasa(1)
    bg = _GANA.get(boy_nak_name, "Manav")
    gg = _GANA.get(girl_nak_name, "Manav")
    if bg == gg:
        return 6.0
    # Deva+Manav: direction matters — Dev(boy)+Manav(girl) = fully compatible (6),
    # but Manav(boy)+Dev(girl) = slight issue (5)
    if bg == "Deva" and gg == "Manav":
        return 6.0
    if bg == "Manav" and gg == "Deva":
        return 5.0
    # Deva+Rakshasa: girl Deva (higher) = 1pt; girl Rakshasa (lower) = 0
    if gg == "Deva" and bg == "Rakshasa":
        return 1.0
    if gg == "Rakshasa" and bg == "Deva":
        return 1.0
    # Manav+Rakshasa: girl Manav (higher) = 1pt; girl Rakshasa (lower) = 0
    if gg == "Manav" and bg == "Rakshasa":
        return 0.0
    if gg == "Rakshasa" and bg == "Manav":
        return 0.0
    return 0.0

# ---------------------------------------------------------------------------
# 7. Bhakut / Rashi (7 points) — Moon sign compatibility
# ---------------------------------------------------------------------------

def _bhakut_score(boy_sign: str, girl_sign: str) -> float:
    bi = ZODIAC_SIGNS.index(boy_sign)
    gi = ZODIAC_SIGNS.index(girl_sign)
    diff = abs(gi - bi) % 12 + 1
    # Inauspicious (Bhakut dosha): 2/12, 5/9, 6/8 — both sides of each pair
    inauspicious = {2, 5, 6, 8, 9, 12}
    return 0.0 if diff in inauspicious else 7.0

# ---------------------------------------------------------------------------
# 8. Nadi (8 points) — physical constitution
# ---------------------------------------------------------------------------

_NADI = [
    # Source: imarriages.com / BPHS — non-sequential assignment
    "Adi",    # 0  Ashwini
    "Madhya", # 1  Bharani
    "Antya",  # 2  Krittika
    "Antya",  # 3  Rohini
    "Madhya", # 4  Mrigashira
    "Adi",    # 5  Ardra
    "Adi",    # 6  Punarvasu
    "Madhya", # 7  Pushya
    "Antya",  # 8  Ashlesha
    "Antya",  # 9  Magha
    "Madhya", # 10 Purva Phalguni
    "Adi",    # 11 Uttara Phalguni
    "Adi",    # 12 Hasta
    "Madhya", # 13 Chitra
    "Antya",  # 14 Swati
    "Antya",  # 15 Vishakha
    "Madhya", # 16 Anuradha
    "Adi",    # 17 Jyeshtha
    "Adi",    # 18 Mula
    "Madhya", # 19 Purva Ashadha
    "Antya",  # 20 Uttara Ashadha
    "Antya",  # 21 Shravana
    "Madhya", # 22 Dhanishtha
    "Adi",    # 23 Shatabhisha
    "Adi",    # 24 Purva Bhadrapada
    "Madhya", # 25 Uttara Bhadrapada
    "Antya",  # 26 Revati
]

def _nadi_score(boy_nak: int, girl_nak: int) -> float:
    return 0.0 if _NADI[boy_nak] == _NADI[girl_nak] else 8.0

# ---------------------------------------------------------------------------
# Mangal Dosha (Kuja Dosha) check
# ---------------------------------------------------------------------------

_MANGAL_HOUSES = {1, 2, 4, 7, 8, 12}

def _has_mangal_dosha(planets: list[dict]) -> bool:
    """True if Mars occupies houses 1,2,4,7,8,12 in the chart."""
    for p in planets:
        if p.get("name") == "Mars" and int(p.get("house", 0)) in _MANGAL_DOSHA_HOUSES:
            return True
    return False

_MANGAL_DOSHA_HOUSES = _MANGAL_HOUSES  # alias


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

@dataclass
class KootScore:
    name: str
    max_score: float
    score: float
    description: str
    boy_value: str
    girl_value: str


@dataclass
class MatchResult:
    total_score: float
    max_score: float = 36.0
    percentage: float = 0.0
    grade: str = ""
    recommendation: str = ""
    koots: List[KootScore] = field(default_factory=list)

    boy_nakshatra: str = ""
    boy_nakshatra_lord: str = ""
    boy_moon_sign: str = ""
    girl_nakshatra: str = ""
    girl_nakshatra_lord: str = ""
    girl_moon_sign: str = ""

    boy_mangal_dosha: bool = False
    girl_mangal_dosha: bool = False
    mangal_dosha_cancelled: bool = False
    mangal_dosha_note: str = ""


def _grade(pct: float) -> tuple[str, str]:
    if pct >= 83.33:   return "Excellent",   "Highly compatible. Auspicious match."
    if pct >= 66.67:   return "Very Good",   "Very good compatibility. Recommended."
    if pct >= 58.33:   return "Good",         "Good match with some areas to work on."
    if pct >= 50.00:   return "Average",      "Average compatibility. Careful consideration needed."
    if pct >= 33.33:   return "Below Average","Below average. Significant differences exist."
    return "Poor",                            "Not recommended without remedies."


def calculate_match(
    boy_chart: dict,
    girl_chart: dict,
) -> dict:
    """
    Given two chart response dicts (from build_chart), compute Ashtakoot Milan.

    Returns a JSON-serialisable dict matching MatchResponse schema.
    """
    def _moon(chart: dict) -> dict:
        for p in chart.get("planets", []):
            if p["name"] == "Moon":
                return p
        return {}

    def _mars(chart: dict) -> dict:
        for p in chart.get("planets", []):
            if p["name"] == "Mars":
                return p
        return {}

    boy_moon  = _moon(boy_chart)
    girl_moon = _moon(girl_chart)

    boy_sign  = boy_moon.get("sign", "Aries")
    girl_sign = girl_moon.get("sign", "Aries")

    boy_lon  = float(boy_moon.get("longitude", 0.0))
    girl_lon = float(girl_moon.get("longitude", 0.0))

    boy_nak_idx  = int(boy_lon * 27 / 360) % 27
    girl_nak_idx = int(girl_lon * 27 / 360) % 27

    boy_nak_name  = NAKSHATRA_NAMES[boy_nak_idx]
    girl_nak_name = NAKSHATRA_NAMES[girl_nak_idx]

    # ── Compute all 8 koots ────────────────────────────────────────────────
    v1  = _varna_score(boy_sign, girl_sign)
    v2  = _vasya_score(boy_sign, girl_sign)
    t   = _tara_score(boy_nak_idx, girl_nak_idx)
    y   = _yoni_score(boy_nak_idx, girl_nak_idx)
    gm  = _graha_maitri_score(boy_sign, girl_sign)
    ga  = _gana_score(boy_nak_name, girl_nak_name)
    bh  = _bhakut_score(boy_sign, girl_sign)
    na  = _nadi_score(boy_nak_idx, girl_nak_idx)

    boy_varna  = _VARNA.get(boy_sign, "")
    girl_varna = _VARNA.get(girl_sign, "")
    boy_vasya  = _VASYA_VARGA.get(boy_sign, "")
    girl_vasya = _VASYA_VARGA.get(girl_sign, "")
    boy_gana   = _GANA.get(boy_nak_name, "Manav")
    girl_gana  = _GANA.get(girl_nak_name, "Manav")
    boy_nadi   = _NADI[boy_nak_idx]
    girl_nadi  = _NADI[girl_nak_idx]
    boy_yoni   = _YONI_ANIMAL[boy_nak_idx]
    girl_yoni  = _YONI_ANIMAL[girl_nak_idx]

    koots = [
        {"name": "Varna",        "max_score": 1, "score": v1,  "description": "Spiritual development / ego compatibility",
         "boy_value": f"{boy_varna}",  "girl_value": f"{girl_varna}"},
        {"name": "Vasya",        "max_score": 2, "score": v2,  "description": "Mutual attraction and natural control",
         "boy_value": boy_vasya,       "girl_value": girl_vasya},
        {"name": "Tara",         "max_score": 3, "score": t,   "description": "Birth star compatibility and destiny",
         "boy_value": boy_nak_name,    "girl_value": girl_nak_name},
        {"name": "Yoni",         "max_score": 4, "score": y,   "description": "Biological and sexual compatibility",
         "boy_value": boy_yoni,        "girl_value": girl_yoni},
        {"name": "Graha Maitri", "max_score": 5, "score": gm,  "description": "Moon sign lord friendship",
         "boy_value": _SIGN_LORDS.get(boy_sign, ""), "girl_value": _SIGN_LORDS.get(girl_sign, "")},
        {"name": "Gana",         "max_score": 6, "score": ga,  "description": "Nature and temperament",
         "boy_value": boy_gana,        "girl_value": girl_gana},
        {"name": "Bhakut",       "max_score": 7, "score": bh,  "description": "Moon sign pair compatibility",
         "boy_value": boy_sign,        "girl_value": girl_sign},
        {"name": "Nadi",         "max_score": 8, "score": na,  "description": "Physical constitution and health",
         "boy_value": boy_nadi,        "girl_value": girl_nadi},
    ]

    total = v1 + v2 + t + y + gm + ga + bh + na
    pct   = round(total / 36.0 * 100, 1)
    grade, recommendation = _grade(pct)

    # ── Mangal Dosha ───────────────────────────────────────────────────────
    boy_mars_house  = int(_mars(boy_chart).get("house", 0))
    girl_mars_house = int(_mars(girl_chart).get("house", 0))
    boy_md   = boy_mars_house  in _MANGAL_HOUSES
    girl_md  = girl_mars_house in _MANGAL_HOUSES
    cancelled = boy_md and girl_md
    if not boy_md and not girl_md:
        md_note = "Neither has Mangal Dosha."
    elif cancelled:
        md_note = "Both have Mangal Dosha — Dosha is cancelled (nullified)."
    elif boy_md:
        md_note = "Boy has Mangal Dosha. Girl does not. Remedies recommended."
    else:
        md_note = "Girl has Mangal Dosha. Boy does not. Remedies recommended."

    return {
        "total_score": round(total, 1),
        "max_score": 36.0,
        "percentage": pct,
        "grade": grade,
        "recommendation": recommendation,
        "koots": koots,
        "boy_nakshatra": boy_nak_name,
        "boy_nakshatra_lord": _NAK_LORDS[boy_nak_idx],
        "boy_moon_sign": boy_sign,
        "girl_nakshatra": girl_nak_name,
        "girl_nakshatra_lord": _NAK_LORDS[girl_nak_idx],
        "girl_moon_sign": girl_sign,
        "boy_mangal_dosha": boy_md,
        "girl_mangal_dosha": girl_md,
        "mangal_dosha_cancelled": cancelled,
        "mangal_dosha_note": md_note,
    }
