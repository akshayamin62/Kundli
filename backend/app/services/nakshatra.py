"""
Nakshatra & Charan (Pada 1–4) from sidereal ecliptic longitude.
Shared by Kundli Milan, Dasha, and chart utilities.
"""

from __future__ import annotations

from typing import TypedDict

NAKSHATRA_NAMES = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni",
    "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha",
    "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana",
    "Dhanishtha", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
]

NAK_LORDS = [
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
]

NAK_SIZE = 360.0 / 27.0


class NakshatraInfo(TypedDict):
    index: int
    name: str
    lord: str
    charan: int


def nakshatra_from_longitude(longitude: float) -> NakshatraInfo:
    """
    Return nakshatra index (0–26), English name, dasha lord, and charan (1–4).

    At exact nakshatra boundaries the position belongs to the next nakshatra
    (same convention as Vimshottari dasha).
    """
    lon = longitude % 360.0
    if lon < 0:
        lon += 360.0
    idx = int((lon + 1e-8) / NAK_SIZE)
    if idx >= 27:
        idx = 0

    pos_in_nak = lon - idx * NAK_SIZE
    if pos_in_nak < 0:
        pos_in_nak = 0.0

    charan = int(pos_in_nak / (NAK_SIZE / 4.0)) + 1
    charan = min(max(charan, 1), 4)

    return {
        "index": idx,
        "name": NAKSHATRA_NAMES[idx],
        "lord": NAK_LORDS[idx],
        "charan": charan,
    }
