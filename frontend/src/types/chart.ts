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
  history_id?: string | null;
}

export interface PitruDoshaSignFinding {
  combination: string;
  sign: string;
  detail: string;
  rahu_sign?: string | null;
  ketu_sign?: string | null;
  sign_wise_impact?: string | null;
  sign_wise_severity?: string | null;
  nature_theme?: string | null;
  stronger_houses?: string | null;
  conventional_remedies?: string | null;
  modern_remedies?: string | null;
}

export interface PitruDoshaDomainImpact {
  area_affected: string;
  impact: string;
  severity?: string | null;
  conventional_remedies?: string | null;
  modern_remedies?: string | null;
}

export interface PitruDoshaHouseFinding {
  combination: string;
  sign: string;
  house: number;
  house_label: string;
  detail: string;
  rahu_sign?: string | null;
  ketu_sign?: string | null;
  rahu_house?: number | null;
  ketu_house?: number | null;
  house_wise_impact?: string | null;
  house_wise_severity?: string | null;
  health_focus?: string | null;
  domains?: Partial<Record<"health" | "career" | "finance" | "relationship", PitruDoshaDomainImpact>> | null;
  conventional_remedies?: string | null;
  modern_remedies?: string | null;
}

export interface PitruDoshaAfflictedPlanet {
  planet: string;
  sign: string;
  house: number;
  reasons: string[];
}

export interface PitruDoshaResponse {
  janma_rashi?: string | null;
  present: boolean;
  confirmation_count: number;
  afflicted_planets: PitruDoshaAfflictedPlanet[];
  sign_findings: PitruDoshaSignFinding[];
  house_findings: PitruDoshaHouseFinding[];
  disclaimer: string;
}

// ── Kaal Sarpa Yoga ──────────────────────────────────────────────────────────

export interface KaalSarpaTypeInfo {
  house: number;
  name: string;
  name_hi?: string | null;
  name_gu?: string | null;
  sanskrit: string;
}

export interface KaalSarpaNodeInfo {
  sign: string;
  house: number;
  longitude: number;
}

export interface RajaYogaFinding {
  yoga_name: string;
  kendra_house: number;
  trikona_house: number;
  lords: string[];
  connection: string;
  afflicted: boolean;
  strength: string;
}

export interface MahapurushaFinding {
  yoga: string;
  planet: string;
  house: number;
  sign: string;
  dignity: string;
  afflicted: boolean;
  strength: string;
}

export interface KaalSarpaMitigation {
  factor: string;
  matched: boolean;
  detail: string;
  weight: string;
  severity_reduction: string;
  raja_yogas?: RajaYogaFinding[] | null;
  mahapurusha_yogas?: MahapurushaFinding[] | null;
}

export interface KaalSarpaDivisionalPresence {
  division: number;
  name: string;
  area: string;
  orientation?: string | null;
}

export interface KaalSarpaResponse {
  present: boolean;
  type?: KaalSarpaTypeInfo | null;
  orientation?: string | null;
  rahu?: KaalSarpaNodeInfo | null;
  ketu?: KaalSarpaNodeInfo | null;
  planets_inside?: string[] | null;
  base_severity?: string | null;
  effective_severity?: string | null;
  impact_area?: string | null;
  impact_types?: string | null;
  life_domains?: string[] | null;
  conventional_remedies?: string | null;
  modern_remedies?: string | null;
  positive_note?: string | null;
  mitigating_factors?: KaalSarpaMitigation[] | null;
  divisional_presence?: KaalSarpaDivisionalPresence[] | null;
  disclaimer: string;
}

// ── Chandal Dosha (Guru Chandal Yoga) ────────────────────────────────────────

export interface ChandalDoshaPlanetInfo {
  sign: string;
  house: number;
  longitude: number;
  dignity?: string | null;
  functional_role?: string | null;
  combust?: boolean | null;
  retrograde?: boolean | null;
}

export interface ChandalDoshaNodeInfo {
  name: string;
  sign: string;
  house: number;
  longitude: number;
}

