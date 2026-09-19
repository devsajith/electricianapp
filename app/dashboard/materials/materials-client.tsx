"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Package,
  Eye,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Material, MATERIAL_CATEGORIES } from "@/lib/types/material";
import {
  deleteMaterialAction,
  toggleMaterialStatusAction,
} from "./actions";

interface SafeMaterial {
  id: string;
  item_name: string;
  category: string;
  brand: string | null;
  unit: string;
  default_price: number;
  supplier: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

interface Props {
  initialMaterials: SafeMaterial[];
}

export default function MaterialsClient({ initialMaterials }: Props) {
  const [materials, setMaterials] = useState<SafeMaterial[]>(initialMaterials);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [isPending, startTransition] = useTransition();

  const handleToggleStatus = (id: string, currentIsActive: boolean) => {
    const nextIsActive = !currentIsActive;
    startTransition(async () => {
      const res = await toggleMaterialStatusAction(id, nextIsActive);
      if (res.success) {
        setMaterials((prev) =>
          prev.map((m) => (m.id === id ? { ...m, is_active: nextIsActive } : m))
        );
      } else {
        alert(res.error || "Failed to update status.");
      }
    });
  };

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

  // All fields guaranteed strings by server component — safe to call directly
  const q = searchQuery.toLowerCase().trim();

  const filteredMaterials = materials.filter((item) => {
    const matchesSearch =
      !q ||
      item.item_name.toLowerCase().includes(q) ||
      (item.brand ?? "").toLowerCase().includes(q) ||
      (item.supplier ?? "").toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q);

    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;

    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Active" && item.is_active) ||
      (statusFilter === "Inactive" && !item.is_active);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalItems = materials.length;
  const activeCount = materials.filter((m) => m.is_active).length;
  const inactiveCount = materials.filter((m) => !m.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Material Catalogue
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Connected to Supabase{" "}
            <code className="text-amber-400 font-mono">material_catalogue</code> table.
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

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-slate-400">Total Materials</p>
            <p className="text-2xl font-bold text-white mt-1">{totalItems}</p>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <Package className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-slate-400">Active Catalogue Items</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{activeCount}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-slate-400">Inactive Items</p>
            <p className="text-2xl font-bold text-slate-400 mt-1">{inactiveCount}</p>
          </div>
          <div className="p-3 bg-slate-800 border border-slate-700 rounded-lg">
            <XCircle className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, category, brand, or supplier..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 w-full md:w-44"
            >
              <option value="All">All Categories</option>
              {MATERIAL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 w-full md:w-36"
            >
              <option value="All">All Status</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory("All")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap ${
              selectedCategory === "All"
                ? "bg-amber-500 text-slate-950 font-bold"
                : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
            }`}
          >
            All Items
          </button>
          {MATERIAL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Material List Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {filteredMaterials.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Package className="w-10 h-10 mx-auto text-slate-600" />
            <div>
              <p className="text-sm font-semibold text-slate-300">No materials found</p>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery || selectedCategory !== "All" || statusFilter !== "All"
                  ? "Try resetting your search filters."
                  : "Click 'Add Material' to create your first item."}
              </p>
            </div>
            {searchQuery || selectedCategory !== "All" || statusFilter !== "All" ? (
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                  setStatusFilter("All");
                }}
                variant="outline"
                className="border-slate-800 text-xs text-slate-300"
              >
                Clear Filters
              </Button>
            ) : (
              <Link href="/dashboard/materials/new">
                <Button className="bg-amber-500 text-slate-950 text-xs font-bold">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Material
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold text-slate-400 bg-slate-950/50">
                  <th className="py-3.5 px-4">Item Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Brand</th>
                  <th className="py-3.5 px-4">Unit</th>
                  <th className="py-3.5 px-4 text-right">Default Price</th>
                  <th className="py-3.5 px-4">Supplier</th>
                  <th className="py-3.5 px-4 text-center">Active/Inactive</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredMaterials.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Item Name */}
                    <td className="py-4 px-4 font-semibold text-slate-100">
                      <Link
                        href={`/dashboard/materials/${item.id}`}
                        className="hover:text-amber-400 transition-colors block"
                      >
                        {item.item_name}
                      </Link>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {item.category}
                      </span>
                    </td>

                    {/* Brand */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-medium text-amber-400/90 bg-amber-500/5 border border-amber-500/10 px-2 py-0.5 rounded text-xs">
                        {item.brand || "—"}
                      </span>
                    </td>

                    {/* Unit */}
                    <td className="py-4 px-4 whitespace-nowrap text-slate-300 font-mono uppercase text-[11px]">
                      {item.unit}
                    </td>

                    {/* Default Price */}
                    <td className="py-4 px-4 text-right font-bold text-slate-100 whitespace-nowrap">
                      ₹{item.default_price.toLocaleString("en-IN")}
                    </td>

                    {/* Supplier */}
                    <td className="py-4 px-4 text-slate-300 whitespace-nowrap">
                      {item.supplier || "—"}
                    </td>

                    {/* Active/Inactive */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(item.id, item.is_active)}
                        disabled={isPending}
                        title="Click to toggle is_active"
                        className="focus:outline-none"
                      >
                        {item.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-colors">
                            <XCircle className="w-3 h-3" /> Inactive
                          </span>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link href={`/dashboard/materials/${item.id}`}>
                          <Button
                            variant="ghost"
                            size="xs"
                            className="text-slate-300 hover:text-amber-400 hover:bg-slate-800"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="sr-only sm:not-sr-only sm:ml-1 text-[11px]">View</span>
                          </Button>
                        </Link>
                        <Button
                          onClick={() => handleDelete(item.id, item.item_name)}
                          disabled={isPending}
                          variant="ghost"
                          size="xs"
                          className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
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
