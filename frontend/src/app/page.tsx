"use client";

import { useRouter } from "next/navigation";
import BirthForm from "@/components/BirthForm";
import { ChartResponse, ChartRequest } from "@/types/chart";

export default function HomePage() {
  const router = useRouter();

  function handleResult(chart: ChartResponse, req: ChartRequest) {
    sessionStorage.setItem("astroChart", JSON.stringify(chart));
    sessionStorage.setItem("astroReq", JSON.stringify(req));
    router.push("/result");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">✦ Jyotish ✦</h1>
          <p className="text-indigo-300 text-sm tracking-widest uppercase">
            Vedic Birth Chart Calculator
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-indigo-950/50 overflow-hidden">
          <div className="bg-indigo-600 px-6 py-3">
            <h2 className="text-white font-semibold text-sm tracking-wide">Enter Birth Details</h2>
          </div>
          <div className="p-6">
            <BirthForm onResult={handleResult} />
          </div>
        </div>

        <p className="text-center text-indigo-400 text-xs mt-4">
          Calculations use Swiss Ephemeris · Sidereal / Whole Sign Houses
        </p>
      </div>
    </main>
  );
}
