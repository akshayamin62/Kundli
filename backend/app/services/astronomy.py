"""
Core astronomical calculations.

All formulas from Jean Meeus — "Astronomical Algorithms" (2nd edition).

Covers:
  - Julian Day Number
  - Delta T correction
  - Greenwich Mean Sidereal Time (GMST)
  - Local Sidereal Time (LST / RAMC)
  - Obliquity of the ecliptic
  - Midheaven (MC)
  - Ascendant (ASC)
  - Placidus, Koch, Equal, Whole Sign, Porphyry house cusps
  - Zodiac sign / degree formatting
"""

import math
from datetime import datetime, timezone

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer",
    "Leo", "Virgo", "Libra", "Scorpio",
    "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

HOUSE_NAMES = {
    1: "Self & Personality",
    2: "Money & Possessions",
    3: "Communication & Siblings",
    4: "Home & Family",
    5: "Creativity & Romance",
    6: "Health & Service",
    7: "Partnerships & Marriage",
    8: "Transformation & Death",
    9: "Philosophy & Travel",
    10: "Career & Status",
    11: "Friends & Hopes",
    12: "Hidden Enemies & Karma",
}


# ---------------------------------------------------------------------------
# Julian Day
# ---------------------------------------------------------------------------

def julian_day(year: int, month: int, day: int, ut_hours: float) -> float:
    """
    Convert calendar date + UT hours to Julian Day Number.
    Formula: Meeus ch. 7
    """
    if month <= 2:
        year -= 1
        month += 12

    A = math.floor(year / 100)
    B = 2 - A + math.floor(A / 4)

    jd = (
        math.floor(365.25 * (year + 4716))
        + math.floor(30.6001 * (month + 1))
        + day
        + ut_hours / 24.0
        + B
        - 1524.5
    )
    return jd


# ---------------------------------------------------------------------------
# Delta T  (difference between Terrestrial Time and Universal Time)
# ---------------------------------------------------------------------------

def delta_t(year: int) -> float:
    """
    Approximate Delta T in seconds. Meeus Appendix + IERS extensions.
    Accuracy ±2 sec for 1900–2100.
    """
    y = year + 0.5  # mid-year approximation
    if y < 948:
        return 2177 + 497 * (y / 100) + 44.1 * (y / 100) ** 2
    if y < 1600:
        return 102 + 102 * (y / 100) + 25.3 * (y / 100) ** 2
    if y < 1700:
        t = y - 1600
        return 120 - 0.9808 * t - 0.01532 * t ** 2 + t ** 3 / 7129
    if y < 1800:
        t = y - 1700
        return 8.83 + 0.1603 * t - 0.0059285 * t ** 2 + 0.00013336 * t ** 3 - t ** 4 / 1174000
    if y < 1860:
        t = y - 1800
        return (
            13.72 - 0.332447 * t + 0.0068612 * t ** 2
            + 0.0041116 * t ** 3 - 0.00037436 * t ** 4
            + 0.0000121272 * t ** 5 - 0.0000001699 * t ** 6
            + 0.000000000875 * t ** 7
        )
    if y < 1900:
        t = y - 1860
        return (
            7.62 + 0.5737 * t - 0.251754 * t ** 2 + 0.01680668 * t ** 3
            - 0.0004473624 * t ** 4 + t ** 5 / 233174
        )
    if y < 1920:
        t = y - 1900
        return -2.79 + 1.494119 * t - 0.0598939 * t ** 2 + 0.0061966 * t ** 3 - 0.000197 * t ** 4
    if y < 1941:
        t = y - 1920
        return 21.20 + 0.84493 * t - 0.076100 * t ** 2 + 0.0020936 * t ** 3
    if y < 1961:
        t = y - 1950
        return 29.07 + 0.407 * t - t ** 2 / 233 + t ** 3 / 2547
    if y < 1986:
        t = y - 1975
        return 45.45 + 1.067 * t - t ** 2 / 260 - t ** 3 / 718
    if y < 2005:
        t = y - 2000
        return (
            63.86 + 0.3345 * t - 0.060374 * t ** 2
            + 0.0017275 * t ** 3 + 0.000651814 * t ** 4
            + 0.00002373599 * t ** 5
        )
    if y < 2050:
        t = y - 2000
        return 62.92 + 0.32217 * t + 0.005589 * t ** 2
    t = y - 1820
    return -20 + 32 * (t / 100) ** 2


