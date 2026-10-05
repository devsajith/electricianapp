"use client";

import { useEffect, useState, useTransition, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertTriangle,
  Trash2,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Material } from "@/lib/types/material";
import {
  getMaterialByIdAction,
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;
    getMaterialByIdAction(id)
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          setMaterial(data);
        } else {
          setErrorMsg("Material item not found.");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading material detail:", err);
        if (isMounted) {
          setErrorMsg("Failed to load material details.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleDelete = () => {
    if (!material) return;
    if (!confirm(`Are you sure you want to delete material "${material.name}"?`)) return;

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
        <Link href="/dashboard/materials">
          <Button variant="outline" className="border-slate-800 text-xs text-slate-300">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Return to Catalogue
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/materials">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Material List
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleDelete}
            disabled={isPending}
            variant="outline"
            size="sm"
            className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-center gap-2 text-rose-400 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Package className="w-4 h-4 text-slate-500" />
              {material.brand && (
                <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded">
                  Brand: {material.brand}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{material.name}</h1>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block">Unit</span>
            <span className="text-sm font-bold text-slate-200 mt-1 block uppercase font-mono">
              {material.unit}
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
    </div>
  );
}
