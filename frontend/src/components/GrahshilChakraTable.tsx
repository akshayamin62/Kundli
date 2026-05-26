"use client";

/**
 * Grahshil Chakra (ग्रहशील चक्र) — Reference Table
 * Shows planetary dignities, aspect strengths, and attributes.
 */

const PLANETS = [
  { name: "Surya",    en: "Sun",     symbol: "☉" },
  { name: "Chandra",  en: "Moon",    symbol: "☽" },
  { name: "Mangal",   en: "Mars",    symbol: "♂" },
  { name: "Budh",     en: "Mercury", symbol: "☿" },
  { name: "Guru",     en: "Jupiter", symbol: "♃" },
  { name: "Shukra",   en: "Venus",   symbol: "♀" },
  { name: "Shani",    en: "Saturn",  symbol: "♄" },
  { name: "Rahu",     en: "Rahu",    symbol: "☊" },
  { name: "Ketu",     en: "Ketu",    symbol: "☋" },
];

interface PlanetData {
  swakshetra:  string;
  uchcha:      string;
  ucchaDeg:    number;
  neecha:      string;
  neechaDeg:   number;
  moolatrikona:string;
  ekpaad:      string;   // Ekapaad (1/4) houses
  dwipaad:     string;   // Dwipaad (2/4) houses
  tripaad:     string;   // Tripaad (3/4) houses
  sampurna:    string;   // Sampurna (4/4) houses
  tattva:      string;
  disha:       string;
  linga:       string;
}

const DATA: Record<string, PlanetData> = {
  Sun: {
    swakshetra:   "Leo",
    uchcha:       "Aries",       ucchaDeg:  10,
    neecha:       "Libra",       neechaDeg: 10,
    moolatrikona: "Leo",
    ekpaad:       "3, 10",  dwipaad: "5, 9",  tripaad: "4, 8",  sampurna: "7",
    tattva: "Tej (Fire)",   disha: "East",   linga: "Male",
  },
  Moon: {
    swakshetra:   "Cancer",
    uchcha:       "Taurus",      ucchaDeg:  3,
    neecha:       "Scorpio",     neechaDeg: 3,
    moolatrikona: "Taurus",
    ekpaad:       "3, 10",  dwipaad: "5, 9",  tripaad: "4, 8",  sampurna: "7",
    tattva: "Jal (Water)",  disha: "NW",     linga: "Female",
  },
  Mars: {
    swakshetra:   "Aries, Scorpio",
    uchcha:       "Capricorn",   ucchaDeg:  28,
    neecha:       "Cancer",      neechaDeg: 28,
    moolatrikona: "Aries",
    ekpaad:       "3, 10",  dwipaad: "5, 9",  tripaad: "—",     sampurna: "4, 7, 8",
    tattva: "Tej (Fire)",   disha: "South",  linga: "Male",
  },
  Mercury: {
    swakshetra:   "Gemini, Virgo",
    uchcha:       "Virgo",       ucchaDeg:  15,
    neecha:       "Pisces",      neechaDeg: 15,
    moolatrikona: "Virgo",
    ekpaad:       "3, 10",  dwipaad: "5, 9",  tripaad: "4, 8",  sampurna: "7",
    tattva: "Prithvi (Earth)", disha: "North", linga: "Neutral",
  },
  Jupiter: {
    swakshetra:   "Sagittarius, Pisces",
    uchcha:       "Cancer",      ucchaDeg:  5,
    neecha:       "Capricorn",   neechaDeg: 5,
    moolatrikona: "Sagittarius",
    ekpaad:       "3, 10",  dwipaad: "—",     tripaad: "4, 8",  sampurna: "5, 7, 9",
    tattva: "Akash (Ether)", disha: "NE",    linga: "Male",
  },
  Venus: {
    swakshetra:   "Taurus, Libra",
    uchcha:       "Pisces",      ucchaDeg:  27,
    neecha:       "Virgo",       neechaDeg: 27,
    moolatrikona: "Libra",
    ekpaad:       "3, 10",  dwipaad: "5, 9",  tripaad: "4, 8",  sampurna: "7",
    tattva: "Jal (Water)",  disha: "SE",     linga: "Female",
  },
  Saturn: {
    swakshetra:   "Capricorn, Aquarius",
    uchcha:       "Libra",       ucchaDeg:  20,
    neecha:       "Aries",       neechaDeg: 20,
    moolatrikona: "Aquarius",
    ekpaad:       "—",      dwipaad: "5, 9",  tripaad: "4, 8",  sampurna: "3, 7, 10",
    tattva: "Vayu (Air)",   disha: "West",   linga: "Neutral",
  },
  Rahu: {
    swakshetra:   "Virgo",
    uchcha:       "Gemini",      ucchaDeg:  15,
    neecha:       "Sagittarius", neechaDeg: 15,
    moolatrikona: "Cancer",
    ekpaad:       "3, 10",  dwipaad: "5, 9",  tripaad: "4, 8",  sampurna: "7",
    tattva: "Jal (Water)",  disha: "SW",     linga: "Male",
  },
  Ketu: {
    swakshetra:   "Pisces",
    uchcha:       "Sagittarius", ucchaDeg:  15,
    neecha:       "Gemini",      neechaDeg: 15,
    moolatrikona: "Capricorn",
    ekpaad:       "3, 10",  dwipaad: "5, 9",  tripaad: "4, 8",  sampurna: "7",
    tattva: "Akash / Tej",  disha: "SW",     linga: "Male",
  },
};