export interface ChandalDoshaTypeInfo {
  house: number;
  name: string;
  name_hi?: string | null;
  name_gu?: string | null;
  sanskrit_theme: string;
  house_category: string;
}

export interface ChandalDoshaMitigation {
  factor: string;
  matched: boolean;
  detail: string;
  weight: string;
  severity_reduction: string;
  raja_yogas?: RajaYogaFinding[] | null;
  mahapurusha_yogas?: MahapurushaFinding[] | null;
}

export interface ChandalDoshaResponse {
  present: boolean;
  variant?: string | null;
  variant_label?: string | null;
  variant_label_hi?: string | null;
  variant_label_gu?: string | null;
  variant_impact?: string | null;
  variant_positive?: string | null;
  jupiter?: ChandalDoshaPlanetInfo | null;
  node?: ChandalDoshaNodeInfo | null;
  conjunction_orb_degrees?: number | null;
  conjunction_strength?: string | null;
  type?: ChandalDoshaTypeInfo | null;
  base_severity?: string | null;
  effective_severity?: string | null;
  impact_area?: string | null;
  impact_types?: string | null;
  positive_note?: string | null;
  conventional_remedies?: string | null;
  modern_remedies?: string | null;
  mitigating_factors?: ChandalDoshaMitigation[] | null;
  disclaimer: string;
}

export interface ChartRequest {
  name?: string;
  save_history?: boolean;
  history_id?: string;
  birth_date: string;
  birth_time: string;
  birth_place: string;
  birth_lat?: number;
  birth_lon?: number;
  house_system: string;
  zodiac: string;
}

// ── History ──────────────────────────────────────────────────────────────────

export interface HistoryItemSummary {
  id: string;
  type: "kundali" | "match";
  created_at: string;
  // Kundali fields
  name?: string;
  birth_date?: string;
  birth_time?: string;
  birth_place?: string;
  birth_lat?: number;
  birth_lon?: number;
  // Match fields
  boy_name?: string;
  girl_name?: string;
  boy_birth_date?: string;
  boy_birth_time?: string;
  boy_birth_place?: string;
  boy_birth_lat?: number;
  boy_birth_lon?: number;
  girl_birth_date?: string;
  girl_birth_time?: string;
  girl_birth_place?: string;
  girl_birth_lat?: number;
  girl_birth_lon?: number;
}

export interface HistoryItemFull extends HistoryItemSummary {
  input?: ChartRequest | MatchRequest;
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
  nakshatra: string;
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

// ── Kundli Milan (Ashtakoot Matching) ─────────────────────────────────────

export interface MatchPersonRequest extends ChartRequest {
  name: string;
}

export interface MatchRequest {
  boy: MatchPersonRequest;
  girl: MatchPersonRequest;
  save_history?: boolean;
  history_id?: string;
}

export interface MatchKoot {
  name: string;
  max_score: number;
  score: number;
  description: string;
  boy_value: string;
  girl_value: string;
}

export interface MatchResponse {
  total_score: number;
  max_score: number;
  percentage: number;
  grade: string;
  recommendation: string;
  koots: MatchKoot[];

  boy_name: string;
  girl_name: string;
  boy_nakshatra: string;
  boy_nakshatra_lord: string;
  boy_nakshatra_charan: number;
  boy_moon_sign: string;
  girl_nakshatra: string;
  girl_nakshatra_lord: string;
  girl_nakshatra_charan: number;
  girl_moon_sign: string;

  boy_mangal_dosha: boolean;
  girl_mangal_dosha: boolean;
  mangal_dosha_cancelled: boolean;
  mangal_dosha_note: string;

  boy_chart: ChartResponse;
  girl_chart: ChartResponse;

  sadsatkut?: {
    distance: number;
    priti_shadashtak: boolean;
    mrityu_shadashtak: boolean;
    shubh_dvadashatak: boolean;
    ashubh_dvadashatak: boolean;
    shubh_navpancham: boolean;
    nashtan_navpancham: boolean;
  };

  history_id?: string | null;
}
