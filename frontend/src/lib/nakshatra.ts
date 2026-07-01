import { type Lang, NAKSHATRA_NAMES } from "@/lib/translations";

export const NAKSHATRA_NAMES_EN = NAKSHATRA_NAMES.en;

export const NAK_LORDS_EN = [
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
] as const;

const NAK_SIZE = 360 / 27;

export interface NakshatraInfo {
  index: number;
  name: string;
  lord: string;
  charan: number;
}

/** Sidereal longitude → nakshatra + charan (1–4), aligned with backend `nakshatra.py`. */
export function getNakshatraFromLongitude(longitude: number): NakshatraInfo {
  const lon = ((longitude % 360) + 360) % 360;
  let idx = Math.floor((lon + 1e-8) / NAK_SIZE);
  if (idx >= 27) idx = 0;

  let posInNak = lon - idx * NAK_SIZE;
  if (posInNak < 0) posInNak = 0;

  let charan = Math.floor(posInNak / (NAK_SIZE / 4)) + 1;
  charan = Math.min(Math.max(charan, 1), 4);

  return {
    index: idx,
    name: NAKSHATRA_NAMES_EN[idx] ?? "",
    lord: NAK_LORDS_EN[idx] ?? "",
    charan,
  };
}

/** Display nakshatra name with charan, e.g. "Rohini (Charan 2)". Omits charan if missing (legacy cached data). */
export function formatNakshatraWithCharan(
  nakNameEn: string,
  charan: number | undefined | null,
  lang: Lang,
): string {
  const i = NAKSHATRA_NAMES_EN.indexOf(nakNameEn);
  const nak = i >= 0 ? NAKSHATRA_NAMES[lang][i] : nakNameEn;
  if (charan == null || charan < 1 || charan > 4) return nak;
  if (lang === "hi") return `${nak} (चरण ${charan})`;
  if (lang === "gu") return `${nak} (ચરણ ${charan})`;
  return `${nak} (Charan ${charan})`;
}