# ---------------------------------------------------------------------------
# Sidereal Time
# ---------------------------------------------------------------------------

def gmst_degrees(jd: float) -> float:
    """
    Greenwich Mean Sidereal Time in degrees (0–360).
    Meeus ch. 12, eq. 12.4
    """
    T = (jd - 2451545.0) / 36525.0
    gmst = (
        280.46061837
        + 360.98564736629 * (jd - 2451545.0)
        + 0.000387933 * T ** 2
        - T ** 3 / 38710000.0
    )
    return gmst % 360.0


def local_sidereal_time(jd: float, longitude_deg: float) -> float:
    """
    Local Sidereal Time = GMST + geographic longitude (east positive).
    Returns degrees (0–360), also known as RAMC.
    """
    lst = (gmst_degrees(jd) + longitude_deg) % 360.0
    return lst


# ---------------------------------------------------------------------------
# Obliquity of the Ecliptic
# ---------------------------------------------------------------------------

def obliquity_degrees(T: float) -> float:
    """
    Mean obliquity of the ecliptic in degrees. Meeus eq. 22.2
    T = Julian centuries from J2000.0
    """
    eps0 = (
        23.0 + 26.0 / 60.0 + 21.448 / 3600.0
        - (46.8150 / 3600.0) * T
        - (0.00059 / 3600.0) * T ** 2
        + (0.001813 / 3600.0) * T ** 3
    )
    return eps0


# ---------------------------------------------------------------------------
# Midheaven (MC)
# ---------------------------------------------------------------------------

def calc_mc(ramc_deg: float, obliquity_deg: float) -> float:
    """
    Midheaven (10th house cusp) in ecliptic longitude degrees (0–360).
    """
    ramc = math.radians(ramc_deg)
    eps = math.radians(obliquity_deg)
    mc = math.degrees(math.atan2(math.tan(ramc), math.cos(eps)))
    # Quadrant correction
    if mc < 0:
        mc += 180.0
    if ramc_deg > 180.0:
        mc += 180.0
    return mc % 360.0


# ---------------------------------------------------------------------------
# Ascendant
# ---------------------------------------------------------------------------

def calc_ascendant(ramc_deg: float, obliquity_deg: float, latitude_deg: float) -> float:
    """
    Ascendant (1st house cusp) in ecliptic longitude degrees (0–360).
    Fails gracefully near polar latitudes (|lat| > 66°) by falling back
    to the MC + 90° approximation.
    """
    if abs(latitude_deg) >= 89.0:
        return (calc_mc(ramc_deg, obliquity_deg) + 90.0) % 360.0

    ramc = math.radians(ramc_deg)
    eps = math.radians(obliquity_deg)
    lat = math.radians(latitude_deg)

    denom = math.sin(ramc) * math.cos(eps) + math.tan(lat) * math.sin(eps)
    # atan2(cos(RAMC), -denom) gives the ascending ecliptic intersection
    # directly in [0, 360) with a single % 360 — no manual quadrant logic needed.
    asc = math.degrees(math.atan2(math.cos(ramc), -denom)) % 360.0
    return asc


# ---------------------------------------------------------------------------
# Placidus House Cusps (iterative)
# ---------------------------------------------------------------------------

