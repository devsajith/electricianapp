"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={resolvedTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle theme"
      className={`h-9 px-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all active:scale-95 ${
        resolvedTheme === "dark"
          ? "bg-slate-800/80 hover:bg-slate-800 border-slate-700/60 text-amber-400"
          : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800 shadow-sm"
      } ${className}`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {resolvedTheme === "dark" ? (
          <Moon className="w-4 h-4 text-amber-400 transition-transform rotate-0" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500 transition-transform rotate-0" />
        )}
      </div>

      {showLabel && (
        <span className="capitalize">{resolvedTheme === "dark" ? "Dark Mode" : "Light Mode"}</span>
      )}
    </button>
  );
}
