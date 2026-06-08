"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  ChartResponse,
  ChandalDoshaMitigation,
  ChandalDoshaResponse,
  MahapurushaFinding,
  RajaYogaFinding,
} from "@/types/chart";
import { calculateChandalDosha } from "@/services/api";
import { type Lang, SIGN_NAMES } from "@/lib/translations";

const LABELS: Record<Lang, Record<string, string>> = {
  en: {
    title: "Guru Chandal Yoga",
    subtitle: "Chandal Dosha Analysis",
    present: "Present",
    notPresent: "Not Present",
    type: "House type",
    jupiter: "Jupiter (Guru)",
    node: "Shadow graha",
    conjunction: "Conjunction",
    orb: "Separation",
    strength: "Strength",
    dignity: "Dignity",
    functionalRole: "Functional role",
    combust: "Combust",
    retrograde: "Retrograde",
    baseSeverity: "Base",
    effectiveSeverity: "After mitigations",
    impactArea: "Impact area",
    impactTypes: "Life themes",
    variantNote: "Variant insight",
    variantPositive: "Variant potential",
    conventionalRemedies: "Conventional remedies",
    modernRemedies: "Modern remedies",
    positiveNote: "Constructive channel",
    mitigations: "Mitigating factors",
    matched: "Matched",
    notMatched: "Not matched",
    rajaYogas: "Raja Yogas in chart",
    mahapurusha: "Mahapurusha Yogas",
    afflicted: "afflicted",
    loading: "Analyzing Guru Chandal…",
    error: "Could not load Chandal Dosha analysis.",
    absentTitle: "Guru Chandal Yoga not formed",
    absentBody:
      "Jupiter does not share a sign with Rahu or Ketu in this birth chart (D1).",
    mitigatedNote:
      "Guru Chandal is present, but strong chart factors may significantly soften its expression.",
    infoOnly: "Informational",
    close: "Close",
    moderate: "Moderate",
    wide: "Wide",
    houseCategory: "House nature",
    trikona: "Trikona",
    kendra: "Kendra",
    dusthana: "Dusthana",
    upachaya: "Upachaya",
    artha: "Artha",
  },
  hi: {
    title: "गुरु चांडाल योग",
    subtitle: "चांडाल दोष विश्लेषण",
    present: "उपस्थित",
    notPresent: "अनुपस्थित",
    type: "भाव प्रकार",
    jupiter: "गुरु (बृहस्पति)",
    node: "छाया ग्रह",
    conjunction: "युति",
    orb: "अंतर",
    strength: "तीव्रता",
    dignity: "बल",
    functionalRole: "कार्यात्मक भूमिका",
    combust: "अस्त",
    retrograde: "वक्री",
    baseSeverity: "आधार",
    effectiveSeverity: "शमन के बाद",
    impactArea: "प्रभाव क्षेत्र",
    impactTypes: "जीवन विषय",
    variantNote: "प्रकार विश्लेषण",
    variantPositive: "प्रकार की संभावना",
    conventionalRemedies: "पारंपरिक उपाय",
    modernRemedies: "आधुनिक उपाय",
    positiveNote: "रचनात्मक दिशा",
    mitigations: "शमन कारक",
    matched: "मेल खाता",
    notMatched: "मेल नहीं",
    rajaYogas: "कुंडली में राज योग",
    mahapurusha: "महापुरुष योग",
    afflicted: "अशुभ",
    loading: "विश्लेषण…",
    error: "चांडाल दोष लोड नहीं हो सका।",
    absentTitle: "गुरु चांडाल योग नहीं बना",
    absentBody: "इस कुंडली में गुरु राहु या केतु के साथ एक राशि में नहीं है।",
    mitigatedNote: "गुरु चांडाल उपस्थित है, परंतु प्रबल योग प्रभाव को कम कर सकते हैं।",
    infoOnly: "सूचनात्मक",
    close: "निकट",
    moderate: "मध्यम",
    wide: "दूर",
    houseCategory: "भाव स्वभाव",
    trikona: "त्रिकोण",
    kendra: "केंद्र",
    dusthana: "दुःस्थान",
    upachaya: "उपचय",
    artha: "अर्थ",
  },
  gu: {
    title: "ગુરુ ચાંડાલ યોગ",
    subtitle: "ચાંડાલ દોષ વિશ્લેષણ",
    present: "હાજર",
    notPresent: "અનુપસ્થિત",
    type: "ભાવ પ્રકાર",
    jupiter: "ગુરુ (બૃહસ્પતિ)",
    node: "છાયા ગ્રહ",
    conjunction: "યુતિ",
    orb: "અંતર",
    strength: "તીવ્રતા",
    dignity: "બળ",
    functionalRole: "કાર્યાત્મક ભૂમિકા",
    combust: "અસ્ત",
    retrograde: "વક્રી",
    baseSeverity: "મૂળ",
    effectiveSeverity: "શમન પછી",
    impactArea: "પ્રભાવ ક્ષેત્ર",
    impactTypes: "જીવન વિષયો",
    variantNote: "પ્રકાર વિશ્લેષણ",
    variantPositive: "પ્રકારની સંભાવના",
    conventionalRemedies: "પરંપરાગત ઉપાય",
    modernRemedies: "આધુનિક ઉપાય",
    positiveNote: "રચનાત્મક દિશા",
    mitigations: "શમન કારકો",
    matched: "મેળ ખાય",
    notMatched: "મેળ નથી",
    rajaYogas: "કુંડળીમાં રાજ યોગ",
    mahapurusha: "મહાપુરુષ યોગ",
    afflicted: "અશુભ",
    loading: "વિશ્લેષણ…",
    error: "ચાંડાલ દોષ લોડ થયો નહીં.",
    absentTitle: "ગુરુ ચાંડાલ યોગ બનેલ નથી",
    absentBody: "આ કુંડળીમાં ગુરુ રાહુ અથવા કેતુ સાથે એક રાશિમાં નથી.",
    mitigatedNote: "ગુરુ ચાંડાલ હાજર છે, પરંતુ મજબૂત યોગો અસર ઘટાડી શકે છે.",
    infoOnly: "માહિતી",
    close: "નજીક",
    moderate: "મધ્યમ",
    wide: "દૂર",
    houseCategory: "ભાવ સ્વભાવ",
    trikona: "ત્રિકોણ",
    kendra: "કેન્દ્ર",
    dusthana: "દુઃસ્થાન",
    upachaya: "ઉપચય",
    artha: "અર્થ",
  },
};

