"use client";

import { useRouter } from "next/navigation";
import MatchForm from "@/components/MatchForm";
import { MatchResponse } from "@/types/chart";

export default function MatchPage() {
  const router = useRouter();

  function handleResult(result: MatchResponse) {
    sessionStorage.setItem("matchResult", JSON.stringify(result));
    router.push("/match/result");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-1.5 text-indigo-700 font-bold text-base tracking-tight hover:text-indigo-500 transition-colors"
          >
            ✦ Jyotish
          </button>
          <div className="h-5 w-px bg-gray-200" />
          <span className="text-sm font-medium text-rose-700 bg-rose-50 px-3 py-1 rounded-lg">
            💞 Kundli Milan
          </span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-7">
          <h1 className="text-3xl font-bold text-gray-900 mb-1.5 tracking-tight">Kundli Milan</h1>
          <p className="text-gray-500 text-sm">Ashtakoot Guna Matching — 36-point Vedic compatibility analysis</p>
        </div>
        <MatchForm onResult={handleResult} />
      </main>

      <footer className="text-center text-gray-400 text-xs pb-8">
        Swiss Ephemeris · Sidereal / Lahiri Ayanamsa · Whole Sign Houses
      </footer>
    </div>
  );
}


