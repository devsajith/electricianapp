"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  ListChecks,
  Plus,
  Search,
  RefreshCw,
  FolderKanban,
  Package,
  IndianRupee,
  ChevronRight,
  ExternalLink,
  Printer,
  Trash2,
  Building2,
  Clock,
  Layers,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectItemList } from "@/lib/types/estimate";
import { getAllProjectItemListsAction, deleteProjectItemListAction } from "./actions";

export default function ItemListPage() {
  const [projectLists, setProjectLists] = useState<ProjectItemList[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"All" | "WithItems" | "NoItems">("All");
  const [, startTransition] = useTransition();

  const loadData = async () => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 2500);

    try {
      const res = await getAllProjectItemListsAction();
      clearTimeout(timer);
      setProjectLists(res.data || []);
    } catch (e) {
      console.error("Error loading project item lists:", e);
      clearTimeout(timer);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteItems = (projectId: string, customerName: string) => {
    if (!confirm(`Are you sure you want to clear the item list for ${customerName}?`)) return;
    startTransition(async () => {
      setProjectLists((prev) =>
        prev.map((p) =>
          p.project_id === projectId
            ? { ...p, items: [], subtotal: 0, discount: 0, tax: 0, total_amount: 0 }
            : p
        )
      );
      await deleteProjectItemListAction(projectId);
    });
  };

  // Filtered lists
  const filtered = projectLists.filter((p) => {
    const hasItems = p.items && p.items.length > 0;
    if (selectedFilter === "WithItems" && !hasItems) return false;
    if (selectedFilter === "NoItems" && hasItems) return false;

    const q = searchQuery.toLowerCase();
    if (!q) return true;

    const matchesProject =
      p.project_number.toLowerCase().includes(q) ||
      p.customer_name.toLowerCase().includes(q) ||
      (p.project_type && p.project_type.toLowerCase().includes(q)) ||
      (p.address && p.address.toLowerCase().includes(q));

    const matchesItem = p.items.some((it) =>
      it.description.toLowerCase().includes(q)
    );

    return matchesProject || matchesItem;
  });

  // KPI Calculations
  const projectsWithItemsCount = projectLists.filter((p) => p.items && p.items.length > 0).length;
  const totalItemsCount = projectLists.reduce((acc, p) => acc + (p.items?.length || 0), 0);
  const totalEstimatedCost = projectLists.reduce((acc, p) => acc + (p.total_amount || 0), 0);

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
              Project Item Lists
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Create, track, and manage all material items, parts, and hardware needed for your projects.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
          <Button
            variant="outline"
            onClick={loadData}
            disabled={loading}
            className="h-10 sm:h-9 text-xs border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
            Refresh
          </Button>

          <Link href="/dashboard/item-list/new">
            <Button className="h-10 sm:h-9 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 shadow-sm">
              <Plus className="w-4 h-4" />
              <span>Create Item List</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">
              Total Projects
            </span>
            <FolderKanban className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white font-mono">
            {projectLists.length}
          </p>
          <span className="text-[10px] text-slate-500">Active jobs stream</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">
              Configured Lists
            </span>
            <ListChecks className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
            {projectsWithItemsCount}
          </p>
          <span className="text-[10px] text-slate-500">Projects with items needed</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">
              Total Item Rows
            </span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white font-mono">
            {totalItemsCount}
          </p>
          <span className="text-[10px] text-slate-500">Material lines recorded</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">
              {totalEstimatedCost > 0 ? "Est. Total Value" : "Material Status"}
            </span>
            <Package className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
            {totalEstimatedCost > 0
              ? `₹${totalEstimatedCost.toLocaleString("en-IN")}`
              : `${projectsWithItemsCount} Active`}
          </p>
          <span className="text-[10px] text-slate-500">
            {totalEstimatedCost > 0 ? "Combined materials cost" : "Projects with items configured"}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by project #, customer name, or item description..."
              className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-base sm:text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "All", label: "All Projects" },
              { id: "WithItems", label: `With Items (${projectsWithItemsCount})` },
              { id: "NoItems", label: `Needs Items (${projectLists.length - projectsWithItemsCount})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id as typeof selectedFilter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedFilter === f.id
                    ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                    : "bg-slate-950/50 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Project Item Lists Grid / Stream */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs space-y-2 bg-slate-900/40 rounded-2xl border border-slate-800/60">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400" />
          <p>Loading project item lists...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-xs bg-slate-900/40 rounded-2xl border border-slate-800/60 p-6 space-y-4">
          <Package className="w-10 h-10 mx-auto text-slate-600" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-200">No project item lists found</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? `No item lists matching "${searchQuery}".`
                : "Create a list of items and materials needed for your electrical projects."}
            </p>
          </div>
          <Link href="/dashboard/item-list/new">
            <Button className="h-9 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Create First Item List</span>
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((item) => {
            const hasItems = item.items && item.items.length > 0;
            const itemsCount = item.items?.length || 0;

            return (
              <div
                key={item.project_id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-700/80 transition-all flex flex-col justify-between"
              >
                {/* Card Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-950 text-amber-400 font-mono font-bold text-xs border border-slate-800">
                          {item.project_number}
                        </span>
                        {item.project_type && (
                          <span className="text-[11px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-700/50">
                            {item.project_type}
                          </span>
                        )}
                      </div>
                      <h2 className="text-base font-bold text-white mt-1.5">
                        {item.customer_name}
                      </h2>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                        Items Needed
                      </span>
                      <span className="font-mono text-base font-black text-amber-400">
                        {itemsCount} {itemsCount === 1 ? "Item" : "Items"}
                      </span>
                    </div>
                  </div>

                  {item.address && (
                    <p className="text-xs text-slate-400 truncate flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{item.address}</span>
                    </p>
                  )}
                </div>

                {/* Items Preview Area */}
                <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/80 space-y-2 flex-1">
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800/60">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-amber-400" />
                      Materials List ({itemsCount})
                    </span>
                    {hasItems && (
                      <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                        Ready for Procurement
                      </span>
                    )}
                  </div>

                  {!hasItems ? (
                    <div className="py-5 text-center space-y-2">
                      <p className="text-xs text-slate-500 italic">
                        No materials added yet for this project.
                      </p>
                      <Link href={`/dashboard/item-list/new?projectId=${item.project_id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10 gap-1 mt-1"
                        >
                          <Plus className="w-3 h-3" />
                          Add Items List
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {item.items.slice(0, 4).map((it, idx) => (
                        <div
                          key={it.id || idx}
                          className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-slate-900/60 text-slate-200"
                        >
                          <span className="truncate max-w-[220px] sm:max-w-xs font-medium">
                            {it.description}
                          </span>
                          <span className="font-mono text-amber-400 font-bold text-xs shrink-0">
                            {it.quantity ?? it.qty} {it.unit}
                          </span>
                        </div>
                      ))}

                      {itemsCount > 4 && (
                        <p className="text-[11px] text-amber-400/80 pt-1 font-medium">
                          + {itemsCount - 4} more item{itemsCount - 4 > 1 ? "s" : ""} in list...
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    {hasItems && (
                      <button
                        onClick={() => handleDeleteItems(item.project_id, item.customer_name)}
                        className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Clear all items"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/item-list/new?projectId=${item.project_id}`}>
                      <Button
                        size="sm"
                        className="h-8 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1 shadow-sm"
                      >
                        {hasItems ? "Edit Item List" : "Create Item List"}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
