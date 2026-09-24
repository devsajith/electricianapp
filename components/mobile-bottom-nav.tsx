"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FolderKanban,
  FileSpreadsheet,
  Wallet,
  Menu,
  Receipt,
  Package,
  Users,
  BarChart3,
  Settings,
  LogOut,
  X,
  Zap,
  Plus,
} from "lucide-react";
import { logout } from "@/app/login/actions";

interface MobileBottomNavProps {
  onQuickAction?: () => void;
}

export function MobileBottomNav({ onQuickAction }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const mainTabs = [
    {
      name: "Home",
      href: "/dashboard",
      icon: Home,
      exact: true,
    },
    {
      name: "Projects",
      href: "/dashboard/projects",
      icon: FolderKanban,
      badge: "Projects",
    },
    {
      name: "Estimates",
      href: "/dashboard/estimates",
      icon: FileSpreadsheet,
      badge: "Estimates",
    },
    {
      name: "Payments",
      href: "/dashboard/payments",
      icon: Wallet,
      badge: "Payments",
    },
  ];

  const moreItems = [
    {
      name: "Expenses",
      description: "Log job site expenses, fuel, and parts",
      href: "/dashboard/expenses",
      icon: Receipt,
      color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    },
    {
      name: "Materials",
      description: "Stock levels and inventory tracking",
      href: "/dashboard/materials",
      icon: Package,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      name: "Labour",
      description: "Workers, daily wages, and hours",
      href: "/dashboard/labour",
      icon: Users,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      name: "Reports",
      description: "Revenue, payments, and profit & loss",
      href: "/dashboard/reports",
      icon: BarChart3,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      name: "Settings",
      description: "Company profile and display preferences",
      href: "/dashboard/settings",
      icon: Settings,
      color: "text-slate-400 bg-slate-800 border-slate-700",
    },
  ];

  const isMoreActive = [
    "/dashboard/expenses",
    "/dashboard/materials",
    "/dashboard/labour",
    "/dashboard/reports",
    "/dashboard/settings",
    "/dashboard/item-list",
  ].some((path) => pathname.startsWith(path));

  return (
    <>
      {/* Sticky Bottom Navigation Bar for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 md:hidden px-2 py-1 shadow-2xl safe-area-pb">
        <div className="flex items-center justify-around">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href);

            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all min-w-[62px] min-h-[52px] ${
                  isActive
                    ? "text-amber-400 font-bold bg-amber-500/10"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-amber-400 stroke-[2.5]" : "text-slate-400"}`} />
                <span className="text-[11px] mt-1 font-semibold tracking-tight">{tab.name}</span>
              </Link>
            );
          })}

          {/* "More" Trigger Button */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all min-w-[62px] min-h-[52px] ${
              isMoreActive || moreOpen
                ? "text-amber-400 font-bold bg-amber-500/10"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Menu className="w-5 h-5 stroke-[2]" />
            <span className="text-[11px] mt-1 font-semibold tracking-tight">More</span>
          </button>
        </div>
      </nav>

      {/* "More" Bottom Sheet Modal for Mobile */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm md:hidden flex flex-col justify-end animate-in fade-in duration-200"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-250 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle & Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Electrician & Plumber Tools</h3>
                  <p className="text-xs text-slate-400">All modules & quick navigation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="p-2 rounded-full text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Menu Items List */}
            <div className="space-y-2">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all ${
                      isActive
                        ? "bg-amber-500/10 border-amber-500/40 text-white"
                        : "bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl border ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm text-slate-100">{item.name}</div>
                      <div className="text-xs text-slate-400 leading-tight">{item.description}</div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Logout Row */}
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold text-sm hover:bg-rose-500/20 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of App</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
