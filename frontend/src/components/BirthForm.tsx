"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { calculateChart } from "@/services/api";
import { ChartRequest, ChartResponse } from "@/types/chart";

interface Props {
  onResult: (chart: ChartResponse, req: ChartRequest) => void;
  storageKey?: string;
  initialValues?: ChartRequest;
  initialPlaceInput?: string;
  persistStorage?: boolean;
  submitLabel?: string;
  historyId?: string;
}

interface PlaceSuggestion {
  place_id: number;
  display_name: string;
}

const defaultForm = (): ChartRequest => ({
  name: "",
  birth_date: "",
  birth_time: "",
  birth_place: "",
  house_system: "whole_sign",
  zodiac: "sidereal",
});

export default function BirthForm({
  onResult,
  storageKey,
  initialValues,
  initialPlaceInput,
  persistStorage = true,
  submitLabel = "Generate Chart",
  historyId,
}: Props) {
  const SK = storageKey ?? "jk_birth_form";
  const isEditMode = !!historyId;

  const [form, setFormRaw] = useState<ChartRequest>(() => initialValues ?? defaultForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placeInput, setPlaceInput] = useState(
    initialPlaceInput ?? initialValues?.birth_place ?? "",
  );
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Restore saved form from localStorage on mount (home page only)
  useEffect(() => {
    if (initialValues || !persistStorage) return;
    try {
      const raw = localStorage.getItem(SK);
      if (raw) {
        const p = JSON.parse(raw) as Partial<ChartRequest & { _placeInput: string }>;
        setFormRaw((f) => ({
          ...f,
          name: p.name ?? "",
          birth_date: p.birth_date ?? "",
          birth_time: p.birth_time ?? "",
          birth_place: p.birth_place ?? "",
        }));
        setPlaceInput(p._placeInput ?? p.birth_place ?? "");
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [SK, persistStorage, initialValues]);

  // Sync when modal opens with new initial values
  useEffect(() => {
    if (!initialValues) return;
    setFormRaw(initialValues);
    setPlaceInput(initialPlaceInput ?? initialValues.birth_place ?? "");
  }, [initialValues, initialPlaceInput]);

  const setForm = useCallback(
    (updater: ChartRequest | ((prev: ChartRequest) => ChartRequest)) => {
      setFormRaw((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        if (persistStorage) {
          try {
            localStorage.setItem(SK, JSON.stringify(next));
          } catch { /* ignore */ }
        }
        return next;
      });
    },
    [SK, persistStorage],
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=0`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data: PlaceSuggestion[] = await res.json();
      setSuggestions(data);
      setShowDropdown(data.length > 0);
    } catch {
      setSuggestions([]);
      setShowDropdown(false);
    }
  }, []);

  const handlePlaceChange = (value: string) => {
    setPlaceInput(value);
    setForm((f) => ({ ...f, birth_place: value }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 350);
  };

  const handleSelectSuggestion = (s: PlaceSuggestion) => {
    setPlaceInput(s.display_name);
    setForm((f) => ({ ...f, birth_place: s.display_name }));
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload: ChartRequest = {
        ...form,
        save_history: isEditMode ? false : (form.save_history ?? true),
        history_id: historyId,
      };
      const result = await calculateChart(payload);
      onResult(result, form);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Calculation failed");
    } finally {
      setLoading(false);
    }
  };

  const field = (label: string, children: React.ReactNode) => (
    <div className="flex flex-col gap-1 min-w-0">
      <label className="text-sm text-gray-600 font-medium">{label}</label>
      {children}
    </div>
  );

  const inputCls =
    "bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {field(
        "Full Name",
        <input
          type="text"
          placeholder="e.g. Ravi Sharma"
          value={form.name ?? ""}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={inputCls}
        />,
      )}

      <div className="grid grid-cols-2 gap-3">
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
      </div>

      {field(
        "Birth Place",
        <div ref={containerRef} className="relative">
          <input
            type="text"
            required
            placeholder="e.g. Vadodara, India"
            value={placeInput}
            onChange={(e) => handlePlaceChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            autoComplete="off"
            className={inputCls + " w-full"}
          />
          {showDropdown && suggestions.length > 0 && (
            <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto text-sm">
              {suggestions.map((s) => (
                <li
                  key={s.place_id}
                  onMouseDown={() => handleSelectSuggestion(s)}
                  className="px-3 py-2.5 cursor-pointer hover:bg-indigo-50 text-gray-700 border-b border-gray-100 last:border-0 leading-snug"
                >
                  {s.display_name}
                </li>
              ))}
            </ul>
          )}
        </div>,
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl transition-colors tracking-wide text-sm"
      >
        {loading ? "Saving…" : submitLabel}
      </button>

      {!isEditMode && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600">
          North Indian mode: <span className="font-semibold text-gray-900">Whole Sign</span> +{" "}
          <span className="font-semibold text-gray-900">Sidereal (Lahiri)</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-300 rounded-lg px-3 py-2 text-red-600 text-sm">
          {error}
        </div>
      )}
    </form>
  );
}
