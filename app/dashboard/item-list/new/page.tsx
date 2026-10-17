"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Building2,
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  ListChecks,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createMaterialListAction,
  getMaterialsCatalogAction,
  getProjectsForListAction,
} from "../actions";
import {
  Material,
  CreateMaterialListItemDTO,
  MATERIAL_UNITS,
  initialSampleMaterials,
} from "@/lib/types/material";

function NewItemListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultProjectId = searchParams.get("projectId") || "";

  const [isProject, setIsProject] = useState(Boolean(defaultProjectId));
  const [selectedProjectId, setSelectedProjectId] = useState(defaultProjectId);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  const [projects, setProjects] = useState<
    { id: string; project_number: string; name: string; place?: string | null }[]
  >([]);
  const [catalog, setCatalog] = useState<Material[]>([]);

  // Search & view filter for the material selection table
  const [searchTerm, setSearchTerm] = useState("");
  const [viewFilter, setViewFilter] = useState<"all" | "selected">("all");

  // Selection state map: materialId -> { qty: number, checked: boolean }
  const [selections, setSelections] = useState<Record<string, { qty: number; checked: boolean }>>({});

  // Custom off-catalog items
  const [customItems, setCustomItems] = useState<CreateMaterialListItemDTO[]>([]);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customBrand, setCustomBrand] = useState("");
  const [customUnit, setCustomUnit] = useState("No");
  const [customQty, setCustomQty] = useState<number>(1);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getProjectsForListAction().then((res) => {
      setProjects(res);
      if (defaultProjectId) {
        setIsProject(true);
        setSelectedProjectId(defaultProjectId);
        const match = res.find((p) => p.id === defaultProjectId);
        if (match) {
          setTitle(`Material List - ${match.name}`);
        }
      }
    });

    getMaterialsCatalogAction().then((res) => {
      const materialsList = res && res.length > 0 ? res : initialSampleMaterials;
      setCatalog(materialsList);

      // Initialize default selections
      const initialMap: Record<string, { qty: number; checked: boolean }> = {};
      materialsList.forEach((m) => {
        initialMap[m.id] = { qty: 1, checked: false };
      });
      setSelections(initialMap);
    });
  }, [defaultProjectId]);

  // Handle project change
  const handleProjectSelect = (projId: string) => {
    setSelectedProjectId(projId);
    if (!title || title.startsWith("Material List")) {
      const match = projects.find((p) => p.id === projId);
      if (match) {
        setTitle(`Material List - ${match.name}`);
      }
    }
  };

  // Toggle checkbox for a catalog material
  const handleToggleCheck = (materialId: string) => {
    setSelections((prev) => {
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

  // Change quantity for a catalog material (automatically checks it if qty > 0)
  const handleQtyChange = (materialId: string, newQty: number) => {
    const validQty = Math.max(1, newQty);
    setSelections((prev) => ({
      ...prev,
      [materialId]: {
        qty: validQty,
        checked: true, // Auto check when quantity is entered/modified
      },
    }));
  };

  // Quick increment / decrement
  const handleAdjustQty = (materialId: string, delta: number) => {
    setSelections((prev) => {
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

  // Add custom item
  const handleAddCustomItem = () => {
    if (!customName.trim()) {
      setErrorMsg("Please enter the material name.");
      return;
    }

    setCustomItems((prev) => [
      ...prev,
      {
        material_id: null,
        name: customName.trim(),
        brand: customBrand.trim() || null,
        unit: customUnit.trim() || "No",
        qty: Math.max(1, Number(customQty) || 1),
      },
    ]);

    setCustomName("");
    setCustomBrand("");
    setCustomQty(1);
    setIsCustomModalOpen(false);
  };

  const handleRemoveCustomItem = (idx: number) => {
    setCustomItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Count total selected items
  const selectedCatalogItemsCount = Object.values(selections).filter((s) => s.checked).length;
  const totalSelectedCount = selectedCatalogItemsCount + customItems.length;

  // Filtered materials
  const filteredMaterials = catalog.filter((m) => {
    const isChecked = selections[m.id]?.checked || false;
    if (viewFilter === "selected" && !isChecked) return false;

    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      (m.brand && m.brand.toLowerCase().includes(q)) ||
      m.unit.toLowerCase().includes(q)
    );
  });

  // Submit list
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setErrorMsg("Please enter a title for the material list.");
      return;
    }

    if (isProject && !selectedProjectId) {
      setErrorMsg("Please select a project for this list, or switch to 'General / Non-Project'.");
      return;
    }

    // Assemble all selected items
    const selectedCatalogItems: CreateMaterialListItemDTO[] = catalog
      .filter((m) => selections[m.id]?.checked)
      .map((m) => ({
        material_id: m.id,
        name: m.name,
        brand: m.brand || null,
        unit: m.unit,
        qty: selections[m.id]?.qty || 1,
      }));

    const finalItems = [...selectedCatalogItems, ...customItems];

    if (finalItems.length === 0) {
      setErrorMsg("Please check at least one material to add to the list.");
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      const res = await createMaterialListAction({
        project_id: isProject ? selectedProjectId : null,
        title: title.trim(),
        notes: notes.trim() || null,
        items: finalItems,
      });

      if (res.error) {
        setErrorMsg(res.error);
      } else if (res.data?.id) {
        router.push(`/dashboard/item-list/${res.data.id}`);
      } else {
        router.push("/dashboard/item-list");
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
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
      </div>

      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-center gap-2 text-rose-400 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Setup */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
            <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ListChecks className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white">Create Material List</h2>
              <p className="text-xs text-slate-400">
                Check materials from the list below and enter quantity needed.
              </p>
            </div>
          </div>

          {/* Classification Toggle */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              List Destination
            </label>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => setIsProject(true)}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                  isProject
                    ? "bg-blue-600/20 border-blue-500 text-blue-400 shadow-sm"
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Project List</span>
              </button>
              <button
                type="button"
                onClick={() => setIsProject(false)}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                  !isProject
                    ? "bg-indigo-600/20 border-indigo-500 text-indigo-400 shadow-sm"
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>General / Non-Project</span>
              </button>
            </div>
          </div>

          {/* Project Selector (if Project List) */}
          {isProject && (
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                Select Client Project <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => handleProjectSelect(e.target.value)}
                className="w-full sm:w-96 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer"
                required={isProject}
              >
                <option value="">-- Choose Project --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                    {p.project_number} - {p.name} {p.place ? `(${p.place})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                List Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Ground Floor Conduit Piping"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                Notes for Store / Workers (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Deliver by Thursday morning"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* MATERIAL SELECTION LIST (CHECKBOX + QUANTITY)       */}
        {/* ==================================================== */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-amber-400" />
                Select Materials &amp; Set Quantity
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Tick the checkbox next to any material and specify the quantity needed.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() => setIsCustomModalOpen(true)}
                className="border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-amber-400 text-xs gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Custom Material</span>
              </Button>
            </div>
          </div>

          {/* Search Bar & Filter Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search materials (e.g. wire, pipe, switch, mcb)..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewFilter === "all"
                    ? "bg-slate-800 text-white font-bold"
                    : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                All Materials ({catalog.length})
              </button>
              <button
                type="button"
                onClick={() => setViewFilter("selected")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  viewFilter === "selected"
                    ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                    : "bg-slate-950 text-amber-400 hover:text-amber-300 border border-slate-800"
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Selected ({totalSelectedCount})</span>
              </button>
            </div>
          </div>

          {/* Custom Items Banner (if any added) */}
          {customItems.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                Custom Added Materials ({customItems.length})
              </span>
              <div className="border border-amber-500/30 rounded-xl overflow-hidden bg-slate-950/70">
                <table className="w-full text-left border-collapse text-xs">
                  <tbody className="divide-y divide-slate-800/80">
                    {customItems.map((ci, idx) => (
                      <tr key={idx} className="bg-amber-500/5">
                        <td className="py-2.5 px-3 w-10 text-center text-amber-400 font-bold">
                          ✓
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-100">
                          {ci.name}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 font-mono w-32">
                          {ci.brand || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-400 w-28">
                          {ci.unit}
                        </td>
                        <td className="py-2.5 px-3 text-center w-36 font-bold text-amber-400 font-mono">
                          {ci.qty}
                        </td>
                        <td className="py-2.5 px-2 text-center w-12">
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomItem(idx)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Material Selection Table */}
          <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
            <div className="max-h-[460px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center border-r border-slate-800 select-none">
                      ADD
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-800">MATERIAL NAME</th>
                    <th className="py-2.5 px-3 w-36 border-r border-slate-800">BRAND</th>
                    <th className="py-2.5 px-3 w-28 text-center border-r border-slate-800">UNIT</th>
                    <th className="py-2.5 px-3 w-44 text-center">QUANTITY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-500 text-xs">
                        No materials matching &quot;{searchTerm}&quot;
                      </td>
                    </tr>
                  ) : (
                    filteredMaterials.map((m) => {
                      const isChecked = selections[m.id]?.checked || false;
                      const qty = selections[m.id]?.qty || 1;

                      return (
                        <tr
                          key={m.id}
                          className={`transition-colors ${
                            isChecked
                              ? "bg-amber-500/10"
                              : "hover:bg-slate-900/50"
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-2.5 px-3 text-center border-r border-slate-800">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleCheck(m.id)}
                              className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 cursor-pointer"
                            />
                          </td>

                          {/* Material Name */}
                          <td
                            className="py-2.5 px-3 font-semibold text-slate-100 border-r border-slate-800 cursor-pointer"
                            onClick={() => handleToggleCheck(m.id)}
                          >
                            <span className={isChecked ? "text-amber-400 font-bold" : ""}>
                              {m.name}
                            </span>
                          </td>

                          {/* Brand */}
                          <td className="py-2.5 px-3 text-slate-300 font-mono border-r border-slate-800">
                            {m.brand || "—"}
                          </td>

                          {/* Unit */}
                          <td className="py-2.5 px-3 text-center border-r border-slate-800">
                            <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[11px] border border-slate-800">
                              {m.unit}
                            </span>
                          </td>

                          {/* Quantity with +/- and Direct Input */}
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleAdjustQty(m.id, -1)}
                                className="w-6 h-6 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold flex items-center justify-center text-xs transition-colors"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                step="any"
                                value={qty}
                                onChange={(e) => handleQtyChange(m.id, Number(e.target.value))}
                                className={`w-16 px-2 py-1 rounded text-center text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                                  isChecked
                                    ? "bg-slate-900 border-2 border-amber-500 text-amber-400"
                                    : "bg-slate-900 border border-slate-700 text-slate-300"
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => handleAdjustQty(m.id, 1)}
                                className="w-6 h-6 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold flex items-center justify-center text-xs transition-colors"
                              >
                                +
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Floating / Sticky Bottom Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <div>
              <span className="text-xs font-bold text-white block">
                Total Selected: {totalSelectedCount} {totalSelectedCount === 1 ? "material" : "materials"}
              </span>
              <span className="text-[11px] text-slate-400">
                {totalSelectedCount > 0 ? "Ready to save material list" : "Tick materials in table to include"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Link href="/dashboard/item-list">
              <Button type="button" variant="outline" className="border-slate-800 text-slate-400 hover:text-white">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isPending || totalSelectedCount === 0}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 px-6 shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isPending ? "Saving Material List..." : `Save Material List (${totalSelectedCount})`}</span>
            </Button>
          </div>
        </div>
      </form>

      {/* Modal: Add Custom Off-Catalog Item */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">Add Custom Material</h3>
              <button
                type="button"
                onClick={() => setIsCustomModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Material Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. 3-Way Heavy PVC Junction Box"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Brand (Optional)
                  </label>
                  <input
                    type="text"
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    placeholder="e.g. Precision"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Unit
                  </label>
                  <select
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  >
                    {MATERIAL_UNITS.map((u) => (
                      <option key={u} value={u} className="bg-slate-900 text-slate-100">
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={customQty}
                  onChange={(e) => setCustomQty(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-amber-500/40 rounded-lg text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCustomModalOpen(false)}
                className="border-slate-800 text-slate-400 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleAddCustomItem}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Add to List
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewItemListPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 text-xs">Loading form...</div>}>
      <NewItemListContent />
    </Suspense>
  );
}
