from fastapi import APIRouter, HTTPException
from app.models.schemas import ChartRequest, ChartResponse
from app.services.chart_builder import build_chart
from app.services.geocoding import GeocodingError

router = APIRouter()


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
