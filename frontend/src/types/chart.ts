export interface DegreePosition {
  longitude: number;
  sign: string;
  degree: number;
  minutes: number;
  seconds: number;
  formatted: string;
}

export interface HouseCusp {
  number: number;
  name: string;
  cusp_longitude: number;
  sign: string;
  degree: number;
  minutes: number;
  seconds: number;
  formatted: string;
}

export interface PlanetPosition {
  name: string;
  symbol: string;
  longitude: number;
  sign: string;
  degree: number;
  minutes: number;
  seconds: number;
  formatted: string;
  house: number;
  retrograde: boolean;
  speed_deg_day: number;
}

export interface ChartAngles {
  ascendant: DegreePosition;
  midheaven: DegreePosition;
  descendant: DegreePosition;
  imum_coeli: DegreePosition;
}

export interface ChartMeta {
  birth_date: string;
  birth_time: string;
  birth_place: string;
  latitude: number;
  longitude: number;
  timezone: string;
  utc_offset: string;
  utc_datetime: string;
  julian_day: number;
  house_system: string;
  zodiac: string;
  varga_n?: number;
  varga_name?: string;
}

export interface ChartResponse {
  meta: ChartMeta;
  angles: ChartAngles;
  houses: HouseCusp[];
  planets: PlanetPosition[];
}

export interface ChartRequest {
  birth_date: string;
  birth_time: string;
  birth_place: string;
  house_system: string;
  zodiac: string;
}

export interface VargaRequest extends ChartRequest {
  n: number;
}

// ── Vimshottari Dasha ────────────────────────────────────────────────────────

export interface DashaRequest extends ChartRequest {
  years_ahead?: number;
}

export interface DashaPeriod {
  md: string;
  ad: string;
  pd: string;
  start_date: string;
  end_date: string;
}

export interface DashaResponse {
  nakshatra_name: string;
  nakshatra_lord: string;
  periods: DashaPeriod[];
}

// ── Planet Sign Transit ──────────────────────────────────────────────────────

export interface TransitRequest {
  planet: string;
  start_year: number;
  end_year: number;
  zodiac: string;
}

export interface TransitEntry {
  sign: string;
  entry_date: string;
  entry_time: string;
  exit_date: string;
  exit_time: string;
  retrograde: boolean;
}

export interface TransitResponse {
  planet: string;
  zodiac: string;
  transits: TransitEntry[];
}
