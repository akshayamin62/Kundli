export interface VargaMeta {
  name: string;
  area: string;
}

export const VARGA_INFO: Record<number, VargaMeta> = {
  1: { name: "Rashi / Lagna Chart", area: "Overall life, personality" },
  2: { name: "Hora", area: "Wealth, finances" },
  3: { name: "Drekkana", area: "Siblings, courage" },
  4: { name: "Chaturthamsa", area: "Property, home, fortune" },
  5: { name: "Panchamsa", area: "Fame, authority, power" },
  6: { name: "Shashthamsa", area: "Diseases, enemies" },
  7: { name: "Saptamsa", area: "Children, progeny" },
  8: { name: "Ashtamsa", area: "Longevity, obstacles" },
  9: { name: "Navamsa", area: "Marriage, dharma, spouse" },
  10: { name: "Dashamsa", area: "Career, profession" },
  11: { name: "Rudramsa / Ekadashamsa", area: "Gains, achievements" },
  12: { name: "Dwadashamsa", area: "Parents, ancestry" },
  13: { name: "Trayodashamsa", area: "Rarely used" },
  14: { name: "Chaturdashamsa", area: "Rarely used" },
  15: { name: "Panchadashamsa", area: "Spiritual inclinations" },
  16: { name: "Shodashamsa", area: "Vehicles, comforts, luxuries" },
  17: { name: "Saptadashamsa", area: "Strength, authority" },
  18: { name: "Ashtadashamsa", area: "Conflicts, struggles" },
  19: { name: "Ekonavimshamsa", area: "Spiritual development" },
  20: { name: "Vimshamsa", area: "Spirituality, worship" },
  21: { name: "Ekavimshamsa", area: "Status, recognition" },
  22: { name: "Chaturvimshamsa", area: "Learning capacity" },
  23: { name: "Trayovimshamsa", area: "Intelligence" },
  24: { name: "Siddhamsa / Chaturvimshamsa", area: "Education, academics" },
  25: { name: "Panchavimshamsa", area: "Fame, creativity" },
  26: { name: "Shadvimshamsa", area: "Weaknesses, defects" },
  27: { name: "Nakshatramsa / Bhamsa", area: "Physical & mental strength" },
  28: { name: "Ashtavimshamsa", area: "Hidden strengths" },
  29: { name: "Navavimshamsa", area: "Karmic tendencies" },
  30: { name: "Trimshamsa", area: "Misfortunes, hidden karma" },
  31: { name: "Ekatrimshamsa", area: "Hidden weaknesses, subconscious karmic patterns" },
  32: { name: "Dvatrimshamsa", area: "Material stability, hidden fortune fluctuations" },
  33: { name: "Trayatrimshamsa", area: "Spiritual protection, unseen divine support" },
  34: { name: "Chaturtrimshamsa", area: "Obstacles in career growth and social rise" },
  35: { name: "Panchatrimshamsa", area: "Mental endurance, resistance against adversity" },
  36: { name: "Shashtitrimshamsa", area: "Collective karma, social influence patterns" },
  37: { name: "Saptatrimshamsa", area: "Family lineage effects and inherited tendencies" },
  38: { name: "Ashtatrimshamsa", area: "Sudden transformations and instability" },
  39: { name: "Navatrimshamsa", area: "Fortune evolution through spiritual maturity" },
  40: { name: "Khavedamsa", area: "Maternal lineage karma, ancestral blessings" },
  41: { name: "Ekachatvarimshamsa", area: "Hidden talents emerging later in life" },
  42: { name: "Dvichatvarimshamsa", area: "Emotional purification and inner healing" },
  43: { name: "Trichatvarimshamsa", area: "Dharma under pressure, ethical testing" },
  44: { name: "Chatushchatvarimshamsa", area: "Stability of accumulated karma and legacy" },
  45: { name: "Akshavedamsa", area: "Paternal lineage karma, ancestral blessings" },
  46: { name: "Shatchatvarimshamsa", area: "Stability of personal authority and influence" },
  47: { name: "Saptachatvarimshamsa", area: "Intellectual refinement and advanced thinking" },
  48: { name: "Ashtachatvarimshamsa", area: "Deep subconscious tendencies and hidden fears" },
  49: { name: "Navachatvarimshamsa", area: "Destiny refinement through repeated experiences" },
  50: { name: "Panchashamsa", area: "Spiritual merit accumulated from past karmas" },
  51: { name: "Ekapanchashamsa", area: "Internal moral conflicts and ethical evolution" },
  52: { name: "Dvipanchashamsa", area: "Higher intuitive intelligence" },
  53: { name: "Tripanchashamsa", area: "Hidden psychological patterns" },
  54: { name: "Chatushpanchashamsa", area: "Persistence, determination, karmic effort" },
  55: { name: "Panchapanchashamsa", area: "Recognition, honor, reputation at subtle level" },
  56: { name: "Shatpanchashamsa", area: "Long-term karmic consequences of actions" },
  57: { name: "Saptapanchashamsa", area: "Spiritual resilience and inner awakening" },
  58: { name: "Ashtapanchashamsa", area: "Dissolution of ego and karmic purification" },
  59: { name: "Navapanchashamsa", area: "Pre-final karmic refinement before D60" },
  60: { name: "Shashtiamsa", area: "Past life karma, root karma" },
};

export function vargaTitle(n: number): string {
  const v = VARGA_INFO[n];
  if (!v) return `D${n}`;
  return v.area === "Rarely used" ? `D${n} – ${v.name}` : `D${n} – ${v.name}`;
}

export function vargaChartLabel(n: number): string {
  return vargaTitle(n);
}
