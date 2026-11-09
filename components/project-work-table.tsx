"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Users,
  Clock,
  Zap,
  ChevronDown,
  ChevronUp,
  Search,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Sun,
  Sunset,
  XCircle,
  Briefcase,
  Layers,
  Download,
  FileSpreadsheet,
  Table as TableIcon,
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

export interface DayWorkSummary {
  date: string; // YYYY-MM-DD
  dayName: string;
  formattedDate: string;
  isToday: boolean;
  isYesterday: boolean;
  workingCount: number;
  totalOtHours: number;
  totalTach: number;
  entries: LabourEntry[];
}

export function ProjectWorkTable({
  entries,
  projectId,
  projectName,
  onAddAttendance,
  onDeleteEntry,
}: ProjectWorkTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Format date helper (DD-MMM-YYYY)
  const formatDate = (dateStr: string) => {
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

  // Group and calculate days of work from labour log entries
  const { daySummaries, totalWorkDays, totalLaboursDeployments, totalOtHoursAll, totalTachAll } =
    useMemo(() => {
      const map: Record<string, LabourEntry[]> = {};
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      // Filter only entries that belong to this project
      const projectEntries = entries.filter((e) => {
        if (!e.project_id) return false;
        return e.project_id === projectId;
      });

      for (const e of projectEntries) {
        if (!e.date) continue;
        const normalizedDate = e.date.split("T")[0].trim();
        if (!map[normalizedDate]) {
          map[normalizedDate] = [];
        }
        map[normalizedDate].push(e);
      }

      const summaries: DayWorkSummary[] = [];
      let totalDeployments = 0;
      let totalOt = 0;
      let totalTachSum = 0;

      for (const [dateStr, list] of Object.entries(map)) {
        // A worker worked on that day if not marked absent and has shift/ot
        const workingEntries = list.filter((e) => {
          if (e.attendance_status === "absent") return false;
          if (e.attendance_status === "payment_only" && Number(e.tach) === 0 && Number(e.ot) === 0) {
            return false;
          }
          const tachNum = Number(e.tach);
          const otNum = Number(e.ot) || 0;
          return (
            tachNum > 0 ||
            otNum > 0 ||
            e.attendance_status === "full_day" ||
            e.attendance_status === "half_day" ||
            e.attendance_status === "overtime"
          );
        });

        const workingCount = workingEntries.length;
        const dayOt = workingEntries.reduce((sum, e) => sum + (Number(e.ot) || 0), 0);
        const dayTach = workingEntries.reduce((sum, e) => sum + (Number(e.tach) || 0), 0);

        if (workingCount > 0) {
          totalDeployments += workingCount;
          totalOt += dayOt;
          totalTachSum += dayTach;
        }

        const dateObj = new Date(dateStr);
        const dayName =
          list[0]?.day ||
          (!isNaN(dateObj.getTime())
            ? dateObj.toLocaleDateString("en-US", { weekday: "short" })
            : "");

        summaries.push({
          date: dateStr,
          dayName,
          formattedDate: formatDate(dateStr),
          isToday: dateStr === todayStr,
          isYesterday: dateStr === yesterdayStr,
          workingCount,
          totalOtHours: dayOt,
          totalTach: dayTach,
          entries: list,
        });
      }

      // Sort by date
      summaries.sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
      });

      // Total days of work done = count of dates where at least one labour worked
      const daysWithWork = summaries.filter((s) => s.workingCount > 0).length;

      return {
        daySummaries: summaries,
        totalWorkDays: daysWithWork,
        totalLaboursDeployments: totalDeployments,
        totalOtHoursAll: totalOt,
        totalTachAll: totalTachSum,
      };
    }, [entries, projectId, sortOrder]);

  // Filter summaries based on search query (by date or worker name)
  const filteredSummaries = useMemo(() => {
    if (!searchQuery.trim()) return daySummaries;
    const q = searchQuery.toLowerCase().trim();

    return daySummaries.filter((summary) => {
      if (summary.date.toLowerCase().includes(q)) return true;
      if (summary.formattedDate.toLowerCase().includes(q)) return true;
      if (summary.dayName.toLowerCase().includes(q)) return true;

      // Search worker names on this date
      return summary.entries.some((e) =>
        (e.worker_name || "").toLowerCase().includes(q)
      );
    });
  }, [daySummaries, searchQuery]);

  const toggleExpand = (date: string) => {
    setExpandedDates((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    for (const s of filteredSummaries) {
      next[s.date] = true;
    }
    setExpandedDates(next);
  };

  const collapseAll = () => {
    setExpandedDates({});
  };

  // Export to Excel / CSV
  const handleExportCsv = () => {
    if (daySummaries.length === 0) {
      alert("No work records to export.");
      return;
    }

    const headers = [
      "Row",
      "Work Date",
      "Day",
      "Labours Worked",
      "Extra Hours (OT)",
      "Total Shifts (Tach)",
    ];

    const rows = daySummaries.map((s, idx) => {
      return [
        idx + 1,
        `"${s.date}"`,
        `"${s.dayName}"`,
        s.workingCount,
        s.totalOtHours,
        s.totalTach.toFixed(1),
      ];
    });

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

  return (
    <div className="space-y-3 font-sans select-none">
      {/* ======================================================== */}
      {/* EXCEL SHEET TOP TOOLBAR / TITLE BAR                      */}
      {/* ======================================================== */}
      <div className="rounded-t-xl bg-[#1e222b] border border-[#2f3542] border-b-0 shadow-sm overflow-hidden">
        {/* Excel Header Strip */}
        <div className="px-3 py-2 bg-[#1b1e26] border-b border-[#2a2f3b] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Excel Green Brand Icon */}
            <div className="w-6 h-6 rounded bg-[#107c41] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 font-mono">
              X
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-100 font-mono truncate">
                  {projectName.replace(/[^a-zA-Z0-9_-]/g, "_")}_Work_Timesheet.xlsx
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                  {totalWorkDays} Working {totalWorkDays === 1 ? "Day" : "Days"}
                </span>
              </div>
            </div>
          </div>

          {/* Excel Toolbar Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#272c38] hover:bg-[#313745] text-slate-200 border border-[#373e4e] text-xs font-medium transition-colors font-mono"
              title="Download as Excel CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xs:inline">Export CSV</span>
            </button>

            {onAddAttendance && (
              <Button
                type="button"
                onClick={onAddAttendance}
                className="h-7 px-2.5 bg-[#107c41] hover:bg-[#0e6b37] text-white text-xs font-bold gap-1 shadow-xs font-mono"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Log Day</span>
              </Button>
            )}
          </div>
        </div>

        {/* Excel Formula / Summary Bar */}
        <div className="px-3 py-1.5 bg-[#181a20] border-b border-[#2a2f3b] flex items-center gap-2 text-xs font-mono">
          <div className="px-1.5 py-0.5 rounded bg-[#242833] text-slate-400 font-bold text-[11px] border border-[#313645] shrink-0">
            fx
          </div>
          <div className="flex-1 text-[11px] text-slate-300 truncate">
            <span className="text-amber-400 font-semibold">DAYS_WORKED</span> ={" "}
            <span className="text-white font-bold">{totalWorkDays}</span> |{" "}
            <span className="text-purple-400 font-semibold">TOTAL_OT</span> ={" "}
            <span className="text-white font-bold">{totalOtHoursAll.toFixed(1)} hrs</span> |{" "}
            <span className="text-slate-400 font-semibold">TOTAL_SHIFTS</span> ={" "}
            <span className="text-white font-bold">{totalTachAll.toFixed(1)}</span>
          </div>
        </div>

        {/* Search & View Controls Bar */}
        <div className="px-3 py-2 bg-[#1c2028] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by date..."
              className="w-full pl-8 pr-3 py-1 rounded bg-[#14161d] border border-[#2e3442] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#107c41] font-mono"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              className="px-2 py-1 rounded bg-[#232733] hover:bg-[#2d3241] border border-[#333949] text-[11px] font-mono text-slate-300 transition-colors"
            >
              Date: {sortOrder === "desc" ? "Newest ↓" : "Oldest ↑"}
            </button>
            <button
              type="button"
              onClick={expandAll}
              className="px-2 py-1 rounded bg-[#232733] hover:bg-[#2d3241] border border-[#333949] text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-colors"
            >
              Expand [+]
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="px-2 py-1 rounded bg-[#232733] hover:bg-[#2d3241] border border-[#333949] text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-colors"
            >
              Collapse [-]
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* EXCEL SPREADSHEET TABLE GRID                             */}
      {/* ======================================================== */}
      <div className="rounded-b-xl border border-[#2f3542] overflow-hidden bg-[#16181f] shadow-lg">
        {filteredSummaries.length === 0 ? (
          <div className="p-12 text-center space-y-2 bg-[#16181f]">
            <FileSpreadsheet className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-white font-mono">Empty Timesheet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto font-mono">
              {searchQuery
                ? "No rows matched the search query."
                : "No work records logged yet. Click '+ Log Day' to start the work table."}
            </p>
            {onAddAttendance && (
              <Button
                type="button"
                onClick={onAddAttendance}
                className="bg-[#107c41] hover:bg-[#0e6b37] text-white text-xs font-bold gap-1 mt-2 font-mono"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Log First Working Day</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              {/* Column Alphabets Row (A, B, C, D, E) - True Excel Style */}
              <thead>
                <tr className="bg-[#1b1e26] text-slate-400 text-[10px] font-bold border-b border-[#2e3340]">
                  <th className="py-1 px-2 border-r border-[#2e3340] text-center w-10 text-slate-400 bg-[#16181f]">
                    #
                  </th>
                  <th className="py-1 px-3 border-r border-[#2e3340] text-center">
                    A
                  </th>
                  <th className="py-1 px-3 border-r border-[#2e3340] text-center">
                    B
                  </th>
                  <th className="py-1 px-3 border-r border-[#2e3340] text-center">
                    C
                  </th>
                  <th className="py-1 px-3 border-r border-[#2e3340] text-center">
                    D
                  </th>
                  <th className="py-1 px-3 border-r border-[#2e3340] text-center">
                    E
                  </th>
                  <th className="py-1 px-2 text-center w-12">
                    —
                  </th>
                </tr>

                {/* Primary Column Headers */}
                <tr className="bg-[#212631] text-slate-200 text-[11px] font-bold uppercase tracking-wider border-b-2 border-[#383e4d]">
                  <th className="py-2.5 px-2 border-r border-[#2e3340] text-center text-slate-400 bg-[#1b1e26]">
                    Row
                  </th>
                  <th className="py-2.5 px-3 border-r border-[#2e3340]">
                    Date
                  </th>
                  <th className="py-2.5 px-3 border-r border-[#2e3340] text-center">
                    Day
                  </th>
                  <th className="py-2.5 px-3 border-r border-[#2e3340] text-center">
                    Labours Worked
                  </th>
                  <th className="py-2.5 px-3 border-r border-[#2e3340] text-center">
                    Extra Hours (OT)
                  </th>
                  <th className="py-2.5 px-3 border-r border-[#2e3340] text-center">
                    Total Shifts
                  </th>
                  <th className="py-2.5 px-2 text-center">
                    View
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredSummaries.map((summary, idx) => {
                  const isExpanded = !!expandedDates[summary.date];
                  const hasOt = summary.totalOtHours > 0;
                  const isWorkDay = summary.workingCount > 0;
                  const rowNumber = idx + 1;

                  // Zebra stripe rows like an Excel worksheet
                  const rowBg =
                    isExpanded
                      ? "bg-[#222834]"
                      : idx % 2 === 0
                      ? "bg-[#16181f]"
                      : "bg-[#191c24]";

                  return (
                    <React.Fragment key={summary.date}>
                      <tr
                        onClick={() => toggleExpand(summary.date)}
                        className={`cursor-pointer transition-colors hover:bg-[#252b38] border-b border-[#282d38] ${rowBg}`}
                      >
                        {/* Excel Row Number Column */}
                        <td className="py-2 px-2 border-r border-[#282d38] text-center text-slate-400 text-[11px] bg-[#1a1d26] select-none font-semibold">
                          {rowNumber}
                        </td>

                        {/* Col A: Date */}
                        <td className="py-2 px-3 border-r border-[#282d38] whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-100">
                              {summary.formattedDate}
                            </span>
                            {summary.isToday && (
                              <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 font-bold text-[9px] uppercase">
                                Today
                              </span>
                            )}
                            {summary.isYesterday && (
                              <span className="px-1.5 py-0.2 rounded bg-slate-700 text-slate-300 font-bold text-[9px] uppercase">
                                Yday
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Col B: Day */}
                        <td className="py-2 px-3 border-r border-[#282d38] text-center text-slate-300 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded bg-[#1c202a] border border-[#2c3240] text-[11px]">
                            {summary.dayName || "—"}
                          </span>
                        </td>

                        {/* Col C: Labours Worked (Count) - Clean Excel Number Cell */}
                        <td className="py-2 px-3 border-r border-[#282d38] text-center whitespace-nowrap font-bold text-slate-100">
                          {isWorkDay ? (
                            <span>{summary.workingCount}</span>
                          ) : (
                            <span className="text-slate-500 font-normal">0</span>
                          )}
                        </td>

                        {/* Col D: Extra Hours (OT) */}
                        <td className="py-2 px-3 border-r border-[#282d38] text-center whitespace-nowrap">
                          {hasOt ? (
                            <span className="font-bold text-purple-300">
                              +{summary.totalOtHours}h OT
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs font-mono">0.0</span>
                          )}
                        </td>

                        {/* Col E: Total Shifts (Tach) */}
                        <td className="py-2 px-3 border-r border-[#282d38] text-center whitespace-nowrap text-slate-200 font-bold">
                          {summary.totalTach.toFixed(1)}
                        </td>

                        {/* View / Expand Chevron */}
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            aria-label={isExpanded ? "Collapse" : "Expand"}
                            className="p-1 rounded hover:bg-[#323847] text-slate-400 hover:text-white transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Sub-Sheet Breakdown Row when expanded */}
                      {isExpanded && (
                        <tr className="bg-[#14161d] border-b-2 border-[#2f3544]">
                          <td
                            colSpan={7}
                            className="p-3 bg-[#13151b] border-l-4 border-l-emerald-500 border-r border-[#282d38]"
                          >
                            <div className="space-y-2 text-xs">
                              <div className="flex items-center justify-between pb-1.5 border-b border-[#262b37]">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                  <Layers className="w-3.5 h-3.5" />
                                  Timesheet Log Details for {summary.formattedDate} ({summary.dayName})
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {summary.entries.length} {summary.entries.length === 1 ? "Worker Record" : "Worker Records"}
                                </span>
                              </div>

                              {/* Mini Excel sub-table for individual workers */}
                              <div className="border border-[#2a2f3d] rounded-lg overflow-hidden bg-[#181a22]">
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="bg-[#1f2430] text-slate-400 text-[10px] font-bold uppercase border-b border-[#2a2f3d]">
                                      <th className="py-1.5 px-3 border-r border-[#2a2f3d]">Worker Name</th>
                                      <th className="py-1.5 px-3 border-r border-[#2a2f3d] text-center">Shift Type</th>
                                      <th className="py-1.5 px-3 border-r border-[#2a2f3d] text-center">Tach (Shift)</th>
                                      <th className="py-1.5 px-3 border-r border-[#2a2f3d] text-center">Extra Hours (OT)</th>
                                      {onDeleteEntry && <th className="py-1.5 px-2 text-center w-16">Action</th>}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#262b38]">
                                    {summary.entries.map((entry) => {
                                      const tach = Number(entry.tach);
                                      const ot = Number(entry.ot) || 0;

                                      let shiftBadge = (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                          <Sun className="w-3 h-3" /> Full Day
                                        </span>
                                      );

                                      if (entry.attendance_status === "half_day" || tach === 0.5) {
                                        shiftBadge = (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                            <Sunset className="w-3 h-3" /> Half Day
                                          </span>
                                        );
                                      } else if (entry.attendance_status === "overtime" || ot > 0) {
                                        shiftBadge = (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                            <Zap className="w-3 h-3" /> Over Time
                                          </span>
                                        );
                                      } else if (entry.attendance_status === "absent") {
                                        shiftBadge = (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                                            <XCircle className="w-3 h-3" /> Absent
                                          </span>
                                        );
                                      }

                                      return (
                                        <tr key={entry.id} className="hover:bg-[#202532]">
                                          <td className="py-2 px-3 border-r border-[#2a2f3d] font-bold text-white">
                                            {entry.worker_name || "Worker"}
                                          </td>
                                          <td className="py-2 px-3 border-r border-[#2a2f3d] text-center">
                                            {shiftBadge}
                                          </td>
                                          <td className="py-2 px-3 border-r border-[#2a2f3d] text-center font-bold text-slate-200">
                                            {entry.tach}
                                          </td>
                                          <td className="py-2 px-3 border-r border-[#2a2f3d] text-center">
                                            {ot > 0 ? (
                                              <span className="font-bold text-purple-300">
                                                +{ot} hrs
                                              </span>
                                            ) : (
                                              <span className="text-slate-400">0.0</span>
                                            )}
                                          </td>
                                          {onDeleteEntry && (
                                            <td className="py-2 px-2 text-center">
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  onDeleteEntry(
                                                    entry.id,
                                                    entry.worker_name || "Labour",
                                                    summary.formattedDate
                                                  );
                                                }}
                                                title="Delete this work log"
                                                className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </td>
                                          )}
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>

              {/* ======================================================== */}
              {/* EXCEL TOTAL ROW (=SUM FORMULA FOOTER)                    */}
              {/* ======================================================== */}
              <tfoot>
                <tr className="bg-[#1e232e] text-slate-100 font-bold border-t-2 border-b-4 border-double border-slate-500 text-xs">
                  <td className="py-2.5 px-2 border-r border-[#2e3340] text-center bg-[#181a22] text-emerald-400 font-extrabold">
                    ∑
                  </td>
                  <td className="py-2.5 px-3 border-r border-[#2e3340] text-emerald-400 uppercase tracking-wider font-extrabold">
                    TOTAL (SUM)
                  </td>
                  <td className="py-2.5 px-3 border-r border-[#2e3340] text-center text-slate-400 font-normal">
                    {totalWorkDays} days
                  </td>
                  <td className="py-2.5 px-3 border-r border-[#2e3340] text-center text-amber-300 font-extrabold">
                    {totalLaboursDeployments}
                  </td>
                  <td className="py-2.5 px-3 border-r border-[#2e3340] text-center text-purple-300 font-extrabold">
                    +{totalOtHoursAll.toFixed(1)} hrs OT
                  </td>
                  <td className="py-2.5 px-3 border-r border-[#2e3340] text-center text-slate-100 font-extrabold">
                    {totalTachAll.toFixed(1)} shifts
                  </td>
                  <td className="py-2.5 px-2 text-center text-[10px] text-slate-400 font-normal">
                    ✓
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Excel Worksheet Status Bar & Sheet Tabs */}
        <div className="px-3 py-2 bg-[#1b1e26] border-t border-[#2a2f3b] flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            {/* Sheet Tab button */}
            <div className="flex items-center gap-1 px-3 py-1 bg-[#16181f] border-t-2 border-t-[#107c41] border-x border-[#2a2f3b] text-slate-200 font-bold rounded-t text-[11px]">
              <TableIcon className="w-3 h-3 text-[#107c41]" />
              <span>Sheet1: Work_Log</span>
            </div>
            <span className="text-[11px] text-slate-400">
              ({filteredSummaries.length} rows)
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span>
              Work Days: <strong className="text-amber-400">{totalWorkDays}</strong>
            </span>
            <span>•</span>
            <span>
              Extra OT: <strong className="text-purple-400">{totalOtHoursAll.toFixed(1)} hrs</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
