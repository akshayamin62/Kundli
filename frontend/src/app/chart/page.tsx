"use client";

import { useRouter } from "next/navigation";
import BirthForm from "@/components/BirthForm";
import { ChartResponse, ChartRequest } from "@/types/chart";
import { enrichChartRequestFromMeta } from "@/lib/editPrefill";

export default function ChartPage() {
  const router = useRouter();

  function handleResult(chart: ChartResponse, req: ChartRequest) {
    const enriched = enrichChartRequestFromMeta(req, chart);
    sessionStorage.setItem("astroChart", JSON.stringify(chart));
    sessionStorage.setItem("astroReq", JSON.stringify(enriched));
    router.push("/result");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Back link */}
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-1.5 text-indigo-300 hover:text-white text-xs mb-6 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Home
        </button>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">🪐 Janma Kundali</h1>
          <p className="text-indigo-300 text-sm">Enter birth details to generate your Vedic birth chart</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-indigo-950/50 overflow-hidden">
          <div className="bg-indigo-600 px-6 py-3">
            <h2 className="text-white font-semibold text-sm tracking-wide">Birth Details</h2>
          </div>
          <div className="p-6">
            <BirthForm onResult={handleResult} />
          </div>
        </div>

        <p className="text-center text-indigo-400 text-xs mt-4">
          Swiss Ephemeris · Sidereal / Lahiri Ayanamsa · Whole Sign Houses
        </p>
      </div>
    </main>
  );
}
