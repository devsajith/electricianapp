"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  Receipt,
  Plus,
  Search,
  Filter,
  RefreshCw,
  IndianRupee,
  FolderKanban,
  Trash2,
  Calendar,
  AlertCircle,
  TrendingDown,
  Layers,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Expense, EXPENSE_CATEGORIES } from "@/lib/types/expense";
import { getExpensesAction, deleteExpenseAction } from "./actions";
import { RecordExpenseModal } from "@/components/record-expense-modal";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, startTransition] = useTransition();

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const res = await getExpensesAction();
      setExpenses(res.data || []);
    } catch (e) {
      console.error("Error loading expenses:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleDeleteExpense = (id: string, description: string) => {
    if (!confirm(`Are you sure you want to delete this expense: "${description}"?`)) return;
    startTransition(async () => {
      setExpenses((prev) => prev.filter((exp) => exp.id !== id));
      await deleteExpenseAction(id);
    });
  };

  // Filtered expenses
  const filteredExpenses = expenses.filter((exp) => {
    const matchesCategory =
      selectedCategory === "All" || exp.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      exp.description.toLowerCase().includes(q) ||
      exp.category.toLowerCase().includes(q) ||
      (exp.customer_name && exp.customer_name.toLowerCase().includes(q)) ||
      (exp.project_number && exp.project_number.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  });

  // KPI calculations
  const totalAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const uniqueProjects = new Set(expenses.map((e) => e.project_id)).size;
  const avgAmount = expenses.length > 0 ? Math.round(totalAmount / expenses.length) : 0;

  // Category badge style
  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "Emergency Material":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "Travel & Fuel":
        return "bg-slate-800 text-slate-200 border-slate-700";
      case "Equipment & Tools":
        return "bg-amber-500/10 text-amber-300 border-amber-500/30";
      case "Food & Refreshment":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "Permits & Fees":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "Labour / Helper":
        return "bg-slate-800 text-slate-200 border-slate-700";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-md bg-amber-500/10 text-amber-400">
              <Receipt className="w-5 h-5" />
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Project Expenses
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Record sudden job site costs, local hardware purchases, fuel, rentals, and overhead for projects.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
          <Button
            variant="outline"
            onClick={loadExpenses}
            disabled={loading}
            className="h-10 sm:h-9 text-xs border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
            Refresh
          </Button>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="h-10 sm:h-9 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 shadow-sm flex-1 sm:flex-none justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">
              Total Expenses
            </span>
            <IndianRupee className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
            ₹{totalAmount.toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-slate-500">{expenses.length} records logged</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">
              Projects Incurred
            </span>
            <FolderKanban className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white font-mono">
            {uniqueProjects}
          </p>
          <span className="text-[10px] text-slate-500">Active project sites</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">
              Average Expense
            </span>
            <TrendingDown className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
            ₹{avgAmount.toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-slate-500">Per recorded expense</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">
              Quick Action
            </span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full mt-1 py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            + New Sudden Expense
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search expenses by description, project #, client name..."
              className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-base sm:text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-slate-800/60">
          {["All", ...EXPENSE_CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                  : "bg-slate-950/50 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses Table (Desktop) / Cards (Mobile) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-3">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-xs space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400" />
            <p>Loading project expenses...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs space-y-3">
            <Receipt className="w-10 h-10 mx-auto text-slate-600" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-200">No project expenses found</h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? `No expenses matching "${searchQuery}".`
                  : "Record sudden job site expenses, local purchases, or travel costs."}
              </p>
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="h-8 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record First Expense</span>
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-800/80">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/90 border-b border-slate-800 text-[11px] uppercase tracking-wider font-bold text-slate-400">
                    <th className="py-3 px-4 w-32">Date</th>
                    <th className="py-3 px-4 w-52">Project</th>
                    <th className="py-3 px-4 w-44">Category</th>
                    <th className="py-3 px-4">Description / Purpose</th>
                    <th className="py-3 px-4 text-right w-36">Amount</th>
                    <th className="py-3 px-3 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {exp.expense_date}
                      </td>

                      {/* Project info */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/dashboard/projects`}
                          className="font-bold text-white hover:text-amber-400 transition-colors block"
                        >
                          {exp.customer_name || "Project"}
                        </Link>
                        {exp.project_number && (
                          <span className="text-[10px] text-amber-400/80 font-mono">
                            {exp.project_number}
                          </span>
                        )}
                      </td>

                      {/* Category Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getCategoryBadge(
                            exp.category
                          )}`}
                        >
                          {exp.category}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 text-slate-200">
                        <span>{exp.description}</span>
                        {exp.receipt_url && (
                          <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                            Ref: {exp.receipt_url}
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-amber-400">
                        ₹{(exp.amount || 0).toLocaleString("en-IN")}
                      </td>

                      {/* Delete */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => handleDeleteExpense(exp.id, exp.description)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (< md) */}
            <div className="block md:hidden space-y-3">
              {filteredExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryBadge(
                          exp.category
                        )}`}
                      >
                        {exp.category}
                      </span>
                      <h3 className="font-bold text-sm text-white mt-1">
                        {exp.customer_name || "Project Expense"}
                      </h3>
                      {exp.project_number && (
                        <span className="text-[10px] font-mono text-amber-400">
                          {exp.project_number}
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-black text-amber-400 text-base block">
                        ₹{(exp.amount || 0).toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {exp.expense_date}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                    {exp.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/60">
                    <span>{exp.receipt_url ? `Ref: ${exp.receipt_url}` : "Logged on site"}</span>
                    <button
                      onClick={() => handleDeleteExpense(exp.id, exp.description)}
                      className="text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Record Expense Modal */}
      <RecordExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => loadExpenses()}
      />
    </div>
  );
}
