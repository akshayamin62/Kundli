"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { calculateMatch } from "@/services/api";
import { MatchPersonRequest, MatchResponse } from "@/types/chart";

interface PlaceSuggestion {
  place_id: number;
  display_name: string;
}

function emptyPerson(saved?: Partial<MatchPersonRequest>): MatchPersonRequest {
  return {
    name:        saved?.name        ?? "",
    birth_date:  saved?.birth_date  ?? "",
    birth_time:  saved?.birth_time  ?? "",
    birth_place: saved?.birth_place ?? "",
    house_system: "whole_sign",
    zodiac: "sidereal",
  };
}

function loadPerson(key: string): Partial<MatchPersonRequest> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Partial<MatchPersonRequest>) : {};
  } catch { return {}; }
}

// ---------------------------------------------------------------------------
// Single-person form panel
// ---------------------------------------------------------------------------
function PersonPanel({
  label,
  accent,
  value,
  onChange,
}: {
  label: string;
  accent: "indigo" | "rose";
  value: MatchPersonRequest;
  onChange: (v: MatchPersonRequest) => void;
}) {
  const [placeInput, setPlaceInput] = useState(value.birth_place ?? "");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPlaceInput(value.birth_place ?? "");
  }, [value.birth_place]);

  // Close dropdown on outside click
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
    if (query.length < 3) { setSuggestions([]); setShowDropdown(false); return; }
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=0`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data: PlaceSuggestion[] = await res.json();
      setSuggestions(data);
      setShowDropdown(data.length > 0);
    } catch { setSuggestions([]); setShowDropdown(false); }
  }, []);

  const handlePlaceChange = (v: string) => {
    setPlaceInput(v);
    onChange({ ...value, birth_place: v });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 350);
  };

  const handleSelect = (s: PlaceSuggestion) => {
    setPlaceInput(s.display_name);
    onChange({ ...value, birth_place: s.display_name });
    setSuggestions([]);
    setShowDropdown(false);
  };

  const ring = accent === "indigo"
    ? "focus:border-indigo-400 focus:ring-indigo-400"
    : "focus:border-rose-400 focus:ring-rose-400";
  const header = accent === "indigo" ? "bg-indigo-600" : "bg-rose-600";
  const inputCls = `bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-1 ${ring} w-full`;

  const row = (lbl: string, node: React.ReactNode) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500 font-medium">{lbl}</label>
      {node}
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100">
      <div className={`${header} px-5 py-3 rounded-t-2xl`}>
        <span className="text-white font-semibold text-sm tracking-wide">{label}</span>
      </div>
      <div className="p-5 space-y-3">
        {row(
          "Name",
          <input
            type="text"
            placeholder={`${label} name`}
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            className={inputCls}
          />,
        )}
        <div className="grid grid-cols-2 gap-3">
          {row(
            "Birth Date",
            <input
              type="date"
              required
              value={value.birth_date}
              onChange={(e) => onChange({ ...value, birth_date: e.target.value })}
              className={inputCls}
            />,
          )}
          {row(
            "Birth Time (24h)",
            <input
              type="time"
              required
              value={value.birth_time}
              onChange={(e) => onChange({ ...value, birth_time: e.target.value })}
              className={inputCls}
            />,
          )}
        </div>
        {row(
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
              className={inputCls}
            />
            {showDropdown && suggestions.length > 0 && (
              <ul className="absolute z-[200] left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto text-sm">
                {suggestions.map((s) => (
                  <li
                    key={s.place_id}
                    onMouseDown={() => handleSelect(s)}
                    className="px-3 py-2.5 cursor-pointer hover:bg-indigo-50 text-gray-700 border-b border-gray-100 last:border-0 leading-snug"
                  >
                    {s.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>,
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------
interface MatchFormProps {
  onResult: (result: MatchResponse, req: { boy: MatchPersonRequest; girl: MatchPersonRequest }) => void;
  initialBoy?: MatchPersonRequest;
  initialGirl?: MatchPersonRequest;
  persistStorage?: boolean;
  submitLabel?: string;
  historyId?: string;
}

export default function MatchForm({
  onResult,
  initialBoy,
  initialGirl,
  persistStorage = true,
  submitLabel = "✦ Match Horoscopes ✦",
  historyId,
}: MatchFormProps) {
  const isEditMode = !!historyId;

  const [boy, setBoyRaw] = useState<MatchPersonRequest>(() =>
    initialBoy ?? emptyPerson(persistStorage ? loadPerson("jk_match_boy") : undefined),
  );
  const [girl, setGirlRaw] = useState<MatchPersonRequest>(() =>
    initialGirl ?? emptyPerson(persistStorage ? loadPerson("jk_match_girl") : undefined),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialBoy && !initialGirl) return;
    if (initialBoy) setBoyRaw(initialBoy);
    if (initialGirl) setGirlRaw(initialGirl);
  }, [initialBoy, initialGirl]);

  const setBoy = (v: MatchPersonRequest) => {
    setBoyRaw(v);
    if (persistStorage) {
      try { localStorage.setItem("jk_match_boy", JSON.stringify(v)); } catch { /* ignore */ }
    }
  };
  const setGirl = (v: MatchPersonRequest) => {
    setGirlRaw(v);
    if (persistStorage) {
      try { localStorage.setItem("jk_match_girl", JSON.stringify(v)); } catch { /* ignore */ }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boy.birth_date || !boy.birth_time || !boy.birth_place) {
      setError("Please fill all birth details for the Boy.");
      return;
    }
    if (!girl.birth_date || !girl.birth_time || !girl.birth_place) {
      setError("Please fill all birth details for the Girl.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await calculateMatch({
        boy,
        girl,
        save_history: isEditMode ? false : true,
        history_id: historyId,
      });
      onResult(result, { boy, girl });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Matching calculation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <PersonPanel label="♂ Boy / Vark"  accent="indigo" value={boy}  onChange={setBoy}  />
        <PersonPanel label="♀ Girl / Kanya" accent="rose"   value={girl} onChange={setGirl} />
      </div>

      {error && (
        <p className="text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-center">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-2xl transition-all tracking-wide text-sm shadow-lg"
      >
        {loading ? "Saving…" : submitLabel}
      </button>

      {!isEditMode && (
        <p className="text-center text-gray-400 text-xs">
          Ashtakoot Guna Milan · 36 points · Parashari system
        </p>
      )}
    </form>
  );
}
