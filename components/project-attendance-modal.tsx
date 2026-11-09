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
  Users,
} from "lucide-react";
import { Labour } from "@/lib/types/labour";
import { Button } from "@/components/ui/button";
import { createLabourEntryAction } from "@/app/dashboard/labour/actions";

export type AttendanceOption = "full_day" | "half_day" | "overtime" | "absent";

interface ProjectAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  workers: Labour[];
  initialDate?: string;
  onSuccess: () => void;
}

const QUICK_OT_HOURS = ["1", "1.5", "2", "3", "4", "5", "6"];

export function ProjectAttendanceModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  workers,
  initialDate,
  onSuccess,
}: ProjectAttendanceModalProps) {
  const todayStr = new Date().toISOString().split("T")[0];

  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");
  const [attendanceType, setAttendanceType] = useState<AttendanceOption>("full_day");
  const [date, setDate] = useState<string>(initialDate || todayStr);
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

  // Set default worker if available
  useEffect(() => {
    if (workers && workers.length > 0 && !selectedWorkerId) {
      setSelectedWorkerId(workers[0].id);
    }
  }, [workers, selectedWorkerId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedWorkerId) {
      setErrorMsg("Please select a labour/worker.");
      return;
    }

    if (!date) {
      setErrorMsg("Please select a date for work.");
      return;
    }

    if (attendanceType === "overtime" && (!otHours || Number(otHours) <= 0)) {
      setErrorMsg("Please specify extra hours (OT) worked.");
      return;
    }

    setIsSaving(true);

    try {
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

      const d = new Date(date);
      const dayName = isNaN(d.getTime())
        ? ""
        : d.toLocaleDateString("en-US", { weekday: "short" });

      const res = await createLabourEntryAction({
        worker_id: selectedWorkerId,
        project_id: projectId,
        project_name: projectName,
        date,
        day: dayName,
        tach: tachValue,
        ot: otValue,
        amount_paid: wageAmount,
        attendance_status: attendanceType,
      });

      if (res.error) {
        throw new Error(res.error);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to record labour work.");
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
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-lg shadow-sm">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base leading-tight">
                Log Labour Work / Attendance
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-[260px]">
                Project: <strong className="text-slate-200">{projectName}</strong>
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
          {/* Worker Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Select Labour / Electrician</span>
            </label>
            <select
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#121317] border border-[#2d303a] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              {workers.length === 0 ? (
                <option value="">No workers found - add labours in Labour section</option>
              ) : (
                workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} {w.place ? `(${w.place})` : ""}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Date Selection Row */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-blue-400" />
              <span>Work Date</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-[#121317] border border-[#2d303a] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <button
                type="button"
                onClick={() => setDate(todayStr)}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-colors border ${
                  date === todayStr
                    ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
                    : "bg-[#14151a] text-slate-400 border-[#2b2d38] hover:text-white"
                }`}
              >
                Today
              </button>
            </div>
          </div>

          {/* Attendance Shift Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Shift &amp; Working Mode
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Option 1: Full Day */}
              <button
                type="button"
                onClick={() => setAttendanceType("full_day")}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[74px] relative ${
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
                  <div className="text-[11px] text-slate-400">1 Full Shift</div>
                </div>
              </button>

              {/* Option 2: Half Day */}
              <button
                type="button"
                onClick={() => setAttendanceType("half_day")}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[74px] relative ${
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
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[74px] relative ${
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
                  <div className="font-bold text-sm text-white">Over Time (OT)</div>
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
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[74px] relative ${
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

          {/* Overtime Hours Configuration */}
          {attendanceType === "overtime" && (
            <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  Extra Hours Worked (OT)
                </span>
                <span className="text-xs font-mono font-bold text-purple-300">
                  {otHours || 0} Hours OT
                </span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {QUICK_OT_HOURS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setOtHours(h)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      otHours === h
                        ? "bg-purple-600 text-white shadow-sm ring-1 ring-purple-400"
                        : "bg-[#181920] border border-purple-500/20 text-purple-300 hover:bg-purple-500/20"
                    }`}
                  >
                    +{h}h
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-slate-400">Custom OT hours:</span>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={otHours}
                  onChange={(e) => setOtHours(e.target.value)}
                  placeholder="e.g. 2.5"
                  className="w-24 px-3 py-1.5 bg-[#121317] border border-purple-500/30 rounded-xl text-xs text-white text-right focus:outline-none focus:ring-1 focus:ring-purple-400 font-mono"
                />
                <span className="text-xs text-slate-400">hrs</span>
              </div>

              {/* Checkbox for full shift inclusion */}
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1 border-t border-purple-500/20">
                <input
                  type="checkbox"
                  checked={includeFullShift}
                  onChange={(e) => setIncludeFullShift(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <span>Include Normal Full Day shift (1 Shift + {otHours || 0}h OT)</span>
              </label>
            </div>
          )}

          {/* Wage / Amount Paid (Optional) */}
          {attendanceType !== "absent" && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Daily Wage / Payment Paid (Optional)</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  Recorded in labour wage records
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0 (Enter amount if paid on site)"
                  className="w-full pl-8 pr-4 py-2.5 bg-[#121317] border border-[#2d303a] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2.5 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 border-[#2e313b] text-slate-300 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !selectedWorkerId}
              className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold gap-2 shadow-md shadow-amber-600/30"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Labour Work</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
