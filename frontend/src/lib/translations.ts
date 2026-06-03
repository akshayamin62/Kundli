/**
 * Multi-language translations: English (en), Hindi (hi), Gujarati (gu)
 */

export type Lang = "en" | "hi" | "gu";

// ── Sign Names (Rashi) ────────────────────────────────────────────────────────
export const SIGN_NAMES: Record<Lang, string[]> = {
  en: ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"],
  hi: ["मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"],
  gu: ["મેષ", "વૃષભ", "મિથુન", "કર્ક", "સિંહ", "કન્યા", "તુલા", "વૃશ્ચિક", "ધનુ", "મકર", "કુંભ", "મીન"],
};

// ── Planet Short Labels (for SVG chart) ───────────────────────────────────────
export const PLANET_SHORT: Record<Lang, Record<string, string>> = {
  en: { Sun: "Sun", Moon: "Moon", Mars: "Mars", Mercury: "Mer", Jupiter: "Jup", Venus: "Ven", Saturn: "Sat", "North Node": "Rah", "South Node": "Ket" },
  hi: { Sun: "सूर्य", Moon: "चंद्र", Mars: "मंगल", Mercury: "बुध", Jupiter: "गुरु", Venus: "शुक्र", Saturn: "शनि", "North Node": "राहु", "South Node": "केतु" },
  gu: { Sun: "સૂર્ય", Moon: "ચંદ્ર", Mars: "મંગળ", Mercury: "બુધ", Jupiter: "ગુરુ", Venus: "શુક્ર", Saturn: "શનિ", "North Node": "રાહુ", "South Node": "કેતુ" },
};

// ── Planet Display Names (for table) ──────────────────────────────────────────
export const PLANET_NAMES: Record<Lang, Record<string, string>> = {
  en: { Sun: "Sun", Moon: "Moon", Mars: "Mars", Mercury: "Mercury", Jupiter: "Jupiter", Venus: "Venus", Saturn: "Saturn", "North Node": "Rahu", "South Node": "Ketu", Rahu: "Rahu", Ketu: "Ketu", Ascendant: "Ascendant" },
  hi: { Sun: "सूर्य", Moon: "चंद्र", Mars: "मंगल", Mercury: "बुध", Jupiter: "गुरु", Venus: "शुक्र", Saturn: "शनि", "North Node": "राहु", "South Node": "केतु", Rahu: "राहु", Ketu: "केतु", Ascendant: "लग्न" },
  gu: { Sun: "સૂર્ય", Moon: "ચંદ્ર", Mars: "મંગળ", Mercury: "બુધ", Jupiter: "ગુરુ", Venus: "શુક્ર", Saturn: "શનિ", "North Node": "રાહુ", "South Node": "કેતુ", Rahu: "રાહુ", Ketu: "કેતુ", Ascendant: "લગ્ન" },
};

// ── Nakshatra Names (27) ───────────────────────────────────────────────────────
export const NAKSHATRA_NAMES: Record<Lang, string[]> = {
  en: ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishtha", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"],
  hi: ["अश्विनी", "भरणी", "कृत्तिका", "रोहिणी", "मृगशिरा", "आर्द्रा", "पुनर्वसु", "पुष्य", "अश्लेषा", "मघा", "पूर्व फाल्गुनी", "उत्तर फाल्गुनी", "हस्त", "चित्रा", "स्वाती", "विशाखा", "अनुराधा", "ज्येष्ठा", "मूल", "पूर्व आषाढ़", "उत्तर आषाढ़", "श्रवण", "धनिष्ठा", "शतभिषा", "पूर्व भाद्रपद", "उत्तर भाद्रपद", "रेवती"],
  gu: ["અશ્વિની", "ભરણી", "કૃત્તિકા", "રોહિણી", "મૃગશિરા", "આર્દ્રા", "પુનર્વસુ", "પુષ્ય", "અશ્લેષા", "મઘા", "પૂર્વ ફાલ્ગુની", "ઉત્તર ફાલ્ગુની", "હસ્ત", "ચિત્રા", "સ્વાતિ", "વિશાખા", "અનુરાધા", "જ્યેષ્ઠા", "મૂળ", "પૂર્વ આષાઢ", "ઉત્તર આષાઢ", "શ્રવણ", "ધનિષ્ઠા", "શતભિષા", "પૂર્વ ભાદ્રપદ", "ઉત્તર ભાદ્રપદ", "રેવતી"],
};

