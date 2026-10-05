"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
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
  FileSpreadsheet,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Payment } from "@/lib/types/payment";
import { getPaymentsAction, deletePaymentAction } from "@/app/dashboard/payments/actions";
import { RecordPaymentModal } from "@/components/record-payment-modal";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string>("ALL");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [, startTransition] = useTransition();

  const loadPayments = useCallback(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 2500);

    getPaymentsAction()
      .then((res) => {
        clearTimeout(timer);
        if (res.data && res.data.length > 0) {
          setPayments(res.data);
        } else {
          setPayments([]);
        }
        setLoading(false);
      })
      .catch(() => {
        clearTimeout(timer);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 2500);

    getPaymentsAction()
      .then((res) => {
        clearTimeout(timer);
        if (isMounted) {
          setPayments(res.data || []);
          setLoading(false);
        }
      })
      .catch(() => {
        clearTimeout(timer);
        if (isMounted) {
          setPayments([]);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  const handleDeletePayment = (id: string, refOrDesc: string) => {
    if (!confirm(`Are you sure you want to delete payment (${refOrDesc})?`)) return;

    startTransition(async () => {
      setPayments((prev) => prev.filter((p) => p.id !== id));

      if (!id.startsWith("sample-")) {
        await deletePaymentAction(id);
      }
    });
  };

  // Filtered payments by search, method, and date range (From Date -> To Date)
  const filteredPayments = payments.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (p.projects?.name || "").toLowerCase().includes(q) ||
      (p.projects?.project_number || "").toLowerCase().includes(q) ||
      (p.method || "").toLowerCase().includes(q);

    const matchesMethod =
      selectedMethod === "ALL" ||
      p.method?.toLowerCase() === selectedMethod.toLowerCase();

    const matchesFromDate = !fromDate || (p.payment_date || "") >= fromDate;
    const matchesToDate = !toDate || (p.payment_date || "") <= toDate;

    return matchesSearch && matchesMethod && matchesFromDate && matchesToDate;
  });

  const totalFilteredReceived = filteredPayments.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0
  );

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

  // Financial Metrics
  const totalReceived = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalCount = payments.length;

  const currentMonthPrefix = new Date().toISOString().substring(0, 7); // YYYY-MM
  const thisMonthReceived = payments
    .filter((p) => (p.payment_date || "").startsWith(currentMonthPrefix))
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Top payment method calculation
  const methodCounts: Record<string, number> = {};
  payments.forEach((p) => {
    const m = p.method || "Cash";
    methodCounts[m] = (methodCounts[m] || 0) + 1;
  });
  const topMethod = Object.entries(methodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Cash";

  const getMethodBadge = (method: string) => {
    const m = (method || "").toUpperCase();
    if (m === "GPAY" || m === "UPI" || m === "GOOGLE PAY") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Smartphone className="w-3 h-3" />
          GPay
        </span>
      );
    }
    if (m === "ACCOUNT TRANSFER" || m === "BANK TRANSFER") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
          <Building2 className="w-3 h-3" />
          Account Transfer
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Client Payments & Inflows</h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Tracker
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Track client payment history, advance deposits, stage milestones, and settlements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs gap-1.5 shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </Button>
        </div>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Received</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 tracking-tight">
            ₹{totalReceived.toLocaleString("en-IN")}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Across all project client accounts</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">This Month</span>
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-sky-400 tracking-tight">
            ₹{thisMonthReceived.toLocaleString("en-IN")}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Collections in current month</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Receipts Logged</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">{totalCount}</div>
          <p className="text-[10px] text-slate-500 mt-1">Verified payment transactions</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Top Payment Mode</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-white tracking-tight truncate">{topMethod}</div>
          <p className="text-[10px] text-slate-500 mt-1">Most preferred by clients</p>
        </div>
      </div>

      {/* Search, Date & Method Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by client, project number, or mode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Filter (From Date - To Date) */}
          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[11px] text-slate-400 font-medium">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 [color-scheme:dark] cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[11px] text-slate-400 font-medium">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 [color-scheme:dark] cursor-pointer"
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
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white ml-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Payment Method Filter */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 overflow-x-auto">
            {methodsList.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMethod(m.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  selectedMethod === m.id
                    ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-7 w-7 border-2 border-emerald-500 border-t-transparent mb-3" />
          <p className="text-xs text-slate-400">Loading client payment records...</p>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-3 text-slate-500">
            <Wallet className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">No payment records found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            {searchQuery || selectedMethod !== "ALL" || fromDate || toDate
              ? `No payments match your current query${
                  fromDate && toDate
                    ? ` between ${fromDate} and ${toDate}`
                    : fromDate
                    ? ` from ${fromDate}`
                    : toDate
                    ? ` up to ${toDate}`
                    : ""
                }.`
              : "No payments recorded yet. Click below to log the first client payment."}
          </p>
          <div className="flex items-center justify-center gap-2">
            {(searchQuery || selectedMethod !== "ALL" || fromDate || toDate) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedMethod("ALL");
                  setFromDate("");
                  setToDate("");
                }}
                className="border-slate-800 text-xs text-slate-300"
              >
                Reset Filters
              </Button>
            )}
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Payment</span>
            </Button>
          </div>
        </div>
      ) : (
        /* EXCEL-STYLE WORKBOOK TABLE VIEW */
        <div className="rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950">
          {/* Excel Title & Quick Export Ribbon */}
          <div className="bg-[#107c41] px-4 py-2 flex items-center justify-between text-white border-b border-emerald-800">
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded bg-white/10 text-white flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              </div>
              <span className="font-semibold text-xs tracking-wide">
                Payments_Ledger.xlsx - Received Client Payments
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white/15 text-emerald-100 font-medium">
                AutoSave: On
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={exportToCsv}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-white/15 hover:bg-white/25 active:bg-white/30 text-white text-xs font-semibold transition-all border border-white/20 shadow-sm"
                title="Download CSV to open in Microsoft Excel"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export Excel (.CSV)</span>
                <span className="sm:hidden">CSV</span>
              </button>
            </div>
          </div>

          {/* Spreadsheet Table Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px] font-sans">
              <thead>
                {/* Excel Column Letters & Column Header */}
                <tr className="bg-slate-900 border-b border-slate-700 text-slate-300 text-[11px] font-mono select-none">
                  {/* Corner index cell ◢ */}
                  <th className="w-12 py-2 px-2 text-center border-r border-slate-700/80 bg-slate-900 text-slate-500 font-bold text-[10px]">
                    ◢
                  </th>
                  <th className="py-2 px-3 border-r border-slate-700/80 font-bold tracking-wider">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-normal mr-1">A</span>
                      <span className="text-white font-bold">DATE</span>
                    </div>
                  </th>
                  <th className="py-2 px-3 border-r border-slate-700/80 font-bold tracking-wider">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-normal mr-1">B</span>
                      <span className="text-white font-bold">CLIENT / CUSTOMER</span>
                    </div>
                  </th>
                  <th className="py-2 px-3 border-r border-slate-700/80 font-bold tracking-wider">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-normal mr-1">C</span>
                      <span className="text-white font-bold">PROJECT REF</span>
                    </div>
                  </th>
                  <th className="py-2 px-3 border-r border-slate-700/80 font-bold tracking-wider">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-normal mr-1">D</span>
                      <span className="text-white font-bold">PAYMENT METHOD</span>
                    </div>
                  </th>
                  <th className="py-2 px-3 border-r border-slate-700/80 font-bold tracking-wider text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-slate-400 font-normal mr-1">E</span>
                      <span className="text-white font-bold">AMOUNT (₹)</span>
                    </div>
                  </th>
                  <th className="w-24 py-2 px-2 text-center font-bold tracking-wider">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-slate-400 font-normal mr-1">F</span>
                      <span className="text-white font-bold">ACTION</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {filteredPayments.map((p, idx) => (
                  <tr
                    key={p.id}
                    className="hover:bg-emerald-500/10 transition-colors group border-b border-slate-800/80"
                  >
                    {/* Excel Row Index */}
                    <td className="py-2.5 px-2 text-center font-mono text-[11px] text-slate-500 bg-slate-900/70 border-r border-slate-800 select-none group-hover:bg-slate-800 group-hover:text-emerald-400 font-semibold">
                      {idx + 1}
                    </td>

                    {/* Col A: Date */}
                    <td className="py-2.5 px-3 font-mono text-slate-300 border-r border-slate-800 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{p.payment_date}</span>
                      </div>
                    </td>

                    {/* Col B: Client */}
                    <td className="py-2.5 px-3 border-r border-slate-800">
                      <div className="font-semibold text-slate-100">
                        {p.projects?.name || "Unknown Client"}
                      </div>
                      {p.projects?.phone && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          {p.projects.phone}
                        </div>
                      )}
                    </td>

                    {/* Col C: Project Ref */}
                    <td className="py-2.5 px-3 border-r border-slate-800 whitespace-nowrap">
                      {p.projects?.id ? (
                        <Link
                          href={`/dashboard/projects/${p.projects.id}`}
                          className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-amber-400 hover:underline"
                        >
                          <FolderKanban className="w-3 h-3 text-amber-500" />
                          <span>{p.projects?.project_number || "Project"}</span>
                        </Link>
                      ) : (
                        <span className="font-mono text-xs text-amber-400">
                          {p.projects?.project_number || "Project"}
                        </span>
                      )}
                    </td>

                    {/* Col D: Payment Method */}
                    <td className="py-2.5 px-3 border-r border-slate-800">
                      {getMethodBadge(p.method || "")}
                    </td>

                    {/* Col E: Amount (Right aligned currency) */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400 border-r border-slate-800 whitespace-nowrap text-[13px]">
                      ₹{Number(p.amount).toLocaleString("en-IN")}
                    </td>

                    {/* Col F: Actions */}
                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() =>
                          handleDeletePayment(
                            p.id,
                            `Payment - ₹${p.amount}`
                          )
                        }
                        title="Delete Payment Record"
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Excel Summary / Formula Bottom Row */}
              <tfoot>
                <tr className="bg-slate-900 border-t-2 border-slate-700 text-xs font-mono font-bold">
                  <td className="py-3 px-2 text-center text-emerald-400 bg-slate-900 border-r border-slate-700/80 font-bold text-sm">
                    Σ
                  </td>
                  <td
                    colSpan={4}
                    className="py-3 px-4 text-right uppercase tracking-wider text-slate-300 border-r border-slate-700/80"
                  >
                    <span>TOTAL RECEIVED:</span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-emerald-400 text-sm whitespace-nowrap border-r border-slate-700/80 bg-emerald-500/10 border-b-4 border-double border-emerald-500">
                    ₹{totalFilteredReceived.toLocaleString("en-IN")}
                  </td>
                  <td className="bg-slate-900" />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Excel Workbook Footer: Sheet Tab & Status Bar */}
          <div className="bg-slate-900 px-3 py-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono select-none">
            {/* Sheet Tabs */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <div className="px-3 py-1 rounded-t-md bg-slate-950 border-t-2 border-emerald-500 border-x border-b-0 border-slate-800 text-emerald-400 font-bold text-[11px] flex items-center gap-1.5 shadow-sm">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Sheet1 - Received Payments</span>
              </div>
              <span className="text-[11px] text-slate-500 px-2 py-0.5 rounded hover:bg-slate-800 cursor-pointer">
                +
              </span>
            </div>

            {/* Excel Status Bar metrics */}
            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono w-full sm:w-auto justify-end">
              <span className="text-slate-500 font-bold uppercase text-[10px]">READY</span>
              <span className="hidden md:inline text-slate-700">|</span>
              <span className="hidden md:inline">
                COUNT: <strong className="text-slate-200">{filteredPayments.length}</strong>
              </span>
              <span className="hidden md:inline text-slate-700">|</span>
              <span className="hidden md:inline">
                AVERAGE:{" "}
                <strong className="text-slate-200">
                  ₹
                  {filteredPayments.length
                    ? Math.round(
                        totalFilteredReceived / filteredPayments.length
                      ).toLocaleString("en-IN")
                    : 0}
                </strong>
              </span>
              <span className="text-slate-700">|</span>
              <span>
                SUM:{" "}
                <strong className="text-emerald-400">
                  ₹{totalFilteredReceived.toLocaleString("en-IN")}
                </strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          loadPayments();
        }}
      />
    </div>
  );
}
