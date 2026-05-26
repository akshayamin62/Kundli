"use client";

import { ChartResponse } from "@/types/chart";

interface Props {
  chart: ChartResponse;
}

// Display name overrides for table
const DISPLAY_NAME: Record<string, string> = {
  "North Node": "Rahu",
  "South Node": "Ketu",
};

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

const SIGN_LORDS: Record<string, string> = {
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

const SIGN_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const SIGN_NUMS: Record<string, number> = Object.fromEntries(
  SIGN_NAMES.map((s, i) => [s, i + 1])
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
  return { name: NAKSHATRAS[idx].name, lord: NAKSHATRAS[idx].lord, pada };
}

function getAvastha(longitude: number, sign: string): string {
  const signNum = SIGN_NUMS[sign] ?? 1;
  const degInSign = longitude % 30;
  const bracket = Math.min(Math.floor(degInSign / 6), 4);
  const odd  = ["Bala", "Kumara", "Yuva", "Vridha", "Mrit"];
  const even = ["Mrit", "Vridha", "Yuva", "Kumara", "Bala"];
  return signNum % 2 === 1 ? odd[bracket] : even[bracket];
}

function formatLongitude(lon: number): string {
  const signLon = lon % 30;          // 0–30° within the sign
  const d = Math.floor(signLon);
  const mFloat = (signLon - d) * 60;
  const m = Math.floor(mFloat);
  const s = ((mFloat - m) * 60).toFixed(2);
  return `${d}° ${m}' ${s}"`;
}

interface TableRow {
  key: string;
  symbol: string;
  displayName: string;
  sign: string;
  signLord: string;
  nakshatra: string;
  nakshatraLord: string;
  pada: number;
  position: string;
  retro: boolean | null;
  avastha: string;
  house: number | string;
  color: string;
}

export default function HouseTable({ chart }: Props) {
  const ascLon  = chart.angles.ascendant.longitude;
  const ascSign = SIGN_NAMES[Math.floor(ascLon / 30) % 12];
  const ascNak  = getNakshatra(ascLon);

  const rows: TableRow[] = [
    {
      key:           "Ascendant",
      symbol:        "↑",
      displayName:   "Ascendant",
      sign:          ascSign,
      signLord:      SIGN_LORDS[ascSign] ?? "—",
      nakshatra:     ascNak.name,
      nakshatraLord: ascNak.lord,
      pada:          ascNak.pada,
      position:      formatLongitude(ascLon),
      retro:         null,
      avastha:       "—",
      house:         1,
      color:         "#6d28d9",
    },
    ...chart.planets
      .filter((p) => !["Uranus", "Neptune", "Pluto"].includes(p.name))
      .map((p) => {
      const nak = getNakshatra(p.longitude);
      return {
        key:           p.name,
        symbol:        p.symbol,
        displayName:   DISPLAY_NAME[p.name] ?? p.name,
        sign:          p.sign,
        signLord:      SIGN_LORDS[p.sign] ?? "—",
        nakshatra:     nak.name,
        nakshatraLord: nak.lord,
        pada:          nak.pada,
        position:      formatLongitude(p.longitude),
        retro:         p.retrograde,
        avastha:       getAvastha(p.longitude, p.sign),
        house:         p.house,
        color:         PLANET_COLORS[p.name] ?? "#374151",
      };
    }),
  ];

  return (
    <div className="space-y-4">
      {/* Angles summary */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "ASC (Rising)",   value: chart.angles.ascendant.formatted  },
          { label: "MC (Midheaven)", value: chart.angles.midheaven.formatted  },
          { label: "DSC",            value: chart.angles.descendant.formatted },
          { label: "IC",             value: chart.angles.imum_coeli.formatted },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="text-sm text-gray-800 font-semibold mt-1">{value}</div>
          </div>
        ))}
      </div>

      {/* Planet positions table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wide">
              <th className="px-3 py-3 text-left">Planet</th>
              <th className="px-3 py-3 text-left">Sign</th>
              <th className="px-3 py-3 text-left">Sign Lord</th>
              <th className="px-3 py-3 text-left">Nakshatra</th>
              <th className="px-3 py-3 text-left">Nak. Lord</th>
              <th className="px-3 py-3 text-center">Pada</th>
              <th className="px-3 py-3 text-left">Position</th>
              <th className="px-3 py-3 text-center">Retro</th>
              <th className="px-3 py-3 text-left">Avastha</th>
              <th className="px-3 py-3 text-center">House</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.key}
                className="border-t border-gray-100 hover:bg-indigo-50 transition-colors"
              >
                <td className="px-3 py-2.5 whitespace-nowrap font-semibold" style={{ color: row.color }}>
                  <span className="mr-1.5">{row.symbol}</span>{row.displayName}
                </td>
                <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{row.sign}</td>
                <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{row.signLord}</td>
                <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{row.nakshatra}</td>
                <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{row.nakshatraLord}</td>
                <td className="px-3 py-2.5 text-center text-gray-600 font-medium">{row.pada}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-gray-800 whitespace-nowrap">
                  {row.position}
                </td>
                <td className="px-3 py-2.5 text-center whitespace-nowrap">
                  {row.retro === null ? (
                    <span className="text-gray-300">—</span>
                  ) : row.retro ? (
                    <span className="inline-block bg-red-50 text-red-500 text-xs font-bold px-2 py-0.5 rounded-full">℞ Retro</span>
                  ) : (
                    <span className="inline-block bg-green-50 text-green-600 text-xs px-2 py-0.5 rounded-full">Direct</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{row.avastha}</td>
                <td className="px-3 py-2.5 text-center font-semibold text-indigo-600">{row.house}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Meta info */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500 space-y-1">
        <div>📍 {chart.meta.birth_place}</div>
        <div>🌐 Lat: {chart.meta.latitude}deg | Lon: {chart.meta.longitude}deg</div>
        <div>🕐 Timezone: {chart.meta.timezone} ({chart.meta.utc_offset})</div>
        <div>⏱ UTC: {chart.meta.utc_datetime}</div>
        <div>📅 Julian Day: {chart.meta.julian_day}</div>
        <div>🏠 System: {chart.meta.house_system} | Zodiac: {chart.meta.zodiac}</div>
      </div>
    </div>
  );
}
