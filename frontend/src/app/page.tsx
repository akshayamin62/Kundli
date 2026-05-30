"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BirthForm from "@/components/BirthForm";
import MatchForm from "@/components/MatchForm";
import { ChartResponse, ChartRequest, MatchResponse } from "@/types/chart";

type Tab = "kundali" | "milan";

export default function HomePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("kundali");

  // Restore last-active tab from localStorage after hydration
  useEffect(() => {
    const saved = localStorage.getItem("jk_active_tab");
    if (saved === "kundali" || saved === "milan") setTab(saved);
  }, []);

  const switchTab = (t: Tab) => {
    setTab(t);
    try { localStorage.setItem("jk_active_tab", t); } catch { /* ignore */ }
  };

  function handleChartResult(chart: ChartResponse, req: ChartRequest) {
    sessionStorage.setItem("astroChart", JSON.stringify(chart));
    sessionStorage.setItem("astroReq", JSON.stringify(req));
    router.push("/result");
  }

  function handleMatchResult(result: MatchResponse) {
    sessionStorage.setItem("matchResult", JSON.stringify(result));
    router.push("/match/result");
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Navbar ── */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          {/* Brand */}
          <span className="font-bold text-indigo-700 text-base tracking-tight select-none whitespace-nowrap">
            ✦ Jyotish
          </span>

          <div className="h-5 w-px bg-gray-200" />

          {/* Tabs */}
          <div className="flex gap-1">
            <button
              onClick={() => switchTab("kundali")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                tab === "kundali"
                  ? "bg-indigo-50 text-indigo-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
              <span>🪐</span>
              <span>Janma Kundali</span>
            </button>

            <button
              onClick={() => switchTab("milan")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                tab === "milan"
                  ? "bg-rose-50 text-rose-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
              <span>💞</span>
              <span>Kundli Milan</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Content ── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

        {tab === "kundali" && (
          <div className="max-w-md mx-auto">
            <div className="text-center mb-7">
              <h1 className="text-3xl font-bold text-gray-900 mb-1.5 tracking-tight">Janma Kundali</h1>
              <p className="text-gray-500 text-sm">
                Birth chart with all 60 D-charts, Vimshottari Dasha &amp; planet transits
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              <div className="bg-indigo-600 px-5 py-3">
                <h2 className="text-white font-semibold text-sm tracking-wide">Birth Details</h2>
              </div>
              <div className="p-5">
                <BirthForm onResult={handleChartResult} storageKey="jk_birth_form" />
              </div>
            </div>
          </div>
        )}

        {tab === "milan" && (
          <div>
            <div className="text-center mb-7">
              <h1 className="text-3xl font-bold text-gray-900 mb-1.5 tracking-tight">Kundli Milan</h1>
              <p className="text-gray-500 text-sm">
                Ashtakoot Guna Matching — 36-point Vedic compatibility analysis
              </p>
            </div>
            <MatchForm onResult={handleMatchResult} />
          </div>
        )}

      </main>

      <footer className="text-center text-gray-400 text-xs pb-8">
        Swiss Ephemeris · Sidereal / Lahiri Ayanamsa · Whole Sign Houses
      </footer>
    </div>
  );
}


