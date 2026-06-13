"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChartResponse,
  PitruDoshaHouseFinding,
  PitruDoshaResponse,
  PitruDoshaSignFinding,
} from "@/types/chart";
import { calculatePitruDosha } from "@/services/api";
import { type Lang, SIGN_NAMES } from "@/lib/translations";
import {
  AbsentReport,
  AnalysisToggleButton,
  Disclaimer,
  DoshaError,
  DoshaLoading,
  DoshaPanelShell,
  FindingCard,
  FindingsSection,
  OverviewPanel,
  type OverviewStat,
  PageBar,
  SegmentTabs,
  SubsectionLabel,
  type FindingField,
} from "@/components/dosha/DoshaUI";

const LABELS: Record<Lang, Record<string, string>> = {
  en: {
    title: "Pitru Dosha",
    overview: "Overview",
    signWiseHeading: "Sign-wise findings",
    houseWiseHeading: "House-wise findings",
    signWiseImpact: "Impact",
    houseWiseImpact: "Impact",
    natureTheme: "Nature & theme",
    healthFocus: "Health focus",
    sign: "Sign",
    rahu: "Rahu",
    ketu: "Ketu",
    house: "House",
    strongerHouses: "Stronger houses",
    conventionalRemedies: "Conventional remedies",
    modernRemedies: "Modern remedies",
    severity: "Severity",
    loading: "Analyzing…",
    error: "Could not load Pitru Dosha analysis.",
    noSignFindings: "No sign-wise combinations.",
    noHouseFindings: "No house-wise combinations.",
    janmaRashi: "Janma Rashi",
    total: "Total",
    signCount: "Sign-wise",
    houseCount: "House-wise",
    present: "Found",
    notPresent: "Not found",
    absentTitle: "No Pitru Dosha indications",
    absentBody: "No sign-wise or house-wise combinations match this chart.",
    allTab: "All",
    signTab: "Sign",
    houseTab: "House",
    details: "Detailed findings",
  },
  hi: {
    title: "पितृ दोष",
    overview: "सारांश",
    signWiseHeading: "राशि अनुसार",
    houseWiseHeading: "भाव अनुसार",
    signWiseImpact: "प्रभाव",
    houseWiseImpact: "प्रभाव",
    natureTheme: "प्रकृति / विषय",
    healthFocus: "स्वास्थ्य",
    sign: "राशि",
    rahu: "राहु",
    ketu: "केतु",
    house: "भाव",
    strongerHouses: "प्रबल भाव",
    conventionalRemedies: "पारंपरिक उपाय",
    modernRemedies: "आधुनिक उपाय",
    severity: "गंभीरता",
    loading: "विश्लेषण…",
    error: "पितृ दोष लोड नहीं हो सका।",
    noSignFindings: "कोई राशि संयोजन नहीं।",
    noHouseFindings: "कोई भाव संयोजन नहीं।",
    janmaRashi: "जन्म राशि",
    total: "कुल",
    signCount: "राशि",
    houseCount: "भाव",
    present: "मिला",
    notPresent: "नहीं मिला",
    absentTitle: "पितृ दोष नहीं",
    absentBody: "कोई संयोजन मेल नहीं खाता।",
    allTab: "सभी",
    signTab: "राशि",
    houseTab: "भाव",
    details: "विस्तृत निष्कर्ष",
  },
  gu: {
    title: "પિતૃ દોષ",
    overview: "સારાંશ",
    signWiseHeading: "રાશિ પ્રમાણે",
    houseWiseHeading: "ભાવ પ્રમાણે",
    signWiseImpact: "અસર",
    houseWiseImpact: "અસર",
    natureTheme: "સ્વભાવ / વિષય",
    healthFocus: "આરોગ્ય",
    sign: "રાશિ",
    rahu: "રાહુ",
    ketu: "કેતુ",
    house: "ભાવ",
    strongerHouses: "પ્રબળ ભાવ",
    conventionalRemedies: "પરંપરાગત ઉપાય",
    modernRemedies: "આધુનિક ઉપાય",
    severity: "તીવ્રતા",
    loading: "વિશ્લેષણ…",
    error: "પિતૃ દોષ લોડ થયો નહીં.",
    noSignFindings: "કોઈ રાશિ સંયોજન નથી.",
    noHouseFindings: "કોઈ ભાવ સંયોજન નથી.",
    janmaRashi: "જન્મ રાશિ",
    total: "કુલ",
    signCount: "રાશિ",
    houseCount: "ભાવ",
    present: "મળ્યું",
    notPresent: "નથી મળ્યું",
    absentTitle: "પિતૃ દોષ નથી",
    absentBody: "કોઈ સંયોજન મેળ ખાતું નથી.",
    allTab: "બધા",
    signTab: "રાશિ",
    houseTab: "ભાવ",
    details: "વિગતવાર નિષ્કર્ષ",
  },
};

