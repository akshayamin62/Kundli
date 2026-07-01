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
    conventional_remedies: Optional[str] = None
    modern_remedies: Optional[str] = None


class PitruDoshaDomainImpact(BaseModel):
    area_affected: str
    impact: str
    severity: Optional[str] = None
    conventional_remedies: Optional[str] = None
    modern_remedies: Optional[str] = None


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
    domains: Optional[dict[str, PitruDoshaDomainImpact]] = None
    conventional_remedies: Optional[str] = None
    modern_remedies: Optional[str] = None


class PitruDoshaAfflictedPlanet(BaseModel):
    planet: str
    sign: str
    house: int
    reasons: list[str]


class PitruDoshaResponse(BaseModel):
    janma_rashi: Optional[str] = None
    present: bool
    confirmation_count: int
    afflicted_planets: list[PitruDoshaAfflictedPlanet] = []
    sign_findings: list[PitruDoshaSignFinding]
    house_findings: list[PitruDoshaHouseFinding]
    disclaimer: str


# ── Kaal Sarpa Yoga ──────────────────────────────────────────────────────────

class KaalSarpaTypeInfo(BaseModel):
    house: int
    name: str
    name_hi: Optional[str] = None
    name_gu: Optional[str] = None
    sanskrit: str


class KaalSarpaNodeInfo(BaseModel):
    sign: str
    house: int
    longitude: float


class RajaYogaFinding(BaseModel):
    yoga_name: str
    kendra_house: int
    trikona_house: int
    lords: list[str]
    connection: str
    afflicted: bool
    strength: str


class MahapurushaFinding(BaseModel):
    yoga: str
    planet: str
    house: int
    sign: str
    dignity: str
    afflicted: bool
    strength: str


class KaalSarpaMitigation(BaseModel):
    factor: str
    matched: bool
    detail: str
    weight: str
    severity_reduction: str
    raja_yogas: Optional[list[RajaYogaFinding]] = None
    mahapurusha_yogas: Optional[list[MahapurushaFinding]] = None


class KaalSarpaDivisionalPresence(BaseModel):
    division: int
    name: str
    area: str
    orientation: Optional[str] = None


class KaalSarpaResponse(BaseModel):
    present: bool
    type: Optional[KaalSarpaTypeInfo] = None
    orientation: Optional[str] = None
    rahu: Optional[KaalSarpaNodeInfo] = None
    ketu: Optional[KaalSarpaNodeInfo] = None
    planets_inside: Optional[list[str]] = None
    base_severity: Optional[str] = None
    effective_severity: Optional[str] = None
    impact_area: Optional[str] = None
    impact_types: Optional[str] = None
    life_domains: Optional[list[str]] = None
    conventional_remedies: Optional[str] = None
    modern_remedies: Optional[str] = None
    positive_note: Optional[str] = None
    mitigating_factors: Optional[list[KaalSarpaMitigation]] = None
    divisional_presence: Optional[list[KaalSarpaDivisionalPresence]] = None
    disclaimer: str


# ── Chandal Dosha (Guru Chandal Yoga) ────────────────────────────────────────

class ChandalDoshaPlanetInfo(BaseModel):
    sign: str
    house: int
    longitude: float
    dignity: Optional[str] = None
    functional_role: Optional[str] = None
    combust: Optional[bool] = None
    retrograde: Optional[bool] = None


class ChandalDoshaNodeInfo(BaseModel):
    name: str
    sign: str
    house: int
    longitude: float


class ChandalDoshaTypeInfo(BaseModel):
    house: int
    name: str
    name_hi: Optional[str] = None
    name_gu: Optional[str] = None
    sanskrit_theme: str
    house_category: str


class ChandalDoshaMitigation(BaseModel):
    factor: str
    matched: bool
    detail: str
    weight: str
    severity_reduction: str
    raja_yogas: Optional[list[RajaYogaFinding]] = None
    mahapurusha_yogas: Optional[list[MahapurushaFinding]] = None


class ChandalDoshaResponse(BaseModel):
    present: bool
    variant: Optional[str] = None
    variant_label: Optional[str] = None
    variant_label_hi: Optional[str] = None
    variant_label_gu: Optional[str] = None
    variant_impact: Optional[str] = None
    variant_positive: Optional[str] = None
    jupiter: Optional[ChandalDoshaPlanetInfo] = None
    node: Optional[ChandalDoshaNodeInfo] = None
    conjunction_orb_degrees: Optional[float] = None
    conjunction_strength: Optional[str] = None
    type: Optional[ChandalDoshaTypeInfo] = None
    base_severity: Optional[str] = None
    effective_severity: Optional[str] = None
    impact_area: Optional[str] = None
    impact_types: Optional[str] = None
    positive_note: Optional[str] = None
    conventional_remedies: Optional[str] = None
    modern_remedies: Optional[str] = None
    mitigating_factors: Optional[list[ChandalDoshaMitigation]] = None
    disclaimer: str


class VargaRequest(ChartRequest):
    n: int = 9  # which D-chart (1–60)


class VargaBulkRequest(ChartRequest):
    ns: list[int]  # varga numbers to compute, e.g. [2, 3, ..., 60]


# ── Vimshottari Dasha ────────────────────────────────────────────────────────

class DashaRequest(ChartRequest):
    years_ahead: int = 120


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
    boy_nakshatra_charan: int
    boy_moon_sign: str
    girl_nakshatra: str
    girl_nakshatra_lord: str
    girl_nakshatra_charan: int
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
