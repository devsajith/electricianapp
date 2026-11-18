"use client";

import React, {
  useEffect,
  useState,
  useTransition,
  useCallback,
  useRef,
  useMemo,
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
  FileDown,
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
  Briefcase,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeaderSlot } from "@/components/header-context";
import {
  getProjectBundleAction,
  updateProjectStatusAction,
  updateProjectDescriptionAction,
  deleteProjectAction,
  updateProjectPlansAction,
  ProjectRecord,
  ProjectPlanFile,
} from "../actions";
import { deleteExpenseAction } from "@/app/dashboard/expenses/actions";
import { Expense } from "@/lib/types/expense";
import { deletePaymentAction } from "@/app/dashboard/payments/actions";
import { Payment } from "@/lib/types/payment";
import { deleteLabourEntryAction } from "@/app/dashboard/labour/actions";
import { Labour, LabourEntry } from "@/lib/types/labour";
import { RecordExpenseModal } from "@/components/record-expense-modal";
import { RecordPaymentModal } from "@/components/record-payment-modal";
import { ProjectAttendanceModal } from "@/components/project-attendance-modal";
import { ProjectWorkTable } from "@/components/project-work-table";
import {
  getStatusStyle,
  formatPhoneNumber,
  getIndianPhoneDigits,
  PROJECT_STATUSES,
} from "@/lib/project-utils";
import { createClient } from "@/lib/supabase/client";
import { generatePaymentStatementPdf } from "@/lib/utils/pdf-generator";

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

export interface ProjectDetailClientProps {
  id: string;
  initialProject: ProjectRecord;
  initialExpenses: Expense[];
  initialPayments: Payment[];
  initialLabourEntries: LabourEntry[];
  initialWorkers: Labour[];
}

