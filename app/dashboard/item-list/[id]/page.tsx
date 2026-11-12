"use client";

import { useEffect, useState, useTransition, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Trash2,
  Building2,
  Layers,
  Calendar,
  FileSpreadsheet,
  AlertTriangle,
  RefreshCw,
  FileDown,
  Plus,
  ListPlus,
  Search,
  X,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getMaterialListByIdAction,
  deleteMaterialListAction,
  addMaterialListItemAction,
  addMaterialListItemsBatchAction,
  updateMaterialListItemQtyAction,
  deleteMaterialListItemAction,
  getMaterialsCatalogAction,
} from "../actions";
import { MaterialList, MaterialListItem, Material, MATERIAL_UNITS } from "@/lib/types/material";
import { generateMaterialListPdf } from "@/lib/utils/pdf-generator";

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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // 1. "Add from List" Modal State (Select materials from catalog)
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalog, setCatalog] = useState<Material[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCatFilter, setCatalogCatFilter] = useState<"all" | "Electrical" | "Plumbing">("all");
  const [catalogInListFilter, setCatalogInListFilter] = useState<"all" | "unselected">("unselected");
  const [catalogSelections, setCatalogSelections] = useState<Record<string, { qty: number; checked: boolean }>>({});
  const [isCatalogAdding, setIsCatalogAdding] = useState(false);
  const [catalogModalError, setCatalogModalError] = useState<string | null>(null);

  // 2. "Custom Item" Modal State
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCat, setCustomCat] = useState("Electrical");
  const [customBrand, setCustomBrand] = useState("");
  const [customUnit, setCustomUnit] = useState("No");
  const [customQty, setCustomQty] = useState(1);
  const [isCustomAdding, setIsCustomAdding] = useState(false);
  const [customModalError, setCustomModalError] = useState<string | null>(null);

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

  // Download PDF
  const handleDownloadPdf = () => {
    if (!list || items.length === 0) return;
    setIsGeneratingPdf(true);

    try {
      const clientName = list.client_name || list.project_name || null;
      generateMaterialListPdf({
        clientName,
        items,
      });
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF document.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (!list || items.length === 0) return;

    const headers = ["#", "Material Name", "Category", "Brand", "Unit", "Quantity"];
    const rows = items.map((it, idx) => [
      idx + 1,
      `"${it.name.replace(/"/g, '""')}"`,
      `"${(it.cat || "—").replace(/"/g, '""')}"`,
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

  // Open Catalog Modal & load data if needed
  const openCatalogModal = () => {
    setIsCatalogModalOpen(true);
    setCatalogModalError(null);
    setCatalogInListFilter("unselected"); // Default to Unselected Only on open
    if (catalog.length === 0) {
      setCatalogLoading(true);
      getMaterialsCatalogAction().then((data) => {
        setCatalog(data || []);
        setCatalogLoading(false);
      });
    }
  };

  // Toggle selection for catalog item
  const handleToggleCatalogCheck = (materialId: string) => {
    setCatalogSelections((prev) => {
      const current = prev[materialId] || { qty: 1, checked: false };
      return {
        ...prev,
        [materialId]: {
          qty: current.qty > 0 ? current.qty : 1,
          checked: !current.checked,
        },
      };
    });
  };

  // Adjust quantity in catalog modal
  const handleAdjustCatalogQty = (materialId: string, delta: number) => {
    setCatalogSelections((prev) => {
      const current = prev[materialId] || { qty: 1, checked: false };
      const nextQty = Math.max(1, (Number(current.qty) || 1) + delta);
      return {
        ...prev,
        [materialId]: {
          qty: nextQty,
          checked: true,
        },
      };
    });
  };

  // Change quantity directly in catalog modal
  const handleCatalogQtyChange = (materialId: string, newQty: number) => {
    const valid = Math.max(1, newQty);
    setCatalogSelections((prev) => ({
      ...prev,
      [materialId]: {
        qty: valid,
        checked: true,
      },
    }));
  };

  // Add selected catalog items to list
  const handleAddSelectedFromCatalog = async () => {
    const selected = catalog
      .filter((m) => catalogSelections[m.id]?.checked)
      .map((m) => ({
        material_id: m.id,
        name: m.name,
        cat: m.cat || null,
        brand: m.brand || null,
        unit: m.unit,
        qty: catalogSelections[m.id]?.qty || 1,
      }));

    if (selected.length === 0) {
      setCatalogModalError("Please select at least one material.");
      return;
    }

    setIsCatalogAdding(true);
    setCatalogModalError(null);

    const res = await addMaterialListItemsBatchAction(id, selected);
    setIsCatalogAdding(false);

    if (res.success && res.data) {
      setItems((prev) => [...prev, ...res.data!]);
      setCatalogSelections({});
      setIsCatalogModalOpen(false);
    } else {
      setCatalogModalError(res.error || "Failed to add items to list.");
    }
  };

  // Add Custom Item handler
  const handleAddCustomItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) {
      setCustomModalError("Material Name is required.");
      return;
    }

    setIsCustomAdding(true);
    setCustomModalError(null);

    const res = await addMaterialListItemAction(id, {
      name: customName.trim(),
      cat: customCat.trim() || null,
      brand: customBrand.trim() || null,
      unit: customUnit.trim() || "No",
      qty: Math.max(1, Number(customQty) || 1),
    });

    setIsCustomAdding(false);

    if (res.success && res.data) {
      setItems((prev) => [...prev, res.data!]);
      setCustomName("");
      setCustomBrand("");
      setCustomUnit("No");
      setCustomQty(1);
      setIsCustomModalOpen(false);
    } else {
      setCustomModalError(res.error || "Failed to add custom item.");
    }
  };

  // Remove Item handler
  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (!confirm(`Remove "${itemName}" from this material list?`)) return;

    setItems((prev) => prev.filter((it) => it.id !== itemId));
    await deleteMaterialListItemAction(itemId, id);
  };

  // Update Item Quantity directly handler
  const handleUpdateItemQty = async (itemId: string, newQty: number) => {
    const validQty = Math.max(1, newQty);
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, qty: validQty } : it))
    );
    await updateMaterialListItemQtyAction(itemId, validQty, id);
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
            onClick={openCatalogModal}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-1.5 shadow-sm active:scale-95 transition-all"
            title="Select materials from catalog"
          >
            <ListPlus className="w-3.5 h-3.5" />
            <span>Add from List</span>
          </Button>

          <Button
            size="xs"
            onClick={() => {
              setIsCustomModalOpen(true);
              setCustomModalError(null);
            }}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold gap-1.5 shadow-sm active:scale-95 transition-all"
            title="Add a custom off-catalog material"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Custom Item</span>
          </Button>

          <Button
            size="xs"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold gap-1.5 shadow-sm active:scale-95 transition-all"
            title="Download formatted PDF Requisition Document"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>{isGeneratingPdf ? "Generating PDF..." : "Download PDF"}</span>
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight pb-3 border-b border-slate-800">
            Material List
          </h1>

          <div className="pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm font-sans">
            <div className="text-base font-bold text-slate-100">
              {list.client_name || list.project_name || "—"}
            </div>
            <div className="text-sm font-bold text-amber-400">
              Pandali Electricals
            </div>
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openCatalogModal}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded font-bold text-xs shadow-sm transition-colors border border-emerald-600 cursor-pointer"
            >
              <ListPlus className="w-3.5 h-3.5" />
              <span>Add from List</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCustomModalOpen(true);
                setCustomModalError(null);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded font-bold text-xs shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Custom Item</span>
            </button>
          </div>
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
                <th className="py-2.5 px-3 border-r border-slate-700/80 font-bold w-36 text-center">
                  <div className="text-[10px] text-emerald-400 font-mono">B</div>
                  CATEGORY
                </th>
                <th className="py-2.5 px-3 border-r border-slate-700/80 font-bold w-48">
                  <div className="text-[10px] text-emerald-400 font-mono">C</div>
                  BRAND
                </th>
                <th className="py-2.5 px-3 border-r border-slate-700/80 font-bold w-28 text-center">
                  <div className="text-[10px] text-emerald-400 font-mono">D</div>
                  UNIT
                </th>
                <th className="py-2.5 px-3 border-r border-slate-700/80 font-bold w-28 text-center">
                  <div className="text-[10px] text-emerald-400 font-mono">E</div>
                  QUANTITY
                </th>
                <th className="py-2.5 px-2 font-bold w-14 text-center">
                  <div className="text-[10px] text-emerald-400 font-mono">F</div>
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    No items in this list yet. Click &quot;Add Item&quot; to add materials.
                  </td>
                </tr>
              ) : (
                items.map((it, idx) => {
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

                      {/* Category */}
                      <td className="py-3 px-3 text-center border-r border-slate-800 whitespace-nowrap">
                        {it.cat?.toLowerCase().includes("plumb") ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                            🚰 Plumbing
                          </span>
                        ) : it.cat?.toLowerCase().includes("elec") ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            ⚡ Electrical
                          </span>
                        ) : it.cat ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                            {it.cat}
                          </span>
                        ) : (
                          <span className="text-slate-600 font-mono text-[11px]">—</span>
                        )}
                      </td>

                      {/* Brand */}
                      <td className="py-3 px-3 font-mono text-slate-400 border-r border-slate-800">
                        {it.brand || "—"}
                      </td>

                      {/* Unit */}
                      <td className="py-3 px-3 text-center font-medium text-slate-400 border-r border-slate-800">
                        {it.unit}
                      </td>

                      {/* Quantity Stepper */}
                      <td className="py-2.5 px-3 text-center border-r border-slate-800">
                        <div className="inline-flex items-center border border-slate-800 rounded-lg overflow-hidden bg-slate-950 shadow-inner">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateItemQty(it.id, Math.max(1, (Number(it.qty) || 1) - 1))
                            }
                            className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-bold transition-colors select-none"
                            title="Decrease quantity"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={it.qty}
                            onChange={(e) =>
                              handleUpdateItemQty(it.id, Math.max(1, Number(e.target.value) || 1))
                            }
                            className="w-12 text-center bg-transparent py-1 text-xs font-mono font-bold text-amber-400 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateItemQty(it.id, (Number(it.qty) || 1) + 1)
                            }
                            className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-bold transition-colors select-none"
                            title="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Action / Delete */}
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(it.id, it.name)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
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

      {/* ==================================================== */}
      {/* 1. MODAL: ADD FROM LIST (CATALOG SELECTION)          */}
      {/* ==================================================== */}
      {isCatalogModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[82vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-400">
                  <ListPlus className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base">Select Materials from Catalog</h3>
                  <p className="text-[11px] text-slate-400">
                    Check items and specify quantity to add to this list.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCatalogModalOpen(false);
                  setCatalogModalError(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {catalogModalError && (
              <div className="mx-5 mt-2.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 shrink-0">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{catalogModalError}</span>
              </div>
            )}

            {/* Filter Controls: Search, Category Pills & Selection Mode */}
            <div className="px-5 py-2.5 border-b border-slate-800 space-y-2.5 shrink-0 bg-slate-950/50">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Search 500+ electrical & plumbing materials..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1 p-0.5 bg-slate-950 border border-slate-800 rounded-xl self-start sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setCatalogCatFilter("all")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      catalogCatFilter === "all"
                        ? "bg-slate-800 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogCatFilter("Electrical")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                      catalogCatFilter === "Electrical"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "text-amber-400/80 hover:text-amber-300"
                    }`}
                  >
                    <span>⚡ Electrical</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogCatFilter("Plumbing")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                      catalogCatFilter === "Plumbing"
                        ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                        : "text-sky-400/80 hover:text-sky-300"
                    }`}
                  >
                    <span>🚰 Plumbing</span>
                  </button>
                </div>
              </div>

              {/* View Mode: Unselected Only (Default) vs All Catalog */}
              <div className="flex items-center justify-between text-xs pt-0.5 border-t border-slate-800/60">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">Show:</span>
                  <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setCatalogInListFilter("unselected")}
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
                        catalogInListFilter === "unselected"
                          ? "bg-emerald-600 text-white shadow-sm font-bold"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span>Unselected Only (Default)</span>
                      <span className={`text-[10px] font-mono px-1 rounded ${
                        catalogInListFilter === "unselected" ? "bg-emerald-700/60 text-white" : "text-slate-400"
                      }`}>
                        {
                          catalog.filter(
                            (m) =>
                              !items.some(
                                (it) =>
                                  (it.material_id && it.material_id === m.id) ||
                                  it.name.trim().toLowerCase() === m.name.trim().toLowerCase()
                              )
                          ).length
                        }
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCatalogInListFilter("all")}
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                        catalogInListFilter === "all"
                          ? "bg-slate-800 text-white shadow-sm font-bold"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Whole Catalog ({catalog.length})
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
                  Already in list: <strong className="text-emerald-400">{items.length}</strong> items
                </div>
              </div>
            </div>

            {/* Catalog Items Table */}
            <div className="flex-1 min-h-0 overflow-y-auto bg-slate-950">
              {catalogLoading ? (
                <div className="py-20 text-center text-slate-400 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
                  Loading material catalogue...
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider select-none">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center border-r border-slate-800">ADD</th>
                      <th className="py-2.5 px-3 border-r border-slate-800">MATERIAL NAME</th>
                      <th className="py-2.5 px-3 w-28 text-center border-r border-slate-800">CATEGORY</th>
                      <th className="py-2.5 px-3 w-32 border-r border-slate-800">BRAND</th>
                      <th className="py-2.5 px-3 w-20 text-center border-r border-slate-800">UNIT</th>
                      <th className="py-2.5 px-3 w-36 text-center">QUANTITY</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {(() => {
                      const filteredCatalog = catalog.filter((m) => {
                        const existing = items.find(
                          (it) =>
                            (it.material_id && it.material_id === m.id) ||
                            it.name.trim().toLowerCase() === m.name.trim().toLowerCase()
                        );
                        if (catalogInListFilter === "unselected" && existing) return false;
                        if (catalogCatFilter === "Electrical" && !m.cat?.toLowerCase().includes("elec")) return false;
                        if (catalogCatFilter === "Plumbing" && !m.cat?.toLowerCase().includes("plumb")) return false;
                        if (!catalogSearch.trim()) return true;
                        const q = catalogSearch.toLowerCase();
                        return (
                          m.name.toLowerCase().includes(q) ||
                          (m.cat && m.cat.toLowerCase().includes(q)) ||
                          (m.brand && m.brand.toLowerCase().includes(q)) ||
                          m.unit.toLowerCase().includes(q)
                        );
                      });

                      if (filteredCatalog.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                              {catalogInListFilter === "unselected" ? (
                                <div>
                                  <p className="text-slate-400 font-medium mb-1">
                                    No unselected materials match your search.
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => setCatalogInListFilter("all")}
                                    className="text-emerald-400 underline hover:text-emerald-300 text-xs cursor-pointer"
                                  >
                                    Switch to Whole Catalog to view already added items
                                  </button>
                                </div>
                              ) : (
                                "No materials found matching your search."
                              )}
                            </td>
                          </tr>
                        );
                      }

                      return filteredCatalog.map((m) => {
                        const existing = items.find(
                          (it) =>
                            (it.material_id && it.material_id === m.id) ||
                            it.name.trim().toLowerCase() === m.name.trim().toLowerCase()
                        );
                        const isChecked = catalogSelections[m.id]?.checked || false;
                        const qty = catalogSelections[m.id]?.qty || 1;

                        return (
                          <tr
                            key={m.id}
                            className={`transition-colors ${
                              isChecked
                                ? "bg-emerald-500/10"
                                : existing
                                ? "bg-slate-900/40 hover:bg-slate-900/70"
                                : "hover:bg-slate-900/60"
                            }`}
                          >
                            <td className="py-2.5 px-3 text-center border-r border-slate-800">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleCatalogCheck(m.id)}
                                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                              />
                            </td>
                            <td
                              className="py-2.5 px-3 font-semibold text-slate-100 border-r border-slate-800 cursor-pointer"
                              onClick={() => handleToggleCatalogCheck(m.id)}
                            >
                              <div className="flex items-center flex-wrap gap-1.5">
                                <span className={isChecked ? "text-emerald-400 font-bold" : ""}>
                                  {m.name}
                                </span>
                                {existing && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                                    ✓ In List ({existing.qty} {existing.unit})
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center border-r border-slate-800 select-none">
                              {m.cat?.toLowerCase().includes("plumb") ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30 whitespace-nowrap">
                                  🚰 Plumbing
                                </span>
                              ) : m.cat?.toLowerCase().includes("elec") ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 whitespace-nowrap">
                                  ⚡ Electrical
                                </span>
                              ) : (
                                <span className="text-slate-600 font-mono text-[11px]">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-300 font-mono border-r border-slate-800">
                              {m.brand || "—"}
                            </td>
                            <td className="py-2.5 px-3 text-center border-r border-slate-800 text-slate-400">
                              {m.unit}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <div className="inline-flex items-center border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
                                <button
                                  type="button"
                                  onClick={() => handleAdjustCatalogQty(m.id, -1)}
                                  className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-bold"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={qty}
                                  onChange={(e) =>
                                    handleCatalogQtyChange(m.id, Number(e.target.value))
                                  }
                                  className="w-12 text-center bg-transparent py-1 text-xs font-mono font-bold text-slate-100 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAdjustCatalogQty(m.id, 1)}
                                  className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-bold"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-slate-900">
              <div className="text-xs font-mono text-slate-300">
                Selected:{" "}
                <strong className="text-emerald-400 font-bold">
                  {Object.values(catalogSelections).filter((s) => s.checked).length}
                </strong>{" "}
                materials
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCatalogModalOpen(false)}
                  className="border-slate-800 text-slate-400 text-xs hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleAddSelectedFromCatalog}
                  disabled={
                    isCatalogAdding ||
                    Object.values(catalogSelections).filter((s) => s.checked).length === 0
                  }
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>
                    {isCatalogAdding
                      ? "Adding Items..."
                      : `Add Selected Items (${
                          Object.values(catalogSelections).filter((s) => s.checked).length
                        }) to List`}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. MODAL: ADD CUSTOM ITEM                            */}
      {/* ==================================================== */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                  <Plus className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-white text-base">Add Material Item</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCustomModalOpen(false);
                  setCustomModalError(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {customModalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{customModalError}</span>
              </div>
            )}

            <form onSubmit={handleAddCustomItem} className="space-y-4">
              {/* Material Name */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Material Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. 2.5 sq mm Copper Wire or 1/2 inch PVC Tee"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  autoFocus
                  required
                />
              </div>

              {/* Category & Brand */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                    Category
                  </label>
                  <select
                    value={customCat}
                    onChange={(e) => setCustomCat(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Electrical">⚡ Electrical</option>
                    <option value="Plumbing">🚰 Plumbing</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                    Brand (Optional)
                  </label>
                  <input
                    type="text"
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    placeholder="e.g. Polycab, Supreme"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Unit & Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                    Unit
                  </label>
                  <select
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {MATERIAL_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                    Quantity <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={customQty}
                    onChange={(e) => setCustomQty(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono font-bold focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="border-slate-800 text-slate-400 text-xs hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCustomAdding}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isCustomAdding ? "Adding..." : "Add to Material List"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
