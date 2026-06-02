"use client";

import { type Lang, GRAHSHIL_ROWS, GRAHSHIL_PLANET_HEADERS, GRAHSHIL_TITLE, translateSign, translateSignList, translatePlanetList } from "@/lib/translations";

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

// Tatva (Element) per planet
const TATVA_EN: Record<string, string> = {
  Sun: "Agni (Fire)", Moon: "Jal (Water)", Mars: "Agni (Fire)", Mercury: "Prithvi (Earth)",
  Jupiter: "Akash (Ether)", Venus: "Jal (Water)", Saturn: "Vayu (Air)",
  Rahu: "Jal, Vayu", Ketu: "Akash, Agni",
};
const TATVA: Record<Lang, Record<string, string>> = {
  en: TATVA_EN,
  hi: { Sun: "तेज", Moon: "जल", Mars: "तेज", Mercury: "पृथ्वी", Jupiter: "आकाश", Venus: "जल", Saturn: "वायु", Rahu: "जल, वायु", Ketu: "आकाश, तेज" },
  gu: { Sun: "અગ્નિ", Moon: "જળ", Mars: "અગ્નિ", Mercury: "પૃથ્વી", Jupiter: "આકાશ", Venus: "જળ", Saturn: "વાયુ", Rahu: "જળ, વાયુ", Ketu: "આકાશ, અગ્નિ" },
};

// Disha (Direction)
const DISHA: Record<Lang, Record<string, string>> = {
  en: { Sun: "East", Moon: "NW", Mars: "South", Mercury: "North", Jupiter: "NE", Venus: "SE", Saturn: "West", Rahu: "SW", Ketu: "SW" },
  hi: { Sun: "पूर्व", Moon: "वायव्य", Mars: "दक्षिण", Mercury: "उत्तर", Jupiter: "ईशान", Venus: "आग्नेय", Saturn: "पश्चिम", Rahu: "नैरृत्य", Ketu: "नैरृत्य" },
  gu: { Sun: "પૂર્વ", Moon: "વાયવ્ય", Mars: "દક્ષિણ", Mercury: "ઉત્તર", Jupiter: "ઇશાન", Venus: "આગ્નેય", Saturn: "પશ્ચિમ", Rahu: "નૈરૃત્ય", Ketu: "નૈરૃત્ય" },
};

// Sthanbal (Digbala — house of directional strength)
const STHANBAL: Record<Lang, Record<string, string>> = {
  en: { Sun: "10th", Moon: "4th", Mars: "10th", Mercury: "1st (Lagna)", Jupiter: "1st (Lagna)", Venus: "4th", Saturn: "7th", Rahu: "—", Ketu: "—" },
  hi: { Sun: "दशम", Moon: "चतुर्थ", Mars: "दशम", Mercury: "प्रथम", Jupiter: "प्रथम", Venus: "चतुर्थ", Saturn: "सप्तम", Rahu: "—", Ketu: "—" },
  gu: { Sun: "દશમ", Moon: "ચતુર્થ", Mars: "દશમ", Mercury: "પ્રથમ", Jupiter: "પ્રથમ", Venus: "ચતુર્થ", Saturn: "સપ્તમ", Rahu: "—", Ketu: "—" },
};

// Kaal (Time of day when the planet is strongest)
const KAAL: Record<Lang, Record<string, string>> = {
  en: {
    Sun: "Madhyanha (Noon)", Moon: "Aparahna (Afternoon)", Mars: "Madhyanha (Noon)",
    Mercury: "Pratas (Morning)", Jupiter: "Pratas (Morning)", Venus: "Aparahna (Afternoon)",
    Saturn: "Sayankal (Evening)", Rahu: "Sayankal (Evening)", Ketu: "Sayankal (Evening)",
  },
  hi: {
    Sun: "मध्यान्ह", Moon: "अपराह्ण", Mars: "मध्यान्ह",
    Mercury: "प्रातः", Jupiter: "प्रातः", Venus: "अपराह्ण",
    Saturn: "सायं", Rahu: "सायं", Ketu: "सायं",
  },
  gu: {
    Sun: "મધ્યાહ્ન", Moon: "અપરાહ્ન", Mars: "મધ્યાહ્ન",
    Mercury: "પ્રાતઃ", Jupiter: "પ્રાતઃ", Venus: "અપરાહ્ન",
    Saturn: "સાયં", Rahu: "સાયં", Ketu: "સાયં",
  },
};

