"use client";

import { useEffect, useState } from "react";
import {
  ChartResponse,
  PitruDoshaHouseFinding,
  PitruDoshaResponse,
  PitruDoshaSignFinding,
} from "@/types/chart";
import { calculatePitruDosha } from "@/services/api";
import { type Lang, SIGN_NAMES } from "@/lib/translations";

const LABELS: Record<Lang, Record<string, string>> = {
  en: {
    title: "Pitru Dosha Analysis",
    signWiseHeading: "Sign-wise combinations",
    houseWiseHeading: "House-wise combinations",
    signWiseImpact: "Impact",
    houseWiseImpact: "Impact",
    natureTheme: "Nature / Theme",
    healthFocus: "Health focus",
    sign: "Sign",
    rahu: "Rahu",
    ketu: "Ketu",
    house: "House",
    strongerHouses: "Stronger houses / axis",
    conventionalRemedies: "Conventional remedies",
    modernRemedies: "Modern remedies",
    severity: "Severity",
    loading: "Analyzing chart…",
    error: "Could not load Pitru Dosha analysis.",
    noFindings: "No Pitru Dosha combinations matched this chart.",
    noSignFindings: "No sign-wise combinations for this chart.",
    noHouseFindings: "No house-wise combinations for this chart.",
    janmaRashi: "Janma Rashi (Moon)",
  },
  hi: {
    title: "पितृ दोष विश्लेषण",
    signWiseHeading: "राशि अनुसार संयोजन",
    houseWiseHeading: "भाव अनुसार संयोजन",
    signWiseImpact: "प्रभाव",
    houseWiseImpact: "प्रभाव",
    natureTheme: "प्रकृति / विषय",
    healthFocus: "स्वास्थ्य केंद्र",
    sign: "राशि",
    rahu: "राहु",
    ketu: "केतु",
    house: "भाव",
    strongerHouses: "प्रबल भाव / अक्ष",
    conventionalRemedies: "पारंपरिक उपाय",
    modernRemedies: "आधुनिक उपाय",
    severity: "गंभीरता",
    loading: "विश्लेषण…",
    error: "पितृ दोष लोड नहीं हो सका।",
    noFindings: "इस कुंडली में कोई संयोजन नहीं मिला।",
    noSignFindings: "इस कुंडली में राशि अनुसार कोई संयोजन नहीं।",
    noHouseFindings: "इस कुंडली में भाव अनुसार कोई संयोजन नहीं।",
    janmaRashi: "जन्म राशि (चंद्र)",
  },
  gu: {
    title: "પિતૃ દોષ વિશ્લેષણ",
    signWiseHeading: "રાશિ પ્રમાણે સંયોજન",
    houseWiseHeading: "ભાવ પ્રમાણે સંયોજન",
    signWiseImpact: "અસર",
    houseWiseImpact: "અસર",
    natureTheme: "સ્વભાવ / વિષય",
    healthFocus: "આરોગ્ય કેન્દ્ર",
    sign: "રાશિ",
    rahu: "રાહુ",
    ketu: "કેતુ",
    house: "ભાવ",
    strongerHouses: "પ્રબળ ભાવ / અક્ષ",
    conventionalRemedies: "પરંપરાગત ઉપાય",
    modernRemedies: "આધુનિક ઉપાય",
    severity: "તીવ્રતા",
    loading: "વિશ્લેષણ…",
    error: "પિતૃ દોષ લોડ થયો નહીં.",
    noFindings: "આ કુંડળીમાં કોઈ સંયોજન મળ્યું નથી.",
    noSignFindings: "આ કુંડળીમાં રાશિ પ્રમાણે કોઈ સંયોજન નથી.",
    noHouseFindings: "આ કુંડળીમાં ભાવ પ્રમાણે કોઈ સંયોજન નથી.",
    janmaRashi: "જન્મ રાશિ (ચંદ્ર)",
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

/** Distinct badge colors per severity label (Dosha / House matrix). */
function severityBadgeClass(severity: string): string {
  const s = severity.toLowerCase().trim();
  if (s.includes("very high")) {
    return "bg-red-600 text-white border-red-700 shadow-sm";
  }
  if (s.includes("medium to high") || s.includes("medium-high")) {
    return "bg-amber-500 text-amber-950 border-amber-600 shadow-sm";
  }
  if (s.includes("high")) {
    return "bg-orange-500 text-white border-orange-600 shadow-sm";
  }
  if (s.includes("medium")) {
    return "bg-yellow-400 text-yellow-950 border-yellow-500 shadow-sm";
  }
  if (s.includes("low")) {
    return "bg-slate-400 text-white border-slate-500 shadow-sm";
  }
  return "bg-gray-500 text-white border-gray-600 shadow-sm";
}

function SeverityPill({ severity }: { severity: string }) {
  return (
    <span
      className={`shrink-0 text-[10px] font-bold leading-none px-2.5 py-1.5 rounded-full border whitespace-nowrap ${severityBadgeClass(severity)}`}
    >
      {severity}
    </span>
  );
}

function SignWiseCard({ f, lang, t }: { f: PitruDoshaSignFinding; lang: Lang; t: Record<string, string> }) {
  return (
    <article className="group flex flex-col h-full rounded-2xl border border-violet-200/80 bg-white shadow-sm hover:shadow-lg hover:border-violet-300 transition-all duration-200 overflow-hidden">
      <div className="bg-gradient-to-br from-violet-600 to-indigo-700 px-4 py-4 text-white">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-sm leading-snug flex-1 min-w-0">{f.combination}</h3>
          {f.sign_wise_severity && <SeverityPill severity={f.sign_wise_severity} />}
        </div>
        <p className="text-violet-100 text-xs mt-1.5">
          {f.rahu_sign && f.ketu_sign ? (
            <>
              {t.rahu}: {tSign(f.rahu_sign, lang)} · {t.ketu}: {tSign(f.ketu_sign, lang)}
            </>
          ) : (
            <>
              {t.sign}: {tSign(f.sign, lang)}
            </>
          )}
        </p>
      </div>
      <div className="flex-1 p-4 space-y-3 text-sm">
        {f.sign_wise_impact && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600 mb-1">{t.signWiseImpact}</p>
            <p className="text-gray-800 leading-relaxed">{f.sign_wise_impact}</p>
          </div>
        )}
        {f.nature_theme && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600 mb-1">{t.natureTheme}</p>
            <p className="text-gray-700 leading-relaxed">{f.nature_theme}</p>
          </div>
        )}
        {f.stronger_houses && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">{t.strongerHouses}</p>
            <p className="text-gray-600 text-xs">{f.stronger_houses}</p>
          </div>
        )}
        {f.conventional_remedies && (
          <div className="pt-2 border-t border-amber-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">{t.conventionalRemedies}</p>
            <p className="text-gray-700 text-xs leading-relaxed">{f.conventional_remedies}</p>
          </div>
        )}
        {f.modern_remedies && (
          <div className="pt-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-sky-700 mb-1">{t.modernRemedies}</p>
            <p className="text-gray-700 text-xs leading-relaxed">{f.modern_remedies}</p>
          </div>
        )}
      </div>
    </article>
  );
}

