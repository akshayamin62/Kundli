"use client";

import { useRouter } from "next/navigation";
import MatchForm from "@/components/MatchForm";
import { MatchResponse } from "@/types/chart";
import AppNavbar from "@/components/AppNavbar";

export default function MatchPage() {
  const router = useRouter();

  function handleResult(result: MatchResponse) {
    sessionStorage.setItem("matchResult", JSON.stringify(result));
    router.push("/match/result");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <AppNavbar active="milan" />

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


