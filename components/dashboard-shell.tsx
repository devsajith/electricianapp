"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { QuickActionFAB } from "@/components/quick-action-fab";

interface DashboardShellProps {
  userEmail?: string | null;
  children: React.ReactNode;
}

export function DashboardShell({ userEmail, children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Sidebar (Desktop + Mobile Drawer Fallback) */}
      <Sidebar
        userEmail={userEmail}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with Hamburger Menu & User Profile */}
        <Header
          userEmail={userEmail}
          onMobileMenuToggle={() => setMobileOpen(true)}
        />

        {/* Page Content with safe padding for mobile bottom bar */}
        <main className="flex-1 p-3.5 sm:p-6 pb-28 md:pb-6 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Quick Action Floating Action Button (FAB) */}
      <QuickActionFAB />

      {/* Native App-Style Mobile Bottom Navigation Bar */}
      <MobileBottomNav />
    </div>
  );
}