function HouseWiseCard({ f, lang, t }: { f: PitruDoshaHouseFinding; lang: Lang; t: Record<string, string> }) {
  return (
    <article className="group flex flex-col h-full rounded-2xl border border-teal-200/80 bg-white shadow-sm hover:shadow-lg hover:border-teal-300 transition-all duration-200 overflow-hidden">
      <div className="bg-gradient-to-br from-teal-600 to-emerald-700 px-4 py-4 text-white">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-sm leading-snug flex-1 min-w-0">{f.combination}</h3>
          {f.house_wise_severity && <SeverityPill severity={f.house_wise_severity} />}
        </div>
        <p className="text-teal-100 text-xs mt-1.5">
          {f.rahu_house != null && f.ketu_house != null && f.rahu_sign && f.ketu_sign ? (
            <>
              {t.rahu}: {ordinalHouse(f.rahu_house)} ({tSign(f.rahu_sign, lang)}) · {t.ketu}:{" "}
              {ordinalHouse(f.ketu_house)} ({tSign(f.ketu_sign, lang)})
            </>
          ) : (
            <>
              {t.house}: {f.house_label} · {t.sign}: {tSign(f.sign, lang)}
            </>
          )}
        </p>
      </div>
      <div className="flex-1 p-4 space-y-3 text-sm">
        {f.house_wise_impact && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700 mb-1">{t.houseWiseImpact}</p>
            <p className="text-gray-800 leading-relaxed">{f.house_wise_impact}</p>
          </div>
        )}
        {f.health_focus && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700 mb-1">{t.healthFocus}</p>
            <p className="text-gray-700 leading-relaxed">{f.health_focus}</p>
          </div>
        )}
        {f.conventional_remedies && (
          <div className="pt-2 border-t border-amber-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">{t.conventionalRemedies}</p>
            <p className="text-gray-700 text-xs leading-relaxed">{f.conventional_remedies}</p>
          </div>
        )}
        {f.modern_remedies && (
          <div className="pt-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-sky-700 mb-1">{t.modernRemedies}</p>
            <p className="text-gray-700 text-xs leading-relaxed">{f.modern_remedies}</p>
          </div>
        )}
      </div>
    </article>
  );
}

