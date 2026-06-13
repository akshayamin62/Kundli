"""
Vimshottari (120-year) Dasha calculation service.

The Vimshottari system assigns a ruling planet to each of the 27 nakshatras
in a repeating cycle. The Moon's nakshatra at birth determines which dasha is
active and how much of it has elapsed.

Cycle order:  Ketu(7) → Venus(20) → Sun(6) → Moon(10) → Mars(7) →
              Rahu(18) → Jupiter(16) → Saturn(19) → Mercury(17) = 120 years

Sub-dasha (antardasha) and sub-sub-dasha (pratyantardasha) are calculated
proportionally within each parent period.
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import List, Dict, Any

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
# Pattern repeats every 9: Ketu, Venus, Sun, Moon, Mars, Rahu, Jupiter, Saturn, Mercury
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

NAK_SIZE: float = 360.0 / 27  # ~13.333°


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _add_days(d: date, days: float) -> date:
    return d + timedelta(days=round(days))


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def calculate_vimshottari(
    moon_longitude: float,
    birth_date: date,
    years_ahead: int = 120,
) -> Dict[str, Any]:
    """
    Calculate Vimshottari Dasha periods from birth.

    Returns a dict with:
      - nakshatra_name: Moon's birth nakshatra (English)
      - nakshatra_lord: dasha lord for that nakshatra
      - periods: list of Pratyantardasha (PD) rows with md, ad, pd,
                 start_date, end_date (ISO strings)

    The list starts from birth and extends ``years_ahead`` years.

    Correct algorithm:
      1. Compute elapsed days in the first (current) Mahadasha at birth.
      2. Walk through the normal (unscaled) AD/PD sequence; skip periods
         that have already elapsed before birth.
      3. The first row is the *remaining* portion of the PD active at birth.
      4. All subsequent rows use the full unscaled durations.

    This avoids the wrong approach of rescaling all ADs/PDs to the remaining
    first-MD duration, which produces incorrect antardasha dates.
    """
    nak_idx = int(moon_longitude / NAK_SIZE) % 27
    fraction_in_nak = (moon_longitude % NAK_SIZE) / NAK_SIZE

    starting_lord = NAKSHATRA_LORDS[nak_idx]
    start_order_idx = DASHA_ORDER.index(starting_lord)

    max_date = date(min(birth_date.year + years_ahead, 9999), 12, 31)

    # Days already elapsed in the current (first) Mahadasha at the moment of birth
    first_md_full_days = DASHA_YEARS[starting_lord] * DAYS_PER_YEAR
    elapsed_in_md = fraction_in_nak * first_md_full_days

    periods: List[Dict[str, str]] = []
    cursor = birth_date   # always equals birth_date for remaining portions

    for md_i in range(9):
        md_idx = (start_order_idx + md_i) % 9
        md_planet = DASHA_ORDER[md_idx]
        md_full_days = DASHA_YEARS[md_planet] * DAYS_PER_YEAR

        # For md_i == 0 we skip elapsed days; for later MDs nothing is skipped
        skip_md = elapsed_in_md if md_i == 0 else 0.0

        for ad_i in range(9):
            ad_idx = (md_idx + ad_i) % 9
            ad_planet = DASHA_ORDER[ad_idx]
            ad_full_days = md_full_days * DASHA_YEARS[ad_planet] / TOTAL_YEARS

            if skip_md >= ad_full_days:
                # Entire AD has already elapsed before birth
                skip_md -= ad_full_days
                continue

            skip_ad = skip_md
            skip_md = 0.0   # only the first unskipped AD can have a skip offset

            for pd_i in range(9):
                pd_idx = (ad_idx + pd_i) % 9
                pd_planet = DASHA_ORDER[pd_idx]
                pd_full_days = ad_full_days * DASHA_YEARS[pd_planet] / TOTAL_YEARS

                if skip_ad >= pd_full_days:
                    # Entire PD has already elapsed before birth
                    skip_ad -= pd_full_days
                    continue

                # Remaining duration of this PD (possibly partial for the first one)
                remaining_days = pd_full_days - skip_ad
                skip_ad = 0.0

                pd_start = cursor
                pd_end = _add_days(cursor, remaining_days)

                if pd_start > max_date:
                    return {
                        "nakshatra_name": NAKSHATRA_NAMES[nak_idx],
                        "nakshatra_lord": starting_lord,
                        "periods": periods,
                    }

                periods.append({
                    "md": md_planet,
                    "ad": ad_planet,
                    "pd": pd_planet,
                    "start_date": pd_start.isoformat(),
                    "end_date": pd_end.isoformat(),
                })

                cursor = pd_end

    return {
        "nakshatra_name": NAKSHATRA_NAMES[nak_idx],
        "nakshatra_lord": starting_lord,
        "periods": periods,
    }
