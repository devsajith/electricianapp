"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import Link from "next/link";
import {
  ListChecks,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Trash2,
  FileSpreadsheet,
  Download,
  Building2,
  Layers,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MaterialList } from "@/lib/types/material";
import { getMaterialListsAction, deleteMaterialListAction } from "./actions";

export default function ItemListPage() {
  const [lists, setLists] = useState<MaterialList[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"All" | "Project" | "General">("All");
  const [, startTransition] = useTransition();

  const loadLists = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMaterialListsAction();
      setLists(data || []);
    } catch {
      setLists([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    getMaterialListsAction()
      .then((data) => {
        if (isMounted) {
          setLists(data || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLists([]);
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete material list "${title}"?`)) return;

    startTransition(async () => {
      setLists((prev) => prev.filter((item) => item.id !== id));
      await deleteMaterialListAction(id);
    });
  };

  const filteredLists = lists.filter((list) => {
    const isProject = Boolean(list.project_id);
    if (selectedFilter === "Project" && !isProject) return false;
    if (selectedFilter === "General" && isProject) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = list.title.toLowerCase().includes(q);
    const projMatch = list.project_name?.toLowerCase().includes(q) || list.project_number?.toLowerCase().includes(q);
    return titleMatch || projMatch;
  });

  const exportToCsv = () => {
    if (filteredLists.length === 0) return;
    const headers = ["#", "List Title", "Classification", "Project #", "Project Name", "Item Count", "Created Date"];
    const rows = filteredLists.map((l, idx) => [
      idx + 1,
      `"${l.title.replace(/"/g, '""')}"`,
      l.project_id ? "Project" : "General",
      `"${l.project_number || "—"}"`,
      `"${(l.project_name || "—").replace(/"/g, '""')}"`,
      l.item_count || 0,
      l.created_at ? new Date(l.created_at).toLocaleDateString() : "—",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Material_Lists_${new Date().toISOString().slice(0, 10)}.csv`);
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
              <ListChecks className="w-5 h-5" />
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Material Lists
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Create and track procurement indents for ongoing client sites or general shop spares.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
          <Button
            variant="outline"
            onClick={loadLists}
            disabled={loading}
            className="h-10 sm:h-9 text-xs border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
            Refresh
          </Button>
          <Link href="/dashboard/item-list/new">
            <Button className="h-10 sm:h-9 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 shadow-sm">
              <Plus className="w-4 h-4" />
              <span>Create Material List</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Lists</span>
            <ListChecks className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-white">{lists.length}</div>
          <div className="text-[10px] text-slate-500">recorded lists</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Project Lists</span>
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-blue-400">
            {lists.filter((l) => Boolean(l.project_id)).length}
          </div>
          <div className="text-[10px] text-slate-500">linked to sites</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">General Lists</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-emerald-400">
            {lists.filter((l) => !l.project_id).length}
          </div>
          <div className="text-[10px] text-slate-500">shop & maintenance</div>
        </div>
      </div>

      {/* Filters and Search Strip */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by list title or project..."
              className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-base sm:text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {(["All", "Project", "General"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedFilter === filter
                    ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                    : "bg-slate-950/50 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {filter === "All" ? "All Lists" : filter === "Project" ? "Project Lists" : "General / Non-Project"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Excel Spreadsheet Container */}
      <div className="rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950">
          {/* Excel Ribbon */}
          <div className="bg-[#107c41] px-4 py-2 flex flex-wrap items-center justify-between text-white border-b border-emerald-800 text-xs">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span className="font-bold tracking-wide">Material_Lists_Register.xlsx</span>
              <span className="text-[10px] bg-emerald-900/60 text-emerald-200 px-2 py-0.5 rounded font-mono font-semibold">
                AutoSave: On
              </span>
              <span className="text-[11px] text-emerald-100 hidden sm:inline ml-2">
                Showing {filteredLists.length} of {lists.length} lists
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportToCsv}
                className="flex items-center gap-1.5 px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded font-medium text-xs shadow-sm transition-colors border border-emerald-600"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Excel (.CSV)</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
              Loading material lists...
            </div>
          ) : filteredLists.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <ListChecks className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm font-semibold text-slate-300">No material lists found</p>
              <p className="text-xs text-slate-500">
                Create a project list or a general shop list to organize materials needed.
              </p>
              <Link href="/dashboard/item-list/new">
                <Button className="mt-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Create Your First List
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px] font-sans">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-700">
                    <th className="py-2.5 px-3 w-12 text-center border-r border-slate-700/80 bg-slate-900 text-slate-500 font-mono select-none">
                      ◢
                    </th>
                    <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold">
                      <div className="text-[10px] text-emerald-400 font-mono">A</div>
                      LIST TITLE
                    </th>
                    <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold w-64">
                      <div className="text-[10px] text-emerald-400 font-mono">B</div>
                      CLASSIFICATION / SITE
                    </th>
                    <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold text-center w-28">
                      <div className="text-[10px] text-emerald-400 font-mono">C</div>
                      ITEMS
                    </th>
                    <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold text-center w-32">
                      <div className="text-[10px] text-emerald-400 font-mono">D</div>
                      DATE
                    </th>
                    <th className="py-2.5 px-4 font-bold text-center w-28">
                      <div className="text-[10px] text-emerald-400 font-mono">E</div>
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs">
                  {filteredLists.map((item, idx) => {
                    const isProject = Boolean(item.project_id);
                    const viewHref = `/dashboard/item-list/${item.id}`;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-emerald-500/10 transition-colors group border-b border-slate-800/80"
                      >
                        <td className="py-3 px-3 text-center bg-slate-900/70 border-r border-slate-800 text-slate-400 select-none text-[11px] font-mono group-hover:text-emerald-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 border-r border-slate-800">
                          <Link
                            href={viewHref}
                            className="font-bold text-slate-100 hover:text-amber-400 transition-colors text-sm"
                          >
                            {item.title}
                          </Link>
                          {item.notes && (
                            <div className="text-[11px] text-slate-400 truncate max-w-sm mt-0.5">
                              {item.notes}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 border-r border-slate-800">
                          {isProject ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400">
                                <Building2 className="w-3 h-3" />
                                {item.project_name || "Project"}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {item.project_number}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                              <Layers className="w-3 h-3" />
                              General / Shop Stock
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 border-r border-slate-800 text-center font-mono font-bold text-slate-200">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-amber-400 text-xs border border-slate-700">
                            {item.item_count || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4 border-r border-slate-800 text-center font-mono text-slate-400 text-[11px]">
                          <div className="flex items-center justify-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span>
                              {item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Link href={viewHref}>
                              <Button
                                size="sm"
                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-1 rounded px-2.5 shadow-sm"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </Button>
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id, item.title)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                              title="Delete list"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </div>
  );
}
