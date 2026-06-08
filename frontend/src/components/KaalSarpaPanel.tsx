"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  ChartResponse,
  KaalSarpaMitigation,
  KaalSarpaResponse,
  MahapurushaFinding,
  RajaYogaFinding,
} from "@/types/chart";
import { calculateKaalSarpa } from "@/services/api";
import { type Lang, SIGN_NAMES } from "@/lib/translations";

const LABELS: Record<Lang, Record<string, string>> = {
  en: {
    title: "Kaal Sarpa Analysis",
    present: "Present",
    notPresent: "Not Present",
    type: "Type",
    rahu: "Rahu (Head)",
    ketu: "Ketu (Tail)",
    orientation: "Serpent arc",
    planetsInside: "Grahas inside the serpent",
    baseSeverity: "Base",
    effectiveSeverity: "After mitigations",
    impactArea: "Impact area",
    impactTypes: "Impact types",
    conventionalRemedies: "Conventional remedies",
    modernRemedies: "Modern remedies",
    positiveNote: "Positive perspective",
    mitigations: "Mitigating factors",
    matched: "Matched",
    notMatched: "Not matched",
    rajaYogas: "Raja Yogas in chart",
    mahapurusha: "Mahapurusha Yogas in chart",
    afflicted: "afflicted",
    loading: "Analyzing chart…",
    error: "Could not load Kaal Sarpa analysis.",
    absentTitle: "Kaal Sarpa is not present",
    absentBody:
      "Not all seven grahas lie on one side of the Rahu–Ketu axis in this chart.",
    mitigatedNote:
      "Kaal Sarpa is present, but strong chart combinations may significantly reduce its effects.",
    rahuToKetu: "Rahu → Ketu arc",
    ketuToRahu: "Ketu → Rahu arc",
    infoOnly: "Informational",
  },
  hi: {
    title: "काल सर्प विश्लेषण",
    present: "उपस्थित",
    notPresent: "अनुपस्थित",
    type: "प्रकार",
    rahu: "राहु (सर्प मुख)",
    ketu: "केतु (पूँछ)",
    orientation: "सर्प चाप",
    planetsInside: "सर्प के भीतर ग्रह",
    baseSeverity: "आधार",
    effectiveSeverity: "शमन के बाद",
    impactArea: "प्रभाव क्षेत्र",
    impactTypes: "प्रभाव प्रकार",
    conventionalRemedies: "पारंपरिक उपाय",
    modernRemedies: "आधुनिक उपाय",
    positiveNote: "सकारात्मक दृष्टि",
    mitigations: "शमन कारक",
    matched: "मेल खाता",
    notMatched: "मेल नहीं",
    rajaYogas: "कुंडली में राज योग",
    mahapurusha: "कुंडली में महापुरुष योग",
    afflicted: "अशुभ",
    loading: "विश्लेषण…",
    error: "काल सर्प लोड नहीं हो सका।",
    absentTitle: "काल सर्प उपस्थित नहीं",
    absentBody: "इस कुंडली में सभी सात ग्रह राहु–केतु अक्ष के एक ओर नहीं हैं।",
    mitigatedNote:
      "काल सर्प उपस्थित है, परंतु प्रबल योग इसके प्रभाव को कम कर सकते हैं।",
    rahuToKetu: "राहु → केतु चाप",
    ketuToRahu: "केतु → राहु चाप",
    infoOnly: "सूचनात्मक",
  },
  gu: {
    title: "કાલ સર્પ વિશ્લેષણ",
    present: "હાજર",
    notPresent: "અનુપસ્થિત",
    type: "પ્રકાર",
    rahu: "રાહુ (મુખ)",
    ketu: "કેતુ (પૂછ)",
    orientation: "સર્પ ચાપ",
    planetsInside: "સર્પની અંદર ગ્રહો",
    baseSeverity: "મૂળ",
    effectiveSeverity: "શમન પછી",
    impactArea: "પ્રભાવ ક્ષેત્ર",
    impactTypes: "પ્રભાવ પ્રકાર",
    conventionalRemedies: "પરંપરાગત ઉપાય",
    modernRemedies: "આધુનિક ઉપાય",
    positiveNote: "સકારાત્મક દૃષ્ટિ",
    mitigations: "શમન કારકો",
    matched: "મેળ ખાય",
    notMatched: "મેળ નથી",
    rajaYogas: "કુંડળીમાં રાજ યોગ",
    mahapurusha: "કુંડળીમાં મહાપુરુષ યોગ",
    afflicted: "અશુભ",
    loading: "વિશ્લેષણ…",
    error: "કાલ સર્પ લોડ થયો નહીં.",
    absentTitle: "કાલ સર્પ હાજર નથી",
    absentBody: "આ કુંડળીમાં બધા સાત ગ્રહ રાહુ–કેતુ અક્ષની એક બાજુએ નથી.",
    mitigatedNote:
      "કાલ સર્પ હાજર છે, પરંતુ મજબૂત યોગો અસર ઘટાડી શકે છે.",
    rahuToKetu: "રાહુ → કેતુ ચાપ",
    ketuToRahu: "કેતુ → રાહુ ચાપ",
    infoOnly: "માહિતી",
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

function SectionCard({
  title,
  children,
  accent = "rose",
}: {
  title: string;
  children: ReactNode;
  accent?: "rose" | "emerald" | "amber" | "indigo" | "sky";
}) {
  const borders: Record<string, string> = {
    rose: "border-rose-200",
    emerald: "border-emerald-200",
    amber: "border-amber-200",
    indigo: "border-indigo-200",
    sky: "border-sky-200",
  };
  const titles: Record<string, string> = {
    rose: "text-rose-800",
    emerald: "text-emerald-800",
    amber: "text-amber-900",
    indigo: "text-indigo-800",
    sky: "text-sky-800",
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

function RajaYogaList({ items, t }: { items: RajaYogaFinding[]; t: Record<string, string> }) {
  if (!items.length) return null;
  return (
    <div className="mt-3 space-y-2">
      <p className="text-[10px] font-bold uppercase text-indigo-600">{t.rajaYogas}</p>
      <ul className="space-y-1.5">
        {items.map((y, i) => (
          <li
            key={i}
            className={`text-xs rounded-lg px-2.5 py-2 border ${
              y.afflicted
                ? "bg-red-50 border-red-100 text-red-900"
                : "bg-indigo-50 border-indigo-100 text-indigo-950"
            }`}
          >
            <span className="font-semibold">{y.yoga_name}</span>
            <span className="text-gray-600"> — {y.lords.join(" + ")}</span>
            <span className="text-gray-500 text-[10px] ml-1">({y.connection})</span>
            {y.afflicted && (
              <span className="ml-1 text-[10px] font-bold text-red-600 uppercase">[{t.afflicted}]</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MahapurushaList({ items, t }: { items: MahapurushaFinding[]; t: Record<string, string> }) {
  if (!items.length) return null;
  return (
    <div className="mt-3 space-y-2">
      <p className="text-[10px] font-bold uppercase text-violet-600">{t.mahapurusha}</p>
      <ul className="space-y-1.5">
        {items.map((m, i) => (
          <li
            key={i}
            className={`text-xs rounded-lg px-2.5 py-2 border ${
              m.afflicted || m.strength === "weak"
                ? "bg-gray-50 border-gray-200 text-gray-700"
                : "bg-violet-50 border-violet-100 text-violet-950"
            }`}
          >
            <span className="font-semibold">{m.yoga}</span>
            <span className="text-gray-600">
              {" "}
              — {m.planet} in {m.sign} (house {m.house})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MitigationCard({ f, t }: { f: KaalSarpaMitigation; t: Record<string, string> }) {
  const isInfo = f.factor === "D-9 Kaal Sarpa note";
  const showYogaDetails =
    f.factor === "Strong Raja Yogas" || f.factor === "Multiple Mahapurusha Yogas";

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
      {showYogaDetails && f.raja_yogas && f.raja_yogas.length > 0 && (
        <RajaYogaList items={f.raja_yogas} t={t} />
      )}
      {showYogaDetails && f.mahapurusha_yogas && f.mahapurusha_yogas.length > 0 && (
        <MahapurushaList items={f.mahapurusha_yogas} t={t} />
      )}
    </article>
  );
}

interface Props {
  chart: ChartResponse;
  lang: Lang;
}

export default function KaalSarpaPanel({ chart, lang }: Props) {
  const t = LABELS[lang];
  const [data, setData] = useState<KaalSarpaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    calculateKaalSarpa(chart)
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
        <svg className="animate-spin h-8 w-8 text-rose-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <p className="text-sm font-medium">{t.loading}</p>
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

  const typeName =
    lang === "hi" && data.type?.name_hi
      ? data.type.name_hi
      : lang === "gu" && data.type?.name_gu
        ? data.type.name_gu
        : data.type?.name;

  const orientationLabel =
    data.orientation === "rahu_to_ketu"
      ? t.rahuToKetu
      : data.orientation === "ketu_to_rahu"
        ? t.ketuToRahu
        : data.orientation;

  const matchedCount = data.mitigating_factors?.filter((f) => f.matched).length ?? 0;
  const isMitigated =
    data.present &&
    matchedCount > 0 &&
    data.base_severity !== data.effective_severity;

  return (
    <div className="flex-1 min-h-0 overflow-auto">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t.title}</h2>
          </div>
          <span
            className={`text-sm font-bold px-4 py-1.5 rounded-full border ${
              data.present
                ? "bg-rose-100 text-rose-800 border-rose-300"
                : "bg-emerald-100 text-emerald-800 border-emerald-300"
            }`}
          >
            {data.present ? t.present : t.notPresent}
          </span>
        </header>

        {!data.present ? (
          <div className="text-center py-20 px-6 bg-gradient-to-b from-emerald-50 to-white rounded-3xl border border-emerald-200 shadow-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 text-3xl mb-4">
              ✓
            </div>
            <h3 className="text-xl font-bold text-emerald-900">{t.absentTitle}</h3>
            <p className="text-sm text-emerald-800 mt-2 max-w-md mx-auto leading-relaxed">{t.absentBody}</p>
          </div>
        ) : (
          <>
            {isMitigated && (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <span className="text-emerald-600 text-lg leading-none mt-0.5">↓</span>
                <p className="text-sm text-emerald-900 leading-relaxed">{t.mitigatedNote}</p>
              </div>
            )}

            {/* Hero */}
            <article className="rounded-3xl overflow-hidden border border-rose-200 shadow-md bg-white">
              <div className="bg-gradient-to-r from-rose-800 via-red-900 to-rose-950 px-6 py-6 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <svg viewBox="0 0 400 80" className="w-full h-full" preserveAspectRatio="none">
                    <path
                      d="M0,40 Q100,10 200,40 T400,40"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <div className="relative flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-rose-300 text-xs font-bold uppercase tracking-widest">{t.type}</p>
                    <h3 className="text-2xl font-bold mt-1">{typeName}</h3>
                    <p className="text-rose-200 text-sm mt-1">
                      {data.type?.sanskrit} · Rahu {ordinalHouse(data.type?.house ?? 0)}
                    </p>
                    {data.life_domains && data.life_domains.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {data.life_domains.map((d) => (
                          <span
                            key={d}
                            className="text-[10px] font-semibold uppercase tracking-wide bg-white/15 px-2 py-0.5 rounded-full"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {data.base_severity && (
                      <div className="text-center">
                        <p className="text-[10px] text-rose-300 mb-1">{t.baseSeverity}</p>
                        <SeverityPill severity={data.base_severity} />
                      </div>
                    )}
                    {data.effective_severity && data.effective_severity !== data.base_severity && (
                      <>
                        <span className="text-rose-400 text-lg">→</span>
                        <div className="text-center">
                          <p className="text-[10px] text-rose-300 mb-1">{t.effectiveSeverity}</p>
                          <SeverityPill severity={data.effective_severity} />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {data.rahu && (
                  <div className="rounded-xl bg-rose-50 border border-rose-100 p-3">
                    <p className="text-[10px] font-bold uppercase text-rose-600">{t.rahu}</p>
                    <p className="font-bold text-gray-900 mt-1">{ordinalHouse(data.rahu.house)}</p>
                    <p className="text-sm text-gray-600">{tSign(data.rahu.sign, lang)}</p>
                  </div>
                )}
                {data.ketu && (
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                    <p className="text-[10px] font-bold uppercase text-slate-600">{t.ketu}</p>
                    <p className="font-bold text-gray-900 mt-1">{ordinalHouse(data.ketu.house)}</p>
                    <p className="text-sm text-gray-600">{tSign(data.ketu.sign, lang)}</p>
                  </div>
                )}
                {orientationLabel && (
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 sm:col-span-2 lg:col-span-2">
                    <p className="text-[10px] font-bold uppercase text-gray-500">{t.orientation}</p>
                    <p className="font-semibold text-gray-800 mt-1">{orientationLabel}</p>
                  </div>
                )}
              </div>

              {data.planets_inside && data.planets_inside.length > 0 && (
                <div className="px-5 pb-5">
                  <p className="text-[10px] font-bold uppercase text-gray-500 mb-2">{t.planetsInside}</p>
                  <div className="flex flex-wrap gap-2">
                    {data.planets_inside.map((p) => (
                      <span
                        key={p}
                        className="text-xs font-semibold bg-gradient-to-r from-rose-100 to-orange-100 text-rose-950 px-3 py-1.5 rounded-full border border-rose-200"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </article>

            {/* Impact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.impact_area && (
                <SectionCard title={t.impactArea} accent="rose">
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
                  <span className="w-1.5 h-6 rounded-full bg-emerald-500" />
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
