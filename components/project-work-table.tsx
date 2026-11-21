"use client";

import React, { useMemo } from "react";
import {
  FileDown,
  Users,
} from "lucide-react";
import { LabourEntry } from "@/lib/types/labour";
import { generateDailyWorkSummaryPdf } from "@/lib/utils/pdf-generator";
import { toast } from "@/lib/toast";

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
}: ProjectWorkTableProps) {
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

  // Grouped summaries for daily summary mode
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
    return list;
  }, [projectEntries]);

  // Download PDF Handler
  const handleDownloadPdf = () => {
    if (daySummaries.length === 0) {
      toast.warning("No daily work logs to export into a PDF.");
      return;
    }

    try {
      generateDailyWorkSummaryPdf({
        projectName,
        totalWorkDays,
        totalDeployments,
        totalShifts,
        totalOtHours,
        days: daySummaries,
      });
      toast.success("Daily Work Summary PDF downloaded successfully!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to generate PDF document.");
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950 font-sans select-none">
      {/* ======================================================== */}
      {/* 1. HIGHLIGHTED TOTAL WORK SECTION                        */}
      {/* ======================================================== */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 dark:from-amber-950/20 dark:via-emerald-950/20 dark:to-blue-950/20 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              Total Work Summary
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-bold">
              {daySummaries.length} Logged Days
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-500/30 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block tracking-wider">Total Days</span>
              <span className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">
                {totalWorkDays} <span className="text-xs font-semibold text-slate-500">Days</span>
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-500/30 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block tracking-wider">Total Shifts</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {totalShifts.toFixed(1)} <span className="text-xs font-semibold text-slate-500">Shifts</span>
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-500/30 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block tracking-wider">Overtime (OT)</span>
              <span className="text-lg font-black text-purple-600 dark:text-purple-400 font-mono">
                +{totalOtHours.toFixed(1)} <span className="text-xs font-semibold text-slate-500">hrs</span>
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-500/30 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block tracking-wider">Deployments</span>
              <span className="text-lg font-black text-blue-600 dark:text-blue-400 font-mono">
                {totalDeployments} <span className="text-xs font-semibold text-slate-500">Workers</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
            title="Download Daily Work Summary PDF"
          >
            <FileDown className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. DAILY WORK SUMMARY TABLE                              */}
      {/* ======================================================== */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[650px] font-sans text-xs">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-mono select-none">
              <th className="w-12 py-3 px-3 text-center border-r border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-500 font-bold text-[10px]">
                #
              </th>
              <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-800 font-bold w-44">
                WORK DATE
              </th>
              <th className="py-3 px-3 border-r border-slate-200 dark:border-slate-800 font-bold text-center w-24">
                DAY
              </th>
              <th className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-800 font-bold">
                WORKERS DEPLOYED
              </th>
              <th className="py-3 px-3 border-r border-slate-200 dark:border-slate-800 font-bold text-center w-32">
                TOTAL SHIFTS
              </th>
              <th className="py-3 px-3 font-bold text-center w-32">
                EXTRA (OT)
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
            {daySummaries.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500 font-mono">
                  No work days recorded yet for this project.
                </td>
              </tr>
            ) : (
              daySummaries.map((day, idx) => (
                <tr
                  key={day.date}
                  className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800/80"
                >
                  {/* Row Index */}
                  <td className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-800 text-slate-500 font-mono text-[11px] select-none bg-slate-50/70 dark:bg-slate-950">
                    {idx + 1}
                  </td>

                  {/* Work Date */}
                  <td className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white font-mono whitespace-nowrap">
                    {day.formattedDate}
                  </td>

                  {/* Day */}
                  <td className="py-3 px-3 border-r border-slate-200 dark:border-slate-800 text-center font-mono text-slate-700 dark:text-slate-300">
                    <span className="text-[11px] bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 font-semibold">
                      {day.dayName || "—"}
                    </span>
                  </td>

                  {/* Workers Deployed */}
                  <td className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30">
                        <Users className="w-3 h-3" /> {day.workersCount} {day.workersCount === 1 ? "Worker" : "Workers"}
                      </span>
                      <span className="text-slate-600 dark:text-slate-400 text-xs truncate max-w-sm">
                        {day.workerNames.join(", ")}
                      </span>
                    </div>
                  </td>

                  {/* Total Shifts */}
                  <td className="py-3 px-3 border-r border-slate-200 dark:border-slate-800 text-center font-mono font-bold text-amber-700 dark:text-amber-300">
                    {day.shifts.toFixed(1)} Shifts
                  </td>

                  {/* Overtime (OT) */}
                  <td className="py-3 px-3 text-center font-mono">
                    {day.ot > 0 ? (
                      <span className="font-bold text-purple-700 dark:text-purple-400">+{day.ot.toFixed(1)} hrs</span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* ======================================================== */}
          {/* 3. HIGHLIGHTED TOTAL WORK FOOTER ROW                     */}
          {/* ======================================================== */}
          <tfoot>
            <tr className="bg-amber-500/10 dark:bg-amber-950/25 border-t-2 border-amber-500/40 text-slate-900 dark:text-slate-100 font-bold text-xs font-mono">
              <td className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 text-amber-700 dark:text-amber-400 font-black text-sm select-none">
                Σ
              </td>
              <td className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-amber-700 dark:text-amber-400 font-extrabold tracking-wider">
                TOTAL ({totalWorkDays} DAYS)
              </td>
              <td className="py-3 px-3 border-r border-slate-200 dark:border-slate-700 text-center text-slate-500 dark:text-slate-400">
                —
              </td>
              <td className="py-3 px-3.5 border-r border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-extrabold">
                {totalDeployments} Worker Deployments
              </td>
              <td className="py-3 px-3 border-r border-slate-200 dark:border-slate-700 text-center text-amber-700 dark:text-amber-400 font-black text-sm">
                {totalShifts.toFixed(1)} Shifts
              </td>
              <td className="py-3 px-3 text-center text-purple-700 dark:text-purple-400 font-black text-sm">
                +{totalOtHours.toFixed(1)} hrs
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
