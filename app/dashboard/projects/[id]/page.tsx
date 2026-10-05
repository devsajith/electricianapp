"use client";

import { useEffect, useState, useTransition, use, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Phone,
  MessageSquare,
  Wallet,
  Receipt,
  ListChecks,
  Trash2,
  FileText,
  Layers,
  Plus,
  AlertTriangle,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getProjectByIdAction,
  updateProjectStatusAction,
  deleteProjectAction,
  ProjectRecord,
} from "../actions";
import { getExpensesByProjectIdAction, deleteExpenseAction } from "@/app/dashboard/expenses/actions";
import { Expense } from "@/lib/types/expense";
import { getProjectPaymentsAction, deletePaymentAction } from "@/app/dashboard/payments/actions";
import { Payment } from "@/lib/types/payment";
import { RecordExpenseModal } from "@/components/record-expense-modal";
import { RecordPaymentModal } from "@/components/record-payment-modal";
import {
  getStatusStyle,
  formatPhoneNumber,
  getIndianPhoneDigits,
  PROJECT_STATUSES,
} from "@/lib/project-utils";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [isPending, startTransition] = useTransition();

  const loadData = useCallback(async () => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 2500);

    try {
      const [projData, expRes, payRes] = await Promise.all([
        getProjectByIdAction(id),
        getExpensesByProjectIdAction(id),
        getProjectPaymentsAction(id),
      ]);
      clearTimeout(timer);
      if (projData) {
        setProject(projData);
      } else {
        setErrorMsg("Project not found.");
      }
      setExpenses(expRes.data || []);
      setPayments(payRes.data || []);
    } catch (err) {
      console.error("Error loading project detail:", err);
      clearTimeout(timer);
      setErrorMsg("Failed to load project details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 2500);

    Promise.all([
      getProjectByIdAction(id),
      getExpensesByProjectIdAction(id),
      getProjectPaymentsAction(id),
    ])
      .then(([projData, expRes, payRes]) => {
        clearTimeout(timer);
        if (!isMounted) return;
        if (projData) {
          setProject(projData);
        } else {
          setErrorMsg("Project not found.");
        }
        setExpenses(expRes.data || []);
        setPayments(payRes.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading project detail:", err);
        clearTimeout(timer);
        if (isMounted) {
          setErrorMsg("Failed to load project details.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [id]);

  const handleStatusChange = (newStatus: string) => {
    if (!project) return;
    startTransition(async () => {
      setProject((prev) => (prev ? { ...prev, status: newStatus } : null));
      await updateProjectStatusAction(id, newStatus);
    });
  };

  const handleDelete = () => {
    if (!project) return;
    if (!confirm(`Are you sure you want to delete project for "${project.name}"?`)) return;

    startTransition(async () => {
      const res = await deleteProjectAction(id);
      if (res.success) {
        router.push("/dashboard/projects");
      } else {
        setErrorMsg(res.error || "Failed to delete project.");
      }
    });
  };

  const handleDeleteExpense = (expId: string, desc: string) => {
    if (!confirm(`Delete expense "${desc}"?`)) return;
    startTransition(async () => {
      setExpenses((prev) => prev.filter((e) => e.id !== expId));
      await deleteExpenseAction(expId);
    });
  };

  const handleDeletePayment = (payId: string, desc: string) => {
    if (!confirm(`Delete payment "${desc}"?`)) return;
    startTransition(async () => {
      setPayments((prev) => prev.filter((p) => p.id !== payId));
      await deletePaymentAction(payId);
    });
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Loading project details...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 text-center py-12">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Project Not Found</h2>
        <p className="text-xs text-slate-400">
          The project record you requested does not exist or may have been removed.
        </p>
        <Link href="/dashboard/projects">
          <Button variant="outline" className="border-slate-800 text-xs text-slate-300">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Return to Projects List
          </Button>
        </Link>
      </div>
    );
  }

  const statusStyle = getStatusStyle(project.status);
  const projExpenseTotal = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const projPaymentTotal = payments.reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);
  const netBalance = projPaymentTotal - projExpenseTotal;
  const phoneDigits = getIndianPhoneDigits(project.phone || "");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/projects">
          <Button
            variant="outline"
            size="xs"
            className="border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Projects List
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Link href={`/dashboard/item-list/new?projectId=${project.id}`}>
            <Button
              variant="outline"
              size="xs"
              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            >
              <ListChecks className="w-3.5 h-3.5 mr-1" />
              Item List
            </Button>
          </Link>
          <Button
            onClick={handleDelete}
            disabled={isPending}
            variant="outline"
            size="xs"
            className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-center gap-2 text-rose-400 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Header Info Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-amber-400 font-mono font-bold text-xs border border-slate-700">
                {project.project_number}
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                {project.type}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{project.name}</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{project.place || "No place specified"}</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Current Status</span>
              <select
                value={project.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold border focus:outline-none cursor-pointer transition-all ${statusStyle.badgeClass}`}
              >
                {PROJECT_STATUSES.map((st) => (
                  <option
                    key={st}
                    value={st}
                    className={`bg-slate-900 font-semibold ${
                      st === "Completed"
                        ? "text-emerald-400"
                        : st === "Pending"
                        ? "text-rose-400"
                        : "text-blue-400"
                    }`}
                  >
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Client Contact & Communication Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Phone Number
            </span>
            <span className="text-sm font-bold text-white font-mono">
              {formatPhoneNumber(project.phone || "")}
            </span>
          </div>

          {phoneDigits && (
            <div className="flex items-center gap-2">
              <a
                href={`tel:+${phoneDigits}`}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                Call Client
              </a>
              <a
                href={`https://wa.me/${phoneDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                WhatsApp
              </a>
            </div>
          )}
        </div>

        {/* Key Attributes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block flex items-center gap-1">
              <Layers className="w-3 h-3 text-amber-400" />
              Project Type
            </span>
            <span className="text-sm font-bold text-slate-200 mt-1 block">
              {project.type}
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-400" />
              Place
            </span>
            <span className="text-sm font-bold text-slate-200 mt-1 block truncate">
              {project.place || "—"}
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block flex items-center gap-1">
              <Calendar className="w-3 h-3 text-amber-400" />
              Start Date
            </span>
            <span className="text-sm font-bold text-slate-200 mt-1 block">
              {project.start_date || "Not set"}
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block flex items-center gap-1">
              <Calendar className="w-3 h-3 text-amber-400" />
              End Date
            </span>
            <span className="text-sm font-bold text-slate-200 mt-1 block">
              {project.end_date || "Not set"}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-2 text-xs">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            Work Description
          </h2>
          <p className="text-slate-300 leading-relaxed bg-slate-950 border border-slate-800 rounded-xl p-4">
            {project.description}
          </p>
        </div>
      )}

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/20 space-y-1">
          <span className="text-xs uppercase font-bold text-emerald-400 flex items-center gap-1.5">
            <Wallet className="w-4 h-4" />
            Client Payments
          </span>
          <p className="text-2xl font-bold font-mono text-emerald-400">
            ₹{projPaymentTotal.toLocaleString("en-IN")}
          </p>
          <span className="text-[11px] text-slate-400">
            {payments.length} transactions recorded
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/20 space-y-1">
          <span className="text-xs uppercase font-bold text-amber-400 flex items-center gap-1.5">
            <Receipt className="w-4 h-4" />
            Job Expenses
          </span>
          <p className="text-2xl font-bold font-mono text-amber-400">
            ₹{projExpenseTotal.toLocaleString("en-IN")}
          </p>
          <span className="text-[11px] text-slate-400">
            {expenses.length} expense items logged
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs uppercase font-bold text-slate-300">
            Net Margin
          </span>
          <p
            className={`text-2xl font-bold font-mono ${
              netBalance >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            ₹{netBalance.toLocaleString("en-IN")}
          </p>
          <span className="text-[11px] text-slate-400">
            {netBalance >= 0 ? "In profit" : "Deficit"}
          </span>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 1. PAYMENTS RECEIVED TABLE                           */}
      {/* ==================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Wallet className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Payments Received</h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {payments.length} {payments.length === 1 ? "record" : "records"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Client advances, milestone payments, and settlements.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => setIsPaymentModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs gap-1.5 shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Record Payment
          </Button>
        </div>

        {payments.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800/60 p-4 space-y-2">
            <p>No client payments recorded for this project yet.</p>
            <Button
              size="xs"
              variant="outline"
              onClick={() => setIsPaymentModalOpen(true)}
              className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Record First Payment
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950">
            {/* Excel Title Ribbon */}
            <div className="bg-[#107c41] px-4 py-2 flex items-center justify-between text-white border-b border-emerald-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span className="font-semibold text-xs tracking-wide">
                  Project_Payments.xlsx - Payments Received
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 text-emerald-100 font-medium">
                  AutoSave: On
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px] font-sans">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-700 text-slate-300 text-[11px] font-mono select-none">
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
                        <span className="text-white font-bold">METHOD</span>
                      </div>
                    </th>
                    <th className="py-2 px-3 border-r border-slate-700/80 font-bold tracking-wider text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-slate-400 font-normal mr-1">C</span>
                        <span className="text-white font-bold">AMOUNT (₹)</span>
                      </div>
                    </th>
                    <th className="w-20 py-2 px-2 text-center font-bold tracking-wider">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-slate-400 font-normal mr-1">D</span>
                        <span className="text-white font-bold">ACTION</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-xs">
                  {payments.map((pay, idx) => (
                    <tr key={pay.id} className="hover:bg-emerald-500/10 transition-colors group border-b border-slate-800/80">
                      <td className="py-2.5 px-2 text-center font-mono text-[11px] text-slate-500 bg-slate-900/70 border-r border-slate-800 select-none group-hover:bg-slate-800 group-hover:text-emerald-400 font-semibold">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 font-mono border-r border-slate-800 whitespace-nowrap">
                        {pay.payment_date || "—"}
                      </td>
                      <td className="py-2.5 px-3 text-emerald-400 font-semibold border-r border-slate-800">
                        {pay.method || "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400 text-sm border-r border-slate-800 whitespace-nowrap">
                        ₹{Number(pay.amount).toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() =>
                            handleDeletePayment(pay.id, `Payment - ₹${pay.amount}`)
                          }
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Delete payment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 border-t-2 border-slate-700 text-xs font-mono font-bold">
                    <td className="py-3 px-2 text-center text-emerald-400 bg-slate-900 border-r border-slate-700/80 font-bold text-sm">
                      Σ
                    </td>
                    <td colSpan={2} className="py-3 px-4 text-slate-300 text-right uppercase tracking-wider text-[11px] border-r border-slate-700/80">
                      Total Payments Received:
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black text-emerald-400 text-sm whitespace-nowrap border-r border-slate-700/80 bg-emerald-500/10 border-b-4 border-double border-emerald-500">
                      ₹{projPaymentTotal.toLocaleString("en-IN")}
                    </td>
                    <td className="bg-slate-900" />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Excel Workbook Footer */}
            <div className="bg-slate-900 px-3 py-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono select-none">
              <div className="px-3 py-1 rounded-t-md bg-slate-950 border-t-2 border-emerald-500 border-x border-b-0 border-slate-800 text-emerald-400 font-bold text-[11px] flex items-center gap-1.5 shadow-sm">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Sheet1 - Payments</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                COUNT: <strong className="text-slate-200">{payments.length}</strong> | TOTAL: <strong className="text-emerald-400">₹{projPaymentTotal.toLocaleString("en-IN")}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* 2. PROJECT EXPENSES TABLE                            */}
      {/* ==================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Receipt className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Project Expenses</h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {expenses.length} {expenses.length === 1 ? "record" : "records"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Job site purchases, sudden equipment, and site labor/fuel costs.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => setIsExpenseModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Record Expense
          </Button>
        </div>

        {expenses.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800/60 p-4 space-y-2">
            <p>No sudden expenses logged for this project yet.</p>
            <Button
              size="xs"
              variant="outline"
              onClick={() => setIsExpenseModalOpen(true)}
              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Record First Expense
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950">
            {/* Excel Title Ribbon */}
            <div className="bg-[#107c41] px-4 py-2 flex items-center justify-between text-white border-b border-emerald-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span className="font-semibold text-xs tracking-wide">
                  Project_Expenses.xlsx - Site Expenses
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 text-emerald-100 font-medium">
                  AutoSave: On
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px] font-sans">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-700 text-slate-300 text-[11px] font-mono select-none">
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
                        <span className="text-white font-bold">TYPE</span>
                      </div>
                    </th>
                    <th className="py-2 px-3 border-r border-slate-700/80 font-bold tracking-wider">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-normal mr-1">C</span>
                        <span className="text-white font-bold">DESCRIPTION</span>
                      </div>
                    </th>
                    <th className="py-2 px-3 border-r border-slate-700/80 font-bold tracking-wider text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-slate-400 font-normal mr-1">D</span>
                        <span className="text-white font-bold">AMOUNT (₹)</span>
                      </div>
                    </th>
                    <th className="w-20 py-2 px-2 text-center font-bold tracking-wider">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-slate-400 font-normal mr-1">E</span>
                        <span className="text-white font-bold">ACTION</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-xs">
                  {expenses.map((exp, idx) => (
                    <tr key={exp.id} className="hover:bg-emerald-500/10 transition-colors group border-b border-slate-800/80">
                      <td className="py-2.5 px-2 text-center font-mono text-[11px] text-slate-500 bg-slate-900/70 border-r border-slate-800 select-none group-hover:bg-slate-800 group-hover:text-emerald-400 font-semibold">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 font-mono border-r border-slate-800 whitespace-nowrap">
                        {exp.date || "—"}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-800">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {exp.type || "—"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-200 border-r border-slate-800">
                        <span className="line-clamp-2" title={exp.description}>
                          {exp.description}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400 text-sm border-r border-slate-800 whitespace-nowrap">
                        ₹{Number(exp.amount).toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(exp.id, exp.description || "Expense")}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Delete expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 border-t-2 border-slate-700 text-xs font-mono font-bold">
                    <td className="py-3 px-2 text-center text-emerald-400 bg-slate-900 border-r border-slate-700/80 font-bold text-sm">
                      Σ
                    </td>
                    <td colSpan={3} className="py-3 px-4 text-slate-300 text-right uppercase tracking-wider text-[11px] border-r border-slate-700/80">
                      Total Project Expenses:
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black text-amber-400 text-sm whitespace-nowrap border-r border-slate-700/80 bg-amber-500/10 border-b-4 border-double border-amber-500">
                      ₹{projExpenseTotal.toLocaleString("en-IN")}
                    </td>
                    <td className="bg-slate-900" />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Excel Workbook Footer */}
            <div className="bg-slate-900 px-3 py-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono select-none">
              <div className="px-3 py-1 rounded-t-md bg-slate-950 border-t-2 border-emerald-500 border-x border-b-0 border-slate-800 text-emerald-400 font-bold text-[11px] flex items-center gap-1.5 shadow-sm">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Sheet1 - Expenses</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                COUNT: <strong className="text-slate-200">{expenses.length}</strong> | TOTAL: <strong className="text-amber-400">₹{projExpenseTotal.toLocaleString("en-IN")}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Danger Zone: Delete Project */}
      <div className="bg-slate-900 border border-rose-500/20 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white">Delete Project</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Permanently remove this project and its associated records. This action cannot be undone.
          </p>
        </div>
        <Button
          onClick={handleDelete}
          disabled={isPending}
          variant="outline"
          className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/50 shrink-0 font-bold text-xs"
        >
          <Trash2 className="w-4 h-4 mr-1.5" />
          Delete Project
        </Button>
      </div>

      {/* Record Sudden Expense Modal */}
      <RecordExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        defaultProjectId={id}
        onSuccess={() => loadData()}
      />

      {/* Record Client Payment Modal */}
      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        defaultProjectId={id}
        onSuccess={() => loadData()}
      />
    </div>
  );
}
