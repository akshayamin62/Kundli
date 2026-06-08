"use client";

import { type ReactNode } from "react";

// ── Design tokens (high contrast on white, WCAG-friendly) ───────────────────

export type DoshaTheme = "pitru" | "kaalsarpa" | "chandal";

type ThemeTokens = {
  /** Page & chrome */
  pageBg: string;
  headerBorder: string;
  /** Solid header bar */
  bar: string;
  barText: string;
  /** Surfaces */
  surface: string;
  surfaceBorder: string;
  /** Text on white */
  label: string;
  heading: string;
  /** Interactive */
  tabActive: string;
  tabIdle: string;
  spinner: string;
  /** Status when present */
  statusPresent: string;
  /** Card accent */
  cardAccent: string;
  cardHeader: string;
  tag: string;
  orb: string;
};

const THEME: Record<DoshaTheme, ThemeTokens> = {
  pitru: {
    pageBg: "bg-slate-50",
    headerBorder: "border-indigo-600",
    bar: "bg-indigo-700",
    barText: "text-white",
    surface: "bg-indigo-50",
    surfaceBorder: "border-indigo-200",
    label: "text-indigo-900",
    heading: "text-indigo-950",
    tabActive: "bg-indigo-700 text-white shadow-sm",
    tabIdle: "text-slate-700 hover:bg-white hover:text-indigo-800",
    spinner: "border-indigo-200 border-t-indigo-700",
    statusPresent: "bg-indigo-100 text-indigo-900 border-indigo-300",
    cardAccent: "border-l-indigo-600",
    cardHeader: "bg-indigo-50 border-indigo-100",
    tag: "bg-indigo-100 text-indigo-900 border-indigo-200",
    orb: "bg-indigo-600",
  },
  kaalsarpa: {
    pageBg: "bg-slate-50",
    headerBorder: "border-rose-700",
    bar: "bg-rose-700",
    barText: "text-white",
    surface: "bg-rose-50",
    surfaceBorder: "border-rose-200",
    label: "text-rose-900",
    heading: "text-rose-950",
    tabActive: "bg-rose-700 text-white shadow-sm",
    tabIdle: "text-slate-700 hover:bg-white hover:text-rose-800",
    spinner: "border-rose-200 border-t-rose-700",
    statusPresent: "bg-rose-100 text-rose-900 border-rose-300",
    cardAccent: "border-l-rose-600",
    cardHeader: "bg-rose-50 border-rose-100",
    tag: "bg-rose-100 text-rose-900 border-rose-200",
    orb: "bg-rose-600",
  },
  chandal: {
    pageBg: "bg-slate-50",
    headerBorder: "border-amber-600",
    bar: "bg-amber-700",
    barText: "text-white",
    surface: "bg-amber-50",
    surfaceBorder: "border-amber-200",
    label: "text-amber-950",
    heading: "text-amber-950",
    tabActive: "bg-amber-700 text-white shadow-sm",
    tabIdle: "text-slate-700 hover:bg-white hover:text-amber-900",
    spinner: "border-amber-200 border-t-amber-700",
    statusPresent: "bg-amber-100 text-amber-950 border-amber-300",
    cardAccent: "border-l-amber-600",
    cardHeader: "bg-amber-50 border-amber-100",
    tag: "bg-violet-100 text-violet-900 border-violet-200",
    orb: "bg-amber-600",
  },
};

export function themeOf(theme: DoshaTheme): ThemeTokens {
  return THEME[theme];
}

// ── Severity badges (saturated, readable on white) ─────────────────────────────

