"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { QuickActionFAB } from "@/components/quick-action-fab";
import { HeaderProvider } from "@/components/header-context";

interface DashboardShellProps {
  userEmail?: string | null;
  children: React.ReactNode;
}

export function DashboardShell({ userEmail, children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <HeaderProvider>
      <div className="flex h-screen h-dvh w-full overflow-hidden bg-background text-foreground font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Sidebar (Desktop + Mobile Drawer Fallback) */}
      <Sidebar
        userEmail={userEmail}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Header with Hamburger Menu & User Profile */}
        <Header
          userEmail={userEmail}
          onMobileMenuToggle={() => setMobileOpen(true)}
        />

        {/* Page Content with safe padding for mobile bottom bar */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto overscroll-y-contain p-3 sm:p-5 md:p-6 pb-24 md:pb-8"
        >
          {children}
        </main>
      </div>

      {/* Quick Action Floating Action Button (FAB) */}
      <QuickActionFAB />

      {/* Native App-Style Mobile Bottom Navigation Bar */}
      <MobileBottomNav />
    </div>
    </HeaderProvider>
  );
}
