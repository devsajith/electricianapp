"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Zap,
  XCircle,
  Building2,
  IndianRupee,
  Loader2,
  AlertCircle,
  Sun,
  Sunset,
} from "lucide-react";
import { Labour } from "@/lib/types/labour";
import { ProjectRecord } from "@/app/dashboard/projects/actions";
import { Button } from "@/components/ui/button";

export type AttendanceOption = "full_day" | "half_day" | "overtime" | "absent";

interface MarkAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: Labour;
  projects: ProjectRecord[];
  initialDate?: string;
  onSaveAttendance: (attendanceData: {
    type: AttendanceOption;
    date: string;
    projectId: string;
    projectName: string;
    tach: string;
    otHours: string;
    amount: number;
    attendance_status: AttendanceOption;
  }) => Promise<void>;
}

const QUICK_OT_HOURS = ["1", "1.5", "2", "3", "4", "5", "6"];

export function MarkAttendanceModal({
  isOpen,
  onClose,
  worker,
  projects,
  initialDate,
  onSaveAttendance,
}: MarkAttendanceModalProps) {
  const todayStr = new Date().toISOString().split("T")[0];

  const [attendanceType, setAttendanceType] = useState<AttendanceOption>("full_day");
  const [date, setDate] = useState<string>(initialDate || todayStr);
  const [projectId, setProjectId] = useState<string>("");
  const [otHours, setOtHours] = useState<string>("2");
  const [includeFullShift, setIncludeFullShift] = useState<boolean>(true);
  const [amount, setAmount] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync date when initialDate changes
  useEffect(() => {
    if (initialDate) {
      setDate(initialDate);
    } else {
      setDate(todayStr);
    }
  }, [initialDate, todayStr, isOpen]);

  // Sync default project
  useEffect(() => {
    if (projects && projects.length > 0 && !projectId) {
      setProjectId(projects[0].id || "");
    }
  }, [projects, projectId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!date) {
      setErrorMsg("Please select a date for attendance.");
      return;
    }

    if (attendanceType === "overtime" && (!otHours || Number(otHours) <= 0)) {
      setErrorMsg("Please specify overtime hours worked.");
      return;
    }

    setIsSaving(true);

    try {
      const selectedProj = projects.find((p) => p.id === projectId);
      const projectName = selectedProj
        ? `${selectedProj.name}${selectedProj.place ? ` (${selectedProj.place})` : ""}`
        : "General Electrical Work";

      let tachValue = "1";
      let otValue = "0";

      if (attendanceType === "full_day") {
        tachValue = "1";
        otValue = "0";
      } else if (attendanceType === "half_day") {
        tachValue = "0.5";
        otValue = "0";
      } else if (attendanceType === "overtime") {
        tachValue = includeFullShift ? "1" : "0";
        otValue = String(otHours);
      } else if (attendanceType === "absent") {
        tachValue = "0";
        otValue = "0";
      }

      const wageAmount = attendanceType === "absent" ? 0 : Number(amount) || 0;

      await onSaveAttendance({
        type: attendanceType,
        date,
        projectId,
        projectName,
        tach: tachValue,
        otHours: otValue,
        amount: wageAmount,
        attendance_status: attendanceType,
      });

      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to record attendance.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#181a20] border-t sm:border border-[#2a2d36] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 shadow-2xl max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#282b35]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-lg shadow-sm">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base leading-tight">
                Mark Attendance
              </h3>
              <p className="text-xs text-slate-400">
                Worker: <strong className="text-slate-200">{worker.name}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Date Selection Row */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Attendance Date</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-[#121317] border border-[#2d303a] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <button
                type="button"
                onClick={() => setDate(todayStr)}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-colors border ${
                  date === todayStr
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : "bg-[#14151a] text-slate-400 border-[#2b2d38] hover:text-white"
                }`}
              >
                Today
              </button>
            </div>
          </div>

          {/* 2. THE 4 ATTENDANCE OPTIONS (Full Day, Half Day, Over Time, Absent) */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Select Attendance Option
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Option 1: Full Day */}
              <button
                type="button"
                onClick={() => setAttendanceType("full_day")}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[76px] relative ${
                  attendanceType === "full_day"
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-md ring-2 ring-emerald-500/40"
                    : "bg-[#14151a] border-[#262834] text-slate-300 hover:border-slate-700 hover:bg-[#1a1c24]"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Sun className="w-4 h-4" />
                  </div>
                  {attendanceType === "full_day" && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-sm text-white">Full Day</div>
                  <div className="text-[11px] text-slate-400">1 Normal Shift</div>
                </div>
              </button>

              {/* Option 2: Half Day */}
              <button
                type="button"
                onClick={() => setAttendanceType("half_day")}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[76px] relative ${
                  attendanceType === "half_day"
                    ? "bg-amber-500/15 border-amber-500 text-amber-300 shadow-md ring-2 ring-amber-500/40"
                    : "bg-[#14151a] border-[#262834] text-slate-300 hover:border-slate-700 hover:bg-[#1a1c24]"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Sunset className="w-4 h-4" />
                  </div>
                  {attendanceType === "half_day" && (
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-sm text-white">Half Day</div>
                  <div className="text-[11px] text-slate-400">0.5 Shift (½ Day)</div>
                </div>
              </button>

              {/* Option 3: Over Time */}
              <button
                type="button"
                onClick={() => setAttendanceType("overtime")}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[76px] relative ${
                  attendanceType === "overtime"
                    ? "bg-purple-500/15 border-purple-500 text-purple-300 shadow-md ring-2 ring-purple-500/40"
                    : "bg-[#14151a] border-[#262834] text-slate-300 hover:border-slate-700 hover:bg-[#1a1c24]"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  {attendanceType === "overtime" && (
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-sm text-white">Over Time</div>
                  <div className="text-[11px] text-slate-400">Extra Work Hours</div>
                </div>
              </button>

              {/* Option 4: Absent */}
              <button
                type="button"
                onClick={() => {
                  setAttendanceType("absent");
                  setAmount("0");
                }}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[76px] relative ${
                  attendanceType === "absent"
                    ? "bg-rose-500/15 border-rose-500 text-rose-300 shadow-md ring-2 ring-rose-500/40"
                    : "bg-[#14151a] border-[#262834] text-slate-300 hover:border-slate-700 hover:bg-[#1a1c24]"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <XCircle className="w-4 h-4" />
                  </div>
                  {attendanceType === "absent" && (
                    <CheckCircle2 className="w-4 h-4 text-rose-400" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-sm text-white">Absent</div>
                  <div className="text-[11px] text-slate-400">Leave / Off Day</div>
                </div>
              </button>
            </div>
          </div>

          {/* 3. Dynamic Overtime Hours Sub-Section (When Over Time is Selected) */}
          {attendanceType === "overtime" && (
            <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>Overtime Hours Worked</span>
                </span>
                <span className="text-xs font-bold font-mono text-purple-200">
                  {otHours || "0"} Hours
                </span>
              </div>

              {/* Quick Hours Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {QUICK_OT_HOURS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setOtHours(h)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      otHours === h
                        ? "bg-purple-600 text-white border-purple-500 shadow-sm"
                        : "bg-[#1c1d26] text-slate-300 border-[#2f3142] hover:text-white"
                    }`}
                  >
                    {h} hrs
                  </button>
                ))}
              </div>

              {/* Custom Hours Input */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  placeholder="Custom OT hours"
                  value={otHours}
                  onChange={(e) => setOtHours(e.target.value)}
                  className="flex-1 px-3 py-2 bg-[#121317] border border-purple-500/40 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>

              {/* Full Day + OT Switch */}
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1 border-t border-purple-500/20">
                <input
                  type="checkbox"
                  checked={includeFullShift}
                  onChange={(e) => setIncludeFullShift(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                />
                <span>Includes regular Full Day Shift + Overtime hours</span>
              </label>
            </div>
          )}

          {/* 4. Project Selection (Hidden if Absent) */}
          {attendanceType !== "absent" && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Site / Project Worked</span>
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#121317] border border-[#2d303a] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.place ? `(${p.place})` : ""}
                  </option>
                ))}
                {projects.length === 0 && (
                  <option value="">General Electrical Work</option>
                )}
              </select>
            </div>
          )}

          {/* 5. Optional Wage Paid (Disabled for Absent) */}
          {attendanceType !== "absent" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Wage Paid for this Day (Optional)</span>
                </label>
                <span className="text-[10px] text-slate-500">Leave blank if paying later</span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  placeholder="e.g. 900 (or leave 0)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-[#121317] border border-[#2d303a] rounded-xl text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSaving}
              className={`w-full py-3 h-11 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                attendanceType === "absent"
                  ? "bg-rose-600 hover:bg-rose-500 text-white"
                  : attendanceType === "overtime"
                  ? "bg-purple-600 hover:bg-purple-500 text-white"
                  : attendanceType === "half_day"
                  ? "bg-amber-600 hover:bg-amber-500 text-white"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Attendance...</span>
                </>
              ) : attendanceType === "absent" ? (
                <>
                  <XCircle className="w-4 h-4" />
                  <span>Mark as Absent</span>
                </>
              ) : attendanceType === "overtime" ? (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Record Overtime ({otHours}h)</span>
                </>
              ) : attendanceType === "half_day" ? (
                <>
                  <Sunset className="w-4 h-4" />
                  <span>Record Half Day Attendance</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Record Full Day Attendance</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
