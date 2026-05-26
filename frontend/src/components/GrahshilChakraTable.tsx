"use client";

import { type Lang, GRAHSHIL_ROWS, GRAHSHIL_PLANET_HEADERS, GRAHSHIL_TITLE, translateSign, translateSignList } from "@/lib/translations";

interface Props { lang?: Lang; }

// ── Static data (always stored in English, translated at render) ──────────────

const PLANETS_EN = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];

interface PlanetStaticData {
  swakshetra: string;
  uchcha: string;
  ucchaDeg: number;
  neecha: string;
  neechaDeg: number;
  moolatrikona: string;
  ekpaad: string;
  dwipaad: string;
  tripaad: string;
  sampurna: string;
  mitra: string;
  sama: string;
  shatru: string;
}

const DATA: Record<string, PlanetStaticData> = {
  Sun: {
    swakshetra: "Leo",                   uchcha: "Aries",       ucchaDeg: 10,
    neecha: "Libra",                     neechaDeg: 10,
    moolatrikona: "Leo",
    ekpaad: "3, 10",    dwipaad: "5, 9",  tripaad: "4, 8",   sampurna: "7",
    mitra: "Moon, Mars, Jupiter",
    sama:  "Mercury",
    shatru: "Venus, Saturn",
  },
  Moon: {
    swakshetra: "Cancer",                uchcha: "Taurus",      ucchaDeg: 3,
    neecha: "Scorpio",                   neechaDeg: 3,
    moolatrikona: "Taurus",
    ekpaad: "3, 10",    dwipaad: "5, 9",  tripaad: "4, 8",   sampurna: "7",
    mitra: "Sun, Mercury",
    sama:  "Mars, Jupiter, Venus, Saturn",
    shatru: "Rahu, Ketu",
  },
  Mars: {
    swakshetra: "Aries, Scorpio",        uchcha: "Capricorn",   ucchaDeg: 28,
    neecha: "Cancer",                    neechaDeg: 28,
    moolatrikona: "Aries",
    ekpaad: "3, 10",    dwipaad: "5, 9",  tripaad: "—",      sampurna: "4, 7, 8",
    mitra: "Sun, Moon, Jupiter",
    sama:  "Venus, Saturn",
    shatru: "Mercury",
  },
  Mercury: {
    swakshetra: "Gemini, Virgo",         uchcha: "Virgo",       ucchaDeg: 15,
    neecha: "Pisces",                    neechaDeg: 15,
    moolatrikona: "Virgo",
    ekpaad: "3, 10",    dwipaad: "5, 9",  tripaad: "4, 8",   sampurna: "7",
    mitra: "Sun, Venus",
    sama:  "Mars, Jupiter, Saturn",
    shatru: "Moon",
  },
  Jupiter: {
    swakshetra: "Sagittarius, Pisces",   uchcha: "Cancer",      ucchaDeg: 5,
    neecha: "Capricorn",                 neechaDeg: 5,
    moolatrikona: "Sagittarius",
    ekpaad: "3, 10",    dwipaad: "—",     tripaad: "4, 8",   sampurna: "5, 7, 9",
    mitra: "Sun, Moon, Mars",
    sama:  "Saturn",
    shatru: "Mercury, Venus",
  },
  Venus: {
    swakshetra: "Taurus, Libra",         uchcha: "Pisces",      ucchaDeg: 27,
    neecha: "Virgo",                     neechaDeg: 27,
    moolatrikona: "Libra",
    ekpaad: "3, 10",    dwipaad: "5, 9",  tripaad: "4, 8",   sampurna: "7",
    mitra: "Mercury, Saturn",
    sama:  "Mars, Jupiter",
    shatru: "Sun, Moon",
  },
  Saturn: {
    swakshetra: "Capricorn, Aquarius",   uchcha: "Libra",       ucchaDeg: 20,
    neecha: "Aries",                     neechaDeg: 20,
    moolatrikona: "Aquarius",
    ekpaad: "—",        dwipaad: "5, 9",  tripaad: "4, 8",   sampurna: "3, 7, 10",
    mitra: "Mercury, Venus",
    sama:  "Jupiter",
    shatru: "Sun, Moon, Mars",
  },
  Rahu: {
    swakshetra: "Virgo",                 uchcha: "Gemini",      ucchaDeg: 15,
    neecha: "Sagittarius",               neechaDeg: 15,
    moolatrikona: "Cancer",
    ekpaad: "3, 10",    dwipaad: "5, 9",  tripaad: "4, 8",   sampurna: "7",
    mitra: "Saturn, Mercury, Venus",
    sama:  "Jupiter",
    shatru: "Sun, Moon, Mars",
  },
  Ketu: {
    swakshetra: "Pisces",                uchcha: "Sagittarius", ucchaDeg: 15,
    neecha: "Gemini",                    neechaDeg: 15,
    moolatrikona: "Capricorn",
    ekpaad: "3, 10",    dwipaad: "5, 9",  tripaad: "4, 8",   sampurna: "7",
    mitra: "Mars, Saturn, Venus",
    sama:  "Jupiter",
    shatru: "Sun, Moon, Mercury",
  },
};

