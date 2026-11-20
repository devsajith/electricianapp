"use client";

import { usePathname } from "next/navigation";
import { Search, Menu, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useHeader } from "@/components/header-context";
import { logout } from "@/app/login/actions";

interface HeaderProps {
  userEmail?: string | null;
  onMobileMenuToggle?: () => void;
}

export function Header({ userEmail, onMobileMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const { hasCustomHeader } = useHeader();

  const isDetailPage =
    /^\/dashboard\/(labour|projects)\/[^/]+$/.test(pathname) &&
    !pathname.endsWith("/new");
  const showCustom = isDetailPage || hasCustomHeader;

  // Format page title from pathname
  const getPageTitle = () => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length <= 1) return "Dashboard Overview";
    const current = segments[segments.length - 1];
    return current.charAt(0).toUpperCase() + current.slice(1);
  };

  return (
    <header className="h-16 shrink-0 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md px-3.5 sm:px-6 lg:px-8 flex items-center z-20 transition-colors">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-3">
        {showCustom ? (
          <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
            {/* Custom Slot rendered by HeaderSlot */}
            <div
              id="navbar-custom-content"
              className="flex-1 min-w-0 flex items-center justify-between gap-2"
            />

            {/* Persistent Utility Controls */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <ThemeToggle />

              <a
                href="/dashboard/settings"
                title="Settings"
                aria-label="Settings"
                className="hidden sm:flex h-9 px-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 items-center gap-2 text-xs font-semibold text-slate-200 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-[#1a73e8] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {userEmail ? userEmail.charAt(0).toUpperCase() : "E"}
                </div>
                <span className="hidden md:inline truncate max-w-[80px]">Settings</span>
              </a>

              <form action={logout}>
                <button
                  type="submit"
                  title="Log Out"
                  aria-label="Log Out"
                  className="h-9 px-2.5 sm:px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 flex items-center gap-1.5 text-xs font-semibold transition-all active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </form>
            </div>
          </div>
        ) : (
          <>
            {/* Left Title & Mobile Hamburger Menu Button */}
            <div className="flex items-center gap-3">
              {onMobileMenuToggle && (
                <button
                  type="button"
                  onClick={onMobileMenuToggle}
                  aria-label="Open Mobile Menu"
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 md:hidden transition-colors"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}

              <div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">
                  {getPageTitle()}
                </h2>
                <p className="text-[10px] sm:text-xs text-slate-400">Electrician Management Portal</p>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2.5 sm:gap-4">
              {/* Search Bar (Hidden on small mobile screens to save space) */}
              <div className="relative hidden md:block w-56 lg:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search projects, quotations..."
                  className="w-full pl-9 pr-4 py-1.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 transition-all"
                />
              </div>

              {/* Theme Toggle Button (Dark / Light) */}
              <ThemeToggle />

              {/* Top-Right Settings Button (Google Pay style avatar / gear) */}
              <a
                href="/dashboard/settings"
                title="Settings"
                aria-label="Settings"
                className="h-9 px-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 flex items-center gap-2 text-xs font-semibold text-slate-200 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-[#1a73e8] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {userEmail ? userEmail.charAt(0).toUpperCase() : "E"}
                </div>
                <span className="hidden sm:inline truncate max-w-[100px]">
                  Settings
                </span>
              </a>

              {/* Logout Button */}
              <form action={logout}>
                <button
                  type="submit"
                  title="Log Out"
                  aria-label="Log Out"
                  className="h-9 px-2.5 sm:px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 flex items-center gap-1.5 text-xs font-semibold transition-all active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
