import { ChartResponse, ChartAngles, ChartMeta, HouseCusp, PlanetPosition, DegreePosition } from "@/types/chart";
import { getNakshatraFromLongitude } from "@/lib/nakshatra";
import { getAshtakootAttributes } from "@/lib/ashtakootAttributes";

export interface MoonJanmaInfo {
  moon_sign: string;
  nakshatra: string;
  nakshatra_lord: string;
  nakshatra_charan: number;
  varna: string;
  vasya: string;
  yoni: string;
  gana: string;
  nadi: string;
}

/** Janma Rasi & Janma Nakshatra (+ charan, ashtakoot attributes) from natal Moon. */
export function getMoonJanmaFromChart(chart: ChartResponse): MoonJanmaInfo | null {
  const moon = chart.planets.find((p) => p.name === "Moon");
  if (!moon) return null;

  const nak = getNakshatraFromLongitude(moon.longitude);
  const attrs = getAshtakootAttributes(moon.sign, nak.index, nak.name);

  return {
    moon_sign: moon.sign,
    nakshatra: nak.name,
    nakshatra_lord: nak.lord,
    nakshatra_charan: nak.charan,
    ...attrs,
  };
}

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const HOUSE_NAMES: Record<number, string> = {
  1: "1st House (Lagna)", 2: "2nd House", 3: "3rd House", 4: "4th House",
  5: "5th House", 6: "6th House", 7: "7th House", 8: "8th House",
  9: "9th House", 10: "10th House", 11: "11th House", 12: "12th House",
};

function signIndex(sign: string, longitude: number): number {
  const i = ZODIAC_SIGNS.indexOf(sign);
  if (i >= 0) return i;
  return Math.floor(((longitude % 360) + 360) % 360 / 30) % 12;
}

function cuspFromSignIdx(signIdx: number): HouseCusp {
  const sign = ZODIAC_SIGNS[signIdx];
  const cuspLon = signIdx * 30;
  return {
    number: 0,
    name: "",
    cusp_longitude: cuspLon,
    sign,
    degree: 0,
    minutes: 0,
    seconds: 0,
    formatted: `0°00'00" ${sign}`,
  };
}

function cuspToDegreePosition(cusp: HouseCusp): DegreePosition {
  return {
    longitude: cusp.cusp_longitude,
    sign: cusp.sign,
    degree: cusp.degree,
    minutes: cusp.minutes,
    seconds: cusp.seconds,
    formatted: cusp.formatted,
  };
}

/** Chandra Kundli: Moon sign becomes Lagna; natal rashis unchanged, houses rotated. */
export function toMoonChart(base: ChartResponse): ChartResponse {
  const moon = base.planets.find((p) => p.name === "Moon");
  if (!moon) return base;

  const moonIdx = signIndex(moon.sign, moon.longitude);

  const houses: HouseCusp[] = Array.from({ length: 12 }, (_, i) => {
    const c = cuspFromSignIdx((moonIdx + i) % 12);
    return { ...c, number: i + 1, name: HOUSE_NAMES[i + 1] };
  });

  const planets: PlanetPosition[] = base.planets.map((p) => {
    const pIdx = signIndex(p.sign, p.longitude);
    const house = ((pIdx - moonIdx + 12) % 12) + 1;
    return { ...p, house };
  });

  const ascendant: DegreePosition = {
    longitude: moon.longitude,
    sign: moon.sign,
    degree: moon.degree,
    minutes: moon.minutes,
    seconds: moon.seconds,
    formatted: moon.formatted,
  };

  const oppIdx = (moonIdx + 6) % 12;
  const mcIdx = (moonIdx + 9) % 12;
  const icIdx = (moonIdx + 3) % 12;

  const angles: ChartAngles = {
    ascendant,
    descendant: cuspToDegreePosition(cuspFromSignIdx(oppIdx)),
    midheaven: cuspToDegreePosition(cuspFromSignIdx(mcIdx)),
    imum_coeli: cuspToDegreePosition(cuspFromSignIdx(icIdx)),
  };

  const meta: ChartMeta = {
    ...base.meta,
    varga_n: undefined,
    varga_name: "Moon Chart",
  };

  return { ...base, meta, angles, houses, planets };
}
