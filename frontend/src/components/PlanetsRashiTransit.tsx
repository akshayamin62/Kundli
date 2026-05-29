"use client";

import { useState, useCallback } from "react";
import { TransitEntry, TransitRequest } from "@/types/chart";
import { calculateTransit } from "@/services/api";
import { type Lang, SIGN_NAMES, PLANET_NAMES, NAKSHATRA_NAMES } from "@/lib/translations";

interface Props {
  zodiac: string;
  lang?: Lang;
}

const PLANETS = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Rahu", "Ketu"];

const PLANET_COLORS: Record<string, string> = {
  Sun: "#b45309", Moon: "#64748b", Mars: "#dc2626", Mercury: "#059669",
  Jupiter: "#c2410c", Venus: "#be185d", Saturn: "#475569",
  Rahu: "#1d4ed8", Ketu: "#92400e",
};

// Sign lord map (English → English)
const SIGN_LORDS: Record<string, string> = {
  Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon",
  Leo: "Sun", Virgo: "Mercury", Libra: "Venus", Scorpio: "Mars",
  Sagittarius: "Jupiter", Capricorn: "Saturn", Aquarius: "Saturn", Pisces: "Jupiter",
};

const SIGN_EN = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

function translateSign(sign: string, lang: Lang): string {
  const idx = SIGN_EN.indexOf(sign);
  return idx >= 0 ? SIGN_NAMES[lang][idx] : sign;
}

function translatePlanet(planet: string, lang: Lang): string {
  return PLANET_NAMES[lang]?.[planet] ?? planet;
}

function translateNakshatra(name: string, lang: Lang): string {
  const idx = NAKSHATRA_NAMES["en"].indexOf(name);
  return idx >= 0 ? NAKSHATRA_NAMES[lang][idx] : name;
}

// Planet–Nakshatra affinity lookup (English names, matching backend NAKSHATRA_NAMES)
const NAKSHATRA_AFFINITY: Record<string, { friendly: string[]; enemy: string[] }> = {
  Sun:     { friendly: ["Krittika", "Uttara Phalguni", "Uttara Ashadha"],
             enemy:    ["Bharani",  "Anuradha",         "Pushya"] },
  Moon:    { friendly: ["Rohini",    "Hasta",      "Shravana"],
             enemy:    ["Ashlesha",  "Jyeshtha",   "Mula"] },
  Mars:    { friendly: ["Mrigashira", "Chitra",  "Dhanishtha"],
             enemy:    ["Rohini",     "Swati",    "Vishakha"] },
  Mercury: { friendly: ["Ashlesha",  "Jyeshtha",      "Revati"],
             enemy:    ["Rohini",    "Uttara Phalguni", "Hasta"] },
  Jupiter: { friendly: ["Punarvasu", "Vishakha",  "Purva Bhadrapada"],
             enemy:    ["Ashlesha",  "Swati",      "Bharani"] },
  Venus:   { friendly: ["Bharani",        "Purva Phalguni", "Purva Ashadha"],
             enemy:    ["Krittika",        "Uttara Ashadha", "Anuradha"] },
  Saturn:  { friendly: ["Pushya",    "Anuradha",        "Uttara Bhadrapada"],
             enemy:    ["Krittika",  "Uttara Ashadha",  "Purva Bhadrapada"] },
  Rahu:    { friendly: ["Ardra",     "Swati",       "Shatabhisha"],
             enemy:    ["Krittika",  "Uttara Phalguni", "Uttara Ashadha"] },
  Ketu:    { friendly: ["Ashwini",   "Magha",  "Mula"],
             enemy:    ["Rohini",    "Hasta",   "Shravana"] },
};

