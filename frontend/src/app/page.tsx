"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BirthForm from "@/components/BirthForm";
import MatchForm from "@/components/MatchForm";
import { ChartResponse, ChartRequest, MatchResponse, MatchRequest } from "@/types/chart";
import { saveMatchRequest } from "@/lib/editPrefill";
import { setKundaliHistoryId, setMatchHistoryId } from "@/lib/historySession";

type Tab = "kundali" | "milan";

export default function HomePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("kundali");

  useEffect(() => {
    const saved = localStorage.getItem("jk_active_tab");
    if (saved === "kundali" || saved === "milan") setTab(saved as Tab);
  }, []);

  const switchTab = (t: Tab) => {
    setTab(t);
    try { localStorage.setItem("jk_active_tab", t); } catch { /* ignore */ }
  };

  function handleChartResult(chart: ChartResponse, req: ChartRequest) {
    sessionStorage.setItem("astroChart", JSON.stringify(chart));
    sessionStorage.setItem("astroReq", JSON.stringify(req));
    if (chart.history_id) setKundaliHistoryId(chart.history_id);
    router.push("/result");
  }

  function handleMatchResult(result: MatchResponse, req: MatchRequest) {
    sessionStorage.setItem("matchResult", JSON.stringify(result));
    saveMatchRequest(req);
    if (result.history_id) setMatchHistoryId(result.history_id);
    router.push("/match/result");
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ── */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <span className="font-black text-indigo-700 text-base tracking-tight select-none whitespace-nowrap">
            ✦ Jyotish
          </span>

          <div className="h-5 w-px bg-gray-200" />

          <div className="flex gap-1">
            <button
              onClick={() => switchTab("kundali")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                tab === "kundali"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              <span>🪐</span>
              <span>Janma Kundali</span>
            </button>

            <button
              onClick={() => switchTab("milan")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                tab === "milan"
                  ? "bg-rose-50 text-rose-700"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              <span>💞</span>
              <span>Kundli Milan</span>
            </button>

            <button
              onClick={() => router.push("/history")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-amber-700 hover:bg-amber-50 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>History</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Content ── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">

        {tab === "kundali" && (
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-50 rounded-2xl mb-4">
                <span className="text-2xl">🪐</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Janma Kundali</h1>
              <p className="text-gray-500 text-sm">
                Birth chart with all 60 D-charts, Vimshottari Dasha &amp; planet transits
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-3.5">
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
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-rose-50 rounded-2xl mb-4">
                <span className="text-2xl">💞</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Kundli Milan</h1>
              <p className="text-gray-500 text-sm">
                Ashtakoot Guna Matching — 36-point Vedic compatibility analysis
              </p>
            </div>
            <MatchForm onResult={handleMatchResult} />
          </div>
        )}

      </main>

      <footer className="text-center text-gray-300 text-xs pb-10">
        Swiss Ephemeris · Sidereal / Lahiri Ayanamsa · Whole Sign Houses
      </footer>
    </div>
  );
}


