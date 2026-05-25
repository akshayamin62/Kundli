from fastapi import APIRouter, HTTPException
from app.models.schemas import ChartRequest, ChartResponse, VargaRequest, HouseCusp, PlanetPosition, DegreePosition
from app.services.chart_builder import build_chart
from app.services.geocoding import GeocodingError
from app.services.varga import varga_sign_index, ZODIAC_SIGNS, VARGA_NAMES
from app.services.astronomy import HOUSE_NAMES, longitude_to_sign_info

router = APIRouter()


def _build_varga_chart(req: VargaRequest) -> ChartResponse:
    """Compute D-N divisional chart by remapping natal longitudes."""
    n = req.n
    base = build_chart(req)

    if n == 1:
        return base

    # New ascendant sign in varga
    asc_lon = base.angles.ascendant.longitude
    new_asc_idx = varga_sign_index(asc_lon, n)

    # Helper: remap any longitude to a DegreePosition in the varga sign
    def remap_pos(lon: float) -> DegreePosition:
        new_idx  = varga_sign_index(lon, n)
        new_sign = ZODIAC_SIGNS[new_idx]
        return DegreePosition(
            longitude=lon,
            sign=new_sign,
            degree=0, minutes=0, seconds=0,
            formatted=f"0°00'00\" {new_sign}",
        )

    # Remap angles
    from app.models.schemas import ChartAngles
    new_angles = ChartAngles(
        ascendant=remap_pos(base.angles.ascendant.longitude),
        midheaven=remap_pos(base.angles.midheaven.longitude),
        descendant=remap_pos(base.angles.descendant.longitude),
        imum_coeli=remap_pos(base.angles.imum_coeli.longitude),
    )

    # Build Whole Sign houses from new ASC
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

    # Remap planets
    new_planets: list[PlanetPosition] = []
    for p in base.planets:
        new_sign_idx = varga_sign_index(p.longitude, n)
        new_sign     = ZODIAC_SIGNS[new_sign_idx]
        new_house    = (new_sign_idx - new_asc_idx) % 12 + 1
        new_planets.append(PlanetPosition(
            name=p.name,
            symbol=p.symbol,
            longitude=p.longitude,
            sign=new_sign,
            degree=0, minutes=0, seconds=0,
            formatted=f"0°00'00\" {new_sign}",
            house=new_house,
            retrograde=p.retrograde,
            speed_deg_day=p.speed_deg_day,
        ))

    from app.models.schemas import ChartMeta
    new_meta = ChartMeta(
        **{k: v for k, v in base.meta.model_dump().items() if k not in ("varga_n", "varga_name")},
        varga_n=n,
        varga_name=VARGA_NAMES.get(n, f"D{n}"),
    )

    return ChartResponse(meta=new_meta, angles=new_angles, houses=new_houses, planets=new_planets)


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
        return build_chart(req)
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
