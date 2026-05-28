"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import ChartWheel from "@/components/ChartWheel";
import HouseTable from "@/components/HouseTable";
import DashantariDashaTable from "@/components/DashantariDashaTable";
import PlanetsRashiTransit from "@/components/PlanetsRashiTransit";
import GrahshilChakraTable from "@/components/GrahshilChakraTable";
import { ChartResponse, ChartRequest } from "@/types/chart";
import { calculateChart, calculateVarga } from "@/services/api";
import { type Lang } from "@/lib/translations";

// ─── Varga metadata ──────────────────────────────────────────────────────────
const VARGA_INFO: Record<number, string> = {
  1: "D1 – Rashi",          2: "D2 – Hora",             3: "D3 – Drekkana",
  4: "D4 – Chaturthamsa",   5: "D5 – Panchamsa",         6: "D6 – Shashthamsa",
  7: "D7 – Saptamsa",       8: "D8 – Ashtamsa",          9: "D9 – Navamsa",
  10: "D10 – Dashamsa",     11: "D11 – Rudramsa",        12: "D12 – Dwadashamsa",
  13: "D13",                 14: "D14",                   15: "D15 – Panchadashamsa",
  16: "D16 – Shodashamsa",  17: "D17",                   18: "D18",
  19: "D19",                 20: "D20 – Vimshamsa",       21: "D21",
  22: "D22 – Chaturvimshamsa", 23: "D23",                24: "D24 – Siddhamsa",
  25: "D25",                 26: "D26",                   27: "D27 – Nakshatramsa",
  28: "D28",                 29: "D29",                   30: "D30 – Trimshamsa",
  31: "D31",                 32: "D32",                   33: "D33",
  34: "D34",                 35: "D35",                   36: "D36",
  37: "D37",                 38: "D38",                   39: "D39",
  40: "D40 – Khavedamsa",   41: "D41",                   42: "D42",
  43: "D43",                 44: "D44",                   45: "D45 – Akshavedamsa",
  46: "D46",                 47: "D47",                   48: "D48",
  49: "D49",                 50: "D50 – Panchashamsa",    51: "D51",
  52: "D52",                 53: "D53",                   54: "D54",
  55: "D55",                 56: "D56",                   57: "D57",
  58: "D58",                 59: "D59",                   60: "D60 – Shashtiamsa",
};

const QUICK_VARGAS = [9, 10, 3, 7, 12, 16, 20, 24, 30, 40, 45, 60];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function padZ(n: number) { return String(n).padStart(2, "0"); }

function nowIST() {
  // Return current IST date & time strings
  const now = new Date();
  const y = now.getFullYear();
  const mo = padZ(now.getMonth() + 1);
  const d = padZ(now.getDate());
  const h = padZ(now.getHours());
  const mi = padZ(now.getMinutes());
  return { date: `${y}-${mo}-${d}`, time: `${h}:${mi}` };
}

