"use client";

import React, { useState } from "react";
import {
  Save,
  Sun,
  Moon,
  Laptop,
  Check,
  Building2,
  Palette,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

export function SettingsClient() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Settings form states
  const [companyName, setCompanyName] = useState("VoltCraft Electrical & Plumbing");
  const [licenseNumber, setLicenseNumber] = useState("ME-894102-TX");
  const [phone, setPhone] = useState("+91 98450 11223");
  const [hourlyRate, setHourlyRate] = useState("500");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const themes = [
    {
      id: "dark" as const,
      title: "Dark Theme",
      desc: "High contrast dark slate & gold, easy on eyes in dim light",
      icon: Moon,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      id: "light" as const,
      title: "Light Theme",
      desc: "Crisp white & clean gray, optimal for outdoor daylight",
      icon: Sun,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      id: "system" as const,
      title: "System Automatic",
      desc: "Syncs automatically with your mobile or PC device theme",
      icon: Laptop,
      color: "text-sky-400 bg-sky-500/10 border-sky-500/20",
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">App & Business Settings</h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Preferences
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Choose your preferred color theme, manage company info, and customize trade defaults.
          </p>
        </div>

        <Button
          onClick={handleSave}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 shadow-md active:scale-95"
        >
          {saved ? (
            <>
              <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
              <span>Saved!</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </>
          )}
        </Button>
      </div>

      {/* SECTION 1: COLOR THEME SELECTION */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Palette className="w-4 h-4 text-amber-400" />
            <span>Display Color Theme</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Switch between Dark and Light mode. Changes take effect across all screens immediately.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {themes.map((t) => {
            const Icon = t.icon;
            const isSelected = theme === t.id;

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={`p-4 rounded-xl border text-left transition-all active:scale-95 flex flex-col justify-between relative ${
                  isSelected
                    ? "border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20 shadow-md"
                    : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 p-1 rounded-full bg-amber-500 text-slate-950">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}

                <div className={`p-2.5 rounded-xl border w-fit mb-3 ${t.color}`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div>
                  <h3 className="font-bold text-sm text-white">{t.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-snug">{t.desc}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-mono">
                    {t.id === "system" ? `Active: ${resolvedTheme}` : t.id}
                  </span>
                  {isSelected && (
                    <span className="font-bold text-amber-400">Current</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: CONTRACTOR / BUSINESS PROFILE */}
      <form onSubmit={handleSave} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>Business Profile & License Info</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Appears on printed quotation estimates and client receipt vouchers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Contractor / Business Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Contact Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Trade License / Registration #
            </label>
            <input
              type="text"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Default Hourly Wage / Labour Rate (₹)
            </label>
            <input
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Profile details are active</span>
          </div>

          <Button
            type="submit"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Settings</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
