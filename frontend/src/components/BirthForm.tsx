"use client";

import { useState } from "react";
import { calculateChart } from "@/services/api";
import { ChartRequest, ChartResponse } from "@/types/chart";

interface Props {
  onResult: (chart: ChartResponse) => void;
}

export default function BirthForm({ onResult }: Props) {
  const [form, setForm] = useState<ChartRequest>({
    birth_date: "",
    birth_time: "",
    birth_place: "",
    house_system: "whole_sign",
    zodiac: "sidereal",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await calculateChart(form);
      onResult(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Calculation failed");
    } finally {
      setLoading(false);
    }
  };

  const field = (label: string, children: React.ReactNode) => (
    <div className="flex flex-col gap-1 min-w-0">
      <label className="text-sm text-purple-300 font-medium">{label}</label>
      {children}
    </div>
  );

  const inputCls =
    "bg-cosmos-800 border border-purple-700 rounded-lg px-3 py-2 text-white placeholder-purple-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-cosmos-800 border border-purple-800 rounded-2xl p-5 shadow-xl shadow-purple-900/30 space-y-4"
    >
      <h2 className="text-lg font-bold text-purple-200 tracking-wide">
        ✦ Enter Birth Details ✦
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-[180px_180px_minmax(220px,1fr)_220px] gap-3 items-end">
        {field(
          "Birth Date",
          <input
            type="date"
            required
            value={form.birth_date}
            onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
            className={inputCls}
          />,
        )}

        {field(
          "Birth Time (24h)",
          <input
            type="time"
            required
            value={form.birth_time}
            onChange={(e) => setForm({ ...form, birth_time: e.target.value })}
            className={inputCls}
          />,
        )}

        {field(
          "Birth Place",
          <input
            type="text"
            required
            placeholder="e.g. Vadodara, India"
            value={form.birth_place}
            onChange={(e) => setForm({ ...form, birth_place: e.target.value })}
            className={inputCls}
          />,
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-700 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl transition-colors tracking-wide text-sm"
        >
          {loading ? "Calculating..." : "Generate Chart"}
        </button>
      </div>

      <div className="bg-cosmos-900/60 border border-purple-900 rounded-lg px-3 py-2 text-xs text-purple-300">
        North Indian mode: <span className="font-semibold text-purple-200">Whole Sign</span> house logic + <span className="font-semibold text-purple-200">Sidereal (Lahiri)</span> zodiac.
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-600 rounded-lg px-3 py-2 text-red-300 text-sm">
          {error}
        </div>
      )}
    </form>
  );
}
