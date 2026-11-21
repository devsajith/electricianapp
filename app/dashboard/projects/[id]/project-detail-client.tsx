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
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
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
import { MaterialList } from "@/lib/types/material";
import { Quotation } from "@/lib/types/quotation";
import { RecordExpenseModal } from "@/components/record-expense-modal";
import { RecordPaymentModal } from "@/components/record-payment-modal";
import { toast } from "@/lib/toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
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
  initialMaterialLists?: MaterialList[];
  initialQuotations?: Quotation[];
}

export function ProjectDetailClient({
  id,
  initialProject,
  initialExpenses,
  initialPayments,
  initialLabourEntries,
  initialWorkers,
  initialMaterialLists = [],
  initialQuotations = [],
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
  const [materialLists, setMaterialLists] = useState<MaterialList[]>(initialMaterialLists);
  const [quotations, setQuotations] = useState<Quotation[]>(initialQuotations);

  // Modals for financial & labour entries
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);

  const [isPending, startTransition] = useTransition();
  const planFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPlan, setIsUploadingPlan] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(null);

  // Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    variant?: "danger" | "warning";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    confirmLabel: "Delete",
    variant: "danger",
    onConfirm: () => {},
  });

  // Group plans into previewable images vs document/CAD files
  const { imagePlans, docPlans } = useMemo(() => {
    const allPlans = project?.plans || [];
    const images: ProjectPlanFile[] = [];
    const docs: ProjectPlanFile[] = [];

    for (const p of allPlans) {
      const isImg =
        (p.type && p.type.startsWith("image/")) ||
        /\.(jpe?g|png|webp|gif|svg|avif|bmp)$/i.test(p.name || p.url);
      if (isImg) {
        images.push(p);
      } else {
        docs.push(p);
      }
    }
    return { imagePlans: images, docPlans: docs };
  }, [project?.plans]);

  // Keyboard navigation for image lightbox preview
  useEffect(() => {
    if (previewImageIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewImageIndex(null);
      if (e.key === "ArrowLeft") {
        setPreviewImageIndex((prev) =>
          prev !== null && prev > 0 ? prev - 1 : imagePlans.length - 1
        );
      }
      if (e.key === "ArrowRight") {
        setPreviewImageIndex((prev) =>
          prev !== null && prev < imagePlans.length - 1 ? prev + 1 : 0
        );
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewImageIndex, imagePlans.length]);

  // Sync state if server props change
  useEffect(() => {
    setProject(initialProject);
    setExpenses(initialExpenses);
    setPayments(initialPayments);
    setLabourEntries(initialLabourEntries);
    setWorkers(initialWorkers);
    setMaterialLists(initialMaterialLists || []);
    setQuotations(initialQuotations || []);
  }, [
    initialProject,
    initialExpenses,
    initialPayments,
    initialLabourEntries,
    initialWorkers,
    initialMaterialLists,
    initialQuotations,
  ]);

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
      if (bundle.materialLists) {
        setMaterialLists(bundle.materialLists);
      }
      if (bundle.quotations) {
        setQuotations(bundle.quotations);
      }
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
    setConfirmConfig({
      isOpen: true,
      title: "Delete Work Entry",
      description: `Are you sure you want to delete the daily attendance log for ${workerName} on ${dateStr}?`,
      confirmLabel: "Delete Entry",
      variant: "danger",
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        startTransition(async () => {
          try {
            setLabourEntries((prev) => prev.filter((e) => e.id !== entryId));
            await deleteLabourEntryAction(entryId);
            loadData();
            toast.success(`Work entry for ${workerName} deleted.`);
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to delete work entry.");
          }
        });
      },
    });
  };

  const handleStatusChange = (newStatus: string) => {
    if (!project) return;
    startTransition(async () => {
      try {
        setProject((prev) => (prev ? { ...prev, status: newStatus } : prev));
        await updateProjectStatusAction(id, newStatus);
        toast.success(`Project status updated to "${newStatus}"`);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to update project status.");
      }
    });
  };

  const handleDelete = () => {
    if (!project) return;
    setConfirmConfig({
      isOpen: true,
      title: "Delete Project",
      description: `Are you sure you want to permanently delete "${project.name}"? All associated labor timesheets, expenses, payments, and uploaded drawings will be removed.`,
      confirmLabel: "Delete Project",
      variant: "danger",
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        startTransition(async () => {
          try {
            const res = await deleteProjectAction(id);
            if (res?.error) {
              toast.error(res.error);
            } else {
              toast.success(`Project "${project.name}" deleted successfully.`);
              router.push("/dashboard/projects");
            }
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to delete project.");
          }
        });
      },
    });
  };

  const handleDeleteExpense = (expenseId: string, desc: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Delete Expense",
      description: `Are you sure you want to delete the expense entry "${desc}"?`,
      confirmLabel: "Delete Expense",
      variant: "danger",
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        startTransition(async () => {
          try {
            setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
            await deleteExpenseAction(expenseId);
            loadData();
            toast.success(`Expense "${desc}" deleted successfully.`);
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to delete expense.");
          }
        });
      },
    });
  };

  const handleDeletePayment = (paymentId: string, amount: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Delete Payment",
      description: `Are you sure you want to delete the payment entry of ${amount}?`,
      confirmLabel: "Delete Payment",
      variant: "danger",
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        startTransition(async () => {
          try {
            setPayments((prev) => prev.filter((p) => p.id !== paymentId));
            await deletePaymentAction(paymentId);
            loadData();
            toast.success(`Payment of ${amount} deleted successfully.`);
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to delete payment.");
          }
        });
      },
    });
  };

  const handlePlanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !project) return;

    const fileList = Array.from(files);
    setIsUploadingPlan(true);
    try {
      const supabase = createClient();
      const newPlans: ProjectPlanFile[] = [];

      for (const file of fileList) {
        if (file.size > 20 * 1024 * 1024) {
          toast.warning(`File "${file.name}" exceeds 20MB limit and was skipped.`);
          continue;
        }

        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const storagePath = `plans/${project.id}/${Date.now()}-${sanitizedName}`;

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from("project-plans")
          .upload(storagePath, file, { upsert: false });

        if (uploadErr) {
          console.error("Storage upload error:", uploadErr);
          toast.error(`Failed to upload "${file.name}": ${uploadErr.message}`);
          continue;
        }

        const { data: publicUrlData } = supabase.storage
          .from("project-plans")
          .getPublicUrl(uploadData?.path || storagePath);

        newPlans.push({
          id: `plan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          url: publicUrlData.publicUrl,
          path: uploadData?.path || storagePath,
          size: file.size,
          type: file.type || "application/octet-stream",
          uploaded_at: new Date().toISOString(),
        });
      }

      if (newPlans.length > 0) {
        const updatedPlans = [...(project.plans || []), ...newPlans];
        setProject({ ...project, plans: updatedPlans });
        await updateProjectPlansAction(project.id!, updatedPlans);
        toast.success(`${newPlans.length} file${newPlans.length > 1 ? "s" : ""} uploaded successfully!`);
      }
    } catch (err: unknown) {
      console.error("Failed to upload plan:", err);
      toast.error(err instanceof Error ? err.message : "Error uploading files.");
    } finally {
      setIsUploadingPlan(false);
      if (planFileInputRef.current) planFileInputRef.current.value = "";
    }
  };

  const handleDeletePlan = async (planIdentifier: string | number) => {
    if (!project || !project.plans) return;
    const plan =
      typeof planIdentifier === "number"
        ? project.plans[planIdentifier]
        : project.plans.find((p) => (p.id || p.url) === planIdentifier);
    if (!plan) return;

    setConfirmConfig({
      isOpen: true,
      title: "Remove Plan / Drawing",
      description: `Are you sure you want to remove "${plan.name}" from this project?`,
      confirmLabel: "Remove File",
      variant: "danger",
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        const updatedPlans =
          typeof planIdentifier === "number"
            ? project.plans!.filter((_, idx) => idx !== planIdentifier)
            : project.plans!.filter((p) => (p.id || p.url) !== planIdentifier);

        setProject({ ...project, plans: updatedPlans });
        if (previewImageIndex !== null) setPreviewImageIndex(null);

        startTransition(async () => {
          try {
            await updateProjectPlansAction(project.id!, updatedPlans);
            toast.success(`"${plan.name}" removed successfully.`);
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to remove plan file.");
          }
        });
      },
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
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl mb-5 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab("details")}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "details"
              ? "bg-[#1a73e8] text-white shadow-md shadow-[#1a73e8]/30 font-extrabold"
              : "text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800/60"
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
              : "text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800/60"
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Work Table</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              activeTab === "work"
                ? "bg-black/30 text-white font-extrabold"
                : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
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
              : "text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800/60"
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Ledger</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              activeTab === "timeline"
                ? "bg-black/30 text-white font-extrabold"
                : "bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30"
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
          <div className="p-5 rounded-2xl bg-white dark:bg-[#181a20] border border-slate-200 dark:border-[#282b35] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-orange-600 text-white font-extrabold flex items-center justify-center text-2xl shadow-md">
                  {clientInitial}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                      {project.name}
                    </h1>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {project.type || "Wiring"} Project • Registered on {project.created_at ? new Date(project.created_at).toLocaleDateString("en-IN") : "Active"}
                  </p>
                </div>
              </div>

              {/* Status Badge & Status Switcher */}
              <div className="flex flex-col sm:items-end gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
                          : "bg-slate-100 hover:bg-slate-200 dark:bg-[#121316] dark:hover:bg-slate-800 border border-slate-200 dark:border-[#2e323b] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Current Material Lists & Quotations under this Project */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Material Lists Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#181a20] border border-slate-200 dark:border-[#282b35] shadow-sm space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-[#282b35]">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                      <ListChecks className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Material Lists
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {materialLists.length} {materialLists.length === 1 ? "list" : "lists"} under this project
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/item-list/new?projectId=${project.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-xs shrink-0 active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New List</span>
                  </Link>
                </div>

                {/* Material Lists Items */}
                {materialLists.length === 0 ? (
                  <div className="py-7 text-center text-slate-500 text-xs">
                    <ListChecks className="w-7 h-7 mx-auto mb-1.5 text-slate-400 opacity-60" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No material lists created yet</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Add a list of pipes, wires, and fixtures required for this project.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1 max-h-72 overflow-y-auto pr-1">
                    {materialLists.map((ml) => (
                      <Link
                        key={ml.id}
                        href={`/dashboard/item-list/${ml.id}`}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#121316] dark:hover:bg-slate-800/80 border border-slate-200 dark:border-[#24262f] hover:border-sky-400 dark:hover:border-sky-500 transition-all group"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-sky-600 dark:group-hover:text-sky-400">
                            {ml.title}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                            <span>{ml.item_count || 0} items</span>
                            <span>•</span>
                            <span>{ml.created_at ? new Date(ml.created_at).toLocaleDateString("en-IN") : "Recent"}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20">
                            {ml.status || "Active"}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Quotations Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#181a20] border border-slate-200 dark:border-[#282b35] shadow-sm space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-[#282b35]">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Quotations
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {quotations.length} {quotations.length === 1 ? "quotation" : "quotations"} on this project
                      </p>
                    </div>
                  </div>

                  <Link
                    href={createQuoteUrl}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-xs shrink-0 active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Quote</span>
                  </Link>
                </div>

                {/* Quotations Items */}
                {quotations.length === 0 ? (
                  <div className="py-7 text-center text-slate-500 text-xs">
                    <FileSpreadsheet className="w-7 h-7 mx-auto mb-1.5 text-slate-400 opacity-60" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No quotations found for this project</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Create formal price estimates and quotes for this client.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1 max-h-72 overflow-y-auto pr-1">
                    {quotations.map((q) => {
                      const totalAmount = (q.items || []).reduce((sum, item) => sum + (Number(item.rate) || 0), 0);
                      return (
                        <Link
                          key={q.id}
                          href={`/dashboard/estimates/${q.id}`}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#121316] dark:hover:bg-slate-800/80 border border-slate-200 dark:border-[#24262f] hover:border-amber-400 dark:hover:border-amber-500 transition-all group"
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400">
                                {q.quotation_number}
                              </span>
                              <span className="text-[10px] text-slate-400">•</span>
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {q.subject || q.client_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                              <span>{q.items?.length || 0} items</span>
                              {totalAmount > 0 && <span>• ₹{totalAmount.toLocaleString("en-IN")}</span>}
                              <span>•</span>
                              <span>{q.quotation_date || "Recent"}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                q.status === "Approved"
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                                  : q.status === "Sent"
                                  ? "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30"
                                  : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                              }`}
                            >
                              {q.status || "Draft"}
                            </span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Client & Project Specs Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Card: Customer & Location Details */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#181a20] border border-slate-200 dark:border-[#282b35] shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>Customer &amp; Site Details</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#121316] border border-slate-200 dark:border-[#24262f]">
                  <span className="text-slate-600 dark:text-slate-300 font-semibold">Customer Name</span>
                  <span className="font-bold text-slate-950 dark:text-white">{project.name}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#121316] border border-slate-200 dark:border-[#24262f]">
                  <span className="text-slate-600 dark:text-slate-300 font-semibold">Phone Number</span>
                  <span className="font-mono font-bold text-slate-950 dark:text-slate-100">
                    {project.phone ? formatPhoneNumber(project.phone) : "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#121316] border border-slate-200 dark:border-[#24262f]">
                  <span className="text-slate-600 dark:text-slate-300 font-semibold">Site Location / Place</span>
                  <span className="font-bold text-slate-950 dark:text-slate-100 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                    {project.place || "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#121316] border border-slate-200 dark:border-[#24262f]">
                  <span className="text-slate-600 dark:text-slate-300 font-semibold">Project Type</span>
                  <span className="font-bold text-slate-950 dark:text-slate-100">{project.type || "Wiring"}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#121316] border border-slate-200 dark:border-[#24262f]">
                  <span className="text-slate-600 dark:text-slate-300 font-semibold">Project Duration</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                    {project.start_date || "Not set"} → {project.end_date || "Ongoing"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Card: Financial Standing */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#181a20] border border-slate-200 dark:border-[#282b35] shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Financial Statement</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("timeline")}
                    className="text-xs font-bold text-blue-600 dark:text-[#8ab4f8] hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
                  >
                    <span>View Ledger</span>
                    <span>→</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Total Money In Card */}
                  <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 dark:from-emerald-950/40 dark:via-emerald-900/20 dark:to-teal-950/30 border border-emerald-300/80 dark:border-emerald-500/30 shadow-xs flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                          <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                        </span>
                        Money In
                      </span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        {payments.length} {payments.length === 1 ? "payment" : "payments"}
                      </span>
                    </div>

                    <div>
                      <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 dark:text-emerald-300 tracking-tight">
                        ₹{projPaymentTotal.toLocaleString("en-IN")}
                      </div>
                      <span className="text-[11px] text-emerald-700/70 dark:text-emerald-400/80 font-medium">
                        Total client received amount
                      </span>
                    </div>
                  </div>

                  {/* Total Expenses Out Card */}
                  <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-pink-500/10 dark:from-rose-950/40 dark:via-rose-900/20 dark:to-pink-950/30 border border-rose-300/80 dark:border-rose-500/30 shadow-xs flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                        <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-700 dark:text-rose-300">
                          <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                        </span>
                        Expenses Out
                      </span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                        {expenses.length} {expenses.length === 1 ? "expense" : "expenses"}
                      </span>
                    </div>

                    <div>
                      <div className="text-2xl sm:text-3xl font-black font-mono text-rose-700 dark:text-rose-300 tracking-tight">
                        ₹{projExpenseTotal.toLocaleString("en-IN")}
                      </div>
                      <span className="text-[11px] text-rose-700/70 dark:text-rose-400/80 font-medium">
                        Total site materials &amp; costs
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {payments.length > 0 && (
                <div className="pt-1">
                  <Button
                    type="button"
                    onClick={() => {
                      try {
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
                        toast.success("Statement PDF downloaded successfully!");
                      } catch (err: unknown) {
                        toast.error(err instanceof Error ? err.message : "Failed to download statement PDF.");
                      }
                    }}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                    title="Download Statement of Payments Received from this client"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Download Statement (PDF)</span>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Scope & Description Card */}
          {project.description && (
            <div className="p-4 rounded-2xl bg-white dark:bg-[#181a20] border border-slate-200 dark:border-[#282b35] shadow-sm space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Scope of Work &amp; Description</span>
              </h3>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#121316] border border-slate-200 dark:border-[#24262f] text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                {project.description}
              </div>
            </div>
          )}

          {/* Blueprints, Site Photos & Documentation Section */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#181a20] border border-slate-200 dark:border-[#282b35] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#282b35]">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Images, Plans &amp; Paperwork ({(project.plans || []).length})</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Site progress photos, wiring diagrams, blueprints, permits and approvals
                </p>
              </div>

              <button
                type="button"
                onClick={() => planFileInputRef.current?.click()}
                disabled={isUploadingPlan}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1a73e8] hover:bg-[#1557bf] text-white text-xs font-bold transition-all disabled:opacity-50 self-start sm:self-auto shadow-sm active:scale-95"
              >
                {isUploadingPlan ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UploadCloud className="w-3.5 h-3.5" />
                )}
                <span>Upload Photos / Documents</span>
              </button>

              <input
                ref={planFileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf,.dwg,.dxf"
                className="hidden"
                onChange={handlePlanUpload}
              />
            </div>

            {/* Empty State */}
            {(!project.plans || project.plans.length === 0) ? (
              <div
                onClick={() => planFileInputRef.current?.click()}
                className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-300 dark:border-[#282b35] bg-slate-50/50 dark:bg-transparent text-slate-500 dark:text-slate-400 text-xs cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-900/40 transition-colors"
              >
                <ImageIcon className="w-8 h-8 mx-auto mb-2 text-slate-400 dark:text-slate-500 opacity-60" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">No photos or documents uploaded yet</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Click here or the button above to upload site photos, blueprints, or diagrams (JPG, PNG, PDF up to 20MB).
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 1. Dedicated Image Previews Gallery */}
                {imagePlans.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <span>Photo Previews</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                          {imagePlans.length}
                        </span>
                      </span>
                      <span className="text-[11px] text-slate-500">Click photo to view full size</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {imagePlans.map((imgPlan, imgIdx) => (
                        <div
                          key={imgPlan.id || imgPlan.url}
                          className="group rounded-xl overflow-hidden bg-slate-50 dark:bg-[#121316] border border-slate-200 dark:border-[#24262f] hover:border-blue-400 dark:hover:border-blue-500 transition-all shadow-xs flex flex-col"
                        >
                          {/* Image Thumbnail with Overlay */}
                          <div
                            onClick={() => setPreviewImageIndex(imgIdx)}
                            className="relative aspect-4/3 w-full overflow-hidden bg-slate-200 dark:bg-slate-800 cursor-pointer"
                          >
                            <img
                              src={imgPlan.url}
                              alt={imgPlan.name}
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <span className="p-2 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors shadow-sm">
                                <Eye className="w-4 h-4" />
                              </span>
                            </div>
                          </div>

                          {/* Footer with Title & Quick Actions */}
                          <div className="p-2.5 flex items-center justify-between gap-1.5">
                            <div className="min-w-0 flex-1">
                              <p
                                onClick={() => setPreviewImageIndex(imgIdx)}
                                className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                                title={imgPlan.name}
                              >
                                {imgPlan.name}
                              </p>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                {formatFileSize(imgPlan.size)}
                              </p>
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <a
                                href={imgPlan.url}
                                download={imgPlan.name}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                                title="Download image"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                              <button
                                type="button"
                                onClick={() => handleDeletePlan(imgPlan.id || imgPlan.url)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                                title="Delete image"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Documents & PDFs List */}
                {docPlans.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span>Documents &amp; PDFs</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-blue-500/15 text-blue-700 dark:text-blue-400">
                        {docPlans.length}
                      </span>
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {docPlans.map((plan) => (
                        <div
                          key={plan.id || plan.url}
                          className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#121316] border border-slate-200 dark:border-[#24262f] hover:border-slate-300 dark:hover:border-[#383c48] transition-all group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-white dark:bg-[#181a20] border border-slate-200 dark:border-[#282b35] flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0">
                              <a
                                href={plan.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 truncate block hover:underline"
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
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                              title="Open / Download"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDeletePlan(plan.id || plan.url)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                              title="Delete file"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
          {/* Attractive Financial Summary Strip under Tabs */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#181a20] border border-slate-200 dark:border-[#282b35] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              {/* Total Money In Card */}
              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-teal-500/10 dark:from-emerald-950/40 dark:via-emerald-900/20 dark:to-teal-950/30 border border-emerald-300 dark:border-emerald-500/30 shadow-xs">
                <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                </span>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block leading-tight">
                    Money In
                  </span>
                  <span className="text-base sm:text-lg font-black font-mono text-emerald-700 dark:text-emerald-300 leading-tight">
                    ₹{projPaymentTotal.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Total Expenses Out Card */}
              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-amber-500/10 dark:from-rose-950/40 dark:via-rose-900/20 dark:to-amber-950/30 border border-rose-300 dark:border-rose-500/30 shadow-xs">
                <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-700 dark:text-rose-300">
                  <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                </span>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 block leading-tight">
                    Expenses Out
                  </span>
                  <span className="text-base sm:text-lg font-black font-mono text-rose-700 dark:text-rose-300 leading-tight">
                    ₹{projExpenseTotal.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Transactions count chip */}
              <span className="text-[11px] font-mono px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700/80">
                {timelineItems.length} transactions
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {payments.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    try {
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
                      toast.success("Statement PDF downloaded successfully!");
                    } catch (err: unknown) {
                      toast.error(err instanceof Error ? err.message : "Failed to download statement PDF.");
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                  title="Download Statement of Payments Received from this client"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Statement (PDF)</span>
                </button>
              )}
            </div>
          </div>

          {/* Transaction Timeline Feed (Left = Expense, Right = Payment) */}
          <div className="flex-1 space-y-5 pt-2 pb-8">
            {timelineItems.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-[#1a1c22] border border-slate-200 dark:border-[#292c36] flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
                  <Receipt className="w-8 h-8 stroke-[1.5]" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">No transactions yet</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Start by logging client payments on the right or site expenses on the left.
                </p>
              </div>
            ) : (
              groupedTimeline.map((group, groupIdx) => (
                <div key={`group-${groupIdx}`} className="space-y-3">
                  {/* Date divider separator */}
                  <div className="flex items-center justify-center py-1">
                    <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-[#18191f] border border-slate-200 dark:border-[#262832] text-[10px] font-semibold text-slate-600 dark:text-slate-400 tracking-tight shadow-xs">
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
                            <div className="w-full max-w-sm rounded-3xl rounded-tl-xs bg-white dark:bg-[#1f2127] border border-rose-200 dark:border-[#2d313c] p-4 text-slate-900 dark:text-white shadow-md hover:border-rose-400 dark:hover:border-rose-500/30 transition-all">
                              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pb-1">
                                <span className="font-semibold text-rose-600 dark:text-rose-300 truncate max-w-[200px]">
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
                                    className="text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 p-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono py-1">
                                ₹{item.amount.toLocaleString("en-IN")}
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                                <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
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
                            <div className="w-full max-w-sm rounded-3xl rounded-tr-xs bg-white dark:bg-[#282a32] border border-emerald-200 dark:border-[#383c48] p-4 text-slate-900 dark:text-white shadow-md hover:border-emerald-400 dark:hover:border-emerald-500/30 transition-all">
                              <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 pb-1">
                                <span className="font-semibold truncate max-w-[200px] text-slate-900 dark:text-white">
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
                                    className="text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 p-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono py-1">
                                ₹{item.amount.toLocaleString("en-IN")}
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 pt-1">
                                <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
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
          toast.success("Payment recorded successfully!");
        }}
      />

      <RecordExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        defaultProjectId={project.id}
        onSuccess={() => {
          setIsExpenseModalOpen(false);
          loadData();
          toast.success("Site expense logged successfully!");
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
          toast.success("Attendance entries recorded successfully!");
        }}
      />

      {/* Action Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        description={confirmConfig.description}
        confirmLabel={confirmConfig.confirmLabel}
        variant={confirmConfig.variant}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
      {/* Full-Screen Image Lightbox Preview Modal */}
      {previewImageIndex !== null && imagePlans[previewImageIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-150"
          onClick={() => setPreviewImageIndex(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[95vh] flex flex-col items-center justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Top Control Bar */}
            <div className="w-full flex items-center justify-between pb-3 text-white border-b border-white/10 px-2">
              <div className="min-w-0 pr-4">
                <h4 className="text-sm font-bold truncate">
                  {imagePlans[previewImageIndex].name}
                </h4>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Image {previewImageIndex + 1} of {imagePlans.length} • {formatFileSize(imagePlans[previewImageIndex].size)}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={imagePlans[previewImageIndex].url}
                  download={imagePlans[previewImageIndex].name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
                  title="Download image"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download</span>
                </a>
                <a
                  href={imagePlans[previewImageIndex].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="Open full resolution in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImageIndex(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/80 text-white transition-colors"
                  title="Close preview (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Center Image with Previous & Next Navigation */}
            <div className="relative w-full flex-1 flex items-center justify-center py-4 overflow-hidden min-h-[250px]">
              {imagePlans.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setPreviewImageIndex((prev) =>
                      prev !== null && prev > 0 ? prev - 1 : imagePlans.length - 1
                    )
                  }
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition-all shadow-xl backdrop-blur-xs border border-white/10 hover:scale-105 active:scale-95"
                  title="Previous image (Left Arrow)"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              <img
                src={imagePlans[previewImageIndex].url}
                alt={imagePlans[previewImageIndex].name}
                className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl border border-white/10 select-none"
              />

              {imagePlans.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setPreviewImageIndex((prev) =>
                      prev !== null && prev < imagePlans.length - 1 ? prev + 1 : 0
                    )
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition-all shadow-xl backdrop-blur-xs border border-white/10 hover:scale-105 active:scale-95"
                  title="Next image (Right Arrow)"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
