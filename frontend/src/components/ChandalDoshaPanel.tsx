"use client";

import { useEffect, useState } from "react";
import {
  ChartResponse,
  ChandalDoshaMitigation,
  ChandalDoshaResponse,
  MahapurushaFinding,
  RajaYogaFinding,
} from "@/types/chart";
import { calculateChandalDosha } from "@/services/api";
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
  OrbMeter,
  OverviewPanel,
  type OverviewStat,
  PageBar,
  ReadableText,
  FlowLayout,
  RemediesGrid,
  TextBlock,
} from "@/components/dosha/DoshaUI";

const LABELS: Record<Lang, Record<string, string>> = {
  en: {
    title: "Guru Chandal Yoga",
    overview: "Overview",
    chartFacts: "Planetary positions",
    conjunction: "Conjunction",
    impact: "Life impact",
    remedies: "Remedies",
    mitigations: "Mitigating factors",
    present: "Present",
    notPresent: "Not present",
    variant: "Variant",
    houseType: "House type",
    jupiter: "Jupiter",
    node: "Node",
    orb: "Orb",
    dignity: "Dignity",
    functionalRole: "Role",
    combust: "Combust",
    retrograde: "Retrograde",
    baseSeverity: "Base severity",
    effectiveSeverity: "After mitigations",
    impactArea: "Impact area",
    impactTypes: "Life themes",
    variantNote: "Variant insight",
    variantPositive: "Potential",
    conventionalRemedies: "Conventional Remedies",
    modernRemedies: "Modern Remedies",
    positiveNote: "Positive Aspect",
    matched: "Matched",
    notMatched: "Not matched",
    rajaYogas: "Raja Yogas",
    mahapurusha: "Mahapurusha",
    loading: "Analyzing…",
    error: "Could not load Chandal Dosha analysis.",
    absentTitle: "Guru Chandal not formed",
    absentBody: "Jupiter does not share a sign with Rahu or Ketu in D1.",
    mitigatedNote: "Present, but strong chart factors may soften its expression.",
    infoOnly: "Info",
    close: "Close",
    moderate: "Moderate",
    wide: "Wide",
    houseCategory: "House nature",
    trikona: "Trikona",
    kendra: "Kendra",
    dusthana: "Dusthana",
    upachaya: "Upachaya",
    artha: "Artha",
    yes: "Yes",
    no: "No",
    analysis: "Detailed analysis",
  },
  hi: {
    title: "गुरु चांडाल योग",
    overview: "सारांश",
    chartFacts: "ग्रह स्थिति",
    conjunction: "युति",
    impact: "जीवन प्रभाव",
    remedies: "उपाय",
    mitigations: "शमन कारक",
    present: "उपस्थित",
    notPresent: "अनुपस्थित",
    variant: "प्रकार",
    houseType: "भाव प्रकार",
    jupiter: "गुरु",
    node: "ग्रह",
    orb: "अंतर",
    dignity: "बल",
    functionalRole: "भूमिका",
    combust: "अस्त",
    retrograde: "वक्री",
    baseSeverity: "आधार",
    effectiveSeverity: "शमन के बाद",
    impactArea: "प्रभाव क्षेत्र",
    impactTypes: "जीवन विषय",
    variantNote: "प्रकार विश्लेषण",
    variantPositive: "संभावना",
    conventionalRemedies: "पारंपरिक उपाय",
    modernRemedies: "आधुनिक उपाय",
    positiveNote: "सकारात्मक",
    matched: "मेल",
    notMatched: "नहीं",
    rajaYogas: "राज योग",
    mahapurusha: "महापुरुष",
    loading: "विश्लेषण…",
    error: "चांडाल दोष लोड नहीं हो सका।",
    absentTitle: "गुरु चांडाल नहीं",
    absentBody: "गुरु राहु/केतु के साथ एक राशि में नहीं।",
    mitigatedNote: "उपस्थित है, परंतु प्रबल योग प्रभाव कम कर सकते हैं।",
    infoOnly: "जानकारी",
    close: "निकट",
    moderate: "मध्यम",
    wide: "दूर",
    houseCategory: "भाव स्वभाव",
    trikona: "त्रिकोण",
    kendra: "केंद्र",
    dusthana: "दुःस्थान",
    upachaya: "उपचय",
    artha: "अर्थ",
    yes: "हाँ",
    no: "नहीं",
    analysis: "विस्तृत विश्लेषण",
  },
  gu: {
    title: "ગુરુ ચાંડાલ યોગ",
    overview: "સારાંશ",
    chartFacts: "ગ્રહ સ્થિતિ",
    conjunction: "યુતિ",
    impact: "જીવન અસર",
    remedies: "ઉપાય",
    mitigations: "શમન કારકો",
    present: "હાજર",
    notPresent: "નથી",
    variant: "પ્રકાર",
    houseType: "ભાવ પ્રકાર",
    jupiter: "ગુરુ",
    node: "ગ્રહ",
    orb: "અંતર",
    dignity: "બળ",
    functionalRole: "ભૂમિકા",
    combust: "અસ્ત",
    retrograde: "વક્રી",
    baseSeverity: "મૂળ",
    effectiveSeverity: "શમન પછી",
    impactArea: "અસર ક્ષેત્ર",
    impactTypes: "જીવન વિષયો",
    variantNote: "પ્રકાર વિશ્લેષણ",
    variantPositive: "સંભાવના",
    conventionalRemedies: "પરંપરાગત ઉપાય",
    modernRemedies: "આધુનિક ઉપાય",
    positiveNote: "સકારાત્મક",
    matched: "મેળ",
    notMatched: "નથી",
    rajaYogas: "રાજ યોગ",
    mahapurusha: "મહાપુરુષ",
    loading: "વિશ્લેષણ…",
    error: "ચાંડાલ દોષ લોડ થયો નહીં.",
    absentTitle: "ગુરુ ચાંડાલ નથી",
    absentBody: "ગુરુ રાહુ/કેતુ સાથે એક રાશિમાં નથી.",
    mitigatedNote: "હાજર છે, પરંતુ મજબૂત યોગો અસર ઘટાડી શકે છે.",
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
    yes: "હા",
    no: "ના",
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

function YogaExtras({
  factorKey,
  factors,
  t,
}: {
  factorKey: string;
  factors: ChandalDoshaMitigation[];
  t: Record<string, string>;
}) {
  const f = factors.find((x) => x.factor === factorKey);
  if (!f) return null;
  const showYogas = f.factor === "Strong Raja Yogas" || f.factor === "Hamsa Mahapurusha";

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
                  — {m.planet}, {m.sign}
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

export default function ChandalDoshaPanel({ chart, lang }: Props) {
  const t = LABELS[lang];
  const [data, setData] = useState<ChandalDoshaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

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

  if (loading) return <DoshaLoading theme="chandal" message={t.loading} />;
  if (error) return <DoshaError message={error} />;
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
      isInfo: f.factor === "D-9 Guru Chandal note",
    })) ?? [];

  const overviewStats: OverviewStat[] = [
    ...(variantLabel
      ? [{ label: t.variant, value: variantLabel, wide: true }]
      : []),
    { label: t.houseType, value: typeName ?? "—", wide: true },
    ...(data.type?.house_category
      ? [{ label: t.houseCategory, value: categoryLabel(data.type.house_category, t) }]
      : []),
  ];

  const severityItems = [
    ...(data.base_severity ? [{ label: t.baseSeverity, severity: data.base_severity }] : []),
    ...(data.effective_severity && data.effective_severity !== data.base_severity
      ? [{ label: t.effectiveSeverity, severity: data.effective_severity }]
      : []),
  ];

  return (
    <DoshaPanelShell theme="chandal">
      <PageBar
        theme="chandal"
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
            theme="chandal"
            title={t.overview}
            stats={overviewStats}
            severityItems={severityItems}
          />

          <AnalysisToggleButton
            theme="chandal"
            label={t.analysis}
            expanded={showDetails}
            onToggle={() => setShowDetails((v) => !v)}
          />

          {showDetails && (
          <FlowLayout>
            <DetailsPanel theme="chandal" title={t.chartFacts} variant="causes" span={2}>
              <FactGrid cols={2}>
                {data.jupiter && (
                  <>
                    <FactRow
                      label={t.jupiter}
                      value={`${ordinalHouse(data.jupiter.house)} · ${tSign(data.jupiter.sign, lang)}`}
                    />
                    {data.jupiter.dignity && (
                      <FactRow label={t.dignity} value={data.jupiter.dignity} />
                    )}
                    {data.jupiter.functional_role && (
                      <FactRow label={t.functionalRole} value={data.jupiter.functional_role} />
                    )}
                    <FactRow label={t.combust} value={data.jupiter.combust ? t.yes : t.no} />
                    <FactRow
                      label={t.retrograde}
                      value={data.jupiter.retrograde ? t.yes : t.no}
                    />
                  </>
                )}
                {data.node && (
                  <FactRow
                    label={`${t.node} (${data.node.name})`}
                    value={`${ordinalHouse(data.node.house)} · ${tSign(data.node.sign, lang)}`}
                    fullWidth
                  />
                )}
              </FactGrid>
              {data.conjunction_orb_degrees != null && (
                <div className="mt-4 pt-4 border-t border-slate-200/70">
                  <OrbMeter
                    theme="chandal"
                    degrees={data.conjunction_orb_degrees}
                    strengthLabel={strengthLabel(data.conjunction_strength, t)}
                    label={t.orb}
                  />
                </div>
              )}
            </DetailsPanel>

            {mitigationItems.length > 0 && (
              <DetailsPanel theme="chandal" title={t.mitigations} variant="causes" span={2}>
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

            {(data.variant_impact ||
              data.variant_positive ||
              data.impact_area ||
              data.impact_types) && (
              <>
                {data.variant_impact && (
                  <DetailsPanel theme="chandal" title={t.variantNote} variant="effects">
                    <ReadableText text={data.variant_impact} bulletClass="bg-[#674bb5]" />
                  </DetailsPanel>
                )}
                {data.variant_positive && (
                  <DetailsPanel theme="chandal" title={t.variantPositive} variant="effects">
                    <ReadableText text={data.variant_positive} bulletClass="bg-[#674bb5]" />
                  </DetailsPanel>
                )}
                {data.impact_area && (
                  <DetailsPanel theme="chandal" title={t.impactArea} variant="effects">
                    <ReadableText text={data.impact_area} bulletClass="bg-[#674bb5]" />
                  </DetailsPanel>
                )}
                {data.impact_types && (
                  <DetailsPanel theme="chandal" title={t.impactTypes} variant="effects">
                    <ReadableText text={data.impact_types} bulletClass="bg-[#674bb5]" />
                  </DetailsPanel>
                )}
              </>
            )}

            {(data.conventional_remedies || data.modern_remedies) && (
              <DetailsPanel theme="chandal" title={t.remedies} variant="remedies" span={2}>
                <RemediesGrid
                  conventional={data.conventional_remedies}
                  modern={data.modern_remedies}
                  conventionalLabel={t.conventionalRemedies}
                  modernLabel={t.modernRemedies}
                />
              </DetailsPanel>
            )}

            {data.positive_note && (
              <DetailsPanel theme="chandal" title={t.positiveNote} variant="recommendations">
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
