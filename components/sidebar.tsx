"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  FileSpreadsheet,
  Package,
  Users,
  Receipt,
  Wallet,
  BarChart3,
  Settings,
  Zap,
  LogOut,
  ChevronRight,
  X,
} from "lucide-react";
import { logout } from "@/app/login/actions";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", href: "/dashboard/projects", icon: FolderKanban },
  { name: "Quotations", href: "/dashboard/estimates", icon: FileSpreadsheet },
  { name: "Payments", href: "/dashboard/payments", icon: Wallet },
  { name: "Expenses", href: "/dashboard/expenses", icon: Receipt },
  { name: "Material List", href: "/dashboard/item-list", icon: ListChecks },
  { name: "Materials", href: "/dashboard/materials", icon: Package },
  { name: "Labour", href: "/dashboard/labour", icon: Users },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface SidebarProps {
  userEmail?: string | null;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ userEmail, mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  const content = (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-full select-none">
      {/* Brand Header */}
      <div>
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base leading-none">Electrician</h1>
              <span className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase">Pro Dashboard</span>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-thin">
          <p className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider my-2">
            Main Menu
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onMobileClose}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10 font-bold"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-slate-950" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-slate-950 opacity-70" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="truncate">
            <p className="text-xs font-semibold text-slate-200 truncate">
              {userEmail || "Electrician Pro"}
            </p>
            <p className="text-[10px] text-slate-500 truncate">Licensed Professional</p>
          </div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-800 transition-all active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:flex h-screen sticky top-0 z-30 shrink-0">
        {content}
      </aside>

      {/* Mobile Slide-Over Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onMobileClose}
          />
          {/* Drawer Content */}
          <div className="relative z-10 h-full max-w-xs w-full shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