const ASPECT_LEGEND = [
  { label: "Ekpaad (¼)",    color: "#000000", desc: "Houses 3, 10" },
  { label: "Dwipaad (½)",   color: "#2563eb", desc: "Houses 5, 9" },
  { label: "Tripaad (¾)",   color: "#16a34a", desc: "Houses 4, 8" },
  { label: "Sampurna (1)",  color: "#dc2626", desc: "House 7 (special for Mars 4,8 · Jup 5,9 · Sat 3,10)" },
];

const DIGNITY_LEGEND = [
  { label: "Swakshetra ++", color: "#15803d", desc: "Planet in own sign" },
  { label: "Uchcha +",      color: "#1d4ed8", desc: "Planet in exaltation sign" },
  { label: "Neecha ↓",      color: "#dc2626", desc: "Planet in debilitation sign" },
];

export default function GrahshilChakraTable() {
  return (
    <div className="mt-10 space-y-6">
      <h2 className="text-xl font-bold text-indigo-900 border-b border-indigo-200 pb-2">
        ग्रहशील चक्र — Grahshil Chakra (Planetary Reference)
      </h2>

      {/* Legend */}
      <div className="flex flex-wrap gap-6">
        <div>
          <div className="text-xs font-semibold uppercase text-gray-500 mb-2">Drishti (Aspect) Colors</div>
          <div className="flex flex-col gap-1">
            {ASPECT_LEGEND.map((l) => (
              <div key={l.label} className="flex items-center gap-2 text-sm">
                <span
                  className="inline-block w-10 h-1.5 rounded"
                  style={{ backgroundColor: l.color, borderTop: `3px dashed ${l.color}` }}
                />
                <span className="font-semibold" style={{ color: l.color }}>{l.label}</span>
                <span className="text-gray-500">— {l.desc}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase text-gray-500 mb-2">Dignity Colors</div>
          <div className="flex flex-col gap-1">
            {DIGNITY_LEGEND.map((l) => (
              <div key={l.label} className="flex items-center gap-2 text-sm">
                <span className="font-bold w-28" style={{ color: l.color }}>{l.label}</span>
                <span className="text-gray-500">— {l.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-indigo-50 text-indigo-800 text-xs uppercase tracking-wide">
              <th className="px-3 py-3 text-left border border-gray-200">Planet</th>
              <th className="px-3 py-3 text-left border border-gray-200">Swakshetra</th>
              <th className="px-3 py-3 text-left border border-gray-200">Uchcha (Deg)</th>
              <th className="px-3 py-3 text-left border border-gray-200">Neecha (Deg)</th>
              <th className="px-3 py-3 text-left border border-gray-200">Moolatrikona</th>
              <th className="px-3 py-3 text-center border border-gray-200" style={{ color: "#000000" }}>Ekpaad ¼</th>
              <th className="px-3 py-3 text-center border border-gray-200" style={{ color: "#2563eb" }}>Dwipaad ½</th>
              <th className="px-3 py-3 text-center border border-gray-200" style={{ color: "#16a34a" }}>Tripaad ¾</th>
              <th className="px-3 py-3 text-center border border-gray-200" style={{ color: "#dc2626" }}>Sampurna</th>
              <th className="px-3 py-3 text-left border border-gray-200">Tattva</th>
              <th className="px-3 py-3 text-left border border-gray-200">Disha</th>
              <th className="px-3 py-3 text-left border border-gray-200">Linga</th>
            </tr>
          </thead>
          <tbody>
            {PLANETS.map((planet, i) => {
              const d = DATA[planet.en];
              return (
                <tr
                  key={planet.en}
                  className={`border-t border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-indigo-50 transition-colors`}
                >
                  <td className="px-3 py-2.5 font-bold text-gray-800 whitespace-nowrap border border-gray-100">
                    <span className="mr-1">{planet.symbol}</span>{planet.name}
                    <span className="ml-1 text-xs text-gray-400">({planet.en})</span>
                  </td>
                  <td className="px-3 py-2.5 text-green-700 font-medium border border-gray-100">{d.swakshetra}</td>
                  <td className="px-3 py-2.5 text-blue-700 font-medium border border-gray-100">
                    {d.uchcha} <span className="text-xs text-gray-400">({d.ucchaDeg}°)</span>
                  </td>
                  <td className="px-3 py-2.5 text-red-600 font-medium border border-gray-100">
                    {d.neecha} <span className="text-xs text-gray-400">({d.neechaDeg}°)</span>
                  </td>
                  <td className="px-3 py-2.5 text-purple-700 font-medium border border-gray-100">{d.moolatrikona}</td>
                  <td className="px-3 py-2.5 text-center font-mono border border-gray-100" style={{ color: "#111827" }}>{d.ekpaad}</td>
                  <td className="px-3 py-2.5 text-center font-mono border border-gray-100" style={{ color: "#2563eb" }}>{d.dwipaad}</td>
                  <td className="px-3 py-2.5 text-center font-mono border border-gray-100" style={{ color: "#16a34a" }}>{d.tripaad}</td>
                  <td className="px-3 py-2.5 text-center font-mono font-bold border border-gray-100" style={{ color: "#dc2626" }}>{d.sampurna}</td>
                  <td className="px-3 py-2.5 text-gray-600 border border-gray-100">{d.tattva}</td>
                  <td className="px-3 py-2.5 text-gray-600 border border-gray-100">{d.disha}</td>
                  <td className="px-3 py-2.5 text-gray-600 border border-gray-100">{d.linga}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 italic">
        Aspect houses are relative from the planet's house position. Ekpaad=¼, Dwipaad=½, Tripaad=¾, Sampurna=full strength.
        Mars upgrades 4th &amp; 8th to Sampurna; Jupiter upgrades 5th &amp; 9th; Saturn upgrades 3rd &amp; 10th.
      </p>
    </div>
  );
}
