"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { calculateChart } from "@/services/api";
import { ChartRequest, ChartResponse } from "@/types/chart";
import { fetchPlaceSuggestions, PlaceSuggestion } from "@/lib/geocoding";

interface Props {
  onResult: (chart: ChartResponse, req: ChartRequest) => void;
  storageKey?: string;
  initialValues?: ChartRequest;
  initialPlaceInput?: string;
  persistStorage?: boolean;
  submitLabel?: string;
  historyId?: string;
}

const defaultForm = (): ChartRequest => ({
  name: "",
  birth_date: "",
  birth_time: "",
  birth_place: "",
  birth_lat: undefined,
  birth_lon: undefined,
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
  const [useCoords, setUseCoords] = useState(
    !!(initialValues?.birth_lat && initialValues?.birth_lon),
  );
  const [latInput, setLatInput] = useState(initialValues?.birth_lat?.toString() ?? "");
  const [lonInput, setLonInput] = useState(initialValues?.birth_lon?.toString() ?? "");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Restore from localStorage on mount
  useEffect(() => {
    if (initialValues || !persistStorage) return;
    try {
      const raw = localStorage.getItem(SK);
      if (raw) {
        const p = JSON.parse(raw) as Partial<ChartRequest & { _placeInput: string; _useCoords: boolean }>;
        setFormRaw((f) => ({
          ...f,
          name: p.name ?? "",
          birth_date: p.birth_date ?? "",
          birth_time: p.birth_time ?? "",
          birth_place: p.birth_place ?? "",
          birth_lat: p.birth_lat,
          birth_lon: p.birth_lon,
        }));
        setPlaceInput(p._placeInput ?? p.birth_place ?? "");
        if (p._useCoords) {
          setUseCoords(true);
          setLatInput(p.birth_lat?.toString() ?? "");
          setLonInput(p.birth_lon?.toString() ?? "");
        }
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [SK, persistStorage, initialValues]);

  // Sync when modal re-opens
  useEffect(() => {
    if (!initialValues) return;
    setFormRaw(initialValues);
    setPlaceInput(initialPlaceInput ?? initialValues.birth_place ?? "");
    const hasCoords = !!(initialValues.birth_lat && initialValues.birth_lon);
    setUseCoords(hasCoords);
    setLatInput(initialValues.birth_lat?.toString() ?? "");
    setLonInput(initialValues.birth_lon?.toString() ?? "");
  }, [initialValues, initialPlaceInput]);

  const setForm = useCallback(
    (updater: ChartRequest | ((prev: ChartRequest) => ChartRequest)) => {
      setFormRaw((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        if (persistStorage) {
          try {
            localStorage.setItem(SK, JSON.stringify({ ...next, _useCoords: useCoords }));
          } catch { /* ignore */ }
        }
        return next;
      });
    },
    [SK, persistStorage, useCoords],
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

  const handlePlaceChange = (value: string) => {
    setPlaceInput(value);
    setForm((f) => ({ ...f, birth_place: value, birth_lat: undefined, birth_lon: undefined }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const results = await fetchPlaceSuggestions(value);
      setSuggestions(results);
      setShowDropdown(results.length > 0);
    }, 350);
  };

  const handleSelectSuggestion = (s: PlaceSuggestion) => {
    setPlaceInput(s.label);
    setForm((f) => ({ ...f, birth_place: s.label, birth_lat: s.lat, birth_lon: s.lon }));
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleLatChange = (val: string) => {
    setLatInput(val);
    const n = parseFloat(val);
    setForm((f) => ({ ...f, birth_lat: isNaN(n) ? undefined : n }));
  };

  const handleLonChange = (val: string) => {
    setLonInput(val);
    const n = parseFloat(val);
    setForm((f) => ({ ...f, birth_lon: isNaN(n) ? undefined : n }));
  };

  const toggleCoords = () => {
    const next = !useCoords;
    setUseCoords(next);
    if (!next) {
      setForm((f) => ({ ...f, birth_lat: undefined, birth_lon: undefined }));
    } else {
      setPlaceInput("");
      setForm((f) => ({ ...f, birth_place: "", birth_lat: undefined, birth_lon: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate location
    if (useCoords) {
      if (form.birth_lat == null || form.birth_lon == null) {
        setError("Please enter valid Latitude and Longitude.");
        return;
      }
    } else if (!form.birth_place.trim()) {
      setError("Please enter a birth place or use coordinates.");
      return;
    }
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

  const labelCls = "text-base text-gray-700 font-semibold";
  const inputCls =
    "bg-white border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 w-full";

  const field = (label: string, children: React.ReactNode) => (
    <div className="flex flex-col gap-1.5 min-w-0">
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <div className="grid grid-cols-2 gap-4">
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

      {/* Location toggle */}
      <div className="flex items-center justify-between">
        <span className={labelCls}>Birth Location</span>
        <button
          type="button"
          onClick={toggleCoords}
          className="text-sm font-medium text-[#0346b0] underline underline-offset-2 transition-colors"
        >
          {useCoords ? "Use place name instead" : "Use lat / lon instead"}
        </button>
      </div>

      {useCoords ? (
        <div className="grid grid-cols-2 gap-4">
          {field(
            "Latitude",
            <input
              type="number"
              step="any"
              placeholder="e.g. 22.3072"
              value={latInput}
              onChange={(e) => handleLatChange(e.target.value)}
              className={inputCls}
            />,
          )}
          {field(
            "Longitude",
            <input
              type="number"
              step="any"
              placeholder="e.g. 73.1812"
              value={lonInput}
              onChange={(e) => handleLonChange(e.target.value)}
              className={inputCls}
            />,
          )}
          {field(
            "Place Label (optional)",
            <input
              type="text"
              placeholder="e.g. Vadodara, India"
              value={placeInput}
              onChange={(e) => {
                setPlaceInput(e.target.value);
                setForm((f) => ({ ...f, birth_place: e.target.value }));
              }}
              className={inputCls}
            />,
          )}
        </div>
      ) : (
        <div ref={containerRef} className="relative">
          <input
            type="text"
            placeholder="e.g. Vadodara, India"
            value={placeInput}
            onChange={(e) => handlePlaceChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            autoComplete="off"
            className={inputCls}
          />
          {showDropdown && suggestions.length > 0 && (
            <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto text-base">
              {suggestions.map((s) => (
                <li
                  key={s.id}
                  onMouseDown={() => handleSelectSuggestion(s)}
                  className="px-4 py-3 cursor-pointer hover:bg-indigo-50 text-gray-700 border-b border-gray-100 last:border-0 leading-snug"
                >
                  {s.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#0346b0] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors tracking-wide text-base"
      >
        {loading ? "Saving…" : submitLabel}
      </button>

      {!isEditMode && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600">
          North Indian mode:{" "}
          <span className="font-semibold text-gray-900">Whole Sign</span> +{" "}
          <span className="font-semibold text-gray-900">Sidereal (Lahiri)</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-300 rounded-xl px-4 py-3 text-red-600 text-base">
          {error}
        </div>
      )}
    </form>
  );
}
