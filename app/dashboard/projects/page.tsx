"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import {
  getProjectsAction,
  updateProjectStatusAction,
  deleteProjectAction,
  ProjectRecord,
} from "./actions";
import { CreateProjectModal } from "./create-project-modal";
import {
  FolderKanban,
  Plus,
  Search,
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trash2,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const initialSampleProjects: ProjectRecord[] = [
  {
    id: "sample-1",
    project_number: "PRJ-918234",
    customer_name: "Apex Retail Plaza",
    customer_phone: "(555) 234-5678",
    address: "742 Commercial Blvd, Suite 100",
    project_type: "Maintenance",
    work_description: "Routine quarterly panel check and emergency lighting battery tests.",
    start_date: "2026-09-10",
    expected_completion_date: "2026-09-22",
    status: "In Progress",
    notes: "Permit #EL-2026-894 approved. Keycard at security desk.",
  },
  {
    id: "sample-2",
    project_number: "PRJ-482019",
    customer_name: "Sarah Jenkins",
    customer_phone: "(555) 876-5432",
    address: "1849 Maple Street, Austin TX",
    project_type: "Residential Wiring and Plumbing",
    work_description: "Kitchen rewiring and water heater electrical/pipe hookup.",
    start_date: "2026-09-01",
    expected_completion_date: "2026-09-12",
    status: "Completed",
    notes: "Client signed off on final walkthrough.",
  },
  {
    id: "sample-3",
    project_number: "PRJ-631940",
    customer_name: "Marcus Vance",
    customer_phone: "(555) 345-6789",
    address: "305 Innovation Way, Building B",
    project_type: "Emergency",
    work_description: "Urgent main breaker trip investigation and emergency repair.",
    start_date: "2026-09-14",
    expected_completion_date: "2026-09-15",
    status: "Scheduled",
    notes: "Emergency dispatch technician assigned.",
  },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const data = await getProjectsAction();
    if (data && data.length > 0) {
      setProjects(data);
    } else {
      setProjects(initialSampleProjects);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;
    getProjectsAction().then((data) => {
      if (!isMounted) return;
      if (data && data.length > 0) {
        setProjects(data);
      } else {
        setProjects(initialSampleProjects);
      }
      setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleStatusChange = (id: string, newStatus: string) => {
    startTransition(async () => {
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
      );
      if (id && !id.startsWith("sample-")) {
        await updateProjectStatusAction(id, newStatus);
      }
    });
  };

  const handleDeleteProject = (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    startTransition(async () => {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (id && !id.startsWith("sample-")) {
        await deleteProjectAction(id);
      }
    });
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("progress")) return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    if (s.includes("completed")) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    if (s.includes("scheduled")) return "bg-indigo-500/10 text-indigo-400 border-indigo-500/30";
    if (s.includes("hold")) return "bg-purple-500/10 text-purple-400 border-purple-500/30";
    if (s.includes("cancel")) return "bg-red-500/10 text-red-400 border-red-500/30";
    return "bg-amber-500/10 text-amber-400 border-amber-500/30";
  };

  // Filter logic
  const filteredProjects = projects.filter((p) => {
    const matchesStatus = selectedStatus === "All" || p.status.toLowerCase().includes(selectedStatus.toLowerCase());
    const matchesType = selectedType === "All" || p.project_type === selectedType;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      p.project_number.toLowerCase().includes(q) ||
      p.customer_name.toLowerCase().includes(q) ||
      p.customer_phone?.toLowerCase().includes(q) ||
      p.address?.toLowerCase().includes(q) ||
      p.work_description?.toLowerCase().includes(q) ||
      p.notes?.toLowerCase().includes(q);

    return matchesStatus && matchesType && matchesSearch;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-md bg-amber-500/10 text-amber-400">
              <FolderKanban className="w-5 h-5" />
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">Projects List</h1>
          </div>
          <p className="text-xs text-slate-400">
            Mobile-optimized job stream, one-tap phone dialer, and quick status tracking.
          </p>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
          <Button
            variant="outline"
            onClick={fetchProjects}
            disabled={loading}
            className="h-10 sm:h-9 text-xs border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="h-10 sm:h-9 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 shadow-md flex-1 sm:flex-none justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
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
              placeholder="Search Project # or Customer Name..."
              className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-base sm:text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
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
              <option value="All">All Project Types</option>
              <option value="Residential Wiring">Residential Wiring</option>
              <option value="Residential Plumbing">Residential Plumbing</option>
              <option value="Residential Wiring and Plumbing">Residential Wiring & Plumbing</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>
        </div>

        {/* Status Filter Horizontal Scrollable Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-slate-800/60 pt-3">
          {["All", "Pending", "In Progress", "Scheduled", "Completed", "On Hold", "Cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3.5 py-2 sm:py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                selectedStatus === status
                  ? "bg-amber-500 text-slate-950 shadow-sm font-bold"
                  : "bg-slate-950/50 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* ==================================================== */}
        {/* MOBILE VIEW: Touch-Friendly Card Stream (< md)      */}
        {/* ==================================================== */}
        <div className="block md:hidden space-y-3 pt-2">
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400" />
              <p>Loading projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs bg-slate-950/40 rounded-xl border border-slate-800/60 p-4">
              No matching project records found.
            </div>
          ) : (
            filteredProjects.map((p) => {
              const rowId = p.id || p.project_number;
              const isExpanded = expandedProjectId === rowId;

              return (
                <div
                  key={rowId}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 shadow-sm space-y-3 transition-all active:border-amber-500/30"
                >
                  {/* Card Top Row: Project # Badge & Status Dropdown */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-amber-400 font-mono font-bold text-xs border border-slate-800">
                      {p.project_number}
                    </span>

                    <select
                      value={p.status}
                      onChange={(e) => handleStatusChange(p.id!, e.target.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border focus:outline-none cursor-pointer ${getStatusBadge(
                        p.status
                      )}`}
                    >
                      <option value="Pending" className="bg-slate-900 text-slate-200">Pending</option>
                      <option value="In Progress" className="bg-slate-900 text-slate-200">In Progress</option>
                      <option value="Scheduled" className="bg-slate-900 text-slate-200">Scheduled</option>
                      <option value="Completed" className="bg-slate-900 text-slate-200">Completed</option>
                      <option value="On Hold" className="bg-slate-900 text-slate-200">On Hold</option>
                      <option value="Cancelled" className="bg-slate-900 text-slate-200">Cancelled</option>
                    </select>
                  </div>

                  {/* Card Middle: Customer Name & 1-Tap Dialer */}
                  <div className="flex items-start justify-between gap-2 pt-1">
                    <div>
                      <h3 className="font-bold text-slate-100 text-sm">{p.customer_name}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{p.project_type}</p>
                    </div>

                    {p.customer_phone && (
                      <a
                        href={`tel:${p.customer_phone.replace(/[^\d+]/g, "")}`}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 shrink-0 active:scale-95 transition-transform"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Call
                      </a>
                    )}
                  </div>

                  {/* Address Summary preview if available */}
                  {p.address && (
                    <div className="flex items-start gap-1.5 text-xs text-slate-400 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="truncate">{p.address}</span>
                    </div>
                  )}

                  {/* Accordion Expand Toggle */}
                  <button
                    type="button"
                    onClick={() => setExpandedProjectId(isExpanded ? null : rowId)}
                    className="w-full pt-2 flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-amber-400 border-t border-slate-800/80"
                  >
                    <span>{isExpanded ? "Hide Details" : "View Details & Notes"}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {/* Expanded Card Details */}
                  {isExpanded && (
                    <div className="pt-2 space-y-3 text-xs border-t border-slate-800/60">
                      {p.work_description && (
                        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                          <p className="font-bold text-amber-400 text-[10px] uppercase mb-1">Work Scope</p>
                          <p className="text-slate-300 leading-relaxed">{p.work_description}</p>
                        </div>
                      )}

                      {p.notes && (
                        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                          <p className="font-bold text-amber-400 text-[10px] uppercase mb-1">Notes</p>
                          <p className="text-slate-300 leading-relaxed">{p.notes}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>Start: <strong className="text-slate-200">{p.start_date || "N/A"}</strong></span>
                        <span>Expected: <strong className="text-slate-200">{p.expected_completion_date || "N/A"}</strong></span>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => handleDeleteProject(p.id!)}
                          className="w-full py-2.5 rounded-xl text-red-400 bg-red-500/10 border border-red-500/20 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Project
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ==================================================== */}
        {/* DESKTOP VIEW: Standard Clean Table (>= md)          */}
        {/* ==================================================== */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-800/80">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/90 border-b border-slate-800 text-[11px] uppercase tracking-wider font-bold text-slate-300">
                <th className="py-3.5 px-4 w-1/4">Project #</th>
                <th className="py-3.5 px-4 w-2/5">Customer Name</th>
                <th className="py-3.5 px-4 w-1/4">Status</th>
                <th className="py-3.5 px-4 text-right w-1/6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-500 text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-400" />
                    Fetching project records...
                  </td>
                </tr>
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-400 text-xs">
                    No matching projects found.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => {
                  const rowId = p.id || p.project_number;
                  const isExpanded = expandedProjectId === rowId;

                  return (
                    <tr key={rowId} className="group hover:bg-slate-800/30 transition-colors">
                      <td colSpan={4} className="p-0">
                        {/* 4-Column Summary Row */}
                        <div
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/40 transition-colors"
                          onClick={() => setExpandedProjectId(isExpanded ? null : rowId)}
                        >
                          <div className="grid grid-cols-12 gap-4 w-full items-center">
                            {/* Column 1: Project # (col-span-3) */}
                            <div className="col-span-3 flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-amber-400 font-mono font-bold text-xs border border-slate-700/60">
                                {p.project_number}
                              </span>
                            </div>

                            {/* Column 2: Customer Name & Phone (col-span-5) */}
                            <div className="col-span-5">
                              <div className="font-bold text-slate-100 text-sm">{p.customer_name}</div>
                              {p.customer_phone && (
                                <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Phone className="w-3 h-3 text-slate-500" />
                                  <a href={`tel:${p.customer_phone.replace(/[^\d+]/g, "")}`} className="hover:underline hover:text-amber-400">
                                    {p.customer_phone}
                                  </a>
                                </div>
                              )}
                            </div>

                            {/* Column 3: Status (col-span-3) */}
                            <div className="col-span-3" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={p.status}
                                onChange={(e) => handleStatusChange(p.id!, e.target.value)}
                                className={`px-3 py-1 rounded-full text-xs font-bold border focus:outline-none cursor-pointer ${getStatusBadge(
                                  p.status
                                )}`}
                              >
                                <option value="Pending" className="bg-slate-900 text-slate-200">Pending</option>
                                <option value="In Progress" className="bg-slate-900 text-slate-200">In Progress</option>
                                <option value="Scheduled" className="bg-slate-900 text-slate-200">Scheduled</option>
                                <option value="Completed" className="bg-slate-900 text-slate-200">Completed</option>
                                <option value="On Hold" className="bg-slate-900 text-slate-200">On Hold</option>
                                <option value="Cancelled" className="bg-slate-900 text-slate-200">Cancelled</option>
                              </select>
                            </div>

                            {/* Column 4: Actions / Chevron Toggle (col-span-1) */}
                            <div className="col-span-1 flex items-center justify-end">
                              <button
                                type="button"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Detail Drawer */}
                        {isExpanded && (
                          <div className="p-5 bg-slate-950/80 border-t border-slate-800/80 space-y-4 text-xs">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Type & Dates Card */}
                              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                                <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[10px] text-amber-400">
                                  Project Specifications
                                </h4>
                                <div className="space-y-1.5 text-slate-300">
                                  <p><span className="text-slate-500">Type:</span> <strong className="text-slate-200">{p.project_type}</strong></p>
                                  <p><span className="text-slate-500">Start Date:</span> <strong className="text-slate-200">{p.start_date || "N/A"}</strong></p>
                                  <p><span className="text-slate-500">Expected Completion:</span> <strong className="text-slate-200">{p.expected_completion_date || "N/A"}</strong></p>
                                </div>
                              </div>

                              {/* Site Address & Description */}
                              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                                <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[10px] text-amber-400">
                                  Address & Scope
                                </h4>
                                {p.address && (
                                  <p className="flex items-start gap-1.5 text-slate-300">
                                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                    <span>{p.address}</span>
                                  </p>
                                )}
                                <p className="text-slate-300 leading-relaxed pt-1">
                                  {p.work_description || <span className="text-slate-500 italic text-[11px]">No work description specified</span>}
                                </p>
                              </div>

                              {/* Notes & Actions Card */}
                              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between">
                                <div>
                                  <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[10px] text-amber-400 mb-1">
                                    Notes
                                  </h4>
                                  <p className="text-slate-300 leading-relaxed">
                                    {p.notes || <span className="text-slate-500 italic text-[11px]">No additional notes</span>}
                                  </p>
                                </div>

                                <div className="pt-2 border-t border-slate-800 flex items-center justify-end">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteProject(p.id!);
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 border border-red-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete Project
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Project Modal Dialog */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchProjects}
      />
    </div>
  );
}