// Row key → field accessor
type RowKey = "swakshetra" | "uchcha" | "ucchaDeg" | "neecha" | "neechaDeg" | "moolatrikona"
            | "ekpaad" | "dwipaad" | "tripaad" | "sampurna" | "mitra" | "sama" | "shatru";

const ROW_KEYS: RowKey[] = [
  "swakshetra", "uchcha", "ucchaDeg", "neecha", "neechaDeg", "moolatrikona",
  "ekpaad", "dwipaad", "tripaad", "sampurna",
  "mitra", "sama", "shatru",
];

function rowBg(key: RowKey): string {
  if (["swakshetra"].includes(key))                    return "#f0fdf4"; // green tint
  if (["uchcha", "ucchaDeg"].includes(key))            return "#eff6ff"; // blue tint
  if (["neecha", "neechaDeg"].includes(key))           return "#fff1f2"; // red tint
  if (["moolatrikona"].includes(key))                  return "#faf5ff"; // purple tint
  if (["ekpaad"].includes(key))                        return "#f9fafb"; // black/gray
  if (["dwipaad"].includes(key))                       return "#eff6ff"; // blue
  if (["tripaad"].includes(key))                       return "#f0fdf4"; // green
  if (["sampurna"].includes(key))                      return "#fff1f2"; // red
  if (["mitra"].includes(key))                         return "#f0fdf4"; // green
  if (["sama"].includes(key))                          return "#fefce8"; // yellow
  if (["shatru"].includes(key))                        return "#fff1f2"; // red
  return "#ffffff";
}

function rowTextColor(key: RowKey): string {
  if (["swakshetra", "moolatrikona", "tripaad", "mitra"].includes(key)) return "#15803d";
  if (["uchcha", "ucchaDeg", "dwipaad"].includes(key))                  return "#1d4ed8";
  if (["neecha", "neechaDeg", "sampurna", "shatru"].includes(key))      return "#dc2626";
  if (["ekpaad"].includes(key))                                          return "#111827";
  if (["sama"].includes(key))                                            return "#a16207";
  return "#374151";
}

function getCell(planet: string, key: RowKey, lang: Lang): string {
  const d = DATA[planet];
  switch (key) {
    case "swakshetra":   return translateSignList(d.swakshetra, lang);
    case "uchcha":       return translateSign(d.uchcha, lang);
    case "ucchaDeg":     return `${d.ucchaDeg}°`;
    case "neecha":       return translateSign(d.neecha, lang);
    case "neechaDeg":    return `${d.neechaDeg}°`;
    case "moolatrikona": return translateSign(d.moolatrikona, lang);
    case "ekpaad":       return d.ekpaad;
    case "dwipaad":      return d.dwipaad;
    case "tripaad":      return d.tripaad;
    case "sampurna":     return d.sampurna;
    case "mitra":        return translateSignList(d.mitra, lang);
    case "sama":         return translateSignList(d.sama, lang);
    case "shatru":       return translateSignList(d.shatru, lang);
  }
}

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mars: "♂", Mercury: "☿",
  Jupiter: "♃", Venus: "♀", Saturn: "♄", Rahu: "☊", Ketu: "☋",
};