// Vatadi (Dosha / Humor) — multiple doshas possible
const VATADI: Record<Lang, Record<string, string>> = {
  en: {
    Sun: "Pitta", Moon: "Vata, Kapha", Mars: "Pitta, Kapha", Mercury: "Tridosha",
    Jupiter: "Kapha, Vata", Venus: "Vata, Kapha", Saturn: "Vata", Rahu: "—", Ketu: "—",
  },
  hi: {
    Sun: "पित्त", Moon: "वात, कफ", Mars: "पित्त, कफ", Mercury: "त्रिदोष",
    Jupiter: "कफ, वात", Venus: "वात, कफ", Saturn: "वात", Rahu: "—", Ketu: "—",
  },
  gu: {
    Sun: "પિત્ત", Moon: "વાત, કફ", Mars: "પિત્ત, કફ", Mercury: "ત્રિદોષ",
    Jupiter: "કફ, વાત", Venus: "વાત, કફ", Saturn: "વાત", Rahu: "—", Ketu: "—",
  },
};

// Ling (Gender)
const LING: Record<Lang, Record<string, string>> = {
  en: { Sun: "Male", Moon: "Female", Mars: "Male", Mercury: "Neutral", Jupiter: "Male", Venus: "Female", Saturn: "Neutral", Rahu: "Male", Ketu: "Male" },
  hi: { Sun: "पुरुष", Moon: "स्त्री", Mars: "पुरुष", Mercury: "नपुंसक", Jupiter: "पुरुष", Venus: "स्त्री", Saturn: "नपुंसक", Rahu: "पुरुष", Ketu: "पुरुष" },
  gu: { Sun: "પુરુષ", Moon: "સ્ત્રી", Mars: "પુરુષ", Mercury: "નપુંસક", Jupiter: "પુરુષ", Venus: "સ્ત્રી", Saturn: "નપુંસક", Rahu: "પુરુષ", Ketu: "પુરુષ" },
};

const DATA: Record<string, PlanetStaticData> = {
  Sun: {
    swakshetra: "Leo",                   uchcha: "Aries",       ucchaDeg: 10,
    neecha: "Libra",                     neechaDeg: 10,
    moolatrikona: "Leo",
    ekpaad: "3, 10",    dwipaad: "5, 9",  tripaad: "4, 8",   sampurna: "7",
    mitra: "Moon, Mars, Jupiter",
    sama:  "Mercury",
    shatru: "Venus, Saturn, Rahu",
  },
  Moon: {
    swakshetra: "Cancer",                uchcha: "Taurus",      ucchaDeg: 3,
    neecha: "Scorpio",                   neechaDeg: 3,
    moolatrikona: "Taurus",
    ekpaad: "3, 10",    dwipaad: "5, 9",  tripaad: "4, 8",   sampurna: "7",
    mitra: "Sun, Mercury",
    sama:  "Mars, Jupiter, Venus, Saturn",
    shatru: "Rahu",
  },
  Mars: {
    swakshetra: "Aries, Scorpio",        uchcha: "Capricorn",   ucchaDeg: 28,
    neecha: "Cancer",                    neechaDeg: 28,
    moolatrikona: "Aries",
    ekpaad: "3, 10",    dwipaad: "5, 9",  tripaad: "—",      sampurna: "4, 7, 8",
    mitra: "Sun, Moon, Jupiter",
    sama:  "Venus, Saturn",
    shatru: "Mercury, Rahu",
  },
  Mercury: {
    swakshetra: "Gemini, Virgo",         uchcha: "Virgo",       ucchaDeg: 15,
    neecha: "Pisces",                    neechaDeg: 15,
    moolatrikona: "Virgo",
    ekpaad: "3, 10",    dwipaad: "5, 9",  tripaad: "4, 8",   sampurna: "7",
    mitra: "Sun, Venus, Rahu",
    sama:  "Mars, Jupiter, Saturn",
    shatru: "Moon",
  },
  Jupiter: {
    swakshetra: "Sagittarius, Pisces",   uchcha: "Cancer",      ucchaDeg: 5,
    neecha: "Capricorn",                 neechaDeg: 5,
    moolatrikona: "Sagittarius",
    ekpaad: "3, 10",    dwipaad: "—",     tripaad: "4, 8",   sampurna: "5, 7, 9",
    mitra: "Sun, Moon, Mars",
    sama:  "Saturn, Rahu",
    shatru: "Mercury, Venus",
  },
  Venus: {
    swakshetra: "Taurus, Libra",         uchcha: "Pisces",      ucchaDeg: 27,
    neecha: "Virgo",                     neechaDeg: 27,
    moolatrikona: "Libra",
    ekpaad: "3, 10",    dwipaad: "5, 9",  tripaad: "4, 8",   sampurna: "7",
    mitra: "Mercury, Saturn, Rahu",
    sama:  "Mars, Jupiter",
    shatru: "Sun, Moon",
  },
  Saturn: {
    swakshetra: "Capricorn, Aquarius",   uchcha: "Libra",       ucchaDeg: 20,
    neecha: "Aries",                     neechaDeg: 20,
    moolatrikona: "Aquarius",
    ekpaad: "—",        dwipaad: "5, 9",  tripaad: "4, 8",   sampurna: "3, 7, 10",
    mitra: "Mercury, Venus, Rahu",
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
    shatru: "Sun, Moon, Mars",
  },
};

