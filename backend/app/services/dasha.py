"""
Vimshottari (120-year) Dasha calculation service.

The Vimshottari system assigns a ruling planet to each of the 27 nakshatras
in a repeating cycle. The Moon's nakshatra at birth determines which dasha is
active and how much of it has elapsed.

Cycle order:  Ketu(7) → Venus(20) → Sun(6) → Moon(10) → Mars(7) →
              Rahu(18) → Jupiter(16) → Saturn(19) → Mercury(17) = 120 years

Sub-dasha (antardasha) and sub-sub-dasha (pratyantardasha) are calculated
proportionally within each parent period using the standard (lord_years / 120)
ratio at each level.

Reference: standard Vimshottari procedure (Moon nakshatra → balance at birth
→ proportional bhukti/antara); Julian year = 365.25 days.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import List, Dict, Any, Union

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

DASHA_ORDER: List[str] = [
    "Ketu", "Venus", "Sun", "Moon", "Mars",
    "Rahu", "Jupiter", "Saturn", "Mercury",
]

DASHA_YEARS: Dict[str, int] = {
    "Ketu": 7, "Venus": 20, "Sun": 6, "Moon": 10, "Mars": 7,
    "Rahu": 18, "Jupiter": 16, "Saturn": 19, "Mercury": 17,
}

TOTAL_YEARS: int = 120
DAYS_PER_YEAR: float = 365.25

# Nakshatra lord: 0-indexed (Ashwini=0 … Revati=26)
NAKSHATRA_LORDS: List[str] = [
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
]

NAKSHATRA_NAMES: List[str] = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni",
    "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha",
    "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana",
    "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
]

NAK_SIZE: float = 360.0 / 27  # 13°20′


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _as_datetime(birth: Union[date, datetime]) -> datetime:
    if isinstance(birth, datetime):
        return birth
    return datetime(birth.year, birth.month, birth.day)


def _add_days(dt: datetime, days: float) -> datetime:
    """Add fractional days without per-step rounding drift."""
    return dt + timedelta(seconds=days * 86400.0)


def _nakshatra_index(moon_longitude: float) -> tuple[int, float]:
    """
    Return (nakshatra index 0–26, fraction elapsed within that nakshatra).

    At an exact nakshatra boundary the position belongs to the *next* nakshatra
    (standard convention).
    """
    lon = moon_longitude % 360.0

    # Shift by a tiny epsilon so exact 13°20′ boundaries map to the next nakshatra.
    idx = int((lon + 1e-8) / NAK_SIZE)
    if idx >= 27:
        idx = 0

    pos_in_nak = lon - idx * NAK_SIZE
    if pos_in_nak < 0:
        pos_in_nak = 0.0
    fraction = pos_in_nak / NAK_SIZE
    return idx, fraction


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def calculate_vimshottari(
    moon_longitude: float,
    birth_moment: Union[date, datetime],
    years_ahead: int = 120,
) -> Dict[str, Any]:
    """
    Calculate Vimshottari Dasha periods from birth.

    Returns a dict with:
      - nakshatra_name: Moon's birth nakshatra (English)
      - nakshatra_lord: dasha lord for that nakshatra
      - periods: list of Pratyantardasha (PD) rows with md, ad, pd,
                 start_date, end_date (ISO date strings)

    Algorithm (standard Vimshottari):
      1. Moon sidereal longitude → birth nakshatra and its lord (MD at birth).
      2. Fraction elapsed within nakshatra × MD years = elapsed at birth.
      3. Walk MD → AD → PD sequence; skip sub-periods already elapsed.
      4. First emitted row is the remaining portion of the PD active at birth.
      5. Continue through subsequent full cycles until ``years_ahead`` is reached.
    """
    nak_idx, fraction_in_nak = _nakshatra_index(moon_longitude)

    starting_lord = NAKSHATRA_LORDS[nak_idx]
    start_order_idx = DASHA_ORDER.index(starting_lord)

    birth_dt = _as_datetime(birth_moment)
    max_dt = _add_days(birth_dt, years_ahead * DAYS_PER_YEAR)

    first_md_full_days = DASHA_YEARS[starting_lord] * DAYS_PER_YEAR
    elapsed_in_md = fraction_in_nak * first_md_full_days

    periods: List[Dict[str, str]] = []
    cursor = birth_dt

    md_i = 0
    while cursor < max_dt:
        md_idx = (start_order_idx + md_i) % 9
        md_planet = DASHA_ORDER[md_idx]
        md_full_days = DASHA_YEARS[md_planet] * DAYS_PER_YEAR

        skip_md = elapsed_in_md if md_i == 0 else 0.0

        for ad_i in range(9):
            ad_idx = (md_idx + ad_i) % 9
            ad_planet = DASHA_ORDER[ad_idx]
            ad_full_days = md_full_days * DASHA_YEARS[ad_planet] / TOTAL_YEARS

            if skip_md >= ad_full_days:
                skip_md -= ad_full_days
                continue

            skip_ad = skip_md
            skip_md = 0.0

            for pd_i in range(9):
                pd_idx = (ad_idx + pd_i) % 9
                pd_planet = DASHA_ORDER[pd_idx]
                pd_full_days = ad_full_days * DASHA_YEARS[pd_planet] / TOTAL_YEARS

                if skip_ad >= pd_full_days:
                    skip_ad -= pd_full_days
                    continue

                remaining_days = pd_full_days - skip_ad
                skip_ad = 0.0

                pd_start = cursor
                pd_end = _add_days(cursor, remaining_days)

                if pd_start >= max_dt:
                    return {
                        "nakshatra_name": NAKSHATRA_NAMES[nak_idx],
                        "nakshatra_lord": starting_lord,
                        "periods": periods,
                    }

                periods.append({
                    "md": md_planet,
                    "ad": ad_planet,
                    "pd": pd_planet,
                    "start_date": pd_start.date().isoformat(),
                    "end_date": pd_end.date().isoformat(),
                })

                cursor = pd_end

        md_i += 1

    return {
        "nakshatra_name": NAKSHATRA_NAMES[nak_idx],
        "nakshatra_lord": starting_lord,
        "periods": periods,
    }
