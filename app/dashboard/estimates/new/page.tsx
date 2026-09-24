"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
  Save,
  Send,
  FolderKanban,
  Calculator,
  IndianRupee,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EstimateItem, EstimateStatus } from "@/lib/types/estimate";
import { createEstimateRecord, getEstimates } from "@/lib/estimate-store";
import { getProjectsAction, ProjectRecord } from "../../projects/actions";
import { createEstimateAction } from "../actions";

export default function CreateEstimatePage() {
  // Projects dropdown list
  const [projects, setProjects] = useState<ProjectRecord[]>([]);

  // Section 1: Estimate Information
  const [projectId, setProjectId] = useState<string>("");
  const [projectName, setProjectName] = useState<string>("");
  const [estimateNumber, setEstimateNumber] = useState<string>(() => {
    return `EST-2026-${Math.floor(100 + Math.random() * 900)}`;
  });
  const [description, setDescription] = useState<string>("");
  const [termsConditions, setTermsConditions] = useState<string>(
    "1. 50% advance payment upon approval.\n2. Balance within 7 days of work completion.\n3. Estimate valid for 30 days."
  );

  // Section 2: Work Items (Dynamic Rows)
  const [workItems, setWorkItems] = useState<Omit<EstimateItem, "id">[]>([
    {
      description: "Electrical wiring",
      qty: 100,
      unit: "meter",
      rate: 50,
      amount: 5000,
    },
    {
      description: "Switch installation",
      qty: 20,
      unit: "nos",
      rate: 100,
      amount: 2000,
    },
  ]);

  // Section 3: Financial Totals
  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);

  // Auto-generate Estimate Number and load projects on mount
  useEffect(() => {
    const existing = getEstimates();
    const nextSeq = existing.length + 1;
    const autoNum = `EST-2026-${String(nextSeq).padStart(3, "0")}`;
    setEstimateNumber(autoNum);

    // Fetch projects from DB
    getProjectsAction().then((data) => {
      if (data && data.length > 0) {
        setProjects(data);
      }
    });
  }, []);

  // When project dropdown changes, sync project name & description
  const handleProjectSelect = (id: string) => {
    setProjectId(id);
    const found = projects.find((p) => p.id === id);
    if (found) {
      setProjectName(`${found.project_number} - ${found.customer_name}`);
      if (!description) {
        setDescription(
          found.work_description || `Electrical work for ${found.customer_name}`
        );
      }
    } else {
      setProjectName("");
    }
  };

  // Handle dynamic row changes
  const handleItemChange = (
    index: number,
    field: keyof Omit<EstimateItem, "id">,
    value: string | number
  ) => {
    setWorkItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === "qty" || field === "rate") {
          const q = field === "qty" ? Number(value) : item.qty;
          const r = field === "rate" ? Number(value) : item.rate;
          updated.amount = (isNaN(q) ? 0 : q) * (isNaN(r) ? 0 : r);
        }
        return updated;
      })
    );
  };

  const addWorkItem = () => {
    setWorkItems((prev) => [
      ...prev,
      {
        description: "",
        qty: 1,
        unit: "nos",
        rate: 0,
        amount: 0,
      },
    ]);
  };

  const removeWorkItem = (index: number) => {
    if (workItems.length <= 1) return;
    setWorkItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Section 3: Financial Calculations
  const subtotal = workItems.reduce((acc, item) => acc + (item.amount || 0), 0);
  const total = Math.max(0, subtotal - (discount || 0) + (tax || 0));

  // Section 4: Save Handler
  const [saving, setSaving] = useState(false);

  const handleSave = async (status: EstimateStatus) => {
    if (saving) return;
    setSaving(true);

    const finalEstNum =
      estimateNumber.trim() || `EST-2026-${Math.floor(100 + Math.random() * 900)}`;

    // Format work items with unique IDs
    const itemsFormatted: EstimateItem[] = workItems.map((item, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      description: item.description.trim() || `Work Item #${idx + 1}`,
      qty: Number(item.qty) || 1,
      unit: item.unit || "nos",
      rate: Number(item.rate) || 0,
      amount: (Number(item.qty) || 1) * (Number(item.rate) || 0),
    }));

    const computedSubtotal = itemsFormatted.reduce(
      (acc, item) => acc + item.amount,
      0
    );
    const computedTotal = Math.max(
      0,
      computedSubtotal - (discount || 0) + (tax || 0)
    );

    // 1. Save to local store for offline cache
    createEstimateRecord({
      estimate_number: finalEstNum,
      project_id: projectId || undefined,
      project_name: projectName || "General Electrical Work",
      description: description || undefined,
      terms_conditions: termsConditions || undefined,
      items: itemsFormatted,
      subtotal: computedSubtotal,
      discount: discount || 0,
      tax: tax || 0,
      total: computedTotal,
      status,
    });

    // 2. Save directly to Supabase DB
    try {
      const res = await createEstimateAction({
        estimate_number: finalEstNum,
        project_id: projectId || undefined,
        description: description || undefined,
        terms_and_conditions: termsConditions || undefined,
        subtotal: computedSubtotal,
        discount: discount || 0,
        tax: tax || 0,
        total_amount: computedTotal,
        status,
        items: itemsFormatted,
      });

      if (res.error) {
        console.error("Supabase Error saving estimate:", res.error);
        if (res.error.includes("42P01") || res.error.includes('relation "estimates" does not exist')) {
          alert("Supabase Database Notice: The 'estimates' table has not been created yet in your Supabase database. Please run the SQL schema script in your Supabase SQL Editor first.");
        } else {
          alert(`Supabase DB Error: ${res.error}`);
        }
      }
    } catch (err) {
      console.error("Exception calling createEstimateAction:", err);
    }

    // Navigate to estimates list page
    if (typeof window !== "undefined") {
      window.location.href = "/dashboard/estimates";
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div>
          <Link
            href="/dashboard/estimates"
            className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:underline mb-2 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Estimates
          </Link>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-amber-500/10 text-amber-400">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Create New Estimate
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSave("Draft")}
            className="h-9 text-xs border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 gap-1.5"
          >
            <Save className="w-3.5 h-3.5 text-slate-400" />
            <span>Save Draft</span>
          </Button>

          <Button
            type="button"
            onClick={() => handleSave("Sent")}
            className="h-9 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Save & Send</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Estimate Info & Work Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Estimate Information */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <FolderKanban className="w-4 h-4 text-amber-400" />
              Estimate Information
            </h2>

            <div className="grid grid-cols-1 gap-4">
              {/* Project Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Project Selection
                </label>
                <select
                  value={projectId}
                  onChange={(e) => handleProjectSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                >
                  <option value="">-- Select Project (Optional) --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.project_number} — {p.customer_name} ({p.project_type})
                    </option>
                  ))}
                </select>
              </div>



              {/* Terms & Conditions */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Terms & Conditions
                </label>
                <textarea
                  rows={3}
                  value={termsConditions}
                  onChange={(e) => setTermsConditions(e.target.value)}
                  placeholder="Specify payment terms, validity period, and conditions..."
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Work Items — Dynamic Rows */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Calculator className="w-4 h-4 text-amber-400" />
                Work Items
              </h2>
              <Button
                type="button"
                onClick={addWorkItem}
                size="sm"
                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-xs gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </Button>
            </div>

            {/* Desktop Table View */}
            <div className="overflow-x-auto rounded-xl border border-slate-800/80">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/90 border-b border-slate-800 text-[11px] uppercase tracking-wider font-bold text-slate-400">
                    <th className="py-2.5 px-3 w-5/12">Description</th>
                    <th className="py-2.5 px-2 text-center w-2/12">Qty</th>
                    <th className="py-2.5 px-2 text-center w-2/12">Unit</th>
                    <th className="py-2.5 px-2 text-right w-2/12">Rate (₹)</th>
                    <th className="py-2.5 px-3 text-right w-2/12">Amount (₹)</th>
                    <th className="py-2.5 px-2 text-center w-1/12">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {workItems.map((item, index) => (
                    <tr
                      key={index}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Description */}
                      <td className="p-2">
                        <input
                          type="text"
                          required
                          placeholder="e.g. Electrical wiring"
                          value={item.description}
                          onChange={(e) =>
                            handleItemChange(index, "description", e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </td>

                      {/* Qty */}
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) =>
                            handleItemChange(index, "qty", e.target.value)
                          }
                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 text-center font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </td>

                      {/* Unit */}
                      <td className="p-2">
                        <select
                          value={item.unit}
                          onChange={(e) =>
                            handleItemChange(index, "unit", e.target.value)
                          }
                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-center"
                        >
                          <option value="meter">meter</option>
                          <option value="nos">nos</option>
                          <option value="sqft">sqft</option>
                          <option value="set">set</option>
                          <option value="hrs">hrs</option>
                          <option value="kg">kg</option>
                          <option value="lot">lot</option>
                        </select>
                      </td>

                      {/* Rate (₹) */}
                      <td className="p-2">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={item.rate}
                            onChange={(e) =>
                              handleItemChange(index, "rate", e.target.value)
                            }
                            className="w-full pl-5 pr-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 text-right font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                      </td>

                      {/* Amount (₹) */}
                      <td className="p-2 text-right font-mono font-bold text-amber-400">
                        ₹{item.amount.toLocaleString("en-IN")}
                      </td>

                      {/* Remove Button */}
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeWorkItem(index)}
                          disabled={workItems.length <= 1}
                          className="p-1 text-slate-500 hover:text-red-400 disabled:opacity-20 transition-colors"
                          title="Remove Row"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Totals & Summary */}
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-amber-400" />
              Totals Calculation
            </h2>

            <div className="space-y-3 text-xs">
              {/* Subtotal */}
              <div className="flex items-center justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-mono text-slate-100 font-bold text-sm">
                  ₹{subtotal.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Discount Input */}
              <div className="flex items-center justify-between gap-2 text-slate-400">
                <span>Discount (₹)</span>
                <div className="relative w-28">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full pl-5 pr-2 py-1 bg-slate-950 border border-slate-800 rounded text-right text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Tax Input */}
              <div className="flex items-center justify-between gap-2 text-slate-400">
                <span>Tax (₹)</span>
                <div className="relative w-28">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={tax}
                    onChange={(e) => setTax(Number(e.target.value))}
                    className="w-full pl-5 pr-2 py-1 bg-slate-950 border border-slate-800 rounded text-right text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Total Calculation */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="font-bold text-white uppercase text-xs">
                  Total
                </span>
                <span className="text-xl font-extrabold text-amber-400 font-mono">
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="pt-4 border-t border-slate-800/80 space-y-2">
              <Button
                type="button"
                onClick={() => handleSave("Sent")}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 shadow-md justify-center py-2.5"
              >
                <Send className="w-4 h-4" />
                <span>Save & Send Estimate</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleSave("Draft")}
                className="w-full text-xs border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 gap-1.5 justify-center py-2.5"
              >
                <Save className="w-4 h-4 text-slate-400" />
                <span>Save as Draft</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