// Row key → field accessor
type RowKey = "swakshetra" | "uchcha" | "ucchaDeg" | "neecha" | "neechaDeg" | "moolatrikona"
            | "ekpaad" | "dwipaad" | "tripaad" | "sampurna"
            | "tatva" | "disha" | "sthanbal" | "kaal" | "vatadi" | "ling"
            | "mitra" | "sama" | "shatru";

const ROW_KEYS: RowKey[] = [
  "swakshetra", "uchcha", "ucchaDeg", "neecha", "neechaDeg", "moolatrikona",
  "ekpaad", "dwipaad", "tripaad", "sampurna",
  "tatva", "disha", "sthanbal", "kaal", "vatadi", "ling",
  "mitra", "sama", "shatru",
];

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
    case "mitra":        return translatePlanetList(d.mitra, lang);
    case "sama":         return translatePlanetList(d.sama, lang);
    case "shatru":       return translatePlanetList(d.shatru, lang);
    case "tatva":        return TATVA[lang][planet] ?? "";
    case "disha":        return DISHA[lang][planet] ?? "";
    case "sthanbal":     return STHANBAL[lang][planet] ?? "";
    case "kaal":         return KAAL[lang][planet] ?? "";
    case "vatadi":       return VATADI[lang][planet] ?? "";
    case "ling":         return LING[lang][planet] ?? "";
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
      <h2 className="text-2xl font-bold text-black border-b border-gray-200 pb-2">
        {title}
      </h2>

      {/* Main table — rows = attributes, cols = planets */}
      <div className="overflow-x-auto rounded-xl border border-gray-300 shadow-sm">
        <table className="text-sm border-collapse w-full">
          <thead>
            <tr className="bg-gray-100 text-black">
              {/* Row label header */}
              <th className="px-3 py-2 text-left border border-gray-300 font-semibold min-w-[170px] sticky left-0 bg-gray-100 z-10">
                {lang === "en" ? "Attribute" : lang === "hi" ? "विशेषता" : "વિશેષતા"}
              </th>
              {PLANETS_EN.map((p, i) => (
                <th key={p} className="px-2 py-2 text-center border border-gray-300 font-semibold min-w-[95px]">
                  <div>{PLANET_SYMBOLS[p]}</div>
                  <div>{headers[i]}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROW_KEYS.map((key, idx) => {
              const bg = idx % 2 === 0 ? "#ffffff" : "#f3f4f6";
              return (
                <tr key={key} style={{ backgroundColor: bg }}>
                  <td
                    className="px-3 py-2 border border-gray-200 font-semibold sticky left-0 z-10"
                    style={{ backgroundColor: bg, color: "#111111" }}
                  >
                    {rows[key]}
                  </td>
                  {PLANETS_EN.map((p) => (
                    <td
                      key={p}
                      className="px-2 py-2 text-center border border-gray-200 font-medium"
                      style={{ color: "#111111" }}
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

