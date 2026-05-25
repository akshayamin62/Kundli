"use client";

import { useState, useRef, useEffect } from "react";
import BirthForm from "@/components/BirthForm";
import ChartWheel from "@/components/ChartWheel";
import HouseTable from "@/components/HouseTable";
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

// All D-charts for the overflow dropdown
const ALL_VARGAS: { n: number; label: string }[] = [
  { n: 2,  label: "D2 – Hora" },
  { n: 4,  label: "D4 – Chaturthamsha" },
  { n: 5,  label: "D5 – Panchamsha" },
  { n: 6,  label: "D6 – Shashthamsha" },
  { n: 8,  label: "D8 – Ashtamsha" },
  { n: 11, label: "D11 – Ekadashamsha" },
  { n: 16, label: "D16 – Shodashamsha" },
  { n: 20, label: "D20 – Vimshamsha" },
  { n: 24, label: "D24 – Chaturvimshamsha" },
  { n: 27, label: "D27 – Bhamsha" },
  { n: 30, label: "D30 – Trimshamsha" },
  { n: 40, label: "D40 – Khavedamsha" },
  { n: 45, label: "D45 – Akshavedamsha" },
  { n: 60, label: "D60 – Shashtiamsa" },
];

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
                  <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[200px] max-h-72 overflow-y-auto">
                    {ALL_VARGAS.map(({ n, label }) => (
                      <button
                        key={n}
                        onClick={() => switchVarga(n)}
                        className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors ${
                          activeVarga === n
                            ? "bg-purple-50 text-purple-700"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {label}
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
