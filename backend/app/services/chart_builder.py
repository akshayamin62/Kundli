"""
Chart builder — orchestrates all services to produce the final chart response.
"""

from datetime import datetime
from app.models.schemas import (
    ChartRequest, ChartResponse, ChartMeta, ChartAngles,
    DegreePosition, HouseCusp, PlanetPosition,
)
from app.services.geocoding import geocode_place
from app.services.timezone_service import local_to_utc
from app.services.astronomy import (
    julian_day, delta_t, obliquity_degrees, local_sidereal_time,
    calc_mc, calc_ascendant, calculate_house_cusps,
    longitude_to_sign_info, get_house_number, HOUSE_NAMES,
)
from app.services.ephemeris import get_planet_positions, get_ayanamsa


HOUSE_SYSTEM_LABELS = {
    "placidus": "Placidus",
    "koch": "Koch",
    "equal": "Equal House",
    "whole_sign": "Whole Sign",
    "porphyry": "Porphyry",
    "regiomontanus": "Regiomontanus",
    "campanus": "Campanus",
}

ZODIAC_LABELS = {
    "tropical": "Tropical",
    "sidereal": "Sidereal",
}


def build_chart(req: ChartRequest) -> ChartResponse:
    # ------------------------------------------------------------------
    # 1. Parse input
    # ------------------------------------------------------------------
    date_parts = req.birth_date.split("-")
    year, month, day = int(date_parts[0]), int(date_parts[1]), int(date_parts[2])

    time_parts = req.birth_time.split(":")
    hour   = int(time_parts[0])
    minute = int(time_parts[1])
    second = int(time_parts[2]) if len(time_parts) == 3 else 0

    # ------------------------------------------------------------------
    # 2. Geocode
    # ------------------------------------------------------------------
    geo = geocode_place(req.birth_place)
    lat = geo["lat"]
    lon = geo["lon"]
    display_name = geo["display_name"]

    # ------------------------------------------------------------------
    # 3. Timezone → UTC
    # ------------------------------------------------------------------
    utc_dt, tz_name, utc_offset = local_to_utc(year, month, day, hour, minute, second, lat, lon)
    ut_hours = utc_dt.hour + utc_dt.minute / 60.0 + utc_dt.second / 3600.0

    # ------------------------------------------------------------------
    # 4. Julian Day
    # ------------------------------------------------------------------
    jd = julian_day(utc_dt.year, utc_dt.month, utc_dt.day, ut_hours)

    # Delta T correction → Terrestrial Time Julian Day
    dt_sec = delta_t(utc_dt.year)
    jd_tt  = jd + dt_sec / 86400.0

    # ------------------------------------------------------------------
    # 5. Core astronomical values
    # ------------------------------------------------------------------
    T      = (jd_tt - 2451545.0) / 36525.0
    eps    = obliquity_degrees(T)
    ramc   = local_sidereal_time(jd_tt, lon)   # RAMC in degrees
    mc     = calc_mc(ramc, eps)
    asc    = calc_ascendant(ramc, eps, lat)

    # ------------------------------------------------------------------
    # 6. Ayanamsa (for sidereal)
    # ------------------------------------------------------------------
    ayanamsa = get_ayanamsa(jd) if req.zodiac == "sidereal" else 0.0

    if req.zodiac == "sidereal":
        mc  = (mc  - ayanamsa) % 360.0
        asc = (asc - ayanamsa) % 360.0

    # ------------------------------------------------------------------
    # 7. House cusps
    # ------------------------------------------------------------------
    cusps = calculate_house_cusps(req.house_system, ramc, eps, lat, mc, asc)

    # ------------------------------------------------------------------
    # 8. Planet positions
    # ------------------------------------------------------------------
    planets_raw = get_planet_positions(jd, ayanamsa)

    # ------------------------------------------------------------------
    # 9. Assemble response
    # ------------------------------------------------------------------
    ic  = (mc + 180.0) % 360.0
    dsc = (asc + 180.0) % 360.0

    def make_deg_pos(lon_val: float) -> DegreePosition:
        info = longitude_to_sign_info(lon_val)
        return DegreePosition(**info)

    angles = ChartAngles(
        ascendant=make_deg_pos(asc),
        midheaven=make_deg_pos(mc),
        descendant=make_deg_pos(dsc),
        imum_coeli=make_deg_pos(ic),
    )

    house_list = []
    for i, cusp_lon in enumerate(cusps):
        info = longitude_to_sign_info(cusp_lon)
        house_list.append(HouseCusp(
            number=i + 1,
            name=HOUSE_NAMES[i + 1],
            cusp_longitude=info["longitude"],
            sign=info["sign"],
            degree=info["degree"],
            minutes=info["minutes"],
            seconds=info["seconds"],
            formatted=info["formatted"],
        ))

    planet_list = []
    for p in planets_raw:
        info = longitude_to_sign_info(p["longitude"])
        house_num = get_house_number(p["longitude"], cusps)
        planet_list.append(PlanetPosition(
            name=p["name"],
            symbol=p["symbol"],
            longitude=info["longitude"],
            sign=info["sign"],
            degree=info["degree"],
            minutes=info["minutes"],
            seconds=info["seconds"],
            formatted=info["formatted"],
            house=house_num,
            retrograde=p["retrograde"],
            speed_deg_day=round(p["speed"], 6),
        ))

    # Always include South Node (Ketu) in backend output so frontend treats
    # it exactly like all other planets.
    north_node = next((pl for pl in planet_list if pl.name == "North Node"), None)
    if north_node is not None:
        ketu_lon = (north_node.longitude + 180.0) % 360.0
        ketu_info = longitude_to_sign_info(ketu_lon)
        ketu_house = get_house_number(ketu_lon, cusps)
        planet_list.append(PlanetPosition(
            name="South Node",
            symbol="☋",
            longitude=ketu_info["longitude"],
            sign=ketu_info["sign"],
            degree=ketu_info["degree"],
            minutes=ketu_info["minutes"],
            seconds=ketu_info["seconds"],
            formatted=ketu_info["formatted"],
            house=ketu_house,
            retrograde=north_node.retrograde,
            speed_deg_day=round(north_node.speed_deg_day, 6),
        ))

    meta = ChartMeta(
        birth_date=req.birth_date,
        birth_time=req.birth_time,
        birth_place=display_name,
        latitude=round(lat, 6),
        longitude=round(lon, 6),
        timezone=tz_name,
        utc_offset=utc_offset,
        utc_datetime=utc_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
        julian_day=round(jd, 6),
        house_system=HOUSE_SYSTEM_LABELS.get(req.house_system, req.house_system),
        zodiac=ZODIAC_LABELS.get(req.zodiac, req.zodiac),
    )

    return ChartResponse(meta=meta, angles=angles, houses=house_list, planets=planet_list)