// ─── ChartPanel ───────────────────────────────────────────────────────────────
interface PanelProps {
  title: string;
  accent?: "indigo" | "teal" | "purple";
  headerRight?: React.ReactNode;
  loading?: boolean;
  children: React.ReactNode;
}
function ChartPanel({ title, accent = "indigo", headerRight, loading, children }: PanelProps) {
  const hdrBg =
    accent === "teal"   ? "bg-teal-50 border-teal-100"   :
    accent === "purple" ? "bg-purple-50 border-purple-100" :
                          "bg-indigo-50 border-indigo-100";
  const titleColor =
    accent === "teal"   ? "text-teal-900"   :
    accent === "purple" ? "text-purple-900" :
                          "text-indigo-900";
  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden h-full">
      <div className={`${hdrBg} border-b px-3 py-1.5 flex items-center justify-between shrink-0`}>
        <span className={`text-xs font-bold ${titleColor}`}>{title}</span>
        {headerRight}
      </div>
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full text-xs text-gray-400">
            <svg className="animate-spin h-4 w-4 mr-1 text-indigo-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
            </svg>
            Loading…
          </div>
        ) : children}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ResultPage() {
  const router = useRouter();

  const [chart, setChart]             = useState<ChartResponse | null>(null);
  const [req, setReq]                 = useState<ChartRequest | null>(null);
  const [lang, setLang]               = useState<Lang>("en");

  type MainTab = "kundali" | "grahsil";
  const [mainTab, setMainTab]         = useState<MainTab>("kundali");

  type Tab = "planets" | "dasha" | "transit";
  const [activeTab, setActiveTab]     = useState<Tab>("planets");

  const TAB_LABELS: Record<Lang, Record<Tab, string>> = {
    en: { planets: "a) Planets", dasha: "b) Vimshottari Dasha", transit: "c) Rashi Transit" },
    hi: { planets: "अ) ग्रह स्थिति", dasha: "ब) विंशोत्तरी दशा", transit: "स) राशि गोचर" },
    gu: { planets: "અ) ગ્રહ સ્થિતિ", dasha: "બ) વિંશોત્તરી દશા", transit: "ક) રાશિ ગોચર" },
  };

  // D-chart (middle panel)
  const [selectedN, setSelectedN]     = useState(9);
  const [vargaChart, setVargaChart]   = useState<ChartResponse | null>(null);
  const [vargaLoading, setVargaLoading] = useState(false);
  const [vargaOpen, setVargaOpen]     = useState(false);
  const vargaRef                      = useRef<HTMLDivElement>(null);

  // Gochar (right-bottom panel)
  const [gocharChart, setGocharChart]     = useState<ChartResponse | null>(null);
  const [gocharLoading, setGocharLoading] = useState(false);
  const [gocharNow, setGocharNow]         = useState(nowIST());

  // ── Load from sessionStorage ───────────────────────────────────────────────
  useEffect(() => {
    const raw  = sessionStorage.getItem("astroChart");
    const rawR = sessionStorage.getItem("astroReq");
    if (raw && rawR) {
      setChart(JSON.parse(raw));
      setReq(JSON.parse(rawR));
    } else {
      router.replace("/");
    }
  }, [router]);

  // ── Fetch varga once req is ready ─────────────────────────────────────────
  const fetchVarga = useCallback(async (n: number, reqData: ChartRequest) => {
    setVargaLoading(true);
    try {
      const result = await calculateVarga({ ...reqData, n });
      setVargaChart(result);
      setSelectedN(n);
    } catch { /* silently ignore */ }
    finally { setVargaLoading(false); }
  }, []);

  const fetchGochar = useCallback(async (reqData: ChartRequest, dt?: { date: string; time: string }) => {
    setGocharLoading(true);
    const now = dt ?? nowIST();
    setGocharNow(now);
    try {
      const result = await calculateChart({ ...reqData, birth_date: now.date, birth_time: now.time });
      setGocharChart(result);
    } catch { /* silently ignore */ }
    finally { setGocharLoading(false); }
  }, []);

  useEffect(() => {
    if (!req) return;
    fetchVarga(9, req);
    fetchGochar(req);
  }, [req, fetchVarga, fetchGochar]);

  // ── Close varga dropdown on outside click ─────────────────────────────────
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (vargaRef.current && !vargaRef.current.contains(e.target as Node))
        setVargaOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Not yet loaded ─────────────────────────────────────────────────────────
  if (!chart) {
    return (
      <div className="flex items-center justify-center h-screen bg-indigo-50 text-indigo-700 text-sm font-semibold">
        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
        </svg>
        Loading chart…
      </div>
    );
  }

  const meta = chart.meta;
  const selectedLabel = VARGA_INFO[selectedN] ?? `D${selectedN}`;

  // ── Varga selector header button ───────────────────────────────────────────
  const VargaSelector = (
    <div className="relative" ref={vargaRef}>
      <button
        onClick={() => setVargaOpen(v => !v)}
        className="bg-white border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded text-xs font-semibold hover:bg-indigo-50 transition-colors"
      >
        Select ▾
      </button>
      {vargaOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl py-1 w-60 max-h-72 overflow-y-auto">
          {/* Quick picks */}
          <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Popular</div>
          {QUICK_VARGAS.map(n => (
            <button
              key={n}
              onClick={() => { fetchVarga(n, req!); setVargaOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${selectedN === n ? "bg-indigo-50 text-indigo-700 font-bold" : "text-gray-700 hover:bg-gray-50"}`}
            >
              {VARGA_INFO[n]}
            </button>
          ))}
          <div className="border-t border-gray-100 my-1"/>
          <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">All Vargas</div>
          {Array.from({ length: 59 }, (_, i) => i + 2)
            .filter(n => !QUICK_VARGAS.includes(n))
            .map(n => (
              <button
                key={n}
                onClick={() => { fetchVarga(n, req!); setVargaOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${selectedN === n ? "bg-indigo-50 text-indigo-700 font-bold" : "text-gray-700 hover:bg-gray-50"}`}
              >
                {VARGA_INFO[n] ?? `D${n}`}
              </button>
            ))}
        </div>
      )}
    </div>
  );

  // ── Gochar header ──────────────────────────────────────────────────────────
  const GocharHeader = (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-teal-600">{gocharNow.date} {gocharNow.time}</span>
      <button
        onClick={() => fetchGochar(req!)}
        className="bg-white border border-teal-200 text-teal-700 px-2 py-0.5 rounded text-xs font-semibold hover:bg-teal-50 transition-colors"
      >
        ↻ Now
      </button>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-100">

      {/* ── Header ── */}
      <header className="bg-indigo-950 text-white px-4 py-2 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push("/")}
            className="bg-indigo-800 hover:bg-indigo-700 px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors"
          >
            ← New Chart
          </button>
          <span className="font-bold text-sm truncate">{meta.birth_place}</span>
          <span className="text-indigo-300 text-xs shrink-0 hidden sm:block">
            {meta.birth_date} · {meta.birth_time} · {meta.timezone}
          </span>
        </div>
        {/* Language toggle */}
        <div className="flex items-center gap-1 shrink-0">
          {(["en", "hi", "gu"] as Lang[]).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-2.5 py-0.5 rounded text-xs font-bold transition-colors ${
                lang === l ? "bg-white text-indigo-900" : "text-indigo-300 hover:text-white"
              }`}
            >
              {l === "en" ? "EN" : l === "hi" ? "हि" : "ગુ"}
            </button>
          ))}
        </div>
      </header>

      {/* ── Top page-level tab bar ── */}
      <div className="bg-white border-b border-gray-200 px-4 shrink-0">
        <div className="flex gap-0">
          {([
            { id: "kundali" as MainTab, labels: { en: "Kundali", hi: "कुंडली", gu: "કુંડળી" } },
            { id: "grahsil" as MainTab, labels: { en: "Grahsil Chakra", hi: "ग्रहशील चक्र", gu: "ગ્રહશીલ ચક્ર" } },
          ]).map(({ id, labels }) => (
            <button
              key={id}
              onClick={() => setMainTab(id)}
              className={`px-5 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                mainTab === id
                  ? "border-indigo-600 text-indigo-700 bg-indigo-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {labels[lang]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex gap-2 p-2 flex-1 min-h-0 overflow-hidden">

        {/* ── Grahsil Chakra tab ── */}
        {mainTab === "grahsil" && (
          <div className="flex-1 min-h-0 overflow-auto">
            <GrahshilChakraTable lang={lang} />
          </div>
        )}

        {/* ── Kundali tab ── */}
        {mainTab === "kundali" && (<>

        {/* ── Left column: D1 chart + 3-tab bottom ── */}
        <div className="flex flex-col gap-2 min-h-0 overflow-hidden" style={{ width: "60%" }}>

          {/* D1 Lagna Kundli — top ~55% */}
          <div className="min-h-0" style={{ flex: "0 0 55%" }}>
            <ChartPanel title="Lagna Kundli (D1)" accent="indigo">
              <ChartWheel chart={chart} lang={lang} />
            </ChartPanel>
          </div>

          {/* 3-Tab system — bottom ~45% */}
          <div className="flex flex-col flex-1 min-h-0 rounded-xl border border-gray-200 bg-white overflow-hidden">

            {/* Tab bar */}
            <div className="flex border-b border-gray-200 shrink-0 bg-gray-50">
              {(["planets", "dasha", "transit"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-2 py-2 text-[11px] font-semibold transition-colors border-b-2 ${
                    activeTab === tab
                      ? "border-indigo-600 text-indigo-700 bg-white"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {TAB_LABELS[lang][tab]}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {activeTab === "planets" && (
                <div className="h-full overflow-auto">
                  <HouseTable chart={chart} lang={lang} />
                </div>
              )}
              {activeTab === "dasha" && req && (
                <DashantariDashaTable req={req} lang={lang} />
              )}
              {activeTab === "transit" && req && (
                <PlanetsRashiTransit zodiac={req.zodiac} lang={lang} />
              )}
            </div>
          </div>
        </div>

        {/* ── Right column: D-chart + Gochar (full height) ── */}
        <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-hidden">

          {/* D-chart with varga selector — top 50% */}
          <div className="flex-1 min-h-0">
            <ChartPanel
              title={selectedLabel}
              accent="purple"
              headerRight={VargaSelector}
              loading={vargaLoading}
            >
              {vargaChart && <ChartWheel chart={vargaChart} lang={lang} />}
            </ChartPanel>
          </div>

          {/* Gochar Kundli — bottom 50% */}
          <div className="flex-1 min-h-0">
            <ChartPanel
              title="Gochar Kundli"
              accent="teal"
              headerRight={GocharHeader}
              loading={gocharLoading}
            >
              {gocharChart && <ChartWheel chart={gocharChart} lang={lang} />}
            </ChartPanel>
          </div>
        </div>

        </>)}
      </div>
    </div>
  );
}