def _placidus_cusp(ramc_deg: float, obliquity_deg: float, latitude_deg: float,
                   n: int, above_horizon: bool) -> float:
    """
    Calculate one Placidus cusp by iterative semi-arc method.

    n = 1 → 11th/2nd house, n = 2 → 12th/3rd house
    above_horizon = True  → houses 11, 12
    above_horizon = False → houses 2, 3
    """
    eps = math.radians(obliquity_deg)
    lat = math.radians(latitude_deg)

    # initial guess: equal house offset from RAMC
    if above_horizon:
        initial_offset = ramc_deg + n * 30.0
    else:
        initial_offset = ramc_deg + 180.0 + n * 30.0

    cusp = math.radians(initial_offset % 360.0)

    for _ in range(50):
        # Declination of ecliptic point
        sin_dec = math.sin(eps) * math.sin(cusp)
        dec = math.asin(max(-1.0, min(1.0, sin_dec)))

        # Check if point ever rises/sets at this latitude
        tan_check = math.tan(lat) * math.tan(dec)
        if abs(tan_check) > 1.0:
            # Circumpolar or never-rises — return equal house fallback
            return initial_offset % 360.0

        # Semi-arc (diurnal or nocturnal)
        if above_horizon:
            semi_arc = math.acos(-math.tan(lat) * math.tan(dec))   # diurnal
        else:
            semi_arc = math.acos(math.tan(lat) * math.tan(dec))    # nocturnal

        # Right Ascension of this ecliptic point
        ra = math.atan2(math.cos(eps) * math.sin(cusp), math.cos(cusp))

        # Ascensional difference
        asc_diff = math.asin(max(-1.0, min(1.0, math.sin(lat) * math.sin(dec) / math.cos(dec) / math.cos(lat) if math.cos(lat) != 0 else 0)))

        if above_horizon:
            target_oa = math.radians(ramc_deg) + (n / 3.0) * semi_arc
        else:
            target_oa = math.radians(ramc_deg + 180.0) + (n / 3.0) * semi_arc

        new_cusp = ra + asc_diff - (target_oa - ra - asc_diff - ra)

        # Simpler convergent update:
        # Correct cusp by the difference in oblique ascension
        oa_cusp = ra - asc_diff
        correction = target_oa - oa_cusp
        new_cusp = cusp + correction * 0.5  # damped update

        if abs(new_cusp - cusp) < math.radians(0.00001):
            break
        cusp = new_cusp

    return math.degrees(cusp) % 360.0


def placidus_cusps(ramc_deg: float, obliquity_deg: float, latitude_deg: float,
                   mc: float, asc: float) -> list[float]:
    """
    Returns list of 12 house cusps [H1, H2, ..., H12] in degrees.
    Houses 1, 4, 7, 10 are ASC, IC, DSC, MC.
    """
    ic  = (mc + 180.0) % 360.0
    dsc = (asc + 180.0) % 360.0

    h11 = _placidus_cusp(ramc_deg, obliquity_deg, latitude_deg, 1, True)
    h12 = _placidus_cusp(ramc_deg, obliquity_deg, latitude_deg, 2, True)
    h2  = _placidus_cusp(ramc_deg, obliquity_deg, latitude_deg, 1, False)
    h3  = _placidus_cusp(ramc_deg, obliquity_deg, latitude_deg, 2, False)

    # Opposite cusps
    h5 = (h11 + 180.0) % 360.0
    h6 = (h12 + 180.0) % 360.0
    h8 = (h2  + 180.0) % 360.0
    h9 = (h3  + 180.0) % 360.0

    return [asc, h2, h3, ic, h5, h6, dsc, h8, h9, mc, h11, h12]


# ---------------------------------------------------------------------------
# Koch House Cusps
# ---------------------------------------------------------------------------

def koch_cusps(ramc_deg: float, obliquity_deg: float, latitude_deg: float,
               mc: float, asc: float) -> list[float]:
    """
    Koch house system — uses birthplace oblique ascension subdivisions.
    Falls back to Placidus near polar latitudes.
    """
    if abs(latitude_deg) > 66.0:
        return placidus_cusps(ramc_deg, obliquity_deg, latitude_deg, mc, asc)

    eps = math.radians(obliquity_deg)
    lat = math.radians(latitude_deg)

    # Declination of MC
    sin_dec_mc = math.sin(eps) * math.sin(math.radians(mc))
    dec_mc = math.asin(max(-1.0, min(1.0, sin_dec_mc)))

    # Diurnal semi-arc of MC
    tan_check = math.tan(lat) * math.tan(dec_mc)
    if abs(tan_check) >= 1.0:
        return placidus_cusps(ramc_deg, obliquity_deg, latitude_deg, mc, asc)

    dsa_mc = math.acos(-math.tan(lat) * math.tan(dec_mc))
    dsa_mc_deg = math.degrees(dsa_mc)

    def _koch_cusp_longitude(offset_degrees: float) -> float:
        # Find ecliptic point whose RAMC is shifted by offset
        target_ramc = (ramc_deg - offset_degrees) % 360.0
        return calc_mc(target_ramc, obliquity_deg)

    h11 = _koch_cusp_longitude(dsa_mc_deg / 3.0)
    h12 = _koch_cusp_longitude(2.0 * dsa_mc_deg / 3.0)
    h2  = _koch_cusp_longitude(-60.0 + dsa_mc_deg / 3.0)
    h3  = _koch_cusp_longitude(-60.0 + 2.0 * dsa_mc_deg / 3.0)

    ic  = (mc + 180.0) % 360.0
    dsc = (asc + 180.0) % 360.0
    h5  = (h11 + 180.0) % 360.0
    h6  = (h12 + 180.0) % 360.0
    h8  = (h2  + 180.0) % 360.0
    h9  = (h3  + 180.0) % 360.0

    return [asc, h2, h3, ic, h5, h6, dsc, h8, h9, mc, h11, h12]