export function severityBadgeClass(severity: string): string {
  const s = severity.toLowerCase().trim();
  if (s.includes("strongly mitigated") || s.includes("mitigated")) {
    return "bg-emerald-600 text-white";
  }
  if (s.includes("very high")) return "bg-red-700 text-white";
  if (s.includes("medium to high") || s.includes("medium-high")) {
    return "bg-orange-600 text-white";
  }
  if (s.includes("high")) return "bg-orange-600 text-white";
  if (s.includes("moderate")) return "bg-amber-600 text-white";
  if (s.includes("medium")) return "bg-yellow-600 text-white";
  if (s.includes("low")) return "bg-slate-500 text-white";
  return "bg-slate-600 text-white";
}

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span
      className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full ${severityBadgeClass(severity)}`}
    >
      {severity}
    </span>
  );
}

// ── Shell & states ───────────────────────────────────────────────────────────

export function DoshaPanelShell({
  theme,
  children,
}: {
  theme: DoshaTheme;
  children: ReactNode;
}) {
  return (
    <div className={`flex-1 min-h-0 overflow-auto ${THEME[theme].pageBg}`}>
      <div className="w-full px-4 py-4 space-y-4">{children}</div>
    </div>
  );
}

export function DoshaLoading({ theme, message }: { theme: DoshaTheme; message: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3">
      <div className={`w-9 h-9 rounded-full border-[3px] animate-spin ${THEME[theme].spinner}`} />
      <p className="text-sm font-medium text-slate-600">{message}</p>
    </div>
  );
}

export function DoshaError({ message }: { message: string }) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <p className="text-sm text-red-800 bg-red-50 border border-red-300 rounded-xl px-4 py-3 shadow-sm">
        {message}
      </p>
    </div>
  );
}

// ── Page header ──────────────────────────────────────────────────────────────

export function PageBar({
  theme,
  title,
  present,
  presentLabel,
  absentLabel,
}: {
  theme: DoshaTheme;
  title: string;
  present?: boolean;
  presentLabel?: string;
  absentLabel?: string;
}) {
  const t = THEME[theme];
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-slate-200 border-b-[3px] ${t.headerBorder} px-4 py-3 flex items-center justify-between gap-4`}
    >
      <h1 className="text-base font-bold text-slate-900">{title}</h1>
      {present !== undefined && presentLabel && absentLabel && (
        <span
          className={`text-xs font-bold px-3 py-1 rounded-full border shrink-0 ${
            present
              ? t.statusPresent
              : "bg-emerald-600 text-white border-emerald-700"
          }`}
        >
          {present ? presentLabel : absentLabel}
        </span>
      )}
    </div>
  );
}

export function AbsentReport({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
      <div className="w-12 h-12 mx-auto rounded-full bg-emerald-600 flex items-center justify-center text-white text-lg font-bold mb-3 shadow-sm">
        ✓
      </div>
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-600 mt-2 leading-relaxed max-w-xl mx-auto">{body}</p>
    </div>
  );
}

export function NoticeBanner({ children }: { children: ReactNode }) {
  return (
    <div className="bg-emerald-50 border border-emerald-300 rounded-xl px-4 py-2.5 shadow-sm">
      <p className="text-sm text-emerald-900 font-medium leading-snug">{children}</p>
    </div>
  );
}

// ── Overview dashboard ───────────────────────────────────────────────────────

export type OverviewStat = {
  label: string;
  value: ReactNode;
  /** Span 2 columns on large screens for long values */
  wide?: boolean;
};

const OVERVIEW_ICON: Record<DoshaTheme, string> = {
  pitru: "🪔",
  kaalsarpa: "🐍",
  chandal: "♃",
};

