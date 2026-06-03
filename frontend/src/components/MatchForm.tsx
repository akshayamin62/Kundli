"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { calculateMatch } from "@/services/api";
import { MatchPersonRequest, MatchResponse } from "@/types/chart";
import { fetchPlaceSuggestions, PlaceSuggestion } from "@/lib/geocoding";

function emptyPerson(saved?: Partial<MatchPersonRequest>): MatchPersonRequest {
  return {
    name:         saved?.name         ?? "",
    birth_date:   saved?.birth_date   ?? "",
    birth_time:   saved?.birth_time   ?? "",
    birth_place:  saved?.birth_place  ?? "",
    birth_lat:    saved?.birth_lat,
    birth_lon:    saved?.birth_lon,
    house_system: "whole_sign",
    zodiac:       "sidereal",
  };
}

function loadPerson(key: string): Partial<MatchPersonRequest> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Partial<MatchPersonRequest>) : {};
  } catch { return {}; }
}

function normalizePerson(p: MatchPersonRequest): MatchPersonRequest {
  return {
    name:         (p.name ?? "").trim(),
    birth_date:   (p.birth_date ?? "").trim(),
    birth_time:   (p.birth_time ?? "").trim(),
    birth_place:  (p.birth_place ?? "").trim(),
    birth_lat:    p.birth_lat,
    birth_lon:    p.birth_lon,
    house_system: (p.house_system ?? "whole_sign") as MatchPersonRequest["house_system"],
    zodiac:       (p.zodiac ?? "sidereal") as MatchPersonRequest["zodiac"],
  };
}

// ---------------------------------------------------------------------------
// PersonPanel
// ---------------------------------------------------------------------------
function PersonPanel({
  label,
  accent,
  value,
  onChange,
}: {
  label: string;
  accent: "boy" | "girl";
  value: MatchPersonRequest;
  onChange: (v: MatchPersonRequest) => void;
}) {
  const [placeInput, setPlaceInput] = useState(value.birth_place ?? "");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [useCoords, setUseCoords] = useState(!!(value.birth_lat && value.birth_lon));
  const [latInput, setLatInput] = useState(value.birth_lat?.toString() ?? "");
  const [lonInput, setLonInput] = useState(value.birth_lon?.toString() ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPlaceInput(value.birth_place ?? "");
    const hasCoords = !!(value.birth_lat && value.birth_lon);
    if (hasCoords) {
      setUseCoords(true);
      setLatInput(value.birth_lat?.toString() ?? "");
      setLonInput(value.birth_lon?.toString() ?? "");
    }
  }, [value.birth_place, value.birth_lat, value.birth_lon]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handlePlaceChange = useCallback((v: string) => {
    setPlaceInput(v);
    onChange({ ...value, birth_place: v, birth_lat: undefined, birth_lon: undefined });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const results = await fetchPlaceSuggestions(v);
      setSuggestions(results);
      setShowDropdown(results.length > 0);
    }, 350);
  }, [value, onChange]);

  const handleSelect = (s: PlaceSuggestion) => {
    setPlaceInput(s.label);
    onChange({ ...value, birth_place: s.label, birth_lat: s.lat, birth_lon: s.lon });
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleLatChange = (v: string) => {
    setLatInput(v);
    const n = parseFloat(v);
    onChange({ ...value, birth_lat: isNaN(n) ? undefined : n });
  };

  const handleLonChange = (v: string) => {
    setLonInput(v);
    const n = parseFloat(v);
    onChange({ ...value, birth_lon: isNaN(n) ? undefined : n });
  };

  const toggleCoords = () => {
    const next = !useCoords;
    setUseCoords(next);
    if (!next) {
      onChange({ ...value, birth_lat: undefined, birth_lon: undefined });
    } else {
      setPlaceInput("");
      onChange({ ...value, birth_place: "", birth_lat: undefined, birth_lon: undefined });
    }
  };

  const ring = accent === "boy"
    ? "focus:border-astrogyan-boy focus:ring-astrogyan-boy/20"
    : "focus:border-rose-400 focus:ring-rose-100";
  const header = accent === "boy" ? "bg-astrogyan-boy" : "bg-rose-600";
  const accentText = accent === "boy"
    ? "text-astrogyan-boy hover:text-astrogyan-boy-dark"
    : "text-rose-600 hover:text-rose-800";
  const suggestionHover = accent === "boy" ? "hover:bg-astrogyan-boy/10" : "hover:bg-rose-50";
  const inputCls = `bg-white border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${ring} w-full`;

  const row = (lbl: string, node: React.ReactNode) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-gray-600 font-semibold">{lbl}</label>
      {node}
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100">
      <div className={`${header} px-6 py-3.5 rounded-t-2xl`}>
        <span className="text-white font-bold text-base tracking-wide">{label}</span>
      </div>
      <div className="p-6 space-y-4">
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
        <div className="grid grid-cols-2 gap-4">
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

        {/* Location toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-600 font-semibold">Birth Location</label>
          <button
            type="button"
            onClick={toggleCoords}
            className={`text-xs font-semibold underline underline-offset-2 transition-colors ${accentText}`}
          >
            {useCoords ? "Use place name" : "Use lat / lon"}
          </button>
        </div>

        {useCoords ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {row(
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
              {row(
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
            </div>
            {row(
              "Place Label (optional)",
              <input
                type="text"
                placeholder="e.g. Vadodara, India"
                value={placeInput}
                onChange={(e) => {
                  setPlaceInput(e.target.value);
                  onChange({ ...value, birth_place: e.target.value });
                }}
                className={inputCls}
              />,
            )}
          </div>
        ) : (
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
              <ul className="absolute z-[200] left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-56 overflow-y-auto text-base">
                {suggestions.map((s) => (
                  <li
                    key={s.id}
                    onMouseDown={() => handleSelect(s)}
                    className={`px-4 py-3 cursor-pointer ${suggestionHover} text-gray-700 border-b border-gray-100 last:border-0 leading-snug`}
                  >
                    {s.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
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
    const boyMissingLoc = !boy.birth_place.trim() && (boy.birth_lat == null || boy.birth_lon == null);
    const girlMissingLoc = !girl.birth_place.trim() && (girl.birth_lat == null || girl.birth_lon == null);
    if (!boy.birth_date || !boy.birth_time || boyMissingLoc) {
      setError("Please fill all birth details for the Boy (including location).");
      return;
    }
    if (!girl.birth_date || !girl.birth_time || girlMissingLoc) {
      setError("Please fill all birth details for the Girl (including location).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payloadBoy = normalizePerson(boy);
      const payloadGirl = normalizePerson(girl);
      const result = await calculateMatch({
        boy: payloadBoy,
        girl: payloadGirl,
        save_history: isEditMode ? false : true,
        history_id: historyId,
      });
      onResult(result, { boy: payloadBoy, girl: payloadGirl });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Matching calculation failed";
      setError(message.replace(/\[object Object\],?/g, "").trim() || "Matching calculation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <PersonPanel label="♂ Boy / Var"  accent="boy"  value={boy}  onChange={setBoy}  />
        <PersonPanel label="♀ Girl / Kanya" accent="girl" value={girl} onChange={setGirl} />
      </div>

      {error && (
        <p className="text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-base text-center">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-astrogyan-boy to-rose-600 hover:from-astrogyan-boy-dark hover:to-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all tracking-wide text-base shadow-lg"
      >
        {loading ? "Saving…" : submitLabel}
      </button>

      {!isEditMode && (
        <p className="text-center text-gray-400 text-sm">
          Ashtakoot Guna Milan · 36 points · Parashari system
        </p>
      )}
    </form>
  );
}