function CardGrid({
  items,
  render,
  emptyText,
}: {
  items: PitruDoshaSignFinding[] | PitruDoshaHouseFinding[];
  render: (f: PitruDoshaSignFinding | PitruDoshaHouseFinding, i: number) => JSX.Element;
  emptyText: string;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
        {emptyText}
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((f, i) => render(f, i))}
    </div>
  );
}

interface Props {
  chart: ChartResponse;
  lang: Lang;
}

export default function PitruDoshaPanel({ chart, lang }: Props) {
  const t = LABELS[lang];
  const [data, setData] = useState<PitruDoshaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    calculatePitruDosha(chart)
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
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <svg className="animate-spin h-6 w-6 mr-2 text-indigo-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        {t.loading}
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

  const signFindings = data.sign_findings;
  const houseFindings = data.house_findings;
  const nothing = signFindings.length === 0 && houseFindings.length === 0;

  return (
    <div className="flex-1 min-h-0 overflow-auto px-4 py-5 space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-gray-200 pb-4">
        <h2 className="text-xl font-bold text-indigo-950">{t.title}</h2>
        {data.janma_rashi && (
          <p className="text-sm text-gray-700 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5">
            <span className="font-semibold text-indigo-800">{t.janmaRashi}:</span>{" "}
            {tSign(data.janma_rashi, lang)}
          </p>
        )}
      </header>

      {nothing ? (
        <p className="text-center text-gray-500 py-12">{t.noFindings}</p>
      ) : (
        <>
          <section className="space-y-4">
            <h3 className="text-base font-bold text-violet-900 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-violet-600" />
              {t.signWiseHeading}
              <span className="text-xs font-normal text-gray-500">({signFindings.length})</span>
            </h3>
            <CardGrid
              items={signFindings}
              emptyText={t.noSignFindings}
              render={(f, i) => (
                <SignWiseCard key={`sign-${f.combination}-${f.sign}-${i}`} f={f} lang={lang} t={t} />
              )}
            />
          </section>

          <section className="space-y-4">
            <h3 className="text-base font-bold text-teal-900 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-teal-600" />
              {t.houseWiseHeading}
              <span className="text-xs font-normal text-gray-500">({houseFindings.length})</span>
            </h3>
            <CardGrid
              items={houseFindings}
              emptyText={t.noHouseFindings}
              render={(f, i) => (
                <HouseWiseCard key={`house-${f.combination}-${f.house}-${i}`} f={f} lang={lang} t={t} />
              )}
            />
          </section>
        </>
      )}

      {data.disclaimer && (
        <p className="text-xs text-gray-400 text-center pb-2">{data.disclaimer}</p>
      )}
    </div>
  );
}
