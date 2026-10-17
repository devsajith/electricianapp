"use client";

import React, { useEffect, useState, useTransition, use, useCallback, useRef, useMemo } from "react";
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
  Paperclip,
  ExternalLink,
  Download,
  Image as ImageIcon,
  UploadCloud,
  Loader2,
  CheckCircle2,
  Clock,
  MoreVertical,
  Info,
  X,
  Send,
  IndianRupee,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getProjectByIdAction,
  updateProjectStatusAction,
  deleteProjectAction,
  updateProjectPlansAction,
  ProjectRecord,
  ProjectPlanFile,
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
import { createClient } from "@/lib/supabase/client";

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

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

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);

  // Quick memo/note input state
  const [quickNote, setQuickNote] = useState("");
  const [isSendingNote, setIsSendingNote] = useState(false);

  const [isPending, startTransition] = useTransition();
  const planFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPlan, setIsUploadingPlan] = useState(false);

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
    loadData();
  }, [loadData]);

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

  const handleAddMorePlans = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !project) return;
    setIsUploadingPlan(true);
    try {
      const supabase = createClient();
      const currentPlans: ProjectPlanFile[] = project.plans || [];
      const newPlans: ProjectPlanFile[] = [...currentPlans];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split(".").pop() || "";
        const sanitizedBase = file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[^a-zA-Z0-9_-]/g, "_")
          .substring(0, 30);
        const uniquePath = `plans/${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${sanitizedBase}.${fileExt}`;

        const { error: uploadErr } = await supabase.storage
          .from("project-plans")
          .upload(uniquePath, file, { cacheControl: "3600", upsert: false });

        if (uploadErr) {
          throw new Error(`Failed to upload "${file.name}": ${uploadErr.message}`);
        }

        const { data: urlData } = supabase.storage
          .from("project-plans")
          .getPublicUrl(uniquePath);

        newPlans.push({
          id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `plan_${Date.now()}_${i}`,
          name: file.name,
          url: urlData.publicUrl,
          path: uniquePath,
          type: file.type || (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg"),
          size: file.size,
          uploaded_at: new Date().toISOString(),
        });
      }

      const res = await updateProjectPlansAction(project.id!, newPlans);
      if (res?.error) {
        alert(res.error);
      } else {
        setProject((prev) => (prev ? { ...prev, plans: newPlans } : null));
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to upload reference plans.");
    } finally {
      setIsUploadingPlan(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleDeletePlan = async (planId: string, planName: string) => {
    if (!project) return;
    if (!confirm(`Delete reference plan "${planName}"?`)) return;
    const updatedPlans = (project.plans || []).filter((p) => p.id !== planId);
    setProject((prev) => (prev ? { ...prev, plans: updatedPlans } : null));
    await updateProjectPlansAction(project.id!, updatedPlans);
  };

  // Quick send note: logs an expense modal or quick note
  const handleSendQuickNote = () => {
    if (!quickNote.trim()) return;
    // Open expense modal with description pre-filled
    setIsExpenseModalOpen(true);
  };

  // Combined timeline items sorted chronologically
  const timelineItems = useMemo(() => {
    const list: Array<{
      id: string;
      type: "EXPENSE" | "PAYMENT";
      amount: number;
      title: string;
      sub?: string;
      date: string;
      method?: string;
      rawExpense?: Expense;
      rawPayment?: Payment;
    }> = [];

    for (const exp of expenses) {
      list.push({
        id: `exp-${exp.id}`,
        type: "EXPENSE",
        amount: Number(exp.amount) || 0,
        title: exp.description || exp.type || "Site Expense",
        sub: exp.name || "Parts / Material",
        date: exp.date || "",
        rawExpense: exp,
      });
    }

    for (const pay of payments) {
      list.push({
        id: `pay-${pay.id}`,
        type: "PAYMENT",
        amount: Number(pay.amount) || 0,
        title: `Payment from ${project?.name || "Client"}`,
        sub: pay.payment_info || undefined,
        date: pay.payment_date || "",
        method: pay.method || "Cash",
        rawPayment: pay,
      });
    }

    // Sort ascending by date so oldest is on top and newest is at bottom (chat stream style)
    return list.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  }, [expenses, payments, project]);

  // Group timeline items by date header
  const groupedTimeline = useMemo(() => {
    const groups: { header: string; items: typeof timelineItems }[] = [];
    let currentHeader = "";
    let currentItems: typeof timelineItems = [];

    for (const item of timelineItems) {
      const header = formatDateHeader(item.date);
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
  }, [timelineItems]);

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 text-xs">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Opening project paperwork &amp; timeline...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-md mx-auto space-y-4 text-center py-16 px-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Project Not Found</h2>
        <p className="text-xs text-slate-400">
          The project record you requested does not exist or may have been removed.
        </p>
        <Link href="/dashboard">
          <Button variant="outline" className="border-slate-800 text-xs text-slate-300">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Return to Home
          </Button>
        </Link>
      </div>
    );
  }

  const projExpenseTotal = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const projPaymentTotal = payments.reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);
  const netBalance = projPaymentTotal - projExpenseTotal;
  const phoneDigits = getIndianPhoneDigits(project.phone || "");
  const clientInitial = project.name ? project.name.trim().charAt(0).toUpperCase() : "C";

  return (
    <div className="max-w-2xl mx-auto flex flex-col min-h-[calc(100vh-8rem)] relative pb-28 select-none">
      {/* 1. Top App Bar (Google Pay Header Style in Image 2) */}
      <div className="sticky top-0 z-20 -mx-3.5 sm:-mx-6 px-4 py-3 bg-[#111216]/95 backdrop-blur-xl border-b border-[#23252d] flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3 min-w-0">
          {/* Back button */}
          <Link
            href="/dashboard"
            aria-label="Back"
            className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          {/* Client Avatar Circle (Matches Orange S in Image 2) */}
          <div className="w-10 h-10 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-lg shadow-sm shrink-0">
            {clientInitial}
          </div>

          {/* Client Info */}
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base font-bold text-white truncate leading-tight">
              {project.name}
            </h2>
            <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5 font-medium">
              {project.phone && <span>{formatPhoneNumber(project.phone)}</span>}
              {project.place && <span>• {project.place}</span>}
            </div>
          </div>
        </div>

        {/* Right Action Icons: Call, Details Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          {phoneDigits && (
            <a
              href={`tel:${phoneDigits}`}
              title="Call Client"
              className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Phone className="w-5 h-5" />
            </a>
          )}

          {/* "Details" Button (Prominently requested by user) */}
          <button
            type="button"
            onClick={() => setDetailsDrawerOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#1e2025] hover:bg-slate-700/80 border border-[#2e323b] text-xs font-bold text-[#8ab4f8] hover:text-blue-200 transition-colors shadow-sm"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Details</span>
          </button>
        </div>
      </div>

      {/* 2. Google Pay Top Summary Banner Card ("Tap to view" style in Image 2) */}
      <div className="mt-3 mb-2 p-3.5 rounded-2xl bg-gradient-to-r from-[#1a1c22] to-[#15171d] border border-[#282a33] flex items-center justify-between gap-3 shadow-sm">
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Account Balance
          </span>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-300">
              In: <strong className="text-emerald-400 font-mono">₹{projPaymentTotal.toLocaleString("en-IN")}</strong>
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-300">
              Out: <strong className="text-rose-400 font-mono">₹{projExpenseTotal.toLocaleString("en-IN")}</strong>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDetailsDrawerOpen(true)}
          className="text-xs font-bold text-[#8ab4f8] hover:text-blue-300 shrink-0"
        >
          View Paperwork &gt;
        </button>
      </div>

      {/* 3. Transaction Timeline Feed (Left = Expense, Right = Payment) */}
      {/* User requirement: "when selecting a project it shoul show the expance and payment of that project left and right respectively" */}
      <div className="flex-1 space-y-5 pt-3">
        {timelineItems.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#1a1c22] border border-[#292c36] flex items-center justify-center mx-auto text-slate-500">
              <Receipt className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h3 className="text-sm font-bold text-white">No transactions yet</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Start by logging client payments on the right or site expenses on the left.
            </p>
          </div>
        ) : (
          groupedTimeline.map((group, groupIdx) => (
            <div key={`group-${groupIdx}`} className="space-y-3">
              {/* Date divider separator (Google Pay style curved separator) */}
              <div className="flex items-center justify-center py-1">
                <div className="px-3 py-1 rounded-full bg-[#18191f] border border-[#262832] text-[10px] font-semibold text-slate-400 tracking-tight shadow-xs">
                  {group.header}
                </div>
              </div>

              {/* Transactions in this group */}
              <div className="space-y-3">
                {group.items.map((item) => {
                  if (item.type === "EXPENSE") {
                    // LEFT SIDE: EXPENSE BUBBLE (Outgoing / Site Cost)
                    return (
                      <div
                        key={item.id}
                        className="flex justify-start mr-8 sm:mr-24"
                      >
                        <div className="w-full max-w-sm rounded-3xl rounded-tl-xs bg-[#1f2127] border border-[#2d313c] p-4 text-white shadow-md hover:border-rose-500/30 transition-all">
                          <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                            <span className="font-semibold text-rose-300 truncate max-w-[200px]">
                              Expense: {item.title}
                            </span>
                            {item.rawExpense && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteExpense(
                                    item.rawExpense!.id,
                                    item.title
                                  )
                                }
                                title="Delete expense"
                                className="text-slate-500 hover:text-rose-400 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Big Rupee Amount */}
                          <div className="text-2xl sm:text-3xl font-black text-white font-mono py-1">
                            ₹{item.amount.toLocaleString("en-IN")}
                          </div>

                          {/* Footer Tag */}
                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                            <span className="inline-flex items-center gap-1.5 text-slate-400">
                              <span className="w-2 h-2 rounded-full bg-rose-500" />
                              Site Outflow • {item.date}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {item.sub}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    // RIGHT SIDE: PAYMENT BUBBLE (Incoming / Client Money)
                    // Matches Image 2 exact Google Pay payment bubble style
                    return (
                      <div
                        key={item.id}
                        className="flex justify-end ml-8 sm:ml-24"
                      >
                        <div className="w-full max-w-sm rounded-3xl rounded-tr-xs bg-[#282a32] border border-[#383c48] p-4 text-white shadow-md hover:border-emerald-500/30 transition-all">
                          <div className="flex items-center justify-between text-xs text-slate-300 pb-1">
                            <span className="font-semibold truncate max-w-[200px]">
                              {item.title}
                            </span>
                            {item.rawPayment && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeletePayment(
                                    item.rawPayment!.id,
                                    `₹${item.amount}`
                                  )
                                }
                                title="Delete payment"
                                className="text-slate-500 hover:text-rose-400 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Big Rupee Amount (Matches ₹3,300, ₹1,300 in Image 2) */}
                          <div className="text-2xl sm:text-3xl font-black text-white font-mono py-1">
                            ₹{item.amount.toLocaleString("en-IN")}
                          </div>

                          {/* Footer Tag with Green Checkmark */}
                          <div className="flex items-center justify-between text-[11px] pt-1">
                            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              Paid • {item.date}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/80 text-[10px] text-slate-300 font-mono font-bold">
                              {item.method || "Cash"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 4. Bottom Sticky Action Bar (Matches Google Pay Image 2 bottom) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#111216]/98 backdrop-blur-xl border-t border-[#23252d] px-3.5 py-2.5 safe-area-pb shadow-2xl">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          {/* Quick Expense Button (Left) */}
          <button
            type="button"
            onClick={() => setIsExpenseModalOpen(true)}
            className="px-4 py-2.5 rounded-full bg-[#1e2025] hover:bg-slate-800 text-rose-300 text-xs font-bold border border-[#2d313b] shrink-0 active:scale-95 transition-all shadow-sm"
          >
            + Expense
          </button>

          {/* Quick Memo / Site Note input */}
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendQuickNote();
              }}
              placeholder="Message or site memo..."
              className="w-full h-10 px-4 rounded-full bg-[#1e2025] border border-[#2e323b] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#1a73e8]"
            />
            {quickNote && (
              <button
                type="button"
                onClick={handleSendQuickNote}
                className="absolute right-2 p-1.5 rounded-full bg-[#1a73e8] text-white hover:bg-blue-600 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Payment Button (Right, Google Pay blue pill) */}
          <button
            type="button"
            onClick={() => setIsPaymentModalOpen(true)}
            className="px-5 py-2.5 rounded-full bg-[#1a73e8] hover:bg-[#1557bf] text-white text-xs font-bold shrink-0 shadow-md shadow-[#1a73e8]/30 active:scale-95 transition-all"
          >
            + Payment
          </button>
        </div>
      </div>

      {/* 5. Project "Details" Modal / Drawer (Paperwork, Blueprints, Quotes, Status) */}
      {detailsDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200"
          onClick={() => setDetailsDrawerOpen(false)}
        >
          <div
            className="bg-[#181a20] border-t border-[#2a2d36] rounded-t-3xl p-5 space-y-5 max-h-[88vh] overflow-y-auto animate-in slide-in-from-bottom duration-250 shadow-2xl max-w-2xl w-full mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#282b35]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-lg">
                  {clientInitial}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base leading-tight">
                    {project.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Project #{project.project_number} • Full Paperwork &amp; Specs
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailsDrawerOpen(false)}
                className="p-2 rounded-full text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status Changer */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Work Status
              </label>
              <div className="flex flex-wrap gap-2">
                {PROJECT_STATUSES.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleStatusChange(st)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      project.status === st
                        ? "bg-[#1a73e8] text-white shadow-md shadow-[#1a73e8]/30"
                        : "bg-[#1e2025] border border-[#2e323b] text-slate-300 hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Details Grid */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#121316] border border-[#24262f] text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Work Type
                </span>
                <span className="font-semibold text-white">{project.type || "Wiring"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Site Location
                </span>
                <span className="font-semibold text-white">{project.place || "Not specified"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Phone
                </span>
                <span className="font-mono text-slate-200">{project.phone || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Timeline
                </span>
                <span className="text-slate-200">
                  {project.start_date ? project.start_date : "Started"} →{" "}
                  {project.end_date ? project.end_date : "Ongoing"}
                </span>
              </div>
            </div>

            {project.description && (
              <div className="p-3 rounded-xl bg-[#121316] border border-[#24262f] text-xs">
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">
                  Scope &amp; Description
                </span>
                <p className="text-slate-200 leading-relaxed">{project.description}</p>
              </div>
            )}

            {/* Blueprints / Reference Plans & Paperwork Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-blue-400" />
                    Blueprints &amp; Paperwork ({(project.plans || []).length})
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Wiring diagrams, architectural drawings &amp; permits
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => planFileInputRef.current?.click()}
                  disabled={isUploadingPlan}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1a73e8] hover:bg-[#1557bf] text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isUploadingPlan ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UploadCloud className="w-3.5 h-3.5" />
                  )}
                  <span>+ Upload Plan</span>
                </button>
                <input
                  ref={planFileInputRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleAddMorePlans}
                />
              </div>

              {(project.plans || []).length === 0 ? (
                <div className="p-4 rounded-xl bg-[#121316] border border-dashed border-[#2e313b] text-center text-xs text-slate-400">
                  No plans or blueprints uploaded yet. Tap Upload Plan above to attach diagrams or PDFs.
                </div>
              ) : (
                <div className="space-y-2">
                  {(project.plans || []).map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#121316] border border-[#24262f] hover:border-slate-700 transition-colors text-xs"
                    >
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 flex-1 min-w-0"
                      >
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                          {file.type?.includes("pdf") ? (
                            <FileText className="w-4 h-4" />
                          ) : (
                            <ImageIcon className="w-4 h-4" />
                          )}
                        </div>
                        <div className="truncate">
                          <span className="font-bold text-slate-200 block truncate">
                            {file.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                      </a>

                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                          title="Open full preview"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeletePlan(file.id, file.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400"
                          title="Delete file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Links: Quotations and Material List */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <Link
                href={`/dashboard/estimates/new?clientName=${encodeURIComponent(project.name)}`}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#1e2025] hover:bg-slate-700/60 border border-[#2d313b] text-xs font-bold text-slate-200 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-sky-400" />
                <span>Create Quote</span>
              </Link>

              <Link
                href={`/dashboard/item-list/new?projectId=${project.id}`}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#1e2025] hover:bg-slate-700/60 border border-[#2d313b] text-xs font-bold text-slate-200 transition-colors"
              >
                <ListChecks className="w-4 h-4 text-amber-400" />
                <span>Material List</span>
              </Link>
            </div>

            {/* Delete Project Row */}
            <div className="pt-2 border-t border-[#282b35] flex justify-between items-center">
              <button
                type="button"
                onClick={handleDelete}
                className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Project</span>
              </button>
              <button
                type="button"
                onClick={() => setDetailsDrawerOpen(false)}
                className="px-4 py-1.5 rounded-full bg-slate-800 text-xs font-bold text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        defaultProjectId={project.id}
        onSuccess={() => {
          setIsPaymentModalOpen(false);
          loadData();
        }}
      />

      {/* Record Expense Modal */}
      <RecordExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        defaultProjectId={project.id}
        onSuccess={() => {
          setIsExpenseModalOpen(false);
          loadData();
        }}
      />
    </div>
  );
}
