from pydantic import BaseModel, field_validator
from typing import Literal, Optional


class ChartRequest(BaseModel):
    birth_date: str          # "YYYY-MM-DD"
    birth_time: str          # "HH:MM" or "HH:MM:SS"
    birth_place: str         # "Mumbai, India"
    house_system: Literal[
        "placidus", "koch", "equal", "whole_sign", "porphyry", "regiomontanus", "campanus"
    ] = "placidus"
    zodiac: Literal["tropical", "sidereal"] = "tropical"

    @field_validator("birth_date")
    @classmethod
    def validate_date(cls, v):
        from datetime import date
        try:
            date.fromisoformat(v)
        except ValueError:
            raise ValueError("birth_date must be YYYY-MM-DD")
        return v

    @field_validator("birth_time")
    @classmethod
    def validate_time(cls, v):
        parts = v.split(":")
        if len(parts) not in (2, 3):
            raise ValueError("birth_time must be HH:MM or HH:MM:SS")
        return v


class DegreePosition(BaseModel):
    longitude: float
    sign: str
    degree: int
    minutes: int
    seconds: int
    formatted: str


class HouseCusp(BaseModel):
    number: int
    name: str
    cusp_longitude: float
    sign: str
    degree: int
    minutes: int
    seconds: int
    formatted: str


class PlanetPosition(BaseModel):
    name: str
    symbol: str
    longitude: float
    sign: str
    degree: int
    minutes: int
    seconds: int
    formatted: str
    house: int
    retrograde: bool
    speed_deg_day: float


class ChartMeta(BaseModel):
    birth_date: str
    birth_time: str
    birth_place: str
    latitude: float
    longitude: float
    timezone: str
    utc_offset: str
    utc_datetime: str
    julian_day: float
    house_system: str
    zodiac: str
    varga_n: Optional[int] = None
    varga_name: Optional[str] = None


class ChartAngles(BaseModel):
    ascendant: DegreePosition
    midheaven: DegreePosition
    descendant: DegreePosition
    imum_coeli: DegreePosition


class ChartResponse(BaseModel):
    meta: ChartMeta
    angles: ChartAngles
    houses: list[HouseCusp]
    planets: list[PlanetPosition]


class VargaRequest(ChartRequest):
    n: int = 9  # which D-chart (1–60)


# ── Vimshottari Dasha ────────────────────────────────────────────────────────

class DashaRequest(ChartRequest):
    years_ahead: int = 30


class DashaPeriod(BaseModel):
    md: str          # Mahadasha planet
    ad: str          # Antardasha planet
    pd: str          # Pratyantardasha planet
    start_date: str  # ISO date string
    end_date: str    # ISO date string


class DashaResponse(BaseModel):
    nakshatra_name: str
    nakshatra_lord: str
    periods: list[DashaPeriod]


# ── Planet Rashi Transit ─────────────────────────────────────────────────────

class TransitRequest(BaseModel):
    planet: str
    start_year: int
    end_year: int
    zodiac: Literal["tropical", "sidereal"] = "sidereal"


class TransitEntry(BaseModel):
    sign: str
    entry_date: str
    entry_time: str  # "HH:MM" UTC
    exit_date: str
    exit_time: str   # "HH:MM" UTC
    retrograde: bool


class TransitResponse(BaseModel):
    planet: str
    zodiac: str
    transits: list[TransitEntry]
