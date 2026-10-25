"use client";

import React, { useEffect, useState, useTransition, use, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  Plus,
  Trash2,
  Calendar,
  IndianRupee,
  Building2,
  CheckCircle2,
  Info,
  X,
  Loader2,
  AlertTriangle,
  Clock,
  Send,
  User,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Labour, LabourEntry } from "@/lib/types/labour";
import { HeaderSlot } from "@/components/header-context";
import { LabourAttendanceCalendar } from "@/components/labour-attendance-calendar";
import { MarkAttendanceModal, AttendanceOption } from "@/components/mark-attendance-modal";
import { LabourPaymentModal } from "@/components/labour-payment-modal";
import {
  getLaboursAction,
  getLabourEntriesAction,
  createLabourEntryAction,
  deleteLabourEntryAction,
} from "../actions";
import { getProjectsAction, ProjectRecord } from "@/app/dashboard/projects/actions";

function getDayName(dateString: string): string {
  if (!dateString) return "";
  const parts = dateString.split("-").map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return "";
  }
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString("en-US", { weekday: "short" });
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

export default function LabourDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [worker, setWorker] = useState<Labour | null>(null);
  const [entries, setEntries] = useState<LabourEntry[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"attendance" | "payments">("attendance");

  // Modals state
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];
  const [attendanceInitialDate, setAttendanceInitialDate] = useState<string>(todayStr);

  const [isPending, startTransition] = useTransition();

  const loadData = useCallback(async () => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 2500);

    try {
      const [allLabours, workerEntries, projs] = await Promise.all([
        getLaboursAction(),
        getLabourEntriesAction(id),
        getProjectsAction(),
      ]);
      clearTimeout(timer);

      const found = allLabours.find((l) => l.id === id);
      if (found) {
        setWorker(found);
      } else {
        setErrorMsg("Worker record not found.");
      }

      setEntries(workerEntries || []);
      setProjects(projs || []);
    } catch (err) {
      console.error("Error loading worker detail:", err);
      clearTimeout(timer);
      setErrorMsg("Failed to load worker records.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Attendance modal with preselected date
  const handleOpenMarkAttendance = (dateStr?: string) => {
    if (dateStr) {
      setAttendanceInitialDate(dateStr);
    }
    setIsAttendanceModalOpen(true);
  };

  // Open Payment modal
  const handleOpenPayModal = () => {
    setIsPaymentModalOpen(true);
  };

  // 1. Attendance Saver (supports Full Day, Half Day, Over Time with hours, Absent)
  const handleSaveAttendance = async (attendanceData: {
    type: AttendanceOption;
    date: string;
    projectId: string;
    projectName: string;
    tach: string;
    otHours: string;
    amount: number;
    attendance_status?: AttendanceOption;
  }) => {
    if (!worker) return;

    const res = await createLabourEntryAction({
      worker_id: worker.id,
      project_id: attendanceData.projectId,
      project_name: attendanceData.projectName,
      date: attendanceData.date,
      day: getDayName(attendanceData.date),
      tach: attendanceData.tach,
      ot: attendanceData.otHours,
      amount_paid: attendanceData.amount,
      amount: attendanceData.amount,
      attendance_status: attendanceData.attendance_status || attendanceData.type,
    });

    if (res.error) {
      throw new Error(res.error);
    } else if (res.data) {
      setEntries((prev) => [res.data!, ...prev]);
    }
  };

  // 2. Wage Payment Saver (dedicated payment to labour)
  const handleSavePayment = async (paymentData: {
    amount: number;
    date: string;
    projectId?: string;
    projectName?: string;
    paymentMethod: string;
    notes?: string;
  }) => {
    if (!worker) return;

    const res = await createLabourEntryAction({
      worker_id: worker.id,
      project_id: paymentData.projectId || "",
      project_name: paymentData.projectName || "Direct Wage Payment",
      date: paymentData.date,
      day: getDayName(paymentData.date),
      tach: "0",
      ot: "0",
      amount_paid: paymentData.amount,
      amount: paymentData.amount,
      attendance_status: "payment_only",
    });

    if (res.error) {
      throw new Error(res.error);
    } else if (res.data) {
      setEntries((prev) => [res.data!, ...prev]);
    }
  };

  const handleDeleteEntry = (entryId: string, amount: number) => {
    if (!confirm(`Delete this record${amount > 0 ? ` of ₹${amount}` : ""}?`)) return;
    startTransition(async () => {
      setEntries((prev) => prev.filter((item) => item.id !== entryId));
      await deleteLabourEntryAction(entryId);
    });
  };

  // Group payment entries chronologically for Payment feed
  const paymentEntries = useMemo(() => {
    return entries.filter((e) => (Number(e.amount_paid ?? e.amount) || 0) > 0);
  }, [entries]);

  const groupedPaymentEntries = useMemo(() => {
    const sorted = [...paymentEntries].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    const groups: { header: string; items: LabourEntry[] }[] = [];
    let currentHeader = "";
    let currentItems: LabourEntry[] = [];

    for (const item of sorted) {
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
  }, [paymentEntries]);

  if (loading) {
    return (
      <>
        <HeaderSlot>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href="/dashboard/labour"
              aria-label="Back to Labour"
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
          Opening worker wage history...
        </div>
      </>
    );
  }

  if (!worker) {
    return (
      <div className="max-w-md mx-auto space-y-4 text-center py-16 px-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Worker Not Found</h2>
        <p className="text-xs text-slate-400">
          The labour record you requested does not exist or may have been removed.
        </p>
        <Link href="/dashboard/labour">
          <Button variant="outline" className="border-slate-800 text-xs text-slate-300">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Return to Labour
          </Button>
        </Link>
      </div>
    );
  }

  const totalWages = entries.reduce(
    (sum, e) => sum + (Number(e.amount_paid ?? e.amount) || 0),
    0
  );
  const totalDays = entries.length;
  const attendanceDaysCount = entries.filter((e) => {
    if (e.attendance_status === "absent" || e.attendance_status === "payment_only") {
      return false;
    }
    const tach = Number(e.tach);
    const ot = Number(e.ot) || 0;
    return tach > 0 || ot > 0;
  }).length;
  const workerInitial = worker.name ? worker.name.trim().charAt(0).toUpperCase() : "W";
  const phoneDigits = worker.phone ? worker.phone.replace(/[^0-9+]/g, "") : "";

  return (
    <div className="max-w-2xl mx-auto flex flex-col min-h-[calc(100vh-8rem)] relative pb-28 select-none">
      {/* 1. Details injected into Navbar itself */}
      <HeaderSlot>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Back button */}
          <Link
            href="/dashboard/labour"
            aria-label="Back to Labour"
            className="p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          {/* Worker Avatar Circle (Matches Image 2 Orange Initial) */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-base sm:text-lg shadow-sm shrink-0">
            {workerInitial}
          </div>

          {/* Worker Info */}
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate leading-tight">
              {worker.name}
            </h2>
            <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 font-medium leading-none mt-0.5">
              {worker.phone && <span>{worker.phone}</span>}
              {worker.place && <span>• {worker.place}</span>}
            </div>
          </div>
        </div>

        {/* Right Action Icons: Section Toggle, Call, Details */}
        <div className="flex items-center gap-1.5 shrink-0">
          {phoneDigits && (
            <a
              href={`tel:${phoneDigits}`}
              title="Call Worker"
              className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
            </a>
          )}

          {activeSection === "payments" ? (
            <button
              type="button"
              onClick={() => setActiveSection("attendance")}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-100 dark:bg-[#1e2025] hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-[#2e323b] text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors shadow-sm"
              title="Switch to Attendance Section"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Attendance</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveSection("payments")}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-100 dark:bg-[#1e2025] hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-[#2e323b] text-xs font-bold text-blue-600 dark:text-[#8ab4f8] hover:text-blue-700 dark:hover:text-blue-200 transition-colors shadow-sm"
              title="Switch to Payments Section"
            >
              <IndianRupee className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Payments</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsDetailsOpen(true)}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-100 dark:bg-[#1e2025] hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-[#2e323b] text-xs font-bold text-blue-600 dark:text-[#8ab4f8] hover:text-blue-700 dark:hover:text-blue-200 transition-colors shadow-sm"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Details</span>
          </button>
        </div>
      </HeaderSlot>

      {/* 2. Top Summary Banner with Quick Actions */}
      <div className="mt-3 mb-3 p-4 rounded-2xl bg-gradient-to-r from-[#1a1c22] to-[#15171d] border border-[#282a33] flex items-center justify-between gap-3 shadow-sm flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          {/* Attendance metric */}
          <button
            type="button"
            onClick={() => setActiveSection("attendance")}
            className="text-left group cursor-pointer"
          >
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Attendance
            </span>
            <div className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-400 font-mono transition-colors">
              {attendanceDaysCount} <span className="text-xs text-slate-400 font-normal">Days Worked</span>
            </div>
          </button>

          <div className="h-8 w-px bg-slate-800 hidden sm:block" />

          {/* Wages metric */}
          <button
            type="button"
            onClick={() => setActiveSection("payments")}
            className="text-left group cursor-pointer"
          >
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Total Wages Paid
            </span>
            <div className="text-sm sm:text-base font-bold text-emerald-400 group-hover:text-emerald-300 font-mono transition-colors">
              ₹{totalWages.toLocaleString("en-IN")}
            </div>
          </button>
        </div>

        {/* Quick Top Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
          <Button
            type="button"
            size="sm"
            onClick={() => handleOpenMarkAttendance()}
            className="rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold text-xs h-8 px-3 shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Mark Attendance</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleOpenPayModal}
            className="rounded-xl bg-[#1a73e8] hover:bg-[#1557bf] text-white font-bold text-xs h-8 px-3 shadow-sm flex items-center gap-1.5"
          >
            <IndianRupee className="w-3.5 h-3.5" />
            <span>Pay Wage</span>
          </Button>
        </div>
      </div>

      {/* 3. Dedicated Section Switcher Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-[#181a20] border border-[#282a33] rounded-2xl mb-4 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveSection("attendance")}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeSection === "attendance"
              ? "bg-emerald-500/20 text-emerald-400 shadow-sm border border-emerald-500/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Attendance &amp; Shifts</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/30 text-emerald-300 font-mono">
            {attendanceDaysCount} Days
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("payments")}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeSection === "payments"
              ? "bg-[#1a73e8]/20 text-[#8ab4f8] shadow-sm border border-[#1a73e8]/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <IndianRupee className="w-4 h-4" />
          <span>Payments to Labour</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#1a73e8]/30 text-blue-300 font-mono">
            ₹{totalWages.toLocaleString("en-IN")}
          </span>
        </button>
      </div>
      {/* 4. SECTION 1: ATTENDANCE */}
      {activeSection === "attendance" ? (
        <div className="flex-1 pb-24 space-y-4">
          <LabourAttendanceCalendar
            entries={entries}
            workerName={worker.name}
            onAddAttendanceForDate={handleOpenMarkAttendance}
            onDeleteEntry={handleDeleteEntry}
          />
        </div>
      ) : (
        /* 5. SECTION 2: PAYMENTS TO LABOUR */
        <div className="flex-1 space-y-4 pb-24">
          {/* Payment Section Header Card */}
          <div className="p-4 rounded-2xl bg-[#181a20] border border-[#262832] flex items-center justify-between gap-3 shadow-sm flex-wrap sm:flex-nowrap">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Payment History &amp; Ledger
              </span>
              <h4 className="text-sm sm:text-base font-bold text-white">
                Wages paid to {worker.name}
              </h4>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={handleOpenPayModal}
              className="rounded-xl bg-[#1a73e8] hover:bg-[#1557bf] text-white font-bold text-xs h-8 px-3 shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Payment</span>
            </Button>
          </div>

          {/* Payment Feed */}
          {paymentEntries.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-3 bg-[#181a20] rounded-2xl border border-[#262832]">
              <div className="w-16 h-16 rounded-full bg-[#14151a] border border-[#292c36] flex items-center justify-center mx-auto text-slate-500">
                <IndianRupee className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h3 className="text-sm font-bold text-white">No payment records yet</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Tap &quot;Record Payment&quot; below to log wage payouts, cash disbursements, or UPI transfers.
              </p>
              <Button
                type="button"
                size="sm"
                onClick={handleOpenPayModal}
                className="rounded-xl bg-[#1a73e8] hover:bg-[#1557bf] text-white text-xs font-bold"
              >
                + Record First Payment
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {groupedPaymentEntries.map((group, groupIdx) => (
                <div key={`group-${groupIdx}`} className="space-y-3">
                  {/* Date Header Divider */}
                  <div className="flex items-center justify-center py-1">
                    <div className="px-3 py-1 rounded-full bg-[#18191f] border border-[#262832] text-[10px] font-semibold text-slate-400 tracking-tight shadow-xs">
                      {group.header}
                    </div>
                  </div>

                  {/* Payment Cards */}
                  <div className="space-y-3">
                    {group.items.map((entry) => {
                      const amt = Number(entry.amount_paid ?? entry.amount) || 0;

                      return (
                        <div key={entry.id} className="flex justify-end ml-4 sm:ml-16">
                          <div className="w-full max-w-md rounded-3xl rounded-tr-xs bg-[#242630] border border-[#343846] p-4 text-white shadow-md hover:border-emerald-500/30 transition-all">
                            <div className="flex items-center justify-between text-xs text-slate-300 pb-1">
                              <span className="font-semibold truncate max-w-[200px]">
                                Payment to {worker.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteEntry(entry.id, amt)}
                                title="Delete payment"
                                className="p-1 rounded-full text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Big Amount */}
                            <div className="text-2xl sm:text-3xl font-black text-white font-mono py-1">
                              ₹{amt.toLocaleString("en-IN")}
                            </div>

                            {/* Status badge with green checkmark */}
                            <div className="flex items-center justify-between text-[11px] pt-1">
                              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                Paid • {entry.date}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {entry.project_name || "Direct Wage"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 z-30 bg-[#111216]/98 backdrop-blur-xl border-t border-[#23252d] px-3.5 py-2.5 safe-area-pb shadow-2xl">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          {/* Button 1: Mark Attendance (Emerald) */}
          <button
            type="button"
            onClick={() => handleOpenMarkAttendance()}
            className="flex-1 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Calendar className="w-4 h-4" />
            <span>Mark Attendance</span>
          </button>

          {/* Button 2: Pay Wage (Blue) */}
          <button
            type="button"
            onClick={handleOpenPayModal}
            className="flex-1 py-2.5 rounded-full bg-[#1a73e8] hover:bg-[#1557bf] text-white text-xs font-bold shadow-md shadow-[#1a73e8]/30 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <IndianRupee className="w-4 h-4" />
            <span>Pay Wage</span>
          </button>

          {/* Quick Call */}
          {phoneDigits && (
            <a
              href={`tel:${phoneDigits}`}
              title="Call Worker"
              className="p-2.5 rounded-full bg-[#1e2025] hover:bg-slate-800 text-slate-200 border border-[#2d313b] shrink-0 active:scale-95 transition-all flex items-center justify-center"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
            </a>
          )}
        </div>
      </div>

      {/* 7. Dedicated Mark Attendance Modal */}
      <MarkAttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        worker={worker}
        projects={projects}
        initialDate={attendanceInitialDate}
        onSaveAttendance={handleSaveAttendance}
      />

      {/* 8. Dedicated Pay Labour Modal */}
      <LabourPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        worker={worker}
        projects={projects}
        onSavePayment={handleSavePayment}
      />

      {/* 6. Details Drawer */}
      {isDetailsOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200"
          onClick={() => setIsDetailsOpen(false)}
        >
          <div
            className="bg-[#181a20] border-t border-[#2a2d36] rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-250 shadow-2xl max-w-lg w-full mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#282b35]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-lg">
                  {workerInitial}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{worker.name}</h3>
                  <p className="text-xs text-slate-400">Worker Profile &amp; Contact</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#111216] border border-[#24262f] text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Phone
                </span>
                <span className="font-mono text-slate-200">{worker.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Place / Location
                </span>
                <span className="font-semibold text-white">{worker.place}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Total Days Worked
                </span>
                <span className="font-mono text-slate-200">{attendanceDaysCount} Days</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Lifetime Wages Paid
                </span>
                <span className="font-bold text-emerald-400 font-mono">
                  ₹{totalWages.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                className="px-4 py-2 rounded-full bg-slate-800 text-xs font-bold text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
