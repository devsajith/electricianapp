"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  IndianRupee,
  Building2,
  Trash2,
  Plus,
  AlertCircle,
  Sun,
  Sunset,
  Zap,
  XCircle,
} from "lucide-react";
import { LabourEntry } from "@/lib/types/labour";
import { Button } from "@/components/ui/button";

export type DayStatus = "full_day" | "half_day" | "overtime" | "absent" | "payment_only" | "none";

export function getDayAttendanceStatus(list: LabourEntry[]): {
  status: DayStatus;
  otHours: number;
  totalWage: number;
  label: string;
} {
  if (!list || list.length === 0) {
    return { status: "none", otHours: 0, totalWage: 0, label: "No Record" };
  }

  let hasAbsent = false;
  let hasOt = false;
  let otHours = 0;
  let hasHalf = false;
  let hasFull = false;
  let hasPaymentOnly = false;
  let totalWage = 0;

  for (const e of list) {
    const tach = Number(e.tach);
    const ot = Number(e.ot) || 0;
    const wage = Number(e.amount_paid ?? e.amount) || 0;
    totalWage += wage;

    if (e.attendance_status === "absent") {
      hasAbsent = true;
    } else if (e.attendance_status === "payment_only") {
      hasPaymentOnly = true;
    } else if (e.attendance_status === "overtime" || ot > 0) {
      hasOt = true;
      otHours += ot;
    } else if (e.attendance_status === "half_day" || tach === 0.5) {
      hasHalf = true;
    } else if (e.attendance_status === "full_day" || tach === 1 || tach > 0.5) {
      hasFull = true;
    } else if (tach === 0 && ot === 0) {
      if (wage === 0) {
        hasAbsent = true;
      } else {
        hasPaymentOnly = true;
      }
    }
  }

  if (hasOt) return { status: "overtime", otHours, totalWage, label: `+${otHours}h OT` };
  if (hasFull) return { status: "full_day", otHours: 0, totalWage, label: "Full Day" };
  if (hasHalf) return { status: "half_day", otHours: 0, totalWage, label: "Half Day" };
  if (hasAbsent) return { status: "absent", otHours: 0, totalWage, label: "Absent" };
  if (hasPaymentOnly) return { status: "payment_only", otHours: 0, totalWage, label: "Payment" };

  return { status: "full_day", otHours: 0, totalWage, label: "Full Day" };
}

interface LabourAttendanceCalendarProps {
  entries: LabourEntry[];
  workerName: string;
  onAddAttendanceForDate: (dateStr: string) => void;
  onDeleteEntry?: (entryId: string, amount: number) => void;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function LabourAttendanceCalendar({
  entries,
  workerName,
  onAddAttendanceForDate,
  onDeleteEntry,
}: LabourAttendanceCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const todayDateStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [today]);

  // Current view month & year
  const [viewDate, setViewDate] = useState<Date>(() => new Date());
  // Selected date on calendar (defaults to today)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => todayDateStr);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  // Index entries by normalized YYYY-MM-DD
  const entriesByDate = useMemo(() => {
    const map: Record<string, LabourEntry[]> = {};
    for (const e of entries) {
      if (!e.date) continue;
      const d = e.date.split("T")[0].trim();
      if (!map[d]) map[d] = [];
      map[d].push(e);
    }
    return map;
  }, [entries]);

  // Monthly statistics categorized by the 4 attendance types
  const monthlyStats = useMemo(() => {
    let fullDaysCount = 0;
    let halfDaysCount = 0;
    let otHoursCount = 0;
    let absentCount = 0;
    let totalWages = 0;

    const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;

    Object.entries(entriesByDate).forEach(([dStr, list]) => {
      if (dStr.startsWith(prefix)) {
        const info = getDayAttendanceStatus(list);
        if (info.status === "full_day") fullDaysCount += 1;
        else if (info.status === "half_day") halfDaysCount += 1;
        else if (info.status === "overtime") {
          fullDaysCount += 1;
          otHoursCount += info.otHours;
        } else if (info.status === "absent") absentCount += 1;

        totalWages += info.totalWage;
      }
    });

    const totalWorkingDays = fullDaysCount + halfDaysCount * 0.5;

    return {
      fullDaysCount,
      halfDaysCount,
      otHoursCount,
      absentCount,
      totalWorkingDays,
      totalWages,
    };
  }, [entriesByDate, viewYear, viewMonth]);