# ---------------------------------------------------------------------------
# Equal House
# ---------------------------------------------------------------------------

def equal_house_cusps(asc: float, mc: float) -> list[float]:
    ic  = (mc + 180.0) % 360.0
    dsc = (asc + 180.0) % 360.0
    return [(asc + i * 30.0) % 360.0 for i in range(12)]


# ---------------------------------------------------------------------------
# Whole Sign
# ---------------------------------------------------------------------------

def whole_sign_cusps(asc: float, mc: float) -> list[float]:
    sign_of_asc = int(asc / 30.0)
    return [(sign_of_asc * 30.0 + i * 30.0) % 360.0 for i in range(12)]


# ---------------------------------------------------------------------------
# Porphyry
# ---------------------------------------------------------------------------

def porphyry_cusps(asc: float, mc: float) -> list[float]:
    ic  = (mc + 180.0) % 360.0
    dsc = (asc + 180.0) % 360.0

    # Arc from MC to ASC (going in direction of zodiac)
    arc_mc_to_asc = (asc - mc) % 360.0
    arc_ic_to_dsc = (dsc - ic) % 360.0

    h11 = (mc  + arc_mc_to_asc / 3.0) % 360.0
    h12 = (mc  + 2.0 * arc_mc_to_asc / 3.0) % 360.0
    h2  = (ic  + arc_ic_to_dsc / 3.0) % 360.0
    h3  = (ic  + 2.0 * arc_ic_to_dsc / 3.0) % 360.0

    h5 = (h11 + 180.0) % 360.0
    h6 = (h12 + 180.0) % 360.0
    h8 = (h2  + 180.0) % 360.0
    h9 = (h3  + 180.0) % 360.0

    return [asc, h2, h3, ic, h5, h6, dsc, h8, h9, mc, h11, h12]


# ---------------------------------------------------------------------------
# Regiomontanus
# ---------------------------------------------------------------------------

def regiomontanus_cusps(ramc_deg: float, obliquity_deg: float,
                         latitude_deg: float, mc: float, asc: float) -> list[float]:
    eps = math.radians(obliquity_deg)
    lat = math.radians(latitude_deg)
    ic  = (mc + 180.0) % 360.0
    dsc = (asc + 180.0) % 360.0

    def _regiomont_cusp(n: int) -> float:
        # n = house number offset from MC (1=11th, 2=12th, -1=9th, -2=8th)
        M = math.radians((ramc_deg + n * 30.0) % 360.0)
        # Longitude of ecliptic point
        lon = math.atan2(
            math.sin(M) * math.cos(eps) - math.tan(lat) * math.sin(eps),
            math.cos(M)
        )
        lon_deg = math.degrees(lon) % 360.0
        if (ramc_deg + n * 30.0) % 360.0 > 180.0:
            lon_deg = (lon_deg + 180.0) % 360.0
        return lon_deg

    h11 = _regiomont_cusp(1)
    h12 = _regiomont_cusp(2)
    h2  = _regiomont_cusp(-5)
    h3  = _regiomont_cusp(-4)
    h5  = (h11 + 180.0) % 360.0
    h6  = (h12 + 180.0) % 360.0
    h8  = (h2  + 180.0) % 360.0
    h9  = (h3  + 180.0) % 360.0

    return [asc, h2, h3, ic, h5, h6, dsc, h8, h9, mc, h11, h12]


