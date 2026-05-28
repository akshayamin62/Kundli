"""
Planet sign-transit calculation service.

For a given planet and year range this service scans through the requested
period and detects every time the planet crosses a sign boundary (every 30°).
The result is a chronological list of (sign, entry_date, exit_date) rows.

Scanning strategy per planet:
  Moon            1-day step  (moves ~13°/day)
  Sun/Mer/Ven/Mar 1-day step  (direct + retrograde handled)
  Jupiter         8-day step  (moves ~0.08°/day)
  Saturn          14-day step (moves ~0.03°/day)
  Rahu / Ketu     14-day step (moves ~0.05°/day retrograde)
"""

from __future__ import annotations

import math
from datetime import date, timedelta
from typing import List, Dict, Any

from app.services.ephemeris import get_planet_positions, get_ayanamsa, get_planet_longitudes_bulk
from app.services.astronomy import julian_day

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

# Scan step in days for each planet
_SCAN_STEP: Dict[str, int] = {
    "Moon": 1, "Sun": 1, "Mercury": 1, "Venus": 1, "Mars": 1,
    "Jupiter": 8, "Saturn": 14, "Rahu": 14, "Ketu": 14,
}

# Hard cap on year range to keep response time reasonable
_MAX_YEARS: Dict[str, int] = {
    "Moon": 3, "Sun": 10, "Mercury": 10, "Venus": 10, "Mars": 10,
    "Jupiter": 30, "Saturn": 30, "Rahu": 30, "Ketu": 30,
}

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _jd(d: date) -> float:
    return julian_day(d.year, d.month, d.day, 0.0)


def _from_jd(jd: float) -> date:
    """Convert Julian Day Number to a calendar date (Gregorian)."""
    jd_adj = jd + 0.5
    z = int(jd_adj)
    f = jd_adj - z

    if z < 2299161:
        a = z
    else:
        alpha = int((z - 1867216.25) / 36524.25)
        a = z + 1 + alpha - alpha // 4

    b = a + 1524
    c = int((b - 122.1) / 365.25)
    d_val = int(365.25 * c)
    e = int((b - d_val) / 30.6001)

    day = b - d_val - int(30.6001 * e)
    month = e - 1 if e < 14 else e - 13
    year = c - 4716 if month > 2 else c - 4715

    return date(year, month, day)


def _from_jd_time(jd: float) -> tuple:
    """Convert JD to (date, 'HH:MM') in UTC."""
    d = _from_jd(jd)
    jd_adj = jd + 0.5
    frac = jd_adj - math.floor(jd_adj)
    total_min = round(frac * 24 * 60) % (24 * 60)
    h = total_min // 60
    m = total_min % 60
    return d, f"{h:02d}:{m:02d}"


def _planet_lon_retro(jd_val: float, planet: str, ayanamsa: float) -> tuple:
    """Return (longitude, retrograde) for the planet at the given JD."""
    positions = get_planet_positions(jd_val, ayanamsa)

    if planet == "Ketu":
        rahu = next((p for p in positions if p["name"] == "North Node"), None)
        lon = (rahu["longitude"] + 180.0) % 360.0 if rahu else 0.0
        return lon, True  # Ketu is always retrograde

    lookup = "North Node" if planet == "Rahu" else planet
    found = next((p for p in positions if p["name"] == lookup), None)
    lon = found["longitude"] if found else 0.0
    retro = found["retrograde"] if found else (planet == "Rahu")
    return lon, retro


def _planet_longitude(jd_val: float, planet: str, ayanamsa: float) -> float:
    """Return ecliptic longitude (0–360°) for the requested planet."""
    lon, _ = _planet_lon_retro(jd_val, planet, ayanamsa)
    return lon


def _sign_of(lon: float) -> int:
    return int(lon / 30.0) % 12


def _refine_crossing(
    planet: str,
    jd_before: float,
    jd_after: float,
    prev_sign: int,
    sidereal: bool,
) -> float:
    """
    Walk day-by-day in (jd_before, jd_after] to pinpoint the first day
    the planet leaves *prev_sign*.  Returns the JD (midnight) of that day.
    """
    jd = jd_before + 1.0
    while jd <= jd_after:
        aya = get_ayanamsa(jd) if sidereal else 0.0
        if _sign_of(_planet_longitude(jd, planet, aya)) != prev_sign:
            return jd
        jd += 1.0
    return jd_after


