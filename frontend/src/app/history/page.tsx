"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { fetchHistory, fetchHistoryItem, deleteHistoryItem, calculateChart, calculateMatch } from "@/services/api";
import { ChartRequest, HistoryItemSummary, MatchRequest } from "@/types/chart";
import FormModal from "@/components/FormModal";
import BirthForm from "@/components/BirthForm";
import MatchForm from "@/components/MatchForm";
import { saveMatchRequest } from "@/lib/editPrefill";
import { setKundaliHistoryId, setMatchHistoryId } from "@/lib/historySession";
import { normalizeChartRequest } from "@/lib/chartRequestNormalize";
import AppNavbar from "@/components/AppNavbar";
import { formatBirthPlaceDisplay } from "@/lib/birthPlaceDisplay";

type TabType = "kundali" | "match";

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-slate-100 animate-pulse">
      <div className="col-span-3 h-4 bg-slate-100 rounded" />
      <div className="col-span-2 h-4 bg-slate-100 rounded" />
      <div className="col-span-1 h-4 bg-slate-100 rounded" />
      <div className="col-span-3 h-4 bg-slate-100 rounded" />
      <div className="col-span-2 h-4 bg-slate-100 rounded" />
      <div className="col-span-1 h-4 bg-slate-100 rounded" />
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ filtered }: { filtered: boolean }) {
  const router = useRouter();
  return (
    <div className="text-center py-20">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-50 rounded-2xl mb-5">
        <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
        </svg>
      </div>
      <p className="text-slate-800 font-bold text-lg mb-1">
        {filtered ? "No results found" : "No history yet"}
      </p>
      <p className="text-slate-400 text-sm mb-6">
        {filtered
          ? "Try adjusting your search or filters."
          : "Generate a Kundali or Milan to start building your history."}
      </p>
      {!filtered && (
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Generate Chart
        </button>
      )}
    </div>
  );
}

function RowActions({
  onView,
  onEdit,
  onDelete,
  deleting,
  editing,
}: {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
  editing: boolean;
}) {
  const [confirmDel, setConfirmDel] = useState(false);
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button
        onClick={onView}
        disabled={editing}
        className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-md"
      >
        View
      </button>
      <button
        onClick={onEdit}
        disabled={editing}
        className="text-sm font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 px-3 py-1.5 rounded-md"
      >
        {editing ? "..." : "Edit"}
      </button>
      {confirmDel ? (
        <>
          <button
            onClick={() => { onDelete(); setConfirmDel(false); }}
            disabled={deleting}
            className="text-sm font-semibold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-md disabled:opacity-50"
          >
            {deleting ? "..." : "Confirm"}
          </button>
          <button
            onClick={() => setConfirmDel(false)}
            className="text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-md"
          >
            Cancel
          </button>
        </>
      ) : (
        <button
          onClick={() => setConfirmDel(true)}
          className="text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-md"
        >
          Delete
        </button>
      )}
    </div>
  );
}

function formatCreatedAt(ts?: string) {
  if (!ts) return "—";
  const d = new Date(ts);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year} ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
}

function formatInputDate(dateStr?: string) {
  if (!dateStr) return "—";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const [yyyy, mm, dd] = parts;
  return `${dd}-${mm}-${yyyy}`;
}

