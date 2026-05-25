"use client";

import { useState } from "react";
import BirthForm from "@/components/BirthForm";
import ChartWheel from "@/components/ChartWheel";
import HouseTable from "@/components/HouseTable";
import { ChartResponse } from "@/types/chart";

export default function HomePage() {
  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [tab, setTab] = useState<"wheel" | "table">("wheel");

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
          onResult={(c) => {
            setChart(c);
            setTab("wheel");
          }}
        />

        {chart ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(["wheel", "table"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    tab === t
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {t === "wheel" ? "North Indian Chart" : "House & Planet Details"}
                </button>
              ))}
            </div>

            {tab === "wheel" ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-4 lg:p-6 shadow-sm">
                <ChartWheel chart={chart} />
              </div>
            ) : (
              <HouseTable chart={chart} />
            )}
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