# ---------------------------------------------------------------------------
# Campanus
# ---------------------------------------------------------------------------

def campanus_cusps(ramc_deg: float, obliquity_deg: float,
                   latitude_deg: float, mc: float, asc: float) -> list[float]:
    eps = math.radians(obliquity_deg)
    lat = math.radians(latitude_deg)
    ic  = (mc + 180.0) % 360.0
    dsc = (asc + 180.0) % 360.0

    def _campanus_cusp(n: int) -> float:
        # Divide prime vertical into 30° segments
        pv_angle = math.radians(n * 30.0)
        lon = math.atan2(
            math.cos(pv_angle),
            -(math.sin(pv_angle) * math.cos(math.radians(ramc_deg + 90.0)) * math.cos(lat)
              - math.sin(lat) * math.sin(math.radians(ramc_deg + 90.0)))
        )
        return math.degrees(lon) % 360.0

    h11 = _campanus_cusp(11)
    h12 = _campanus_cusp(12)
    h2  = _campanus_cusp(2)
    h3  = _campanus_cusp(3)
    h5  = (h11 + 180.0) % 360.0
    h6  = (h12 + 180.0) % 360.0
    h8  = (h2  + 180.0) % 360.0
    h9  = (h3  + 180.0) % 360.0

    return [asc, h2, h3, ic, h5, h6, dsc, h8, h9, mc, h11, h12]


# ---------------------------------------------------------------------------
# House System Dispatcher
# ---------------------------------------------------------------------------

def calculate_house_cusps(
    house_system: str,
    ramc_deg: float,
    obliquity_deg: float,
    latitude_deg: float,
    mc: float,
    asc: float,
) -> list[float]:
    """
    Returns list of 12 cusp longitudes [H1..H12].
    Falls back to Equal House for polar latitudes when needed.
    """
    polar = abs(latitude_deg) > 66.0

    match house_system:
        case "placidus":
            if polar:
                return equal_house_cusps(asc, mc)
            return placidus_cusps(ramc_deg, obliquity_deg, latitude_deg, mc, asc)
        case "koch":
            if polar:
                return equal_house_cusps(asc, mc)
            return koch_cusps(ramc_deg, obliquity_deg, latitude_deg, mc, asc)
        case "equal":
            return equal_house_cusps(asc, mc)
        case "whole_sign":
            return whole_sign_cusps(asc, mc)
        case "porphyry":
            return porphyry_cusps(asc, mc)
        case "regiomontanus":
            return regiomontanus_cusps(ramc_deg, obliquity_deg, latitude_deg, mc, asc)
        case "campanus":
            return campanus_cusps(ramc_deg, obliquity_deg, latitude_deg, mc, asc)
        case _:
            return placidus_cusps(ramc_deg, obliquity_deg, latitude_deg, mc, asc)


# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------

def longitude_to_sign_info(longitude: float) -> dict:
    """Convert ecliptic longitude (0–360) to sign, degree, minutes, seconds."""
    lon = longitude % 360.0
    sign_index = int(lon / 30.0)
    within_sign = lon - sign_index * 30.0
    deg = int(within_sign)
    min_float = (within_sign - deg) * 60.0
    minutes = int(min_float)
    seconds = int((min_float - minutes) * 60.0)
    sign = ZODIAC_SIGNS[sign_index]
    return {
        "longitude": round(longitude % 360.0, 6),
        "sign": sign,
        "degree": deg,
        "minutes": minutes,
        "seconds": seconds,
        "formatted": f"{deg}°{minutes:02d}'{seconds:02d}\" {sign}",
    }


def get_house_number(planet_longitude: float, house_cusps: list[float]) -> int:
    """Return 1-based house number for a planet longitude."""
    lon = planet_longitude % 360.0
    for i in range(12):
        start = house_cusps[i] % 360.0
        end   = house_cusps[(i + 1) % 12] % 360.0
        if start < end:
            if start <= lon < end:
                return i + 1
        else:  # crosses 0° Aries
            if lon >= start or lon < end:
                return i + 1
    return 1
