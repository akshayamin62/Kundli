"use client";

import { useState, useEffect, useRef } from "react";
import { DashaPeriod, DashaRequest } from "@/types/chart";
import { calculateDasha } from "@/services/api";
import { type Lang, PLANET_NAMES } from "@/lib/translations";

interface Props {
  req: DashaRequest;
  lang?: Lang;
}

const PLANET_COLORS: Record<string, string> = {
  Sun: "#b45309", Moon: "#64748b", Mars: "#dc2626", Mercury: "#059669",
  Jupiter: "#c2410c", Venus: "#be185d", Saturn: "#475569",
  Rahu: "#1d4ed8", Ketu: "#92400e",
};

function pColor(planet: string) {
  return PLANET_COLORS[planet] ?? "#374151";
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

const today = new Date().toISOString().slice(0, 10);

// All 9 Vimshottari dasha planets in cycle order
const DASHA_ORDER = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];

export default function DashantariDashaTable({ req, lang = "en" }: Props) {
  const [periods, setPeriods] = useState<DashaPeriod[]>([]);
  const [nakInfo, setNakInfo] = useState<{ name: string; lord: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const activeRowRef = useRef<HTMLTableRowElement | null>(null);
  const hasScrolled = useRef(false);

  // Filter state: default to ALL
  const [filterMd, setFilterMd] = useState<string>("ALL");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    calculateDasha({ ...req, years_ahead: 120 })
      .then((data) => {
        if (cancelled) return;
        setPeriods(data.periods);
        setNakInfo({ name: data.nakshatra_name, lord: data.nakshatra_lord });

        // Find currently active period
        const idx = data.periods.findIndex(
          (p) => p.start_date <= today && today < p.end_date
        );
        setActiveIdx(idx);
        // Keep default as ALL — do not auto-select current MD
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [req]);

  // Scroll to active row once after data loads
  useEffect(() => {
    if (!loading && activeIdx >= 0 && !hasScrolled.current) {
      hasScrolled.current = true;
      setTimeout(() => {
        activeRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    }
  }, [loading, activeIdx]);

  // Reset scroll flag on new request
  useEffect(() => {
    hasScrolled.current = false;
  }, [req]);

  // Unique MDs in the data (used to dim buttons with no data)
  const mdsInData = new Set(periods.map((p) => p.md));

  const visible = filterMd === "ALL" ? periods : periods.filter((p) => p.md === filterMd);

  const tl = (key: "en" | "hi" | "gu") =>
    ({ en: "Vimshottari Dasha", hi: "विंशोत्तरी दशा", gu: "વિંશોત્તરી દશા" }[key]);

  const translate = (planet: string) =>
    PLANET_NAMES[lang]?.[planet] ?? planet;

  /* ── Loading / Error ─────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-gray-400 gap-2">
        <svg className="animate-spin h-4 w-4 text-indigo-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        Calculating dasha…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-red-500 px-4 text-center">
        Error: {error}
      </div>
    );
  }

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Sub-header ── */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-indigo-50 border-b border-indigo-100 shrink-0 gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-bold text-indigo-800">{tl(lang)}</span>
          {nakInfo && (
            <span className="text-[10px] text-indigo-500">
              ({nakInfo.name} · {translate(nakInfo.lord)})
            </span>
          )}
        </div>

        {/* MD filter buttons — always show all 9 */}
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => setFilterMd("ALL")}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors border ${
              filterMd === "ALL"
                ? "bg-indigo-700 text-white border-indigo-700"
                : "bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50"
            }`}
          >
            All
          </button>
          {DASHA_ORDER.map((md) => (
            <button
              key={md}
              onClick={() => setFilterMd(md)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors border ${
                filterMd === md
                  ? "bg-indigo-700 text-white border-indigo-700"
                  : mdsInData.has(md)
                  ? "bg-white border-gray-200 hover:bg-gray-50"
                  : "bg-white border-gray-100 opacity-40 cursor-default"
              }`}
              style={filterMd !== md ? { color: pColor(md) } : undefined}
              title={!mdsInData.has(md) ? "Not in current period" : undefined}
            >
              {translate(md)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr>
              {[
                { en: "MD", hi: "महादशा", gu: "મહાદશા" },
                { en: "AD", hi: "अंतर्दशा", gu: "અંતર્દશા" },
                { en: "PD", hi: "प्रत्यंतर", gu: "પ્રત્યંતર" },
                { en: "Starting", hi: "शुरुआत", gu: "શરૂ" },
                { en: "Ending",   hi: "अंत",    gu: "અંત" },
              ].map((h) => (
                <th
                  key={h.en}
                  className="px-2 py-1.5 text-left font-semibold text-gray-600 border-b border-gray-200 whitespace-nowrap"
                >
                  {h[lang]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => {
              const isActive = periods.indexOf(row) === activeIdx;
              const isPast = row.end_date < today;
              return (
                <tr
                  key={i}
                  ref={isActive ? activeRowRef : undefined}
                  className={`border-b border-gray-100 transition-colors ${
                    isActive
                      ? "bg-yellow-50 ring-1 ring-inset ring-yellow-300"
                      : isPast
                      ? "opacity-50 hover:opacity-80 hover:bg-gray-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <td className="px-2 py-1 font-semibold whitespace-nowrap" style={{ color: pColor(row.md) }}>
                    {translate(row.md)}
                  </td>
                  <td className="px-2 py-1 font-medium whitespace-nowrap" style={{ color: pColor(row.ad) }}>
                    {translate(row.ad)}
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap" style={{ color: pColor(row.pd) }}>
                    {translate(row.pd)}
                  </td>
                  <td className="px-2 py-1 text-gray-600 whitespace-nowrap font-mono">
                    {fmtDate(row.start_date)}
                    {isActive && (
                      <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-green-500 align-middle" />
                    )}
                  </td>
                  <td className="px-2 py-1 text-gray-600 whitespace-nowrap font-mono">
                    {fmtDate(row.end_date)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
