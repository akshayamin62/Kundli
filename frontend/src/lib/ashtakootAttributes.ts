import { type Lang } from "@/lib/translations";

/** Ashtakoot attribute lookups — aligned with `backend/app/services/matching.py`. */

const VARNA_BY_SIGN: Record<string, string> = {
  Aries: "Kshatriya", Taurus: "Vaishya", Gemini: "Shudra",
  Cancer: "Brahmin", Leo: "Kshatriya", Virgo: "Vaishya",
  Libra: "Shudra", Scorpio: "Brahmin", Sagittarius: "Kshatriya",
  Capricorn: "Vaishya", Aquarius: "Shudra", Pisces: "Brahmin",
};

const VASYA_BY_SIGN: Record<string, string> = {
  Aries: "Chatushpada", Taurus: "Chatushpada", Leo: "Vanachara",
  Sagittarius: "Manava", Capricorn: "Jalchar", Gemini: "Manava",
  Virgo: "Manava", Libra: "Manava", Aquarius: "Manava",
  Cancer: "Jalchar", Pisces: "Jalchar", Scorpio: "Keeta",
};

const YONI_BY_NAK = [
  "Horse", "Elephant", "Goat", "Serpent", "Serpent", "Dog", "Cat", "Goat", "Cat",
  "Rat", "Rat", "Cow", "Buffalo", "Tiger", "Buffalo", "Tiger", "Hare", "Hare",
  "Dog", "Monkey", "Mongoose", "Monkey", "Lion", "Horse", "Lion", "Cow", "Elephant",
] as const;

const GANA_BY_NAK: Record<string, string> = {
  Ashwini: "Deva", Mrigashira: "Deva", Punarvasu: "Deva",
  Pushya: "Deva", Hasta: "Deva", Swati: "Deva",
  Anuradha: "Deva", Shravana: "Deva", Revati: "Deva",
  Bharani: "Manav", Rohini: "Manav", Ardra: "Manav",
  "Purva Phalguni": "Manav", "Uttara Phalguni": "Manav",
  "Purva Ashadha": "Manav", "Uttara Ashadha": "Manav",
  "Purva Bhadrapada": "Manav", "Uttara Bhadrapada": "Manav",
  Krittika: "Rakshasa", Ashlesha: "Rakshasa", Magha: "Rakshasa",
  Chitra: "Rakshasa", Vishakha: "Rakshasa", Jyeshtha: "Rakshasa",
  Mula: "Rakshasa", Dhanishtha: "Rakshasa", Shatabhisha: "Rakshasa",
};

const NADI_BY_NAK = [
  "Adi", "Madhya", "Antya", "Antya", "Madhya", "Adi", "Adi", "Madhya", "Antya",
  "Antya", "Madhya", "Adi", "Adi", "Madhya", "Antya", "Antya", "Madhya", "Adi",
  "Adi", "Madhya", "Antya", "Antya", "Madhya", "Adi", "Adi", "Madhya", "Antya",
] as const;

export interface AshtakootAttributes {
  varna: string;
  vasya: string;
  yoni: string;
  gana: string;
  nadi: string;
}

export function getAshtakootAttributes(moonSign: string, nakshatraIndex: number, nakshatraName: string): AshtakootAttributes {
  const idx = ((nakshatraIndex % 27) + 27) % 27;
  return {
    varna: VARNA_BY_SIGN[moonSign] ?? "",
    vasya: VASYA_BY_SIGN[moonSign] ?? "",
    yoni: YONI_BY_NAK[idx] ?? "",
    gana: GANA_BY_NAK[nakshatraName] ?? "Manav",
    nadi: NADI_BY_NAK[idx] ?? "",
  };
}

const VARNA_I18N: Record<Lang, Record<string, string>> = {
  en: { Brahmin: "Brahmin", Kshatriya: "Kshatriya", Vaishya: "Vaishya", Shudra: "Shudra" },
  hi: { Brahmin: "ब्राह्मण", Kshatriya: "क्षत्रिय", Vaishya: "वैश्य", Shudra: "शूद्र" },
  gu: { Brahmin: "બ્રાહ્મણ", Kshatriya: "ક્ષત્રિય", Vaishya: "વૈશ્ય", Shudra: "શૂદ્ર" },
};

