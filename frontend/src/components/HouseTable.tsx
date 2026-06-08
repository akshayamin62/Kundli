"use client";

import { ChartResponse } from "@/types/chart";
import { formatHouseSystemLabel, formatZodiacLabel } from "@/lib/chartRequestNormalize";
import { type Lang, SIGN_NAMES as SIGN_NAMES_I18N, PLANET_NAMES, SIGN_LORDS as SIGN_LORDS_I18N, NAKSHATRA_NAMES, NAKSHATRA_LORDS as NAKSHATRA_LORDS_I18N, AVASTHA_NAMES, UI, translateSign } from "@/lib/translations";

interface Props {
  chart: ChartResponse;
  lang?: Lang;
}

const PLANET_COLORS: Record<string, string> = {
  Sun: "#b45309",
  Moon: "#64748b",
  Mars: "#dc2626",
  Mercury: "#059669",
  Jupiter: "#c2410c",
  Venus: "#be185d",
  Saturn: "#475569",
  "North Node": "#1d4ed8",
  "South Node": "#92400e",
};

// English sign lords (used for backend sign names which are always English)
const SIGN_LORDS_EN: Record<string, string> = {
  Aries: "Mars",
  Taurus: "Venus",
  Gemini: "Mercury",
  Cancer: "Moon",
  Leo: "Sun",
  Virgo: "Mercury",
  Libra: "Venus",
  Scorpio: "Mars",
  Sagittarius: "Jupiter",
  Capricorn: "Saturn",
  Aquarius: "Saturn",
  Pisces: "Jupiter",
};

// Internal English arrays for index-based logic (backend returns English)
const SIGN_NAMES_EN = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];
const SIGN_NUMS: Record<string, number> = Object.fromEntries(
  SIGN_NAMES_EN.map((s, i) => [s, i + 1])
);

const NAKSHATRAS: { name: string; lord: string }[] = [
  { name: "Ashwini",           lord: "Ketu"    },
  { name: "Bharani",           lord: "Venus"   },
  { name: "Krittika",          lord: "Sun"     },
  { name: "Rohini",            lord: "Moon"    },
  { name: "Mrigashira",        lord: "Mars"    },
  { name: "Ardra",             lord: "Rahu"    },
  { name: "Punarvasu",         lord: "Jupiter" },
  { name: "Pushya",            lord: "Saturn"  },
  { name: "Ashlesha",          lord: "Mercury" },
  { name: "Magha",             lord: "Ketu"    },
  { name: "Purva Phalguni",    lord: "Venus"   },
  { name: "Uttara Phalguni",   lord: "Sun"     },
  { name: "Hasta",             lord: "Moon"    },
  { name: "Chitra",            lord: "Mars"    },
  { name: "Swati",             lord: "Rahu"    },
  { name: "Vishakha",          lord: "Jupiter" },
  { name: "Anuradha",          lord: "Saturn"  },
  { name: "Jyeshtha",          lord: "Mercury" },
  { name: "Mula",              lord: "Ketu"    },
  { name: "Purva Ashadha",     lord: "Venus"   },
  { name: "Uttara Ashadha",    lord: "Sun"     },
  { name: "Shravana",          lord: "Moon"    },
  { name: "Dhanishta",         lord: "Mars"    },
  { name: "Shatabhisha",       lord: "Rahu"    },
  { name: "Purva Bhadrapada",  lord: "Jupiter" },
  { name: "Uttara Bhadrapada", lord: "Saturn"  },
  { name: "Revati",            lord: "Mercury" },
];

function getNakshatra(longitude: number) {
  const size = 360 / 27;
  const idx = Math.floor(longitude / size) % 27;
  const posInNak = longitude - Math.floor(longitude / size) * size;
  const pada = Math.min(Math.floor(posInNak / (size / 4)) + 1, 4);
  return { idx, lordKey: NAKSHATRAS[idx].lord, pada };
}

function getAvasthaIdx(longitude: number, sign: string): number {
  const signNum = SIGN_NUMS[sign] ?? 1;
  const degInSign = longitude % 30;
  const bracket = Math.min(Math.floor(degInSign / 6), 4);
  const oddIdx  = [0, 1, 2, 3, 4];
  const evenIdx = [4, 3, 2, 1, 0];
  return signNum % 2 === 1 ? oddIdx[bracket] : evenIdx[bracket];
}

function formatLongitude(lon: number): string {
  const signLon = lon % 30;          // 0–30° within the sign
  const d = Math.floor(signLon);
  const mFloat = (signLon - d) * 60;
  const m = Math.floor(mFloat);
  const s = ((mFloat - m) * 60).toFixed(2);
  return `${d}° ${m}' ${s}"`;
}

