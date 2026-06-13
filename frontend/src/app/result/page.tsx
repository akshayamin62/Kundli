"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import ChartWheel from "@/components/ChartWheel";
import HouseTable from "@/components/HouseTable";
import DashantariDashaTable from "@/components/DashantariDashaTable";
import PlanetsRashiTransit from "@/components/PlanetsRashiTransit";
import GrahshilChakraTable from "@/components/GrahshilChakraTable";
import PitruDoshaPanel from "@/components/PitruDoshaPanel";
import KaalSarpaPanel from "@/components/KaalSarpaPanel";
import ChandalDoshaPanel from "@/components/ChandalDoshaPanel";
import { ChartResponse, ChartRequest } from "@/types/chart";
import { calculateChart, calculateVarga, calculateVargaBulk } from "@/services/api";
import { type Lang, SIGN_NAMES, NAKSHATRA_NAMES } from "@/lib/translations";
import { getMoonJanmaFromChart, toMoonChart } from "@/lib/chartTransforms";
import { downloadKundliReport } from "@/lib/reportGenerator";
import FormModal from "@/components/FormModal";
import BirthForm from "@/components/BirthForm";
import AppLogo from "@/components/AppLogo";
import { resolveKundaliHistoryId, setKundaliHistoryId } from "@/lib/historySession";
import { normalizeChartRequest } from "@/lib/chartRequestNormalize";

// ─── Varga metadata ──────────────────────────────────────────────────────────
interface VargaMeta { name: string; area: string; }
const VARGA_INFO: Record<number, VargaMeta> = {
  1:  { name: "Rashi / Lagna Chart",          area: "Overall life, personality" },
  2:  { name: "Hora",                          area: "Wealth, finances" },
  3:  { name: "Drekkana",                      area: "Siblings, courage" },
  4:  { name: "Chaturthamsa",                  area: "Property, home, fortune" },
  5:  { name: "Panchamsa",                     area: "Fame, authority, power" },
  6:  { name: "Shashthamsa",                   area: "Diseases, enemies" },
  7:  { name: "Saptamsa",                      area: "Children, progeny" },
  8:  { name: "Ashtamsa",                      area: "Longevity, obstacles" },
  9:  { name: "Navamsa",                       area: "Marriage, dharma, spouse" },
  10: { name: "Dashamsa",                      area: "Career, profession" },
  11: { name: "Rudramsa / Ekadashamsa",        area: "Gains, achievements" },
  12: { name: "Dwadashamsa",                   area: "Parents, ancestry" },
  13: { name: "Trayodashamsa",                 area: "Rarely used" },
  14: { name: "Chaturdashamsa",                area: "Rarely used" },
  15: { name: "Panchadashamsa",                area: "Spiritual inclinations" },
  16: { name: "Shodashamsa",                   area: "Vehicles, comforts, luxuries" },
  17: { name: "Saptadashamsa",                 area: "Strength, authority" },
  18: { name: "Ashtadashamsa",                 area: "Conflicts, struggles" },
  19: { name: "Ekonavimshamsa",                area: "Spiritual development" },
  20: { name: "Vimshamsa",                     area: "Spirituality, worship" },
  21: { name: "Ekavimshamsa",                  area: "Status, recognition" },
  22: { name: "Chaturvimshamsa",               area: "Learning capacity" },
  23: { name: "Trayovimshamsa",                area: "Intelligence" },
  24: { name: "Siddhamsa / Chaturvimshamsa",   area: "Education, academics" },
  25: { name: "Panchavimshamsa",               area: "Fame, creativity" },
  26: { name: "Shadvimshamsa",                 area: "Weaknesses, defects" },
  27: { name: "Nakshatramsa / Bhamsa",         area: "Physical & mental strength" },
  28: { name: "Ashtavimshamsa",                area: "Hidden strengths" },
  29: { name: "Navavimshamsa",                 area: "Karmic tendencies" },
  30: { name: "Trimshamsa",                    area: "Misfortunes, hidden karma" },
  31: { name: "Ekatrimshamsa",                 area: "Hidden weaknesses, subconscious karmic patterns" },
  32: { name: "Dvatrimshamsa",                 area: "Material stability, hidden fortune fluctuations" },
  33: { name: "Trayatrimshamsa",               area: "Spiritual protection, unseen divine support" },
  34: { name: "Chaturtrimshamsa",              area: "Obstacles in career growth and social rise" },
  35: { name: "Panchatrimshamsa",              area: "Mental endurance, resistance against adversity" },
  36: { name: "Shashtitrimshamsa",             area: "Collective karma, social influence patterns" },
  37: { name: "Saptatrimshamsa",               area: "Family lineage effects and inherited tendencies" },
  38: { name: "Ashtatrimshamsa",               area: "Sudden transformations and instability" },
  39: { name: "Navatrimshamsa",                area: "Fortune evolution through spiritual maturity" },
  40: { name: "Khavedamsa",                    area: "Maternal lineage karma, ancestral blessings" },
  41: { name: "Ekachatvarimshamsa",            area: "Hidden talents emerging later in life" },
  42: { name: "Dvichatvarimshamsa",            area: "Emotional purification and inner healing" },
  43: { name: "Trichatvarimshamsa",            area: "Dharma under pressure, ethical testing" },
  44: { name: "Chatushchatvarimshamsa",        area: "Stability of accumulated karma and legacy" },
  45: { name: "Akshavedamsa",                  area: "Paternal lineage karma, ancestral blessings" },
  46: { name: "Shatchatvarimshamsa",           area: "Stability of personal authority and influence" },
  47: { name: "Saptachatvarimshamsa",          area: "Intellectual refinement and advanced thinking" },
  48: { name: "Ashtachatvarimshamsa",          area: "Deep subconscious tendencies and hidden fears" },
  49: { name: "Navachatvarimshamsa",           area: "Destiny refinement through repeated experiences" },
  50: { name: "Panchashamsa",                  area: "Spiritual merit accumulated from past karmas" },
  51: { name: "Ekapanchashamsa",               area: "Internal moral conflicts and ethical evolution" },
  52: { name: "Dvipanchashamsa",               area: "Higher intuitive intelligence" },
  53: { name: "Tripanchashamsa",               area: "Hidden psychological patterns" },
  54: { name: "Chatushpanchashamsa",           area: "Persistence, determination, karmic effort" },
  55: { name: "Panchapanchashamsa",            area: "Recognition, honor, reputation at subtle level" },
  56: { name: "Shatpanchashamsa",              area: "Long-term karmic consequences of actions" },
  57: { name: "Saptapanchashamsa",             area: "Spiritual resilience and inner awakening" },
  58: { name: "Ashtapanchashamsa",             area: "Dissolution of ego and karmic purification" },
  59: { name: "Navapanchashamsa",              area: "Pre-final karmic refinement before D60" },
  60: { name: "Shashtiamsa",                   area: "Past life karma, root karma" },
};

