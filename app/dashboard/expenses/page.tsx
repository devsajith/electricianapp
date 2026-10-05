"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import Link from "next/link";
import {
  Receipt,
  Plus,
  Search,
  RefreshCw,
  IndianRupee,
  Trash2,
  TrendingDown,
  FileSpreadsheet,
  Download,
  Briefcase,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Expense, ExpenseType } from "@/lib/types/expense";
import { getExpensesAction, deleteExpenseAction } from "./actions";
import { RecordExpenseModal } from "@/components/record-expense-modal";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "project" | "self">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState<ExpenseType>("project");
  const [, startTransition] = useTransition();

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 2500);

    try {
      const res = await getExpensesAction();
      clearTimeout(timer);
      if (res.data && res.data.length > 0) {
        setExpenses(res.data);
      } else {
        setExpenses([]);
      }
    } catch (e) {
      console.error("Error loading expenses:", e);
      clearTimeout(timer);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 2500);

    getExpensesAction()
      .then((res) => {
        clearTimeout(timer);
        if (isMounted) {
          setExpenses(res.data || []);
          setLoading(false);
        }
      })
      .catch((e) => {
        console.error("Error loading expenses:", e);
        clearTimeout(timer);
        if (isMounted) {
          setExpenses([]);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  const handleDeleteExpense = (id: string, description: string) => {
    if (!confirm(`Are you sure you want to delete this expense: "${description}"?`)) return;
    startTransition(async () => {
      setExpenses((prev) => prev.filter((exp) => exp.id !== id));
      await deleteExpenseAction(id);
    });
  };

  const openRecordModal = (type: ExpenseType = "project") => {
    setModalDefaultType(type);
    setIsModalOpen(true);
  };

  // Separate expenses into Project Expenses vs Self Expenses
  const projectExpenses = expenses.filter(
    (e) => e.type === "project" || (e.type !== "self" && (e.project_id || e.name))
  );
  const selfExpenses = expenses.filter(
    (e) => e.type === "self" || (!e.project_id && !e.name)
  );

  // Overall KPI Calculations
  const totalAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const projectTotalAmount = projectExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const selfTotalAmount = selfExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const uniqueProjects = new Set(projectExpenses.map((e) => e.project_id).filter(Boolean)).size;

  // Filter Project Expenses
  const q = searchQuery.toLowerCase().trim();
  const filteredProjectExpenses = projectExpenses.filter((exp) => {
    return (
      !q ||
      exp.description?.toLowerCase().includes(q) ||
      (exp.name && exp.name.toLowerCase().includes(q)) ||
      (exp.project_number && exp.project_number.toLowerCase().includes(q))
    );
  });
  const filteredProjectTotal = filteredProjectExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Filter Self Expenses
  const filteredSelfExpenses = selfExpenses.filter((exp) => {
    return (
      !q ||
      exp.description?.toLowerCase().includes(q)
    );
  });
  const filteredSelfTotal = filteredSelfExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Export Project Expenses CSV
  const exportProjectCsv = () => {
    if (filteredProjectExpenses.length === 0) return;
    const headers = ["Row", "Expense Date", "Project", "Project Number", "Description", "Amount (INR)"];
    const rows = filteredProjectExpenses.map((exp, idx) => [
      idx + 1,
      `"${exp.date}"`,
      `"${(exp.name || "Project").replace(/"/g, '""')}"`,
      `"${exp.project_number || ""}"`,
      `"${(exp.description || "").replace(/"/g, '""')}"`,
      exp.amount || 0,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Project_Expenses_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Self Expenses CSV
  const exportSelfCsv = () => {
    if (filteredSelfExpenses.length === 0) return;
    const headers = ["Row", "Expense Date", "Description", "Amount (INR)"];
    const rows = filteredSelfExpenses.map((exp, idx) => [
      idx + 1,
      `"${exp.date}"`,
      `"${(exp.description || "").replace(/"/g, '""')}"`,
      exp.amount || 0,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Self_Expenses_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              Expense Management
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Dedicated tables for Project-based site expenses and Self / Overhead expenses with independent calculations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
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
            onClick={() => openRecordModal("project")}
            className="h-10 sm:h-9 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Project Expense</span>
          </Button>

          <Button
            onClick={() => openRecordModal("self")}
            className="h-10 sm:h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-sm"
          >
            <User className="w-4 h-4" />
            <span>+ Self Expense</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards - Calculated Separately */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Combined */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">
              Total Expenditure
            </span>
            <IndianRupee className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white font-mono">
            ₹{totalAmount.toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-slate-500">{expenses.length} total entries</span>
        </div>

        {/* Project Expenses KPI */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/30 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5" />
              Project Expenses
            </span>
            <span className="text-[10px] font-mono bg-amber-500/10 px-1.5 py-0.5 rounded text-amber-400 border border-amber-500/30">
              {projectExpenses.length} entries
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
            ₹{projectTotalAmount.toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-slate-400">
            {uniqueProjects} active customer sites
          </span>
        </div>

        {/* Self Expenses KPI */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/30 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              Self Expenses
            </span>
            <span className="text-[10px] font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded text-emerald-400 border border-emerald-500/30">
              {selfExpenses.length} entries
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
            ₹{selfTotalAmount.toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-slate-400">Shop, personal draw, vehicle & tools</span>
        </div>

        {/* Ratio / Split */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">
              Expense Distribution
            </span>
            <TrendingDown className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-sm font-bold text-slate-200 mt-1">
            <span className="text-amber-400 font-mono">
              {totalAmount > 0 ? Math.round((projectTotalAmount / totalAmount) * 100) : 0}%
            </span>{" "}
            Project /{" "}
            <span className="text-emerald-400 font-mono">
              {totalAmount > 0 ? Math.round((selfTotalAmount / totalAmount) * 100) : 0}%
            </span>{" "}
            Self
          </p>
          <span className="text-[10px] text-slate-500">Calculated & tracked independently</span>
        </div>
      </div>

      {/* Search Bar & 3 Filter Options: All, Project, Self */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        {/* Search box */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search expenses by description, project #, client name..."
            className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-base sm:text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>

        {/* ONLY 3 Filter Options: All, Project, Self */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeFilter === "all"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "bg-slate-950/70 text-slate-300 hover:text-white border border-slate-800"
            }`}
          >
            <span>All</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                activeFilter === "all"
                  ? "bg-slate-950/20 text-slate-950 font-black"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {expenses.length}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter("project")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeFilter === "project"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "bg-slate-950/70 text-slate-300 hover:text-white border border-slate-800"
            }`}
          >
            <span>Project</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                activeFilter === "project"
                  ? "bg-slate-950/20 text-slate-950 font-black"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {projectExpenses.length}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter("self")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeFilter === "self"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "bg-slate-950/70 text-slate-300 hover:text-white border border-slate-800"
            }`}
          >
            <span>Self</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                activeFilter === "self"
                  ? "bg-slate-950/20 text-slate-950 font-black"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {selfExpenses.length}
            </span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400" />
          <p>Loading expenses records...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ======================================================== */}
          {/* TABLE 1: PROJECT-BASED EXPENSES TABLE */}
          {/* ======================================================== */}
          {(activeFilter === "all" || activeFilter === "project") && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                      <span>Project-based Expenses</span>
                      <span className="text-[11px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        Total: ₹{filteredProjectTotal.toLocaleString("en-IN")}
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Materials, site helpers, and travel incurred on customer client jobs.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => openRecordModal("project")}
                  size="sm"
                  className="h-8 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Project Expense</span>
                </Button>
              </div>

              {filteredProjectExpenses.length === 0 ? (
                <div className="p-10 rounded-2xl bg-slate-950/60 border border-slate-800 text-center text-slate-400 text-xs space-y-2">
                  <Receipt className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="font-semibold text-slate-300">No project-based expenses found</p>
                  <p className="text-slate-500 text-[11px]">
                    {searchQuery ? `No entries matching "${searchQuery}".` : "No job site expenses logged yet."}
                  </p>
                </div>
              ) : (
                /* Excel Spreadsheet: Project_Expenses_Ledger.xlsx */
                <div className="rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950">
                  {/* Excel Green Ribbon */}
                  <div className="bg-[#107c41] px-4 py-2 flex flex-wrap items-center justify-between text-white border-b border-emerald-800 text-xs">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                      <span className="font-bold tracking-wide">Project_Expenses_Ledger.xlsx</span>
                      <span className="bg-emerald-900/60 text-emerald-200 text-[10px] px-2 py-0.5 rounded font-mono font-semibold">
                        AutoSave [ON]
                      </span>
                      <span className="text-[11px] text-emerald-100 hidden sm:inline ml-2">
                        Showing {filteredProjectExpenses.length} entries
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={exportProjectCsv}
                        className="flex items-center gap-1.5 px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded font-medium text-xs shadow-sm transition-colors border border-emerald-600"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export Excel (.CSV)</span>
                      </button>
                    </div>
                  </div>

                  {/* Excel Grid */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[750px]">
                      <thead>
                        <tr className="bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-700">
                          <th className="py-2 px-3 w-12 text-center border-r border-slate-700/80 bg-slate-900/90 text-slate-500 font-mono select-none">
                            ◢
                          </th>
                          <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold w-32">
                            <div className="text-[10px] text-emerald-400 font-mono">A</div>
                            DATE
                          </th>
                          <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold w-52">
                            <div className="text-[10px] text-emerald-400 font-mono">B</div>
                            PROJECT & CUSTOMER
                          </th>
                          <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold">
                            <div className="text-[10px] text-emerald-400 font-mono">C</div>
                            DESCRIPTION / PURPOSE
                          </th>
                          <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold text-right w-36">
                            <div className="text-[10px] text-emerald-400 font-mono">D</div>
                            AMOUNT (₹)
                          </th>
                          <th className="py-2.5 px-3 font-bold text-center w-16">
                            <div className="text-[10px] text-emerald-400 font-mono">E</div>
                            ACTION
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-xs font-mono">
                        {filteredProjectExpenses.map((exp, idx) => (
                          <tr
                            key={exp.id}
                            className="hover:bg-emerald-500/10 transition-colors group border-b border-slate-800/80"
                          >
                            <td className="py-2.5 px-3 text-center bg-slate-900/70 border-r border-slate-800 text-slate-400 select-none text-[11px] font-mono group-hover:text-emerald-400 group-hover:bg-emerald-950/30">
                              {idx + 1}
                            </td>

                            <td className="py-2.5 px-4 border-r border-slate-800 text-slate-300">
                              {exp.date}
                            </td>

                            <td className="py-2.5 px-4 border-r border-slate-800 font-sans">
                              <Link
                                href="/dashboard/projects"
                                className="font-bold text-white hover:text-emerald-400 transition-colors block"
                              >
                                {exp.name || "Project"}
                              </Link>
                              {exp.project_number && (
                                <span className="text-[10px] text-amber-400 font-mono font-semibold">
                                  {exp.project_number}
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-4 border-r border-slate-800 text-slate-200 font-sans">
                              <span className="font-medium">{exp.description}</span>
                            </td>

                            <td className="py-2.5 px-4 border-r border-slate-800 text-right font-mono font-bold text-sm text-amber-400">
                              ₹{(exp.amount || 0).toLocaleString("en-IN")}
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              <button
                                onClick={() => handleDeleteExpense(exp.id, exp.description || "Expense")}
                                className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                title="Delete expense"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>

                      {/* Accounting Totals Row */}
                      <tfoot>
                        <tr className="bg-slate-900/90 font-bold border-t-2 border-slate-700 border-b-4 border-double border-slate-600 text-xs">
                          <td className="py-3 px-3 text-center bg-slate-950 border-r border-slate-700 text-emerald-400 font-mono">
                            Σ
                          </td>
                          <td colSpan={3} className="py-3 px-4 border-r border-slate-700 text-slate-200 uppercase tracking-wider text-[11px]">
                            Total Project Expenses ({filteredProjectExpenses.length} entries)
                          </td>
                          <td className="py-3 px-4 border-r border-slate-700 text-right font-mono text-amber-400 text-sm">
                            ₹{filteredProjectTotal.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-3"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Bottom Sheet Tab & Status Bar */}
                  <div className="bg-slate-900 border-t border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between text-[11px] text-slate-400 select-none">
                    <div className="flex items-center gap-1">
                      <span className="px-3 py-1 bg-slate-950 text-emerald-400 font-semibold rounded-t border-t-2 border-emerald-500 border-x border-slate-800 flex items-center gap-1.5">
                        <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                        Sheet1 - Project Expenses
                      </span>
                    </div>
                    <div className="flex items-center gap-4 font-mono text-[10px]">
                      <span>READY</span>
                      <span className="border-l border-slate-700 pl-3">COUNT: {filteredProjectExpenses.length}</span>
                      <span className="border-l border-slate-700 pl-3 text-amber-400 font-bold">
                        SUM: ₹{filteredProjectTotal.toLocaleString("en-IN")}
                      </span>
                      {filteredProjectExpenses.length > 0 && (
                        <span className="border-l border-slate-700 pl-3 text-slate-300 hidden sm:inline">
                          AVERAGE: ₹{Math.round(filteredProjectTotal / filteredProjectExpenses.length).toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TABLE 2: SEPARATE SELF EXPENSES TABLE */}
          {/* ======================================================== */}
          {(activeFilter === "all" || activeFilter === "self") && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                      <span>Self & Overhead Expenses</span>
                      <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Total: ₹{filteredSelfTotal.toLocaleString("en-IN")}
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Personal draws, shop electricity, van diesel, crew tea/snacks, and general tools.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => openRecordModal("self")}
                  size="sm"
                  className="h-8 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Self Expense</span>
                </Button>
              </div>

              {filteredSelfExpenses.length === 0 ? (
                <div className="p-10 rounded-2xl bg-slate-950/60 border border-slate-800 text-center text-slate-400 text-xs space-y-2">
                  <User className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="font-semibold text-slate-300">No self expenses found</p>
                  <p className="text-slate-500 text-[11px]">
                    {searchQuery ? `No entries matching "${searchQuery}".` : "No personal or shop overhead logged yet."}
                  </p>
                </div>
              ) : (
                /* Excel Spreadsheet: Self_Expenses_Ledger.xlsx */
                <div className="rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950">
                  {/* Excel Green Ribbon */}
                  <div className="bg-[#107c41] px-4 py-2 flex flex-wrap items-center justify-between text-white border-b border-emerald-800 text-xs">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                      <span className="font-bold tracking-wide">Self_Expenses_Ledger.xlsx</span>
                      <span className="bg-emerald-900/60 text-emerald-200 text-[10px] px-2 py-0.5 rounded font-mono font-semibold">
                        AutoSave [ON]
                      </span>
                      <span className="text-[11px] text-emerald-100 hidden sm:inline ml-2">
                        Showing {filteredSelfExpenses.length} entries
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={exportSelfCsv}
                        className="flex items-center gap-1.5 px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded font-medium text-xs shadow-sm transition-colors border border-emerald-600"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export Excel (.CSV)</span>
                      </button>
                    </div>
                  </div>

                  {/* Excel Grid */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-700">
                          <th className="py-2 px-3 w-12 text-center border-r border-slate-700/80 bg-slate-900/90 text-slate-500 font-mono select-none">
                            ◢
                          </th>
                          <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold w-32">
                            <div className="text-[10px] text-emerald-400 font-mono">A</div>
                            DATE
                          </th>
                          <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold">
                            <div className="text-[10px] text-emerald-400 font-mono">B</div>
                            DESCRIPTION / PURPOSE
                          </th>
                          <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold text-right w-36">
                            <div className="text-[10px] text-emerald-400 font-mono">C</div>
                            AMOUNT (₹)
                          </th>
                          <th className="py-2.5 px-3 font-bold text-center w-16">
                            <div className="text-[10px] text-emerald-400 font-mono">D</div>
                            ACTION
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-xs font-mono">
                        {filteredSelfExpenses.map((exp, idx) => (
                          <tr
                            key={exp.id}
                            className="hover:bg-emerald-500/10 transition-colors group border-b border-slate-800/80"
                          >
                            <td className="py-2.5 px-3 text-center bg-slate-900/70 border-r border-slate-800 text-slate-400 select-none text-[11px] font-mono group-hover:text-emerald-400 group-hover:bg-emerald-950/30">
                              {idx + 1}
                            </td>

                            <td className="py-2.5 px-4 border-r border-slate-800 text-slate-300">
                              {exp.date}
                            </td>

                            <td className="py-2.5 px-4 border-r border-slate-800 text-slate-200 font-sans">
                              <span className="font-medium">{exp.description}</span>
                            </td>

                            <td className="py-2.5 px-4 border-r border-slate-800 text-right font-mono font-bold text-sm text-emerald-400">
                              ₹{(exp.amount || 0).toLocaleString("en-IN")}
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              <button
                                onClick={() => handleDeleteExpense(exp.id, exp.description || "Expense")}
                                className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                title="Delete expense"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>

                      {/* Accounting Totals Row */}
                      <tfoot>
                        <tr className="bg-slate-900/90 font-bold border-t-2 border-slate-700 border-b-4 border-double border-slate-600 text-xs">
                          <td className="py-3 px-3 text-center bg-slate-950 border-r border-slate-700 text-emerald-400 font-mono">
                            Σ
                          </td>
                          <td colSpan={2} className="py-3 px-4 border-r border-slate-700 text-slate-200 uppercase tracking-wider text-[11px]">
                            Total Self Expenses ({filteredSelfExpenses.length} entries)
                          </td>
                          <td className="py-3 px-4 border-r border-slate-700 text-right font-mono text-emerald-400 text-sm">
                            ₹{filteredSelfTotal.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-3"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Bottom Sheet Tab & Status Bar */}
                  <div className="bg-slate-900 border-t border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between text-[11px] text-slate-400 select-none">
                    <div className="flex items-center gap-1">
                      <span className="px-3 py-1 bg-slate-950 text-emerald-400 font-semibold rounded-t border-t-2 border-emerald-500 border-x border-slate-800 flex items-center gap-1.5">
                        <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                        Sheet1 - Self Expenses
                      </span>
                    </div>
                    <div className="flex items-center gap-4 font-mono text-[10px]">
                      <span>READY</span>
                      <span className="border-l border-slate-700 pl-3">COUNT: {filteredSelfExpenses.length}</span>
                      <span className="border-l border-slate-700 pl-3 text-emerald-400 font-bold">
                        SUM: ₹{filteredSelfTotal.toLocaleString("en-IN")}
                      </span>
                      {filteredSelfExpenses.length > 0 && (
                        <span className="border-l border-slate-700 pl-3 text-slate-300 hidden sm:inline">
                          AVERAGE: ₹{Math.round(filteredSelfTotal / filteredSelfExpenses.length).toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Record Expense Modal */}
      <RecordExpenseModal
        isOpen={isModalOpen}
        defaultExpenseType={modalDefaultType}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => loadExpenses()}
      />
    </div>
  );
}
