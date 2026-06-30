"use client";

import { type ReactNode } from "react";

// ── AuraAxis design tokens ───────────────────────────────────────────────────

export type DoshaTheme = "pitru" | "kaalsarpa" | "chandal";

export type PanelVariant = "default" | "causes" | "effects" | "remedies" | "recommendations";

const GLASS_CARD =
  "dosha-glass-card rounded-[32px] relative overflow-hidden transition-shadow duration-300 hover:shadow-[0_16px_40px_rgba(7,2,53,0.08)]";

const BENTO_CELL =
  "space-y-2 p-4 rounded-xl bg-white border border-[#c8c5d0]/25 shadow-sm min-w-0 overflow-hidden";

const REMEDY_DARK =
  "space-y-3 p-4 md:p-5 rounded-2xl bg-[#1e1b4b] text-[#e3dfff] w-full min-w-0";

const SECTION_TITLE =
  "dosha-font-display text-xl sm:text-2xl font-bold text-[#070235] tracking-tight drop-shadow-[0_1px_1px_rgba(7,2,53,0.08)]";

const OVERVIEW_TITLE =
  "dosha-font-display text-lg sm:text-xl font-bold uppercase tracking-[0.08em] text-[#070235]";

const CARD_INDEX_BADGE =
  "shrink-0 dosha-font-body text-xs sm:text-sm font-extrabold text-white bg-[#1e1b4b] px-3 py-1 rounded-full shadow-sm";

const CARD_SURFACE = GLASS_CARD;

type ThemeTokens = {
  pageBg: string;
  pageGlow: string;
  heroGradient: string;
  heroBorder: string;
  heroGlow: string;
  accent: string;
  accentSoft: string;
  accentText: string;
  gold: string;
  goldSoft: string;
  goldText: string;
  surface: string;
  surfaceBorder: string;
  label: string;
  heading: string;
  tabActive: string;
  tabIdle: string;
  spinner: string;
  statusPresent: string;
  statusAbsent: string;
  cardAccent: string;
  cardHeader: string;
  tag: string;
  orb: string;
  sectionIcon: string;
  heroIconClass: string;
};

function MaterialIcon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span className={`material-symbols-outlined shrink-0 ${className}`} aria-hidden>
      {name}
    </span>
  );
}

