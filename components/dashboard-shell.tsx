"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

interface DashboardShellProps {
  userEmail?: string | null;
  children: React.ReactNode;
}

export function DashboardShell({ userEmail, children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar (Desktop + Mobile Drawer) */}
      <Sidebar
        userEmail={userEmail}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with Hamburger Menu for Mobile */}
        <Header
          userEmail={userEmail}
          onMobileMenuToggle={() => setMobileOpen(true)}
        />

        {/* Page Content */}
        <main className="flex-1 p-3 sm:p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
