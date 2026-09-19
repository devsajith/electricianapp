"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Package, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MATERIAL_CATEGORIES,
  MATERIAL_UNITS,
  MaterialCategory,
  MaterialUnit,
} from "@/lib/types/material";
import { createMaterialAction } from "../actions";

export default function NewMaterialPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form states matching Supabase material_catalogue schema exact fields
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState<string>(MATERIAL_CATEGORIES[0]);
  const [brand, setBrand] = useState("");
  const [unit, setUnit] = useState<string>(MATERIAL_UNITS[0]);
  const [defaultPrice, setDefaultPrice] = useState<string>("");
  const [supplier, setSupplier] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!itemName.trim()) {
      setError("Item Name is required.");
      return;
    }

    if (!category.trim()) {
      setError("Category is required.");
      return;
    }

    if (!unit.trim()) {
      setError("Unit is required.");
      return;
    }

    const priceNum = defaultPrice.trim() ? parseFloat(defaultPrice) : 0;
    if (isNaN(priceNum) || priceNum < 0) {
      setError("Please enter a valid Default Price.");
      return;
    }

    startTransition(async () => {
      const result = await createMaterialAction({
        item_name: itemName.trim(),
        category: category.trim(),
        brand: brand.trim() || null,
        unit: unit.trim(),
        default_price: priceNum,
        supplier: supplier.trim() || null,
        notes: notes.trim() || null,
        is_active: isActive,
      });

      if (result.error) {
        setError(result.error);
      } else {
        router.push("/dashboard/materials");
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/materials">
          <Button
            variant="outline"
            size="xs"
            className="border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Material List
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Add Material
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Add new item to your <code className="text-amber-400 font-mono">material_catalogue</code> database table.
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-center gap-3 text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Add Material Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="border-b border-slate-800/80 pb-4">
            <h2 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
              <Package className="w-4 h-4" /> Material Details
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Item Name * */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Item Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. 2.5 sq mm Copper Armoured Wire"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            {/* 2. Category * */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Category <span className="text-rose-400">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MaterialCategory)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                required
              >
                {MATERIAL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Brand */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Brand
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Polycab, Havells, Schneider, Philips"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* 4. Unit * */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Unit <span className="text-rose-400">*</span>
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as MaterialUnit)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                required
              >
                {MATERIAL_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Default Price */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Default Price (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={defaultPrice}
                  onChange={(e) => setDefaultPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3.5 py-2.5 text-xs text-white font-semibold placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* 6. Supplier */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Supplier
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="e.g. Polycab Wires Ltd, Havells India"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* 7. Notes */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Technical specifications, description, or notes..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* 8. Active (is_active boolean) */}
            <div className="md:col-span-2 pt-2 border-t border-slate-800">
              <label className="inline-flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-200">
                    Active Item (is_active)
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Saves <code className="text-amber-400 font-mono">is_active = true</code> in the Supabase database.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Submit / Save Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/dashboard/materials">
            <Button
              type="button"
              variant="outline"
              className="border-slate-800 text-slate-300 hover:bg-slate-800 text-xs"
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-2 shadow-md"
          >
            <Save className="w-4 h-4" />
            <span>{isPending ? "Saving to Supabase..." : "Save Material"}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