function tSign(name: string, lang: Lang): string {
  const i = SIGN_NAMES.en.indexOf(name);
  return i >= 0 ? SIGN_NAMES[lang][i] : name;
}

function ordinalHouse(n: number): string {
  if (n >= 11 && n <= 13) return `${n}th`;
  const suffix = { 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th";
  return `${n}${suffix}`;
}

function severityBadgeClass(severity: string): string {
  const s = severity.toLowerCase().trim();
  if (s.includes("strongly mitigated") || s.includes("mitigated")) {
    return "bg-emerald-600 text-white border-emerald-700";
  }
  if (s.includes("very high")) return "bg-red-600 text-white border-red-700";
  if (s.includes("high")) return "bg-orange-500 text-white border-orange-600";
  if (s.includes("moderate")) return "bg-amber-500 text-amber-950 border-amber-600";
  return "bg-gray-500 text-white border-gray-600";
}

function SeverityPill({ severity }: { severity: string }) {
  return (
    <span
      className={`shrink-0 text-[10px] font-bold leading-none px-2.5 py-1.5 rounded-full border ${severityBadgeClass(severity)}`}
    >
      {severity}
    </span>
  );
}

function dignityBadge(dignity: string): string {
  switch (dignity) {
    case "exalted":
      return "bg-amber-400 text-amber-950 border-amber-500";
    case "own":
      return "bg-yellow-300 text-yellow-950 border-yellow-400";
    case "debilitated":
      return "bg-red-200 text-red-900 border-red-300";
    default:
      return "bg-slate-200 text-slate-800 border-slate-300";
  }
}

function strengthLabel(strength: string | null | undefined, t: Record<string, string>): string {
  if (strength === "close") return t.close;
  if (strength === "moderate") return t.moderate;
  if (strength === "wide") return t.wide;
  return strength ?? "—";
}

function categoryLabel(cat: string, t: Record<string, string>): string {
  const map: Record<string, string> = {
    trikona: t.trikona,
    kendra: t.kendra,
    dusthana: t.dusthana,
    upachaya: t.upachaya,
    artha: t.artha,
  };
  return map[cat] ?? cat;
}

function SectionCard({
  title,
  children,
  accent = "amber",
}: {
  title: string;
  children: ReactNode;
  accent?: "amber" | "emerald" | "violet" | "indigo" | "sky" | "slate";
}) {
  const borders: Record<string, string> = {
    amber: "border-amber-200",
    emerald: "border-emerald-200",
    violet: "border-violet-200",
    indigo: "border-indigo-200",
    sky: "border-sky-200",
    slate: "border-slate-200",
  };
  const titles: Record<string, string> = {
    amber: "text-amber-900",
    emerald: "text-emerald-800",
    violet: "text-violet-800",
    indigo: "text-indigo-800",
    sky: "text-sky-800",
    slate: "text-slate-700",
  };
  return (
    <div className={`rounded-2xl border bg-white p-4 shadow-sm ${borders[accent]}`}>
      <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${titles[accent]}`}>
        {title}
      </p>
      {children}
    </div>
  );
}

function OrbVisualizer({ orb, strength }: { orb: number; strength: string }) {
  const pct = Math.min(100, (orb / 30) * 100);
  const barColor =
    strength === "close"
      ? "from-amber-500 to-orange-600"
      : strength === "moderate"
        ? "from-yellow-400 to-amber-500"
        : "from-slate-300 to-slate-400";
  return (
    <div className="mt-2">
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
        <span>0°</span>
        <span>30°</span>
      </div>
    </div>
  );
}

function RajaYogaList({ items, t }: { items: RajaYogaFinding[]; t: Record<string, string> }) {
  if (!items.length) return null;
  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-[10px] font-bold uppercase text-indigo-600">{t.rajaYogas}</p>
      {items.map((y, i) => (
        <p key={i} className="text-xs text-indigo-950 bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-2">
          <span className="font-semibold">{y.yoga_name}</span> — {y.lords.join(" + ")}
        </p>
      ))}
    </div>
  );
}

function MahapurushaList({ items, t }: { items: MahapurushaFinding[]; t: Record<string, string> }) {
  if (!items.length) return null;
  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-[10px] font-bold uppercase text-violet-600">{t.mahapurusha}</p>
      {items.map((m, i) => (
        <p key={i} className="text-xs text-violet-950 bg-violet-50 border border-violet-100 rounded-lg px-2.5 py-2">
          <span className="font-semibold">{m.yoga}</span> — {m.planet} in {m.sign}
        </p>
      ))}
    </div>
  );
}

function MitigationCard({ f, t }: { f: ChandalDoshaMitigation; t: Record<string, string> }) {
  const isInfo = f.factor === "D-9 Guru Chandal note";
  const showYogas = f.factor === "Strong Raja Yogas" || f.factor === "Hamsa Mahapurusha";

  return (
    <article
      className={`rounded-2xl border p-4 h-full flex flex-col ${
        isInfo
          ? "border-sky-200 bg-gradient-to-br from-sky-50 to-white"
          : f.matched
            ? "border-emerald-300 bg-gradient-to-br from-emerald-50 to-white shadow-sm"
            : "border-gray-200 bg-gray-50/60"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-semibold text-sm text-gray-900 leading-snug">{f.factor}</h4>
        <span
          className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isInfo
              ? "bg-sky-200 text-sky-900"
              : f.matched
                ? "bg-emerald-600 text-white"
                : "bg-gray-300 text-gray-700"
          }`}
        >
          {isInfo ? t.infoOnly : f.matched ? t.matched : t.notMatched}
        </span>
      </div>
      <p className="text-xs text-gray-600 leading-relaxed flex-1">{f.detail}</p>
      {showYogas && f.raja_yogas && f.raja_yogas.length > 0 && (
        <RajaYogaList items={f.raja_yogas} t={t} />
      )}
      {showYogas && f.mahapurusha_yogas && f.mahapurusha_yogas.length > 0 && (
        <MahapurushaList items={f.mahapurusha_yogas} t={t} />
      )}
    </article>
  );
}

interface Props {
  chart: ChartResponse;
  lang: Lang;
}

export default function ChandalDoshaPanel({ chart, lang }: Props) {
  const t = LABELS[lang];
  const [data, setData] = useState<ChandalDoshaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    calculateChandalDosha(chart)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : t.error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [chart, t.error]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-3">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-4 border-amber-200 border-t-amber-600 animate-spin" />
          <span className="absolute inset-0 flex items-center justify-center text-lg">♃</span>
        </div>
        <p className="text-sm font-medium text-amber-900">{t.loading}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const variantLabel =
    lang === "hi" && data.variant_label_hi
      ? data.variant_label_hi
      : lang === "gu" && data.variant_label_gu
        ? data.variant_label_gu
        : data.variant_label;

  const typeName =
    lang === "hi" && data.type?.name_hi
      ? data.type.name_hi
      : lang === "gu" && data.type?.name_gu
        ? data.type.name_gu
        : data.type?.name;

  const matchedCount = data.mitigating_factors?.filter((f) => f.matched).length ?? 0;
  const isMitigated =
    data.present && matchedCount > 0 && data.base_severity !== data.effective_severity;

  const isRahu = data.variant === "guru_rahu";

  return (
    <div className="flex-1 min-h-0 overflow-auto bg-gradient-to-b from-amber-50/40 via-white to-violet-50/30">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700">{t.subtitle}</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-0.5">{t.title}</h2>
          </div>
          <span
            className={`text-sm font-bold px-4 py-1.5 rounded-full border shadow-sm ${
              data.present
                ? "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-950 border-amber-300"
                : "bg-emerald-100 text-emerald-800 border-emerald-300"
            }`}
          >
            {data.present ? t.present : t.notPresent}
          </span>
        </header>

        {!data.present ? (
          <div className="text-center py-20 px-6 bg-gradient-to-b from-emerald-50 to-white rounded-3xl border border-emerald-200 shadow-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 text-3xl mb-4 ring-4 ring-emerald-50">
              ✓
            </div>
            <h3 className="text-xl font-bold text-emerald-900">{t.absentTitle}</h3>
            <p className="text-sm text-emerald-800 mt-2 max-w-md mx-auto leading-relaxed">{t.absentBody}</p>
          </div>
        ) : (
          <>
            {isMitigated && (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 backdrop-blur-sm">
                <span className="text-emerald-600 text-lg">↓</span>
                <p className="text-sm text-emerald-900 leading-relaxed">{t.mitigatedNote}</p>
              </div>
            )}

            {/* Hero */}
            <article className="rounded-3xl overflow-hidden border border-amber-200/80 shadow-lg bg-white">
              <div className="relative bg-gradient-to-br from-amber-600 via-yellow-700 to-violet-900 px-6 py-7 text-white overflow-hidden">
                <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -left-4 bottom-0 w-32 h-32 rounded-full bg-violet-400/20 blur-xl" />
                <div className="absolute inset-0 opacity-[0.07] pointer-events-none flex items-center justify-center text-[120px] font-serif">
                  ♃
                </div>

                <div className="relative flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-xl">
                    <p className="text-amber-200 text-xs font-bold uppercase tracking-widest">{variantLabel}</p>
                    <h3 className="text-2xl sm:text-3xl font-bold mt-1 leading-tight">{typeName}</h3>
                    <p className="text-amber-100/90 text-sm mt-2">
                      {data.type?.sanskrit_theme} · Jupiter {ordinalHouse(data.type?.house ?? 0)}
                      {data.type?.house_category && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-semibold uppercase">
                          {t.houseCategory}: {categoryLabel(data.type.house_category, t)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {data.base_severity && (
                      <div className="text-center">
                        <p className="text-[10px] text-amber-200 mb-1">{t.baseSeverity}</p>
                        <SeverityPill severity={data.base_severity} />
                      </div>
                    )}
                    {data.effective_severity && data.effective_severity !== data.base_severity && (
                      <>
                        <span className="text-amber-300 text-lg">→</span>
                        <div className="text-center">
                          <p className="text-[10px] text-amber-200 mb-1">{t.effectiveSeverity}</p>
                          <SeverityPill severity={data.effective_severity} />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Jupiter + Node cards */}
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.jupiter && (
                  <div className="rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50/50 p-4 relative overflow-hidden">
                    <div className="absolute top-2 right-3 text-3xl opacity-20">♃</div>
                    <p className="text-[10px] font-bold uppercase text-amber-800 tracking-wider">{t.jupiter}</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{ordinalHouse(data.jupiter.house)}</p>
                    <p className="text-sm font-medium text-amber-900">{tSign(data.jupiter.sign, lang)}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {data.jupiter.dignity && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${dignityBadge(data.jupiter.dignity)}`}
                        >
                          {t.dignity}: {data.jupiter.dignity}
                        </span>
                      )}
                      {data.jupiter.functional_role && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${
                            data.jupiter.functional_role === "benefic"
                              ? "bg-emerald-200 text-emerald-900 border-emerald-300"
                              : data.jupiter.functional_role === "malefic"
                                ? "bg-red-100 text-red-900 border-red-200"
                                : "bg-slate-200 text-slate-800 border-slate-300"
                          }`}
                        >
                          {t.functionalRole}: {data.jupiter.functional_role}
                        </span>
                      )}
                      {data.jupiter.combust && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-200 text-orange-900 border border-orange-300">
                          {t.combust}
                        </span>
                      )}
                      {data.jupiter.retrograde && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 border border-slate-300">
                          {t.retrograde}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {data.node && (
                  <div
                    className={`rounded-2xl border-2 p-4 relative overflow-hidden ${
                      isRahu
                        ? "border-violet-300 bg-gradient-to-br from-violet-50 to-purple-50/50"
                        : "border-slate-300 bg-gradient-to-br from-slate-50 to-indigo-50/50"
                    }`}
                  >
                    <div className="absolute top-2 right-3 text-3xl opacity-20">{isRahu ? "☊" : "☋"}</div>
                    <p className="text-[10px] font-bold uppercase text-violet-800 tracking-wider">
                      {t.node}: {data.node.name}
                    </p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{ordinalHouse(data.node.house)}</p>
                    <p className="text-sm font-medium text-violet-900">{tSign(data.node.sign, lang)}</p>
                  </div>
                )}
              </div>

              {/* Conjunction meter */}
              {data.conjunction_orb_degrees != null && (
                <div className="px-5 pb-5">
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <p className="text-[10px] font-bold uppercase text-slate-600">{t.conjunction}</p>
                      <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        {strengthLabel(data.conjunction_strength, t)}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800">
                      {t.orb}: {data.conjunction_orb_degrees.toFixed(1)}°
                    </p>
                    <OrbVisualizer orb={data.conjunction_orb_degrees} strength={data.conjunction_strength ?? "wide"} />
                  </div>
                </div>
              )}
            </article>

            {/* Variant */}
            {(data.variant_impact || data.variant_positive) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.variant_impact && (
                  <SectionCard title={t.variantNote} accent="violet">
                    <p className="text-sm text-violet-950 leading-relaxed">{data.variant_impact}</p>
                  </SectionCard>
                )}
                {data.variant_positive && (
                  <SectionCard title={t.variantPositive} accent="emerald">
                    <p className="text-sm text-emerald-900 leading-relaxed">{data.variant_positive}</p>
                  </SectionCard>
                )}
              </div>
            )}

            {/* Impact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.impact_area && (
                <SectionCard title={t.impactArea} accent="amber">
                  <p className="text-sm text-gray-800 leading-relaxed font-medium">{data.impact_area}</p>
                </SectionCard>
              )}
              {data.impact_types && (
                <SectionCard title={t.impactTypes} accent="indigo">
                  <p className="text-sm text-gray-700 leading-relaxed">{data.impact_types}</p>
                </SectionCard>
              )}
            </div>

            {data.positive_note && (
              <SectionCard title={t.positiveNote} accent="emerald">
                <p className="text-sm text-emerald-900 leading-relaxed">{data.positive_note}</p>
              </SectionCard>
            )}

            {/* Remedies */}
            {(data.conventional_remedies || data.modern_remedies) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.conventional_remedies && (
                  <SectionCard title={t.conventionalRemedies} accent="amber">
                    <p className="text-sm text-amber-950 leading-relaxed">{data.conventional_remedies}</p>
                  </SectionCard>
                )}
                {data.modern_remedies && (
                  <SectionCard title={t.modernRemedies} accent="sky">
                    <p className="text-sm text-sky-950 leading-relaxed">{data.modern_remedies}</p>
                  </SectionCard>
                )}
              </div>
            )}

            {/* Mitigations */}
            {data.mitigating_factors && data.mitigating_factors.length > 0 && (
              <section>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-amber-500 to-violet-600" />
                  {t.mitigations}
                  <span className="text-sm font-normal text-gray-500">
                    ({matchedCount} {t.matched.toLowerCase()})
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.mitigating_factors.map((f) => (
                    <MitigationCard key={f.factor} f={f} t={t} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {data.disclaimer && (
          <p className="text-xs text-gray-400 text-center pb-4 leading-relaxed">{data.disclaimer}</p>
        )}
      </div>
    </div>
  );
}
