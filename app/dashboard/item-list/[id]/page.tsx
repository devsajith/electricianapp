"use client";

import { useEffect, useState, useTransition, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Share2,
  Download,
  Trash2,
  Building2,
  Layers,
  Calendar,
  FileSpreadsheet,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getMaterialListByIdAction,
  deleteMaterialListAction,
} from "../actions";
import { MaterialList, MaterialListItem } from "@/lib/types/material";

export default function MaterialListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [list, setList] = useState<MaterialList | null>(null);
  const [items, setItems] = useState<MaterialListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;
    getMaterialListByIdAction(id)
      .then((res) => {
        if (!isMounted) return;
        if (res) {
          setList(res.list);
          setItems(res.items);
        } else {
          setErrorMsg("Material list not found.");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Error loading list:", err);
        setErrorMsg("Failed to load material list.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Delete list
  const handleDeleteList = () => {
    if (!list) return;
    if (!confirm(`Are you sure you want to delete material list "${list.title}"?`)) return;

    startTransition(async () => {
      const res = await deleteMaterialListAction(id);
      if (res.success) {
        router.push("/dashboard/item-list");
      } else {
        setErrorMsg(res.error || "Failed to delete list.");
      }
    });
  };

  // WhatsApp Share Formatter
  const handleWhatsAppShare = () => {
    if (!list || items.length === 0) return;

    const destination = list.project_name
      ? `${list.project_name} (${list.project_number})`
      : "General / Shop Stock";
    const dateStr = list.created_at ? new Date(list.created_at).toLocaleDateString() : "";

    const lines = [
      `📋 *MATERIAL LIST: ${list.title}*`,
      `🏢 Destination: ${destination}`,
      dateStr ? `📅 Date: ${dateStr}` : "",
      list.notes ? `📝 Note: ${list.notes}` : "",
      `----------------------------------`,
      ...items.map(
        (it, idx) =>
          `${idx + 1}. *${it.name}*${it.brand ? ` (${it.brand})` : ""} — *${it.qty} ${it.unit}*`
      ),
      `----------------------------------`,
      `Total Items: ${items.length}`,
    ].filter(Boolean);

    const fullText = lines.join("\n");
    const encoded = encodeURIComponent(fullText);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  // Export CSV
  const handleExportCsv = () => {
    if (!list || items.length === 0) return;

    const headers = ["#", "Material Name", "Brand", "Unit", "Quantity"];
    const rows = items.map((it, idx) => [
      idx + 1,
      `"${it.name.replace(/"/g, '""')}"`,
      `"${(it.brand || "—").replace(/"/g, '""')}"`,
      `"${it.unit}"`,
      it.qty,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        `"List Title: ${list.title}"`,
        `"Destination: ${list.project_name || "General / Shop Stock"}"`,
        headers.join(","),
        ...rows.map((r) => r.join(",")),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${list.title.replace(/[^a-zA-Z0-9]/g, "_")}_Materials.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 text-xs">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
        Loading material list...
      </div>
    );
  }

  if (!list) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 text-center py-12">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Material List Not Found</h2>
        <p className="text-xs text-slate-400">
          The requested material list does not exist or may have been deleted.
        </p>
        <Link href="/dashboard/item-list">
          <Button variant="outline" className="border-slate-800 text-xs text-slate-300">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Return to Material Lists
          </Button>
        </Link>
      </div>
    );
  }

  const isProject = Boolean(list.project_id);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Link href="/dashboard/item-list">
          <Button
            variant="outline"
            size="xs"
            className="border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Material Lists
          </Button>
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="xs"
            onClick={handleWhatsAppShare}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-1.5 shadow-sm"
            title="Send list directly to hardware shop on WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share WhatsApp</span>
          </Button>

          <Button
            size="xs"
            variant="outline"
            onClick={handleExportCsv}
            className="border-slate-700 bg-slate-800 text-slate-200 hover:text-white gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel (.CSV)</span>
          </Button>

          <Button
            size="xs"
            variant="outline"
            onClick={handleDeleteList}
            className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-center gap-2 text-rose-400 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Header Info Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {isProject ? (
                <Link
                  href={`/dashboard/projects/${list.project_id}`}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 transition-colors"
                >
                  <Building2 className="w-3 h-3" />
                  <span>{list.project_number} • {list.project_name}</span>
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  <Layers className="w-3 h-3" />
                  <span>General / Shop Stock</span>
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {list.title}
            </h1>

            {list.notes && (
              <p className="text-xs text-slate-300 bg-slate-950/60 border border-slate-800 rounded-xl p-3 mt-2.5 max-w-xl">
                📝 {list.notes}
              </p>
            )}
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 text-xs">
            <span className="text-slate-400 flex items-center gap-1 font-mono text-[11px]">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              {list.created_at ? new Date(list.created_at).toLocaleDateString() : ""}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              {items.length} items
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* SHOPPING / PROCUREMENT TABLE                         */}
      {/* ==================================================== */}
      <div className="rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950">
        <div className="bg-[#107c41] px-4 py-2 flex items-center justify-between text-white border-b border-emerald-800 text-xs">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span className="font-bold tracking-wide">
              {list.title.replace(/\s+/g, "_")}.xlsx - Materials List
            </span>
          </div>
          <span className="text-[11px] text-emerald-100 hidden sm:inline">
            Materials and required quantities
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px] font-sans">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-700 text-slate-300 text-[11px] font-mono select-none">
                <th className="w-12 py-2.5 px-3 text-center border-r border-slate-700/80 bg-slate-900 text-slate-500 font-bold text-[10px]">
                  #
                </th>
                <th className="py-2.5 px-3 border-r border-slate-700/80 font-bold">
                  <div className="text-[10px] text-emerald-400 font-mono">A</div>
                  MATERIAL NAME
                </th>
                <th className="py-2.5 px-3 border-r border-slate-700/80 font-bold w-48">
                  <div className="text-[10px] text-emerald-400 font-mono">B</div>
                  BRAND
                </th>
                <th className="py-2.5 px-3 border-r border-slate-700/80 font-bold w-28 text-center">
                  <div className="text-[10px] text-emerald-400 font-mono">C</div>
                  UNIT
                </th>
                <th className="py-2.5 px-3 font-bold w-36 text-center">
                  <div className="text-[10px] text-emerald-400 font-mono">D</div>
                  QUANTITY
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {items.map((it, idx) => {
                return (
                  <tr
                    key={it.id}
                    className="hover:bg-slate-900/60 transition-colors text-slate-100 border-b border-slate-800/80"
                  >
                    {/* Index cell */}
                    <td className="py-3 px-3 text-center border-r border-slate-800 text-slate-500 font-mono text-[11px] select-none">
                      {idx + 1}
                    </td>

                    {/* Material Name */}
                    <td className="py-3 px-3 font-bold border-r border-slate-800 text-white">
                      {it.name}
                    </td>

                    {/* Brand */}
                    <td className="py-3 px-3 font-mono text-slate-400 border-r border-slate-800">
                      {it.brand || "—"}
                    </td>

                    {/* Unit */}
                    <td className="py-3 px-3 text-center font-medium text-slate-400 border-r border-slate-800">
                      {it.unit}
                    </td>

                    {/* Quantity */}
                    <td className="py-3 px-3 text-center font-mono text-sm text-slate-100">
                      {it.qty}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-slate-900 px-4 py-2.5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono select-none">
          <div className="text-[11px] text-slate-400">
            TOTAL ITEMS: <strong className="text-slate-200">{items.length}</strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">
              Only item name, brand, unit, and required quantity.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