export default function GrahshilChakraTable({ lang = "en" }: Props) {
  const rows = GRAHSHIL_ROWS[lang];
  const headers = GRAHSHIL_PLANET_HEADERS[lang];
  const title = GRAHSHIL_TITLE[lang];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-indigo-900 border-b border-indigo-200 pb-2">
        {title}
      </h2>

      {/* Drishti color legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        {[
          { label: lang === "en" ? "Ekpaad ¼" : lang === "hi" ? "एकपाद ¼" : "એકપાદ ¼", color: "#111827" },
          { label: lang === "en" ? "Dwipaad ½" : lang === "hi" ? "द्विपाद ½" : "દ્વિપાદ ½", color: "#2563eb" },
          { label: lang === "en" ? "Tripaad ¾" : lang === "hi" ? "त्रिपाद ¾" : "ત્રિપાદ ¾", color: "#16a34a" },
          { label: lang === "en" ? "Sampurna (full)" : lang === "hi" ? "संपूर्ण (पूर्ण)" : "સંપૂર્ણ (પૂર્ણ)", color: "#dc2626" },
        ].map((l) => (
          <span key={l.label} className="flex items-center gap-1 font-semibold" style={{ color: l.color }}>
            <span style={{ display: "inline-block", width: 24, borderTop: `2.5px dashed ${l.color}` }} />
            {l.label}
          </span>
        ))}
      </div>

      {/* Main table — rows = attributes, cols = planets */}
      <div className="overflow-x-auto rounded-xl border border-gray-300 shadow-sm">
        <table className="text-xs border-collapse w-full">
          <thead>
            <tr className="bg-indigo-800 text-white">
              {/* Row label header */}
              <th className="px-3 py-2 text-left border border-indigo-700 font-semibold min-w-[160px] sticky left-0 bg-indigo-800 z-10">
                {lang === "en" ? "Attribute" : lang === "hi" ? "विशेषता" : "વિશેષતા"}
              </th>
              {PLANETS_EN.map((p, i) => (
                <th key={p} className="px-2 py-2 text-center border border-indigo-700 font-semibold min-w-[90px]">
                  <div>{PLANET_SYMBOLS[p]}</div>
                  <div>{headers[i]}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROW_KEYS.map((key) => {
              const bg = rowBg(key);
              const tc = rowTextColor(key);
              return (
                <tr key={key} style={{ backgroundColor: bg }}>
                  <td
                    className="px-3 py-2 border border-gray-200 font-semibold sticky left-0 z-10"
                    style={{ backgroundColor: bg, color: tc }}
                  >
                    {rows[key]}
                  </td>
                  {PLANETS_EN.map((p) => (
                    <td
                      key={p}
                      className="px-2 py-2 text-center border border-gray-200 font-medium"
                      style={{ color: tc }}
                    >
                      {getCell(p, key, lang)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 italic">
        {lang === "en"
          ? "Aspect house numbers are relative from the planet's own house. Mars upgrades 4th & 8th to Sampurna; Jupiter upgrades 5th & 9th; Saturn upgrades 3rd & 10th."
          : lang === "hi"
          ? "दृष्टि भाव संख्याएँ ग्रह की स्वयं की स्थिति से सापेक्ष हैं। मंगल 4था व 8वाँ संपूर्ण; गुरु 5वाँ व 9वाँ संपूर्ण; शनि 3वाँ व 10वाँ संपूर्ण।"
          : "દૃષ્ટિ ભાવ સંખ્યા ગ્રહની પોતાની સ્થિતિથી સાપેક્ષ છે. મંગળ 4 અને 8 સંપૂર્ણ; ગુરુ 5 અને 9 સંપૂર્ણ; શનિ 3 અને 10 સંપૂર્ણ."}
      </p>
    </div>
  );
}

