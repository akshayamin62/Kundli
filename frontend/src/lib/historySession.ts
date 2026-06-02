import { ChartRequest, MatchRequest } from "@/types/chart";
import { lookupHistoryId } from "@/services/api";

export const KUNDALI_HISTORY_ID_KEY = "astroHistoryId";
export const MATCH_HISTORY_ID_KEY = "matchHistoryId";

export function getKundaliHistoryId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(KUNDALI_HISTORY_ID_KEY);
}

export function setKundaliHistoryId(id: string | null | undefined) {
  if (typeof window === "undefined" || !id) return;
  sessionStorage.setItem(KUNDALI_HISTORY_ID_KEY, id);
}

export function getMatchHistoryId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(MATCH_HISTORY_ID_KEY);
}

export function setMatchHistoryId(id: string | null | undefined) {
  if (typeof window === "undefined" || !id) return;
  sessionStorage.setItem(MATCH_HISTORY_ID_KEY, id);
}

function kundaliInputDoc(req: ChartRequest) {
  return {
    name: (req.name ?? "").trim(),
    birth_date: req.birth_date,
    birth_time: req.birth_time,
    birth_place: req.birth_place,
    house_system: req.house_system ?? "whole_sign",
    zodiac: req.zodiac ?? "sidereal",
  };
}

function matchInputDoc(req: { boy: MatchRequest["boy"]; girl: MatchRequest["girl"] }) {
  const person = (p: MatchRequest["boy"]) => ({
    name: (p.name ?? "").trim(),
    birth_date: p.birth_date,
    birth_time: p.birth_time,
    birth_place: p.birth_place,
    house_system: p.house_system ?? "whole_sign",
    zodiac: p.zodiac ?? "sidereal",
  });
  return { boy: person(req.boy), girl: person(req.girl) };
}

/** Resolve MongoDB history id from session or exact input match. */
export async function resolveKundaliHistoryId(req: ChartRequest): Promise<string | null> {
  const stored = getKundaliHistoryId();
  if (stored) return stored;
  try {
    return await lookupHistoryId("kundali", kundaliInputDoc(req));
  } catch {
    return null;
  }
}

export async function resolveMatchHistoryId(
  req: { boy: MatchRequest["boy"]; girl: MatchRequest["girl"] },
): Promise<string | null> {
  const stored = getMatchHistoryId();
  if (stored) return stored;
  try {
    return await lookupHistoryId("match", matchInputDoc(req));
  } catch {
    return null;
  }
}
