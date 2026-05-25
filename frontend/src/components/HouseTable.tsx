"use client";

import { ChartResponse } from "@/types/chart";

interface Props {
  chart: ChartResponse;
}

const SIGN_ELEMENTS: Record<string, string> = {
  Aries: "🔥", Taurus: "🌍", Gemini: "💨", Cancer: "💧",
  Leo: "🔥", Virgo: "🌍", Libra: "💨", Scorpio: "💧",
  Sagittarius: "🔥", Capricorn: "🌍", Aquarius: "💨", Pisces: "💧",
};


export default function HouseTable({ chart }: Props) {
  // Build planet-per-house map
  const planetsByHouse: Record<number, ChartResponse["planets"]> = {};
  for (let i = 1; i <= 12; i++) planetsByHouse[i] = [];
  for (const p of chart.planets) {
    planetsByHouse[p.house]?.push(p);
  }

  return (
    <div className="space-y-4">
      {/* Angles summary */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "ASC (Rising)", value: chart.angles.ascendant.formatted },
          { label: "MC (Midheaven)", value: chart.angles.midheaven.formatted },
          { label: "DSC", value: chart.angles.descendant.formatted },
          { label: "IC", value: chart.angles.imum_coeli.formatted },
        ].map(({ label, value }) => (
          <div key={label} className="bg-cosmos-800 border border-purple-800 rounded-xl p-3">
            <div className="text-xs text-purple-400">{label}</div>
            <div className="text-sm text-purple-100 font-semibold mt-1">{value}</div>
          </div>
        ))}
      </div>

      {/* House cusps table */}
      <div className="overflow-x-auto rounded-xl border border-purple-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cosmos-700 text-purple-300">
              <th className="px-3 py-2 text-left">House</th>
              <th className="px-3 py-2 text-left">Cusp</th>
              <th className="px-3 py-2 text-left">Planets</th>
            </tr>
          </thead>
          <tbody>
            {chart.houses.map((house) => (
              <tr
                key={house.number}
                className="border-t border-purple-900/50 hover:bg-purple-900/20 transition-colors"
              >
                <td className="px-3 py-2">
                  <span className="text-purple-400 font-bold">{house.number}</span>
                  <span className="text-purple-600 text-xs ml-2">{house.name.split(" ")[0]}</span>
                </td>
                <td className="px-3 py-2 text-purple-200">
                  <span className="mr-1">{SIGN_ELEMENTS[house.sign] || ""}</span>
                  {house.formatted}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {planetsByHouse[house.number]?.map((p) => (
                      <span
                        key={p.name}
                        title={`${p.name} ${p.formatted}${p.retrograde ? " ℞" : ""}`}
                        className="text-base"
                      >
                        {p.symbol}
                        {p.retrograde && <sup className="text-red-400 text-xs">℞</sup>}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Planet details */}
      <div className="overflow-x-auto rounded-xl border border-purple-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cosmos-700 text-purple-300">
              <th className="px-3 py-2 text-left">Planet</th>
              <th className="px-3 py-2 text-left">Position</th>
              <th className="px-3 py-2 text-center">Degree (°)</th>
              <th className="px-3 py-2 text-center">House</th>
              <th className="px-3 py-2 text-center">R</th>
            </tr>
          </thead>
          <tbody>
            {chart.planets.map((p) => (
              <tr key={p.name} className="border-t border-purple-900/50 hover:bg-purple-900/20 transition-colors">
                <td className="px-3 py-2 text-purple-200">
                  <span className="mr-2 text-base">{p.symbol}</span>
                  {p.name}
                </td>
                <td className="px-3 py-2 text-purple-100">{p.formatted}</td>
                <td className="px-3 py-2 text-center text-purple-300">{p.longitude.toFixed(2)}</td>
                <td className="px-3 py-2 text-center text-purple-400">{p.house}</td>
                <td className="px-3 py-2 text-center">
                  {p.retrograde ? (
                    <span className="text-red-400 text-xs font-bold">℞</span>
                  ) : (
                    <span className="text-green-600 text-xs">D</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Meta info */}
      <div className="bg-cosmos-800 border border-purple-900 rounded-xl p-4 text-xs text-purple-500 space-y-1">
        <div>📍 {chart.meta.birth_place}</div>
        <div>🌐 Lat: {chart.meta.latitude}° | Lon: {chart.meta.longitude}°</div>
        <div>🕐 Timezone: {chart.meta.timezone} ({chart.meta.utc_offset})</div>
        <div>⏱ UTC: {chart.meta.utc_datetime}</div>
        <div>📅 Julian Day: {chart.meta.julian_day}</div>
        <div>🏠 System: {chart.meta.house_system} | Zodiac: {chart.meta.zodiac}</div>
      </div>
    </div>
  );
}
