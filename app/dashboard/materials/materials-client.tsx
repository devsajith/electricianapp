"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Package,
  Eye,
  Trash2,
  FileSpreadsheet,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteMaterialAction } from "./actions";

export interface SafeMaterial {
  id: string;
  name: string;
  brand: string | null;
  unit: string;
  created_at: string;
}

interface Props {
  initialMaterials: SafeMaterial[];
}

export default function MaterialsClient({ initialMaterials }: Props) {
  const [materials, setMaterials] = useState<SafeMaterial[]>(initialMaterials);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete material "${name}"?`)) return;

    startTransition(async () => {
      const res = await deleteMaterialAction(id);
      if (res.success) {
        setMaterials((prev) => prev.filter((m) => m.id !== id));
      } else {
        alert(res.error || "Failed to delete material.");
      }
    });
  };

  const q = searchQuery.toLowerCase().trim();

  const filteredMaterials = materials.filter((item) => {
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      (item.brand ?? "").toLowerCase().includes(q)
    );
  });

  const totalItems = materials.length;

  const exportToCsv = () => {
    if (filteredMaterials.length === 0) return;
    const headers = ["Row", "Name", "Brand", "Unit"];
    const rows = filteredMaterials.map((item, idx) => [
      idx + 1,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${(item.brand || "—").replace(/"/g, '""')}"`,
      `"${item.unit.replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Materials_Catalog_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Materials
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse and manage all electrical inventory materials.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/materials/new">
            <Button className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 shadow-md">
              <Plus className="w-4 h-4" />
              <span>Add Material</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-slate-400">Total Materials</p>
            <p className="text-2xl font-bold text-white mt-1">{totalItems}</p>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <Package className="w-5 h-5 text-amber-400" />
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
            placeholder="Search by name or brand..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Material List Table - Excel Spreadsheet Container */}
      <div className="rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950">
        <div className="bg-[#107c41] px-4 py-2 flex flex-wrap items-center justify-between text-white border-b border-emerald-800 text-xs">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span className="font-bold tracking-wide">Materials_Catalog.xlsx</span>
            <span className="bg-emerald-900/60 text-emerald-200 text-[10px] px-2 py-0.5 rounded font-mono font-semibold">
              AutoSave [ON]
            </span>
            <span className="text-[11px] text-emerald-100 hidden sm:inline ml-2">
              Showing {filteredMaterials.length} of {materials.length} records
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

        {filteredMaterials.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Package className="w-10 h-10 mx-auto text-slate-600" />
            <div>
              <p className="text-sm font-semibold text-slate-300">No materials found</p>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery
                  ? "Try resetting your search query."
                  : "Click 'Add Material' to create your first item."}
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
              <Link href="/dashboard/materials/new">
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Material
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-700">
                  <th className="py-2 px-3 w-12 text-center border-r border-slate-700/80 bg-slate-900/90 text-slate-500 font-mono select-none">
                    ◢
                  </th>
                  <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold">
                    <div className="text-[10px] text-emerald-400 font-mono">A</div>
                    NAME
                  </th>
                  <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold w-48">
                    <div className="text-[10px] text-emerald-400 font-mono">B</div>
                    BRAND
                  </th>
                  <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold w-36">
                    <div className="text-[10px] text-emerald-400 font-mono">C</div>
                    UNIT
                  </th>
                  <th className="py-2.5 px-4 font-bold text-center w-28">
                    <div className="text-[10px] text-emerald-400 font-mono">D</div>
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs font-mono">
                {filteredMaterials.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="hover:bg-emerald-500/10 transition-colors group border-b border-slate-800/80"
                  >
                    <td className="py-2.5 px-3 text-center bg-slate-900/70 border-r border-slate-800 text-slate-400 select-none text-[11px] font-mono group-hover:text-emerald-400 group-hover:bg-emerald-950/30">
                      {idx + 1}
                    </td>

                    <td className="py-2.5 px-4 border-r border-slate-800 font-sans font-semibold text-slate-100">
                      <Link
                        href={`/dashboard/materials/${item.id}`}
                        className="hover:text-emerald-400 transition-colors block"
                      >
                        {item.name}
                      </Link>
                    </td>

                    <td className="py-2.5 px-4 border-r border-slate-800 whitespace-nowrap font-sans">
                      <span className="font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[11px]">
                        {item.brand || "—"}
                      </span>
                    </td>

                    <td className="py-2.5 px-4 border-r border-slate-800 whitespace-nowrap text-slate-300 font-mono text-[11px]">
                      {item.unit}
                    </td>

                    <td className="py-2.5 px-4 text-center whitespace-nowrap font-sans">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/dashboard/materials/${item.id}`}>
                          <Button
                            variant="ghost"
                            size="xs"
                            className="text-slate-300 hover:text-emerald-400 hover:bg-slate-800 h-7 px-2"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="text-[11px] ml-1">View</span>
                          </Button>
                        </Link>
                        <Button
                          onClick={() => handleDelete(item.id, item.name)}
                          disabled={isPending}
                          variant="ghost"
                          size="xs"
                          className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 h-7 w-7 p-0"
                          title="Delete Material"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
