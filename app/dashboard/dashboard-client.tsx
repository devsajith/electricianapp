"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Wallet,
  Receipt,
  FileSpreadsheet,
  Plus,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  Calendar,
  IndianRupee,
  ArrowRight,
  Zap,
  MapPin,
  ChevronRight,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectRecord } from "@/app/dashboard/projects/actions";
import { Payment } from "@/lib/types/payment";
import { Expense } from "@/lib/types/expense";
import { Estimate } from "@/lib/types/estimate";
import { RecordPaymentModal } from "@/components/record-payment-modal";
import { RecordExpenseModal } from "@/components/record-expense-modal";
import { CreateProjectModal } from "@/app/dashboard/projects/create-project-modal";

interface DashboardClientProps {
  initialProjects: ProjectRecord[];
  initialPayments: Payment[];
  initialExpenses: Expense[];
  initialEstimates: Estimate[];
  userEmail?: string | null;
}

export function DashboardClient({
  initialProjects,
  initialPayments,
  initialExpenses,
  initialEstimates,
  userEmail,
}: DashboardClientProps) {
  // Modals state
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);

  // Financial Metrics Calculation
  const currentMonthPrefix = new Date().toISOString().substring(0, 7); // YYYY-MM

  // Total Money In this month
  const thisMonthPayments = initialPayments.filter((p) =>
    (p.payment_date || "").startsWith(currentMonthPrefix)
  );
  const totalMoneyInMonth = thisMonthPayments.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0
  );

  // Total Money In all time
  const totalMoneyInAllTime = initialPayments.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0
  );

  // Total Expenses this month
  const thisMonthExpenses = initialExpenses.filter((e) =>
    (e.expense_date || "").startsWith(currentMonthPrefix)
  );
  const totalMoneyOutMonth = thisMonthExpenses.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0
  );

  // Active Jobs count
  const activeJobs = initialProjects.filter(
    (p) =>
      p.status.toLowerCase().includes("progress") ||
      p.status.toLowerCase().includes("scheduled") ||
      p.status.toLowerCase().includes("pending")
  );

  // Total Pending Receivables: Estimated project values minus cumulative payments
  const totalReceivables = initialProjects.reduce((sum, p) => {
    const est = initialEstimates.find(
      (e) => e.project_id === p.id || e.project_name?.includes(p.customer_name)
    );
    const estTotal = est ? Number(est.total) || 0 : 0;
    const paid = initialPayments
      .filter((pay) => pay.project_id === p.id)
      .reduce((s, pay) => s + (Number(pay.amount) || 0), 0);
    return sum + (estTotal > paid ? estTotal - paid : 0);
  }, 0);

  // Recent combined transactions (Payments + Expenses) sorted by date
  const recentMovements = [
    ...initialPayments.map((p) => ({
      id: p.id,
      type: "INCOME" as const,
      title: p.projects?.customer_name || "Client Payment",
      sub: p.payment_method + (p.payment_type ? ` • ${p.payment_type}` : ""),
      amount: Number(p.amount) || 0,
      date: p.payment_date,
    })),
    ...initialExpenses.map((e) => ({
      id: e.id,
      type: "EXPENSE" as const,
      title: e.description || e.category,
      sub: e.customer_name ? `Job: ${e.customer_name}` : e.category,
      amount: Number(e.amount) || 0,
      date: e.expense_date,
    })),
  ]
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 5);

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("progress")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <Clock className="w-3 h-3" /> In Progress
        </span>
      );
    }
    if (s.includes("completed")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" /> Completed
        </span>
      );
    }
    if (s.includes("scheduled")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30">
          <Calendar className="w-3 h-3" /> Scheduled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Field Operations Welcome Header */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Zap className="w-3 h-3 fill-current" />
                Field Operations
              </span>
              <span className="text-xs text-slate-400">• Active</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Hello, {userEmail ? userEmail.split("@")[0] : "Electrician & Plumber"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Track ongoing work orders, collect client money, log fuel & parts expenses, and send instant quotations.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              onClick={() => {
                setSelectedProjectId(undefined);
                setPaymentModalOpen(true);
              }}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs gap-1.5 shadow-sm active:scale-95 py-2.5 px-4 rounded-xl"
            >
              <Wallet className="w-4 h-4" />
              <span>+ Record Payment</span>
            </Button>
            <Button
              onClick={() => setProjectModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 shadow-sm active:scale-95 py-2.5 px-4 rounded-xl"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Job</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Big High-Contrast Touch-Friendly KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Active Jobs */}
        <Link
          href="/dashboard/projects"
          className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 shadow-sm transition-all active:scale-98 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Jobs
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {activeJobs.length} <span className="text-sm font-semibold text-slate-400">Jobs</span>
            </div>
            <p className="text-[11px] text-amber-400 font-medium mt-1 flex items-center gap-1">
              <span>View all projects</span>
              <ArrowRight className="w-3 h-3" />
            </p>
          </div>
        </Link>

        {/* Card 2: Money In (This Month) */}
        <Link
          href="/dashboard/payments"
          className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 shadow-sm transition-all active:scale-98 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Payments Received
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
              ₹{totalMoneyInMonth.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Collected this month
            </p>
          </div>
        </Link>

        {/* Card 3: Expenses (Money Out) */}
        <Link
          href="/dashboard/expenses"
          className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 shadow-sm transition-all active:scale-98 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Expenses Paid
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-rose-400 tracking-tight">
              ₹{totalMoneyOutMonth.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Parts, fuel & labour expenses
            </p>
          </div>
        </Link>

        {/* Card 4: To Collect (Pending) */}
        <Link
          href="/dashboard/reports"
          className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 shadow-sm transition-all active:scale-98 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Pending Due
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
              {totalReceivables > 0 ? `₹${totalReceivables.toLocaleString("en-IN")}` : "All Clear"}
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Outstanding client balance
            </p>
          </div>
        </Link>
      </div>

      {/* Quick Trade Action Buttons Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
          Instant Field Actions
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => setProjectModalOpen(true)}
            className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-left transition-all active:scale-95 group"
          >
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white leading-tight">+ New Job</div>
              <div className="text-[10px] text-slate-400">Add project</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedProjectId(undefined);
              setPaymentModalOpen(true);
            }}
            className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-left transition-all active:scale-95 group"
          >
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white leading-tight">+ Record Payment</div>
              <div className="text-[10px] text-slate-400">Collect money</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedProjectId(undefined);
              setExpenseModalOpen(true);
            }}
            className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/40 text-left transition-all active:scale-95 group"
          >
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 group-hover:scale-105 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white leading-tight">+ Add Expense</div>
              <div className="text-[10px] text-slate-400">Parts, petrol, tea</div>
            </div>
          </button>

          <Link
            href="/dashboard/estimates/new"
            className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-left transition-all active:scale-95 group"
          >
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white leading-tight">+ New Quote</div>
              <div className="text-[10px] text-slate-400">Make estimate</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Main Field Grid: Recent Jobs + Cash Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column (2 Cols): Active & Recent Jobs Feed */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Current Jobs & Customer Work Orders
              </h2>
              <p className="text-xs text-slate-400">
                Manage ongoing jobs and record payments or expenses
              </p>
            </div>
            <Link
              href="/dashboard/projects"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>All Jobs ({initialProjects.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {initialProjects.slice(0, 4).map((p) => {
              const projPayments = initialPayments.filter((pay) => pay.project_id === p.id);
              const paidAmount = projPayments.reduce(
                (sum, pay) => sum + (Number(pay.amount) || 0),
                0
              );

              return (
                <div
                  key={p.id || p.project_number}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-3 hover:border-slate-700 transition-all"
                >
                  {/* Top line: Customer name, Job #, Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-white">
                          {p.customer_name}
                        </h3>
                        <span className="font-mono text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                          {p.project_number}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <span className="font-medium text-slate-300">{p.project_type}</span>
                        {p.customer_phone && (
                          <span className="text-slate-400 font-mono">
                            • {p.customer_phone}
                          </span>
                        )}
                        {p.address && (
                          <span className="hidden sm:inline text-slate-500 truncate max-w-xs">
                            • {p.address}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>{getStatusBadge(p.status)}</div>
                  </div>

                  {/* Financial Mini Bar on Card */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Total Inflow:</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        ₹{paidAmount.toLocaleString("en-IN")}
                      </span>
                    </div>

                    {p.work_description && (
                      <span className="text-[11px] text-slate-400 truncate max-w-[200px] hidden sm:inline">
                        &ldquo;{p.work_description}&rdquo;
                      </span>
                    )}
                  </div>

                  {/* Bottom Action Bar: Record Payment, Add Expense */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/60">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProjectId(p.id);
                        setPaymentModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold active:scale-95 transition-all"
                    >
                      + Payment
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProjectId(p.id);
                        setExpenseModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold active:scale-95 transition-all"
                    >
                      + Expense
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Money Flow Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight">Recent Transactions</h2>
            <Link
              href="/dashboard/reports"
              className="text-xs font-bold text-amber-400 hover:text-amber-300"
            >
              Reports
            </Link>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-3">
            {recentMovements.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                No recent payments or expenses logged yet.
              </p>
            ) : (
              recentMovements.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-xl border ${
                        item.type === "INCOME"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      }`}
                    >
                      {item.type === "INCOME" ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200 leading-tight">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.sub}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-xs font-mono font-black ${
                        item.type === "INCOME" ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {item.type === "INCOME" ? "+" : "-"}₹{item.amount.toLocaleString("en-IN")}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">{item.date}</div>
                  </div>
                </div>
              ))
            )}

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Lifetime Money Received:</span>
              <span className="font-bold text-emerald-400 font-mono">
                ₹{totalMoneyInAllTime.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        defaultProjectId={selectedProjectId}
        onSuccess={() => {
          setPaymentModalOpen(false);
          window.location.reload();
        }}
      />

      {/* Record Expense Modal */}
      <RecordExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        defaultProjectId={selectedProjectId}
        onSuccess={() => {
          setExpenseModalOpen(false);
          window.location.reload();
        }}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onSuccess={() => {
          setProjectModalOpen(false);
          window.location.reload();
        }}
      />
    </div>
  );
}
