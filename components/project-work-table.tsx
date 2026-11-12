"use client";

import React, { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  Download,
  Plus,
  Trash2,
  Search,
  Users,
  Calendar,
  Clock,
  Zap,
  Sun,
  Sunset,
  XCircle,
  Table as TableIcon,
  CheckCircle2,
} from "lucide-react";
import { LabourEntry } from "@/lib/types/labour";
import { Button } from "@/components/ui/button";

interface ProjectWorkTableProps {
  entries: LabourEntry[];
  projectId: string;
  projectName: string;
  onAddAttendance?: () => void;
  onDeleteEntry?: (id: string, workerName: string, date: string) => void;
}

export function ProjectWorkTable({
  entries,
  projectId,
  projectName,
  onAddAttendance,
  onDeleteEntry,
}: ProjectWorkTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"workers" | "days">("workers");

  // Format date helper (e.g. 12 Nov 2026)
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Filter entries belonging to this project
  const projectEntries = useMemo(() => {
    return entries
      .filter((e) => (e.project_id ? e.project_id === projectId : false))
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [entries, projectId]);

  // Aggregate project statistics
  const { totalWorkDays, totalDeployments, totalShifts, totalOtHours } = useMemo(() => {
    const datesSet = new Set<string>();
    let shiftsSum = 0;
    let otSum = 0;
    let deploymentsCount = 0;

    for (const e of projectEntries) {
      const tach = Number(e.tach) || 0;
      const ot = Number(e.ot) || 0;
      const isWorking =
        e.attendance_status !== "absent" &&
        (tach > 0 ||
          ot > 0 ||
          e.attendance_status === "full_day" ||
          e.attendance_status === "half_day" ||
          e.attendance_status === "overtime");

      if (isWorking) {
        if (e.date) datesSet.add(e.date.split("T")[0]);
        shiftsSum += tach;
        otSum += ot;
        deploymentsCount += 1;
      }
    }

    return {
      totalWorkDays: datesSet.size,
      totalDeployments: deploymentsCount,
      totalShifts: shiftsSum,
      totalOtHours: otSum,
    };
  }, [projectEntries]);

  // Filtered entries for "workers" mode
  const filteredWorkerEntries = useMemo(() => {
    if (!searchQuery.trim()) return projectEntries;
    const q = searchQuery.toLowerCase().trim();
    return projectEntries.filter((e) => {
      const name = (e.worker_name || "").toLowerCase();
      const date = (e.date || "").toLowerCase();
      const day = (e.day || "").toLowerCase();
      const notes = (e.notes || "").toLowerCase();
      const status = (e.attendance_status || "").toLowerCase();
      return (
        name.includes(q) ||
        date.includes(q) ||
        day.includes(q) ||
        notes.includes(q) ||
        status.includes(q)
      );
    });
  }, [projectEntries, searchQuery]);

  // Grouped summaries for "days" mode
  const daySummaries = useMemo(() => {
    const map: Record<string, LabourEntry[]> = {};
    for (const e of projectEntries) {
      if (!e.date) continue;
      const d = e.date.split("T")[0];
      if (!map[d]) map[d] = [];
      map[d].push(e);
    }

    const list = Object.entries(map).map(([date, items]) => {
      const working = items.filter(
        (it) => it.attendance_status !== "absent" && (Number(it.tach) > 0 || Number(it.ot) > 0)
      );
      const shifts = working.reduce((sum, it) => sum + (Number(it.tach) || 0), 0);
      const ot = working.reduce((sum, it) => sum + (Number(it.ot) || 0), 0);
      const workerNames = working.map((w) => w.worker_name || "Worker").filter(Boolean);

      const dateObj = new Date(date);
      const dayName = items[0]?.day || (!isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString("en-US", { weekday: "short" }) : "");

      return {
        date,
        formattedDate: formatDate(date),
        dayName,
        workersCount: working.length,
        workerNames,
        shifts,
        ot,
        items,
      };
    });

    list.sort((a, b) => b.date.localeCompare(a.date));

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (d) =>
        d.date.includes(q) ||
        d.dayName.toLowerCase().includes(q) ||
        d.workerNames.some((n) => n.toLowerCase().includes(q))
    );
  }, [projectEntries, searchQuery]);

  // Export to CSV
  const handleExportCsv = () => {
    if (projectEntries.length === 0) {
      alert("No work records to export.");
      return;
    }

    const headers = [
      "#",
      "Date",
      "Day",
      "Worker Name",
      "Attendance Status",
      "Shift (Tach)",
      "Overtime (OT Hours)",
      "Notes",
    ];

    const rows = projectEntries.map((e, idx) => [
      idx + 1,
      `"${e.date || ""}"`,
      `"${e.day || ""}"`,
      `"${(e.worker_name || "").replace(/"/g, '""')}"`,
      `"${e.attendance_status || "full_day"}"`,
      Number(e.tach) || 0,
      Number(e.ot) || 0,
      `"${(e.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const safeName = projectName.replace(/[^a-zA-Z0-9_-]/g, "_");
    link.setAttribute("download", `${safeName}_Work_Timesheet.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status?: string, tach?: string, ot?: string) => {
    const s = status || "full_day";
    const tachNum = Number(tach) || 0;
    const otNum = Number(ot) || 0;

    if (s === "half_day" || tachNum === 0.5) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 whitespace-nowrap">
          <Sunset className="w-3 h-3" /> Half Day
        </span>
      );
    }
    if (s === "overtime" || otNum > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30 whitespace-nowrap">
          <Zap className="w-3 h-3" /> Overtime
        </span>
      );
    }
    if (s === "absent") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 whitespace-nowrap">
          <XCircle className="w-3 h-3" /> Absent
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
        <Sun className="w-3 h-3" /> Full Day
      </span>
    );
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950 font-sans select-none">
      {/* ======================================================== */}
      {/* 1. GREEN EXCEL RIBBON TOP BAR                            */}
      {/* ======================================================== */}
      <div className="bg-[#107c41] px-4 py-2 flex flex-wrap items-center justify-between text-white border-b border-emerald-800 text-xs gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <FileSpreadsheet className="w-4 h-4 text-emerald-200 shrink-0" />
          <span className="font-bold tracking-wide font-mono truncate">
            {projectName.replace(/\s+/g, "_")}_Work_Timesheet.xlsx
          </span>
          <span className="text-[10px] bg-emerald-900/60 text-emerald-200 px-2 py-0.5 rounded font-mono font-semibold">
            AutoSave: On
          </span>
          <span className="text-[11px] text-emerald-100 hidden sm:inline">
            Showing {viewMode === "workers" ? filteredWorkerEntries.length : daySummaries.length} rows
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode Switcher */}
          <div className="inline-flex rounded-lg bg-emerald-900/70 p-0.5 border border-emerald-700 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setViewMode("workers")}
              className={`px-2.5 py-0.5 rounded-md transition-all ${
                viewMode === "workers"
                  ? "bg-white text-emerald-950 font-bold shadow-xs"
                  : "text-emerald-100 hover:text-white"
              }`}
            >
              All Workers
            </button>
            <button
              type="button"
              onClick={() => setViewMode("days")}
              className={`px-2.5 py-0.5 rounded-md transition-all ${
                viewMode === "days"
                  ? "bg-white text-emerald-950 font-bold shadow-xs"
                  : "text-emerald-100 hover:text-white"
              }`}
            >
              Daily Summary
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded font-bold text-xs shadow-sm transition-colors border border-emerald-600 cursor-pointer"
            title="Export to Excel CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {onAddAttendance && (
            <Button
              type="button"
              size="xs"
              onClick={onAddAttendance}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Log Attendance</span>
            </Button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. SEARCH & SUMMARY SUB-BAR                              */}
      {/* ======================================================== */}
      <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by worker name, date, or status..."
            className="w-full pl-8 pr-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
          <span>
            Total Days: <strong className="text-amber-400 font-bold">{totalWorkDays}</strong>
          </span>
          <span>•</span>
          <span>
            Total Shifts: <strong className="text-emerald-400 font-bold">{totalShifts.toFixed(1)}</strong>
          </span>
          <span>•</span>
          <span>
            Overtime: <strong className="text-purple-400 font-bold">+{totalOtHours.toFixed(1)}h</strong>
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. MINIMAL EXCEL SPREADSHEET TABLE                       */}
      {/* ======================================================== */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[650px] font-sans text-xs">
          {/* Column Alphabet Index Row (A, B, C, D, E...) */}
          <thead>
            <tr className="bg-slate-900 border-b border-slate-700 text-slate-300 text-[11px] font-mono select-none">
              <th className="w-12 py-2 px-3 text-center border-r border-slate-700/80 bg-slate-900 text-slate-500 font-bold text-[10px]">
                ◢
              </th>

              {viewMode === "workers" ? (
                <>
                  <th className="py-2 px-3 border-r border-slate-700/80 font-bold w-40">
                    <div className="text-[10px] text-emerald-400 font-mono">A</div>
                    DATE &amp; DAY
                  </th>
                  <th className="py-2 px-3 border-r border-slate-700/80 font-bold">
                    <div className="text-[10px] text-emerald-400 font-mono">B</div>
                    WORKER NAME
                  </th>
                  <th className="py-2 px-3 border-r border-slate-700/80 font-bold text-center w-36">
                    <div className="text-[10px] text-emerald-400 font-mono">C</div>
                    ATTENDANCE
                  </th>
                  <th className="py-2 px-3 border-r border-slate-700/80 font-bold text-center w-28">
                    <div className="text-[10px] text-emerald-400 font-mono">D</div>
                    SHIFT (TACH)
                  </th>
                  <th className="py-2 px-3 border-r border-slate-700/80 font-bold text-center w-32">
                    <div className="text-[10px] text-emerald-400 font-mono">E</div>
                    EXTRA (OT)
                  </th>
                  <th className="py-2 px-3 border-r border-slate-700/80 font-bold">
                    <div className="text-[10px] text-emerald-400 font-mono">F</div>
                    REMARKS / NOTES
                  </th>
                  {onDeleteEntry && (
                    <th className="py-2 px-2 font-bold text-center w-14">
                      <div className="text-[10px] text-emerald-400 font-mono">G</div>
                      ACTION
                    </th>
                  )}
                </>
              ) : (
                <>
                  <th className="py-2 px-3 border-r border-slate-700/80 font-bold w-44">
                    <div className="text-[10px] text-emerald-400 font-mono">A</div>
                    WORK DATE
                  </th>
                  <th className="py-2 px-3 border-r border-slate-700/80 font-bold text-center w-24">
                    <div className="text-[10px] text-emerald-400 font-mono">B</div>
                    DAY
                  </th>
                  <th className="py-2 px-3 border-r border-slate-700/80 font-bold">
                    <div className="text-[10px] text-emerald-400 font-mono">C</div>
                    WORKERS DEPLOYED
                  </th>
                  <th className="py-2 px-3 border-r border-slate-700/80 font-bold text-center w-32">
                    <div className="text-[10px] text-emerald-400 font-mono">D</div>
                    TOTAL SHIFTS
                  </th>
                  <th className="py-2 px-3 border-r border-slate-700/80 font-bold text-center w-32">
                    <div className="text-[10px] text-emerald-400 font-mono">E</div>
                    EXTRA (OT)
                  </th>
                  <th className="py-2 px-3 font-bold text-center w-28">
                    <div className="text-[10px] text-emerald-400 font-mono">F</div>
                    STATUS
                  </th>
                </>
              )}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-800 text-xs">
            {viewMode === "workers" ? (
              filteredWorkerEntries.length === 0 ? (
                <tr>
                  <td colSpan={onDeleteEntry ? 7 : 6} className="py-12 text-center text-slate-500 font-mono">
                    No work entries logged yet. Click &quot;+ Log Attendance&quot; above to add work records.
                  </td>
                </tr>
              ) : (
                filteredWorkerEntries.map((entry, idx) => {
                  const tachNum = Number(entry.tach) || 0;
                  const otNum = Number(entry.ot) || 0;

                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-slate-900/60 transition-colors text-slate-100 border-b border-slate-800/80"
                    >
                      {/* Row Index */}
                      <td className="py-2.5 px-3 text-center border-r border-slate-800 text-slate-500 font-mono text-[11px] select-none bg-slate-950">
                        {idx + 1}
                      </td>

                      {/* Date & Day */}
                      <td className="py-2.5 px-3 border-r border-slate-800 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="font-bold text-white">{formatDate(entry.date)}</span>
                          {entry.day && (
                            <span className="text-[10px] text-slate-400 uppercase bg-slate-900 px-1 py-0.2 rounded border border-slate-800">
                              {entry.day}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Worker Name */}
                      <td className="py-2.5 px-3 border-r border-slate-800 font-bold text-slate-100">
                        {entry.worker_name || "Worker"}
                      </td>

                      {/* Attendance Badge */}
                      <td className="py-2.5 px-3 border-r border-slate-800 text-center select-none">
                        {getStatusBadge(entry.attendance_status, entry.tach, entry.ot)}
                      </td>

                      {/* Shift (Tach) */}
                      <td className="py-2.5 px-3 border-r border-slate-800 text-center font-mono font-bold text-amber-300">
                        {tachNum > 0 ? `${tachNum.toFixed(1)} Shift` : "0.0"}
                      </td>

                      {/* Extra Hours (OT) */}
                      <td className="py-2.5 px-3 border-r border-slate-800 text-center font-mono">
                        {otNum > 0 ? (
                          <span className="font-bold text-purple-400">+{otNum.toFixed(1)} hrs</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Remarks / Notes */}
                      <td className="py-2.5 px-3 border-r border-slate-800 text-slate-400 truncate max-w-xs">
                        {entry.notes || "—"}
                      </td>

                      {/* Action */}
                      {onDeleteEntry && (
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              onDeleteEntry(
                                entry.id,
                                entry.worker_name || "Worker",
                                formatDate(entry.date)
                              )
                            }
                            title="Delete this work log"
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )
            ) : daySummaries.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500 font-mono">
                  No work days recorded yet.
                </td>
              </tr>
            ) : (
              daySummaries.map((day, idx) => (
                <tr
                  key={day.date}
                  className="hover:bg-slate-900/60 transition-colors text-slate-100 border-b border-slate-800/80"
                >
                  {/* Row Index */}
                  <td className="py-2.5 px-3 text-center border-r border-slate-800 text-slate-500 font-mono text-[11px] select-none bg-slate-950">
                    {idx + 1}
                  </td>

                  {/* Work Date */}
                  <td className="py-2.5 px-3 border-r border-slate-800 font-bold text-white font-mono whitespace-nowrap">
                    {day.formattedDate}
                  </td>

                  {/* Day */}
                  <td className="py-2.5 px-3 border-r border-slate-800 text-center font-mono text-slate-300">
                    <span className="text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {day.dayName || "—"}
                    </span>
                  </td>

                  {/* Workers Deployed */}
                  <td className="py-2.5 px-3 border-r border-slate-800">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                        <Users className="w-3 h-3" /> {day.workersCount} {day.workersCount === 1 ? "Worker" : "Workers"}
                      </span>
                      <span className="text-slate-400 text-xs truncate max-w-sm">
                        {day.workerNames.join(", ")}
                      </span>
                    </div>
                  </td>

                  {/* Total Shifts */}
                  <td className="py-2.5 px-3 border-r border-slate-800 text-center font-mono font-bold text-amber-300">
                    {day.shifts.toFixed(1)} Shifts
                  </td>

                  {/* Overtime (OT) */}
                  <td className="py-2.5 px-3 border-r border-slate-800 text-center font-mono">
                    {day.ot > 0 ? (
                      <span className="font-bold text-purple-400">+{day.ot.toFixed(1)} hrs</span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-2.5 px-3 text-center select-none">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" /> Logged
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* ======================================================== */}
          {/* 4. EXCEL TOTAL ROW (=SUM FORMULA FOOTER WITH Σ)          */}
          {/* ======================================================== */}
          <tfoot>
            <tr className="bg-slate-900 border-t-2 border-slate-700 text-slate-200 font-bold text-xs font-mono">
              <td className="py-2.5 px-3 text-center border-r border-slate-700 text-emerald-400 font-extrabold text-sm select-none">
                Σ
              </td>

              {viewMode === "workers" ? (
                <>
                  <td className="py-2.5 px-3 border-r border-slate-700 text-emerald-400 font-bold tracking-wider">
                    TOTAL WORK
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-700 text-slate-300 font-bold">
                    {totalDeployments} {totalDeployments === 1 ? "Worker Entry" : "Worker Entries"}
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-700 text-center text-slate-400">
                    {totalWorkDays} Working Days
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-700 text-center text-amber-300 font-extrabold text-sm">
                    {totalShifts.toFixed(1)} Shifts
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-700 text-center text-purple-300 font-extrabold text-sm">
                    +{totalOtHours.toFixed(1)} hrs
                  </td>
                  <td colSpan={onDeleteEntry ? 2 : 1} className="py-2.5 px-3 text-slate-400 text-[11px] font-normal">
                    Verified site attendance logs
                  </td>
                </>
              ) : (
                <>
                  <td className="py-2.5 px-3 border-r border-slate-700 text-emerald-400 font-bold tracking-wider">
                    TOTAL ({totalWorkDays} DAYS)
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-700 text-center text-slate-400">
                    —
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-700 text-slate-300 font-bold">
                    {totalDeployments} Deployments
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-700 text-center text-amber-300 font-extrabold text-sm">
                    {totalShifts.toFixed(1)} Shifts
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-700 text-center text-purple-300 font-extrabold text-sm">
                    +{totalOtHours.toFixed(1)} hrs
                  </td>
                  <td className="py-2.5 px-3 text-center text-emerald-400 text-xs font-bold">
                    ✓ Complete
                  </td>
                </>
              )}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ======================================================== */}
      {/* 5. BOTTOM SHEET STATUS BAR                               */}
      {/* ======================================================== */}
      <div className="bg-slate-900 px-4 py-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono select-none">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2.5 py-0.5 bg-slate-950 border border-slate-700 text-emerald-400 font-bold rounded text-[11px]">
            <TableIcon className="w-3 h-3 text-emerald-400" />
            <span>Sheet1 - Work Table</span>
          </div>
          <span className="text-[11px] text-slate-400">
            ({viewMode === "workers" ? filteredWorkerEntries.length : daySummaries.length} records)
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="text-emerald-400 font-bold">READY</span>
          <span>•</span>
          <span>
            WORK DAYS: <strong className="text-slate-200">{totalWorkDays}</strong>
          </span>
          <span>•</span>
          <span>
            TOTAL SHIFTS: <strong className="text-amber-400">{totalShifts.toFixed(1)}</strong>
          </span>
          <span>•</span>
          <span>
            TOTAL OT: <strong className="text-purple-400">+{totalOtHours.toFixed(1)} hrs</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
