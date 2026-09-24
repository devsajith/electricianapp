"use client";

import { useEffect, useState, useTransition, Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  Save,
  Printer,
  Package,
  FolderKanban,
  Search,
  Check,
  X,
  Layers,
  Building2,
  ListChecks,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EstimateItem } from "@/lib/types/estimate";
import { Material, MATERIAL_CATEGORIES } from "@/lib/types/material";
import { getProjectsAction, ProjectRecord } from "../../projects/actions";
import {
  getProjectItemListAction,
  saveProjectItemListAction,
  getCatalogueMaterialsAction,
} from "../actions";

interface SelectedItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  category?: string;
}

const COMMON_UNITS = ["nos", "meter", "roll", "coil", "box", "set", "pkt", "bundle", "kg"];

function CreateItemListComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProjectId = searchParams.get("projectId") || "";

  // Data states
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(preselectedProjectId);
  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(null);

  // Selected items list for the project: Map of normalized description -> SelectedItem
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [notes, setNotes] = useState<string>("");

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Custom Item Drawer / Form
  const [customName, setCustomName] = useState<string>("");
  const [customQty, setCustomQty] = useState<number>(1);
  const [customUnit, setCustomUnit] = useState<string>("nos");
  const [isAddingCustom, setIsAddingCustom] = useState<boolean>(false);

  // Status states
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"catalog" | "selected">("catalog");
  const [, startTransition] = useTransition();

  // Load initial data
  useEffect(() => {
    let isMounted = true;
    setMounted(true);

    Promise.all([getProjectsAction(), getCatalogueMaterialsAction()])
      .then(([projList, mats]) => {
        if (!isMounted) return;
        setProjects(projList || []);
        setMaterials(mats || []);

        const initId = preselectedProjectId || (projList && projList.length > 0 ? projList[0].id : "");
        if (initId) {
          setSelectedProjectId(initId);
          const found = projList?.find((p) => p.id === initId);
          if (found) setSelectedProject(found);
          loadProjectItems(initId);
        }
        setLoading(false);
      })
      .catch((e) => {
        console.error("Error loading initial data:", e);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [preselectedProjectId]);

  // Load project items if previously created
  const loadProjectItems = async (projId: string) => {
    try {
      const res = await getProjectItemListAction(projId);
      if (res.data && res.data.items && res.data.items.length > 0) {
        setSelectedItems(
          res.data.items.map((it, i) => ({
            id: it.id || `item-${i}`,
            description: it.description,
            quantity: Number(it.quantity ?? it.qty) || 1,
            unit: it.unit || "nos",
          }))
        );
        if (res.data.notes) setNotes(res.data.notes);
      } else {
        setSelectedItems([]);
      }
    } catch (e) {
      console.warn("Notice loading project items:", e);
    }
  };

  const handleProjectSelect = (projId: string) => {
    setSelectedProjectId(projId);
    const found = projects.find((p) => p.id === projId);
    setSelectedProject(found || null);
    if (projId) {
      loadProjectItems(projId);
    } else {
      setSelectedItems([]);
    }
  };

  // Quick lookup for selected item by description
  const selectedMap = useMemo(() => {
    const map = new Map<string, SelectedItem>();
    selectedItems.forEach((it) => {
      map.set(it.description.toLowerCase().trim(), it);
    });
    return map;
  }, [selectedItems]);

  // Add material or increment quantity
  const handleAddOrIncrement = (mat: Material) => {
    const key = mat.item_name.toLowerCase().trim();
    const existing = selectedMap.get(key);

    if (existing) {
      // Increment quantity
      setSelectedItems((prev) =>
        prev.map((it) =>
          it.description.toLowerCase().trim() === key
            ? { ...it, quantity: it.quantity + 1 }
            : it
        )
      );
    } else {
      // Add new
      const newItem: SelectedItem = {
        id: `sel-${mat.id}-${Date.now()}`,
        description: mat.item_name,
        quantity: 1,
        unit: mat.unit || "nos",
        category: mat.category,
      };
      setSelectedItems((prev) => [...prev, newItem]);
    }
  };

  // Decrement quantity or remove if reaching 0
  const handleDecrement = (matName: string) => {
    const key = matName.toLowerCase().trim();
    setSelectedItems((prev) =>
      prev
        .map((it) => {
          if (it.description.toLowerCase().trim() === key) {
            return { ...it, quantity: it.quantity - 1 };
          }
          return it;
        })
        .filter((it) => it.quantity > 0)
    );
  };

  // Direct quantity input change
  const handleQuantityChange = (description: string, newQty: number) => {
    const val = isNaN(newQty) ? 0 : Math.max(0, newQty);
    const key = description.toLowerCase().trim();

    if (val === 0) {
      setSelectedItems((prev) =>
        prev.filter((it) => it.description.toLowerCase().trim() !== key)
      );
    } else {
      setSelectedItems((prev) =>
        prev.map((it) =>
          it.description.toLowerCase().trim() === key
            ? { ...it, quantity: val }
            : it
        )
      );
    }
  };

  // Remove item completely
  const handleRemoveItem = (description: string) => {
    const key = description.toLowerCase().trim();
    setSelectedItems((prev) =>
      prev.filter((it) => it.description.toLowerCase().trim() !== key)
    );
  };

  // Add custom item
  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const key = customName.toLowerCase().trim();
    const existing = selectedMap.get(key);

    if (existing) {
      setSelectedItems((prev) =>
        prev.map((it) =>
          it.description.toLowerCase().trim() === key
            ? { ...it, quantity: it.quantity + (customQty || 1) }
            : it
        )
      );
    } else {
      const newItem: SelectedItem = {
        id: `custom-${Date.now()}`,
        description: customName.trim(),
        quantity: customQty || 1,
        unit: customUnit || "nos",
      };
      setSelectedItems((prev) => [...prev, newItem]);
    }

    setCustomName("");
    setCustomQty(1);
    setIsAddingCustom(false);
  };

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return materials.filter((m) => {
      const matchesCategory =
        selectedCategory === "All" || m.category === selectedCategory;
      const matchesQuery =
        !q ||
        m.item_name.toLowerCase().includes(q) ||
        (m.brand && m.brand.toLowerCase().includes(q)) ||
        m.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [materials, selectedCategory, searchQuery]);

  // Save to database
  const handleSave = () => {
    setErrorMessage(null);
    setSaveSuccess(false);

    if (!selectedProjectId) {
      setErrorMessage("Please select a project first.");
      return;
    }

    if (selectedItems.length === 0) {
      setErrorMessage("Please add at least one material to the list.");
      return;
    }

    setSaving(true);
    startTransition(async () => {
      try {
        const payloadItems: EstimateItem[] = selectedItems.map((it, idx) => ({
          id: it.id || `item-${idx}`,
          description: it.description,
          quantity: it.quantity,
          qty: it.quantity,
          unit: it.unit || "nos",
          rate: 0,
          amount: 0,
        }));

        const res = await saveProjectItemListAction({
          projectId: selectedProjectId,
          items: payloadItems,
          notes,
          discount: 0,
          tax: 0,
        });

        if (res.error) {
          setErrorMessage(res.error);
        } else {
          setSaveSuccess(true);
          setTimeout(() => {
            router.push("/dashboard/item-list");
          }, 1000);
        }
      } catch (err: unknown) {
        console.error("Save error:", err);
        setErrorMessage(err instanceof Error ? err.message : "Failed to save item list.");
      } finally {
        setSaving(false);
      }
    });
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const categories = ["All", ...MATERIAL_CATEGORIES];

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <Link
          href="/dashboard/item-list"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Item Lists
        </Link>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            onClick={handlePrint}
            disabled={selectedItems.length === 0}
            className="h-9 text-xs border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            Print List
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving || selectedItems.length === 0}
            className="h-9 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 shadow-md"
          >
            {saving ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : saveSuccess ? (
              <span className="flex items-center gap-1.5 text-slate-950">
                <Check className="w-4 h-4" />
                Saved!
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Save className="w-4 h-4" />
                Save Item List ({selectedItems.length})
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Error / Success Messages */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="p-1 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Item list saved successfully! Redirecting...</span>
        </div>
      )}

      {/* Top Project Selector Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 print:bg-white print:border-none print:p-0">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="w-full md:w-1/2">
            <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1.5">
              Select Project:
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => handleProjectSelect(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 print:hidden"
            >
              <option value="">-- Choose Project --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_number} - {p.customer_name} ({p.project_type})
                </option>
              ))}
            </select>
          </div>

          {selectedProject && (
            <div className="flex items-center gap-4 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-500 block text-[10px]">Client</span>
                <span className="font-bold text-slate-200">{selectedProject.customer_name}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-500 block text-[10px]">Type</span>
                <span className="font-bold text-amber-400">{selectedProject.project_type}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-500 block text-[10px]">Items Selected</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">{selectedItems.length}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="flex md:hidden bg-slate-900 p-1 rounded-xl border border-slate-800 print:hidden">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "catalog"
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          1. Browse Materials ({materials.length})
        </button>
        <button
          onClick={() => setActiveTab("selected")}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all relative ${
            activeTab === "selected"
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          2. Selected List ({selectedItems.length})
          {selectedItems.length > 0 && activeTab !== "selected" && (
            <span className="ml-1.5 px-1.5 py-0.2 bg-amber-400 text-slate-950 rounded-full text-[10px] font-black">
              {selectedItems.length}
            </span>
          )}
        </button>
      </div>

      {/* Main Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ==================================================== */}
        {/* LEFT COLUMN: Materials Catalogue Selector (7 Cols)  */}
        {/* ==================================================== */}
        <div
          className={`lg:col-span-7 space-y-4 print:hidden ${
            activeTab === "catalog" ? "block" : "hidden md:block"
          }`}
        >
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-amber-400" />
                  Select Materials
                </h2>
                <p className="text-[11px] text-slate-400">
                  Pick items from the catalogue and adjust the quantity needed.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingCustom(!isAddingCustom)}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Custom Material
              </button>
            </div>

            {/* Custom Item Form */}
            {isAddingCustom && (
              <form
                onSubmit={handleAddCustom}
                className="p-3.5 bg-slate-950/80 border border-amber-500/30 rounded-xl space-y-3"
              >
                <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                  <span>Add Custom Material</span>
                  <button
                    type="button"
                    onClick={() => setIsAddingCustom(false)}
                    className="text-slate-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Material name (e.g. 50W LED Floodlight)"
                    className="sm:col-span-6 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    autoFocus
                  />
                  <input
                    type="number"
                    min="1"
                    value={customQty}
                    onChange={(e) => setCustomQty(Number(e.target.value) || 1)}
                    placeholder="Qty"
                    className="sm:col-span-3 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-center text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <select
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    className="sm:col-span-3 px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {COMMON_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    className="h-7 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                  >
                    Add to List
                  </Button>
                </div>
              </form>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search wires, switches, MCBs, pipes, boxes..."
                className="w-full pl-9 pr-8 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                      : "bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Materials Stream */}
          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredMaterials.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">
                No materials matching &ldquo;{searchQuery}&rdquo;. You can click &ldquo;+ Custom Material&rdquo; above to add it.
              </div>
            ) : (
              filteredMaterials.map((mat) => {
                const key = mat.item_name.toLowerCase().trim();
                const selected = selectedMap.get(key);
                const isSelected = Boolean(selected && selected.quantity > 0);
                const currentQty = selected?.quantity || 0;

                return (
                  <div
                    key={mat.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isSelected
                        ? "bg-amber-500/10 border-amber-500/40 shadow-sm"
                        : "bg-slate-900/80 hover:bg-slate-800/60 border-slate-800"
                    }`}
                  >
                    {/* Material Info */}
                    <div className="pr-3 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-200 truncate">
                          {mat.item_name}
                        </span>
                        {isSelected && (
                          <span className="p-0.5 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <span className="px-1.5 py-0.2 rounded bg-slate-950/80 text-slate-400 border border-slate-800">
                          {mat.category}
                        </span>
                        {mat.brand && <span className="text-slate-500">· {mat.brand}</span>}
                        <span className="text-amber-400/80 font-mono">({mat.unit || "nos"})</span>
                      </div>
                    </div>

                    {/* Quantity Selector / Add Button */}
                    <div className="shrink-0 flex items-center">
                      {!isSelected ? (
                        <button
                          type="button"
                          onClick={() => handleAddOrIncrement(mat)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-amber-500/40">
                          <button
                            type="button"
                            onClick={() => handleDecrement(mat.item_name)}
                            className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <input
                            type="number"
                            min="1"
                            value={currentQty}
                            onChange={(e) =>
                              handleQuantityChange(mat.item_name, parseInt(e.target.value, 10))
                            }
                            className="w-12 text-center text-xs font-bold font-mono text-amber-400 bg-transparent focus:outline-none"
                          />

                          <button
                            type="button"
                            onClick={() => handleAddOrIncrement(mat)}
                            className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                            title="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ==================================================== */}
        {/* RIGHT COLUMN: Project Item List (5 Cols / Full Print) */}
        {/* ==================================================== */}
        <div
          className={`lg:col-span-5 space-y-4 ${
            activeTab === "selected" ? "block" : "hidden md:block"
          }`}
        >
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 print:bg-white print:border-none print:shadow-none print:p-0">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 print:border-slate-300 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white print:text-slate-900 flex items-center gap-1.5">
                  <ListChecks className="w-4 h-4 text-amber-400 print:text-amber-700" />
                  Items Needed for Project
                </h3>
                <p className="text-[11px] text-slate-400 print:text-slate-600">
                  {selectedProject ? `${selectedProject.customer_name} (${selectedProject.project_number})` : "No project selected"}
                </p>
              </div>

              <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 font-mono text-xs font-bold print:border print:border-slate-300">
                {selectedItems.length} items
              </span>
            </div>

            {/* Print Header Details */}
            <div className="hidden print:block space-y-2 pb-4 text-xs text-slate-800">
              <div className="flex justify-between">
                <span><strong>Project #:</strong> {selectedProject?.project_number}</span>
                <span suppressHydrationWarning><strong>Date:</strong> {mounted ? new Date().toLocaleDateString() : ""}</span>
              </div>
              <div><strong>Client:</strong> {selectedProject?.customer_name}</div>
              <div><strong>Site Address:</strong> {selectedProject?.address || "N/A"}</div>
            </div>

            {/* Selected Items List */}
            {selectedItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 space-y-2 bg-slate-950/40 rounded-xl border border-slate-800/60 p-4">
                <Package className="w-8 h-8 mx-auto text-slate-600" />
                <p>No materials added yet.</p>
                <p className="text-[11px] text-slate-500">
                  Select materials from the catalogue on the left to build this project&apos;s item list.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin print:max-h-none print:overflow-visible">
                {/* Print Table View */}
                <table className="hidden print:table w-full text-left border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300">
                      <th className="p-2 w-10 text-center">#</th>
                      <th className="p-2">Material Description</th>
                      <th className="p-2 text-center w-28">Quantity</th>
                      <th className="p-2 w-28">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItems.map((item, idx) => (
                      <tr key={item.id || idx} className="border-b border-slate-200">
                        <td className="p-2 text-center font-mono">{idx + 1}</td>
                        <td className="p-2 font-semibold">{item.description}</td>
                        <td className="p-2 text-center font-mono font-bold">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="p-2"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Screen Interactive Cards View */}
                <div className="space-y-2 print:hidden">
                  {selectedItems.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-xs text-slate-200 truncate">
                          {item.description}
                        </p>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Unit: {item.unit}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Stepper */}
                        <div className="flex items-center gap-1 bg-slate-900 px-1.5 py-1 rounded-lg border border-slate-800">
                          <button
                            type="button"
                            onClick={() => handleDecrement(item.description)}
                            className="p-0.5 rounded text-slate-400 hover:text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleQuantityChange(
                                item.description,
                                parseInt(e.target.value, 10)
                              )
                            }
                            className="w-10 text-center font-mono font-bold text-xs text-amber-400 bg-transparent focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleQuantityChange(
                                item.description,
                                item.quantity + 1
                              )
                            }
                            className="p-0.5 rounded text-slate-400 hover:text-white"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.description)}
                          className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Remarks / Site Notes */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800 print:border-slate-300">
              <label className="text-[11px] font-bold text-slate-400 print:text-slate-700 uppercase tracking-wider block">
                Site Notes & Procurement Remarks:
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Ensure conduits are laid before plastering; Purchase Finolex wires only..."
                className="w-full p-2.5 bg-slate-950/60 print:bg-transparent border border-slate-800 print:border-slate-300 rounded-xl text-xs text-slate-200 print:text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none leading-relaxed"
              />
            </div>

            {/* Print Sign-off block */}
            <div className="hidden print:grid grid-cols-2 gap-8 pt-8 text-xs text-slate-700 border-t border-slate-300">
              <div>
                <p className="font-bold">Prepared By Electrician:</p>
                <div className="h-10 border-b border-slate-400 mt-2"></div>
              </div>
              <div>
                <p className="font-bold">Store / Site Received By:</p>
                <div className="h-10 border-b border-slate-400 mt-2"></div>
              </div>
            </div>

            {/* Save Button for Screen */}
            <div className="pt-2 print:hidden flex items-center gap-2">
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving || selectedItems.length === 0}
                className="w-full h-10 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 shadow-md justify-center"
              >
                {saving ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Saving Item List...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Save className="w-4 h-4" />
                    Save Item List for Project ({selectedItems.length} items)
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateItemListPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-slate-400 text-xs">
          Loading Materials List interface...
        </div>
      }
    >
      <CreateItemListComponent />
    </Suspense>
  );
}