export default function HouseTable({ chart, lang = "en" }: Props) {
  const ui = UI[lang];
  const nakNames = NAKSHATRA_NAMES[lang];
  const nakLords = NAKSHATRA_LORDS_I18N[lang];
  const avasthas = AVASTHA_NAMES[lang];
  const planetNames = PLANET_NAMES[lang];
  const signLordsLang = SIGN_LORDS_I18N[lang];

  const ascLon  = chart.angles.ascendant.longitude;
  const ascSignEn = SIGN_NAMES_EN[Math.floor(ascLon / 30) % 12];
  const ascNak  = getNakshatra(ascLon);

  interface TableRow {
    key: string; symbol: string; displayName: string;
    signEn: string; signLordKey: string; nakIdx: number; nakLordKey: string;
    pada: number; position: string; retro: boolean | null;
    avasthaIdx: number; house: number | string; color: string;
  }

  const rows: TableRow[] = [
    {
      key: "Ascendant", symbol: "↑",
      displayName: planetNames["Ascendant"] ?? ui.ascendant,
      signEn: ascSignEn, signLordKey: SIGN_LORDS_EN[ascSignEn] ?? "",
      nakIdx: ascNak.idx, nakLordKey: ascNak.lordKey, pada: ascNak.pada,
      position: formatLongitude(ascLon), retro: null,
      avasthaIdx: -1, house: 1, color: "#6d28d9",
    },
    ...chart.planets
      .filter((p) => !["Uranus", "Neptune", "Pluto"].includes(p.name))
      .map((p) => {
        const nak = getNakshatra(p.longitude);
        return {
          key: p.name, symbol: p.symbol,
          displayName: planetNames[p.name] ?? p.name,
          signEn: p.sign, signLordKey: SIGN_LORDS_EN[p.sign] ?? "",
          nakIdx: nak.idx, nakLordKey: nak.lordKey, pada: nak.pada,
          position: formatLongitude(p.longitude), retro: p.retrograde,
          avasthaIdx: getAvasthaIdx(p.longitude, p.sign), house: p.house,
          color: PLANET_COLORS[p.name] ?? "#374151",
        };
      }),
  ];

  return (
    <div className="space-y-4">
      {/* Planet positions table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wide">
              <th className="px-3 py-3 text-left">{ui.planet}</th>
              <th className="px-3 py-3 text-left">{ui.sign}</th>
              <th className="px-3 py-3 text-left">{ui.signLord}</th>
              <th className="px-3 py-3 text-left">{ui.nakshatra}</th>
              <th className="px-3 py-3 text-left">{ui.nakLord}</th>
              <th className="px-3 py-3 text-center">{ui.pada}</th>
              <th className="px-3 py-3 text-left">{ui.position}</th>
              <th className="px-3 py-3 text-center">{ui.retroCol}</th>
              <th className="px-3 py-3 text-left">{ui.avastha}</th>
              <th className="px-3 py-3 text-center">{ui.house}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-t border-gray-100 hover:bg-indigo-50 transition-colors">
                <td className="px-3 py-2.5 whitespace-nowrap font-semibold" style={{ color: row.color }}>
                  <span className="mr-1.5">{row.symbol}</span>{row.displayName}
                </td>
                <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">
                  {translateSign(row.signEn, lang)}
                </td>
                <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">
                  {row.signLordKey ? (signLordsLang[row.signEn] ?? row.signLordKey) : "—"}
                </td>
                <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">
                  {nakNames[row.nakIdx] ?? "—"}
                </td>
                <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">
                  {row.nakLordKey ? (nakLords[row.nakLordKey] ?? row.nakLordKey) : "—"}
                </td>
                <td className="px-3 py-2.5 text-center text-gray-600 font-medium">{row.pada}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-gray-800 whitespace-nowrap">{row.position}</td>
                <td className="px-3 py-2.5 text-center whitespace-nowrap">
                  {row.retro === null ? (
                    <span className="text-gray-300">—</span>
                  ) : row.retro ? (
                    <span className="inline-block bg-red-50 text-red-500 text-xs font-bold px-2 py-0.5 rounded-full">- {ui.retroCol}</span>
                  ) : (
                    <span className="inline-block bg-green-50 text-green-600 text-xs px-2 py-0.5 rounded-full">Direct</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                  {row.avasthaIdx >= 0 ? avasthas[row.avasthaIdx] : "—"}
                </td>
                <td className="px-3 py-2.5 text-center font-semibold text-indigo-600">{row.house}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Meta info */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500 space-y-1">
        <div>📍 {chart.meta.birth_place}</div>
        <div>🌐 Lat: {chart.meta.latitude}° | Lon: {chart.meta.longitude}°</div>
        <div>🕐 Timezone: {chart.meta.timezone} ({chart.meta.utc_offset})</div>
        <div>⏱ UTC: {chart.meta.utc_datetime}</div>
        <div>📅 Julian Day: {chart.meta.julian_day}</div>
        <div>🏠 System: {formatHouseSystemLabel(chart.meta.house_system)} | Zodiac: {formatZodiacLabel(chart.meta.zodiac)}</div>
      </div>
    </div>
  );
}
