"use client";

import { useEffect, useState } from "react";
import {
  ChartResponse,
  KaalSarpaMitigation,
  KaalSarpaResponse,
  MahapurushaFinding,
  RajaYogaFinding,
} from "@/types/chart";
import { calculateKaalSarpa } from "@/services/api";
import { type Lang, SIGN_NAMES } from "@/lib/translations";
import {
  AbsentReport,
  AnalysisToggleButton,
  DetailsPanel,
  Disclaimer,
  DoshaError,
  DoshaLoading,
  DoshaPanelShell,
  FactGrid,
  FactRow,
  MitigationList,
  NoticeBanner,
  OverviewPanel,
  type OverviewStat,
  PageBar,
  ReadableText,
  FlowLayout,
  RemediesGrid,
  TagList,
  TextBlock,
} from "@/components/dosha/DoshaUI";

const LABELS: Record<Lang, Record<string, string>> = {
  en: {
    title: "Kaal Sarpa Yoga",
    overview: "Overview",
    chartFacts: "Chart positions",
    impact: "Life impact",
    remedies: "Remedies",
    mitigations: "Mitigating factors",
    present: "Present",
    notPresent: "Not present",
    type: "Type",
    rahu: "Rahu",
    ketu: "Ketu",
    orientation: "Serpent arc",
    planetsInside: "Planets inside",
    baseSeverity: "Base severity",
    effectiveSeverity: "After mitigations",
    impactArea: "Impact area",
    impactTypes: "Influence areas",
    conventionalRemedies: "Conventional",
    modernRemedies: "Modern",
    positiveNote: "Positive view",
    matched: "Matched",
    notMatched: "Not matched",
    rajaYogas: "Raja Yogas",
    mahapurusha: "Mahapurusha",
    afflicted: "afflicted",
    loading: "Analyzing…",
    error: "Could not load Kaal Sarpa analysis.",
    absentTitle: "Kaal Sarpa not present",
    absentBody: "Not all seven grahas lie on one side of the Rahu–Ketu axis.",
    mitigatedNote: "Present, but strong chart factors may reduce its effects.",
    rahuToKetu: "Rahu → Ketu",
    ketuToRahu: "Ketu → Rahu",
    infoOnly: "Info",
    lifeDomains: "Life domains",
    analysis: "Detailed analysis",
  },
  hi: {
    title: "काल सर्प योग",
    overview: "सारांश",
    chartFacts: "कुंडली स्थिति",
    impact: "जीवन प्रभाव",
    remedies: "उपाय",
    mitigations: "शमन कारक",
    present: "उपस्थित",
    notPresent: "अनुपस्थित",
    type: "प्रकार",
    rahu: "राहु",
    ketu: "केतु",
    orientation: "सर्प चाप",
    planetsInside: "सर्प के भीतर",
    baseSeverity: "आधार गंभीरता",
    effectiveSeverity: "शमन के बाद",
    impactArea: "प्रभाव क्षेत्र",
    impactTypes: "प्रभाव क्षेत्र",
    conventionalRemedies: "पारंपरिक",
    modernRemedies: "आधुनिक",
    positiveNote: "सकारात्मक",
    matched: "मेल",
    notMatched: "नहीं",
    rajaYogas: "राज योग",
    mahapurusha: "महापुरुष",
    afflicted: "अशुभ",
    loading: "विश्लेषण…",
    error: "काल सर्प लोड नहीं हो सका।",
    absentTitle: "काल सर्प नहीं",
    absentBody: "सभी ग्रह राहु–केतु अक्ष के एक ओर नहीं हैं।",
    mitigatedNote: "उपस्थित है, परंतु प्रबल योग प्रभाव कम कर सकते हैं।",
    rahuToKetu: "राहु → केतु",
    ketuToRahu: "केतु → राहु",
    infoOnly: "जानकारी",
    lifeDomains: "जीवन क्षेत्र",
    analysis: "विस्तृत विश्लेषण",
  },
  gu: {
    title: "કાલ સર્પ યોગ",
    overview: "સારાંશ",
    chartFacts: "કુંડળી સ્થિતિ",
    impact: "જીવન અસર",
    remedies: "ઉપાય",
    mitigations: "શમન કારકો",
    present: "હાજર",
    notPresent: "નથી",
    type: "પ્રકાર",
    rahu: "રાહુ",
    ketu: "કેતુ",
    orientation: "સર્પ ચાપ",
    planetsInside: "સર્પની અંદર",
    baseSeverity: "મૂળ તીવ્રતા",
    effectiveSeverity: "શમન પછી",
    impactArea: "અસર ક્ષેત્ર",
    impactTypes: "પ્રભાવ ક્ષેત્રો",
    conventionalRemedies: "પરંપરાગત",
    modernRemedies: "આધુનિક",
    positiveNote: "સકારાત્મક",
    matched: "મેળ",
    notMatched: "નથી",
    rajaYogas: "રાજ યોગ",
    mahapurusha: "મહાપુરુષ",
    afflicted: "અશુભ",
    loading: "વિશ્લેષણ…",
    error: "કાલ સર્પ લોડ થયો નહીં.",
    absentTitle: "કાલ સર્પ નથી",
    absentBody: "બધા ગ્રહ રાહુ–કેતુ અક્ષની એક બાજુએ નથી.",
    mitigatedNote: "હાજર છે, પરંતુ મજબૂત યોગો અસર ઘટાડી શકે છે.",
    rahuToKetu: "રાહુ → કેતુ",
    ketuToRahu: "કેતુ → રાહુ",
    infoOnly: "માહિતી",
    lifeDomains: "જીવન ક્ષેત્રો",
    analysis: "વિગતવાર વિશ્લેષણ",
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

function YogaExtras({
  factorKey,
  factors,
  t,
}: {
  factorKey: string;
  factors: KaalSarpaMitigation[];
  t: Record<string, string>;
}) {
  const f = factors.find((x) => x.factor === factorKey);
  if (!f) return null;
  const showYogas =
    factorKey === "Strong Raja Yogas" || factorKey === "Multiple Mahapurusha Yogas";

  return (
    <div className="mt-2 space-y-2 pt-2 border-t border-slate-200/60">
      {showYogas && f.raja_yogas && f.raja_yogas.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-indigo-600 mb-1.5">
            {t.rajaYogas}
          </p>
          <ul className="space-y-1.5">
            {f.raja_yogas.map((y: RajaYogaFinding, i: number) => (
              <li key={i} className="text-sm text-slate-700 pl-2.5 border-l-2 border-indigo-300/70">
                <span className="font-bold text-[#1e1b4b]">{y.yoga_name}</span>
                <span className="text-slate-500"> — {y.lords.join(" + ")}</span>
                {y.afflicted && (
                  <span className="text-red-600 text-xs ml-1">[{t.afflicted}]</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {showYogas && f.mahapurusha_yogas && f.mahapurusha_yogas.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-violet-600 mb-1.5">
            {t.mahapurusha}
          </p>
          <ul className="space-y-1.5">
            {f.mahapurusha_yogas.map((m: MahapurushaFinding, i: number) => (
              <li key={i} className="text-sm text-slate-700 pl-2.5 border-l-2 border-violet-300/70">
                <span className="font-bold text-[#1e1b4b]">{m.yoga}</span>
                <span className="text-slate-500">
                  {" "}
                  — {m.planet}, {m.sign}, H{m.house}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
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
  const [showDetails, setShowDetails] = useState(false);

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

  if (loading) return <DoshaLoading theme="kaalsarpa" message={t.loading} />;
  if (error) return <DoshaError message={error} />;
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

  const isMitigated =
    data.present &&
    (data.mitigating_factors?.filter((f) => f.matched).length ?? 0) > 0 &&
    data.base_severity !== data.effective_severity;

  const mitigationItems =
    data.mitigating_factors?.map((f) => ({
      key: f.factor,
      factor: f.factor,
      matched: f.matched,
      detail: f.detail,
      isInfo: f.factor === "D-9 Kaal Sarpa note",
    })) ?? [];

  const overviewStats: OverviewStat[] = [
    { label: t.type, value: typeName ?? "—", wide: true },
    ...(data.life_domains?.length
      ? [
          {
            label: t.lifeDomains,
            value: <TagList theme="kaalsarpa" items={data.life_domains} />,
            wide: true,
          },
        ]
      : []),
  ];

  const severityItems = [
    ...(data.base_severity ? [{ label: t.baseSeverity, severity: data.base_severity }] : []),
    ...(data.effective_severity && data.effective_severity !== data.base_severity
      ? [{ label: t.effectiveSeverity, severity: data.effective_severity }]
      : []),
  ];

  return (
    <DoshaPanelShell theme="kaalsarpa">
      <PageBar
        theme="kaalsarpa"
        title={t.title}
        present={data.present}
        presentLabel={t.present}
        absentLabel={t.notPresent}
      />

      {!data.present ? (
        <AbsentReport title={t.absentTitle} body={t.absentBody} />
      ) : (
        <>
          {isMitigated && <NoticeBanner>{t.mitigatedNote}</NoticeBanner>}

          <OverviewPanel
            theme="kaalsarpa"
            title={t.overview}
            stats={overviewStats}
            severityItems={severityItems}
          />

          <AnalysisToggleButton
            theme="kaalsarpa"
            label={t.analysis}
            expanded={showDetails}
            onToggle={() => setShowDetails((v) => !v)}
          />

          {showDetails && (
          <FlowLayout>
            <DetailsPanel theme="kaalsarpa" title={t.chartFacts} variant="causes">
              <FactGrid cols={2}>
                {data.rahu && (
                  <FactRow
                    label={t.rahu}
                    value={`${ordinalHouse(data.rahu.house)} · ${tSign(data.rahu.sign, lang)}`}
                  />
                )}
                {data.ketu && (
                  <FactRow
                    label={t.ketu}
                    value={`${ordinalHouse(data.ketu.house)} · ${tSign(data.ketu.sign, lang)}`}
                  />
                )}
                {orientationLabel && (
                  <FactRow label={t.orientation} value={orientationLabel} fullWidth />
                )}
                {data.planets_inside && data.planets_inside.length > 0 && (
                  <FactRow
                    label={t.planetsInside}
                    value={<TagList theme="kaalsarpa" items={data.planets_inside} />}
                    fullWidth
                  />
                )}
                {data.type?.sanskrit && (
                  <FactRow label="Sanskrit" value={data.type.sanskrit} fullWidth />
                )}
              </FactGrid>
            </DetailsPanel>

            {mitigationItems.length > 0 && (
              <DetailsPanel theme="kaalsarpa" title={t.mitigations} variant="causes" span={2}>
                <MitigationList
                  items={mitigationItems}
                  matchedLabel={t.matched}
                  notMatchedLabel={t.notMatched}
                  infoOnlyLabel={t.infoOnly}
                  columns={2}
                >
                  {(key) => (
                    <YogaExtras
                      factorKey={key}
                      factors={data.mitigating_factors ?? []}
                      t={t}
                    />
                  )}
                </MitigationList>
              </DetailsPanel>
            )}

            {(data.impact_area || data.impact_types) && (
              <>
                {data.impact_area && (
                  <DetailsPanel theme="kaalsarpa" title={t.impactArea} variant="effects">
                    <ReadableText text={data.impact_area} bulletClass="bg-[#674bb5]" />
                  </DetailsPanel>
                )}
                {data.impact_types && (
                  <DetailsPanel theme="kaalsarpa" title={t.impactTypes} variant="effects">
                    <ReadableText text={data.impact_types} bulletClass="bg-[#674bb5]" />
                  </DetailsPanel>
                )}
              </>
            )}

            {(data.conventional_remedies || data.modern_remedies) && (
              <DetailsPanel theme="kaalsarpa" variant="remedies" span={2}>
                <RemediesGrid
                  conventional={data.conventional_remedies}
                  modern={data.modern_remedies}
                  conventionalLabel={t.conventionalRemedies}
                  modernLabel={t.modernRemedies}
                />
              </DetailsPanel>
            )}

            {data.positive_note && (
              <DetailsPanel theme="kaalsarpa" title={t.positiveNote} variant="recommendations">
                <TextBlock label={t.positiveNote} kind="recommendation" last>
                  <ReadableText text={data.positive_note} bulletClass="bg-violet-500" />
                </TextBlock>
              </DetailsPanel>
            )}
          </FlowLayout>
          )}
        </>
      )}

      {data.disclaimer && <Disclaimer text={data.disclaimer} />}
    </DoshaPanelShell>
  );
}
