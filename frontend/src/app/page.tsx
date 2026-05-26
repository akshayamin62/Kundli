"use client";

import { useState, useRef, useEffect } from "react";
import BirthForm from "@/components/BirthForm";
import ChartWheel from "@/components/ChartWheel";
import HouseTable from "@/components/HouseTable";
import GrahshilChakraTable from "@/components/GrahshilChakraTable";
import { ChartResponse, ChartRequest } from "@/types/chart";
import { calculateVarga } from "@/services/api";

// D-chart quick-access tabs (shown inline)
const VARGA_TABS = [
  { n: 1,  label: "D1 Rashi" },
  { n: 9,  label: "D9 Navamsa" },
  { n: 10, label: "D10 Dashamsa" },
  { n: 3,  label: "D3 Drekkana" },
  { n: 7,  label: "D7 Saptamsa" },
  { n: 12, label: "D12 Dwadashamsa" },
];

// All D-charts for the overflow dropdown (D2–D60, excluding those already in VARGA_TABS)
const _TABS_SET = new Set(VARGA_TABS.map((t) => t.n));

interface VargaInfo { label: string; desc: string; }
const VARGA_INFO: Record<number, VargaInfo> = {
  1:  { label: "D1 – Rashi",                       desc: "Overall life, personality" },
  2:  { label: "D2 – Hora",                        desc: "Wealth, finances" },
  3:  { label: "D3 – Drekkana",                    desc: "Siblings, courage" },
  4:  { label: "D4 – Chaturthamsa",                desc: "Property, home, fortune" },
  5:  { label: "D5 – Panchamsa",                   desc: "Fame, authority, power" },
  6:  { label: "D6 – Shashthamsa",                 desc: "Diseases, enemies" },
  7:  { label: "D7 – Saptamsa",                    desc: "Children, progeny" },
  8:  { label: "D8 – Ashtamsa",                    desc: "Longevity, obstacles" },
  9:  { label: "D9 – Navamsa",                     desc: "Marriage, dharma, spouse" },
  10: { label: "D10 – Dashamsa",                   desc: "Career, profession" },
  11: { label: "D11 – Rudramsa",                   desc: "Gains, achievements" },
  12: { label: "D12 – Dwadashamsa",                desc: "Parents, ancestry" },
  13: { label: "D13 – Trayodashamsa",              desc: "Rarely used" },
  14: { label: "D14 – Chaturdashamsa",             desc: "Rarely used" },
  15: { label: "D15 – Panchadashamsa",             desc: "Spiritual inclinations" },
  16: { label: "D16 – Shodashamsa",                desc: "Vehicles, comforts, luxuries" },
  17: { label: "D17 – Saptadashamsa",              desc: "Strength, authority" },
  18: { label: "D18 – Ashtadashamsa",              desc: "Conflicts, struggles" },
  19: { label: "D19 – Ekonavimshamsa",             desc: "Spiritual development" },
  20: { label: "D20 – Vimshamsa",                  desc: "Spirituality, worship" },
  21: { label: "D21 – Ekavimshamsa",               desc: "Status, recognition" },
  22: { label: "D22 – Chaturvimshamsa",            desc: "Learning capacity" },
  23: { label: "D23 – Trayovimshamsa",             desc: "Intelligence" },
  24: { label: "D24 – Siddhamsa",                  desc: "Education, academics" },
  25: { label: "D25 – Panchavimshamsa",            desc: "Fame, creativity" },
  26: { label: "D26 – Shadvimshamsa",              desc: "Weaknesses, defects" },
  27: { label: "D27 – Nakshatramsa",               desc: "Physical & mental strength" },
  28: { label: "D28 – Ashtavimshamsa",             desc: "Hidden strengths" },
  29: { label: "D29 – Navavimshamsa",              desc: "Karmic tendencies" },
  30: { label: "D30 – Trimshamsa",                 desc: "Misfortunes, hidden karma" },
  31: { label: "D31 – Ekatrimshamsa",              desc: "Hidden weaknesses" },
  32: { label: "D32 – Dvatrimshamsa",              desc: "Material stability" },
  33: { label: "D33 – Trayatrimshamsa",            desc: "Spiritual protection" },
  34: { label: "D34 – Chaturtrimshamsa",           desc: "Career growth obstacles" },
  35: { label: "D35 – Panchatrimshamsa",           desc: "Mental endurance" },
  36: { label: "D36 – Shashtitrimshamsa",          desc: "Collective karma" },
  37: { label: "D37 – Saptatrimshamsa",            desc: "Family lineage" },
  38: { label: "D38 – Ashtatrimshamsa",            desc: "Sudden transformations" },
  39: { label: "D39 – Navatrimshamsa",             desc: "Fortune through spiritual maturity" },
  40: { label: "D40 – Khavedamsa",                 desc: "Maternal lineage karma" },
  41: { label: "D41 – Ekachattvarimsha",           desc: "Hidden talents" },
  42: { label: "D42 – Dvichattvarimsha",           desc: "Emotional healing" },
  43: { label: "D43 – Trichattvarimsha",           desc: "Dharma under pressure" },
  44: { label: "D44 – Chatushchattvarimsha",       desc: "Stability of karma" },
  45: { label: "D45 – Akshavedamsa",               desc: "Paternal lineage karma" },
  46: { label: "D46 – Shatchattvarimsha",          desc: "Personal authority" },
  47: { label: "D47 – Saptachattvarimsha",         desc: "Intellectual refinement" },
  48: { label: "D48 – Ashtachattvarimsha",         desc: "Subconscious tendencies" },
  49: { label: "D49 – Navachattvarimsha",          desc: "Destiny refinement" },
  50: { label: "D50 – Panchashamsa",               desc: "Spiritual merit" },
  51: { label: "D51 – Ekapanchashamsa",            desc: "Moral conflicts" },
  52: { label: "D52 – Dvipanchashamsa",            desc: "Higher intuition" },
  53: { label: "D53 – Tripanchashamsa",            desc: "Hidden psychology" },
  54: { label: "D54 – Chatushpanchashamsa",        desc: "Karmic effort" },
  55: { label: "D55 – Panchapanchashamsa",         desc: "Subtle reputation" },
  56: { label: "D56 – Shatpanchashamsa",           desc: "Long-term karma" },
  57: { label: "D57 – Saptapanchashamsa",          desc: "Spiritual resilience" },
  58: { label: "D58 – Ashtapanchashamsa",          desc: "Ego dissolution" },
  59: { label: "D59 – Navapanchashamsa",           desc: "Pre-final karmic refinement" },
  60: { label: "D60 – Shashtiamsa",                desc: "Past life karma" },
};

