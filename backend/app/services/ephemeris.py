"""
Ephemeris service for planetary positions.

Accuracy priority:
1) Swiss Ephemeris (pyswisseph) when installed.
2) Skyfield + JPL DE421 ephemeris (high accuracy fallback).
3) Internal low-precision mathematical fallback (last resort).
"""

from __future__ import annotations

import math
from pathlib import Path

# ---------------------------------------------------------------------------
# Planet metadata
# ---------------------------------------------------------------------------

PLANET_META = [
    {"name": "Sun", "symbol": "☉"},
    {"name": "Moon", "symbol": "☽"},
    {"name": "Mercury", "symbol": "☿"},
    {"name": "Venus", "symbol": "♀"},
    {"name": "Mars", "symbol": "♂"},
    {"name": "Jupiter", "symbol": "♃"},
    {"name": "Saturn", "symbol": "♄"},
    {"name": "North Node", "symbol": "☊"},
]


def _norm(x: float) -> float:
    return x % 360.0


def _signed_angle_diff_deg(a2: float, a1: float) -> float:
    """Return signed angular difference a2-a1 in range [-180, 180)."""
    return ((a2 - a1 + 180.0) % 360.0) - 180.0


# ---------------------------------------------------------------------------
# Swiss Ephemeris (best if available)
# ---------------------------------------------------------------------------


def _get_positions_swisseph(jd_ut: float, ayanamsa: float) -> list[dict]:
    import swisseph as swe

    swe_ids = [
        swe.SUN,
        swe.MOON,
        swe.MERCURY,
        swe.VENUS,
        swe.MARS,
        swe.JUPITER,
        swe.SATURN,
        swe.TRUE_NODE,
    ]

    positions = []
    for i, planet_id in enumerate(swe_ids):
        flags = swe.FLG_SWIEPH | swe.FLG_SPEED
        pos, _ = swe.calc_ut(jd_ut, planet_id, flags)
        lon = _norm(pos[0] - ayanamsa)
        positions.append(
            {
                **PLANET_META[i],
                "longitude_raw": pos[0],
                "longitude": lon,
                "latitude": pos[1],
                "distance": pos[2],
                "speed": pos[3],
                "retrograde": pos[3] < 0,
            }
        )
    return positions


# ---------------------------------------------------------------------------
# Skyfield + JPL (high-accuracy fallback)
# ---------------------------------------------------------------------------

_SKYFIELD_TS = None
_SKYFIELD_EPH = None


def _load_skyfield_ephemeris():
    """Lazy-load Skyfield timescale and DE421 kernel into a local cache folder."""
    global _SKYFIELD_TS, _SKYFIELD_EPH

    if _SKYFIELD_TS is not None and _SKYFIELD_EPH is not None:
        return _SKYFIELD_TS, _SKYFIELD_EPH

    from skyfield.api import Loader

    data_dir = Path(__file__).resolve().parents[2] / "ephemeris_data"
    data_dir.mkdir(parents=True, exist_ok=True)

    loader = Loader(str(data_dir))
    _SKYFIELD_TS = loader.timescale()
    _SKYFIELD_EPH = loader("de421.bsp")
    return _SKYFIELD_TS, _SKYFIELD_EPH


def _mean_node_longitude(jd_ut: float) -> float:
    """Mean lunar node longitude (degrees)."""
    T = (jd_ut - 2451545.0) / 36525.0
    return _norm(125.0445 - 1934.1362 * T)


def _get_positions_skyfield(jd_ut: float, ayanamsa: float) -> list[dict]:
    ts, eph = _load_skyfield_ephemeris()

    earth = eph["earth"]
    t0 = ts.ut1_jd(jd_ut)
    t1 = ts.ut1_jd(jd_ut + 1.0)

    body_keys = [
        "sun",
        "moon",
        "mercury",
        "venus",
        "mars",
        "jupiter barycenter",
        "saturn barycenter",
    ]

    results: list[dict] = []

    for i, key in enumerate(body_keys):
        body = eph[key]

        app0 = earth.at(t0).observe(body).apparent()
        lat0, lon0, dist0 = app0.ecliptic_latlon(epoch="date")
        lon_deg = _norm(lon0.degrees - ayanamsa)

        app1 = earth.at(t1).observe(body).apparent()
        _, lon1, _ = app1.ecliptic_latlon(epoch="date")
        lon1_deg = _norm(lon1.degrees - ayanamsa)

        speed = _signed_angle_diff_deg(lon1_deg, lon_deg)

        results.append(
            {
                **PLANET_META[i],
                "longitude_raw": lon0.degrees,
                "longitude": lon_deg,
                "latitude": lat0.degrees,
                "distance": float(dist0.au),
                "speed": speed,
                "retrograde": speed < 0,
            }
        )

    node_raw = _mean_node_longitude(jd_ut)
    node_lon = _norm(node_raw - ayanamsa)
    results.append(
        {
            **PLANET_META[7],
            "longitude_raw": node_raw,
            "longitude": node_lon,
            "latitude": 0.0,
            "distance": 0.0,
            "speed": -0.053,
            "retrograde": True,
        }
    )

    return results


# ---------------------------------------------------------------------------
# Internal fallback (last resort, low precision)
# ---------------------------------------------------------------------------


