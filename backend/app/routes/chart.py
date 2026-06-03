from fastapi import APIRouter, Depends, HTTPException
from app.deps.auth import require_auth
from datetime import date as date_type, datetime, timezone
from typing import Optional
from bson import ObjectId
from app.models.schemas import (
    ChartRequest, ChartResponse, VargaRequest, VargaBulkRequest,
    ChartAngles, ChartMeta, HouseCusp, PlanetPosition, DegreePosition,
    DashaRequest, DashaResponse, DashaPeriod,
    TransitRequest, TransitResponse, TransitEntry,
)
from app.services.chart_builder import build_chart
from app.services.geocoding import GeocodingError
from app.services.varga import varga_sign_index, ZODIAC_SIGNS, VARGA_NAMES, varga_deg_in_sign
from app.services.astronomy import HOUSE_NAMES, longitude_to_sign_info
from app.services.dasha import calculate_vimshottari
from app.services.transit_calc import get_sign_transits
from app.database import get_history_collection

router = APIRouter(dependencies=[Depends(require_auth)])


def _kundali_input_doc(req: ChartRequest) -> dict:
    doc = {
        "name": (req.name or "").strip(),
        "birth_date": req.birth_date,
        "birth_time": req.birth_time,
        "birth_place": req.birth_place,
        "house_system": req.house_system,
        "zodiac": req.zodiac,
    }
    if req.birth_lat is not None:
        doc["birth_lat"] = req.birth_lat
    if req.birth_lon is not None:
        doc["birth_lon"] = req.birth_lon
    return doc


def _save_kundali_history(req: ChartRequest) -> Optional[str]:
    """Persist or update kundali inputs in MongoDB. Returns history document id."""
    try:
        col = get_history_collection()
        if col is None:
            return None
        input_doc = _kundali_input_doc(req)

        if req.history_id:
            oid = ObjectId(req.history_id)
            res = col.update_one(
                {"_id": oid, "type": "kundali"},
                {"$set": {"input": input_doc}},
            )
            if res.matched_count:
                return req.history_id
            return None

        if not req.save_history:
            return None

        existing = col.find_one({"type": "kundali", "input": input_doc})
        if existing is not None:
            return str(existing["_id"])

        doc = {
            "type": "kundali",
            "input": input_doc,
            "created_at": datetime.now(timezone.utc),
        }
        ins = col.insert_one(doc)
        return str(ins.inserted_id)
    except Exception:
        return None


def _remap_to_varga(base: ChartResponse, n: int) -> ChartResponse:
    """Remap an already-computed base chart to D-N. No geocoding/IO — pure computation."""
    if n == 1:
        return base

    asc_lon = base.angles.ascendant.longitude
    new_asc_idx = varga_sign_index(asc_lon, n)

    def remap_pos(lon: float) -> DegreePosition:
        new_idx  = varga_sign_index(lon, n)
        new_sign = ZODIAC_SIGNS[new_idx]
        vp       = varga_deg_in_sign(lon, n)
        deg      = int(vp)
        mf       = (vp - deg) * 60.0
        mins     = int(mf)
        secs     = int((mf - mins) * 60.0)
        return DegreePosition(
            longitude=lon,
            sign=new_sign,
            degree=deg, minutes=mins, seconds=secs,
            formatted=f"{deg}\u00b0{mins:02d}'{secs:02d}\" {new_sign}",
        )

    new_angles = ChartAngles(
        ascendant=remap_pos(base.angles.ascendant.longitude),
        midheaven=remap_pos(base.angles.midheaven.longitude),
        descendant=remap_pos(base.angles.descendant.longitude),
        imum_coeli=remap_pos(base.angles.imum_coeli.longitude),
    )

    new_houses: list[HouseCusp] = []
    for i in range(12):
        sign_idx = (new_asc_idx + i) % 12
        cusp_lon = float(sign_idx * 30)
        info = longitude_to_sign_info(cusp_lon)
        new_houses.append(HouseCusp(
            number=i + 1,
            name=HOUSE_NAMES[i + 1],
            cusp_longitude=cusp_lon,
            sign=info["sign"],
            degree=info["degree"],
            minutes=info["minutes"],
            seconds=info["seconds"],
            formatted=info["formatted"],
        ))

    new_planets: list[PlanetPosition] = []
    for p in base.planets:
        new_sign_idx = varga_sign_index(p.longitude, n)
        new_sign     = ZODIAC_SIGNS[new_sign_idx]
        new_house    = (new_sign_idx - new_asc_idx) % 12 + 1
        vp           = varga_deg_in_sign(p.longitude, n)
        deg          = int(vp)
        mf           = (vp - deg) * 60.0
        mins         = int(mf)
        secs         = int((mf - mins) * 60.0)
        new_planets.append(PlanetPosition(
            name=p.name,
            symbol=p.symbol,
            longitude=p.longitude,
            sign=new_sign,
            degree=deg, minutes=mins, seconds=secs,
            formatted=f"{deg}\u00b0{mins:02d}'{secs:02d}\" {new_sign}",
            house=new_house,
            retrograde=p.retrograde,
            speed_deg_day=p.speed_deg_day,
        ))

    new_meta = ChartMeta(
        **{k: v for k, v in base.meta.model_dump().items() if k not in ("varga_n", "varga_name")},
        varga_n=n,
        varga_name=VARGA_NAMES.get(n, f"D{n}"),
    )

    return ChartResponse(meta=new_meta, angles=new_angles, houses=new_houses, planets=new_planets)


def _build_varga_chart(req: VargaRequest) -> ChartResponse:
    """Compute D-N divisional chart by remapping natal longitudes."""
    base = build_chart(req)
    return _remap_to_varga(base, req.n)