function getNakshatraAffinity(planet: string, nakshatra: string): "friendly" | "enemy" | "neutral" {
  const aff = NAKSHATRA_AFFINITY[planet];
  if (!aff) return "neutral";
  if (aff.friendly.includes(nakshatra)) return "friendly";
  if (aff.enemy.includes(nakshatra)) return "enemy";
  return "neutral";
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function fmtDateTime(isoDate: string, time: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y} ${time}`;
}

function daysDiff(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

function fmtDuration(days: number): string {
  if (days >= 365) {
    const y = Math.floor(days / 365);
    const m = Math.round((days % 365) / 30);
    return m > 0 ? `${y}y ${m}m` : `${y}y`;
  }
  if (days >= 30) {
    const m = Math.floor(days / 30);
    const d = days % 30;
    return d > 0 ? `${m}m ${d}d` : `${m}m`;
  }
  return `${days}d`;
}

const thisYear = new Date().getFullYear();

export default function PlanetsRashiTransit({ zodiac, lang = "en" }: Props) {
  const [planet, setPlanet] = useState("Jupiter");
  const [startYear, setStartYear] = useState(thisYear);
  const [endYear, setEndYear] = useState(thisYear + 5);
  const [transits, setTransits] = useState<TransitEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const doFetch = useCallback(async () => {
    if (endYear < startYear) return;
    setLoading(true);
    setError(null);
    try {
      const req: TransitRequest = { planet, start_year: startYear, end_year: endYear, zodiac };
      const data = await calculateTransit(req);
      setTransits(data.transits);
      setFetched(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [planet, startYear, endYear, zodiac]);

  const headers: Record<Lang, string[]> = {
    en: ["Planet", "Sign", "Nakshatra", "Entry (IST)", "Exit (IST)", "Duration"],
    hi: ["ग्रह",   "राशि",  "नक्षत्र",    "प्रवेश (IST)", "निर्गम (IST)", "अवधि"],
    gu: ["ગ્રહ",   "રાશિ",  "નક્ષત્ર",    "પ્રવેશ (IST)", "નિર્ગમ (IST)", "અવધિ"],
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Controls bar ── */}
      <div className="flex items-center gap-2 px-3 py-2 bg-teal-50 border-b border-teal-100 shrink-0 flex-wrap">
        {/* Planet selector */}
        <select
          value={planet}
          onChange={(e) => setPlanet(e.target.value)}
          className="border border-teal-200 rounded px-2 py-1 text-xs font-semibold text-teal-900 bg-white focus:outline-none focus:ring-1 focus:ring-teal-400"
          style={{ color: PLANET_COLORS[planet] }}
        >
          {PLANETS.map((p) => (
            <option key={p} value={p} style={{ color: PLANET_COLORS[p] }}>
              {translatePlanet(p, lang)}
            </option>
          ))}
        </select>

        {/* Year range */}
        <div className="flex items-center gap-1 text-xs text-teal-700">
          <input
            type="number"
            value={startYear}
            min={1900}
            max={2100}
            onChange={(e) => setStartYear(Number(e.target.value))}
            className="border border-teal-200 rounded px-2 py-1 w-20 text-center bg-white focus:outline-none focus:ring-1 focus:ring-teal-400 text-xs"
          />
          <span className="font-medium">–</span>
          <input
            type="number"
            value={endYear}
            min={1900}
            max={2100}
            onChange={(e) => setEndYear(Number(e.target.value))}
            className="border border-teal-200 rounded px-2 py-1 w-20 text-center bg-white focus:outline-none focus:ring-1 focus:ring-teal-400 text-xs"
          />
        </div>

        {/* Fetch button */}
        <button
          onClick={doFetch}
          disabled={loading}
          className="bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1"
        >
          {loading && (
            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
          {loading ? "Loading…" : "Show Transit"}
        </button>

        {fetched && !loading && (
          <span className="text-[10px] text-teal-600 ml-auto">
            {transits.length} transit{transits.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── Content ── */}
      {error && (
        <div className="px-4 py-3 text-xs text-red-600 bg-red-50 border-b border-red-100">
          Error: {error}
        </div>
      )}

      {!fetched && !loading && !error && (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 text-xs gap-2">
          <svg className="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Select a planet and year range, then click "Show Transit"
        </div>
      )}

      {fetched && !loading && transits.length === 0 && (
        <div className="flex items-center justify-center h-full text-xs text-gray-400">
          No transits found for the selected range.
        </div>
      )}

      {fetched && transits.length > 0 && (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 bg-gray-50 z-10">
              <tr>
                {headers[lang].map((h) => (
                  <th
                    key={h}
                    className="px-2 py-1.5 text-left font-semibold text-gray-600 border-b border-gray-200 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transits.map((t, i) => {
                const isActive = t.entry_date <= today && today <= t.exit_date;
                const isPast = t.exit_date < today;
                const days = daysDiff(t.entry_date, t.exit_date);

                return (
                  <tr
                    key={i}
                    className={`border-b border-gray-100 transition-colors ${
                      isActive
                        ? "bg-yellow-50 ring-1 ring-inset ring-yellow-300"
                        : isPast
                        ? "opacity-50 hover:opacity-80 hover:bg-gray-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-2 py-1 font-semibold whitespace-nowrap" style={{ color: PLANET_COLORS[planet] }}>
                      {translatePlanet(planet, lang)}
                      {isActive && (
                        <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-green-500 align-middle" />
                      )}
                      {t.retrograde && (
                        <span className="ml-1 text-[9px] font-bold text-red-500 align-middle">(R)</span>
                      )}
                    </td>
                    <td className="px-2 py-1 font-medium whitespace-nowrap text-gray-800">
                      {translateSign(t.sign, lang)}
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap text-indigo-700 font-medium">
                      <span className="inline-flex items-center gap-1">
                        {translateNakshatra(t.nakshatra, lang)}
                        {getNakshatraAffinity(planet, t.nakshatra) === "friendly" && (
                          <span className="text-green-600 font-bold leading-none" title="Friendly nakshatra">↑</span>
                        )}
                        {getNakshatraAffinity(planet, t.nakshatra) === "enemy" && (
                          <span className="text-red-500 font-bold leading-none" title="Enemy nakshatra">↓</span>
                        )}
                      </span>
                    </td>
                    <td className="px-2 py-1 text-gray-600 whitespace-nowrap font-mono">
                      {fmtDateTime(t.entry_date, t.entry_time)}
                    </td>
                    <td className="px-2 py-1 text-gray-600 whitespace-nowrap font-mono">
                      {fmtDateTime(t.exit_date, t.exit_time)}
                    </td>
                    <td className="px-2 py-1 text-gray-500 whitespace-nowrap">
                      {fmtDuration(days)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