const ALL_VARGAS: { n: number; label: string; desc: string }[] = Array.from(
  { length: 59 },
  (_, i) => i + 2,
)
  .filter((n) => !_TABS_SET.has(n))
  .map((n) => ({
    n,
    label: VARGA_INFO[n]?.label ?? `D${n}`,
    desc:  VARGA_INFO[n]?.desc  ?? "",
  }));

export default function HomePage() {
  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [lastReq, setLastReq] = useState<ChartRequest | null>(null);
  const [activeVarga, setActiveVarga] = useState<number>(1);
  const [vargaCache, setVargaCache] = useState<Record<number, ChartResponse>>({});
  const [vargaLoading, setVargaLoading] = useState(false);
  const [vargaError, setVargaError] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close "More" dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function switchVarga(n: number) {
    if (!lastReq) return;
    setActiveVarga(n);
    setMoreOpen(false);

    if (n === 1) {
      setVargaError(null);
      return;
    }

    if (vargaCache[n]) {
      setVargaError(null);
      return;
    }

    setVargaLoading(true);
    setVargaError(null);
    try {
      const result = await calculateVarga({ ...lastReq, n });
      setVargaCache((prev) => ({ ...prev, [n]: result }));
    } catch (err: unknown) {
      setVargaError(err instanceof Error ? err.message : "Failed to load chart");
    } finally {
      setVargaLoading(false);
    }
  }

  // The chart data to display (D1 uses base `chart`, others from cache)
  const displayChart = activeVarga === 1 ? chart : (vargaCache[activeVarga] ?? chart);

  return (
    <main className="min-h-screen bg-white text-gray-900 px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-purple-600 mb-2">
          ✦ Astrology ✦
        </h1>
        <p className="text-indigo-500 text-sm tracking-widest uppercase">
          Birth Chart & 12-House Calculator
        </p>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        <BirthForm
          onResult={(c, req) => {
            setChart(c);
            setLastReq(req);
            setVargaCache({});
            setActiveVarga(1);
            setVargaError(null);
          }}
        />

        {chart ? (
          <div className="space-y-6">
            {/* D-chart selector */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-1">
                Divisional:
              </span>
              {VARGA_TABS.map(({ n, label }) => (
                <button
                  key={n}
                  onClick={() => switchVarga(n)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeVarga === n
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-700"
                  }`}
                >
                  {label}
                </button>
              ))}

              {/* More dropdown */}
              <div className="relative" ref={moreRef}>
                <button
                  onClick={() => setMoreOpen((v) => !v)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    ALL_VARGAS.some((v) => v.n === activeVarga)
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-700"
                  }`}
                >
                  More ▾
                </button>
                {moreOpen && (
                  <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[240px] max-h-80 overflow-y-auto">
                    {ALL_VARGAS.map(({ n, label, desc }) => (
                      <button
                        key={n}
                        onClick={() => switchVarga(n)}
                        className={`w-full text-left px-4 py-2 transition-colors ${
                          activeVarga === n
                            ? "bg-purple-50 text-purple-700"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <div className="text-xs font-semibold">{label}</div>
                        {desc && <div className="text-[10px] text-gray-400 mt-0.5">{desc}</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {vargaLoading && (
                <span className="text-xs text-gray-400 ml-1">Loading…</span>
              )}
            </div>

            {vargaError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                {vargaError}
              </div>
            )}

            {/* Chart */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 lg:p-6 shadow-sm">
              {displayChart && <ChartWheel chart={displayChart} />}
            </div>

            {/* Planet details — always shows natal (D1) data */}
            <HouseTable chart={chart} />

            {/* Grahshil Chakra reference table */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 lg:p-6 shadow-sm">
              <GrahshilChakraTable />
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-sm text-gray-600 space-y-2">
            <p className="text-gray-800 font-semibold">How it works:</p>
            <p>1. Enter your exact birth date, time, and place</p>
            <p>2. The engine geocodes your city to precise coordinates</p>
            <p>3. Calculates Julian Day, sidereal time and obliquity</p>
            <p>4. Derives Ascendant, MC, and all 12 house cusps</p>
            <p>5. Computes planetary positions (high-accuracy ephemeris)</p>
            <p>6. Renders your complete natal chart</p>
          </div>
        )}
      </div>
    </main>
  );
}
