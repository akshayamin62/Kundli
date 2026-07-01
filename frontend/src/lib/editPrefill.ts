import { ChartRequest, MatchPersonRequest, MatchRequest, MatchResponse, ChartResponse } from "@/types/chart";
import { normalizeChartRequest, normalizeHouseSystem, normalizeZodiac } from "@/lib/chartRequestNormalize";

const TAB_KEY = "jk_active_tab";
const BIRTH_FORM_KEY = "jk_birth_form";
const MATCH_BOY_KEY = "jk_match_boy";
const MATCH_GIRL_KEY = "jk_match_girl";
const MATCH_REQ_SESSION_KEY = "matchReq";

function personFromChart(meta: ChartResponse["meta"], name: string): MatchPersonRequest {
  return {
    name,
    birth_date: meta.birth_date,
    birth_time: meta.birth_time,
    birth_place: meta.birth_place,
    birth_lat: meta.latitude,
    birth_lon: meta.longitude,
    house_system: normalizeHouseSystem(meta.house_system),
    zodiac: normalizeZodiac(meta.zodiac),
  };
}

/** Pin resolved coordinates from a built chart so re-runs do not re-geocode. */
export function enrichChartRequestFromMeta(req: ChartRequest, chart: ChartResponse): ChartRequest {
  const base = normalizeChartRequest(req);
  return {
    ...base,
    birth_lat: base.birth_lat ?? chart.meta.latitude,
    birth_lon: base.birth_lon ?? chart.meta.longitude,
  };
}

export function enrichMatchPersonFromMeta(
  person: MatchPersonRequest,
  chart: ChartResponse,
): MatchPersonRequest {
  const base = normalizeChartRequest(person) as MatchPersonRequest;
  return {
    ...base,
    name: person.name ?? base.name,
    birth_lat: base.birth_lat ?? chart.meta.latitude,
    birth_lon: base.birth_lon ?? chart.meta.longitude,
    house_system: normalizeHouseSystem(person.house_system ?? chart.meta.house_system),
    zodiac: normalizeZodiac(person.zodiac ?? chart.meta.zodiac),
  };
}

export function enrichMatchRequestFromResult(
  req: MatchRequest,
  result: MatchResponse,
): MatchRequest {
  return {
    boy: enrichMatchPersonFromMeta(req.boy, result.boy_chart),
    girl: enrichMatchPersonFromMeta(req.girl, result.girl_chart),
  };
}

export function prefillKundaliForm(req: ChartRequest) {
  try {
    localStorage.setItem(
      BIRTH_FORM_KEY,
      JSON.stringify({
        name: req.name ?? "",
        birth_date: req.birth_date,
        birth_time: req.birth_time,
        birth_place: req.birth_place,
        house_system: req.house_system ?? "whole_sign",
        zodiac: req.zodiac ?? "sidereal",
        _placeInput: req.birth_place,
      }),
    );
    localStorage.setItem(TAB_KEY, "kundali");
  } catch {
    /* ignore */
  }
}

export function prefillMatchForms(req: MatchRequest) {
  try {
    localStorage.setItem(MATCH_BOY_KEY, JSON.stringify(req.boy));
    localStorage.setItem(MATCH_GIRL_KEY, JSON.stringify(req.girl));
    localStorage.setItem(TAB_KEY, "milan");
  } catch {
    /* ignore */
  }
}

export function matchRequestFromResult(data: MatchResponse): MatchRequest {
  return {
    boy: personFromChart(data.boy_chart.meta, data.boy_name || "Boy"),
    girl: personFromChart(data.girl_chart.meta, data.girl_name || "Girl"),
  };
}

export function loadStoredMatchRequest(): MatchRequest | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(MATCH_REQ_SESSION_KEY);
    if (raw) return JSON.parse(raw) as MatchRequest;
  } catch {
    /* ignore */
  }
  return null;
}

export function saveMatchRequest(req: MatchRequest) {
  try {
    sessionStorage.setItem(MATCH_REQ_SESSION_KEY, JSON.stringify(req));
  } catch {
    /* ignore */
  }
}