  // Generate grid days for current month
  const calendarGrid = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: Array<{
      dayNumber: number;
      dateStr: string;
      isCurrentMonth: boolean;
      statusInfo: ReturnType<typeof getDayAttendanceStatus>;
      entriesList: LabourEntry[];
      isToday: boolean;
    }> = [];

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const pDay = daysInPrevMonth - i;
      const pMonth = viewMonth === 0 ? 11 : viewMonth - 1;
      const pYear = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dStr = `${pYear}-${String(pMonth + 1).padStart(2, "0")}-${String(pDay).padStart(2, "0")}`;
      const dayEntries = entriesByDate[dStr] || [];

      cells.push({
        dayNumber: pDay,
        dateStr: dStr,
        isCurrentMonth: false,
        statusInfo: getDayAttendanceStatus(dayEntries),
        entriesList: dayEntries,
        isToday: dStr === todayDateStr,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayEntries = entriesByDate[dStr] || [];

      cells.push({
        dayNumber: d,
        dateStr: dStr,
        isCurrentMonth: true,
        statusInfo: getDayAttendanceStatus(dayEntries),
        entriesList: dayEntries,
        isToday: dStr === todayDateStr,
      });
    }

    // Next month padding days to complete 35 or 42 cells
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let n = 1; n <= remaining; n++) {
        const nMonth = viewMonth === 11 ? 0 : viewMonth + 1;
        const nYear = viewMonth === 11 ? viewYear + 1 : viewYear;
        const dStr = `${nYear}-${String(nMonth + 1).padStart(2, "0")}-${String(n).padStart(2, "0")}`;
        const dayEntries = entriesByDate[dStr] || [];

        cells.push({
          dayNumber: n,
          dateStr: dStr,
          isCurrentMonth: false,
          statusInfo: getDayAttendanceStatus(dayEntries),
          entriesList: dayEntries,
          isToday: dStr === todayDateStr,
        });
      }
    }

    return cells;
  }, [viewYear, viewMonth, entriesByDate, todayDateStr]);

  const handlePrevMonth = () => {
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setViewDate(now);
    setSelectedDateStr(todayDateStr);
  };

  // Selected date entries & details
  const selectedEntries = entriesByDate[selectedDateStr] || [];
  const selectedDayStatus = getDayAttendanceStatus(selectedEntries);

  const selectedDateFormatted = useMemo(() => {
    try {
      const [y, m, d] = selectedDateStr.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return selectedDateStr;
    }
  }, [selectedDateStr]);

  return (
    <div className="space-y-4">
      {/* 1. Month Navigation & 4-Option Attendance Summary */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#181a20] border border-[#262832] shadow-sm space-y-4">
        {/* Navigation Row */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-sm">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </h3>
              <p className="text-[11px] text-slate-400">
                Attendance sheet for <strong className="text-slate-200">{workerName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleJumpToToday}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-[#20222a] hover:bg-[#282a35] text-slate-300 hover:text-white border border-[#2f3240] transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous Month"
              className="p-1.5 rounded-xl bg-[#20222a] hover:bg-[#282a35] text-slate-300 hover:text-white border border-[#2f3240] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next Month"
              className="p-1.5 rounded-xl bg-[#20222a] hover:bg-[#282a35] text-slate-300 hover:text-white border border-[#2f3240] transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4 Attendance Metrics Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#262832]">
          {/* Full Day Card */}
          <div className="p-2.5 rounded-xl bg-[#14151a] border border-[#242630] flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                <Sun className="w-3 h-3" /> Full Day
              </span>
              <div className="text-base sm:text-lg font-bold text-white font-mono mt-0.5">
                {monthlyStats.fullDaysCount} <span className="text-xs text-slate-400 font-normal">Days</span>
              </div>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>

          {/* Half Day Card */}
          <div className="p-2.5 rounded-xl bg-[#14151a] border border-[#242630] flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1">
                <Sunset className="w-3 h-3" /> Half Day
              </span>
              <div className="text-base sm:text-lg font-bold text-white font-mono mt-0.5">
                {monthlyStats.halfDaysCount} <span className="text-xs text-slate-400 font-normal">Days</span>
              </div>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          </div>

          {/* Overtime Card */}
          <div className="p-2.5 rounded-xl bg-[#14151a] border border-[#242630] flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3" /> Over Time
              </span>
              <div className="text-base sm:text-lg font-bold text-purple-300 font-mono mt-0.5">
                {monthlyStats.otHoursCount} <span className="text-xs text-slate-400 font-normal">Hrs</span>
              </div>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />
          </div>

          {/* Absent Card */}
          <div className="p-2.5 rounded-xl bg-[#14151a] border border-[#242630] flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1">
                <XCircle className="w-3 h-3" /> Absent
              </span>
              <div className="text-base sm:text-lg font-bold text-rose-300 font-mono mt-0.5">
                {monthlyStats.absentCount} <span className="text-xs text-slate-400 font-normal">Days</span>
              </div>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
          </div>
        </div>
      </div>

      {/* 2. Visual Calendar Grid */}
      <div className="p-3 sm:p-5 rounded-2xl bg-[#181a20] border border-[#262832] shadow-sm select-none">
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
          {DAY_LABELS.map((day, idx) => (
            <div
              key={day}
              className={`text-[11px] sm:text-xs font-bold py-1 ${
                idx === 0 || idx === 6 ? "text-amber-400/90" : "text-slate-400"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid Cells */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarGrid.map((cell) => {
            const isSelected = cell.dateStr === selectedDateStr;
            const { status, otHours, label } = cell.statusInfo;
            const hasAtt = status !== "none" && status !== "payment_only";

            // Determine styling based on the 4 attendance options
            let badgeBg = "bg-[#14151a] border-[#22242e] hover:bg-[#1e2028]";
            let dotColor = "";
            let textColor = "text-slate-300";

            if (status === "full_day") {
              badgeBg = isSelected
                ? "bg-emerald-500/25 border-emerald-400 shadow-md ring-2 ring-emerald-500/60"
                : "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20";
              dotColor = "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]";
              textColor = "text-emerald-300 font-bold";
            } else if (status === "half_day") {
              badgeBg = isSelected
                ? "bg-amber-500/25 border-amber-400 shadow-md ring-2 ring-amber-500/60"
                : "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20";
              dotColor = "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]";
              textColor = "text-amber-300 font-bold";
            } else if (status === "overtime") {
              badgeBg = isSelected
                ? "bg-purple-500/25 border-purple-400 shadow-md ring-2 ring-purple-500/60"
                : "bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20";
              dotColor = "bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]";
              textColor = "text-purple-300 font-bold";
            } else if (status === "absent") {
              badgeBg = isSelected
                ? "bg-rose-500/25 border-rose-400 shadow-md ring-2 ring-rose-500/60"
                : "bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20";
              dotColor = "bg-rose-400";
              textColor = "text-rose-300 font-bold";
            } else if (isSelected) {
              badgeBg = "bg-[#242732] border-blue-500 ring-2 ring-blue-500/50";
            }

            return (
              <button
                key={cell.dateStr}
                type="button"
                onClick={() => setSelectedDateStr(cell.dateStr)}
                className={`min-h-[58px] sm:min-h-[72px] p-1 sm:p-1.5 rounded-xl flex flex-col justify-between transition-all text-left relative group border ${
                  !cell.isCurrentMonth ? "opacity-30 bg-[#121317] border-transparent" : badgeBg
                }`}
              >
                {/* Top: Day Number & Attendance Marker */}
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs sm:text-sm font-semibold rounded-md px-1 ${
                      cell.isToday
                        ? "bg-blue-600 text-white font-bold"
                        : textColor
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {/* Marker Dot */}
                  {dotColor && (
                    <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                  )}
                </div>

                {/* Bottom: Attendance Status Tag */}
                <div className="w-full mt-1">
                  {status === "full_day" && (
                    <span className="text-[8px] sm:text-[9px] text-emerald-400 font-bold block truncate">
                      ✓ Full
                    </span>
                  )}
                  {status === "half_day" && (
                    <span className="text-[8px] sm:text-[9px] text-amber-400 font-bold block truncate">
                      ½ Half
                    </span>
                  )}
                  {status === "overtime" && (
                    <span className="text-[8px] sm:text-[9px] text-purple-400 font-bold block truncate">
                      +{otHours}h OT
                    </span>
                  )}
                  {status === "absent" && (
                    <span className="text-[8px] sm:text-[9px] text-rose-400 font-bold block truncate">
                      ✕ Absent
                    </span>
                  )}
                  {!hasAtt && (
                    <span className="text-[9px] text-slate-600 hidden sm:inline">-</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* 4-Option Visual Legend */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-[#262832] text-[10px] sm:text-xs text-slate-400 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-slate-300 font-medium">Full Day</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-slate-300 font-medium">Half Day</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
            <span className="text-slate-300 font-medium">Over Time (OT)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span className="text-slate-300 font-medium">Absent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-600 inline-block" />
            <span className="text-slate-300 font-medium">Today</span>
          </div>
        </div>
      </div>

      {/* 3. Selected Day Inspector & Quick Attendance Action */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#181a20] to-[#14151a] border border-[#282a35] shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Selected Date Inspector
            </span>
            <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>{selectedDateFormatted}</span>
              {selectedDateStr === todayDateStr && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">
                  Today
                </span>
              )}
            </h4>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => onAddAttendanceForDate(selectedDateStr)}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 px-3 shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Mark / Change Attendance</span>
          </Button>
        </div>

        {/* Detailed Entries for Selected Day */}
        {selectedEntries.length > 0 ? (
          <div className="space-y-2 pt-1">
            {selectedEntries.map((entry, idx) => {
              const tach = Number(entry.tach);
              const ot = Number(entry.ot) || 0;
              const wage = Number(entry.amount_paid ?? entry.amount) || 0;
              const isAbsent =
                entry.attendance_status === "absent" ||
                (tach === 0 && ot === 0 && wage === 0);

              return (
                <div
                  key={entry.id || idx}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 shadow-sm transition-all ${
                    isAbsent
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-200"
                      : ot > 0
                      ? "bg-purple-500/10 border-purple-500/30"
                      : tach === 0.5
                      ? "bg-amber-500/10 border-amber-500/30"
                      : "bg-[#1d1f27] border-[#2d303c]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isAbsent
                          ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                          : ot > 0
                          ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                          : tach === 0.5
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      }`}
                    >
                      {isAbsent ? (
                        <XCircle className="w-5 h-5" />
                      ) : ot > 0 ? (
                        <Zap className="w-5 h-5" />
                      ) : tach === 0.5 ? (
                        <Sunset className="w-5 h-5" />
                      ) : (
                        <Sun className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">
                          {isAbsent
                            ? "Absent / Leave"
                            : entry.project_name || "General Electrical Work"}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isAbsent
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : ot > 0
                              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                              : tach === 0.5
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          {isAbsent
                            ? "Absent"
                            : ot > 0
                            ? `Overtime (${entry.ot}h)`
                            : tach === 0.5
                            ? "Half Day"
                            : "Full Day"}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        {!isAbsent && (
                          <span>Shift: {entry.tach || "1"} Day</span>
                        )}
                        {ot > 0 && (
                          <span className="text-purple-400 font-semibold">
                            • {entry.ot} hrs Overtime
                          </span>
                        )}
                        {wage > 0 && (
                          <span className="text-emerald-400 font-mono">
                            • Wage Paid: ₹{wage.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {onDeleteEntry && (
                      <button
                        type="button"
                        onClick={() => onDeleteEntry(entry.id, wage)}
                        title="Delete this attendance record"
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-[#14151a] border border-[#22242e] text-center space-y-1">
            <p className="text-xs text-slate-400">
              No attendance logged for this date.
            </p>
            <p className="text-[11px] text-slate-500">
              Tap &quot;Mark / Change Attendance&quot; to log Full Day, Half Day, Over Time (with hours), or Absent.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
