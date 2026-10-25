"use client";

import React, {
  useEffect,
  useState,
  useTransition,
  use,
  useCallback,
  useRef,
  useMemo,
  Suspense,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  Info,
  X,
  Send,
  IndianRupee,
  Share2,
  Building2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeaderSlot } from "@/components/header-context";
import {
  getProjectByIdAction,
  updateProjectStatusAction,
  deleteProjectAction,
  updateProjectPlansAction,
  ProjectRecord,
  ProjectPlanFile,
} from "../actions";
import {
  getExpensesByProjectIdAction,
  deleteExpenseAction,
} from "@/app/dashboard/expenses/actions";
import { Expense } from "@/lib/types/expense";
import {
  getProjectPaymentsAction,
  deletePaymentAction,
} from "@/app/dashboard/payments/actions";
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

function ProjectDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab state: "timeline" or "details"
  const initialTab = searchParams.get("tab") === "details" ? "details" : "timeline";
  const [activeTab, setActiveTab] = useState<"timeline" | "details">(initialTab);

  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals for financial entry
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Quick memo/note input state
  const [quickNote, setQuickNote] = useState("");

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

  // Sync tab if URL query changes
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "details" || tabParam === "timeline") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

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
          id:
            typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `plan_${Date.now()}_${i}`,
          name: file.name,
          url: urlData.publicUrl,
          path: uniquePath,
          type:
            file.type ||
            (file.name.toLowerCase().endsWith(".pdf")
              ? "application/pdf"
              : "image/jpeg"),
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

  const handleSendQuickNote = () => {
    if (!quickNote.trim()) return;
    setIsExpenseModalOpen(true);
  };

  // Combined timeline items sorted chronologically
  const timelineItems = useMemo(() => {
    const list: Array<{
      id: string;
      type: "PAYMENT" | "EXPENSE";
      title: string;
      sub?: string;
      amount: number;
      date: string;
      method?: string;
      timestamp: number;
      rawPayment?: Payment;
      rawExpense?: Expense;
    }> = [];

    for (const exp of expenses) {
      const ts = exp.date ? new Date(exp.date).getTime() : 0;
      list.push({
        id: `exp-${exp.id}`,
        type: "EXPENSE",
        title: exp.description || "Site Expense",
        sub: exp.type === "self" ? "Self Expense" : "Project Outflow",
        amount: Number(exp.amount) || 0,
        date: exp.date || "",
        timestamp: ts,
        rawExpense: exp,
      });
    }

    for (const pay of payments) {
      const ts = pay.payment_date ? new Date(pay.payment_date).getTime() : 0;
      list.push({
        id: `pay-${pay.id}`,
        type: "PAYMENT",
        title: pay.payment_info || "Client Payment Received",
        sub: pay.method || "Payment In",
        amount: Number(pay.amount) || 0,
        date: pay.payment_date || "",
        method: pay.method,
        timestamp: ts,
        rawPayment: pay,
      });
    }

    return list.sort((a, b) => a.timestamp - b.timestamp);
  }, [expenses, payments]);

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
      <>
        <HeaderSlot>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href="/dashboard/projects"
              aria-label="Back to Projects"
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-800 animate-pulse shrink-0" />
            <div className="space-y-1.5 min-w-0">
              <div className="h-4 w-28 bg-slate-800 rounded animate-pulse" />
              <div className="h-3 w-36 bg-slate-800/60 rounded animate-pulse" />
            </div>
          </div>
        </HeaderSlot>
        <div className="p-16 text-center text-slate-400 text-xs">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading project details &amp; timeline...
        </div>
      </>
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
        <Link href="/dashboard/projects">
          <Button variant="outline" className="border-slate-800 text-xs text-slate-300">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Return to Projects
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

  const createQuoteUrl = `/dashboard/estimates/new?clientName=${encodeURIComponent(
    project.name || ""
  )}&clientPhone=${encodeURIComponent(project.phone || "")}&place=${encodeURIComponent(
    project.place || ""
  )}&projectType=${encodeURIComponent(project.type || "Wiring")}`;

  return (
    <div className="max-w-3xl mx-auto flex flex-col min-h-[calc(100vh-8rem)] relative pb-28 select-none">
      {/* 1. Project details injected into Navbar itself */}
      <HeaderSlot>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Back button */}
          <Link
            href="/dashboard/projects"
            aria-label="Back to Projects"
            className="p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          {/* Client Avatar Circle */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-base sm:text-lg shadow-sm shrink-0">
            {clientInitial}
          </div>

          {/* Client Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate leading-tight">
                {project.name}
              </h2>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                {project.project_number}
              </span>
            </div>
            <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 font-medium leading-none mt-0.5">
              {project.phone && <span>{formatPhoneNumber(project.phone)}</span>}
              {project.place && <span>• {project.place}</span>}
              <span className="hidden xs:inline">• {project.type || "Wiring"}</span>
            </div>
          </div>
        </div>

        {/* Right Action Icons: Call, Switch View / Details Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          {phoneDigits && (
            <a
              href={`tel:${phoneDigits}`}
              title="Call Client"
              className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
            </a>
          )}

          {activeTab === "timeline" ? (
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-[#1e2025] hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-[#2e323b] text-xs font-bold text-blue-600 dark:text-[#8ab4f8] hover:text-blue-700 dark:hover:text-blue-200 transition-colors shadow-sm"
            >
              <Info className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Project</span> Details
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab("timeline")}
              className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-[#1e2025] hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-[#2e323b] text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors shadow-sm"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Ledger</span>
            </button>
          )}
        </div>
      </HeaderSlot>

      {/* 2. Full Page Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl mb-4 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab("details")}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "details"
              ? "bg-[#1a73e8] text-white shadow-md shadow-[#1a73e8]/30 font-extrabold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>Project Details &amp; Specifications</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("timeline")}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "timeline"
              ? "bg-[#1a73e8] text-white shadow-md shadow-[#1a73e8]/30 font-extrabold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Timeline &amp; Ledger ({timelineItems.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* FULL PAGE VIEW 1: PROJECT DETAILS & SPECS (NO MODAL!)    */}
      {/* ======================================================== */}
      {activeTab === "details" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Header Card / Client Overview Banner */}
          <div className="p-5 rounded-2xl bg-[#181a20] border border-[#282b35] shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#282b35]">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-orange-600 text-white font-extrabold flex items-center justify-center text-2xl shadow-md">
                  {clientInitial}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold text-white tracking-tight">
                      {project.name}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      {project.project_number}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {project.type || "Wiring"} Project • Registered on {project.created_at ? new Date(project.created_at).toLocaleDateString("en-IN") : "Active"}
                  </p>
                </div>
              </div>

              {/* Status Badge & Status Switcher */}
              <div className="flex flex-col sm:items-end gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Current Status
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PROJECT_STATUSES.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(st)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                        project.status === st
                          ? "bg-[#1a73e8] text-white shadow-md shadow-[#1a73e8]/30 ring-2 ring-blue-400/50"
                          : "bg-[#121316] border border-[#2e323b] text-slate-300 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Primary Actions Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {phoneDigits ? (
                <a
                  href={`tel:${phoneDigits}`}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#121316] hover:bg-slate-800/80 border border-[#2d313b] text-xs font-bold text-emerald-400 transition-colors shadow-xs"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Client</span>
                </a>
              ) : (
                <button
                  disabled
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#121316] border border-[#2d313b] text-xs font-bold text-slate-600 opacity-60 cursor-not-allowed"
                >
                  <Phone className="w-4 h-4" />
                  <span>No Phone</span>
                </button>
              )}

              <Link
                href={createQuoteUrl}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#121316] hover:bg-slate-800/80 border border-[#2d313b] text-xs font-bold text-amber-400 transition-colors shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Create Quote</span>
              </Link>

              <Link
                href={`/dashboard/item-list/new?projectId=${project.id}`}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#121316] hover:bg-slate-800/80 border border-[#2d313b] text-xs font-bold text-sky-400 transition-colors shadow-xs"
              >
                <ListChecks className="w-4 h-4" />
                <span>Material List</span>
              </Link>

              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#121316] hover:bg-slate-800/80 border border-[#2d313b] text-xs font-bold text-emerald-400 transition-colors shadow-xs"
              >
                <Wallet className="w-4 h-4" />
                <span>+ Payment</span>
              </button>
            </div>
          </div>

          {/* 2-Column Information & Financial Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Site & Client Details Card */}
            <div className="p-4 rounded-2xl bg-[#181a20] border border-[#282b35] shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 pb-2 border-b border-[#282b35]">
                <Building2 className="w-4 h-4 text-amber-400" />
                <span>Client &amp; Site Details</span>
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-[#121316] border border-[#24262f]">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Client Name
                  </span>
                  <span className="font-semibold text-white truncate block">
                    {project.name}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#121316] border border-[#24262f]">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Phone Number
                  </span>
                  <span className="font-mono font-semibold text-slate-200">
                    {project.phone || "—"}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#121316] border border-[#24262f]">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Site Location / Place
                  </span>
                  <div className="flex items-center gap-1 font-semibold text-white">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{project.place || "Not specified"}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#121316] border border-[#24262f]">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Work Type
                  </span>
                  <span className="font-semibold text-amber-400">
                    {project.type || "Wiring"}
                  </span>
                </div>

                <div className="col-span-2 p-2.5 rounded-xl bg-[#121316] border border-[#24262f]">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Project Schedule
                  </span>
                  <div className="flex items-center gap-1.5 font-medium text-slate-200">
                    <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>
                      {project.start_date || "Start date not set"} →{" "}
                      {project.end_date || "Ongoing"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Overview Card */}
            <div className="p-4 rounded-2xl bg-[#181a20] border border-[#282b35] shadow-sm space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 pb-2 border-b border-[#282b35]">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span>Financial Summary</span>
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs pt-3">
                  <div className="p-3 rounded-xl bg-[#121316] border border-emerald-500/20">
                    <span className="text-emerald-400 block text-[10px] uppercase font-bold">
                      Total Money In
                    </span>
                    <span className="text-lg font-black font-mono text-emerald-300 block">
                      ₹{projPaymentTotal.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {payments.length} payments recorded
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#121316] border border-rose-500/20">
                    <span className="text-rose-400 block text-[10px] uppercase font-bold">
                      Total Expenses Out
                    </span>
                    <span className="text-lg font-black font-mono text-rose-300 block">
                      ₹{projExpenseTotal.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {expenses.length} expenses logged
                    </span>
                  </div>

                  <div className="col-span-2 p-3 rounded-xl bg-gradient-to-r from-[#141820] to-[#121316] border border-[#2e323b] flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Net Balance
                      </span>
                      <span
                        className={`text-xl font-black font-mono ${
                          netBalance >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        ₹{netBalance.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("timeline")}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
                    >
                      View Ledger →
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Payment
                </Button>
                <Button
                  onClick={() => setIsExpenseModalOpen(true)}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Expense
                </Button>
              </div>
            </div>
          </div>

          {/* Scope & Description Card */}
          {project.description && (
            <div className="p-4 rounded-2xl bg-[#181a20] border border-[#282b35] shadow-sm space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-sky-400" />
                <span>Scope of Work &amp; Description</span>
              </h3>
              <div className="p-3.5 rounded-xl bg-[#121316] border border-[#24262f] text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                {project.description}
              </div>
            </div>
          )}

          {/* Blueprints / Reference Plans & Paperwork Section */}
          <div className="p-4 rounded-2xl bg-[#181a20] border border-[#282b35] shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#282b35]">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-blue-400" />
                  <span>Blueprints, Wiring Diagrams &amp; Paperwork ({(project.plans || []).length})</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Attach architectural plans, single line diagrams, permits or customer approvals
                </p>
              </div>

              <button
                type="button"
                onClick={() => planFileInputRef.current?.click()}
                disabled={isUploadingPlan}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1a73e8] hover:bg-[#1557bf] text-white text-xs font-bold transition-all disabled:opacity-50 self-start sm:self-auto shadow-sm"
              >
                {isUploadingPlan ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UploadCloud className="w-3.5 h-3.5" />
                )}
                <span>+ Upload Blueprint / PDF</span>
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
              <div className="p-8 rounded-xl bg-[#121316] border border-dashed border-[#2e313b] text-center text-xs text-slate-400 space-y-2">
                <UploadCloud className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="font-semibold text-slate-300">No blueprints or documents attached yet</p>
                <p className="text-[11px] text-slate-500">
                  Tap Upload above to attach wiring diagrams, photos, or architectural drawings.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(project.plans || []).map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#121316] border border-[#24262f] hover:border-slate-700 transition-colors text-xs"
                  >
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 flex-1 min-w-0"
                    >
                      <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
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

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                        title="Open file preview"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDeletePlan(file.id, file.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
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

          {/* Danger Zone: Delete Project */}
          <div className="p-4 rounded-2xl bg-[#181a20] border border-rose-950/40 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-rose-400 block">
                Delete Project Record
              </span>
              <p className="text-[11px] text-slate-400">
                Permanently deletes this project and its blueprint references.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleDelete}
              className="border-rose-900/60 bg-rose-950/30 text-rose-300 hover:bg-rose-900/50 hover:text-rose-200 text-xs font-bold gap-1.5 self-end sm:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Project</span>
            </Button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* FULL PAGE VIEW 2: TIMELINE & LEDGER                      */}
      {/* ======================================================== */}
      {activeTab === "timeline" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Account Balance Summary Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#1a1c22] to-[#15171d] border border-[#282a33] flex items-center justify-between gap-3 shadow-sm">
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
                <span className="text-slate-400">•</span>
                <span className="text-slate-300">
                  Net:{" "}
                  <strong
                    className={`font-mono ${
                      netBalance >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    ₹{netBalance.toLocaleString("en-IN")}
                  </strong>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className="text-xs font-bold text-[#8ab4f8] hover:text-blue-300 shrink-0"
            >
              View Full Details &gt;
            </button>
          </div>

          {/* Transaction Timeline Feed (Left = Expense, Right = Payment) */}
          <div className="flex-1 space-y-5 pt-2 pb-24">
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
                  {/* Date divider separator */}
                  <div className="flex items-center justify-center py-1">
                    <div className="px-3 py-1 rounded-full bg-[#18191f] border border-[#262832] text-[10px] font-semibold text-slate-400 tracking-tight shadow-xs">
                      {group.header}
                    </div>
                  </div>

                  {/* Transactions in this group */}
                  <div className="space-y-3">
                    {group.items.map((item) => {
                      if (item.type === "EXPENSE") {
                        // LEFT SIDE: EXPENSE BUBBLE (Outgoing)
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

                              <div className="text-2xl sm:text-3xl font-black text-white font-mono py-1">
                                ₹{item.amount.toLocaleString("en-IN")}
                              </div>

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
                        // RIGHT SIDE: PAYMENT BUBBLE (Incoming)
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

                              <div className="text-2xl sm:text-3xl font-black text-white font-mono py-1">
                                ₹{item.amount.toLocaleString("en-IN")}
                              </div>

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

          {/* Sticky Bottom Bar for Quick Expense & Payment in Timeline Mode */}
          <div className="fixed bottom-0 left-0 md:left-64 right-0 z-30 bg-[#111216]/98 backdrop-blur-xl border-t border-[#23252d] px-3.5 py-2.5 safe-area-pb shadow-2xl">
            <div className="max-w-3xl mx-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(true)}
                className="px-4 py-2.5 rounded-full bg-[#1e2025] hover:bg-slate-800 text-rose-300 text-xs font-bold border border-[#2d313b] shrink-0 active:scale-95 transition-all shadow-sm"
              >
                + Expense
              </button>

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

              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="px-5 py-2.5 rounded-full bg-[#1a73e8] hover:bg-[#1557bf] text-white text-xs font-bold shrink-0 shadow-md shadow-[#1a73e8]/30 active:scale-95 transition-all"
              >
                + Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Financial Action Modals (Payment / Expense) */}
      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        defaultProjectId={project.id}
        onSuccess={() => {
          setIsPaymentModalOpen(false);
          loadData();
        }}
      />

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

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="p-16 text-center text-slate-400 text-xs">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Opening project paperwork &amp; timeline...
        </div>
      }
    >
      <ProjectDetailContent params={params} />
    </Suspense>
  );
}