/** Title shown in chart panel header and dropdown: "D9 – Navamsa · Marriage, dharma, spouse" */
function vargaTitle(n: number): string {
  const v = VARGA_INFO[n];
  if (!v) return `D${n}`;
  return v.area === "Rarely used" ? `D${n} – ${v.name}` : `D${n} – ${v.name}`;
}

const QUICK_VARGAS = [9, 10, 3, 7, 12, 16, 20, 24, 30, 40, 45, 60];

const JANMA_LABELS: Record<Lang, { rasi: string; nak: string }> = {
  en: { rasi: "Janma Rasi", nak: "Janma Nakshatra" },
  hi: { rasi: "जन्म राशि", nak: "जन्म नक्षत्र" },
  gu: { rasi: "જન્મ રાશિ", nak: "જન્મ નક્ષત્ર" },
};

function tSign(n: string, l: Lang) {
  const i = SIGN_NAMES.en.indexOf(n);
  return i >= 0 ? SIGN_NAMES[l][i] : n;
}
function tNak(n: string, l: Lang) {
  const i = NAKSHATRA_NAMES.en.indexOf(n);
  return i >= 0 ? NAKSHATRA_NAMES[l][i] : n;
}

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
  headerMeta?: React.ReactNode;
  headerRight?: React.ReactNode;
  loading?: boolean;
  children: React.ReactNode;
}
function ChartPanel({ title, accent = "indigo", headerMeta, headerRight, loading, children }: PanelProps) {
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
      <div className={`${hdrBg} border-b px-3 py-1.5 flex items-center justify-between gap-2 shrink-0`}>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 flex-wrap">
          <span className={`text-xs font-bold ${titleColor} shrink-0`}>{title}</span>
          {headerMeta}
        </div>
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

// ─── Legend Button ────────────────────────────────────────────────────────────
function LegendButton() {
  return (
    <div className="relative group shrink-0">
      <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-indigo-700 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        Legend
      </button>
      <div className="absolute right-0 top-full mt-1.5 z-50 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 w-72 hidden group-hover:block pointer-events-none">
        {/* <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-3">Chart Legend</p> */}

        {/* Dignity */}
        <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Graha Dignity</p>
        <div className="space-y-1.5 mb-3.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-emerald-600 w-5">++</span>
            <span className="text-sm text-gray-700">Swakshetra – own sign</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-blue-600 w-5">+</span>
            <span className="text-sm text-gray-700">Uchcha – exalted</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-red-500 w-5">↓</span>
            <span className="text-sm text-gray-700">Neecha – debilitated</span>
          </div>
          <div className="flex items-center gap-2">
            {/* <span className="text-xs font-bold text-red-600 w-5">-</span> */}
            <svg width="28" height="10" viewBox="0 0 28 10">
                <line x1="3" y1="5" x2="11" y2="5" stroke={"red"} strokeWidth="1" strokeDasharray="2 0"/>
              </svg>
            <span className="text-sm text-gray-700">Retrograde motion</span>
          </div>
        </div>

        {/* Aspects */}
        <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Vedic Drishti (hover planet)</p>
        <div className="space-y-1.5">
          {([
            { color: "#111827", label: "Ek Paad" },
            { color: "#2563eb", label: "Dwi Paad" },
            { color: "#16a34a", label: "Tri Paad" },
            { color: "#dc2626", label: "Sampurna" },
          ] as { color: string; label: string }[]).map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <svg width="28" height="10" viewBox="0 0 28 10">
                <line x1="0" y1="5" x2="28" y2="5" stroke={color} strokeWidth="2" strokeDasharray="5 3"/>
              </svg>
              <span className="text-sm text-gray-700">{label}</span>
            </div>
          ))}
        </div>

        {/* Special aspects note */}
        {/* <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-1">Special Aspects (Sampurna)</p>
          <p className="text-[10px] text-gray-500 leading-relaxed">Mars: 4th &amp; 8th · Jupiter: 5th &amp; 9th · Saturn: 3rd &amp; 10th</p>
        </div> */}
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

  const moonJanma = useMemo(
    () => (chart ? getMoonJanmaFromChart(chart) : null),
    [chart],
  );

  type MainTab = "kundali" | "grahsil" | "allvargas" | "pitru" | "kaalsarpa" | "chandal";
  const [mainTab, setMainTab]         = useState<MainTab>("kundali");

  type Tab = "planets" | "dasha" | "transit";
  const [activeTab, setActiveTab]     = useState<Tab>("planets");
  const [dashaMounted, setDashaMounted] = useState(false);
  const [transitMounted, setTransitMounted] = useState(false);
  const [pitruMounted, setPitruMounted] = useState(false);
  const [kaalsarpaMounted, setKaalsarpaMounted] = useState(false);
  const [chandalMounted, setChandalMounted] = useState(false);

  const dashaReqKey = useMemo(
    () =>
      req
        ? `${req.birth_date}|${req.birth_time}|${req.birth_place}|${req.house_system}|${req.zodiac}`
        : "",
    [req],
  );

  const TAB_LABELS: Record<Lang, Record<Tab, string>> = {
    en: { planets: "a) Planets", dasha: "b) Vimshottari Dasha", transit: "c) Rashi Transit" },
    hi: { planets: "अ) ग्रह स्थिति", dasha: "ब) विंशोत्तरी दशा", transit: "स) राशि गोचर" },
    gu: { planets: "અ) ગ્રહ સ્થિતિ", dasha: "બ) વિંશોત્તરી દશા", transit: "ક) રાશિ ગોચર" },
  };

  // D-chart (middle panel)
  const [selectedVarga, setSelectedVarga] = useState<number | "moon">(9);
  const [vargaChart, setVargaChart]   = useState<ChartResponse | null>(null);
  const [vargaLoading, setVargaLoading] = useState(false);
  const [vargaOpen, setVargaOpen]     = useState(false);
  const vargaRef                      = useRef<HTMLDivElement>(null);

  // All D-Charts tab
  const [allVargaCharts, setAllVargaCharts]   = useState<Record<number, ChartResponse>>({});
  const [allVargaLoadingNs, setAllVargaLoadingNs] = useState<Set<number>>(new Set());
  const [allVargaStarted, setAllVargaStarted] = useState(false);
  const [modalVargaN, setModalVargaN] = useState<number | "moon" | null>(null);
  const [modalVargaChart, setModalVargaChart] = useState<ChartResponse | null>(null);

  // Gochar (right-bottom panel)
  const [gocharChart, setGocharChart]     = useState<ChartResponse | null>(null);
  const [gocharLoading, setGocharLoading] = useState(false);
  const [gocharNow, setGocharNow]         = useState(nowIST());

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editHistoryId, setEditHistoryId] = useState<string | null>(null);
  const [resolvingEdit, setResolvingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "dasha") setDashaMounted(true);
    if (activeTab === "transit") setTransitMounted(true);
  }, [activeTab]);

  useEffect(() => {
    if (mainTab === "pitru") setPitruMounted(true);
    if (mainTab === "kaalsarpa") setKaalsarpaMounted(true);
    if (mainTab === "chandal") setChandalMounted(true);
  }, [mainTab]);

  // ── Load from sessionStorage ───────────────────────────────────────────────
  useEffect(() => {
    const raw  = sessionStorage.getItem("astroChart");
    const rawR = sessionStorage.getItem("astroReq");
    if (raw && rawR) {
      setChart(JSON.parse(raw));
      setReq(normalizeChartRequest(JSON.parse(rawR) as ChartRequest));
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
      setSelectedVarga(n);
    } catch { /* silently ignore */ }
    finally { setVargaLoading(false); }
  }, []);

  const selectMoonChartPanel = useCallback(() => {
    if (!chart) return;
    setVargaChart(toMoonChart(chart));
    setSelectedVarga("moon");
    setVargaLoading(false);
  }, [chart]);

  const fetchGochar = useCallback(async (reqData: ChartRequest, dt?: { date: string; time: string }) => {
    setGocharLoading(true);
    const now = dt ?? nowIST();
    setGocharNow(now);
    try {
      const result = await calculateChart({
        ...reqData,
        birth_date: now.date,
        birth_time: now.time,
        save_history: false,
      });
      setGocharChart(result);
    } catch { /* silently ignore */ }
    finally { setGocharLoading(false); }
  }, []);

  useEffect(() => {
    if (!req) return;
    fetchVarga(9, req);
    fetchGochar(req);
  }, [req, fetchVarga, fetchGochar]);

  // ── Load all D2-D60 when the All D-Charts tab is first activated ───────────
  useEffect(() => {
    if (mainTab !== "allvargas" || !req || allVargaStarted) return;
    setAllVargaStarted(true);
    const ns = Array.from({ length: 59 }, (_, i) => i + 2);
    setAllVargaLoadingNs(new Set(ns));
    (async () => {
      try {
        const results = await calculateVargaBulk(req, ns);
        setAllVargaCharts(results);
      } catch { /* silently ignore */ }
      setAllVargaLoadingNs(new Set());
    })();
  }, [mainTab, req, allVargaStarted]);

  const openEditModal = async () => {
    if (!req) return;
    setEditError(null);
    setResolvingEdit(true);
    try {
      const id = await resolveKundaliHistoryId(req);
      if (!id) {
        setEditError("No saved history record found for this chart.");
        return;
      }
      setEditHistoryId(id);
      setEditOpen(true);
    } finally {
      setResolvingEdit(false);
    }
  };

  const handleEditSaved = (newChart: ChartResponse, updatedReq: ChartRequest) => {
    const hid = newChart.history_id ?? editHistoryId;
    if (hid) setKundaliHistoryId(hid);
    setChart(newChart);
    setReq(updatedReq);
    sessionStorage.setItem("astroChart", JSON.stringify(newChart));
    sessionStorage.setItem("astroReq", JSON.stringify(updatedReq));
    setVargaChart(null);
    setAllVargaCharts({});
    setAllVargaStarted(false);
    setGocharChart(null);
    setEditOpen(false);
  };

  // ESC closes D-chart modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setModalVargaN(null);
        setModalVargaChart(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Close varga dropdown on outside click ─────────────────────────────────
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (vargaRef.current && !vargaRef.current.contains(e.target as Node))
        setVargaOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const moonChart = useMemo(() => (chart ? toMoonChart(chart) : null), [chart]);

  // ── Not yet loaded ─────────────────────────────────────────────────────────
  if (!chart || !moonChart) {
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
  const selectedLabel =
    selectedVarga === "moon" ? "Moon Chart" : vargaTitle(selectedVarga);

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
        <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl py-1 w-72 max-h-72 overflow-y-auto">
          <button
            type="button"
            onClick={() => { selectMoonChartPanel(); setVargaOpen(false); }}
            className={`w-full text-left px-3 py-2 transition-colors ${selectedVarga === "moon" ? "bg-amber-50 text-amber-900" : "text-gray-700 hover:bg-gray-50"}`}
          >
            <span className={`block text-xs ${selectedVarga === "moon" ? "font-bold" : "font-semibold"}`}>Moon Chart</span>
            <span className="block text-[10px] italic text-gray-600 leading-tight">Chandra Kundli — Moon sign as Lagna</span>
          </button>
          <div className="border-t border-gray-100 my-1"/>
          <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Popular</div>
          {QUICK_VARGAS.map(n => (
            <button
              key={n}
              type="button"
              onClick={() => { fetchVarga(n, req!); setVargaOpen(false); }}
              className={`w-full text-left px-3 py-2 transition-colors ${selectedVarga === n ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
            >
              <span className={`block text-xs ${selectedVarga === n ? "font-bold" : "font-semibold"}`}>{vargaTitle(n)}</span>
              <span className="block text-[10px] italic text-gray-600 leading-tight">{VARGA_INFO[n]?.area ?? ""}</span>
            </button>
          ))}
          <div className="border-t border-gray-100 my-1"/>
          <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">All Vargas</div>
          {Array.from({ length: 59 }, (_, i) => i + 2)
            .filter(n => !QUICK_VARGAS.includes(n))
            .map(n => (
              <button
                key={n}
                type="button"
                onClick={() => { fetchVarga(n, req!); setVargaOpen(false); }}
                className={`w-full text-left px-3 py-2 transition-colors ${selectedVarga === n ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
              >
                <span className={`block text-xs ${selectedVarga === n ? "font-bold" : "font-semibold"}`}>{vargaTitle(n)}</span>
                <span className="block text-[10px] italic text-gray-600 leading-tight">{VARGA_INFO[n]?.area ?? ""}</span>
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
      <header className="bg-indigo-950 text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3 min-w-0">
          {/* <AppLogo href="/" height={32} className="brightness-0 invert" /> */}
          <button
            onClick={() => router.push("/")}
            className="bg-indigo-800 hover:bg-indigo-700 px-3 py-1.5 rounded-lg text-sm font-semibold shrink-0 transition-colors"
          >
            ← New Chart
          </button>
          {req?.name && (
            <span className="font-black text-sm text-white truncate">{req.name}</span>
          )}
          <span className={`text-sm truncate ${req?.name ? "text-indigo-300 font-normal" : "font-bold"}`}>{meta.birth_place}</span>
          <span className="text-indigo-300 text-xs shrink-0 hidden sm:block">
            {meta.birth_date} · {meta.birth_time} · {meta.timezone}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => openEditModal()}
            disabled={!req || resolvingEdit}
            className="inline-flex items-center gap-1.5 bg-indigo-800 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-colors border border-indigo-600"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            Edit
          </button>
          <button
            onClick={async () => {
              if (!chart || !req) return;
              setReportLoading(true);
              try {
                await downloadKundliReport(chart, req);
              } finally {
                setReportLoading(false);
              }
            }}
            disabled={!chart || !req || reportLoading}
            className="inline-flex items-center gap-1.5 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-60 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 4v11"/>
            </svg>
            {reportLoading ? "Preparing…" : "Download Report"}
          </button>
          <div className="flex items-center gap-1">
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
        </div>
      </header>

      {/* ── Top page-level tab bar ── */}
      <div className="bg-white border-b border-gray-200 px-4 shrink-0">
        <div className="flex items-center">
          <div className="flex gap-0 flex-1">
            {([  
              { id: "kundali" as MainTab, labels: { en: "Kundali", hi: "कुंडली", gu: "કુંડળી" } },
              { id: "grahsil" as MainTab, labels: { en: "Grahasheel Chakra", hi: "ग्रहशील चक्र", gu: "ગ્રહશીલ ચક્ર" } },
              { id: "allvargas" as MainTab, labels: { en: "All D-Charts", hi: "सर्व वर्ग", gu: "સર્વ વર્ગ" } },
              { id: "pitru" as MainTab, labels: { en: "Pitru Dosha", hi: "पितृ दोष", gu: "પિતૃ દોષ" } },
              { id: "kaalsarpa" as MainTab, labels: { en: "Kaal Sarpa", hi: "काल सर्प", gu: "કાલ સર્પ" } },
              { id: "chandal" as MainTab, labels: { en: "Chandal Dosha", hi: "गुरु चांडाल", gu: "ગુરુ ચાંડાલ" } },
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
          <LegendButton />
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

        {/* ── Pitru Dosha tab ── */}
        {pitruMounted && chart && (
          <div className={`flex-1 min-h-0 flex flex-col overflow-hidden ${mainTab !== "pitru" ? "hidden" : ""}`}>
            <PitruDoshaPanel key={dashaReqKey} chart={chart} lang={lang} />
          </div>
        )}

        {kaalsarpaMounted && chart && (
          <div className={`flex-1 min-h-0 flex flex-col overflow-hidden ${mainTab !== "kaalsarpa" ? "hidden" : ""}`}>
            <KaalSarpaPanel key={dashaReqKey} chart={chart} lang={lang} />
          </div>
        )}

        {chandalMounted && chart && (
          <div className={`flex-1 min-h-0 flex flex-col overflow-hidden ${mainTab !== "chandal" ? "hidden" : ""}`}>
            <ChandalDoshaPanel key={dashaReqKey} chart={chart} lang={lang} />
          </div>
        )}

        {/* ── All D-Charts tab ── */}
        {mainTab === "allvargas" && (
          <div className="flex-1 min-h-0 overflow-auto">
            <div
              className="grid gap-2 p-2"
              style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
            >
              {/* Moon Chart — first */}
              <div
                className="flex flex-col rounded-lg border border-amber-200 bg-white overflow-hidden shadow-sm cursor-pointer hover:shadow-md hover:border-amber-400 transition-all"
                onClick={() => {
                  setModalVargaN("moon");
                  setModalVargaChart(moonChart);
                }}
              >
                <div className="bg-amber-50 border-b border-amber-100 px-2 py-1 shrink-0">
                  <div className="text-[10px] font-bold text-amber-900 leading-tight truncate">
                    Moon Chart
                  </div>
                  <div className="text-[9px] text-gray-500 italic leading-tight truncate">
                    Chandra Kundli — Moon sign as Lagna
                  </div>
                </div>
                <div className="relative w-full" style={{ paddingTop: "71.1%" }}>
                  <div className="absolute inset-0">
                    <ChartWheel chart={moonChart} lang={lang} />
                  </div>
                </div>
              </div>

              {Array.from({ length: 60 }, (_, i) => i + 1).map((n) => {
                const varga = n === 1 ? chart : allVargaCharts[n];
                const isLoading = n > 1 && allVargaLoadingNs.has(n);
                const info = VARGA_INFO[n];
                return (
                  <div
                    key={n}
                    className="flex flex-col rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all"
                    onClick={() => {
                      if (!isLoading && varga) {
                        setModalVargaN(n);
                        setModalVargaChart(varga);
                      }
                    }}
                  >
                    {/* Card header */}
                    <div className="bg-indigo-50 border-b border-indigo-100 px-2 py-1 shrink-0">
                      <div className="text-[10px] font-bold text-indigo-800 leading-tight truncate">
                        D{n} – {info?.name ?? ""}
                      </div>
                      <div className="text-[9px] text-gray-500 italic leading-tight truncate">
                        {info?.area ?? ""}
                      </div>
                    </div>
                    {/* Chart area — 900:640 aspect ratio */}
                    <div className="relative w-full" style={{ paddingTop: "71.1%" }}>
                      <div className="absolute inset-0">
                        {isLoading ? (
                          <div className="flex items-center justify-center h-full bg-gray-50">
                            <svg className="animate-spin h-4 w-4 text-indigo-400" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                            </svg>
                          </div>
                        ) : varga ? (
                          <ChartWheel chart={varga} lang={lang} />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-gray-50 text-[9px] text-gray-400">
                            {allVargaStarted ? "Error" : ""}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Kundali tab (stay mounted when hidden so dasha/transit data persists) ── */}
        {chart && (
        <div className={`flex gap-2 flex-1 min-h-0 overflow-hidden ${mainTab !== "kundali" ? "hidden" : ""}`}>
        <div className="flex flex-col gap-2 min-h-0 overflow-hidden" style={{ width: "55%" }}>

          {/* D1 Lagna Kundli — top ~55% */}
          <div className="min-h-0" style={{ flex: "0 0 55%" }}>
            <ChartPanel
              title="Lagna Kundli (D1)"
              accent="indigo"
              headerMeta={
                moonJanma ? (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] sm:text-xs text-indigo-800/90">
                    <span>
                      <span className="font-semibold text-indigo-700">{JANMA_LABELS[lang].rasi}:</span>{" "}
                      {tSign(moonJanma.moon_sign, lang)}
                    </span>
                    <span>
                      <span className="font-semibold text-indigo-700">{JANMA_LABELS[lang].nak}:</span>{" "}
                      {tNak(moonJanma.nakshatra, lang)}
                    </span>
                  </div>
                ) : null
              }
            >
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
              {dashaMounted && req && (
                <div className={activeTab === "dasha" ? "h-full" : "hidden"}>
                  <DashantariDashaTable key={dashaReqKey} req={req} lang={lang} />
                </div>
              )}
              {transitMounted && req && (
                <div className={activeTab === "transit" ? "h-full" : "hidden"}>
                  <PlanetsRashiTransit key={dashaReqKey} zodiac={req.zodiac} lang={lang} />
                </div>
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

        </div>)}
      </div>

      {/* ── D-Chart Modal ── */}
      {modalVargaN && modalVargaChart && (
        <div
          className="fixed inset-0 z-[80] bg-black/55 backdrop-blur-[1px] flex items-center justify-center p-4"
          onClick={() => {
            setModalVargaN(null);
            setModalVargaChart(null);
          }}
        >
          <div
            className="w-full max-w-3xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-200 bg-indigo-50 flex items-center justify-between gap-2">
              <div>
                {modalVargaN === "moon" ? (
                  <>
                    <p className="text-lg font-bold text-indigo-900 leading-tight">Moon Chart</p>
                    <p className="text-sm text-gray-900 italic mt-1">Chandra Kundli — Moon sign as Lagna</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-bold text-indigo-900 leading-tight">
                      D{modalVargaN} – {VARGA_INFO[modalVargaN as number]?.name ?? ""}
                    </p>
                    <p className="text-sm text-gray-900 italic mt-1">
                      {VARGA_INFO[modalVargaN as number]?.area ?? ""}
                    </p>
                  </>
                )}
              </div>
              <button
                onClick={() => {
                  setModalVargaN(null);
                  setModalVargaChart(null);
                }}
                className="text-gray-500 hover:text-gray-800 hover:bg-white rounded-lg p-1.5 transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-3">
              <div className="rounded-xl border border-indigo-200 overflow-hidden" style={{ aspectRatio: "900/640" }}>
                <ChartWheel chart={modalVargaChart} lang={lang} />
              </div>
            </div>
          </div>
        </div>
      )}

      {editError && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[110] bg-red-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          {editError}
          <button className="ml-3 underline" onClick={() => setEditError(null)}>Dismiss</button>
        </div>
      )}

      {editOpen && req && editHistoryId && (
        <FormModal title="Edit birth details" onClose={() => setEditOpen(false)}>
          <BirthForm
            key={editHistoryId}
            initialValues={{
              name: req.name ?? "",
              birth_date: req.birth_date,
              birth_time: req.birth_time,
              birth_place: req.birth_place,
              house_system: req.house_system,
              zodiac: req.zodiac,
            }}
            initialPlaceInput={req.birth_place}
            persistStorage={false}
            submitLabel="Save changes"
            historyId={editHistoryId}
            onResult={handleEditSaved}
          />
        </FormModal>
      )}
    </div>
  );
}
