"use client";

import { useEffect, useState, useTransition, Suspense, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Building2,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ListChecks,
  Check,
  ChevronDown,
  ChevronUp,
  Edit3,
  FileDown,
  MapPin,
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
import { generateMaterialListPdf } from "@/lib/utils/pdf-generator";

const BATCH_SIZE = 40;

function NewItemListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultProjectId = searchParams.get("projectId") || "";

  const [isProject, setIsProject] = useState(Boolean(defaultProjectId));
  const [selectedProjectId, setSelectedProjectId] = useState(defaultProjectId);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  const [projects, setProjects] = useState<
    { id: string; project_number: string; name: string; place?: string | null }[]
  >([]);
  const [catalog, setCatalog] = useState<Material[]>([]);

  // Search & view filter for the material selection table
  const [searchTerm, setSearchTerm] = useState("");
  const [viewFilter, setViewFilter] = useState<"all" | "selected">("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "Electrical" | "Plumbing">("all");

  // Selection state map: materialId -> { qty: number, checked: boolean, brand?: string }
  const [selections, setSelections] = useState<Record<string, { qty: number; checked: boolean; brand?: string }>>({});

  // Progressive load-on-scroll (infinite scroll) state for 500+ items
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLTableRowElement | null>(null);

  // Custom off-catalog items
  const [customItems, setCustomItems] = useState<CreateMaterialListItemDTO[]>([]);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCat, setCustomCat] = useState("Electrical");
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
      const initialMap: Record<string, { qty: number; checked: boolean; brand?: string }> = {};
      materialsList.forEach((m) => {
        initialMap[m.id] = { qty: 1, checked: false, brand: m.brand || "" };
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
      const current = prev[materialId] || {
        qty: 1,
        checked: false,
        brand: catalog.find((c) => c.id === materialId)?.brand || "",
      };
      return {
        ...prev,
        [materialId]: {
          ...current,
          qty: current.qty > 0 ? current.qty : 1,
          checked: !current.checked,
        },
      };
    });
  };

  // Change quantity for a catalog material (automatically checks it if qty > 0)
  const handleQtyChange = (materialId: string, newQty: number) => {
    const validQty = Math.max(1, newQty);
    setSelections((prev) => {
      const current = prev[materialId] || {
        qty: 1,
        checked: false,
        brand: catalog.find((c) => c.id === materialId)?.brand || "",
      };
      return {
        ...prev,
        [materialId]: {
          ...current,
          qty: validQty,
          checked: true, // Auto check when quantity is entered/modified
        },
      };
    });
  };

  // Quick increment / decrement
  const handleAdjustQty = (materialId: string, delta: number) => {
    setSelections((prev) => {
      const current = prev[materialId] || {
        qty: 1,
        checked: false,
        brand: catalog.find((c) => c.id === materialId)?.brand || "",
      };
      const nextQty = Math.max(1, (Number(current.qty) || 1) + delta);
      return {
        ...prev,
        [materialId]: {
          ...current,
          qty: nextQty,
          checked: true,
        },
      };
    });
  };

  // Change brand for a catalog material (automatically checks it)
  const handleBrandChange = (materialId: string, newBrand: string) => {
    setSelections((prev) => {
      const current = prev[materialId] || {
        qty: 1,
        checked: false,
        brand: catalog.find((c) => c.id === materialId)?.brand || "",
      };
      return {
        ...prev,
        [materialId]: {
          ...current,
          brand: newBrand,
          checked: true, // Auto check when brand is entered/modified
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
        cat: customCat.trim() || null,
        brand: customBrand.trim() || null,
        unit: customUnit.trim() || "No",
        qty: Math.max(1, Number(customQty) || 1),
      },
    ]);

    setCustomName("");
    setCustomCat("Electrical");
    setCustomBrand("");
    setCustomQty(1);
    setIsCustomModalOpen(false);
  };

  const handleRemoveCustomItem = (idx: number) => {
    setCustomItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Count total items by category & selections
  const electricalCount = catalog.filter((m) => m.cat?.toLowerCase().includes("elec")).length;
  const plumbingCount = catalog.filter((m) => m.cat?.toLowerCase().includes("plumb")).length;
  const selectedCatalogItemsCount = Object.values(selections).filter((s) => s.checked).length;
  const totalSelectedCount = selectedCatalogItemsCount + customItems.length;

  // Filtered materials
  const filteredMaterials = catalog.filter((m) => {
    const isChecked = selections[m.id]?.checked || false;
    if (viewFilter === "selected" && !isChecked) return false;

    // Filter by category tab
    if (categoryFilter === "Electrical" && !m.cat?.toLowerCase().includes("elec")) return false;
    if (categoryFilter === "Plumbing" && !m.cat?.toLowerCase().includes("plumb")) return false;

    return true;
  });

  // Reset pagination when category or view filter changes
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [categoryFilter, viewFilter]);

  // Load more items as user scrolls near bottom of the table
  const handleTableScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      if (target.scrollHeight - target.scrollTop - target.clientHeight < 250) {
        setVisibleCount((prev) => {
          if (prev < filteredMaterials.length) {
            return Math.min(prev + BATCH_SIZE, filteredMaterials.length);
          }
          return prev;
        });
      }
    },
    [filteredMaterials.length]
  );

  // Sentinel observer for smooth infinite loading
  useEffect(() => {
    const container = scrollContainerRef.current;
    const sentinel = sentinelRef.current;
    if (!container || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => {
            if (prev < filteredMaterials.length) {
              return Math.min(prev + BATCH_SIZE, filteredMaterials.length);
            }
            return prev;
          });
        }
      },
      {
        root: container,
        rootMargin: "250px",
        threshold: 0.05,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filteredMaterials.length, visibleCount]);

  // Sliced items visible in DOM (smooth 60fps rendering even with 500+ items)
  const visibleMaterials = filteredMaterials.slice(0, visibleCount);
  const hasMore = visibleCount < filteredMaterials.length;

  // Quick Download PDF of current selection
  const handleDownloadPdf = () => {
    const selectedCatalogItems: CreateMaterialListItemDTO[] = catalog
      .filter((m) => selections[m.id]?.checked)
      .map((m) => {
        const itemSelection = selections[m.id];
        const chosenBrand =
          itemSelection?.brand !== undefined ? itemSelection.brand.trim() : m.brand;
        return {
          material_id: m.id,
          name: m.name,
          cat: m.cat || null,
          brand: chosenBrand || null,
          unit: m.unit,
          qty: itemSelection?.qty || 1,
        };
      });

    const allItems = [...selectedCatalogItems, ...customItems];
    if (allItems.length === 0) {
      setErrorMsg("Please select or add at least one material to download PDF.");
      return;
    }

    const matchedProject = projects.find((p) => p.id === selectedProjectId);

    generateMaterialListPdf({
      clientName: matchedProject?.name || null,
      items: allItems,
    });
  };

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
      .map((m) => {
        const itemSelection = selections[m.id];
        const chosenBrand =
          itemSelection?.brand !== undefined ? itemSelection.brand.trim() : m.brand;
        return {
          material_id: m.id,
          name: m.name,
          cat: m.cat || null,
          brand: chosenBrand || null,
          unit: m.unit,
          qty: itemSelection?.qty || 1,
        };
      });

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
    <div
      className={`mx-auto space-y-4 sm:space-y-6 transition-all duration-300 ${
        isHeaderCollapsed ? "max-w-7xl" : "max-w-4xl"
      }`}
    >
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
        {/* Header Setup (Collapsible / Minimizable) */}
        {isHeaderCollapsed ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0 mt-0.5 sm:mt-0">
                <ListChecks className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    List Title:
                  </span>
                  <span className="text-sm font-bold text-white">
                    {title.trim() || "(Untitled List)"}
                  </span>
                  {isProject ? (
                    (() => {
                      const proj = projects.find((p) => p.id === selectedProjectId);
                      return (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                            <Building2 className="w-3 h-3" />
                            <span>{proj?.name || "Project List"}</span>
                          </span>
                          {proj?.place && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                              <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>{proj.place}</span>
                            </span>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                      <Layers className="w-3 h-3" />
                      <span>General / Non-Project</span>
                    </span>
                  )}
                </div>
                {notes.trim() && (
                  <p className="text-xs text-slate-400 truncate mt-1">
                    📝 {notes.trim()}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsHeaderCollapsed(false)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 text-xs font-semibold text-slate-200 hover:text-white transition-all shrink-0 self-end sm:self-center cursor-pointer shadow-sm hover:border-slate-600"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Edit Details</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5 transition-all">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
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

              {title.trim() && (
                <button
                  type="button"
                  onClick={() => setIsHeaderCollapsed(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Minimize form"
                >
                  <ChevronUp className="w-4 h-4" />
                  <span className="hidden sm:inline">Minimize</span>
                </button>
              )}
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
                      {p.name} {p.place ? `(${p.place})` : ""}
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

            {/* Minimize / Proceed Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
              <span className="text-xs text-slate-400">
                Form filled? Minimize details to expand the material selection table.
              </span>
              <button
                type="button"
                onClick={() => {
                  if (isProject && !selectedProjectId) {
                    setErrorMsg("Please select a project before continuing.");
                    return;
                  }
                  if (!title.trim()) {
                    setErrorMsg("Please enter a list title before minimizing.");
                    return;
                  }
                  setErrorMsg(null);
                  setIsHeaderCollapsed(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Minimize Details &amp; Open Big Selection Table ↓</span>
              </button>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* MATERIAL SELECTION LIST (CHECKBOX + QUANTITY)       */}
        {/* ==================================================== */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          {/* Compact Category Tabs & Selection Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <ListChecks className="w-4 h-4" />
              </span>
              <span className="font-bold text-white text-sm">
                Materials Catalog
              </span>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                {visibleMaterials.length < filteredMaterials.length
                  ? `Showing ${visibleMaterials.length} of ${filteredMaterials.length}`
                  : `${filteredMaterials.length} items`}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-lg bg-slate-950 p-0.5 border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter("all");
                    if (viewFilter === "selected") setViewFilter("all");
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    categoryFilter === "all" && viewFilter !== "selected"
                      ? "bg-slate-800 text-white shadow-sm font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  All ({catalog.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter("Electrical");
                    if (viewFilter === "selected") setViewFilter("all");
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
                    categoryFilter === "Electrical" && viewFilter !== "selected"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm font-bold"
                      : "text-amber-400/80 hover:text-amber-300"
                  }`}
                >
                  <span>⚡ Electrical</span>
                  <span className="text-[10px] opacity-75 font-mono">({electricalCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter("Plumbing");
                    if (viewFilter === "selected") setViewFilter("all");
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
                    categoryFilter === "Plumbing" && viewFilter !== "selected"
                      ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm font-bold"
                      : "text-sky-400/80 hover:text-sky-300"
                  }`}
                >
                  <span>🚰 Plumbing</span>
                  <span className="text-[10px] opacity-75 font-mono">({plumbingCount})</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setViewFilter((v) => (v === "selected" ? "all" : "selected"))}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
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

          {/* Material Selection Table */}
          <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950 shadow-inner">
            <div
              ref={scrollContainerRef}
              onScroll={handleTableScroll}
              className={`overflow-y-auto transition-all duration-300 ${
                isHeaderCollapsed
                  ? "max-h-[calc(100vh-270px)] min-h-[580px]"
                  : "max-h-[460px]"
              }`}
            >
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider shadow-sm">
                  <tr>
                    <th className="py-3 px-3 w-14 text-center border-r border-slate-800 select-none">
                      ADD
                    </th>
                    <th className="py-3 px-4 border-r border-slate-800">MATERIAL NAME</th>
                    <th className="py-3 px-3 w-32 text-center border-r border-slate-800">CATEGORY</th>
                    <th className="py-3 px-3 w-48 border-r border-slate-800">BRAND</th>
                    <th className="py-3 px-3 w-28 text-center border-r border-slate-800">UNIT</th>
                    <th className="py-3 px-4 w-48 text-center">QUANTITY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-500 text-xs">
                        No materials found {categoryFilter !== "all" ? `in ${categoryFilter}` : ""}
                      </td>
                    </tr>
                  ) : (
                    <>
                      {visibleMaterials.map((m) => {
                        const isChecked = selections[m.id]?.checked || false;
                        const qty = selections[m.id]?.qty || 1;

                        return (
                          <tr
                            key={m.id}
                            className={`transition-colors border-b border-slate-800/60 ${
                              isChecked
                                ? "bg-amber-500/10 hover:bg-amber-500/15 border-l-4 border-l-amber-500"
                                : "hover:bg-slate-900/60 border-l-4 border-l-transparent"
                            }`}
                          >
                            {/* Checkbox */}
                            <td className="py-3 px-3 text-center border-r border-slate-800">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleCheck(m.id)}
                                className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 cursor-pointer accent-amber-500"
                              />
                            </td>

                            {/* Material Name */}
                            <td
                              className="py-3 px-4 border-r border-slate-800 cursor-pointer select-none"
                              onClick={() => handleToggleCheck(m.id)}
                            >
                              <span className={`text-sm ${isChecked ? "text-amber-300 font-bold" : "font-semibold text-slate-100"}`}>
                                {m.name}
                              </span>
                            </td>

                            {/* Category */}
                            <td className="py-3 px-3 text-center border-r border-slate-800 select-none">
                              {m.cat?.toLowerCase().includes("plumb") ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30 whitespace-nowrap">
                                  🚰 Plumbing
                                </span>
                              ) : m.cat?.toLowerCase().includes("elec") ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 whitespace-nowrap">
                                  ⚡ Electrical
                                </span>
                              ) : m.cat ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap">
                                  {m.cat}
                                </span>
                              ) : (
                                <span className="text-slate-600 font-mono text-[11px]">—</span>
                              )}
                            </td>

                            {/* Brand Input */}
                            <td className="py-2.5 px-3 border-r border-slate-800">
                              <input
                                type="text"
                                value={
                                  selections[m.id]?.brand !== undefined
                                    ? selections[m.id].brand
                                    : m.brand || ""
                                }
                                onChange={(e) => handleBrandChange(m.id, e.target.value)}
                                placeholder={m.brand || "Enter brand"}
                                className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                                  isChecked
                                    ? "bg-slate-900 border border-amber-500/60 text-amber-200 placeholder-slate-500 font-semibold shadow-inner"
                                    : "bg-slate-900/40 border border-slate-800 text-slate-300 placeholder-slate-600 hover:border-slate-700"
                                }`}
                              />
                            </td>

                            {/* Unit */}
                            <td className="py-3 px-3 text-center border-r border-slate-800">
                              <span className="px-2.5 py-1 rounded bg-slate-900 text-slate-200 text-xs font-mono font-medium border border-slate-800">
                                {m.unit}
                              </span>
                            </td>

                            {/* Quantity with +/- and Direct Input */}
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleAdjustQty(m.id, -1)}
                                  className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 hover:text-amber-400 border border-slate-700 text-slate-200 font-bold flex items-center justify-center text-sm transition-colors active:scale-95 cursor-pointer"
                                  title="Decrease quantity"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  step="any"
                                  value={qty}
                                  onChange={(e) => handleQtyChange(m.id, Number(e.target.value))}
                                  className={`w-20 px-2.5 py-1.5 rounded-lg text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                                    isChecked
                                      ? "bg-slate-900 border-2 border-amber-500 text-amber-400 shadow-inner"
                                      : "bg-slate-900 border border-slate-700 text-slate-300"
                                  }`}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAdjustQty(m.id, 1)}
                                  className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 hover:text-amber-400 border border-slate-700 text-slate-200 font-bold flex items-center justify-center text-sm transition-colors active:scale-95 cursor-pointer"
                                  title="Increase quantity"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {/* Infinite Scroll Sentinel Row */}
                      {hasMore && (
                        <tr ref={sentinelRef}>
                          <td colSpan={6} className="py-4 text-center bg-slate-950/90 border-t border-slate-800/60">
                            <div className="flex items-center justify-center gap-2 text-xs text-amber-400 font-medium animate-pulse">
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                              <span>Loading more materials... ({visibleMaterials.length} of {filteredMaterials.length} loaded)</span>
                            </div>
                          </td>
                        </tr>
                      )}

                      {!hasMore && filteredMaterials.length > BATCH_SIZE && (
                        <tr>
                          <td colSpan={6} className="py-3 text-center text-[11px] font-medium text-slate-500 bg-slate-950/40 border-t border-slate-800/60">
                            ✓ All {filteredMaterials.length} items loaded
                          </td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar (Non-sticky to prevent overlapping table) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
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

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end flex-wrap">
            <Link href="/dashboard/item-list">
              <Button type="button" variant="outline" className="border-slate-800 text-slate-400 hover:text-white">
                Cancel
              </Button>
            </Link>
            <Button
              type="button"
              onClick={handleDownloadPdf}
              disabled={totalSelectedCount === 0}
              variant="outline"
              className="border-slate-700 bg-slate-800 text-slate-200 hover:text-white font-bold text-xs gap-1.5 shadow-sm active:scale-95 transition-all"
              title="Download formatted PDF Requisition Document"
            >
              <FileDown className="w-4 h-4 text-amber-400" />
              <span>Download PDF</span>
            </Button>
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