type ViewTab = "all" | "sign" | "house";

function tSign(name: string, lang: Lang): string {
  const i = SIGN_NAMES.en.indexOf(name);
  return i >= 0 ? SIGN_NAMES[lang][i] : name;
}

function ordinalHouse(n: number): string {
  if (n >= 11 && n <= 13) return `${n}th`;
  const suffix = { 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th";
  return `${n}${suffix}`;
}

function buildSignFields(f: PitruDoshaSignFinding, t: Record<string, string>): FindingField[] {
  const fields: FindingField[] = [];
  if (f.sign_wise_impact)
    fields.push({ label: t.signWiseImpact, value: f.sign_wise_impact, kind: "effect" });
  if (f.nature_theme) fields.push({ label: t.natureTheme, value: f.nature_theme, kind: "effect" });
  if (f.stronger_houses)
    fields.push({ label: t.strongerHouses, value: f.stronger_houses, kind: "effect" });
  if (f.conventional_remedies)
    fields.push({ label: t.conventionalRemedies, value: f.conventional_remedies, kind: "remedy" });
  if (f.modern_remedies)
    fields.push({ label: t.modernRemedies, value: f.modern_remedies, kind: "remedy" });
  return fields;
}

function buildHouseFields(f: PitruDoshaHouseFinding, t: Record<string, string>): FindingField[] {
  const fields: FindingField[] = [];
  if (f.house_wise_impact)
    fields.push({ label: t.houseWiseImpact, value: f.house_wise_impact, kind: "effect" });
  if (f.health_focus) fields.push({ label: t.healthFocus, value: f.health_focus, kind: "effect" });
  if (f.conventional_remedies)
    fields.push({ label: t.conventionalRemedies, value: f.conventional_remedies, kind: "remedy" });
  if (f.modern_remedies)
    fields.push({ label: t.modernRemedies, value: f.modern_remedies, kind: "remedy" });
  return fields;
}

function signMeta(f: PitruDoshaSignFinding, lang: Lang, t: Record<string, string>): string {
  if (f.rahu_sign && f.ketu_sign) {
    return `${t.rahu}: ${tSign(f.rahu_sign, lang)} · ${t.ketu}: ${tSign(f.ketu_sign, lang)}`;
  }
  return `${t.sign}: ${tSign(f.sign, lang)}`;
}

function houseMeta(f: PitruDoshaHouseFinding, lang: Lang, t: Record<string, string>): string {
  if (f.rahu_house != null && f.ketu_house != null && f.rahu_sign && f.ketu_sign) {
    return `${t.rahu}: ${ordinalHouse(f.rahu_house)} (${tSign(f.rahu_sign, lang)}) · ${t.ketu}: ${ordinalHouse(f.ketu_house)} (${tSign(f.ketu_sign, lang)})`;
  }
  return `${t.house}: ${f.house_label} · ${t.sign}: ${tSign(f.sign, lang)}`;
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
  const [viewTab, setViewTab] = useState<ViewTab>("all");
  const [showDetails, setShowDetails] = useState(false);

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

  const signFindings = data?.sign_findings ?? [];
  const houseFindings = data?.house_findings ?? [];
  const totalCount = signFindings.length + houseFindings.length;

  const highestSeverity = useMemo(() => {
    const severities = [
      ...signFindings.map((f) => f.sign_wise_severity),
      ...houseFindings.map((f) => f.house_wise_severity),
    ].filter(Boolean) as string[];
    const order = ["very high", "high", "medium to high", "medium", "low"];
    for (const level of order) {
      const found = severities.find((s) => s.toLowerCase().includes(level));
      if (found) return found;
    }
    return severities[0] ?? null;
  }, [signFindings, houseFindings]);

  if (loading) return <DoshaLoading theme="pitru" message={t.loading} />;
  if (error) return <DoshaError message={error} />;
  if (!data) return null;

  const showSign = viewTab === "all" || viewTab === "sign";
  const showHouse = viewTab === "all" || viewTab === "house";

  const overviewStats: OverviewStat[] = [
    ...(data.janma_rashi
      ? [{ label: t.janmaRashi, value: tSign(data.janma_rashi, lang) }]
      : []),
    { label: t.total, value: totalCount },
    { label: t.signCount, value: signFindings.length },
    { label: t.houseCount, value: houseFindings.length },
  ];

  const severityItems = highestSeverity
    ? [{ label: t.severity, severity: highestSeverity }]
    : [];

  return (
    <DoshaPanelShell theme="pitru">
      <PageBar
        theme="pitru"
        title={t.title}
        present={data.present}
        presentLabel={t.present}
        absentLabel={t.notPresent}
      />

      {totalCount === 0 ? (
        <AbsentReport title={t.absentTitle} body={t.absentBody} />
      ) : (
        <>
          <OverviewPanel
            theme="pitru"
            title={t.overview}
            stats={overviewStats}
            severityItems={severityItems}
          />

          <AnalysisToggleButton
            theme="pitru"
            label={t.details}
            expanded={showDetails}
            onToggle={() => setShowDetails((v) => !v)}
          />

          {showDetails && (
          <div className="space-y-5 dosha-fade-up dosha-fade-up-3 min-w-0">
            <div className="dosha-glass-card rounded-2xl p-3 md:p-4 min-w-0">
              <SegmentTabs
                theme="pitru"
                active={viewTab}
                onChange={setViewTab}
                tabs={[
                  { id: "all", label: t.allTab, count: totalCount },
                  { id: "sign", label: t.signTab, count: signFindings.length },
                  { id: "house", label: t.houseTab, count: houseFindings.length },
                ]}
              />
            </div>

            {showSign && signFindings.length > 0 && (
              <FindingsSection
                label={viewTab === "all" ? <SubsectionLabel theme="pitru">{t.signWiseHeading}</SubsectionLabel> : undefined}
              >
                {signFindings.map((f, i) => (
                  <FindingCard
                    key={`sign-${f.combination}-${f.sign}-${i}`}
                    theme="pitru"
                    index={i + 1}
                    title={f.combination}
                    meta={signMeta(f, lang, t)}
                    severity={f.sign_wise_severity}
                    fields={buildSignFields(f, t)}
                    compact
                  />
                ))}
              </FindingsSection>
            )}

            {showSign && signFindings.length === 0 && (
              <p className="dosha-font-body text-base text-[#47464f] px-1">{t.noSignFindings}</p>
            )}

            {showHouse && houseFindings.length > 0 && (
              <FindingsSection
                label={viewTab === "all" ? <SubsectionLabel theme="pitru">{t.houseWiseHeading}</SubsectionLabel> : undefined}
              >
                {houseFindings.map((f, i) => (
                  <FindingCard
                    key={`house-${f.combination}-${f.house}-${i}`}
                    theme="pitru"
                    index={i + 1}
                    title={f.combination}
                    meta={houseMeta(f, lang, t)}
                    severity={f.house_wise_severity}
                    fields={buildHouseFields(f, t)}
                    compact
                  />
                ))}
              </FindingsSection>
            )}

            {showHouse && houseFindings.length === 0 && (
              <p className="dosha-font-body text-base text-[#47464f] px-1">{t.noHouseFindings}</p>
            )}
          </div>
          )}
        </>
      )}

      {data.disclaimer && <Disclaimer text={data.disclaimer} />}
    </DoshaPanelShell>
  );
}
