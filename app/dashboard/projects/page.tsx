"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import Link from "next/link";
import {
  getProjectsAction,
  updateProjectStatusAction,
  ProjectRecord,
} from "./actions";
import { CreateProjectModal } from "./create-project-modal";
import {
  FolderKanban,
  Plus,
  Search,
  MapPin,
  RefreshCw,
  Filter,
  Eye,
  FileSpreadsheet,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStatusStyle, PROJECT_STATUSES, PROJECT_TYPES } from "@/lib/project-utils";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [, startTransition] = useTransition();

  const fetchProjects = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);

    try {
      const data = await getProjectsAction();
      if (Array.isArray(data)) {
        setProjects(data);
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setIsRefreshing(false);
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    getProjectsAction()
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data)) {
          setProjects(data);
        }
      })
      .catch((err) => {
        console.error("Initial load projects error:", err);
      })
      .finally(() => {
        if (isMounted) setInitialLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleProjectCreated = (newProject?: ProjectRecord) => {
    if (newProject) {
      setProjects((prev) => {
        const exists = prev.some((p) => p.id === newProject.id);
        if (exists) return prev;
        return [newProject, ...prev];
      });
    }
    fetchProjects(false);
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    startTransition(async () => {
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
      );
      if (id) {
        await updateProjectStatusAction(id, newStatus);
      }
    });
  };

  // Filter logic
  const filteredProjects = projects.filter((p) => {
    const matchesStatus =
      selectedStatus === "All" ||
      p.status.toLowerCase().trim() === selectedStatus.toLowerCase().trim();
    const matchesType = selectedType === "All" || p.type === selectedType;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.place?.toLowerCase().includes(q) ||
      p.type.toLowerCase().includes(q);

    return matchesStatus && matchesType && matchesSearch;
  });

  // Export projects list to CSV/Excel
  const exportToCsv = () => {
    if (filteredProjects.length === 0) return;
    const headers = [
      "Row",
      "Project Number",
      "Customer Name",
      "Type",
      "Place",
      "Start Date",
      "End Date",
      "Status",
    ];
    const rows = filteredProjects.map((p, idx) => [
      idx + 1,
      `"${(p.project_number || "").replace(/"/g, '""')}"`,
      `"${(p.name || "").replace(/"/g, '""')}"`,
      `"${(p.type || "").replace(/"/g, '""')}"`,
      `"${(p.place || "").replace(/"/g, '""')}"`,
      p.start_date || "",
      p.end_date || "",
      `"${(p.status || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(",")), `Total Projects,${filteredProjects.length}`].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Projects_Master_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-md bg-amber-500/10 text-amber-400">
              <FolderKanban className="w-5 h-5" />
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">Projects</h1>
          </div>
          <p className="text-xs text-slate-400">
            Overview of clients, project locations, and status tracking.
          </p>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
          <Button
            variant="outline"
            onClick={() => fetchProjects(true)}
            disabled={isRefreshing}
            className="h-10 sm:h-9 text-xs border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="h-10 sm:h-9 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 shadow-md flex-1 sm:flex-none justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>Add Project</span>
          </Button>
        </div>
      </div>

      {/* Search & Filter Strip */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client name, place, or project type..."
              className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-sm sm:text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          {/* Type Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40 min-h-[40px] sm:min-h-0"
            >
              <option value="All">All Types</option>
              {PROJECT_TYPES.map((t) => (
                <option key={t} value={t} className="bg-slate-900 text-slate-100">
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-slate-800/60 pt-3">
          {["All", ...PROJECT_STATUSES].map((status) => {
            const isSelected = selectedStatus === status;
            let activeColor = "bg-amber-500 text-slate-950 shadow-sm font-bold";
            if (status === "Completed") activeColor = "bg-emerald-500 text-slate-950 shadow-sm font-bold";
            if (status === "Pending") activeColor = "bg-rose-500 text-white shadow-sm font-bold";
            if (status === "Ongoing") activeColor = "bg-blue-600 text-white shadow-sm font-bold";

            return (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                  isSelected
                    ? activeColor
                    : "bg-slate-950/50 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {status}
              </button>
            );
          })}
        </div>

        {/* ==================================================== */}
        {/* EXCEL-STYLE PROJECTS TABLE                           */}
        {/* ==================================================== */}
        <div className="rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950">
          {/* Excel Title & Quick Export Ribbon */}
          <div className="bg-[#107c41] px-4 py-2 flex items-center justify-between text-white border-b border-emerald-800">
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded bg-white/10 text-white flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              </div>
              <span className="font-semibold text-xs tracking-wide">
                Projects_Master.xlsx - Client Project Registry
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white/15 text-emerald-100 font-medium">
                AutoSave: On
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={exportToCsv}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-white/15 hover:bg-white/25 active:bg-white/30 text-white text-xs font-semibold transition-all border border-white/20 shadow-sm"
                title="Download CSV to open in Microsoft Excel"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export Excel (.CSV)</span>
                <span className="sm:hidden">CSV</span>
              </button>
            </div>
          </div>

          {/* Spreadsheet Table Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[750px] font-sans">
              <thead>
                {/* Excel Column Letters & Column Header */}
                <tr className="bg-slate-900 border-b border-slate-700 text-slate-300 text-[11px] font-mono select-none">
                  {/* Corner index cell ◢ */}
                  <th className="w-12 py-2 px-2 text-center border-r border-slate-700/80 bg-slate-900 text-slate-500 font-bold text-[10px]">
                    ◢
                  </th>
                  <th className="py-2 px-3 border-r border-slate-700/80 font-bold tracking-wider">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-normal mr-1">A</span>
                      <span className="text-white font-bold">NAME & TYPE</span>
                    </div>
                  </th>
                  <th className="py-2 px-3 border-r border-slate-700/80 font-bold tracking-wider">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-normal mr-1">B</span>
                      <span className="text-white font-bold">PLACE / SITE</span>
                    </div>
                  </th>
                  <th className="py-2 px-3 border-r border-slate-700/80 font-bold tracking-wider">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-normal mr-1">C</span>
                      <span className="text-white font-bold">STATUS</span>
                    </div>
                  </th>
                  <th className="w-28 py-2 px-2 text-center font-bold tracking-wider">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-slate-400 font-normal mr-1">D</span>
                      <span className="text-white font-bold">ACTIONS</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {initialLoading && projects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 text-xs">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-400" />
                      Loading projects...
                    </td>
                  </tr>
                ) : filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                      No matching projects found.
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((p, idx) => {
                    const statusStyle = getStatusStyle(p.status);
                    const placeName = p.place || "—";
                    const detailHref = `/dashboard/projects/${p.id}`;

                    return (
                      <tr
                        key={p.id || p.project_number}
                        className="hover:bg-emerald-500/10 transition-colors group border-b border-slate-800/80"
                      >
                        {/* Excel Row Index */}
                        <td className="py-2.5 px-2 text-center font-mono text-[11px] text-slate-500 bg-slate-900/70 border-r border-slate-800 select-none group-hover:bg-slate-800 group-hover:text-emerald-400 font-semibold">
                          {idx + 1}
                        </td>

                        {/* Column A: Name */}
                        <td className="py-2.5 px-3 border-r border-slate-800">
                          <div className="flex flex-col gap-0.5">
                            <Link
                              href={detailHref}
                              className="font-bold text-slate-100 text-sm hover:text-amber-400 transition-colors inline-block"
                            >
                              {p.name}
                            </Link>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {p.type} • {p.project_number}
                            </span>
                          </div>
                        </td>

                        {/* Column B: Place */}
                        <td className="py-2.5 px-3 border-r border-slate-800">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="font-medium truncate max-w-[240px]" title={placeName}>
                              {placeName}
                            </span>
                          </div>
                        </td>

                        {/* Column C: Status */}
                        <td className="py-2.5 px-3 border-r border-slate-800">
                          <select
                            value={p.status}
                            onChange={(e) => handleStatusChange(p.id!, e.target.value)}
                            className={`px-3 py-1 rounded-full text-xs font-bold border focus:outline-none cursor-pointer transition-all ${statusStyle.badgeClass}`}
                          >
                            {PROJECT_STATUSES.map((st) => (
                              <option
                                key={st}
                                value={st}
                                className={`bg-slate-900 font-semibold ${
                                  st === "Completed"
                                    ? "text-emerald-400"
                                    : st === "Pending"
                                    ? "text-rose-400"
                                    : "text-blue-400"
                                }`}
                              >
                                {st}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Column D: Actions */}
                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          <Link
                            href={detailHref}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Details</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Excel Workbook Footer: Sheet Tab & Status Bar */}
          <div className="bg-slate-900 px-3 py-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono select-none">
            {/* Sheet Tabs */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <div className="px-3 py-1 rounded-t-md bg-slate-950 border-t-2 border-emerald-500 border-x border-b-0 border-slate-800 text-emerald-400 font-bold text-[11px] flex items-center gap-1.5 shadow-sm">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Sheet1 - Projects Master</span>
              </div>
            </div>

            {/* Excel Status Bar metrics */}
            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono w-full sm:w-auto justify-end">
              <span className="text-slate-500 font-bold uppercase text-[10px]">READY</span>
              <span className="hidden md:inline text-slate-700">|</span>
              <span className="hidden md:inline">
                COUNT: <strong className="text-slate-200">{filteredProjects.length}</strong>
              </span>
              <span className="hidden md:inline text-slate-700">|</span>
              <span className="hidden md:inline">
                ONGOING: <strong className="text-blue-400">{projects.filter((p) => p.status === "Ongoing").length}</strong>
              </span>
              <span className="text-slate-700">|</span>
              <span>
                COMPLETED: <strong className="text-emerald-400">{projects.filter((p) => p.status === "Completed").length}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleProjectCreated}
      />
    </div>
  );
}
