import { ChartRequest } from "@/types/chart";

export const HOUSE_SYSTEM_IDS = [
  "placidus",
  "koch",
  "equal",
  "whole_sign",
  "porphyry",
  "regiomontanus",
  "campanus",
] as const;

export const ZODIAC_IDS = ["tropical", "sidereal"] as const;

export type HouseSystemId = (typeof HOUSE_SYSTEM_IDS)[number];
export type ZodiacId = (typeof ZODIAC_IDS)[number];

const HOUSE_SYSTEM_ALIASES: Record<string, HouseSystemId> = {
  placidus: "placidus",
  koch: "koch",
  equal: "equal",
  whole_sign: "whole_sign",
  "whole sign": "whole_sign",
  porphyry: "porphyry",
  regiomontanus: "regiomontanus",
  campanus: "campanus",
};

const ZODIAC_ALIASES: Record<string, ZodiacId> = {
  tropical: "tropical",
  sidereal: "sidereal",
};

export const HOUSE_SYSTEM_LABELS: Record<HouseSystemId, string> = {
  placidus: "Placidus",
  koch: "Koch",
  equal: "Equal House",
  whole_sign: "Whole Sign",
  porphyry: "Porphyry",
  regiomontanus: "Regiomontanus",
  campanus: "Campanus",
};

export const ZODIAC_LABELS: Record<ZodiacId, string> = {
  tropical: "Tropical",
  sidereal: "Sidereal",
};

export function normalizeHouseSystem(
  value: string | undefined | null,
  fallback: HouseSystemId = "whole_sign",
): HouseSystemId {
  if (!value) return fallback;
  const key = value.trim().toLowerCase().replace(/\s+/g, " ");
  const alias = HOUSE_SYSTEM_ALIASES[key] ?? HOUSE_SYSTEM_ALIASES[value.trim()];
  return alias ?? fallback;
}

export function normalizeZodiac(
  value: string | undefined | null,
  fallback: ZodiacId = "sidereal",
): ZodiacId {
  if (!value) return fallback;
  const key = value.trim().toLowerCase();
  const alias = ZODIAC_ALIASES[key] ?? ZODIAC_ALIASES[value.trim()];
  return alias ?? fallback;
}

export function formatHouseSystemLabel(value: string | undefined | null): string {
  const id = normalizeHouseSystem(value, "whole_sign");
  return HOUSE_SYSTEM_LABELS[id];
}

export function formatZodiacLabel(value: string | undefined | null): string {
  const id = normalizeZodiac(value, "sidereal");
  return ZODIAC_LABELS[id];
}

/** Ensure API payload uses canonical ids (not display labels from chart meta). */
export function normalizeChartRequest<T extends Partial<ChartRequest>>(req: T): T & ChartRequest {
  return {
    name: req.name ?? "",
    birth_date: req.birth_date ?? "",
    birth_time: req.birth_time ?? "",
    birth_place: req.birth_place ?? "",
    birth_lat: req.birth_lat,
    birth_lon: req.birth_lon,
    save_history: req.save_history ?? true,
    history_id: req.history_id,
    house_system: normalizeHouseSystem(req.house_system),
    zodiac: normalizeZodiac(req.zodiac),
  };
}
