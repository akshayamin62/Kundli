"""
Planet sign+nakshatra transit calculation service.

For a given planet and year range this service scans through the requested
period and detects every time the planet crosses either a sign boundary
(every 30°) or a nakshatra boundary (every 13°20'). Each resulting row
represents a contiguous period in a single (sign, nakshatra) combination.

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

# 27 nakshatras at 13°20' each, starting at 0° Aries (sidereal)
NAKSHATRA_NAMES = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishtha",
    "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
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


# IST = UTC + 5h 30m = +330 minutes
_IST_OFFSET_MIN: int = 330


def _from_jd_time(jd: float) -> tuple:
    """
    Convert a Julian Day Number to (date, 'HH:MM') expressed in IST (UTC+5:30).

    JD days start at noon UTC, so adding 0.5 aligns the integer boundary with
    midnight UTC.  The fractional part of (jd + 0.5) is then the elapsed
    fraction of the UTC calendar day, from which we extract hours and minutes.
    We then apply the IST offset (+330 min), carrying over to the next date
    when the result exceeds 23:59.
    """
    jd_adj = jd + 0.5
    frac   = jd_adj - math.floor(jd_adj)

    # UTC minutes since midnight (rounded to nearest minute)
    total_min_utc = int(round(frac * 24.0 * 60.0))

    # Handle rounding that pushes us to the next day (e.g. 1440 → 00:00 +1d)
    day_carry = total_min_utc // 1440
    total_min_utc %= 1440

    d_utc = _from_jd(jd)
    if day_carry:
        d_utc = d_utc + timedelta(days=day_carry)

    # Apply IST offset
    total_min_ist = total_min_utc + _IST_OFFSET_MIN
    if total_min_ist >= 1440:
        d_ist = d_utc + timedelta(days=1)
        total_min_ist -= 1440
    else:
        d_ist = d_utc

    h = total_min_ist // 60
    m = total_min_ist % 60
    return d_ist, f"{h:02d}:{m:02d}"


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


def _nakshatra_of(lon: float) -> int:
    """Return 0-indexed nakshatra (0 = Ashwini … 26 = Revati)."""
    return int(lon * 27.0 / 360.0) % 27


def _segment_of(lon: float) -> tuple:
    """Return (sign_idx, nak_idx) for the current ecliptic longitude."""
    return (_sign_of(lon), _nakshatra_of(lon))


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


def _refine_segment_crossing(
    planet: str,
    jd_before: float,
    jd_after: float,
    prev_seg: tuple,
    sidereal: bool,
) -> float:
    """
    Find the first day the planet leaves *prev_seg* using a single bulk call
    instead of N individual get_planet_positions calls.
    """
    day_jds: list = []
    jd = jd_before + 1.0
    while jd <= jd_after:
        day_jds.append(jd)
        jd += 1.0
    if not day_jds:
        return jd_after
    aya_arr = [get_ayanamsa(jd) if sidereal else 0.0 for jd in day_jds]
    lon_arr = get_planet_longitudes_bulk(day_jds, planet, aya_arr)
    for jd, lon in zip(day_jds, lon_arr):
        if _segment_of(lon) != prev_seg:
            return jd
    return jd_after


def _refine_segment_hour(
    planet: str,
    jd_day: float,
    prev_seg: tuple,
    sidereal: bool,
) -> tuple:
    """
    Find the exact minute of a segment crossing using two bulk calls:
      Stage 1 — 26 hourly points over [jd_day-1, jd_day]: identifies which
                1-hour window contains the crossing.
      Stage 2 — 62 minute points within that 1-hour window: resolves the
                crossing to ±30-second precision.
    Returns (crossing_jd, retrograde_at_crossing).
    """
    # ── Stage 1: hourly scan ────────────────────────────────────────────────
    hour_jds = [jd_day - 1.0 + h / 24.0 for h in range(26)]
    aya_h    = [get_ayanamsa(jd) if sidereal else 0.0 for jd in hour_jds]
    lon_h    = get_planet_longitudes_bulk(hour_jds, planet, aya_h)

    hour_idx = len(hour_jds) - 1
    for i, lon in enumerate(lon_h):
        if _segment_of(lon) != prev_seg:
            hour_idx = i
            break

    # ── Stage 2: minute scan within [hour_before, hour_crossing] ───────────
    min_start = hour_jds[max(0, hour_idx - 1)]
    minute_jds = [min_start + m / (24.0 * 60.0) for m in range(62)]
    aya_m      = [get_ayanamsa(jd) if sidereal else 0.0 for jd in minute_jds]
    lon_m      = get_planet_longitudes_bulk(minute_jds, planet, aya_m)

    crossing_idx = len(minute_jds) - 1
    for i, lon in enumerate(lon_m):
        if _segment_of(lon) != prev_seg:
            crossing_idx = i
            break

    crossing_jd = minute_jds[crossing_idx]

    # Retrograde: sign of longitude change around the crossing point
    if crossing_idx > 0:
        diff = (lon_m[crossing_idx] - lon_m[crossing_idx - 1] + 180.0) % 360.0 - 180.0
    elif len(lon_m) > 1:
        diff = (lon_m[1] - lon_m[0] + 180.0) % 360.0 - 180.0
    else:
        diff = -0.05 if planet in ("Rahu", "Ketu") else 0.05

    retrograde = diff < 0
    return crossing_jd, retrograde


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
      "sign":        str,
      "nakshatra":   str,
      "entry_date":  ISO str,  "entry_time": "HH:MM" (IST),
      "exit_date":   ISO str,  "exit_time":  "HH:MM" (IST),
      "retrograde":  bool,
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
    # Each entry tracks the period spent in one (sign, nakshatra) segment.
    # raw: list of (entry_jd, exit_jd, sign_idx, nak_idx, retrograde)
    raw: list = []
    prev_seg: tuple | None = None
    entry_jd: float = jd_scan_start
    entry_retro: bool = False

    for i, (scan_jd, lon) in enumerate(zip(jd_scan_arr, lon_arr)):
        seg = _segment_of(lon)

        if prev_seg is None:
            prev_seg = seg
            entry_jd = scan_jd
            entry_retro = False
        elif seg != prev_seg:
            if step > 1:
                # Slow planet: narrow to the exact day, then to the exact hour
                day_jd   = _refine_segment_crossing(planet, scan_jd - step, scan_jd, prev_seg, sidereal)
                exact_jd, cross_retro = _refine_segment_hour(planet, day_jd, prev_seg, sidereal)
            elif planet == "Moon":
                # Moon never retrogrades; scan already gives ±12 h precision
                exact_jd   = scan_jd
                cross_retro = False
            else:
                # step=1, non-Moon: binary search for sub-hour precision
                exact_jd, cross_retro = _refine_segment_hour(planet, scan_jd, prev_seg, sidereal)

            raw.append((entry_jd, exact_jd, prev_seg[0], prev_seg[1], entry_retro))
            prev_seg    = seg
            entry_jd    = exact_jd
            entry_retro = cross_retro

    # Close the last open segment
    if prev_seg is not None:
        last_jd = jd_scan_arr[-1] if jd_scan_arr else jd_scan_end
        raw.append((entry_jd, last_jd, prev_seg[0], prev_seg[1], entry_retro))

    # ── Filter + format ──────────────────────────────────────────────────────
    transits: List[Dict] = []
    for (e_jd, x_jd, s_idx, n_idx, retro) in raw:
        # Include only transits overlapping the user's requested window
        if x_jd <= filter_jd_start or e_jd >= filter_jd_end:
            continue
        e_date, e_time = _from_jd_time(e_jd)
        x_date, x_time = _from_jd_time(x_jd)
        transits.append({
            "sign":        ZODIAC_SIGNS[s_idx],
            "nakshatra":   NAKSHATRA_NAMES[n_idx],
            "entry_date":  e_date.isoformat(),
            "entry_time":  e_time,
            "exit_date":   x_date.isoformat(),
            "exit_time":   x_time,
            "retrograde":  retro,
        })

    return transits