export function ProjectDetailClient({
  id,
  initialProject,
  initialExpenses,
  initialPayments,
  initialLabourEntries,
  initialWorkers,
}: ProjectDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab state: "timeline", "details", or "work"
  const tabParam = searchParams.get("tab");
  const initialTab: "timeline" | "details" | "work" =
    tabParam === "details" ? "details" : tabParam === "work" ? "work" : "timeline";
  const [activeTab, setActiveTab] = useState<"timeline" | "details" | "work">(initialTab);

  // Initialize state directly from server-rendered props (NO client-side initial fetch lag!)
  const [project, setProject] = useState<ProjectRecord>(initialProject);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [labourEntries, setLabourEntries] = useState<LabourEntry[]>(initialLabourEntries);
  const [workers, setWorkers] = useState<Labour[]>(initialWorkers);

  // Modals for financial & labour entries
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);

  // Quick memo/note input state
  const [quickNote, setQuickNote] = useState("");

  const [isPending, startTransition] = useTransition();
  const planFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPlan, setIsUploadingPlan] = useState(false);

  // Sync state if server props change
  useEffect(() => {
    setProject(initialProject);
    setExpenses(initialExpenses);
    setPayments(initialPayments);
    setLabourEntries(initialLabourEntries);
    setWorkers(initialWorkers);
  }, [initialProject, initialExpenses, initialPayments, initialLabourEntries, initialWorkers]);

  // Fast single-roundtrip reload function for modal success callbacks
  const loadData = useCallback(async () => {
    try {
      const bundle = await getProjectBundleAction(id);
      if (bundle.project) {
        setProject(bundle.project);
      }
      setExpenses(bundle.expenses);
      setPayments(bundle.payments);
      setLabourEntries(bundle.labourEntries);
      setWorkers(bundle.workers);
    } catch (err) {
      console.error("Error refreshing project detail:", err);
    }
  }, [id]);

  // Sync tab if URL query changes
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "details" || tabParam === "timeline" || tabParam === "work") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Calculate total distinct days of work done in this project
  const totalWorkDays = useMemo(() => {
    const dates = new Set<string>();
    for (const e of labourEntries) {
      if (e.attendance_status === "absent") continue;
      if (e.attendance_status === "payment_only" && Number(e.tach) === 0 && Number(e.ot) === 0) continue;
      const tachNum = Number(e.tach);
      const otNum = Number(e.ot) || 0;
      if (
        tachNum > 0 ||
        otNum > 0 ||
        e.attendance_status === "full_day" ||
        e.attendance_status === "half_day" ||
        e.attendance_status === "overtime"
      ) {
        if (e.date) {
          dates.add(e.date.split("T")[0].trim());
        }
      }
    }
    return dates.size;
  }, [labourEntries]);

  const handleDeleteLabourEntry = (entryId: string, workerName: string, dateStr: string) => {
    if (!confirm(`Delete work entry for ${workerName} on ${dateStr}?`)) return;
    startTransition(async () => {
      setLabourEntries((prev) => prev.filter((e) => e.id !== entryId));
      await deleteLabourEntryAction(entryId);
      loadData();
    });
  };

  const handleStatusChange = (newStatus: string) => {
    if (!project) return;
    startTransition(async () => {
      setProject((prev) => (prev ? { ...prev, status: newStatus } : prev));
      await updateProjectStatusAction(id, newStatus);
    });
  };

  const handleDelete = () => {
    if (!project) return;
    if (!confirm(`Are you sure you want to delete project for "${project.name}"?`)) return;

    startTransition(async () => {
      const res = await deleteProjectAction(id);
      if (res?.error) {
        alert(res.error);
      } else {
        router.push("/dashboard/projects");
      }
    });
  };

  const handleDeleteExpense = (expenseId: string, desc: string) => {
    if (!confirm(`Delete expense "${desc}"?`)) return;
    startTransition(async () => {
      setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
      await deleteExpenseAction(expenseId);
      loadData();
    });
  };

  const handleDeletePayment = (paymentId: string, amount: string) => {
    if (!confirm(`Delete payment of ${amount}?`)) return;
    startTransition(async () => {
      setPayments((prev) => prev.filter((p) => p.id !== paymentId));
      await deletePaymentAction(paymentId);
      loadData();
    });
  };

  const handlePlanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !project) return;

    const file = files[0];
    if (file.size > 20 * 1024 * 1024) {
      alert("File size exceeds 20MB limit.");
      if (planFileInputRef.current) planFileInputRef.current.value = "";
      return;
    }

    setIsUploadingPlan(true);
    try {
      const supabase = createClient();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const storagePath = `plans/${project.id}/${Date.now()}-${sanitizedName}`;

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("project-plans")
        .upload(storagePath, file, { upsert: false });

      if (uploadErr) {
        console.error("Storage upload error:", uploadErr);
        alert(`Failed to upload file: ${uploadErr.message}`);
        setIsUploadingPlan(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("project-plans")
        .getPublicUrl(uploadData?.path || storagePath);

      const newPlan: ProjectPlanFile = {
        id: `plan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        url: publicUrlData.publicUrl,
        path: uploadData?.path || storagePath,
        size: file.size,
        type: file.type || "application/octet-stream",
        uploaded_at: new Date().toISOString(),
      };

      const updatedPlans = [...(project.plans || []), newPlan];
      setProject({ ...project, plans: updatedPlans });

      await updateProjectPlansAction(project.id!, updatedPlans);
    } catch (err: unknown) {
      console.error("Failed to upload plan:", err);
      alert(err instanceof Error ? err.message : "Error uploading plan.");
    } finally {
      setIsUploadingPlan(false);
      if (planFileInputRef.current) planFileInputRef.current.value = "";
    }
  };

  const handleDeletePlan = async (planIndex: number) => {
    if (!project || !project.plans) return;
    const plan = project.plans[planIndex];
    if (!plan) return;

    if (!confirm(`Remove "${plan.name}" from this project's plans?`)) return;

    const updatedPlans = project.plans.filter((_, idx) => idx !== planIndex);
    setProject({ ...project, plans: updatedPlans });

    startTransition(async () => {
      await updateProjectPlansAction(project.id!, updatedPlans);
    });
  };

  const handleAddQuickNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNote.trim() || !project) return;

    const noteText = quickNote.trim();
    const timestamp = new Date().toLocaleString("en-IN", {
      dateStyle: "short",
      timeStyle: "short",
    });
    const appendedDescription = project.description
      ? `${project.description}\n\n[Note - ${timestamp}]: ${noteText}`
      : `[Note - ${timestamp}]: ${noteText}`;

    setQuickNote("");
    setProject({ ...project, description: appendedDescription });

    startTransition(async () => {
      try {
        await updateProjectDescriptionAction(project.id!, appendedDescription);
      } catch (err) {
        console.error("Error adding quick note:", err);
      }
    });
  };

  // Combine expenses (money out) and payments (money in) into unified timeline
  const timelineItems = useMemo(() => {
    const list: Array<{
      id: string;
      type: "EXPENSE" | "PAYMENT";
      title: string;
      sub: string;
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
    <div className="max-w-5xl lg:max-w-6xl mx-auto flex flex-col relative pb-8 md:pb-6 select-none">
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

          {activeTab === "details" ? (
            <button
              type="button"
              onClick={() => setActiveTab("work")}
              className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-[#1e2025] hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-[#2e323b] text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors shadow-sm"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Work ({totalWorkDays}d)</span>
            </button>
          ) : activeTab === "work" ? (
            <button
              type="button"
              onClick={() => setActiveTab("timeline")}
              className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-[#1e2025] hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-[#2e323b] text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors shadow-sm"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Ledger</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-[#1e2025] hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-[#2e323b] text-xs font-bold text-blue-600 dark:text-[#8ab4f8] hover:text-blue-700 dark:hover:text-blue-200 transition-colors shadow-sm"
            >
              <Info className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Project</span> Details
            </button>
          )}
        </div>
      </HeaderSlot>

      {/* 2. Full Page Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl mb-5 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab("details")}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "details"
              ? "bg-[#1a73e8] text-white shadow-md shadow-[#1a73e8]/30 font-extrabold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Project</span> Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("work")}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "work"
              ? "bg-amber-600 text-white shadow-md shadow-amber-600/30 font-extrabold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Work Table</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              activeTab === "work"
                ? "bg-black/30 text-amber-200"
                : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
            }`}
          >
            {totalWorkDays}d
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("timeline")}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "timeline"
              ? "bg-[#1a73e8] text-white shadow-md shadow-[#1a73e8]/30 font-extrabold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Ledger</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              activeTab === "timeline"
                ? "bg-black/30 text-white"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            {timelineItems.length}
          </span>
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
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
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
                onClick={() => setIsAttendanceModalOpen(true)}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#121316] hover:bg-slate-800/80 border border-amber-500/30 text-xs font-bold text-amber-400 transition-colors shadow-xs"
              >
                <Clock className="w-4 h-4" />
                <span>Mark Attendance</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("timeline")}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#121316] hover:bg-slate-800/80 border border-[#2d313b] text-xs font-bold text-purple-400 transition-colors shadow-xs"
              >
                <Wallet className="w-4 h-4" />
                <span>View Ledger</span>
              </button>
            </div>
          </div>

          {/* Client & Project Specs Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Card: Customer & Location Details */}
            <div className="p-4 rounded-2xl bg-[#181a20] border border-[#282b35] shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-400" />
                <span>Customer &amp; Site Details</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#121316] border border-[#24262f]">
                  <span className="text-slate-400">Customer Name</span>
                  <span className="font-bold text-white">{project.name}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#121316] border border-[#24262f]">
                  <span className="text-slate-400">Phone Number</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {project.phone ? formatPhoneNumber(project.phone) : "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#121316] border border-[#24262f]">
                  <span className="text-slate-400">Site Location / Place</span>
                  <span className="font-semibold text-slate-200 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    {project.place || "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#121316] border border-[#24262f]">
                  <span className="text-slate-400">Project Type</span>
                  <span className="font-semibold text-slate-200">{project.type || "Wiring"}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#121316] border border-[#24262f]">
                  <span className="text-slate-400">Project Duration</span>
                  <span className="font-mono text-slate-300">
                    {project.start_date || "Not set"} → {project.end_date || "Ongoing"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Card: Financial Standing */}
            <div className="p-4 rounded-2xl bg-[#181a20] border border-[#282b35] shadow-sm space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-3">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  <span>Financial Statement</span>
                </h3>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-[#121316] border border-emerald-500/20">
                    <span className="text-emerald-400 block text-[10px] uppercase font-bold">
                      Total Money In
                    </span>
                    <span className="text-lg font-black font-mono text-emerald-300 block">
                      ₹{projPaymentTotal.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {payments.length} payments logged
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

              <div className="flex gap-2 pt-2 flex-wrap">
                <Button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="flex-1 min-w-[100px] bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Payment
                </Button>
                <Button
                  onClick={() => setIsExpenseModalOpen(true)}
                  className="flex-1 min-w-[100px] bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Expense
                </Button>
                {payments.length > 0 && (
                  <Button
                    onClick={() => {
                      generatePaymentStatementPdf({
                        clientName: project.name,
                        projectNumber: project.project_number,
                        projectPlace: project.place || null,
                        payments: payments.map((p) => ({
                          payment_date: p.payment_date,
                          amount: p.amount,
                          method: p.method,
                          payment_info: p.payment_info,
                          project_name: project.name,
                          project_number: project.project_number,
                        })),
                      });
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold gap-1 shadow-sm active:scale-95 transition-all"
                    title="Download Statement of Payments Received from this client"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Statement (PDF)</span>
                  </Button>
                )}
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

          {/* Project Work History & Labour Attendance Section */}
          <ProjectWorkTable
            entries={labourEntries}
            projectId={project.id}
            projectName={project.name}
            onAddAttendance={() => setIsAttendanceModalOpen(true)}
            onDeleteEntry={handleDeleteLabourEntry}
          />

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
                <span>Upload Plan / Drawing</span>
              </button>

              <input
                ref={planFileInputRef}
                type="file"
                accept="application/pdf,image/*,.dwg,.dxf"
                className="hidden"
                onChange={handlePlanUpload}
              />
            </div>

            {/* Plans List Grid */}
            {(!project.plans || project.plans.length === 0) ? (
              <div className="text-center py-8 px-4 rounded-xl border border-dashed border-[#282b35] text-slate-400 text-xs">
                <Paperclip className="w-6 h-6 mx-auto mb-1.5 text-slate-500 opacity-60" />
                <p className="font-semibold text-slate-300">No project plans attached yet</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Click the button above to upload blueprints, diagrams, or site drawings (PDF, JPG, PNG up to 20MB).
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {project.plans.map((plan, idx) => {
                  const isImage = plan.type.startsWith("image/");
                  return (
                    <div
                      key={plan.url || idx}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#121316] border border-[#24262f] hover:border-[#383c48] transition-all group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-[#181a20] border border-[#282b35] flex items-center justify-center shrink-0">
                          {isImage ? (
                            <ImageIcon className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <FileText className="w-4 h-4 text-blue-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <a
                            href={plan.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-slate-200 hover:text-blue-400 truncate block hover:underline"
                            title={plan.name}
                          >
                            {plan.name}
                          </a>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {formatFileSize(plan.size)} • {plan.uploaded_at ? new Date(plan.uploaded_at).toLocaleDateString("en-IN") : "Saved"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={plan.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={plan.name}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Open / Download"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeletePlan(idx)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Danger Zone: Delete Project */}
          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="px-3.5 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete This Project Record</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* FULL PAGE VIEW 2: DEDICATED WORK TABLE (ATTENDANCE)     */}
      {/* ======================================================== */}
      {activeTab === "work" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <ProjectWorkTable
            entries={labourEntries}
            projectId={project.id}
            projectName={project.name}
            onAddAttendance={() => setIsAttendanceModalOpen(true)}
            onDeleteEntry={handleDeleteLabourEntry}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* FULL PAGE VIEW 3: FINANCIAL LEDGER & TIMELINE (DEFAULT)  */}
      {/* ======================================================== */}
      {activeTab === "timeline" && (
        <div className="flex-1 flex flex-col space-y-4 animate-in fade-in duration-200">
          {/* Sticky Mini Balance Strip under Tabs */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#181a20] border border-[#282b35] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200">Financial Summary</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {timelineItems.length} transactions
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
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

            <div className="flex items-center gap-2 shrink-0">
              {payments.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    generatePaymentStatementPdf({
                      clientName: project.name,
                      projectNumber: project.project_number,
                      projectPlace: project.place || null,
                      payments: payments.map((p) => ({
                        payment_date: p.payment_date,
                        amount: p.amount,
                        method: p.method,
                        payment_info: p.payment_info,
                        project_name: project.name,
                        project_number: project.project_number,
                      })),
                    });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm transition-all active:scale-95"
                  title="Download Statement of Payments Received from this client"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Statement (PDF)</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveTab("details")}
                className="text-xs font-bold text-[#8ab4f8] hover:text-blue-300 shrink-0"
              >
                View Full Details &gt;
              </button>
            </div>
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

                              <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1">
                                <span className="inline-flex items-center gap-1.5 text-emerald-400">
                                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                  Payment In ({item.method || "Cash"}) • {item.date}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  Credited
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

          {/* Sticky Bottom Bar: WhatsApp / GPay Style Action Panel */}
          <div className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent pointer-events-none">
            <div className="max-w-3xl mx-auto pointer-events-auto flex flex-col gap-2 p-2 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md">
              {/* Optional Quick Memo Input */}
              <form onSubmit={handleAddQuickNote} className="flex items-center gap-2">
                <input
                  type="text"
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                  placeholder="Type a quick site note, memo or measurement..."
                  className="flex-1 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {quickNote.trim() && (
                  <button
                    type="submit"
                    className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>

              {/* Action Buttons: Payment (Green) + Expense (Red) + Labour Attendance */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-sm tracking-wide shadow-lg shadow-emerald-900/30 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>PAYMENT</span>
                  <span className="text-xs font-normal opacity-80">(Cash In)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(true)}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-sm tracking-wide shadow-lg shadow-rose-900/30 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>EXPENSE</span>
                  <span className="text-xs font-normal opacity-80">(Cash Out)</span>
                </button>
              </div>
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

      {/* Labour Attendance Modal for this Project */}
      <ProjectAttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        projectId={project.id}
        projectName={project.name}
        workers={workers}
        onSuccess={() => {
          setIsAttendanceModalOpen(false);
          loadData();
        }}
      />
    </div>
  );
}
