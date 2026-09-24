"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  Wallet,
  Plus,
  Search,
  Building2,
  FileText,
  CreditCard,
  Smartphone,
  Banknote,
  Trash2,
  Printer,
  Calendar,
  IndianRupee,
  LayoutGrid,
  List,
  FolderKanban,
  CheckCircle2,
  TrendingUp,
  Receipt,
  X,
  Phone,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Payment, PaymentMethod, initialSamplePayments } from "@/lib/types/payment";
import { getPaymentsAction, deletePaymentAction } from "@/app/dashboard/payments/actions";
import { RecordPaymentModal } from "@/components/record-payment-modal";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>(initialSamplePayments);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [voucherPayment, setVoucherPayment] = useState<Payment | null>(null);

  const [, startTransition] = useTransition();

  const loadPayments = () => {
    setLoading(true);
    getPaymentsAction().then((res) => {
      if (res.data && res.data.length > 0) {
        setPayments(res.data);
      } else {
        setPayments(initialSamplePayments);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleDeletePayment = (id: string, refOrDesc: string) => {
    if (!confirm(`Are you sure you want to delete payment (${refOrDesc})?`)) return;

    startTransition(async () => {
      setPayments((prev) => prev.filter((p) => p.id !== id));
      if (voucherPayment?.id === id) setVoucherPayment(null);

      if (!id.startsWith("sample-")) {
        await deletePaymentAction(id);
      }
    });
  };

  // Filtered payments
  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      (p.projects?.customer_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.projects?.project_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.reference_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.notes || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.payment_method || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMethod =
      selectedMethod === "ALL" ||
      p.payment_method?.toLowerCase() === selectedMethod.toLowerCase();

    return matchesSearch && matchesMethod;
  });

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
    const m = p.payment_method || "Other";
    methodCounts[m] = (methodCounts[m] || 0) + 1;
  });
  const topMethod = Object.entries(methodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "UPI";

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

  const methodsList: { id: string; label: string }[] = [
    { id: "ALL", label: "All Modes" },
    { id: "UPI", label: "UPI" },
    { id: "Cash", label: "Cash" },
    { id: "Bank Transfer", label: "Bank Transfer" },
    { id: "Cheque", label: "Cheque" },
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

      {/* Search & Method Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by client, project number, reference or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {methodsList.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMethod(m.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedMethod === m.id
                    ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="h-6 w-[1px] bg-slate-800 mx-1 hidden sm:block" />

          {/* Table / Cards toggle */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode("table")}
              title="Table view"
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === "table" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              title="Cards view"
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === "cards" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
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
            {searchQuery || selectedMethod !== "ALL"
              ? "No payments match your current search or filter query."
              : "No payments recorded yet. Click below to log the first client payment."}
          </p>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </Button>
        </div>
      ) : viewMode === "table" ? (
        /* TABLE VIEW */
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold text-slate-500 bg-slate-950/30">
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Project & Client</th>
                  <th className="py-3.5 px-4">Type & Mode</th>
                  <th className="py-3.5 px-4">Reference / Notes</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{p.payment_date}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">
                        {p.projects?.customer_name || "Unknown Client"}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <FolderKanban className="w-3 h-3 text-amber-500" />
                        <span>{p.projects?.project_number || "Project"}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {p.payment_type || "Advance"}
                        </span>
                        {getMethodBadge(p.payment_method)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      {p.reference_number && (
                        <div className="font-mono text-[11px] text-slate-300 font-semibold truncate">
                          {p.reference_number}
                        </div>
                      )}
                      <div className="text-[11px] text-slate-400 truncate">
                        {p.notes || "No additional remarks"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-400 text-sm whitespace-nowrap">
                      ₹{Number(p.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setVoucherPayment(p)}
                          title="View & Print Payment Voucher"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleDeletePayment(p.id, p.reference_number || `₹${p.amount}`)
                          }
                          title="Delete Payment"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPayments.map((p) => (
            <div
              key={p.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {p.payment_type || "Advance"}
                    </span>
                    {getMethodBadge(p.payment_method)}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {p.payment_date}
                  </span>
                </div>

                <div className="mb-3">
                  <div className="font-bold text-sm text-slate-200">
                    {p.projects?.customer_name || "Unknown Client"}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <div className="text-xs text-amber-400 flex items-center gap-1">
                      <FolderKanban className="w-3 h-3" />
                      <span>{p.projects?.project_number || "Project"}</span>
                    </div>

                    {p.projects?.customer_phone && (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${p.projects.customer_phone.replace(/[^\d+]/g, "")}`}
                          className="p-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span className="hidden sm:inline">Call</span>
                        </a>
                        <a
                          href={`https://wa.me/${p.projects.customer_phone.replace(/[^\d]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {p.reference_number && (
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80 mb-2 font-mono text-[11px] text-slate-300">
                    <span className="text-slate-500 text-[10px] block uppercase font-sans">
                      Reference / UTR
                    </span>
                    {p.reference_number}
                  </div>
                )}

                {p.notes && (
                  <p className="text-xs text-slate-400 line-clamp-2 italic mb-2">
                    &ldquo;{p.notes}&rdquo;
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between mt-2">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                    Amount Received
                  </span>
                  <span className="text-base font-black text-emerald-400">
                    ₹{Number(p.amount).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setVoucherPayment(p)}
                    title="View & Print Voucher"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleDeletePayment(p.id, p.reference_number || `₹${p.amount}`)
                    }
                    title="Delete Payment"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
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

            <div className="p-6 space-y-4 bg-slate-900 text-slate-200 print:text-black" id="printable-voucher">
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
                    <span className="text-slate-400 block mb-1">Milestone / Purpose:</span>
                    <p className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-slate-300 italic">
                      &ldquo;{voucherPayment.notes}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <span>Status: Verified & Logged</span>
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
