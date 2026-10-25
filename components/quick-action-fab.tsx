"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Plus,
  Wallet,
  Receipt,
  FolderKanban,
  FileSpreadsheet,
} from "lucide-react";
import { RecordPaymentModal } from "@/components/record-payment-modal";
import { RecordExpenseModal } from "@/components/record-expense-modal";
import { CreateProjectModal } from "@/app/dashboard/projects/create-project-modal";

export function QuickActionFAB() {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);

  // Hide FAB on detail views, creation forms, settings, reports, and home where it causes overlapping
  const shouldHideFAB =
    pathname === "/dashboard" ||
    pathname === "/dashboard/settings" ||
    pathname === "/dashboard/reports" ||
    pathname.startsWith("/dashboard/projects/") ||
    pathname.startsWith("/dashboard/estimates/") ||
    pathname.startsWith("/dashboard/item-list/") ||
    pathname.startsWith("/dashboard/materials/") ||
    (pathname.startsWith("/dashboard/labour/") && pathname !== "/dashboard/labour");

  if (shouldHideFAB) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-20 md:bottom-6 right-4 z-40 flex flex-col items-end gap-3 select-none no-print">
        {/* Quick Actions Speed Dial Menu */}
        {menuOpen && (
          <div
            className="flex flex-col items-end gap-2.5 mb-1 animate-in slide-in-from-bottom-5 fade-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Action 1: Record Payment */}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setPaymentModalOpen(true);
              }}
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 shadow-lg hover:bg-slate-800 active:scale-95 transition-all text-xs font-bold"
            >
              <span className="text-white text-xs">Record Payment</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Wallet className="w-4 h-4" />
              </div>
            </button>

            {/* Action 2: Add Expense */}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setExpenseModalOpen(true);
              }}
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-rose-400 shadow-lg hover:bg-slate-800 active:scale-95 transition-all text-xs font-bold"
            >
              <span className="text-white text-xs">Add Expense</span>
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                <Receipt className="w-4 h-4" />
              </div>
            </button>

            {/* Action 3: New Project */}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setProjectModalOpen(true);
              }}
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 shadow-lg hover:bg-slate-800 active:scale-95 transition-all text-xs font-bold"
            >
              <span className="text-white text-xs">New Project</span>
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <FolderKanban className="w-4 h-4" />
              </div>
            </button>

            {/* Action 4: New Quotation */}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                router.push("/dashboard/estimates/new");
              }}
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sky-400 shadow-lg hover:bg-slate-800 active:scale-95 transition-all text-xs font-bold"
            >
              <span className="text-white text-xs">Create Quotation</span>
              <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}

        {/* Main Plus Button */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Quick Actions"
          className={`h-12 w-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 border ${
            menuOpen
              ? "bg-slate-800 border-slate-700 text-white rotate-45"
              : "bg-amber-500 hover:bg-amber-400 border-amber-400 text-slate-950 font-bold"
          }`}
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Backdrop overlay when menu is open */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-xs no-print"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Modals triggered from FAB */}
      <RecordPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={() => {
          setPaymentModalOpen(false);
          router.refresh();
        }}
      />

      <RecordExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onSuccess={() => {
          setExpenseModalOpen(false);
          router.refresh();
        }}
      />

      <CreateProjectModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onSuccess={() => {
          setProjectModalOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}