const VASYA_I18N: Record<Lang, Record<string, string>> = {
  en: { Chatushpada: "Chatushpada", Manava: "Manava", Jalchar: "Jalchar", Vanachara: "Vanachara", Keeta: "Keeta" },
  hi: { Chatushpada: "चतुष्पाद", Manava: "मानव", Jalchar: "जलचर", Vanachara: "वनचर", Keeta: "कीट" },
  gu: { Chatushpada: "ચતુષ્પાદ", Manava: "માનવ", Jalchar: "જલચર", Vanachara: "વનચર", Keeta: "કીટ" },
};

const GANA_I18N: Record<Lang, Record<string, string>> = {
  en: { Deva: "Deva", Manav: "Manav", Rakshasa: "Rakshasa" },
  hi: { Deva: "देव", Manav: "मानव", Rakshasa: "राक्षस" },
  gu: { Deva: "દેવ", Manav: "માનવ", Rakshasa: "રાક્ષસ" },
};

const NADI_I18N: Record<Lang, Record<string, string>> = {
  en: { Adi: "Adi", Madhya: "Madhya", Antya: "Antya" },
  hi: { Adi: "आदि", Madhya: "मध्य", Antya: "अंत्य" },
  gu: { Adi: "આદિ", Madhya: "મધ્ય", Antya: "અંત્ય" },
};

const YONI_I18N: Record<Lang, Record<string, string>> = {
  en: {
    Horse: "Horse", Elephant: "Elephant", Goat: "Goat", Serpent: "Serpent",
    Dog: "Dog", Cat: "Cat", Rat: "Rat", Cow: "Cow", Buffalo: "Buffalo",
    Tiger: "Tiger", Hare: "Hare", Monkey: "Monkey", Mongoose: "Mongoose", Lion: "Lion",
  },
  hi: {
    Horse: "अश्व", Elephant: "हाथी", Goat: "बकरी", Serpent: "सर्प",
    Dog: "कुत्ता", Cat: "बिल्ली", Rat: "चूहा", Cow: "गाय", Buffalo: "भैंस",
    Tiger: "बाघ", Hare: "खरगोश", Monkey: "बंदर", Mongoose: "नीलगिरी", Lion: "सिंह",
  },
  gu: {
    Horse: "ઘોડો", Elephant: "હાથી", Goat: "બકરી", Serpent: "સર્પ",
    Dog: "કૂતરો", Cat: "બિલાડી", Rat: "ઉંદર", Cow: "ગાય", Buffalo: "ભેંસ",
    Tiger: "વાઘ", Hare: "સસલું", Monkey: "વાંદરો", Mongoose: "નેઓલી", Lion: "સિંહ",
  },
};

export const ASHTAKOOT_LABELS: Record<Lang, Record<string, string>> = {
  en: { varna: "Varna", vasya: "Vasya", yoni: "Yoni", gana: "Gana", nadi: "Nadi" },
  hi: { varna: "वर्ण", vasya: "वश्य", yoni: "योनि", gana: "गण", nadi: "नाड़ी" },
  gu: { varna: "વર્ણ", vasya: "વશ્ય", yoni: "યોનિ", gana: "ગણ", nadi: "નાડી" },
};

export function translateVarna(value: string, lang: Lang): string {
  return VARNA_I18N[lang][value] ?? value;
}

export function translateVasya(value: string, lang: Lang): string {
  return VASYA_I18N[lang][value] ?? value;
}

export function translateGana(value: string, lang: Lang): string {
  return GANA_I18N[lang][value] ?? value;
}

export function translateNadi(value: string, lang: Lang): string {
  return NADI_I18N[lang][value] ?? value;
}

export function translateYoni(value: string, lang: Lang): string {
  return YONI_I18N[lang][value] ?? value;
}