def _refine_hour(
    planet: str,
    jd_day: float,
    prev_sign: int,
    sidereal: bool,
) -> tuple:
    """
    Binary search within [jd_day-1, jd_day] to find the exact hour of sign
    crossing.  Returns (crossing_jd, retrograde_at_crossing).
    10 iterations give ~1.4-minute precision.
    """
    lo = jd_day - 1.0
    hi = jd_day
    for _ in range(10):
        mid = (lo + hi) / 2.0
        aya = get_ayanamsa(mid) if sidereal else 0.0
        if _sign_of(_planet_longitude(mid, planet, aya)) != prev_sign:
            hi = mid
        else:
            lo = mid
    aya = get_ayanamsa(hi) if sidereal else 0.0
    _, retrograde = _planet_lon_retro(hi, planet, aya)
    return hi, retrograde


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_sign_transits(
    planet: str,
    start_year: int,
    end_year: int,
    zodiac: str,
) -> List[Dict]:
    """
    Return sign-transit rows for *planet*.

    The scan is expanded to (start_year-1) … (end_year+1) so that:
    • The transit ACTIVE at Jan 1 of start_year is included with its real
      entry date (which may be in the previous year).
    • The transit ACTIVE at Dec 31 of end_year shows its real exit date
      (which may fall in the following year).

    Each row: {
      "sign": str,
      "entry_date": ISO str,  "entry_time": "HH:MM" (UTC),
      "exit_date":  ISO str,  "exit_time":  "HH:MM" (UTC),
      "retrograde": bool,
    }
    """
    max_years = _MAX_YEARS.get(planet, 10)
    end_year = min(end_year, start_year + max_years)

    step     = _SCAN_STEP.get(planet, 1)
    sidereal = (zodiac == "sidereal")

    # Expand scan window by 1 year on each side
    scan_start = date(max(1700, start_year - 1), 1, 1)
    scan_end   = date(min(2200, end_year   + 1), 12, 31)
    jd_scan_start = _jd(scan_start)
    jd_scan_end   = _jd(scan_end)

    # Filter window: keep transits that overlap with this range
    filter_jd_start = _jd(date(start_year,     1,  1))
    filter_jd_end   = _jd(date(end_year + 1,   1,  1))  # exclusive upper bound

    # ── Build scan arrays (vectorised) ──────────────────────────────────────
    jd_scan_arr: list = []
    jd = jd_scan_start
    while jd <= jd_scan_end:
        jd_scan_arr.append(jd)
        jd += step

    aya_arr = [get_ayanamsa(jd) if sidereal else 0.0 for jd in jd_scan_arr]

    # Single bulk call: ~100× faster than one Skyfield call per step
    lon_arr = get_planet_longitudes_bulk(jd_scan_arr, planet, aya_arr)

    # ── Scanning phase ──────────────────────────────────────────────────────
    # Internal accumulator: list of (entry_jd, exit_jd, sign_idx, retrograde)
    raw: list = []
    prev_sign_idx: int = -1
    entry_jd: float = jd_scan_start
    entry_retro: bool = False

    for i, (scan_jd, lon) in enumerate(zip(jd_scan_arr, lon_arr)):
        s_idx = _sign_of(lon)

        if prev_sign_idx == -1:
            prev_sign_idx = s_idx
            entry_jd = scan_jd
            entry_retro = False
        elif s_idx != prev_sign_idx:
            if step > 1:
                # Slow planet: narrow to day-level, then hour-level
                day_jd   = _refine_crossing(planet, scan_jd - step, scan_jd, prev_sign_idx, sidereal)
                exact_jd, cross_retro = _refine_hour(planet, day_jd, prev_sign_idx, sidereal)
            elif planet == "Moon":
                # Moon never retrogrades; skip expensive hour refinement.
                # The scan already provides 1-day (±12 h) precision.
                exact_jd   = scan_jd
                cross_retro = False
            else:
                # step=1, non-Moon: one binary-search pass for sub-hour precision
                exact_jd, cross_retro = _refine_hour(planet, scan_jd, prev_sign_idx, sidereal)

            raw.append((entry_jd, exact_jd, prev_sign_idx, entry_retro))
            prev_sign_idx = s_idx
            entry_jd      = exact_jd
            entry_retro   = cross_retro

    # Close the last open transit
    if prev_sign_idx != -1:
        last_jd = jd_scan_arr[-1] if jd_scan_arr else jd_scan_end
        raw.append((entry_jd, last_jd, prev_sign_idx, entry_retro))

    # ── Filter + format ──────────────────────────────────────────────────────
    transits: List[Dict] = []
    for (e_jd, x_jd, s_idx, retro) in raw:
        # Include only transits overlapping the user's requested window
        if x_jd <= filter_jd_start or e_jd >= filter_jd_end:
            continue
        e_date, e_time = _from_jd_time(e_jd)
        x_date, x_time = _from_jd_time(x_jd)
        transits.append({
            "sign":        ZODIAC_SIGNS[s_idx],
            "entry_date":  e_date.isoformat(),
            "entry_time":  e_time,
            "exit_date":   x_date.isoformat(),
            "exit_time":   x_time,
            "retrograde":  retro,
        })

    return transits
