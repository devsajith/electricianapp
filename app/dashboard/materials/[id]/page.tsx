"use client";

import { useEffect, useState, useTransition, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Material } from "@/lib/types/material";
import {
  getMaterialByIdAction,
  toggleMaterialStatusAction,
  deleteMaterialAction,
} from "../actions";

export default function MaterialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const loadMaterial = async () => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 2500);

    try {
      const data = await getMaterialByIdAction(id);
      clearTimeout(timer);
      if (data) {
        setMaterial(data);
      } else {
        setErrorMsg("Material item not found.");
      }
    } catch (err) {
      console.error("Error loading material detail:", err);
      clearTimeout(timer);
      setErrorMsg("Failed to load material details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterial();
  }, [id]);

  const handleToggleStatus = () => {
    if (!material) return;
    const nextIsActive = !material.is_active;
    startTransition(async () => {
      const res = await toggleMaterialStatusAction(id, nextIsActive);
      if (res.success) {
        setMaterial((prev) => (prev ? { ...prev, is_active: nextIsActive } : null));
        setSuccessMsg(`Status updated to ${nextIsActive ? "Active" : "Inactive"}.`);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.error || "Failed to toggle status.");
      }
    });
  };

  const handleDelete = () => {
    if (!material) return;
    if (!confirm(`Are you sure you want to delete material "${material.item_name}"?`)) return;

    startTransition(async () => {
      const res = await deleteMaterialAction(id);
      if (res.success) {
        router.push("/dashboard/materials");
      } else {
        setErrorMsg(res.error || "Failed to delete material.");
      }
    });
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Loading material details...
      </div>
    );
  }

  if (!material) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 text-center py-12">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Material Not Found</h2>
        <p className="text-xs text-slate-400">
          The material item you requested does not exist or may have been removed.
        </p>
        <Link href="/dashboard/materials">
          <Button variant="outline" className="border-slate-800 text-xs text-slate-300">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Return to Catalogue
          </Button>
        </Link>
      </div>
    );
  }

  const defaultPrice = Number(material.default_price || 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
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
        <div className="flex items-center gap-2">
          <Button
            onClick={handleToggleStatus}
            disabled={isPending}
            variant="outline"
            size="xs"
            className={
              material.is_active
                ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                : "border-slate-700 text-slate-400 hover:bg-slate-800"
            }
          >
            {material.is_active ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5 mr-1" /> Inactive
              </>
            )}
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isPending}
            variant="outline"
            size="xs"
            className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/50"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {/* Success / Error Messages */}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-2 text-emerald-400 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-center gap-2 text-rose-400 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Header Info Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded">
                Category: {material.category}
              </span>
              {material.brand && (
                <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded">
                  Brand: {material.brand}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{material.item_name}</h1>
          </div>

          <div className="text-left md:text-right">
            <p className="text-xs text-slate-400">Default Price</p>
            <p className="text-2xl font-bold text-emerald-400 mt-0.5">
              ₹{defaultPrice.toLocaleString("en-IN")}{" "}
              <span className="text-xs font-normal text-slate-400">/ {material.unit}</span>
            </p>
          </div>
        </div>

        {/* Key Attributes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block">Status (is_active)</span>
            <span className={`text-sm font-bold mt-1 block ${material.is_active ? "text-emerald-400" : "text-slate-400"}`}>
              {material.is_active ? "Active (true)" : "Inactive (false)"}
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block">Unit</span>
            <span className="text-sm font-bold text-slate-200 mt-1 block uppercase font-mono">
              {material.unit}
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block">Supplier</span>
            <span className="text-sm font-semibold text-slate-200 mt-1 block truncate">
              {material.supplier || "—"}
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block">Brand</span>
            <span className="text-sm font-semibold text-amber-400 mt-1 block truncate">
              {material.brand || "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Specification & Notes Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <FileText className="w-4 h-4 text-amber-400" />
          Notes & Technical Specifications
        </h2>

        <div className="space-y-3 text-xs">
          <p className="text-slate-300 leading-relaxed bg-slate-950 border border-slate-800 rounded-lg p-4 font-normal">
            {material.notes || "No notes provided for this item."}
          </p>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Created at: {material.created_at ? new Date(material.created_at).toLocaleString() : "N/A"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
