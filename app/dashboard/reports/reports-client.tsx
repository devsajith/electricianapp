"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  IndianRupee,
  Search,
  Filter,
  ArrowUpRight,
  Smartphone,
  Banknote,
  Building2,
  FileText,
  CreditCard,
  FolderKanban,
  CheckCircle2,
  Clock,
  Briefcase,
  Layers,
  ChevronRight,
  X,
  FileSpreadsheet,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Payment } from "@/lib/types/payment";
import { Expense } from "@/lib/types/expense";
import { Project } from "@/services/project.service";
import { Estimate } from "@/lib/types/estimate";

interface ReportsClientProps {
  initialPayments: Payment[];
  initialProjects: Project[];
  initialExpenses: Expense[];
  initialEstimates: Estimate[];
}

type TabType = "revenue" | "payments" | "pnl";

// Helper to format date string to YYYY-MM-DD
function toDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ReportsClient({
  initialPayments,
  initialProjects,
  initialExpenses,
  initialEstimates,
}: ReportsClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("revenue");

  // Determine default date range: "This Month"
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [startDate, setStartDate] = useState<string>(toDateStr(firstDayOfMonth));
  const [endDate, setEndDate] = useState<string>(toDateStr(lastDayOfMonth));
  const [selectedPreset, setSelectedPreset] = useState<string>("this_month");

  // Filters for Payments Report
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");

  // Voucher preview modal
  const [voucherPayment, setVoucherPayment] = useState<Payment | null>(null);

  // Quick preset handler
  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    const today = new Date();

    if (preset === "this_month") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setStartDate(toDateStr(start));
      setEndDate(toDateStr(end));
    } else if (preset === "last_month") {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      setStartDate(toDateStr(start));
      setEndDate(toDateStr(end));
    } else if (preset === "last_30_days") {
      const start = new Date(today);
      start.setDate(today.getDate() - 30);
      setStartDate(toDateStr(start));
      setEndDate(toDateStr(today));
    } else if (preset === "this_quarter") {
      const currentQuarter = Math.floor(today.getMonth() / 3);
      const start = new Date(today.getFullYear(), currentQuarter * 3, 1);
      const end = new Date(today.getFullYear(), (currentQuarter + 1) * 3, 0);
      setStartDate(toDateStr(start));
      setEndDate(toDateStr(end));
    } else if (preset === "ytd") {
      const start = new Date(today.getFullYear(), 0, 1);
      const end = new Date(today.getFullYear(), 11, 31);
      setStartDate(toDateStr(start));
      setEndDate(toDateStr(end));
    } else if (preset === "all_time") {
      setStartDate("");
      setEndDate("");
    }
  };

  const onCustomDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setSelectedPreset("custom");
  };

  // Helper date checker
  const isDateInRange = (dateStr?: string | null) => {
    if (!dateStr) return false;
    const cleanDate = dateStr.slice(0, 10);
    if (startDate && cleanDate < startDate) return false;
    if (endDate && cleanDate > endDate) return false;
    return true;
  };

  // ===================== REVENUE DATA COMPUTATIONS =====================
  // Filter payments within chosen date range
  const periodPayments = useMemo(() => {
    return initialPayments.filter((p) => isDateInRange(p.payment_date));
  }, [initialPayments, startDate, endDate]);

  // Filter expenses within chosen date range
  const periodExpenses = useMemo(() => {
    return initialExpenses.filter((e) => isDateInRange(e.expense_date));
  }, [initialExpenses, startDate, endDate]);

  const totalPeriodRevenue = useMemo(() => {
    return periodPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [periodPayments]);

  const totalPeriodExpenses = useMemo(() => {
    return periodExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [periodExpenses]);

  const netPeriodProfit = totalPeriodRevenue - totalPeriodExpenses;
  const periodProfitMargin =
    totalPeriodRevenue > 0
      ? ((netPeriodProfit / totalPeriodRevenue) * 100).toFixed(1)
      : "0.0";

  const avgPeriodTransaction =
    periodPayments.length > 0
      ? Math.round(totalPeriodRevenue / periodPayments.length)
      : 0;

  // Project-wise revenue breakdown
  const projectRevenueMap = useMemo(() => {
    const map: Record<
      string,
      {
        project: Project;
        periodRevenue: number;
        lifetimeRevenue: number;
        estimatedTotal: number;
      }
    > = {};

    // Initialize all projects
    initialProjects.forEach((prj) => {
      const pid = prj.id || prj.project_number;
      // Find estimate if any
      const est = initialEstimates.find(
        (e) => e.project_id === prj.id || e.project_name?.includes(prj.customer_name)
      );
      const estTotal = est ? Number(est.total) || 0 : 0;

      map[pid] = {
        project: prj,
        periodRevenue: 0,
        lifetimeRevenue: 0,
        estimatedTotal: estTotal,
      };
    });

    // Populate lifetime and period payments
    initialPayments.forEach((p) => {
      const pid = p.project_id;
      if (!map[pid]) {
        // Fallback create virtual project entry
        const fallbackProject: Project = {
          id: pid,
          project_number: p.projects?.project_number || "PRJ-GEN",
          customer_name: p.projects?.customer_name || "General Client",
          project_type: "Electrical Service",
          status: "In Progress",
        };
        map[pid] = {
          project: fallbackProject,
          periodRevenue: 0,
          lifetimeRevenue: 0,
          estimatedTotal: 0,
        };
      }

      const amt = Number(p.amount) || 0;
      map[pid].lifetimeRevenue += amt;

      if (isDateInRange(p.payment_date)) {
        map[pid].periodRevenue += amt;
      }
    });

    return Object.values(map);
  }, [initialProjects, initialPayments, initialEstimates, startDate, endDate]);

  // Revenue by Category / Project Type
  const revenueByType = useMemo(() => {
    const typeTotals: Record<string, number> = {};
    periodPayments.forEach((p) => {
      // Find matching project
      const proj = initialProjects.find(
        (pr) => pr.id === p.project_id || pr.project_number === p.projects?.project_number
      );
      const type = proj?.project_type || "General Electrical";
      typeTotals[type] = (typeTotals[type] || 0) + (Number(p.amount) || 0);
    });

    return Object.entries(typeTotals)
      .map(([type, amount]) => ({
        type,
        amount,
        percentage:
          totalPeriodRevenue > 0
            ? Math.round((amount / totalPeriodRevenue) * 100)
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [periodPayments, initialProjects, totalPeriodRevenue]);

  // Revenue Daily Timeline
  const revenueTimeline = useMemo(() => {
    const timelineMap: Record<string, { date: string; amount: number; count: number; clients: Set<string> }> = {};

    periodPayments.forEach((p) => {
      const d = p.payment_date || "Unknown";
      if (!timelineMap[d]) {
        timelineMap[d] = { date: d, amount: 0, count: 0, clients: new Set() };
      }
      timelineMap[d].amount += Number(p.amount) || 0;
      timelineMap[d].count += 1;
      if (p.projects?.customer_name) {
        timelineMap[d].clients.add(p.projects.customer_name);
      }
    });

    return Object.values(timelineMap).sort((a, b) => b.date.localeCompare(a.date));
  }, [periodPayments]);

  // ===================== PAYMENTS REPORT FILTERED DATA =====================
  const filteredPayments = useMemo(() => {
    return initialPayments.filter((p) => {
      const inDate = isDateInRange(p.payment_date);
      if (!inDate) return false;

      const matchesSearch =
        !searchQuery ||
        (p.projects?.customer_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.projects?.project_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.reference_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.notes || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.payment_method || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMethod =
        selectedMethod === "ALL" ||
        p.payment_method?.toLowerCase() === selectedMethod.toLowerCase();

      const matchesType =
        selectedType === "ALL" ||
        p.payment_type?.toLowerCase() === selectedType.toLowerCase();

      const matchesProject =
        selectedProjectId === "ALL" ||
        p.project_id === selectedProjectId ||
        p.projects?.project_number === selectedProjectId;

      return matchesSearch && matchesMethod && matchesType && matchesProject;
    });
  }, [
    initialPayments,
    startDate,
    endDate,
    searchQuery,
    selectedMethod,
    selectedType,
    selectedProjectId,
  ]);

  const paymentReportTotal = useMemo(() => {
    return filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [filteredPayments]);

  // Method distribution in filtered payments
  const methodDistribution = useMemo(() => {
    const dist: Record<string, { count: number; total: number }> = {};
    filteredPayments.forEach((p) => {
      const m = p.payment_method || "Other";
      if (!dist[m]) dist[m] = { count: 0, total: 0 };
      dist[m].count += 1;
      dist[m].total += Number(p.amount) || 0;
    });

    return Object.entries(dist)
      .map(([method, val]) => ({
        method,
        count: val.count,
        total: val.total,
        percentage:
          paymentReportTotal > 0
            ? Math.round((val.total / paymentReportTotal) * 100)
            : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredPayments, paymentReportTotal]);

  // ===================== PROFIT & LOSS EXPENSE BREAKDOWN =====================
  const pnlExpensesByCategory = useMemo(() => {
    const catMap: Record<string, number> = {};
    periodExpenses.forEach((e) => {
      const cat = e.category || "Miscellaneous";
      catMap[cat] = (catMap[cat] || 0) + (Number(e.amount) || 0);
    });

    return Object.entries(catMap)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage:
          totalPeriodExpenses > 0
            ? Math.round((amount / totalPeriodExpenses) * 100)
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [periodExpenses, totalPeriodExpenses]);

  // ===================== CSV EXPORT FUNCTIONS =====================
  const handleExportCSV = () => {
    if (activeTab === "revenue") {
      // Export Revenue Report
      const headers = [
        "Project Number",
        "Client Name",
        "Project Type",
        "Status",
        `Revenue in Period (${startDate || "All"} to ${endDate || "All"})`,
        "Lifetime Cumulative Paid",
        "Estimated Contract Value",
        "Remaining Balance",
      ];

      const rows = projectRevenueMap.map((item) => {
        const remaining = Math.max(
          0,
          item.estimatedTotal - item.lifetimeRevenue
        );
        return [
          `"${item.project.project_number}"`,
          `"${item.project.customer_name}"`,
          `"${item.project.project_type || ""}"`,
          `"${item.project.status || ""}"`,
          item.periodRevenue,
          item.lifetimeRevenue,
          item.estimatedTotal,
          remaining,
        ].join(",");
      });

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `revenue-report-${startDate || "all"}-to-${endDate || "all"}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Export Payment Report
      const headers = [
        "Payment Date",
        "Project Number",
        "Client Name",
        "Payment Type",
        "Payment Method",
        "Reference / UTR",
        "Amount (INR)",
        "Notes",
      ];

      const rows = filteredPayments.map((p) => [
        `"${p.payment_date || ""}"`,
        `"${p.projects?.project_number || ""}"`,
        `"${p.projects?.customer_name || ""}"`,
        `"${p.payment_type || ""}"`,
        `"${p.payment_method || ""}"`,
        `"${p.reference_number || ""}"`,
        p.amount,
        `"${(p.notes || "").replace(/"/g, '""')}"`,
      ].join(","));

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `payment-report-${startDate || "all"}-to-${endDate || "all"}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method?.toUpperCase()) {
      case "UPI":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Smartphone className="w-3 h-3" />
            UPI
          </span>
        );
      case "CASH":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Banknote className="w-3 h-3" />
            Cash
          </span>
        );
      case "BANK TRANSFER":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Building2 className="w-3 h-3" />
            Bank Wire
          </span>
        );
      case "CHEQUE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <FileText className="w-3 h-3" />
            Cheque
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <CreditCard className="w-3 h-3" />
            {method}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Print-specific style block */}
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          aside, header, nav, .no-print, button {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          .printable-report {
            background: white !important;
            color: black !important;
            border: none !important;
            box-shadow: none !important;
          }
          .printable-report * {
            color: black !important;
            border-color: #cbd5e1 !important;
            background: transparent !important;
          }
        }
      `}</style>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Business & Financial Reports</h1>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Audit & Ledger
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Track client payments, analyze project revenue streams, cash inflows, and net profit margins.
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export CSV</span>
          </Button>
          <Button
            onClick={() => window.print()}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 shadow-md"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </Button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2 no-print overflow-x-auto">
        <button
          onClick={() => setActiveTab("revenue")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "revenue"
              ? "bg-amber-500 text-slate-950 shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Revenue Report</span>
        </button>

        <button
          onClick={() => setActiveTab("payments")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "payments"
              ? "bg-emerald-500 text-slate-950 shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Payment Report</span>
        </button>

        <button
          onClick={() => setActiveTab("pnl")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "pnl"
              ? "bg-sky-500 text-slate-950 shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Profit & Loss Overview</span>
        </button>
      </div>

      {/* Universal Date Range & Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-3 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Date Period Filter:</span>
            <span className="text-xs text-slate-400">
              {startDate || endDate
                ? `${startDate || "Earliest"} → ${endDate || "Latest"}`
                : "All Time"}
            </span>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "this_month", label: "This Month" },
              { id: "last_month", label: "Last Month" },
              { id: "last_30_days", label: "Last 30 Days" },
              { id: "this_quarter", label: "This Quarter" },
              { id: "ytd", label: "Year to Date" },
              { id: "all_time", label: "All Time" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handlePresetChange(p.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  selectedPreset === p.id
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Pickers */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 border-t border-slate-800/60">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onCustomDateChange(e.target.value, endDate)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onCustomDateChange(startDate, e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {(startDate || endDate) && (
            <button
              onClick={() => handlePresetChange("all_time")}
              className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 self-center sm:self-auto ml-auto"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* ===================== TAB 1: REVENUE REPORT ===================== */}
      {activeTab === "revenue" && (
        <div className="space-y-6 printable-report">
          {/* Revenue KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Period Revenue</span>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-400 tracking-tight">
                ₹{totalPeriodRevenue.toLocaleString("en-IN")}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {periodPayments.length} client payments collected
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Period Expenses</span>
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-rose-400 tracking-tight">
                ₹{totalPeriodExpenses.toLocaleString("en-IN")}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {periodExpenses.length} operational expense logs
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Net Profit</span>
                <div
                  className={`p-1.5 rounded-lg border ${
                    netPeriodProfit >= 0
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  }`}
                >
                  {netPeriodProfit >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                </div>
              </div>
              <div
                className={`text-2xl font-black tracking-tight ${
                  netPeriodProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                ₹{netPeriodProfit.toLocaleString("en-IN")}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Revenue minus operational expenses
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Profit Margin</span>
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <BarChart3 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-amber-400 tracking-tight">
                {periodProfitMargin}%
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Net operational profit margin
              </p>
            </div>
          </div>

          {/* Revenue Breakdown by Project Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-amber-400" />
                  <span>Project Revenue Breakdown (Selected Period)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Detailed view of project billing, payments collected in this period, and outstanding balances.
                </p>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {projectRevenueMap.filter((p) => p.periodRevenue > 0).length} revenue-active jobs
              </span>
            </div>

            {/* Project Billing Table - Excel Spreadsheet Container */}
            <div className="rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950">
              {/* Excel Green Ribbon Bar */}
              <div className="bg-[#107c41] px-4 py-2 flex flex-wrap items-center justify-between text-white border-b border-emerald-800 text-xs">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                  <span className="font-bold tracking-wide">Project_Billing_Ledger.xlsx</span>
                  <span className="bg-emerald-900/60 text-emerald-200 text-[10px] px-2 py-0.5 rounded font-mono font-semibold">
                    AutoSave [ON]
                  </span>
                  <span className="text-[11px] text-emerald-100 hidden sm:inline ml-2">
                    Showing {projectRevenueMap.length} projects
                  </span>
                </div>
              </div>

              {/* Excel Grid Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[760px]">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-700">
                      <th className="py-2 px-3 w-12 text-center border-r border-slate-700/80 bg-slate-900/90 text-slate-500 font-mono select-none">
                        ◢
                      </th>
                      <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold">
                        <div className="text-[10px] text-emerald-400 font-mono">A</div>
                        PROJECT & CLIENT
                      </th>
                      <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold w-36">
                        <div className="text-[10px] text-emerald-400 font-mono">B</div>
                        CATEGORY
                      </th>
                      <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold text-right w-36">
                        <div className="text-[10px] text-emerald-400 font-mono">C</div>
                        PERIOD INFLOW
                      </th>
                      <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold text-right w-36">
                        <div className="text-[10px] text-emerald-400 font-mono">D</div>
                        CUMULATIVE PAID
                      </th>
                      <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold text-right w-36">
                        <div className="text-[10px] text-emerald-400 font-mono">E</div>
                        ESTIMATE TOTAL
                      </th>
                      <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold text-right w-36">
                        <div className="text-[10px] text-emerald-400 font-mono">F</div>
                        PENDING BALANCE
                      </th>
                      <th className="py-2.5 px-4 font-bold text-center w-36">
                        <div className="text-[10px] text-emerald-400 font-mono">G</div>
                        COLLECTION %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-xs font-mono">
                    {projectRevenueMap.map((item, idx) => {
                      const est = item.estimatedTotal;
                      const paid = item.lifetimeRevenue;
                      const pending = est > 0 ? Math.max(0, est - paid) : 0;
                      const percent = est > 0 ? Math.min(100, Math.round((paid / est) * 100)) : 100;

                      return (
                        <tr
                          key={item.project.id || item.project.project_number}
                          className="hover:bg-emerald-500/10 transition-colors group border-b border-slate-800/80"
                        >
                          {/* Row Index */}
                          <td className="py-2.5 px-3 text-center bg-slate-900/70 border-r border-slate-800 text-slate-400 select-none text-[11px] font-mono group-hover:text-emerald-400 group-hover:bg-emerald-950/30">
                            {idx + 1}
                          </td>

                          <td className="py-2.5 px-4 border-r border-slate-800 font-sans">
                            <div className="font-semibold text-slate-200">
                              {item.project.customer_name}
                            </div>
                            <div className="text-[11px] text-emerald-400 font-mono">
                              {item.project.project_number}
                            </div>
                          </td>

                          <td className="py-2.5 px-4 border-r border-slate-800 text-slate-400 font-sans">
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                              {item.project.project_type || "Wiring"}
                            </span>
                          </td>

                          <td className="py-2.5 px-4 border-r border-slate-800 text-right font-bold text-emerald-400">
                            {item.periodRevenue > 0 ? (
                              `₹${item.periodRevenue.toLocaleString("en-IN")}`
                            ) : (
                              <span className="text-slate-600 font-normal">₹0</span>
                            )}
                          </td>

                          <td className="py-2.5 px-4 border-r border-slate-800 text-right font-medium text-slate-300">
                            ₹{paid.toLocaleString("en-IN")}
                          </td>

                          <td className="py-2.5 px-4 border-r border-slate-800 text-right text-slate-400">
                            {est > 0 ? `₹${est.toLocaleString("en-IN")}` : "Unestimated"}
                          </td>

                          <td className="py-2.5 px-4 border-r border-slate-800 text-right">
                            {est > 0 ? (
                              pending === 0 ? (
                                <span className="text-emerald-400 font-bold">Settled</span>
                              ) : (
                                <span className="text-rose-400 font-semibold">
                                  ₹{pending.toLocaleString("en-IN")}
                                </span>
                              )
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>

                          <td className="py-2.5 px-4 text-center font-sans">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-1.5 rounded-full"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-mono text-slate-400">
                                {percent}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Accounting Totals Row */}
                  <tfoot>
                    <tr className="bg-slate-900/90 font-bold border-t-2 border-slate-700 border-b-4 border-double border-slate-600 text-xs">
                      <td className="py-3 px-3 text-center bg-slate-950 border-r border-slate-700 text-emerald-400 font-mono">
                        Σ
                      </td>
                      <td colSpan={2} className="py-3 px-4 border-r border-slate-700 text-slate-200 uppercase tracking-wider text-[11px] font-sans">
                        Total Billing ({projectRevenueMap.length} Projects)
                      </td>
                      <td className="py-3 px-4 border-r border-slate-700 text-right font-mono text-emerald-400 text-sm">
                        ₹{projectRevenueMap.reduce((s, p) => s + p.periodRevenue, 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 border-r border-slate-700 text-right font-mono text-slate-200">
                        ₹{projectRevenueMap.reduce((s, p) => s + p.lifetimeRevenue, 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 border-r border-slate-700 text-right font-mono text-slate-300">
                        ₹{projectRevenueMap.reduce((s, p) => s + p.estimatedTotal, 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 border-r border-slate-700 text-right font-mono text-rose-400">
                        ₹{projectRevenueMap.reduce((s, p) => s + (p.estimatedTotal > 0 ? Math.max(0, p.estimatedTotal - p.lifetimeRevenue) : 0), 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Bottom Sheet Tab & Status Bar */}
              <div className="bg-slate-900 border-t border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between text-[11px] text-slate-400 select-none">
                <div className="flex items-center gap-1">
                  <span className="px-3 py-1 bg-slate-950 text-emerald-400 font-semibold rounded-t border-t-2 border-emerald-500 border-x border-slate-800 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                    Sheet1 - Project Billing
                  </span>
                </div>
                <div className="flex items-center gap-4 font-mono text-[10px]">
                  <span>READY</span>
                  <span className="border-l border-slate-700 pl-3">PROJECTS: {projectRevenueMap.length}</span>
                  <span className="border-l border-slate-700 pl-3 text-emerald-400">
                    PERIOD INFLOW: ₹{projectRevenueMap.reduce((s, p) => s + p.periodRevenue, 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue by Project Type and Daily Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Revenue by Project Type */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-amber-400" />
                  <span>Revenue by Project Type</span>
                </h4>
                <span className="text-xs text-emerald-400 font-bold font-mono">
                  ₹{totalPeriodRevenue.toLocaleString("en-IN")}
                </span>
              </div>

              {revenueByType.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No revenue recorded in this period.</p>
              ) : (
                <div className="space-y-3">
                  {revenueByType.map((item) => (
                    <div key={item.type} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300 font-medium">{item.type}</span>
                        <div className="space-x-2">
                          <span className="text-slate-400 font-mono text-[11px]">{item.percentage}%</span>
                          <span className="font-bold text-white font-mono">
                            ₹{item.amount.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div
                          className="bg-amber-500 h-2 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Daily Inflow Timeline */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-400" />
                  <span>Revenue Collection Timeline</span>
                </h4>
                <span className="text-xs text-slate-400">{revenueTimeline.length} collection days</span>
              </div>

              {revenueTimeline.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No collections in this date range.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {revenueTimeline.map((item) => (
                    <div
                      key={item.date}
                      className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-200 font-mono flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{item.date}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">
                          {Array.from(item.clients).join(", ") || "Client payment"}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-black text-emerald-400 font-mono">
                          +₹{item.amount.toLocaleString("en-IN")}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {item.count} {item.count === 1 ? "receipt" : "receipts"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: PAYMENT REPORT ===================== */}
      {activeTab === "payments" && (
        <div className="space-y-6 printable-report">
          {/* Payment Report Filter Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-3 no-print">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Search Bar */}
              <div className="relative md:col-span-2">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search client, project number, UTR or reference..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Payment Method Selector */}
              <div>
                <select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="ALL">All Payment Modes</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Card">Card</option>
                </select>
              </div>

              {/* Payment Type Selector */}
              <div>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="ALL">All Payment Types</option>
                  <option value="Advance">Advance Deposit</option>
                  <option value="Milestone">Milestone Stage</option>
                  <option value="Final Settlement">Final Settlement</option>
                  <option value="Retention">Retention</option>
                  <option value="Full Payment">Full Payment</option>
                </select>
              </div>
            </div>

            {/* Project Filter */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
              <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">Filter by Project:</span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 max-w-xs"
              >
                <option value="ALL">All Projects</option>
                {initialProjects.map((p) => (
                  <option key={p.id || p.project_number} value={p.id || p.project_number}>
                    {p.project_number} - {p.customer_name}
                  </option>
                ))}
              </select>

              {(searchQuery || selectedMethod !== "ALL" || selectedType !== "ALL" || selectedProjectId !== "ALL") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedMethod("ALL");
                    setSelectedType("ALL");
                    setSelectedProjectId("ALL");
                  }}
                  className="text-[11px] text-slate-400 hover:text-rose-400 ml-auto flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Payment Report Financial KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Total Filtered</span>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-400 tracking-tight">
                ₹{paymentReportTotal.toLocaleString("en-IN")}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Sum of selected receipts</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Receipts Logged</span>
                <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white tracking-tight">
                {filteredPayments.length}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Verified receipts in range</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Average Receipt</span>
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-amber-400 tracking-tight">
                ₹{filteredPayments.length > 0 ? Math.round(paymentReportTotal / filteredPayments.length).toLocaleString("en-IN") : 0}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Per transaction size</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Top Mode</span>
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Smartphone className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-black text-white tracking-tight truncate">
                {methodDistribution[0]?.method || "None"}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {methodDistribution[0] ? `${methodDistribution[0].percentage}% of total collections` : "No payments"}
              </p>
            </div>
          </div>

          {/* Payment Method Distribution Bar */}
          {methodDistribution.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Payment Mode Distribution
                </span>
                <span className="text-xs text-slate-400">
                  {methodDistribution.length} payment channels used
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {methodDistribution.map((m) => (
                  <div key={m.method} className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                      <span className="font-semibold text-slate-200">{m.method}</span>
                      <span className="font-mono text-[11px] text-amber-400">{m.percentage}%</span>
                    </div>
                    <div className="text-base font-black text-emerald-400 font-mono">
                      ₹{m.total.toLocaleString("en-IN")}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {m.count} {m.count === 1 ? "transaction" : "transactions"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Payment Transaction Table - Excel Spreadsheet Container */}
          <div className="rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950">
            {/* Excel Green Ribbon Bar */}
            <div className="bg-[#107c41] px-4 py-2 flex flex-wrap items-center justify-between text-white border-b border-emerald-800 text-xs">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span className="font-bold tracking-wide">Payments_Ledger.xlsx</span>
                <span className="bg-emerald-900/60 text-emerald-200 text-[10px] px-2 py-0.5 rounded font-mono font-semibold">
                  AutoSave [ON]
                </span>
                <span className="text-[11px] text-emerald-100 hidden sm:inline ml-2">
                  Showing {filteredPayments.length} transactions
                </span>
              </div>
            </div>

            {filteredPayments.length === 0 ? (
              <div className="p-12 text-center">
                <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-white mb-1">No payment transactions match filters</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Try adjusting the date range, search query, or payment mode filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[760px]">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-700">
                      <th className="py-2 px-3 w-12 text-center border-r border-slate-700/80 bg-slate-900/90 text-slate-500 font-mono select-none">
                        ◢
                      </th>
                      <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold w-32">
                        <div className="text-[10px] text-emerald-400 font-mono">A</div>
                        DATE
                      </th>
                      <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold">
                        <div className="text-[10px] text-emerald-400 font-mono">B</div>
                        PROJECT & CUSTOMER
                      </th>
                      <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold w-40">
                        <div className="text-[10px] text-emerald-400 font-mono">C</div>
                        TYPE & MODE
                      </th>
                      <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold w-36">
                        <div className="text-[10px] text-emerald-400 font-mono">D</div>
                        REFERENCE / UTR
                      </th>
                      <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold">
                        <div className="text-[10px] text-emerald-400 font-mono">E</div>
                        NOTES
                      </th>
                      <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold text-right w-36">
                        <div className="text-[10px] text-emerald-400 font-mono">F</div>
                        AMOUNT (₹)
                      </th>
                      <th className="py-2.5 px-3 font-bold text-center w-16 no-print">
                        <div className="text-[10px] text-emerald-400 font-mono">G</div>
                        VOUCHER
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-xs font-mono">
                    {filteredPayments.map((p, idx) => (
                      <tr
                        key={p.id}
                        className="hover:bg-emerald-500/10 transition-colors group border-b border-slate-800/80"
                      >
                        {/* Row Index */}
                        <td className="py-2.5 px-3 text-center bg-slate-900/70 border-r border-slate-800 text-slate-400 select-none text-[11px] font-mono group-hover:text-emerald-400 group-hover:bg-emerald-950/30">
                          {idx + 1}
                        </td>

                        <td className="py-2.5 px-4 border-r border-slate-800 text-slate-300">
                          {p.payment_date}
                        </td>

                        <td className="py-2.5 px-4 border-r border-slate-800 font-sans">
                          <div className="font-semibold text-slate-200">
                            {p.projects?.customer_name || "Client"}
                          </div>
                          <div className="text-[11px] text-emerald-400 font-mono">
                            {p.projects?.project_number || "PRJ"}
                          </div>
                        </td>

                        <td className="py-2.5 px-4 border-r border-slate-800 font-sans">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              {p.payment_type || "Advance"}
                            </span>
                            {getMethodBadge(p.payment_method)}
                          </div>
                        </td>

                        <td className="py-2.5 px-4 border-r border-slate-800 text-slate-300">
                          {p.reference_number || <span className="text-slate-600">-</span>}
                        </td>

                        <td className="py-2.5 px-4 border-r border-slate-800 text-slate-400 max-w-xs truncate font-sans">
                          {p.notes || <span className="text-slate-600 italic">No notes</span>}
                        </td>

                        <td className="py-2.5 px-4 border-r border-slate-800 text-right font-black text-emerald-400 text-sm whitespace-nowrap">
                          ₹{Number(p.amount).toLocaleString("en-IN")}
                        </td>

                        <td className="py-2.5 px-3 text-center no-print font-sans">
                          <button
                            type="button"
                            onClick={() => setVoucherPayment(p)}
                            title="View / Print Voucher"
                            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  {/* Accounting Totals Row */}
                  <tfoot>
                    <tr className="bg-slate-900/90 font-bold border-t-2 border-slate-700 border-b-4 border-double border-slate-600 text-xs">
                      <td className="py-3 px-3 text-center bg-slate-950 border-r border-slate-700 text-emerald-400 font-mono">
                        Σ
                      </td>
                      <td colSpan={5} className="py-3 px-4 border-r border-slate-700 text-slate-200 uppercase tracking-wider text-[11px] font-sans">
                        Total Collections ({filteredPayments.length} transactions)
                      </td>
                      <td className="py-3 px-4 border-r border-slate-700 text-right font-mono text-emerald-400 text-sm">
                        ₹{paymentReportTotal.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-3 no-print"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Bottom Sheet Tab & Status Bar */}
            <div className="bg-slate-900 border-t border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between text-[11px] text-slate-400 select-none">
              <div className="flex items-center gap-1">
                <span className="px-3 py-1 bg-slate-950 text-emerald-400 font-semibold rounded-t border-t-2 border-emerald-500 border-x border-slate-800 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                  Sheet1 - Payments Ledger
                </span>
              </div>
              <div className="flex items-center gap-4 font-mono text-[10px]">
                <span>READY</span>
                <span className="border-l border-slate-700 pl-3">COUNT: {filteredPayments.length}</span>
                <span className="border-l border-slate-700 pl-3 text-emerald-400">
                  SUM: ₹{paymentReportTotal.toLocaleString("en-IN")}
                </span>
                {filteredPayments.length > 0 && (
                  <span className="border-l border-slate-700 pl-3 text-slate-300 hidden sm:inline">
                    AVERAGE: ₹{Math.round(paymentReportTotal / filteredPayments.length).toLocaleString("en-IN")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 3: PROFIT & LOSS OVERVIEW ===================== */}
      {activeTab === "pnl" && (
        <div className="space-y-6 printable-report">
          {/* Statement Header Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                  Income vs Operational Cost Statement
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  Financial Performance Summary
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Period: <span className="font-semibold text-slate-200">{startDate || "All"}</span> to{" "}
                  <span className="font-semibold text-slate-200">{endDate || "All"}</span>
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">
                  Net Operating Margin
                </span>
                <span
                  className={`text-2xl font-black font-mono ${
                    netPeriodProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {periodProfitMargin}%
                </span>
              </div>
            </div>
          </div>

          {/* Side by Side Income & Expense breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Income Stream */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">Gross Operating Revenue</h4>
                    <p className="text-[11px] text-slate-400">All client inflows received</p>
                  </div>
                </div>
                <div className="text-lg font-black text-emerald-400 font-mono">
                  ₹{totalPeriodRevenue.toLocaleString("en-IN")}
                </div>
              </div>

              <div className="space-y-3">
                {revenueByType.map((r) => (
                  <div key={r.type} className="flex justify-between items-center text-xs">
                    <span className="text-slate-300">{r.type}</span>
                    <span className="font-bold text-white font-mono">₹{r.amount.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Expense Stream */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">Operating Expenses</h4>
                    <p className="text-[11px] text-slate-400">Materials, tools, fuel, and labour</p>
                  </div>
                </div>
                <div className="text-lg font-black text-rose-400 font-mono">
                  ₹{totalPeriodExpenses.toLocaleString("en-IN")}
                </div>
              </div>

              {pnlExpensesByCategory.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No expenses in this period.</p>
              ) : (
                <div className="space-y-3">
                  {pnlExpensesByCategory.map((c) => (
                    <div key={c.category} className="flex justify-between items-center text-xs">
                      <span className="text-slate-300">{c.category}</span>
                      <span className="font-bold text-rose-400 font-mono">
                        ₹{c.amount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Net Profit Summary Box */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                Net Operating Result
              </span>
              <div
                className={`text-2xl font-black mt-1 ${
                  netPeriodProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                ₹{netPeriodProfit.toLocaleString("en-IN")}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Gross Inflow (₹{totalPeriodRevenue.toLocaleString("en-IN")}) - Outflows (₹
                {totalPeriodExpenses.toLocaleString("en-IN")})
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between gap-4 text-slate-400">
                <span>Revenue Margin:</span>
                <span className="font-bold text-white">{periodProfitMargin}%</span>
              </div>
              <div className="flex justify-between gap-4 text-slate-400">
                <span>Expense Ratio:</span>
                <span className="font-bold text-white">
                  {totalPeriodRevenue > 0
                    ? ((totalPeriodExpenses / totalPeriodRevenue) * 100).toFixed(1)
                    : "0"}
                  %
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Payment Voucher Modal */}
      {voucherPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">Payment Receipt Voucher</h3>
              </div>
              <button
                onClick={() => setVoucherPayment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 bg-slate-900 text-slate-200" id="printable-voucher">
              <div className="text-center pb-4 border-b border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Official Payment Confirmation
                </span>
                <div className="text-3xl font-black text-emerald-400 mt-1">
                  ₹{Number(voucherPayment.amount).toLocaleString("en-IN")}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Payment Date: <span className="font-semibold text-slate-200">{voucherPayment.payment_date}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Client / Customer</span>
                  <span className="font-semibold text-white">
                    {voucherPayment.projects?.customer_name || "Valued Client"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Project Reference</span>
                  <span className="font-mono font-semibold text-amber-400">
                    {voucherPayment.projects?.project_number || "Project"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Payment Type</span>
                  <span className="font-semibold text-amber-400">
                    {voucherPayment.payment_type || "Advance"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Payment Mode</span>
                  <span className="font-semibold text-white">{voucherPayment.payment_method}</span>
                </div>
                {voucherPayment.reference_number && (
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Transaction ID / UTR</span>
                    <span className="font-mono font-semibold text-slate-300">
                      {voucherPayment.reference_number}
                    </span>
                  </div>
                )}
                {voucherPayment.notes && (
                  <div className="py-2">
                    <span className="text-slate-400 block mb-1">Remarks:</span>
                    <p className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-slate-300 italic">
                      &ldquo;{voucherPayment.notes}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <span>Status: Verified & Audited</span>
                <span>Electrician App Accounting</span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setVoucherPayment(null)}
                className="border-slate-800 text-xs text-slate-300"
              >
                Close
              </Button>
              <Button
                onClick={() => window.print()}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Voucher</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
