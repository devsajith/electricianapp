"use client";

import React, { useState, useEffect, useTransition, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Wallet,
  Plus,
  Search,
  Building2,
  Smartphone,
  Banknote,
  Trash2,
  Calendar,
  IndianRupee,
  FolderKanban,
  TrendingUp,
  Receipt,
  X,
  Download,
  ChevronDown,
  ChevronUp,
  Users,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Payment } from "@/lib/types/payment";
import { getPaymentsAction, deletePaymentAction } from "@/app/dashboard/payments/actions";
import { getProjectsAction, ProjectRecord } from "@/app/dashboard/projects/actions";
import { RecordPaymentModal } from "@/components/record-payment-modal";

// Vibrant palette for contact avatars like Google Pay / Dashboard
const AVATAR_COLORS = [
  "bg-sky-600",
  "bg-orange-600",
  "bg-emerald-600",
  "bg-purple-600",
  "bg-rose-600",
  "bg-teal-600",
  "bg-indigo-600",
  "bg-amber-600",
  "bg-cyan-600",
  "bg-blue-600",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatDateHeader(dateStr?: string): string {
  if (!dateStr) return "Recent";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return "Today";
    }
    if (d.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string>("ALL");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showAllAvatars, setShowAllAvatars] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [, startTransition] = useTransition();

  const loadData = useCallback(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 2500);

    Promise.all([getPaymentsAction(), getProjectsAction()])
      .then(([payRes, projsRes]) => {
        clearTimeout(timer);
        setPayments(payRes.data || []);
        setProjects(projsRes || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load payments or projects:", err);
        clearTimeout(timer);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeletePayment = (id: string, refOrDesc: string) => {
    if (!confirm(`Are you sure you want to delete payment (${refOrDesc})?`)) return;

    startTransition(async () => {
      setPayments((prev) => prev.filter((p) => p.id !== id));
      if (!id.startsWith("sample-")) {
        await deletePaymentAction(id);
      }
    });
  };

  // Compute stats per project (total amount received, payment count)
  const projectPaymentStats = useMemo(() => {
    const stats: Record<string, { total: number; count: number }> = {};
    for (const p of projects) {
      if (p.id) {
        stats[p.id] = { total: 0, count: 0 };
      }
    }
    for (const pay of payments) {
      const pid = pay.project_id || pay.projects?.id;
      if (pid) {
        if (!stats[pid]) stats[pid] = { total: 0, count: 0 };
        stats[pid].total += Number(pay.amount) || 0;
        stats[pid].count += 1;
      }
    }
    return stats;
  }, [projects, payments]);

  // Filter projects for avatar grid based on search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase().trim();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.phone && p.phone.includes(q)) ||
        (p.place && p.place.toLowerCase().includes(q)) ||
        (p.type && p.type.toLowerCase().includes(q)) ||
        (p.project_number && p.project_number.toLowerCase().includes(q))
    );
  }, [projects, searchQuery]);

  // Displayed avatars (up to 7 if there are > 8 so 8th slot is "More", or all)
  const displayedAvatars = useMemo(() => {
    if (filteredProjects.length <= 8 || showAllAvatars) {
      return filteredProjects;
    }
    return filteredProjects.slice(0, 7);
  }, [filteredProjects, showAllAvatars]);

  // Filtered payments by search, method, and date range
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // Search filter
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        (p.projects?.name || "").toLowerCase().includes(q) ||
        (p.projects?.project_number || "").toLowerCase().includes(q) ||
        (p.projects?.place || "").toLowerCase().includes(q) ||
        (p.method || "").toLowerCase().includes(q);

      // Method filter
      const matchesMethod =
        selectedMethod === "ALL" ||
        p.method?.toLowerCase() === selectedMethod.toLowerCase();

      // Date range filter
      const matchesFromDate = !fromDate || (p.payment_date || "") >= fromDate;
      const matchesToDate = !toDate || (p.payment_date || "") <= toDate;

      return matchesSearch && matchesMethod && matchesFromDate && matchesToDate;
    });
  }, [payments, searchQuery, selectedMethod, fromDate, toDate]);

  // Group filtered payments chronologically by date
  const groupedPayments = useMemo(() => {
    const sorted = [...filteredPayments].sort(
      (a, b) => (b.payment_date || "").localeCompare(a.payment_date || "")
    );
    const groups: { header: string; items: Payment[] }[] = [];
    let currentHeader = "";
    let currentItems: Payment[] = [];

    for (const item of sorted) {
      const header = formatDateHeader(item.payment_date);
      if (header !== currentHeader) {
        if (currentItems.length > 0) {
          groups.push({ header: currentHeader, items: currentItems });
        }
        currentHeader = header;
        currentItems = [item];
      } else {
        currentItems.push(item);
      }
    }

    if (currentItems.length > 0) {
      groups.push({ header: currentHeader, items: currentItems });
    }

    return groups;
  }, [filteredPayments]);

  const totalFilteredReceived = useMemo(() => {
    return filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [filteredPayments]);

  // Overall Financial Metrics
  const totalReceived = useMemo(
    () => payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
    [payments]
  );
  const totalCount = payments.length;

  const currentMonthPrefix = useMemo(() => new Date().toISOString().substring(0, 7), []);
  const thisMonthReceived = useMemo(() => {
    return payments
      .filter((p) => (p.payment_date || "").startsWith(currentMonthPrefix))
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [payments, currentMonthPrefix]);

  const topMethod = useMemo(() => {
    const counts: Record<string, number> = {};
    payments.forEach((p) => {
      const m = p.method || "Cash";
      counts[m] = (counts[m] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Cash";
  }, [payments]);

  const exportToCsv = () => {
    if (filteredPayments.length === 0) return;
    const headers = [
      "Row",
      "Payment Date",
      "Client Name",
      "Project Ref",
      "Payment Method",
      "Amount (INR)",
    ];
    const rows = filteredPayments.map((p, idx) => [
      idx + 1,
      p.payment_date || "",
      `"${(p.projects?.name || "").replace(/"/g, '""')}"`,
      `"${(p.projects?.project_number || "").replace(/"/g, '""')}"`,
      `"${(p.method || "").replace(/"/g, '""')}"`,
      Number(p.amount) || 0,
    ]);
    const totalRow = ["SUM", "", "", "", "", totalFilteredReceived];
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(",")), totalRow.join(",")].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Payments_Ledger_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMethodBadge = (method: string) => {
    const m = (method || "").toUpperCase();
    if (m === "GPAY" || m === "UPI" || m === "GOOGLE PAY") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <Smartphone className="w-3 h-3" />
          GPay
        </span>
      );
    }
    if (m === "ACCOUNT TRANSFER" || m === "BANK TRANSFER") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
          <Building2 className="w-3 h-3" />
          Account Transfer
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
        <Banknote className="w-3 h-3" />
        Cash
      </span>
    );
  };

  const methodsList: { id: string; label: string }[] = [
    { id: "ALL", label: "All Modes" },
    { id: "Cash", label: "Cash" },
    { id: "GPay", label: "GPay" },
    { id: "Account Transfer", label: "Account Transfer" },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 select-none">
      {/* 1. Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Client Payments &amp; Inflows
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Live Tracker
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track client payment history, advance deposits, stage milestones, and settlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {filteredPayments.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={exportToCsv}
              className="border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs gap-1.5 h-9"
              title="Export filtered records to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
          )}

          <Button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-md h-9"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </Button>
        </div>
      </div>

      {/* 2. Top Search, Date Range & Payment Method Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-white dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client, project number, or mode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/50"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="p-1 rounded absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Filter (From Date - To Date) */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-800 text-xs">
            <Calendar className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-0.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none [color-scheme:light] dark:[color-scheme:dark] cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-0.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none [color-scheme:light] dark:[color-scheme:dark] cursor-pointer"
              />
            </div>
            {(fromDate || toDate) && (
              <button
                type="button"
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                }}
                title="Clear date range"
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white ml-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Payment Method Filter */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950/80 p-1 rounded-xl border border-slate-300 dark:border-slate-800 overflow-x-auto">
            {methodsList.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMethod(m.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  selectedMethod === m.id
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. KPI Financial Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#181a20] border border-slate-200 dark:border-[#282a33] shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Received</span>
            <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <IndianRupee className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight font-mono">
            ₹{totalReceived.toLocaleString("en-IN")}
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">Across all projects</p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#181a20] border border-slate-200 dark:border-[#282a33] shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">This Month</span>
            <div className="p-1 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-600 dark:text-sky-400 tracking-tight font-mono">
            ₹{thisMonthReceived.toLocaleString("en-IN")}
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">Current month collections</p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#181a20] border border-slate-200 dark:border-[#282a33] shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">Receipts Logged</span>
            <div className="p-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
            {totalCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">Verified payments</p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#181a20] border border-slate-200 dark:border-[#282a33] shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">Top Mode</span>
            <div className="p-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight truncate">
            {topMethod}
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">Most preferred mode</p>
        </div>
      </div>

      {/* 4. CLIENT AVATAR SELECTION SECTION (Exact match to user screen, without Add New Job) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#16181f] border border-slate-200 dark:border-[#282a33] shadow-sm space-y-4">
        {/* Section Title & Manage Link */}
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Projects
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Select client to view expenses and payments timeline
            </p>
          </div>
          <Link
            href="/dashboard/projects"
            className="text-xs font-bold text-blue-600 dark:text-[#8ab4f8] hover:underline"
          >
            Manage &gt;
          </Link>
        </div>

        {/* 4-Column Responsive Circular Avatar Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 gap-y-5 gap-x-2 sm:gap-x-4 pt-1">
          {displayedAvatars.map((p) => {
            const initial = p.name ? p.name.trim().charAt(0).toUpperCase() : "P";
            const colorClass = getAvatarColor(p.name);
            const stats = p.id ? projectPaymentStats[p.id] : null;

            return (
              <Link
                key={p.id || p.project_number}
                href={`/dashboard/projects/${p.id}?tab=timeline`}
                className="flex flex-col items-center group text-center transition-all hover:opacity-90 active:scale-95"
                title={`Open ${p.name}'s payment record screen`}
              >
                {/* Circle Avatar with White Bold Initial */}
                <div className="relative">
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${colorClass} flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-md transition-all group-hover:ring-4 ring-blue-400/50 group-hover:scale-105`}
                  >
                    {initial}
                  </div>
                </div>

                {/* Client Name under Circle (Bold) */}
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-2 truncate w-full px-1 group-hover:text-blue-600 dark:group-hover:text-[#8ab4f8] transition-colors">
                  {p.name}
                </span>

                {/* Work Type (e.g. Plumbing, Wiring & Plumbing) */}
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate w-full px-1 leading-tight">
                  {p.type || "Wiring"}
                </span>

                {/* Quick Payment Pill */}
                {stats && stats.total > 0 && (
                  <span className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ₹{stats.total.toLocaleString("en-IN")}
                  </span>
                )}
              </Link>
            );
          })}

          {/* "More" / "Less" toggle avatar if more than 8 clients */}
          {filteredProjects.length > 8 && (
            <button
              type="button"
              onClick={() => setShowAllAvatars((prev) => !prev)}
              className="flex flex-col items-center group text-center active:scale-95 transition-transform"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-100 dark:bg-[#1e2025] border border-slate-300 dark:border-[#2e323b] flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors shadow-xs">
                {showAllAvatars ? (
                  <ChevronUp className="w-6 h-6" />
                ) : (
                  <ChevronDown className="w-6 h-6" />
                )}
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2">
                {showAllAvatars ? "Less" : "More"}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {showAllAvatars ? "Show fewer" : "View all"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* 5. PAYMENTS TIMELINE & TRANSACTIONS FEED (Modern Card Feed replacing Excel Table) */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-7 w-7 border-2 border-emerald-500 border-t-transparent mb-3" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading client payment records...</p>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center mx-auto text-slate-400">
            <Wallet className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No payment records found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {searchQuery || selectedMethod !== "ALL" || fromDate || toDate
              ? "No payments match your current query or filters."
              : "No payments recorded yet. Click below to log the first client payment."}
          </p>

          <div className="flex items-center justify-center gap-2 pt-2">
            {(searchQuery || selectedMethod !== "ALL" || fromDate || toDate) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedMethod("ALL");
                  setFromDate("");
                  setToDate("");
                }}
                className="border-slate-300 dark:border-slate-800 text-xs"
              >
                Reset All Filters
              </Button>
            )}

            <Button
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Payment</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Feed Header with Result Count */}
          <div className="flex items-center justify-between px-1 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Showing <strong className="text-slate-900 dark:text-white font-bold">{filteredPayments.length}</strong> payments
            </span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              Total: ₹{totalFilteredReceived.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Grouped Payments Feed */}
          <div className="space-y-6">
            {groupedPayments.map((group, groupIdx) => (
              <div key={`group-${groupIdx}`} className="space-y-3">
                {/* Date Header Pill */}
                <div className="flex items-center justify-center py-1">
                  <div className="px-3.5 py-1 rounded-full bg-slate-100 dark:bg-[#181a20] border border-slate-200 dark:border-[#282a33] text-[11px] font-semibold text-slate-600 dark:text-slate-300 shadow-2xs">
                    {group.header}
                  </div>
                </div>

                {/* Payment Cards Grid */}
                <div className="space-y-2.5">
                  {group.items.map((payment) => {
                    const clientName = payment.projects?.name || "Client";
                    const initial = clientName.trim().charAt(0).toUpperCase();
                    const colorClass = getAvatarColor(clientName);
                    const amt = Number(payment.amount) || 0;

                    return (
                      <div
                        key={payment.id}
                        className="p-4 rounded-2xl bg-white dark:bg-[#181a20] border border-slate-200 dark:border-[#282b35] hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all shadow-xs flex items-center justify-between gap-3 group"
                      >
                        {/* Left: Client Avatar & Info */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Round Client Avatar */}
                          <div
                            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full ${colorClass} text-white font-bold flex items-center justify-center text-base sm:text-lg shadow-xs shrink-0`}
                          >
                            {initial}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate">
                                {clientName}
                              </span>
                              {payment.projects?.id && (
                                <Link
                                  href={`/dashboard/projects/${payment.projects.id}?tab=timeline`}
                                  className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-500 dark:hover:text-blue-400 font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
                                  title="View Project Timeline"
                                >
                                  {payment.projects.project_number || "Project"}
                                </Link>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                              {getMethodBadge(payment.method || "")}
                              <span>• {payment.payment_date}</span>
                              {payment.payment_info && (
                                <span className="text-slate-400 truncate max-w-[180px]">
                                  • {payment.payment_info}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Amount & Actions */}
                        <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
                          <div className="text-right">
                            <div className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                              +₹{amt.toLocaleString("en-IN")}
                            </div>
                            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">
                              Received
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {payment.projects?.id && (
                              <Link
                                href={`/dashboard/projects/${payment.projects.id}?tab=timeline`}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Open project timeline"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </Link>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                handleDeletePayment(payment.id, `${clientName} - ₹${payment.amount}`)
                              }
                              title="Delete Payment Record"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Summary Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#16181f] border border-slate-200 dark:border-[#282a33] flex items-center justify-between gap-3 text-xs shadow-xs flex-wrap">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>
                Total Filtered Volume:{" "}
                <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold text-sm">
                  ₹{totalFilteredReceived.toLocaleString("en-IN")}
                </strong>
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={exportToCsv}
              className="text-xs border-slate-300 dark:border-slate-800 gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProjectId(null);
        }}
        defaultProjectId={selectedProjectId || undefined}
        onSuccess={() => {
          loadData();
        }}
      />
    </div>
  );
}