def _mean_longitude(jd: float) -> list[dict]:
    """
    Low-precision fallback planetary longitudes.
    Approximate accuracy: around 1-2 degrees for major bodies.
    """
    d = jd - 2451545.0
    T = d / 36525.0

    L0_sun = _norm(280.46646 + 36000.76983 * T)
    M_sun = math.radians(_norm(357.52911 + 35999.05029 * T))
    C_sun = (
        (1.914602 - 0.004817 * T - 0.000014 * T * T) * math.sin(M_sun)
        + (0.019993 - 0.000101 * T) * math.sin(2 * M_sun)
        + 0.000289 * math.sin(3 * M_sun)
    )
    sun_lon = _norm(L0_sun + C_sun)

    L_moon = _norm(218.3165 + 481267.8813 * T)
    M_moon = math.radians(_norm(134.9634 + 477198.8676 * T))
    D_moon = math.radians(_norm(297.8502 + 445267.1115 * T))
    F_moon = math.radians(_norm(93.2721 + 483202.0175 * T))
    moon_lon = _norm(
        L_moon
        + 6.289 * math.sin(M_moon)
        - 1.274 * math.sin(2 * D_moon - M_moon)
        + 0.658 * math.sin(2 * D_moon)
        - 0.214 * math.sin(2 * M_moon)
        - 0.186 * math.sin(M_sun)
        - 0.114 * math.sin(2 * F_moon)
    )

    mercury_L = _norm(252.25 + 149472.675 * T)
    venus_L = _norm(181.98 + 58517.815 * T)
    mars_L = _norm(355.43 + 19140.299 * T)
    jup_L = _norm(34.35 + 3034.906 * T)
    sat_L = _norm(50.08 + 1222.114 * T)
    node_L = _mean_node_longitude(jd)

    # Keep in sync with PLANET_META (Sun … North Node only).
    raw_lons = [
        sun_lon,
        moon_lon,
        mercury_L,
        venus_L,
        mars_L,
        jup_L,
        sat_L,
        node_L,
    ]

    speeds = [
        0.9856,
        13.176,
        4.092,
        1.602,
        0.524,
        0.083,
        0.033,
        -0.053,
    ]

    positions = []
    for i, lon in enumerate(raw_lons):
        positions.append(
            {
                **PLANET_META[i],
                "longitude_raw": lon,
                "longitude": lon,
                "latitude": 0.0,
                "distance": 1.0,
                "speed": speeds[i],
                "retrograde": speeds[i] < 0,
            }
        )
    return positions


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def get_planet_positions(jd_ut: float, ayanamsa: float = 0.0) -> list[dict]:
    """Get planet positions with best available accuracy."""
    try:
        return _get_positions_swisseph(jd_ut, ayanamsa)
    except Exception:
        pass

    try:
        return _get_positions_skyfield(jd_ut, ayanamsa)
    except Exception:
        pass

    positions = _mean_longitude(jd_ut)
    if ayanamsa:
        for p in positions:
            p["longitude"] = _norm(p["longitude"] - ayanamsa)
    return positions


def get_ayanamsa(jd_ut: float) -> float:
    """
    Get Lahiri ayanamsa for sidereal calculations.

    Uses Swiss Ephemeris when available; otherwise a reasonable approximation.
    """
    try:
        import swisseph as swe

        return swe.get_ayanamsa_ut(jd_ut)
    except Exception:
        # Lahiri ayanamsa: ~23.857° at J2000, precesses at ~50.3"/yr = 1.397°/century
        T = (jd_ut - 2451545.0) / 36525.0
        return 23.857 + 1.397 * T


def get_planet_longitudes_bulk(
    jd_list: list,
    planet_name: str,
    ayanamsa_list: list,
) -> list:
    """
    Compute a single planet's sidereal ecliptic longitude at many JDs at once.

    Uses Skyfield's vectorised time-array API so the entire scan for a
    transit calculation is handled in one kernel call instead of N calls.
    Rahu / Ketu use the fast mean-node formula and never touch Skyfield.
    Falls back to individual get_planet_positions() calls on any error.
    """
    if not jd_list:
        return []

    # Rahu / Ketu: pure maths, no Skyfield needed
    if planet_name == "Rahu":
        return [_norm(_mean_node_longitude(jd) - aya)
                for jd, aya in zip(jd_list, ayanamsa_list)]
    if planet_name == "Ketu":
        return [_norm(_mean_node_longitude(jd) + 180.0 - aya)
                for jd, aya in zip(jd_list, ayanamsa_list)]

    _SKYFIELD_KEYS = {
        "Sun":     "sun",
        "Moon":    "moon",
        "Mercury": "mercury",
        "Venus":   "venus",
        "Mars":    "mars",
        "Jupiter": "jupiter barycenter",
        "Saturn":  "saturn barycenter",
    }

    try:
        ts, eph = _load_skyfield_ephemeris()
        key = _SKYFIELD_KEYS.get(planet_name)
        if key is None:
            raise ValueError(f"Unknown planet for bulk lookup: {planet_name}")

        earth = eph["earth"]
        body  = eph[key]

        # Single vectorised call – Skyfield computes all positions at once
        t_arr = ts.ut1_jd(jd_list)
        apps  = earth.at(t_arr).observe(body).apparent()
        _, lons, _ = apps.ecliptic_latlon(epoch="date")

        return [_norm(float(lon) - aya)
                for lon, aya in zip(lons.degrees, ayanamsa_list)]

    except Exception:
        # Graceful fallback: individual calls
        results = []
        for jd, aya in zip(jd_list, ayanamsa_list):
            try:
                positions = get_planet_positions(jd, aya)
                found = next((p for p in positions if p["name"] == planet_name), None)
                results.append(found["longitude"] if found else 0.0)
            except Exception:
                results.append(0.0)
        return results