function StatsCard({ title, value, icon, tint }: { title: string; value: number; icon: string; tint: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between">
      <div>
        <p className="text-xs text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900 leading-tight">{value}</p>
      </div>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tint}`}>
        <span className="text-base">{icon}</span>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<HistoryItemSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [kundaliTotal, setKundaliTotal] = useState(0);
  const [milanTotal, setMilanTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("kundali");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<
    | { type: "kundali"; id: string; initial: ChartRequest }
    | { type: "match"; id: string; initial: MatchRequest }
    | null
  >(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input
  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 350);
  };

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const [activeData, kData, mData] = await Promise.all([
        fetchHistory({
          search: debouncedSearch || undefined,
          type: activeTab,
          limit: 100,
        }),
        fetchHistory({ type: "kundali", limit: 1 }),
        fetchHistory({ type: "match", limit: 1 }),
      ]);
      setItems(activeData.items);
      setTotal(activeData.total);
      setKundaliTotal(kData.total);
      setMilanTotal(mData.total);
    } catch {
      setItems([]);
      setTotal(0);
      setKundaliTotal(0);
      setMilanTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activeTab]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleView = async (item: HistoryItemSummary) => {
    setOpeningId(item.id);
    try {
      const full = await fetchHistoryItem(item.id);
      if (item.type === "kundali" && full.input) {
        const req = normalizeChartRequest({
          ...(full.input as ChartRequest),
          save_history: false,
        });
        const chart = await calculateChart(req);
        sessionStorage.setItem("astroChart", JSON.stringify(chart));
        sessionStorage.setItem(
          "astroReq",
          JSON.stringify({
            name: full.name,
            birth_date: req.birth_date,
            birth_time: req.birth_time,
            birth_place: req.birth_place,
            birth_lat: req.birth_lat,
            birth_lon: req.birth_lon,
            house_system: req.house_system,
            zodiac: req.zodiac,
          })
        );
        setKundaliHistoryId(item.id);
        router.push("/result");
      } else if (item.type === "match" && full.input) {
        const req: MatchRequest = {
          ...(full.input as MatchRequest),
          save_history: false,
        };
        const result = await calculateMatch(req);
        sessionStorage.setItem("matchResult", JSON.stringify(result));
        saveMatchRequest(req);
        setMatchHistoryId(item.id);
        router.push("/match/result");
      }
    } catch {
      /* ignore */
    } finally {
      setOpeningId(null);
    }
  };

  const handleEdit = async (item: HistoryItemSummary) => {
    setEditingId(item.id);
    try {
      const full = await fetchHistoryItem(item.id);
      if (item.type === "kundali" && full.input) {
        const input = full.input as ChartRequest;
        setEditModal({
          type: "kundali",
          id: item.id,
          initial: {
            name: full.name ?? input.name,
            birth_date: input.birth_date,
            birth_time: input.birth_time,
            birth_place: input.birth_place,
            birth_lat: input.birth_lat,
            birth_lon: input.birth_lon,
            house_system: input.house_system,
            zodiac: input.zodiac,
          },
        });
      } else if (item.type === "match" && full.input) {
        setEditModal({
          type: "match",
          id: item.id,
          initial: full.input as MatchRequest,
        });
      }
    } catch {
      /* ignore */
    } finally {
      setEditingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteHistoryItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setTotal((t) => t - 1);
      if (activeTab === "kundali") setKundaliTotal((t) => t - 1);
      if (activeTab === "match") setMilanTotal((t) => t - 1);
    } catch {
      /* ignore */
    } finally {
      setDeletingId(null);
    }
  };

  const isFiltered = !!debouncedSearch;

  return (
    <div className="min-h-screen bg-slate-50">

      <AppNavbar active="history" borderClass="border-slate-200" fullWidth />

      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatsCard title="Total Records" value={kundaliTotal + milanTotal} icon="📚" tint="bg-blue-50" />
          <StatsCard title="Janam Kundli" value={kundaliTotal} icon="🪐" tint="bg-indigo-50" />
          <StatsCard title="Kundli Milan" value={milanTotal} icon="💞" tint="bg-rose-50" />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab("kundali")}
              className={`px-4 py-2 rounded-lg text-base font-semibold ${
                activeTab === "kundali" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              Janam Kundli
            </button>
            <button
              onClick={() => setActiveTab("match")}
              className={`px-4 py-2 rounded-lg text-base font-semibold ${
                activeTab === "match" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              Kundli Milan
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={activeTab === "kundali" ? "Search by name or place..." : "Search by groom or bride name..."}
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 focus:bg-white transition-all"
              />
              {search && (
                <button
                  onClick={() => { setSearch(""); setDebouncedSearch(""); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <button
              onClick={() => { setSearch(""); setDebouncedSearch(""); }}
              className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-base font-medium text-slate-600 hover:bg-slate-50"
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {activeTab === "kundali" ? (
            <div className="grid grid-cols-12 gap-3 px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
              <div className="col-span-2">Person</div>
              <div className="col-span-1">Birth Date</div>
              <div className="col-span-1">Time</div>
              <div className="col-span-4">Birth Place</div>
              <div className="col-span-2">Saved On</div>
              <div className="col-span-2">Actions</div>
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-3 px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
              <div className="col-span-3">Pair</div>
              <div className="col-span-3">Groom (Male)</div>
              <div className="col-span-3">Bride (Female)</div>
              <div className="col-span-2">Saved On</div>
              <div className="col-span-1">Actions</div>
            </div>
          )}

          {loading ? (
            <div>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : items.length === 0 ? (
            <EmptyState filtered={isFiltered} />
          ) : (
            <div>
              {items.map((item) => {
                const isOpening = openingId === item.id;
                const isDeleting = deletingId === item.id;
                const isEditing = editingId === item.id;
                const disabled = isOpening || isDeleting || isEditing;

                return activeTab === "kundali" ? (
                  <div key={item.id} className={`grid grid-cols-12 gap-3 px-4 py-3 border-b border-slate-100 items-center hover:bg-slate-50/60 ${disabled ? "opacity-60 pointer-events-none" : ""}`}>
                    <div className="col-span-2 min-w-0">
                      <p className="text-base font-semibold text-slate-800 truncate">{item.name || "Unnamed"}</p>
                      {/* <p className="text-sm text-slate-400">Janam Kundli</p> */}
                    </div>
                    <div className="col-span-1 text-base text-slate-700">{formatInputDate(item.birth_date)}</div>
                    <div className="col-span-1 text-base text-slate-700">{item.birth_time || "—"}</div>
                    <div className="col-span-4 text-base text-slate-700 truncate" title={formatBirthPlaceDisplay(item.birth_place, item.birth_lat, item.birth_lon)}>
                      {formatBirthPlaceDisplay(item.birth_place, item.birth_lat, item.birth_lon)}
                    </div>
                    <div className="col-span-2 text-sm text-slate-500">{formatCreatedAt(item.created_at)}</div>
                    <div className="col-span-2">
                      <RowActions
                        onView={() => handleView(item)}
                        onEdit={() => handleEdit(item)}
                        onDelete={() => handleDelete(item.id)}
                        deleting={isDeleting}
                        editing={isEditing}
                      />
                    </div>
                  </div>
                ) : (
                  <div key={item.id} className={`grid grid-cols-12 gap-3 px-4 py-3 border-b border-slate-100 items-center hover:bg-slate-50/60 ${disabled ? "opacity-60 pointer-events-none" : ""}`}>
                    <div className="col-span-3 min-w-0">
                      <p className="text-base font-semibold text-slate-800 truncate">
                        {(item.boy_name || "Groom")} ↔ {(item.girl_name || "Bride")}
                      </p>
                      {/* <p className="text-sm text-slate-400">Kundli Milan</p> */}
                    </div>
                    <div className="col-span-3 min-w-0">
                      {/* <p className="text-base text-indigo-700 font-semibold truncate">{item.boy_name || "Groom"}</p> */}
                      <p className="text-sm text-black-500 truncate">
                        {formatInputDate(item.boy_birth_date)} · {item.boy_birth_time || "—"}
                      </p>
                      <p className="text-sm text-black-400 truncate" title={formatBirthPlaceDisplay(item.boy_birth_place, item.boy_birth_lat, item.boy_birth_lon)}>
                        {formatBirthPlaceDisplay(item.boy_birth_place, item.boy_birth_lat, item.boy_birth_lon)}
                      </p>
                    </div>
                    <div className="col-span-3 min-w-0">
                      {/* <p className="text-base text-rose-700 font-semibold truncate">{item.girl_name || "Bride"}</p> */}
                      <p className="text-sm text-black-500 truncate">
                        {formatInputDate(item.girl_birth_date)} · {item.girl_birth_time || "—"}
                      </p>
                      <p className="text-sm text-black-400 truncate" title={formatBirthPlaceDisplay(item.girl_birth_place, item.girl_birth_lat, item.girl_birth_lon)}>
                        {formatBirthPlaceDisplay(item.girl_birth_place, item.girl_birth_lat, item.girl_birth_lon)}
                      </p>
                    </div>
                    <div className="col-span-1 text-sm text-slate-500">{formatCreatedAt(item.created_at)}</div>
                    <div className="col-span-2">
                      <RowActions
                        onView={() => handleView(item)}
                        onEdit={() => handleEdit(item)}
                        onDelete={() => handleDelete(item.id)}
                        deleting={isDeleting}
                        editing={isEditing}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {editModal?.type === "kundali" && (
        <FormModal title="Edit Janam Kundli" onClose={() => setEditModal(null)}>
          <BirthForm
            key={editModal.id}
            initialValues={editModal.initial}
            initialPlaceInput={editModal.initial.birth_place}
            persistStorage={false}
            submitLabel="Save changes"
            historyId={editModal.id}
            onResult={() => {
              setEditModal(null);
              loadHistory();
            }}
          />
        </FormModal>
      )}

      {editModal?.type === "match" && (
        <FormModal title="Edit Kundli Milan" onClose={() => setEditModal(null)} wide>
          <MatchForm
            key={editModal.id}
            initialBoy={editModal.initial.boy}
            initialGirl={editModal.initial.girl}
            persistStorage={false}
            submitLabel="Save changes"
            historyId={editModal.id}
            onResult={() => {
              setEditModal(null);
              loadHistory();
            }}
          />
        </FormModal>
      )}
    </div>
  );
}
