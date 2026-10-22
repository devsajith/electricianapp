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

  // Add Record Modal / Form state
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSavingRecord, setIsSavingRecord] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];
  const [entryDate, setEntryDate] = useState<string>(todayStr);
  const [entryProjectId, setEntryProjectId] = useState<string>("");
  const [entryTach, setEntryTach] = useState<string>("1");
  const [entryOt, setEntryOt] = useState<string>("0");
  const [entryAmount, setEntryAmount] = useState<string>("");

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
      if (projs && projs.length > 0 && !entryProjectId) {
        setEntryProjectId(projs[0].id || "");
      }
    } catch (err) {
      console.error("Error loading worker detail:", err);
      clearTimeout(timer);
      setErrorMsg("Failed to load worker records.");
    } finally {
      setLoading(false);
    }
  }, [id, entryProjectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker) return;

    if (!entryDate) {
      setFormError("Please select a work date.");
      return;
    }
    if (!entryAmount || Number(entryAmount) <= 0) {
      setFormError("Please enter wage amount paid.");
      return;
    }

    setIsSavingRecord(true);
    setFormError(null);

    const selProj = projects.find((p) => p.id === entryProjectId);
    const projectName = selProj ? `${selProj.name}${selProj.place ? ` (${selProj.place})` : ""}` : "Site Work";

    try {
      const res = await createLabourEntryAction({
        worker_id: worker.id,
        project_id: entryProjectId,
        project_name: projectName,
        date: entryDate,
        day: getDayName(entryDate),
        tach: entryTach || "1",
        ot: entryOt || "0",
        amount_paid: Number(entryAmount),
        amount: Number(entryAmount),
      });

      if (res.error) {
        setFormError(res.error);
      } else if (res.data) {
        setEntries((prev) => [res.data!, ...prev]);
        setEntryAmount("");
        setIsAddRecordOpen(false);
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to record wage.");
    } finally {
      setIsSavingRecord(false);
    }
  };

  const handleDeleteEntry = (entryId: string, amount: number) => {
    if (!confirm(`Delete wage record of ₹${amount}?`)) return;
    startTransition(async () => {
      setEntries((prev) => prev.filter((item) => item.id !== entryId));
      await deleteLabourEntryAction(entryId);
    });
  };

  // Group entries chronologically
  const groupedEntries = useMemo(() => {
    // Sort oldest first so stream flows downward (like Google Pay chat)
    const sorted = [...entries].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
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
  }, [entries]);

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 text-xs">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Opening worker wage history...
      </div>
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
        <Link href="/dashboard">
          <Button variant="outline" className="border-slate-800 text-xs text-slate-300">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Return to Home
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
  const workerInitial = worker.name ? worker.name.trim().charAt(0).toUpperCase() : "W";
  const phoneDigits = worker.phone ? worker.phone.replace(/[^0-9+]/g, "") : "";

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

          {/* Worker Avatar Circle (Matches Image 2 Orange S) */}
          <div className="w-10 h-10 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-lg shadow-sm shrink-0">
            {workerInitial}
          </div>

          {/* Worker Info */}
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base font-bold text-white truncate leading-tight">
              {worker.name}
            </h2>
            <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5 font-medium">
              {worker.phone && <span>{worker.phone}</span>}
              {worker.place && <span>• {worker.place}</span>}
            </div>
          </div>
        </div>

        {/* Right Action Icons: Call, Details */}
        <div className="flex items-center gap-1.5 shrink-0">
          {phoneDigits && (
            <a
              href={`tel:${phoneDigits}`}
              title="Call Worker"
              className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Phone className="w-5 h-5" />
            </a>
          )}

          <button
            type="button"
            onClick={() => setIsDetailsOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#1e2025] hover:bg-slate-700/80 border border-[#2e323b] text-xs font-bold text-[#8ab4f8] hover:text-blue-200 transition-colors shadow-sm"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Details</span>
          </button>
        </div>
      </div>

      {/* 2. Top Banner Card (Google Pay "Tap to view" style in Image 2) */}
      <div className="mt-3 mb-2 p-3.5 rounded-2xl bg-gradient-to-r from-[#1a1c22] to-[#15171d] border border-[#282a33] flex items-center justify-between gap-3 shadow-sm">
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Wage Account Summary
          </span>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-300">
              Total Wages: <strong className="text-emerald-400 font-mono">₹{totalWages.toLocaleString("en-IN")}</strong>
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-300">
              Attendance: <strong className="text-white font-mono">{totalDays} Days</strong>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddRecordOpen(true)}
          className="text-xs font-bold text-[#8ab4f8] hover:text-blue-300 shrink-0"
        >
          + Add Wage &gt;
        </button>
      </div>

      {/* 3. Transaction Timeline Feed (Exact Google Pay Payment Cards in Image 2) */}
      <div className="flex-1 space-y-5 pt-3">
        {entries.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#1a1c22] border border-[#292c36] flex items-center justify-center mx-auto text-slate-500">
              <IndianRupee className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h3 className="text-sm font-bold text-white">No wage records yet</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Tap Pay Wage below to record attendance, site overtime, or daily wages.
            </p>
          </div>
        ) : (
          groupedEntries.map((group, groupIdx) => (
            <div key={`group-${groupIdx}`} className="space-y-3">
              {/* Date Header Divider */}
              <div className="flex items-center justify-center py-1">
                <div className="px-3 py-1 rounded-full bg-[#18191f] border border-[#262832] text-[10px] font-semibold text-slate-400 tracking-tight shadow-xs">
                  {group.header}
                </div>
              </div>

              {/* Wage Payment Cards matching Image 2 */}
              <div className="space-y-3">
                {group.items.map((entry) => {
                  const amt = Number(entry.amount_paid ?? entry.amount) || 0;

                  return (
                    <div key={entry.id} className="flex justify-end ml-4 sm:ml-20">
                      <div className="w-full max-w-sm rounded-3xl rounded-tr-xs bg-[#282a32] border border-[#383c48] p-4 text-white shadow-md hover:border-emerald-500/30 transition-all">
                        <div className="flex items-center justify-between text-xs text-slate-300 pb-1">
                          <span className="font-semibold truncate max-w-[200px]">
                            Payment to {worker.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteEntry(entry.id, amt)}
                            title="Delete entry"
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Big Amount (Matches ₹3,300, ₹1,300 in Image 2) */}
                        <div className="text-2xl sm:text-3xl font-black text-white font-mono py-1">
                          ₹{amt.toLocaleString("en-IN")}
                        </div>

                        {/* Status badge with green checkmark (Matches Image 2) */}
                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Paid • {entry.date}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {entry.project_name || "Site Work"}
                          </span>
                        </div>

                        {/* Overtime & Shift info */}
                        <div className="flex items-center gap-3 pt-2 mt-2 border-t border-[#383c48]/60 text-[10px] text-slate-400">
                          <span>Shift: <strong>{entry.tach || "1"} Day</strong></span>
                          <span>•</span>
                          <span>OT: <strong>{entry.ot || "0"} hrs</strong></span>
                          <span>•</span>
                          <span>Day: <strong>{entry.day || "Day"}</strong></span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 4. Bottom Sticky Action Bar (Matches Google Pay Image 2 bottom) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#111216]/98 backdrop-blur-xl border-t border-[#23252d] px-3.5 py-2.5 safe-area-pb shadow-2xl">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          {/* Main Pay Wage Button (Google Pay blue pill in Image 2) */}
          <button
            type="button"
            onClick={() => setIsAddRecordOpen(true)}
            className="flex-1 py-2.5 rounded-full bg-[#1a73e8] hover:bg-[#1557bf] text-white text-xs font-bold shadow-md shadow-[#1a73e8]/30 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Pay Wage / Add Record</span>
          </button>

          {/* Quick Call */}
          {phoneDigits && (
            <a
              href={`tel:${phoneDigits}`}
              className="px-4 py-2.5 rounded-full bg-[#1e2025] hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-[#2d313b] shrink-0 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Call</span>
            </a>
          )}
        </div>
      </div>

      {/* 5. Add Record / Pay Wage Drawer Modal */}
      {isAddRecordOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200"
          onClick={() => setIsAddRecordOpen(false)}
        >
          <div
            className="bg-[#181a20] border-t border-[#2a2d36] rounded-t-3xl p-5 space-y-4 max-h-[88vh] overflow-y-auto animate-in slide-in-from-bottom duration-250 shadow-2xl max-w-lg w-full mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#282b35]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-sm">
                  ₹
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Record Wage Payment</h3>
                  <p className="text-[11px] text-slate-400">Payment to {worker.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddRecordOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveRecord} className="space-y-3">
              {/* Wage Amount (Big field) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Amount Paid (INR) *
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-base font-bold text-emerald-400">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    autoFocus
                    value={entryAmount}
                    onChange={(e) => setEntryAmount(e.target.value)}
                    placeholder="1300"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#111216] border border-[#2a2d36] text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:border-[#1a73e8]"
                  />
                </div>
              </div>

              {/* Site / Project Selection */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Work Site / Project
                </label>
                <select
                  value={entryProjectId}
                  onChange={(e) => setEntryProjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#111216] border border-[#2a2d36] text-xs text-white focus:outline-none focus:border-[#1a73e8]"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.place ? `(${p.place})` : ""}
                    </option>
                  ))}
                  <option value="">General / Shop Work</option>
                </select>
              </div>

              {/* Work Date */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#111216] border border-[#2a2d36] text-xs text-white focus:outline-none focus:border-[#1a73e8]"
                />
              </div>

              {/* Shift Tach & OT in grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Shift (Tach)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={entryTach}
                    onChange={(e) => setEntryTach(e.target.value)}
                    placeholder="1"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#111216] border border-[#2a2d36] text-xs text-white focus:outline-none focus:border-[#1a73e8]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Overtime (OT hrs)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={entryOt}
                    onChange={(e) => setEntryOt(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#111216] border border-[#2a2d36] text-xs text-white focus:outline-none focus:border-[#1a73e8]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddRecordOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingRecord}
                  className="px-5 py-2 rounded-xl bg-[#1a73e8] hover:bg-[#1557bf] text-xs font-bold text-white disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {isSavingRecord && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Record Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                <span className="font-mono text-slate-200">{totalDays} Days</span>
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