// ── Sign Lords ─────────────────────────────────────────────────────────────────
export const SIGN_LORDS: Record<Lang, Record<string, string>> = {
  en: { Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon", Leo: "Sun", Virgo: "Mercury", Libra: "Venus", Scorpio: "Mars", Sagittarius: "Jupiter", Capricorn: "Saturn", Aquarius: "Saturn", Pisces: "Jupiter" },
  hi: { Aries: "मंगल", Taurus: "शुक्र", Gemini: "बुध", Cancer: "चंद्र", Leo: "सूर्य", Virgo: "बुध", Libra: "शुक्र", Scorpio: "मंगल", Sagittarius: "गुरु", Capricorn: "शनि", Aquarius: "शनि", Pisces: "गुरु" },
  gu: { Aries: "મંગળ", Taurus: "શુક્ર", Gemini: "બુધ", Cancer: "ચંદ્ર", Leo: "સૂર્ય", Virgo: "બુધ", Libra: "શુક્ર", Scorpio: "મંગળ", Sagittarius: "ગુરુ", Capricorn: "શનિ", Aquarius: "શનિ", Pisces: "ગુરુ" },
};

// ── Nakshatra Lords ────────────────────────────────────────────────────────────
export const NAKSHATRA_LORDS: Record<Lang, Record<string, string>> = {
  en: { Ketu: "Ketu", Venus: "Venus", Sun: "Sun", Moon: "Moon", Mars: "Mars", Rahu: "Rahu", Jupiter: "Jupiter", Saturn: "Saturn", Mercury: "Mercury" },
  hi: { Ketu: "केतु", Venus: "शुक्र", Sun: "सूर्य", Moon: "चंद्र", Mars: "मंगल", Rahu: "राहु", Jupiter: "गुरु", Saturn: "शनि", Mercury: "बुध" },
  gu: { Ketu: "કેતુ", Venus: "શુક્ર", Sun: "સૂર્ય", Moon: "ચંદ્ર", Mars: "મંગળ", Rahu: "રાહુ", Jupiter: "ગુરુ", Saturn: "શનિ", Mercury: "બુધ" },
};

// ── Avastha ────────────────────────────────────────────────────────────────────
export const AVASTHA_NAMES: Record<Lang, string[]> = {
  en: ["Bala", "Kumara", "Yuva", "Vridha", "Mrit"],
  hi: ["बाल", "कुमार", "युवा", "वृद्ध", "मृत"],
  gu: ["બાળ", "કુમાર", "યુવા", "વૃદ્ધ", "મૃત"],
};

// ── UI Labels ──────────────────────────────────────────────────────────────────
export const UI: Record<Lang, Record<string, string>> = {
  en: {
    lagna: "Lagna",
    lag: "Lag",
    retro: "R",
    yes: "Yes",
    no: "—",
    sign: "Sign",
    signLord: "Sign Lord",
    nakshatra: "Nakshatra",
    nakLord: "Nak. Lord",
    pada: "Pada",
    position: "Position",
    retroCol: "Retro",
    avastha: "Avastha",
    house: "House",
    planet: "Planet",
    ascendant: "Ascendant",
    asc: "ASC (Rising)",
    mc: "MC (Midheaven)",
    dsc: "DSC",
    ic: "IC",
    language: "Language",
  },
  hi: {
    lagna: "लग्न",
    lag: "ल",
    retro: "व",
    yes: "हाँ",
    no: "—",
    sign: "राशि",
    signLord: "राशिपति",
    nakshatra: "नक्षत्र",
    nakLord: "नक्षत्रपति",
    pada: "पद",
    position: "स्थिति",
    retroCol: "वक्री",
    avastha: "अवस्था",
    house: "भाव",
    planet: "ग्रह",
    ascendant: "लग्न",
    asc: "लग्न (उदय)",
    mc: "मध्य आकाश",
    dsc: "अस्त",
    ic: "नादिर",
    language: "भाषा",
  },
  gu: {
    lagna: "લગ્ન",
    lag: "લ",
    retro: "વ",
    yes: "હા",
    no: "—",
    sign: "રાશિ",
    signLord: "રાશિપતિ",
    nakshatra: "નક્ષત્ર",
    nakLord: "નક્ષત્રપતિ",
    pada: "પદ",
    position: "સ્થિતિ",
    retroCol: "વક્રી",
    avastha: "અવસ્થા",
    house: "ભાવ",
    planet: "ગ્રહ",
    ascendant: "લગ્ન",
    asc: "લગ્ન (ઉદય)",
    mc: "મધ્ય આકાશ",
    dsc: "અસ્ત",
    ic: "નાદિર",
    language: "ભાષા",
  },
};

// ── Grahshil Chakra row labels ──────────────────────────────────────────────────
export const GRAHSHIL_ROWS: Record<Lang, Record<string, string>> = {
  en: {
    swakshetra:   "Swakshetra (Own Sign)",
    uchcha:       "Uchcha Kshetra (Exaltation)",
    ucchaDeg:     "Uchcha Bhag (Exact Degree)",
    neecha:       "Neecha Kshetra (Debilitation)",
    neechaDeg:    "Neecha Bhag (Exact Degree)",
    moolatrikona: "Moolatrikona",
    ekpaad:       "Ekpaad Drishti",
    dwipaad:      "Dwipaad Drishti",
    tripaad:      "Tripaad Drishti",
    sampurna:     "Sampurna Drishti",
    mitra:        "Mitra Graha (Friends)",
    sama:         "Sama Graha (Neutrals)",
    shatru:       "Shatru Graha (Enemies)",
    tatva:        "Tatva (Element)",
    disha:        "Dishabal (Direction)",
    sthanbal:     "Sthanbal (Digbala)",
    kaal:         "Kaalbal (Time of Day)",
    vatadi:       "Vatadi Dosha (Humor)",
    ling:         "Ling (Gender)",
  },
  hi: {
    swakshetra:   "स्वक्षेत्र (स्वराशि)",
    uchcha:       "उच्च क्षेत्र",
    ucchaDeg:     "उच्च भाग (अंश)",
    neecha:       "नीच क्षेत्र",
    neechaDeg:    "नीच भाग (अंश)",
    moolatrikona: "मूलत्रिकोण",
    ekpaad:       "एकपाद दृष्टि (¼)",
    dwipaad:      "द्विपाद दृष्टि (½)",
    tripaad:      "त्रिपाद दृष्टि (¾)",
    sampurna:     "संपूर्ण दृष्टि (पूर्ण)",
    mitra:        "मित्र ग्रह",
    sama:         "सम ग्रह",
    shatru:       "शत्रु ग्रह",
    tatva:        "तत्व",
    disha:        "दिशाबल",
    sthanbal:     "स्थानबल (दिग्बल)",
    kaal:         "कालबल (समय)",
    vatadi:       "वातादि दोष",
    ling:         "लिंग",
  },
  gu: {
    swakshetra:   "સ્વક્ષેત્ર (સ્વરાશિ)",
    uchcha:       "ઉચ્ચ ક્ષેત્ર",
    ucchaDeg:     "ઉચ્ચ ભાગ (અંશ)",
    neecha:       "નીચ ક્ષેત્ર",
    neechaDeg:    "નીચ ભાગ (અંશ)",
    moolatrikona: "મૂળત્રિકોણ",
    ekpaad:       "એકપાદ દૃષ્ટિ (¼)",
    dwipaad:      "દ્વિપાદ દૃષ્ટિ (½)",
    tripaad:      "ત્રિપાદ દૃષ્ટિ (¾)",
    sampurna:     "સંપૂર્ણ દૃષ્ટિ (પૂર્ણ)",
    mitra:        "મિત્ર ગ્રહ",
    sama:         "સમ ગ્રહ",
    shatru:       "શત્રુ ગ્રહ",
    tatva:        "તત્વ",
    disha:        "દિશાબળ",
    sthanbal:     "સ્થાનબળ (દિગ્બળ)",
    kaal:         "કાળબળ (સમય)",
    vatadi:       "વાતાદિ દોષ",
    ling:         "લિંગ",
  },
};

// ── Grahshil Chakra — planet column headers ───────────────────────────────────
export const GRAHSHIL_PLANET_HEADERS: Record<Lang, string[]> = {
  en: ["Surya (Sun)", "Chandra (Moon)", "Mangal (Mars)", "Budh (Mercury)", "Guru (Jupiter)", "Shukra (Venus)", "Shani (Saturn)", "Rahu", "Ketu"],
  hi: ["सूर्य", "चंद्र", "मंगल", "बुध", "गुरु", "शुक्र", "शनि", "राहु", "केतु"],
  gu: ["સૂર્ય", "ચંદ્ર", "મંગળ", "બુધ", "ગુરુ", "શુક્ર", "શનિ", "રાહુ", "કેતુ"],
};

// ── Grahshil Chakra title ──────────────────────────────────────────────────────
export const GRAHSHIL_TITLE: Record<Lang, string> = {
  en: "Grahasheel Chakra (ग्रहशील चक्र) — Planetary Reference",
  hi: "ग्रहशील चक्र — ग्रह संदर्भ तालिका",
  gu: "ગ્રહશીલ ચક્ર — ગ્રહ સંદર્ભ કોષ્ટક",
};

// ── Sign name lookup (en name → target lang) ──────────────────────────────────
export function translateSign(signEn: string, lang: Lang): string {
  const idx = SIGN_NAMES.en.indexOf(signEn);
  return idx >= 0 ? SIGN_NAMES[lang][idx] : signEn;
}

// ── Sign list for multi-sign data ─────────────────────────────────────────────
export function translateSignList(signsEn: string, lang: Lang): string {
  if (lang === "en") return signsEn;
  return signsEn.split(", ").map((s) => translateSign(s.trim(), lang)).join(", ");
}

// ── Planet list translation (for mitra/sama/shatru in Grahshil Chakra) ────────
export function translatePlanetList(planetsEn: string, lang: Lang): string {
  if (lang === "en") return planetsEn;
  const map = PLANET_NAMES[lang];
  return planetsEn.split(", ").map((p) => map[p.trim()] ?? p.trim()).join(", ");
}