/** Full-width overview with equal metric tiles */
export function OverviewPanel({
  theme,
  title,
  stats,
}: {
  theme: DoshaTheme;
  title: string;
  stats: OverviewStat[];
}) {
  const t = THEME[theme];

  return (
    <section
      className={`rounded-xl border ${t.surfaceBorder} bg-white shadow-sm overflow-hidden`}
    >
      {/* Soft header — light tint, not a heavy solid bar */}
      <div
        className={`px-4 py-2.5 border-b ${t.surfaceBorder} bg-gradient-to-r ${t.surface} via-white to-white flex items-center gap-2.5`}
      >
        <span
          className={`w-7 h-7 rounded-lg ${t.bar} text-white text-sm flex items-center justify-center shadow-sm shrink-0`}
        >
          {OVERVIEW_ICON[theme]}
        </span>
        <h2 className={`text-xs font-bold uppercase tracking-widest ${t.heading}`}>{title}</h2>
      </div>

      {/* Metrics stretch across full width */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`px-4 py-3 min-w-0 flex-1 basis-[9rem] hover:bg-slate-50/50 transition-colors ${
              stat.wide ? "sm:flex-[1.4] lg:flex-[1.6]" : ""
            }`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
              {stat.label}
            </p>
            <div className="text-sm font-bold text-slate-900 leading-snug break-words">
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}


// ── Section divider between overview & details ───────────────────────────────

export function SectionDivider({ theme, label }: { theme: DoshaTheme; label: string }) {
  const t = THEME[theme];
  return (
    <div className="flex items-center gap-3">
      <span className={`h-px flex-1 ${t.surfaceBorder} border-t`} />
      <span className={`text-[11px] font-bold uppercase tracking-widest ${t.label}`}>{label}</span>
      <span className={`h-px flex-1 ${t.surfaceBorder} border-t`} />
    </div>
  );
}

// ── Content cards (white, left accent stripe) ────────────────────────────────

export function DetailsPanel({
  theme,
  title,
  children,
  className = "",
}: {
  theme?: DoshaTheme;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const accent = theme ? `border-l-4 ${THEME[theme].cardAccent}` : "border-l-4 border-l-slate-300";
  const headerBg = theme ? THEME[theme].cardHeader : "bg-slate-50 border-slate-200";

  return (
    <section
      className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${accent} ${className}`}
    >
      {title && (
        <div className={`px-4 py-2 border-b ${headerBg}`}>
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-700">{title}</h2>
        </div>
      )}
      <div className="px-4 py-3">{children}</div>
    </section>
  );
}

export function FactGrid({ cols = 2, children }: { cols?: 2 | 3 | 4; children: ReactNode }) {
  const colClass =
    cols === 4
      ? "grid-cols-2 lg:grid-cols-4"
      : cols === 3
        ? "grid-cols-2 lg:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2";
  return <dl className={`grid ${colClass} gap-x-6`}>{children}</dl>;
}

export function FactRow({
  label,
  value,
  fullWidth,
}: {
  label: string;
  value: ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`flex gap-3 py-2 border-b border-slate-100 last:border-b-0 ${
        fullWidth ? "col-span-full" : ""
      }`}
    >
      <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500 w-32 shrink-0 pt-0.5">
        {label}
      </dt>
      <dd className="text-sm font-semibold text-slate-900 leading-snug flex-1 min-w-0">{value}</dd>
    </div>
  );
}

export function TextBlock({
  label,
  children,
  last,
}: {
  label: string;
  children: ReactNode;
  last?: boolean;
}) {
  return (
    <div className={last ? "" : "mb-3 pb-3 border-b border-slate-100"}>
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">{label}</p>
      <div className="text-sm text-slate-800 leading-relaxed">{children}</div>
    </div>
  );
}

export function ReadableText({ text }: { text: string }) {
  const parts = text
    .split(/(?:\s*;\s*|\s*·\s*|\s*\|\s*)/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length <= 1) return <p>{text}</p>;

  return (
    <ul className="space-y-1.5 list-none">
      {parts.map((part, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-slate-400 mt-2" />
          <span>{part}</span>
        </li>
      ))}
    </ul>
  );
}

export function TagList({ theme, items }: { theme?: DoshaTheme; items: string[] }) {
  const cls = theme ? THEME[theme].tag : "bg-slate-100 text-slate-800 border-slate-200";
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${cls}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

export function Disclaimer({ text }: { text: string }) {
  return (
    <p className="text-[11px] text-slate-400 leading-snug text-center">{text}</p>
  );
}

// ── Layout ───────────────────────────────────────────────────────────────────

export function SplitLayout({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div className="space-y-4">{left}</div>
      <div className="space-y-4">{right}</div>
    </div>
  );
}

// ── Mitigations ──────────────────────────────────────────────────────────────

export function MitigationList({
  items,
  matchedLabel,
  notMatchedLabel,
  infoOnlyLabel,
  children,
}: {
  items: {
    factor: string;
    matched: boolean;
    detail: string;
    isInfo?: boolean;
    key: string;
  }[];
  matchedLabel: string;
  notMatchedLabel: string;
  infoOnlyLabel: string;
  children?: (key: string) => ReactNode;
}) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item.key}
          className={`rounded-lg border p-3 ${
            item.isInfo
              ? "bg-sky-50 border-sky-200"
              : item.matched
                ? "bg-emerald-50 border-emerald-200"
                : "bg-slate-50 border-slate-200"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <h3 className="text-sm font-bold text-slate-900">{item.factor}</h3>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                item.isInfo
                  ? "bg-sky-600 text-white"
                  : item.matched
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-400 text-white"
              }`}
            >
              {item.isInfo ? infoOnlyLabel : item.matched ? matchedLabel : notMatchedLabel}
            </span>
          </div>
          <p className="text-sm text-slate-700 leading-snug">{item.detail}</p>
          {children?.(item.key)}
        </li>
      ))}
    </ul>
  );
}

// ── Pitru finding card ───────────────────────────────────────────────────────

export function FindingCard({
  theme,
  index,
  title,
  meta,
  severity,
  fields,
}: {
  theme: DoshaTheme;
  index: number;
  title: string;
  meta?: string;
  severity?: string | null;
  fields: { label: string; value: string }[];
}) {
  const t = THEME[theme];
  return (
    <article className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden h-full flex flex-col">
      <div className={`px-3 py-2.5 border-b ${t.cardHeader}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <span
              className={`shrink-0 w-6 h-6 rounded-md ${t.bar} text-white text-[11px] font-bold flex items-center justify-center shadow-sm`}
            >
              {index}
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 leading-snug">{title}</h3>
              {meta && <p className="text-[11px] text-slate-600 mt-0.5 font-medium">{meta}</p>}
            </div>
          </div>
          {severity && <SeverityBadge severity={severity} />}
        </div>
      </div>
      <div className="px-3 py-2.5 space-y-2.5 flex-1">
        {fields.map((field, i) => (
          <TextBlock key={field.label} label={field.label} last={i === fields.length - 1}>
            <ReadableText text={field.value} />
          </TextBlock>
        ))}
      </div>
    </article>
  );
}

// ── Tabs ─────────────────────────────────────────────────────────────────────

export function SegmentTabs<T extends string>({
  theme,
  tabs,
  active,
  onChange,
}: {
  theme: DoshaTheme;
  tabs: { id: T; label: string; count?: number }[];
  active: T;
  onChange: (id: T) => void;
}) {
  const t = THEME[theme];
  return (
    <div className="inline-flex gap-1 p-1 bg-slate-200 rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
            active === tab.id ? t.tabActive : t.tabIdle
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`ml-1 ${active === tab.id ? "opacity-90" : "text-slate-500"}`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function OrbMeter({
  theme,
  degrees,
  strengthLabel,
  label,
}: {
  theme?: DoshaTheme;
  degrees: number;
  strengthLabel: string;
  label: string;
}) {
  const pct = Math.min(100, (degrees / 30) * 100);
  const fill = theme ? THEME[theme].orb : "bg-amber-600";
  return (
    <div className="bg-slate-50 rounded-lg border border-slate-200 p-3">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-bold text-slate-900">
          {label}: <span className="text-slate-700">{degrees.toFixed(1)}°</span>
        </span>
        <span className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
          {strengthLabel}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
        <div className={`h-full rounded-full ${fill} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
