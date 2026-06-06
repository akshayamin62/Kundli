from pydantic import BaseModel, field_validator
from typing import Literal, Optional


class ChartRequest(BaseModel):
    name: Optional[str] = None
    save_history: bool = True
    history_id: Optional[str] = None
    birth_date: str          # "YYYY-MM-DD"
    birth_time: str          # "HH:MM" or "HH:MM:SS"
    birth_place: str = ""    # "Mumbai, India" — optional when birth_lat/birth_lon provided
    birth_lat: Optional[float] = None   # decimal degrees, e.g. 22.3072
    birth_lon: Optional[float] = None   # decimal degrees, e.g. 73.1812
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
    history_id: Optional[str] = None


class PitruDoshaSignFinding(BaseModel):
    combination: str
    sign: str
    detail: str
    rahu_sign: Optional[str] = None
    ketu_sign: Optional[str] = None
    sign_wise_impact: Optional[str] = None
    sign_wise_severity: Optional[str] = None
    nature_theme: Optional[str] = None
    stronger_houses: Optional[str] = None


class PitruDoshaHouseFinding(BaseModel):
    combination: str
    sign: str
    house: int
    house_label: str
    detail: str
    rahu_sign: Optional[str] = None
    ketu_sign: Optional[str] = None
    rahu_house: Optional[int] = None
    ketu_house: Optional[int] = None
    house_wise_impact: Optional[str] = None
    house_wise_severity: Optional[str] = None
    health_focus: Optional[str] = None


class PitruDoshaResponse(BaseModel):
    janma_rashi: Optional[str] = None
    present: bool
    confirmation_count: int
    sign_findings: list[PitruDoshaSignFinding]
    house_findings: list[PitruDoshaHouseFinding]
    disclaimer: str


class VargaRequest(ChartRequest):
    n: int = 9  # which D-chart (1–60)


class VargaBulkRequest(ChartRequest):
    ns: list[int]  # varga numbers to compute, e.g. [2, 3, ..., 60]


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
    nakshatra: str
    entry_date: str
    entry_time: str  # "HH:MM" UTC
    exit_date: str
    exit_time: str   # "HH:MM" UTC
    retrograde: bool


class TransitResponse(BaseModel):
    planet: str
    zodiac: str
    transits: list[TransitEntry]


# ── Kundli Milan (Ashtakoot Matching) ─────────────────────────────────────

class MatchPersonRequest(ChartRequest):
    name: str = ""


class MatchRequest(BaseModel):
    boy: MatchPersonRequest
    girl: MatchPersonRequest
    save_history: bool = True
    history_id: Optional[str] = None


class MatchKoot(BaseModel):
    name: str
    max_score: float
    score: float
    description: str
    boy_value: str
    girl_value: str


class MatchResponse(BaseModel):
    total_score: float
    max_score: float
    percentage: float
    grade: str
    recommendation: str
    koots: list[MatchKoot]

    boy_name: str
    girl_name: str
    boy_nakshatra: str
    boy_nakshatra_lord: str
    boy_moon_sign: str
    girl_nakshatra: str
    girl_nakshatra_lord: str
    girl_moon_sign: str

    boy_mangal_dosha: bool
    girl_mangal_dosha: bool
    mangal_dosha_cancelled: bool
    mangal_dosha_note: str

    boy_chart: ChartResponse
    girl_chart: ChartResponse

    class SadsatkutResult(BaseModel):
        distance: int
        priti_shadashtak: bool
        mrityu_shadashtak: bool
        shubh_dvadashatak: bool
        ashubh_dvadashatak: bool
        shubh_navpancham: bool
        nashtan_navpancham: bool

    sadsatkut: Optional[SadsatkutResult] = None
    history_id: Optional[str] = None
