"use client";

import { useEffect, useState, useTransition } from "react";
import {
  X,
  Plus,
  Receipt,
  IndianRupee,
  Calendar,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  Zap,
  Briefcase,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EXPENSE_CATEGORIES, Expense, ExpenseType } from "@/lib/types/expense";
import { createExpenseAction } from "@/app/dashboard/expenses/actions";
import { getProjectsAction, ProjectRecord } from "@/app/dashboard/projects/actions";

interface RecordExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  defaultExpenseType?: ExpenseType;
  onSuccess?: (newExpense?: Expense) => void;
}

export function RecordExpenseModal({
  isOpen,
  onClose,
  defaultProjectId,
  defaultExpenseType,
  onSuccess,
}: RecordExpenseModalProps) {
  const [expenseType, setExpenseType] = useState<ExpenseType>(
    defaultExpenseType || (defaultProjectId ? "project" : "project")
  );
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [projectId, setProjectId] = useState<string>(defaultProjectId || "");
  const [category, setCategory] = useState<string>("Emergency Material");
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [expenseDate, setExpenseDate] = useState<string>("");
  const [receiptUrl, setReceiptUrl] = useState<string>("");

  const [loadingProjects, setLoadingProjects] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setExpenseDate(new Date().toISOString().split("T")[0]);
      setExpenseType(defaultExpenseType || (defaultProjectId ? "project" : "project"));

      if (defaultProjectId) {
        setProjectId(defaultProjectId);
      }

      setLoadingProjects(true);
      getProjectsAction().then((data) => {
        setProjects(data || []);
        if (!defaultProjectId && data && data.length > 0 && data[0].id) {
          setProjectId(data[0].id);
        }
        setLoadingProjects(false);
      });
    }
  }, [isOpen, defaultProjectId, defaultExpenseType]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (expenseType === "project" && !projectId) {
      setErrorMessage("Please select a project for this project-based expense.");
      return;
    }

    if (!description.trim()) {
      setErrorMessage("Please enter an expense description or purpose.");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage("Please enter a valid amount greater than ₹0.");
      return;
    }

    setSaving(true);
    startTransition(async () => {
      try {
        const res = await createExpenseAction({
          expense_type: expenseType,
          project_id: expenseType === "project" ? projectId : null,
          category,
          description: description.trim(),
          amount: numAmount,
          expense_date: expenseDate,
          receipt_url: receiptUrl.trim() || null,
        });

        if (res.error) {
          setErrorMessage(res.error);
          setSaving(false);
        } else {
          setSuccessMessage(`${expenseType === "self" ? "Self" : "Project"} expense recorded successfully!`);
          setTimeout(() => {
            setDescription("");
            setAmount("");
            setReceiptUrl("");
            setSaving(false);
            onSuccess?.(res.data);
            onClose();
          }, 800);
        }
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Failed to record expense.");
        setSaving(false);
      }
    });
  };

  const selectedProj = projects.find((p) => p.id === projectId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Receipt className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-white text-base leading-tight">
                Record Expense
              </h3>
              <p className="text-[11px] text-slate-400">
                Log project site expenses or personal & shop overhead
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Expense Type Segmented Control */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Expense Classification:
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setExpenseType("project")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  expenseType === "project"
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Project Expense</span>
              </button>

              <button
                type="button"
                onClick={() => setExpenseType("self")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  expenseType === "self"
                    ? "bg-emerald-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Self Expense</span>
              </button>
            </div>
          </div>

          {/* Project Selection (Visible ONLY for Project Expense) */}
          {expenseType === "project" ? (
            <div className="space-y-1.5 animate-in fade-in duration-150">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FolderKanban className="w-3.5 h-3.5 text-amber-400" />
                Select Project:
              </label>
              {defaultProjectId && selectedProj ? (
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex items-center justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-mono font-bold text-[10px] mr-2">
                      {selectedProj.project_number}
                    </span>
                    <strong className="text-white">{selectedProj.customer_name}</strong>
                  </div>
                  <span className="text-[11px] text-slate-400">{selectedProj.project_type}</span>
                </div>
              ) : (
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  disabled={loadingProjects}
                  className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.project_number} - {p.customer_name} ({p.project_type})
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            /* Self Expense notice */
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <User className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-emerald-200">Self Expense (Independent)</strong>
                <span className="text-[11px] text-emerald-400/90 leading-relaxed">
                  This expense is for your own company/shop overhead, personal draw, vehicle, or general tools, and will be tracked separately from client jobs.
                </span>
              </div>
            </div>
          )}

          {/* Category Chips */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Expense Category:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EXPENSE_CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    category === cat
                      ? expenseType === "self"
                        ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                        : "bg-amber-500 text-slate-950 font-bold shadow-sm"
                      : "bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Expense Description / Purpose:
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                expenseType === "self"
                  ? "e.g. Shop electricity bill, van fuel, drill machine service, crew tea"
                  : "e.g. Bought extra 20m conduit pipe & junction boxes on site"
              }
              className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          {/* Amount & Date Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Amount (₹):
              </label>
              <div className="relative">
                <IndianRupee className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" />
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Expense Date:
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>
            </div>
          </div>

          {/* Receipt Note / URL */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 block">
              Bill / Receipt Ref (Optional):
            </label>
            <input
              type="text"
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
              placeholder="e.g. Cash Memo #4892 / Fuel pump receipt"
              className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          {/* Footer Action */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-9 text-xs border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={saving}
              className={`h-9 font-bold text-xs gap-1.5 shadow-md ${
                expenseType === "self"
                  ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                  : "bg-amber-500 hover:bg-amber-400 text-slate-950"
              }`}
            >
              {saving ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Recording...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  Save {expenseType === "self" ? "Self" : "Project"} Expense
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
