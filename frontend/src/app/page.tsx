"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BirthForm from "@/components/BirthForm";
import MatchForm from "@/components/MatchForm";
import { ChartResponse, ChartRequest, MatchResponse, MatchRequest } from "@/types/chart";
import { saveMatchRequest } from "@/lib/editPrefill";
import { setKundaliHistoryId, setMatchHistoryId } from "@/lib/historySession";
import AppNavbar from "@/components/AppNavbar";

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
    <div className="min-h-screen bg-slate-50">

      <AppNavbar
        active={tab === "kundali" ? "kundali" : "milan"}
        onKundali={() => switchTab("kundali")}
        onMilan={() => switchTab("milan")}
        fullWidth
      />

      {/* ── Content ── */}
      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-12">

        {tab === "kundali" && (
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-50 rounded-2xl mb-4">
                <span className="text-3xl">🪐</span>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">Janma Kundali</h1>
              <p className="text-gray-500 text-base">
                Birth chart with all 60 D-charts, Vimshottari Dasha &amp; Planets transits
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-4">
                <h2 className="text-white font-bold text-base tracking-wide">Birth Details</h2>
              </div>
              <div className="p-6">
                <BirthForm onResult={handleChartResult} storageKey="jk_birth_form" />
              </div>
            </div>
          </div>
        )}

        {tab === "milan" && (
          <div>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-rose-50 rounded-2xl mb-4">
                <span className="text-3xl">💞</span>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">Kundli Milan</h1>
              <p className="text-gray-500 text-base">
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


