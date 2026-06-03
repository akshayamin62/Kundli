"use client";

import { useRouter } from "next/navigation";
import AppLogo from "@/components/AppLogo";
import { clearAuth } from "@/lib/authStorage";

export type NavSection = "kundali" | "milan" | "history";

interface AppNavbarProps {
  active: NavSection;
  /** Home page: switch tab in place instead of navigating */
  onKundali?: () => void;
  onMilan?: () => void;
  borderClass?: string;
  fullWidth?: boolean;
}

export default function AppNavbar({
  active,
  onKundali,
  onMilan,
  borderClass = "border-gray-100",
  fullWidth = false,
}: AppNavbarProps) {
  const router = useRouter();

  const goKundali = () => {
    if (onKundali) {
      onKundali();
      return;
    }
    try { localStorage.setItem("jk_active_tab", "kundali"); } catch { /* ignore */ }
    router.push("/");
  };

  const goMilan = () => {
    if (onMilan) {
      onMilan();
      return;
    }
    try { localStorage.setItem("jk_active_tab", "milan"); } catch { /* ignore */ }
    router.push("/");
  };

  const goHistory = () => router.push("/history");

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const btn = (section: NavSection, onClick: () => void, children: React.ReactNode) => {
    const isActive = active === section;
    const base = "flex items-center gap-2 px-4 py-2 rounded-xl text-base font-semibold transition-all";
    if (section === "kundali") {
      return (
        <button
          type="button"
          onClick={onClick}
          className={`${base} ${isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`}
        >
          {children}
        </button>
      );
    }
    if (section === "milan") {
      return (
        <button
          type="button"
          onClick={onClick}
          className={`${base} ${isActive ? "bg-rose-50 text-rose-700" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`}
        >
          {children}
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} ${isActive ? "bg-amber-50 text-amber-800" : "text-gray-500 hover:text-amber-700 hover:bg-amber-50"}`}
      >
        {children}
      </button>
    );
  };

  return (
    <nav className={`bg-white border-b ${borderClass} sticky top-0 z-40`}>
      <div
        className={`${fullWidth ? "w-full" : "max-w-5xl mx-auto"} px-5 sm:px-8 h-20 flex items-center justify-between`}
      >
        <AppLogo href="/" height={75} priority={active === "kundali"} />

        <div className="flex items-center gap-1">
          {btn("kundali", goKundali, (
            <>
              <span>🪐</span>
              <span>Janma Kundali</span>
            </>
          ))}
          {btn("milan", goMilan, (
            <>
              <span>💞</span>
              <span>Kundli Milan</span>
            </>
          ))}
          {btn("history", goHistory, (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>History</span>
            </>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-base font-semibold text-red-500 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
