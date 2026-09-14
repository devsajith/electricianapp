"use client";

import { usePathname } from "next/navigation";
import { Search, Menu } from "lucide-react";

interface HeaderProps {
  userEmail?: string | null;
  onMobileMenuToggle?: () => void;
}

export function Header({ userEmail, onMobileMenuToggle }: HeaderProps) {
  const pathname = usePathname();

  // Format page title from pathname
  const getPageTitle = () => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length <= 1) return "Dashboard Overview";
    const current = segments[segments.length - 1];
    return current.charAt(0).toUpperCase() + current.slice(1);
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/70 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
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
            placeholder="Search projects, estimates..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 transition-all"
          />
        </div>

        {/* User Badge */}
        <div className="h-9 px-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-2 text-xs font-semibold text-slate-200">
          <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
            {userEmail ? userEmail.charAt(0).toUpperCase() : "E"}
          </div>
          <span className="hidden sm:inline truncate max-w-[100px]">
            {userEmail ? userEmail.split("@")[0] : "Electrician"}
          </span>
        </div>
      </div>
    </header>
  );
}