function parseListItems(text: string): string[] {
  return text
    .split(/(?:\s*;\s*|\s*·\s*|\s*\|\s*)/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function severityToPercent(severity: string): number {
  const s = severity.toLowerCase().trim();
  if (s.includes("very high")) return 92;
  if (s.includes("medium to high") || s.includes("medium-high")) return 75;
  if (s.includes("high")) return 82;
  if (s.includes("moderate")) return 62;
  if (s.includes("medium")) return 55;
  if (s.includes("mitigated")) return 38;
  if (s.includes("low")) return 32;
  return 50;
}

function RemedyBulletList({
  title,
  icon,
  items,
  compact = false,
  spanFull = false,
}: {
  title: string;
  icon: string;
  items: string[];
  compact?: boolean;
  spanFull?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <div className={`${REMEDY_DARK} ${spanFull ? "md:col-span-2" : ""}`}>
      <div className="flex items-center gap-2 min-w-0">
        <MaterialIcon
          name={icon}
          className={`${compact ? "text-lg" : "text-xl"} text-[#e8ddff] shrink-0`}
        />
        <h3
          className={`dosha-font-display font-bold text-white leading-snug break-words ${
            compact ? "text-sm" : "text-base sm:text-lg"
          }`}
        >
          {title}
        </h3>
      </div>
      <ul className={`grid gap-x-6 gap-y-2.5 ${compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 items-start min-w-0">
            <span className="w-2 h-2 rounded-full bg-white shrink-0 mt-[0.5rem]" />
            <span
              className={`dosha-font-body text-[#e3dfff] leading-relaxed break-words ${
                compact ? "text-xs sm:text-sm" : "text-sm"
              }`}
            >
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function KarmaIntensityMeter({ label, severity }: { label: string; severity: string }) {
  const pct = severityToPercent(severity);
  return (
    <div className="shrink-0 min-w-0 max-w-[55%] sm:max-w-none text-right">
      <div className="dosha-font-body text-xs sm:text-xs font-bold uppercase tracking-widest text-[#47464f] mb-1">
        {label}
      </div>
      <div className="flex items-center gap-2 flex-wrap justify-end">
        <div className="h-2.5 w-24 sm:w-28 bg-[#e5eeff] rounded-full overflow-hidden shrink-0">
          <div
            className="h-full bg-[#674bb5] rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span
          className="dosha-font-body text-xs sm:text-sm font-extrabold text-[#674bb5] break-words leading-tight"
          title={severity}
        >
          {severity}
        </span>
      </div>
    </div>
  );
}

function BentoTextCell({
  icon,
  iconColor,
  title,
  primary,
  secondary,
  bullets,
  compact = false,
}: {
  icon: string;
  iconColor: string;
  title: string;
  primary?: string;
  secondary?: string;
  bullets?: string[];
  compact?: boolean;
}) {
  return (
    <div className={`${BENTO_CELL} ${compact ? "!p-3.5 !space-y-2.5 min-w-0" : "min-w-0"}`}>
      <div className={`flex items-start gap-2.5 min-w-0 ${iconColor}`}>
        <MaterialIcon name={icon} className={compact ? "text-xl shrink-0" : "text-2xl shrink-0"} />
        <h3
          className={`dosha-font-display font-bold text-[#070235] leading-snug break-words ${
            compact ? "text-sm" : "text-lg"
          }`}
        >
          {title}
        </h3>
      </div>
      {primary && (
        <p
          className={`dosha-font-body text-[#47464f] leading-relaxed break-words ${
            compact ? "text-xs sm:text-sm" : "text-sm"
          }`}
        >
          {primary}
        </p>
      )}
      {secondary && (
        <p className="dosha-font-body text-xs text-[#47464f]/80 leading-relaxed break-words">{secondary}</p>
      )}
      {bullets && bullets.length > 0 && (
        <ul className="space-y-2">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#674bb5] shrink-0 mt-2" />
              <span className="dosha-font-body text-xs sm:text-sm font-semibold text-[#070235] break-words">{b}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const THEME: Record<DoshaTheme, ThemeTokens> = {
  pitru: {
    pageBg: "bg-[#f8f9ff]",
    pageGlow: "bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(171,143,254,0.14),transparent)]",
    heroGradient: "from-[#1e1b4b] via-[#312e81] to-[#4c1d95]",
    heroBorder: "border-indigo-400/15",
    heroGlow: "shadow-[0_12px_40px_-10px_rgba(49,46,129,0.5)]",
    accent: "bg-indigo-600",
    accentSoft: "bg-indigo-50/90",
    accentText: "text-indigo-900",
    gold: "text-amber-600",
    goldSoft: "bg-amber-50/90",
    goldText: "text-amber-900",
    surface: "bg-indigo-50/50",
    surfaceBorder: "border-indigo-200/60",
    label: "text-indigo-800",
    heading: "text-[#1e1b4b]",
    tabActive: "bg-[#312e81] text-white shadow-md shadow-indigo-900/20",
    tabIdle: "text-slate-600 hover:bg-white/90 hover:text-indigo-900 transition-colors duration-200",
    spinner: "border-indigo-200 border-t-indigo-700",
    statusPresent: "bg-amber-400 text-amber-950 border-amber-200/80 shadow-lg shadow-black/10 ring-2 ring-white/40",
    statusAbsent: "bg-emerald-400 text-emerald-950 border-emerald-200/80 shadow-lg shadow-black/10 ring-2 ring-white/40",
    cardAccent: "border-l-indigo-500",
    cardHeader: "bg-gradient-to-r from-indigo-50/80 via-white/90 to-white border-indigo-100/60",
    tag: "bg-indigo-50 text-indigo-900 border-indigo-200/60",
    orb: "bg-gradient-to-r from-indigo-600 to-violet-600",
    sectionIcon: "bg-gradient-to-br from-indigo-500 to-indigo-700",
    heroIconClass: "text-[#674bb5]",
  },
  kaalsarpa: {
    pageBg: "bg-[#f8f9ff]",
    pageGlow: "bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(171,143,254,0.14),transparent)]",
    heroGradient: "from-[#1e1b4b] via-[#4c1d95] to-[#6b21a8]",
    heroBorder: "border-violet-400/15",
    heroGlow: "shadow-[0_12px_40px_-10px_rgba(76,29,149,0.5)]",
    accent: "bg-violet-600",
    accentSoft: "bg-violet-50/90",
    accentText: "text-violet-900",
    gold: "text-amber-600",
    goldSoft: "bg-amber-50/90",
    goldText: "text-amber-900",
    surface: "bg-violet-50/50",
    surfaceBorder: "border-violet-200/60",
    label: "text-violet-800",
    heading: "text-[#1e1b4b]",
    tabActive: "bg-[#6b21a8] text-white shadow-md shadow-violet-900/20",
    tabIdle: "text-slate-600 hover:bg-white/90 hover:text-violet-900 transition-colors duration-200",
    spinner: "border-violet-200 border-t-violet-700",
    statusPresent: "bg-amber-400 text-amber-950 border-amber-200/80 shadow-lg shadow-black/10 ring-2 ring-white/40",
    statusAbsent: "bg-emerald-400 text-emerald-950 border-emerald-200/80 shadow-lg shadow-black/10 ring-2 ring-white/40",
    cardAccent: "border-l-violet-500",
    cardHeader: "bg-gradient-to-r from-violet-50/80 via-white/90 to-white border-violet-100/60",
    tag: "bg-violet-50 text-violet-900 border-violet-200/60",
    orb: "bg-gradient-to-r from-violet-600 to-purple-600",
    sectionIcon: "bg-gradient-to-br from-violet-500 to-violet-700",
    heroIconClass: "text-[#674bb5]",
  },
  chandal: {
    pageBg: "bg-[#f8f9ff]",
    pageGlow: "bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(171,143,254,0.12),transparent)]",
    heroGradient: "from-[#1e1b4b] via-[#4338ca] to-[#7c3aed]",
    heroBorder: "border-indigo-400/15",
    heroGlow: "shadow-[0_12px_40px_-10px_rgba(67,56,202,0.45)]",
    accent: "bg-indigo-600",
    accentSoft: "bg-indigo-50/90",
    accentText: "text-indigo-900",
    gold: "text-amber-600",
    goldSoft: "bg-amber-50/90",
    goldText: "text-amber-900",
    surface: "bg-indigo-50/50",
    surfaceBorder: "border-indigo-200/60",
    label: "text-indigo-800",
    heading: "text-[#1e1b4b]",
    tabActive: "bg-[#4338ca] text-white shadow-md shadow-indigo-900/20",
    tabIdle: "text-slate-600 hover:bg-white/90 hover:text-indigo-900 transition-colors duration-200",
    spinner: "border-indigo-200 border-t-indigo-700",
    statusPresent: "bg-amber-400 text-amber-950 border-amber-200/80 shadow-lg shadow-black/10 ring-2 ring-white/40",
    statusAbsent: "bg-emerald-400 text-emerald-950 border-emerald-200/80 shadow-lg shadow-black/10 ring-2 ring-white/40",
    cardAccent: "border-l-amber-500",
    cardHeader: "bg-gradient-to-r from-amber-50/60 via-indigo-50/40 to-white border-indigo-100/60",
    tag: "bg-amber-50 text-amber-900 border-amber-200/60",
    orb: "bg-gradient-to-r from-amber-500 to-amber-600",
    sectionIcon: "bg-gradient-to-br from-amber-500 to-amber-600",
    heroIconClass: "text-[#674bb5]",
  },
};

export function themeOf(theme: DoshaTheme): ThemeTokens {
  return THEME[theme];
}

// ── Severity badges ───────────────────────────────────────────────────────────

export function severityBadgeClass(severity: string): string {
  const s = severity.toLowerCase().trim();
  if (s.includes("strongly mitigated") || s.includes("mitigated")) {
    return "bg-emerald-600 text-white ring-2 ring-emerald-200/80 shadow-sm";
  }
  if (s.includes("very high")) return "bg-red-700 text-white ring-2 ring-red-200/80 shadow-sm";
  if (s.includes("medium to high") || s.includes("medium-high")) {
    return "bg-orange-600 text-white ring-2 ring-orange-200/80 shadow-sm";
  }
  if (s.includes("high")) return "bg-orange-600 text-white ring-2 ring-orange-200/80 shadow-sm";
  if (s.includes("moderate")) return "bg-amber-600 text-white ring-2 ring-amber-200/80 shadow-sm";
  if (s.includes("medium")) return "bg-yellow-600 text-amber-950 ring-2 ring-yellow-200/80 shadow-sm";
  if (s.includes("low")) return "bg-slate-500 text-white ring-2 ring-slate-200/80 shadow-sm";
  return "bg-slate-600 text-white ring-2 ring-slate-200/80 shadow-sm";
}

export function SeverityBadge({ severity, large }: { severity: string; large?: boolean }) {
  return (
    <span
      className={`inline-flex items-center font-extrabold rounded-full transition-transform duration-200 hover:scale-[1.02] ${severityBadgeClass(severity)} ${
        large ? "text-sm px-4 py-1.5" : "text-xs px-3 py-1"
      }`}
    >
      {severity}
    </span>
  );
}

// ── Shell & states ────────────────────────────────────────────────────────────

export function DoshaPanelShell({
  theme,
  children,
}: {
  theme: DoshaTheme;
  children: ReactNode;
}) {
  const t = THEME[theme];
  return (
    <div className={`dosha-scroll dosha-font-body flex-1 min-h-0 overflow-auto scroll-smooth relative ${t.pageBg}`}>
      <div className={`pointer-events-none absolute inset-0 ${t.pageGlow}`} aria-hidden />
      <div className="dosha-ethereal-glow top-0 -left-20" aria-hidden />
      <div className="dosha-ethereal-glow bottom-0 -right-20" aria-hidden />
      <div className="relative w-full max-w-none mx-auto px-3 py-4 sm:px-5 sm:py-6 lg:px-8 space-y-5 min-w-0">
        {children}
      </div>
    </div>
  );
}

export function DoshaLoading({ theme, message }: { theme: DoshaTheme; message: string }) {
  const t = THEME[theme];
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 min-h-[180px]">
      <div className={`w-10 h-10 rounded-full border-[3px] animate-spin ${t.spinner}`} />
      <p className="text-xs font-medium text-slate-600 animate-pulse">{message}</p>
    </div>
  );
}

export function DoshaError({ message }: { message: string }) {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <p className="text-xs text-red-800 bg-red-50/95 border border-red-200 rounded-xl px-4 py-2.5 shadow-sm">
        {message}
      </p>
    </div>
  );
}

// ── Hero header ─────────────────────────────────────────────────────────────

const HERO_ICON: Record<DoshaTheme, string> = {
  pitru: "🪔",
  kaalsarpa: "🐍",
  chandal: "🌟",
};

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
    <header className={`dosha-fade-up ${GLASS_CARD} p-5 md:p-6 min-w-0`}>
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#674bb5] to-[#1e1b4b]" />
      <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 min-w-0">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <span
            className={`shrink-0 w-12 h-12 rounded-2xl bg-[#1e1b4b]/10 border border-[#674bb5]/20 text-xl flex items-center justify-center ${t.heroIconClass}`}
          >
            {HERO_ICON[theme]}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="dosha-font-display text-xl sm:text-2xl font-bold text-[#070235] leading-tight break-words">
              {title}
            </h1>
          </div>
        </div>
        {present !== undefined && presentLabel && absentLabel && (
          <span
            className={`shrink-0 dosha-font-body text-sm sm:text-base font-bold px-6 py-2.5 sm:px-7 sm:py-3 rounded-full border transition-transform duration-200 hover:scale-[1.03] ${
              present ? t.statusPresent : t.statusAbsent
            }`}
          >
            {present ? presentLabel : absentLabel}
          </span>
        )}
      </div>
    </header>
  );
}

export function AbsentReport({ title, body }: { title: string; body: string }) {
  return (
    <div className={`dosha-fade-up dosha-fade-up-1 ${GLASS_CARD} px-6 py-8 text-center`}>
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-600" />
      <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500 flex items-center justify-center text-white mb-4 shadow-md">
        <MaterialIcon name="check" className="text-xl" />
      </div>
      <h2 className="dosha-font-display text-xl font-bold text-[#070235]">{title}</h2>
      <p className="dosha-font-body text-base text-[#47464f] mt-2 leading-relaxed max-w-lg mx-auto">{body}</p>
    </div>
  );
}

export function NoticeBanner({ children }: { children: ReactNode }) {
  return (
    <div className="dosha-fade-up dosha-fade-up-1 dosha-glass-card rounded-2xl px-4 py-3 border border-emerald-200/50">
      <p className="dosha-font-body text-sm text-emerald-900 font-semibold leading-snug flex items-start gap-2">
        <MaterialIcon name="info" className="text-emerald-600 text-base shrink-0" />
        <span>{children}</span>
      </p>
    </div>
  );
}

// ── Overview dashboard ────────────────────────────────────────────────────────

export type OverviewStat = {
  label: string;
  value: ReactNode;
  wide?: boolean;
  highlight?: boolean;
};

export function OverviewPanel({
  theme,
  title,
  stats,
  severityItems,
  footer,
}: {
  theme: DoshaTheme;
  title: string;
  stats: OverviewStat[];
  severityItems?: { label: string; severity: string }[];
  footer?: ReactNode;
}) {
  const primarySeverity = severityItems?.[0];

  return (
    <section className={`dosha-fade-up dosha-fade-up-1 ${GLASS_CARD} p-5 md:p-6 min-w-0`}>
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#674bb5] to-[#1e1b4b]" />
      <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-[#c8c5d0]/25 pb-5 mb-5 min-w-0">
        <div className="min-w-0 flex-1">
          <h2 className={`${OVERVIEW_TITLE} mb-3`}>{title}</h2>
          <div className="flex flex-wrap gap-2">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="inline-flex items-center gap-2 bg-[#070235]/5 px-3 py-1.5 rounded-full border border-[#070235]/10 min-w-0 max-w-full"
              >
                <MaterialIcon name="stars" className="text-xs text-[#674bb5] shrink-0" />
                <span className="dosha-font-body text-xs sm:text-sm font-bold text-[#070235] break-words">
                  {stat.label}: {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>
        {primarySeverity && (
          <KarmaIntensityMeter label={primarySeverity.label} severity={primarySeverity.severity} />
        )}
      </div>

      {severityItems && severityItems.length > 1 && (
        <div className="flex flex-wrap gap-3">
          {severityItems.slice(1).map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 bg-white rounded-xl border border-[#c8c5d0]/30 px-4 py-2"
            >
              <span className="dosha-font-body text-xs font-semibold uppercase tracking-wider text-[#47464f]">
                {item.label}
              </span>
              <SeverityBadge severity={item.severity} large />
            </div>
          ))}
        </div>
      )}

      {footer && <div className="mt-5 pt-5 border-t border-[#c8c5d0]/25">{footer}</div>}
    </section>
  );
}

export function SeverityStrip({
  theme,
  items,
}: {
  theme: DoshaTheme;
  items: { label: string; severity: string }[];
}) {
  if (items.length === 0) return null;
  const t = THEME[theme];
  return (
    <section
      className={`dosha-fade-up dosha-fade-up-2 ${CARD_SURFACE} rounded-2xl overflow-hidden ring-1 ring-inset ${t.surfaceBorder}`}
    >
      <div
        className={`px-4 py-2.5 border-b ${t.surfaceBorder} bg-gradient-to-r ${t.surface} via-white/90 to-white flex items-center gap-2.5`}
      >
        <span className={`relative flex w-2.5 h-2.5`}>
          <span className={`absolute inline-flex h-full w-full rounded-full ${t.accent} opacity-40 animate-ping`} />
          <span className={`relative inline-flex w-2.5 h-2.5 rounded-full ${t.accent} shadow-sm`} />
        </span>
        <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-700">
          Severity Analysis
        </h2>
      </div>
      <div className="flex flex-wrap gap-2.5 px-4 py-3 bg-gradient-to-b from-slate-50/60 to-white">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3.5 bg-white rounded-xl border border-slate-200/80 pl-4 pr-3 py-2.5 shadow-[0_2px_10px_-4px_rgba(30,27,75,0.1)] hover:shadow-[0_6px_16px_-6px_rgba(30,27,75,0.16)] hover:-translate-y-px transition-all duration-300"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {item.label}
            </span>
            <SeverityBadge severity={item.severity} large />
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Analysis toggle button ────────────────────────────────────────────────────

export function AnalysisToggleButton({
  theme,
  label,
  expanded,
  onToggle,
}: {
  theme: DoshaTheme;
  label: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className={`dosha-fade-up dosha-fade-up-2 w-full flex items-center justify-between gap-3 px-6 py-4 rounded-2xl ${GLASS_CARD} hover:shadow-[0_16px_40px_rgba(7,2,53,0.08)] transition-all duration-300 group`}
    >
      <span className={`${SECTION_TITLE} text-left flex items-center gap-2`}>
        <MaterialIcon name="analytics" className="text-[#674bb5]" />
        {label}
      </span>
      <span
        className={`shrink-0 w-9 h-9 rounded-xl bg-[#1e1b4b] flex items-center justify-center text-white shadow-md transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
      >
        <MaterialIcon name="expand_more" className="text-lg" />
      </span>
    </button>
  );
}

// ── Section divider ───────────────────────────────────────────────────────────

export function SectionDivider({ theme, label }: { theme: DoshaTheme; label: string }) {
  const t = THEME[theme];
  return (
    <div className="dosha-fade-up dosha-fade-up-2 flex items-center gap-2 py-1">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300/80 to-transparent" />
      <span className="text-[8px] text-amber-500/80">✦</span>
      <span
        className={`text-xs font-bold uppercase tracking-[0.18em] ${t.label} px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-sm border border-slate-200/70 shadow-[0_2px_8px_-2px_rgba(30,27,75,0.1)]`}
      >
        {label}
      </span>
      <span className="text-[8px] text-amber-500/80">✦</span>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300/80 to-transparent" />
    </div>
  );
}

// ── Content panels ────────────────────────────────────────────────────────────

export function DetailsPanel({
  theme,
  title,
  children,
  className = "",
  variant = "default",
  span = 1,
}: {
  theme?: DoshaTheme;
  title?: string;
  children: ReactNode;
  className?: string;
  variant?: PanelVariant;
  span?: 1 | 2;
}) {
  const iconMap: Record<PanelVariant, string> = {
    default: "info",
    causes: "balance",
    effects: "all_inclusive",
    remedies: "temple_buddhist",
    recommendations: "auto_awesome",
  };

  const iconColorMap: Record<PanelVariant, string> = {
    default: "text-[#674bb5]",
    causes: "text-[#674bb5]",
    effects: "text-[#674bb5]",
    remedies: "text-[#674bb5]",
    recommendations: "text-[#674bb5]",
  };

  if (variant === "remedies") {
    return <div className={`md:col-span-2 space-y-6 ${className}`}>{children}</div>;
  }

  if (span === 2) {
    return (
      <section className={`md:col-span-2 space-y-4 ${className}`}>
        {title && (
          <div className={`flex items-center gap-3 ${iconColorMap[variant]}`}>
            <MaterialIcon name={iconMap[variant]} className="text-2xl" />
            <h2 className={SECTION_TITLE}>{title}</h2>
          </div>
        )}
        <div className="dosha-font-body">{children}</div>
      </section>
    );
  }

  return (
    <section className={`${BENTO_CELL} min-w-0 overflow-hidden ${className}`}>
      {title && (
        <div className={`flex items-center gap-3 ${iconColorMap[variant]}`}>
          <MaterialIcon name={iconMap[variant]} className="text-2xl" />
          <h2 className={`${SECTION_TITLE}`}>{title}</h2>
        </div>
      )}
      <div className="dosha-font-body">{children}</div>
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
  return <dl className={`grid ${colClass} gap-x-3 gap-y-0`}>{children}</dl>;
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
      className={`flex gap-3 py-2.5 border-b border-[#c8c5d0]/20 last:border-b-0 ${
        fullWidth ? "col-span-full" : ""
      }`}
    >
      <dt className="dosha-font-body text-xs font-bold uppercase tracking-wider text-[#47464f] w-36 shrink-0 pt-0.5">
        {label}
      </dt>
      <dd className="dosha-font-body text-sm font-semibold text-[#070235] leading-snug flex-1 min-w-0">{value}</dd>
    </div>
  );
}

export function TextBlock({
  label,
  children,
  last,
  kind = "default",
}: {
  label: string;
  children: ReactNode;
  last?: boolean;
  kind?: "default" | "effect" | "remedy" | "recommendation";
}) {
  return (
    <div className={`${last ? "" : "mb-4 pb-4 border-b border-[#c8c5d0]/20"}`}>
      {kind !== "default" && (
        <p className="dosha-font-body text-xs font-bold uppercase tracking-wider mb-2 text-[#674bb5] flex items-center gap-1.5">
          {label}
        </p>
      )}
      <div className="dosha-font-body text-sm text-[#47464f] leading-relaxed">{children}</div>
    </div>
  );
}

export function ReadableText({
  text,
  bulletClass = "bg-slate-400",
}: {
  text: string;
  bulletClass?: string;
}) {
  const parts = text
    .split(/(?:\s*;\s*|\s*·\s*|\s*\|\s*)/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length <= 1) return <p className="text-sm leading-relaxed">{text}</p>;

  return (
    <ul className="space-y-2.5 list-none">
      {parts.map((part, i) => (
        <li key={i} className="flex gap-2.5 items-start">
          <span className={`shrink-0 w-2 h-2 rounded-full ${bulletClass} mt-[0.6rem]`} />
          <span className="text-sm leading-relaxed">{part}</span>
        </li>
      ))}
    </ul>
  );
}

export function RemediesGrid({
  conventional,
  modern,
  conventionalLabel,
  modernLabel,
}: {
  conventional?: string | null;
  modern?: string | null;
  conventionalLabel: string;
  modernLabel: string;
}) {
  const conventionalItems = conventional ? parseListItems(conventional) : [];
  const modernItems = modern ? parseListItems(modern) : [];

  return (
    <div className="space-y-4 min-w-0">
      {conventionalItems.length > 0 && (
        <RemedyBulletList
          title={conventionalLabel}
          icon="temple_buddhist"
          items={conventionalItems}
          spanFull
        />
      )}
      {modernItems.length > 0 && (
        <RemedyBulletList title={modernLabel} icon="checklist_rtl" items={modernItems} spanFull />
      )}
    </div>
  );
}

export function TagList({ theme, items }: { theme?: DoshaTheme; items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="dosha-font-body text-xs font-bold px-3 py-1.5 rounded-full border bg-[#070235]/5 text-[#070235] border-[#070235]/10"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function Disclaimer({ text }: { text: string }) {
  return (
    <p className="dosha-font-body text-xs text-[#47464f]/80 leading-relaxed text-center px-2 pt-4 border-t border-[#c8c5d0]/30">
      {text}
    </p>
  );
}

// ── Layout ───────────────────────────────────────────────────────────────────

export function SplitLayout({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
      <div className="space-y-2.5">{left}</div>
      <div className="space-y-2.5">{right}</div>
    </div>
  );
}

export function FlowLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`dosha-fade-up dosha-fade-up-3 ${GLASS_CARD} p-4 md:p-6 min-w-0`}>
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#674bb5] to-[#1e1b4b]" />
      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0 items-start">{children}</div>
    </div>
  );
}

export function FindingsSection({
  label,
  children,
}: {
  label?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={`${GLASS_CARD} p-4 md:p-5 min-w-0 dosha-fade-up dosha-fade-up-3`}>
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#674bb5] to-[#1e1b4b]" />
      {label && <div className="relative mb-4 min-w-0">{label}</div>}
      <div className="relative grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 min-w-0 items-start">
        {children}
      </div>
    </section>
  );
}

// ── Mitigations (causes) ──────────────────────────────────────────────────────

export function MitigationList({
  items,
  matchedLabel,
  notMatchedLabel,
  infoOnlyLabel,
  children,
  columns = 1,
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
  columns?: 1 | 2;
}) {
  const listClass =
    columns === 2
      ? "grid grid-cols-1 lg:grid-cols-2 gap-4 md:col-span-2"
      : "space-y-3 md:col-span-2";

  return (
    <ul className={listClass}>
      {items.map((item) => (
        <li
          key={item.key}
          className={`rounded-xl border border-[#c8c5d0]/25 p-3 bg-white/90 min-w-0 overflow-hidden ${
            item.isInfo
              ? "border-sky-200/60"
              : item.matched
                ? "border-emerald-200/60"
                : ""
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h3 className="dosha-font-body text-sm sm:text-base font-bold text-[#070235] leading-snug flex items-center gap-2 min-w-0">
              <MaterialIcon
                name={item.isInfo ? "info" : item.matched ? "check_circle" : "radio_button_unchecked"}
                className={`text-base ${item.matched ? "text-emerald-600" : "text-[#47464f]"}`}
              />
              {item.factor}
            </h3>
            <span
              className={`dosha-font-body text-xs sm:text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                item.isInfo
                  ? "bg-sky-100 text-sky-800"
                  : item.matched
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-[#e5eeff] text-[#47464f]"
              }`}
            >
              {item.isInfo ? infoOnlyLabel : item.matched ? matchedLabel : notMatchedLabel}
            </span>
          </div>
          <p className="dosha-font-body text-sm text-[#47464f] leading-relaxed">{item.detail}</p>
          {children?.(item.key)}
        </li>
      ))}
    </ul>
  );
}

// ── Pitru finding card ───────────────────────────────────────────────────────

export type FindingField = {
  label: string;
  value: string;
  kind?: "effect" | "remedy";
};

export function FindingCard({
  theme,
  index,
  title,
  meta,
  severity,
  fields,
  compact = false,
}: {
  theme: DoshaTheme;
  index: number;
  title: string;
  meta?: string;
  severity?: string | null;
  fields: FindingField[];
  compact?: boolean;
}) {
  const effectFields = fields.filter((f) => f.kind !== "remedy");
  const remedyFields = fields.filter((f) => f.kind === "remedy");

  const impactField = effectFields[0];
  const secondaryField = effectFields[1];
  const extraBullets = effectFields.slice(2).flatMap((f) => parseListItems(f.value));

  const conventional = remedyFields.find((f) =>
    f.label.toLowerCase().includes("conventional"),
  );
  const modern = remedyFields.find((f) => f.label.toLowerCase().includes("modern"));

  const metaParts = meta?.split(" · ") ?? [];

  return (
    <article
      className={`dosha-glass-card rounded-2xl relative overflow-hidden min-w-0 h-full flex flex-col ${
        compact ? "p-3 sm:p-4" : `${GLASS_CARD} p-5 md:p-6`
      }`}
    >
      {!compact && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#674bb5] to-[#1e1b4b]" />
      )}

      <div
        className={`relative flex flex-col gap-2.5 border-b border-[#c8c5d0]/25 min-w-0 ${
          compact ? "pb-3.5 mb-3.5" : "pb-5 mb-5"
        }`}
      >
        <div className="flex items-start justify-between gap-3 min-w-0">
          <span className={CARD_INDEX_BADGE}>#{index}</span>
          {severity && <KarmaIntensityMeter label="Karma Intensity" severity={severity} />}
        </div>
        <h3
          className={`dosha-font-display font-bold text-[#070235] leading-snug break-words ${
            compact ? "text-sm sm:text-base" : "text-lg sm:text-xl"
          }`}
        >
          {title}
        </h3>
        {metaParts.length > 0 && (
          <div className="flex flex-wrap gap-2 min-w-0">
            {metaParts.map((part, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border dosha-font-body text-xs sm:text-xs font-bold bg-[#070235]/5 border-[#070235]/10 text-[#070235] max-w-full break-words"
              >
                {part}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className={`grid gap-3 min-w-0 flex-1 ${compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
        {impactField && (
          <BentoTextCell
            icon="all_inclusive"
            iconColor="text-[#674bb5]"
            title={impactField.label}
            primary={parseListItems(impactField.value)[0] ?? impactField.value}
            secondary={
              parseListItems(impactField.value).length > 1
                ? parseListItems(impactField.value).slice(1).join(" · ")
                : undefined
            }
            bullets={extraBullets.length > 0 ? extraBullets : undefined}
            compact={compact}
          />
        )}
        {secondaryField && (
          <BentoTextCell
            icon="healing"
            iconColor="text-[#070235]"
            title={secondaryField.label}
            primary={parseListItems(secondaryField.value)[0] ?? secondaryField.value}
            bullets={
              parseListItems(secondaryField.value).length > 1
                ? parseListItems(secondaryField.value).slice(1)
                : undefined
            }
            compact={compact}
          />
        )}
        {conventional && (
          <RemedyBulletList
            title={conventional.label}
            icon="temple_buddhist"
            items={parseListItems(conventional.value)}
            compact={compact}
          />
        )}
        {modern && (
          <RemedyBulletList
            title={modern.label}
            icon="checklist_rtl"
            items={parseListItems(modern.value)}
            compact={compact}
          />
        )}
      </div>
    </article>
  );
}

export function SubsectionLabel({ theme, children }: { theme: DoshaTheme; children: ReactNode }) {
  return (
    <p className="dosha-font-display text-base sm:text-lg font-bold text-[#674bb5] flex items-center gap-2 min-w-0">
      <MaterialIcon name="folder_open" className="text-base shrink-0" />
      <span className="break-words">{children}</span>
    </p>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

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
  return (
    <div className="inline-flex gap-1 p-1 bg-[#e5eeff]/80 rounded-xl border border-[#c8c5d0]/30">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2.5 rounded-lg dosha-font-body text-sm font-bold transition-all duration-200 ${
            active === tab.id
              ? "bg-[#1e1b4b] text-white shadow-md"
              : "text-[#47464f] hover:bg-white/80 hover:text-[#070235]"
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`ml-1 tabular-nums ${active === tab.id ? "opacity-90" : "opacity-60"}`}>
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
  return (
    <div className="rounded-2xl border border-[#c8c5d0]/25 bg-white/80 p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="dosha-font-body text-sm font-bold text-[#070235]">
          {label}: <span className="text-[#47464f] font-semibold">{degrees.toFixed(1)}°</span>
        </span>
        <span className="dosha-font-body text-xs font-bold text-[#674bb5] bg-[#e5eeff] px-3 py-1 rounded-full">
          {strengthLabel}
        </span>
      </div>
      <div className="h-2 rounded-full bg-[#e5eeff] overflow-hidden">
        <div
          className="h-full rounded-full bg-[#674bb5] transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