@router.post("/chart/calculate", response_model=ChartResponse, tags=["Chart"])
def calculate_chart(req: ChartRequest):
    """
    Calculate a complete natal birth chart.

    - Geocodes birth place → latitude & longitude
    - Resolves historical timezone
    - Computes Julian Day, sidereal time, obliquity
    - Calculates Ascendant, MC, and all 12 house cusps
    - Returns positions of Sun, Moon, and all planets
    """
    try:
        chart = build_chart(req)
        history_id = _save_kundali_history(req)
        return chart.model_copy(update={"history_id": history_id})
    except GeocodingError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calculation error: {str(e)}")


@router.post("/chart/varga", response_model=ChartResponse, tags=["Varga"])
def calculate_varga(req: VargaRequest):
    """
    Calculate a D-N divisional (varga) chart.

    Supply the same birth details as /chart/calculate plus an integer **n** (1–60).
    Returns a ChartResponse with planetary signs remapped to the requested varga.
    n=1 returns the natal Rashi chart unchanged.
    """
    if req.n < 1 or req.n > 60:
        raise HTTPException(status_code=400, detail="n must be between 1 and 60")
    try:
        return _build_varga_chart(req)
    except GeocodingError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Varga calculation error: {str(e)}")


@router.post("/chart/varga-bulk", tags=["Varga"])
def calculate_varga_bulk(req: VargaBulkRequest):
    """
    Calculate multiple D-N divisional charts in a single request.

    Geocodes and builds the base natal chart once, then remaps to all
    requested vargas. Returns a dict keyed by n (as string) with ChartResponse values.
    """
    if not req.ns:
        raise HTTPException(status_code=400, detail="ns must not be empty")
    invalid = [n for n in req.ns if n < 1 or n > 60]
    if invalid:
        raise HTTPException(status_code=400, detail=f"n values out of range: {invalid}")
    try:
        base = build_chart(req)
        return {str(n): _remap_to_varga(base, n) for n in req.ns}
    except GeocodingError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bulk varga error: {str(e)}")


@router.get("/chart/house-systems", tags=["Chart"])
def list_house_systems():
    """List all supported house systems."""
    return {
        "systems": [
            {"id": "placidus",      "name": "Placidus",       "description": "Most popular in modern Western astrology. Time-based semi-arc division."},
            {"id": "koch",          "name": "Koch",            "description": "Birthplace system. Popular in Germany. Similar to Placidus."},
            {"id": "equal",         "name": "Equal House",     "description": "All houses exactly 30°. Simple and works at all latitudes."},
            {"id": "whole_sign",    "name": "Whole Sign",      "description": "Each zodiac sign = one house. Used in Vedic & Hellenistic astrology."},
            {"id": "porphyry",      "name": "Porphyry",        "description": "Divides quadrants into equal thirds. One of the oldest systems."},
            {"id": "regiomontanus", "name": "Regiomontanus",   "description": "Celestial equator division. Popular for horary astrology."},
            {"id": "campanus",      "name": "Campanus",        "description": "Prime vertical division. Used in humanistic astrology."},
        ]
    }


# ── Vimshottari Dasha ─────────────────────────────────────────────────────────

@router.post("/chart/dasha", response_model=DashaResponse, tags=["Dasha"])
def calculate_dasha(req: DashaRequest):
    """
    Calculate Vimshottari Dasha periods for a birth chart.

    Builds the natal chart, reads Moon's sidereal longitude, and computes
    all Mahadasha → Antardasha → Pratyantardasha periods from birth up to
    ``years_ahead`` years into the future.
    """
    if req.years_ahead < 1 or req.years_ahead > 120:
        raise HTTPException(status_code=400, detail="years_ahead must be between 1 and 120")
    try:
        chart = build_chart(req)
        moon = next((p for p in chart.planets if p.name == "Moon"), None)
        if moon is None:
            raise HTTPException(status_code=500, detail="Moon position not found in chart")

        parts = req.birth_date.split("-")
        birth_dt = date_type(int(parts[0]), int(parts[1]), int(parts[2]))

        result = calculate_vimshottari(moon.longitude, birth_dt, req.years_ahead)
        return DashaResponse(
            nakshatra_name=result["nakshatra_name"],
            nakshatra_lord=result["nakshatra_lord"],
            periods=[DashaPeriod(**p) for p in result["periods"]],
        )
    except GeocodingError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dasha calculation error: {str(e)}")


# ── Planet Sign Transit ───────────────────────────────────────────────────────

VALID_TRANSIT_PLANETS = {
    "Sun", "Moon", "Mercury", "Venus", "Mars",
    "Jupiter", "Saturn", "Rahu", "Ketu",
}

@router.post("/chart/transit", response_model=TransitResponse, tags=["Transit"])
def calculate_transit(req: TransitRequest):
    """
    Calculate sign transits for a single planet over a year range.

    Returns a chronological list of (sign, entry_date, exit_date) rows.
    Year range is capped per planet to keep response time reasonable.
    """
    if req.planet not in VALID_TRANSIT_PLANETS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid planet '{req.planet}'. Valid: {sorted(VALID_TRANSIT_PLANETS)}",
        )
    if req.start_year > req.end_year:
        raise HTTPException(status_code=400, detail="start_year must be ≤ end_year")
    if req.end_year - req.start_year > 30:
        raise HTTPException(status_code=400, detail="Year range cannot exceed 30 years")

    try:
        rows = get_sign_transits(req.planet, req.start_year, req.end_year, req.zodiac)
        return TransitResponse(
            planet=req.planet,
            zodiac=req.zodiac,
            transits=[TransitEntry(**r) for r in rows],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transit calculation error: {str(e)}")
