"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Users,
  Trash2,
  FileSpreadsheet,
  Download,
  Phone,
  MapPin,
  User,
  X,
  AlertCircle,
  Save,
  Eye,
  ArrowLeft,
  Calendar,
  Clock,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Labour, LabourEntry } from "@/lib/types/labour";
import {
  createLabourAction,
  deleteLabourAction,
  createLabourEntryAction,
  deleteLabourEntryAction,
} from "./actions";

interface ProjectOption {
  id: string;
  name: string;
}

interface Props {
  initialLabours: Labour[];
  initialProjects: ProjectOption[];
  initialEntries: LabourEntry[];
}

function getDayName(dateString: string): string {
  if (!dateString) return "";
  const parts = dateString.split("-").map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return "";
  }
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

export default function LabourClient({
  initialLabours,
  initialProjects,
  initialEntries,
}: Props) {
  const [labours, setLabours] = useState<Labour[]>(initialLabours);
  const [projects] = useState<ProjectOption[]>(initialProjects);
  const [entries, setEntries] = useState<LabourEntry[]>(initialEntries);

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLabour, setSelectedLabour] = useState<Labour | null>(null);
  const [isPending, startTransition] = useTransition();

  // Add Labour Form state (Name, Phone No, Place only)
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [place, setPlace] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Work Log Entry Form state (Date, Day, Site, Tach, OT, Amount)
  const todayStr = new Date().toISOString().split("T")[0];
  const [entryDate, setEntryDate] = useState<string>(todayStr);
  const [entrySiteId, setEntrySiteId] = useState<string>(
    initialProjects[0]?.id || ""
  );
  const [entryTach, setEntryTach] = useState<string>("1");
  const [entryOt, setEntryOt] = useState<string>("0");
  const [entryAmount, setEntryAmount] = useState<string>("");
  const [entryError, setEntryError] = useState<string | null>(null);

  // Calculated Day from entryDate
  const currentDay = getDayName(entryDate);

  const handleOpenAddModal = () => {
    setName("");
    setPhone("");
    setPlace("");
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setFormError(null);
  };

  const handleSubmitLabour = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Name is required.");
      return;
    }

    if (!phone.trim()) {
      setFormError("Phone number is required.");
      return;
    }

    if (!place.trim()) {
      setFormError("Place is required.");
      return;
    }

    startTransition(async () => {
      const res = await createLabourAction({
        name: name.trim(),
        phone: phone.trim(),
        place: place.trim(),
      });

      if (res.error) {
        setFormError(res.error);
      } else if (res.data) {
        setLabours((prev) => [res.data!, ...prev]);
        setIsAddModalOpen(false);
      }
    });
  };

  const handleDeleteLabour = (id: string, labourName: string) => {
    if (!confirm(`Are you sure you want to delete labour "${labourName}"?`))
      return;

    startTransition(async () => {
      const res = await deleteLabourAction(id);
      if (res.success) {
        setLabours((prev) => prev.filter((item) => item.id !== id));
        if (selectedLabour?.id === id) {
          setSelectedLabour(null);
        }
      } else {
        alert(res.error || "Failed to delete labour.");
      }
    });
  };

  // Add work log entry for selected labour
  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    setEntryError(null);

    if (!selectedLabour) return;

    if (!entryDate) {
      setEntryError("Please select a valid Date.");
      return;
    }

    if (!entrySiteId) {
      setEntryError("Please select a Site (Project).");
      return;
    }

    const selectedProj = projects.find((p) => p.id === entrySiteId);
    const projectName = selectedProj?.name || "Selected Site";
    const numAmount = parseFloat(entryAmount) || 0;

    startTransition(async () => {
      const res = await createLabourEntryAction({
        worker_id: selectedLabour.id,
        date: entryDate,
        day: currentDay,
        project_id: entrySiteId,
        project_name: projectName,
        tach: entryTach.trim() || "1",
        ot: entryOt.trim() || "0",
        amount: numAmount,
      });

      if (res.error) {
        setEntryError(res.error);
      } else if (res.data) {
        setEntries((prev) => [res.data!, ...prev]);
        setEntryAmount("");
        setEntryOt("0");
        setEntryTach("1");
      }
    });
  };

  const handleDeleteEntry = (entryId: string) => {
    if (!confirm("Are you sure you want to delete this work log entry?")) return;

    startTransition(async () => {
      const res = await deleteLabourEntryAction(entryId);
      if (res.success) {
        setEntries((prev) => prev.filter((item) => item.id !== entryId));
      } else {
        alert(res.error || "Failed to delete entry.");
      }
    });
  };

  // Labour search filtering
  const q = searchQuery.toLowerCase().trim();
  const filteredLabours = labours.filter((item) => {
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.phone.toLowerCase().includes(q) ||
      item.place.toLowerCase().includes(q)
    );
  });

  // Filter entries for currently selected labour
  const workerEntries = selectedLabour
    ? entries.filter(
        (e) =>
          e.worker_id === selectedLabour.id ||
          // Fallback if matching sample id format
          (selectedLabour.id === "lab-1" && e.worker_id === "lab-1")
      )
    : [];

  const totalWorkerAmount = workerEntries.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0
  );

  const exportLabourDirectoryCsv = () => {
    if (filteredLabours.length === 0) return;
    const headers = ["Row", "Name", "Phone No", "Place"];
    const rows = filteredLabours.map((item, idx) => [
      idx + 1,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.phone.replace(/"/g, '""')}"`,
      `"${item.place.replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Labour_Directory_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportWorkerLogsCsv = () => {
    if (!selectedLabour || workerEntries.length === 0) return;
    const headers = [
      "Row",
      "Date",
      "Day",
      "Site",
      "Tach",
      "OT",
      "Amount (INR)",
    ];
    const rows = workerEntries.map((e, idx) => [
      idx + 1,
      e.date,
      e.day,
      `"${e.project_name.replace(/"/g, '""')}"`,
      `"${e.tach}"`,
      `"${e.ot}"`,
      e.amount,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Work_Logs_${selectedLabour.name.replace(/\s+/g, "_")}_${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -------------------------------------------------------------
  // VIEW: DETAILS VIEW (Selected Labour Work Log Table & Save Form)
  // -------------------------------------------------------------
  if (selectedLabour) {
    return (
      <div className="space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setSelectedLabour(null)}
              variant="outline"
              size="xs"
              className="border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Labour List</span>
            </Button>
            <div className="h-4 w-px bg-slate-800" />
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>{selectedLabour.name}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-normal">
                  Work Logs
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-500" />
                  {selectedLabour.phone}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  {selectedLabour.place}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportWorkerLogsCsv}
              disabled={workerEntries.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-medium text-xs shadow-sm transition-colors border border-emerald-600"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Work Logs (.CSV)</span>
            </button>
          </div>
        </div>

        {/* Add Entry Form / Inputs Bar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Add Work Log Entry
            </h2>
            <span className="text-[11px] text-slate-400">
              Record daily work, site assignment, tach, OT, and amount
            </span>
          </div>

          {entryError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-xs text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{entryError}</span>
            </div>
          )}

          <form onSubmit={handleSaveEntry}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
              {/* 1. Date */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Date <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              {/* 2. Day (Auto-calculated) */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Day
                </label>
                <input
                  type="text"
                  readOnly
                  value={currentDay || "—"}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-amber-400 font-semibold cursor-not-allowed select-none"
                />
              </div>

              {/* 3. Site (Project Dropdown) */}
              <div className="sm:col-span-2 md:col-span-1">
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Site (Project) <span className="text-rose-400">*</span>
                </label>
                <select
                  value={entrySiteId}
                  onChange={(e) => setEntrySiteId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                >
                  <option value="" disabled>
                    Select Site...
                  </option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Tach */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Tach
                </label>
                <input
                  type="text"
                  value={entryTach}
                  onChange={(e) => setEntryTach(e.target.value)}
                  placeholder="e.g. 1"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              {/* 5. OT */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  OT
                </label>
                <input
                  type="text"
                  value={entryOt}
                  onChange={(e) => setEntryOt(e.target.value)}
                  placeholder="e.g. 2 hrs"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              {/* 6. Amount & Save button */}
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={entryAmount}
                      onChange={(e) => setEntryAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-6 pr-2.5 py-1.5 text-xs text-emerald-400 font-mono font-bold placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isPending}
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-[33px] px-3.5 gap-1.5 shadow-md shrink-0"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isPending ? "Saving..." : "Save"}</span>
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Work Logs Table - Excel Spreadsheet Container */}
        <div className="rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950">
          {/* Excel Green Ribbon Bar */}
          <div className="bg-[#107c41] px-4 py-2 flex flex-wrap items-center justify-between text-white border-b border-emerald-800 text-xs">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span className="font-bold tracking-wide">
                Labour_Work_Logs_{selectedLabour.name.replace(/\s+/g, "_")}.xlsx
              </span>
              <span className="bg-emerald-900/60 text-emerald-200 text-[10px] px-2 py-0.5 rounded font-mono font-semibold">
                AutoSave [ON]
              </span>
              <span className="text-[11px] text-emerald-100 hidden sm:inline ml-2">
                Showing {workerEntries.length} logged records
              </span>
            </div>
            <div className="text-[11px] font-mono font-bold text-emerald-200">
              Total: ₹{totalWorkerAmount.toLocaleString("en-IN")}
            </div>
          </div>

          {workerEntries.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <Clock className="w-10 h-10 mx-auto text-slate-600" />
              <div>
                <p className="text-sm font-semibold text-slate-300">
                  No work entries logged yet
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Fill in Date, Day, Site, Tach, OT, Amount above and click Save.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-700">
                    <th className="py-2 px-3 w-12 text-center border-r border-slate-700/80 bg-slate-900/90 text-slate-500 font-mono select-none">
                      ◢
                    </th>
                    <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold w-36">
                      <div className="text-[10px] text-emerald-400 font-mono">
                        A
                      </div>
                      DATE
                    </th>
                    <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold w-32">
                      <div className="text-[10px] text-emerald-400 font-mono">
                        B
                      </div>
                      DAY
                    </th>
                    <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold">
                      <div className="text-[10px] text-emerald-400 font-mono">
                        C
                      </div>
                      SITE
                    </th>
                    <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold text-center w-28">
                      <div className="text-[10px] text-emerald-400 font-mono">
                        D
                      </div>
                      TACH
                    </th>
                    <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold text-center w-28">
                      <div className="text-[10px] text-emerald-400 font-mono">
                        E
                      </div>
                      OT
                    </th>
                    <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold text-right w-36">
                      <div className="text-[10px] text-emerald-400 font-mono">
                        F
                      </div>
                      AMOUNT
                    </th>
                    <th className="py-2.5 px-4 font-bold text-center w-20">
                      <div className="text-[10px] text-emerald-400 font-mono">
                        G
                      </div>
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs font-mono">
                  {workerEntries.map((entry, idx) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-emerald-500/10 transition-colors group border-b border-slate-800/80"
                    >
                      {/* Row Index */}
                      <td className="py-2.5 px-3 text-center bg-slate-900/70 border-r border-slate-800 text-slate-400 select-none text-[11px] font-mono group-hover:text-emerald-400 group-hover:bg-emerald-950/30">
                        {idx + 1}
                      </td>

                      {/* Date */}
                      <td className="py-2.5 px-4 border-r border-slate-800 text-slate-200 whitespace-nowrap">
                        {entry.date}
                      </td>

                      {/* Day */}
                      <td className="py-2.5 px-4 border-r border-slate-800 text-amber-400/90 font-sans font-medium whitespace-nowrap">
                        {entry.day}
                      </td>

                      {/* Site */}
                      <td className="py-2.5 px-4 border-r border-slate-800 text-slate-100 font-sans">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{entry.project_name}</span>
                        </div>
                      </td>

                      {/* Tach */}
                      <td className="py-2.5 px-4 border-r border-slate-800 text-center text-slate-200">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px]">
                          {entry.tach || "—"}
                        </span>
                      </td>

                      {/* OT */}
                      <td className="py-2.5 px-4 border-r border-slate-800 text-center text-slate-200">
                        <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-[11px]">
                          {entry.ot || "0"}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-2.5 px-4 border-r border-slate-800 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                        ₹{Number(entry.amount).toLocaleString("en-IN")}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-4 text-center whitespace-nowrap font-sans">
                        <Button
                          onClick={() => handleDeleteEntry(entry.id)}
                          disabled={isPending}
                          variant="ghost"
                          size="xs"
                          className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 h-7 w-7 p-0"
                          title="Delete Entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* Accounting Totals Row */}
                <tfoot>
                  <tr className="bg-slate-900/90 font-bold border-t-2 border-slate-700 border-b-4 border-double border-slate-600 text-xs">
                    <td className="py-3 px-3 text-center bg-slate-950 border-r border-slate-700 text-emerald-400 font-mono">
                      Σ
                    </td>
                    <td
                      colSpan={5}
                      className="py-3 px-4 border-r border-slate-700 text-slate-200 uppercase tracking-wider text-[11px]"
                    >
                      Total Logged Amount ({workerEntries.length} records)
                    </td>
                    <td className="py-3 px-4 border-r border-slate-700 text-right font-mono text-emerald-400 text-sm">
                      ₹{totalWorkerAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Bottom Sheet Tab & Status Bar */}
          <div className="bg-slate-900 border-t border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between text-[11px] text-slate-400 select-none">
            <div className="flex items-center gap-1">
              <span className="px-3 py-1 bg-slate-950 text-emerald-400 font-semibold rounded-t border-t-2 border-emerald-500 border-x border-slate-800 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                Sheet1 - {selectedLabour.name} Work Logs
              </span>
            </div>
            <div className="flex items-center gap-4 font-mono text-[10px]">
              <span>READY</span>
              <span className="border-l border-slate-700 pl-3">
                COUNT: {workerEntries.length}
              </span>
              <span className="border-l border-slate-700 pl-3 text-emerald-400">
                TOTAL: ₹{totalWorkerAmount.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: MAIN LABOUR DIRECTORY TABLE
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Labour Module
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your electricians, labour directory, and work logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleOpenAddModal}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Labour</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-slate-400">Total Workers</p>
            <p className="text-2xl font-bold text-white mt-1">
              {labours.length}
            </p>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <Users className="w-5 h-5 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone no, or place..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Excel Spreadsheet Table Container */}
      <div className="rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950">
        {/* Excel Green Ribbon Bar */}
        <div className="bg-[#107c41] px-4 py-2 flex flex-wrap items-center justify-between text-white border-b border-emerald-800 text-xs">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span className="font-bold tracking-wide">Labour_List.xlsx</span>
            <span className="bg-emerald-900/60 text-emerald-200 text-[10px] px-2 py-0.5 rounded font-mono font-semibold">
              AutoSave [ON]
            </span>
            <span className="text-[11px] text-emerald-100 hidden sm:inline ml-2">
              Showing {filteredLabours.length} of {labours.length} records
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportLabourDirectoryCsv}
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded font-medium text-xs shadow-sm transition-colors border border-emerald-600"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel (.CSV)</span>
            </button>
          </div>
        </div>

        {filteredLabours.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Users className="w-10 h-10 mx-auto text-slate-600" />
            <div>
              <p className="text-sm font-semibold text-slate-300">
                No labour records found
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery
                  ? "Try resetting your search query."
                  : "Click 'Add Labour' to register your first worker."}
              </p>
            </div>
            {searchQuery ? (
              <Button
                onClick={() => setSearchQuery("")}
                variant="outline"
                className="border-slate-800 text-xs text-slate-300"
              >
                Clear Search
              </Button>
            ) : (
              <Button
                onClick={handleOpenAddModal}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Labour
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-700">
                  <th className="py-2 px-3 w-12 text-center border-r border-slate-700/80 bg-slate-900/90 text-slate-500 font-mono select-none">
                    ◢
                  </th>
                  <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold">
                    <div className="text-[10px] text-emerald-400 font-mono">
                      A
                    </div>
                    NAME
                  </th>
                  <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold w-48">
                    <div className="text-[10px] text-emerald-400 font-mono">
                      B
                    </div>
                    PHONE NO
                  </th>
                  <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold w-44">
                    <div className="text-[10px] text-emerald-400 font-mono">
                      C
                    </div>
                    PLACE
                  </th>
                  <th className="py-2.5 px-4 font-bold text-center w-28">
                    <div className="text-[10px] text-emerald-400 font-mono">
                      D
                    </div>
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs font-mono">
                {filteredLabours.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="hover:bg-emerald-500/10 transition-colors group border-b border-slate-800/80"
                  >
                    {/* Row Index */}
                    <td className="py-2.5 px-3 text-center bg-slate-900/70 border-r border-slate-800 text-slate-400 select-none text-[11px] font-mono group-hover:text-emerald-400 group-hover:bg-emerald-950/30">
                      {idx + 1}
                    </td>

                    {/* Name */}
                    <td className="py-2.5 px-4 border-r border-slate-800 font-sans font-semibold text-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 text-xs font-bold shrink-0">
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                        <button
                          onClick={() => setSelectedLabour(item)}
                          className="hover:text-emerald-400 transition-colors text-left font-semibold"
                          title="Click to view work details"
                        >
                          {item.name}
                        </button>
                      </div>
                    </td>

                    {/* Phone No */}
                    <td className="py-2.5 px-4 border-r border-slate-800 whitespace-nowrap font-sans">
                      {item.phone && item.phone !== "—" ? (
                        <a
                          href={`tel:${item.phone}`}
                          className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 hover:underline font-mono text-xs"
                        >
                          <Phone className="w-3 h-3 text-emerald-400/80" />
                          <span>{item.phone}</span>
                        </a>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    {/* Place */}
                    <td className="py-2.5 px-4 border-r border-slate-800 whitespace-nowrap font-sans text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>{item.place || "—"}</span>
                      </div>
                    </td>

                    {/* Actions: Details only */}
                    <td className="py-2.5 px-4 text-center whitespace-nowrap font-sans">
                      <Button
                        onClick={() => setSelectedLabour(item)}
                        variant="ghost"
                        size="xs"
                        className="text-slate-300 hover:text-emerald-400 hover:bg-slate-800 h-7 px-2.5 font-medium"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="text-[11px] ml-1">Details</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Sheet Tab & Status Bar */}
        <div className="bg-slate-900 border-t border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between text-[11px] text-slate-400 select-none">
          <div className="flex items-center gap-1">
            <span className="px-3 py-1 bg-slate-950 text-emerald-400 font-semibold rounded-t border-t-2 border-emerald-500 border-x border-slate-800 flex items-center gap-1.5">
              <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
              Sheet1 - Labour List
            </span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[10px]">
            <span>READY</span>
            <span className="border-l border-slate-700 pl-3">
              COUNT: {filteredLabours.length}
            </span>
          </div>
        </div>
      </div>

      {/* Add Labour Modal Dialog */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Add Labour
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Register worker with Name, Phone No, and Place.
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseAddModal}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error banner */}
            {formError && (
              <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2.5 text-xs text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleSubmitLabour} className="p-6 space-y-4">
              {/* 1. Name */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* 2. Phone No */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Phone No <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              {/* 3. Place */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Place <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    placeholder="e.g. Kochi / Aluva"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCloseAddModal}
                  className="border-slate-800 text-slate-300 hover:bg-slate-800 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isPending ? "Saving..." : "Save Labour"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
