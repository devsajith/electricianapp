"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import Link from "next/link";
import {
  Receipt,
  Plus,
  Search,
  RefreshCw,
  Trash2,
  FileText,
  Briefcase,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Expense, ExpenseType } from "@/lib/types/expense";
import { getExpensesAction, deleteExpenseAction } from "./actions";
import { RecordExpenseModal } from "@/components/record-expense-modal";
import { ExpensesPageSkeleton } from "@/components/table-skeleton";
import { generateExpensesPdf } from "@/lib/utils/pdf-generator";
import { toast } from "@/lib/toast";

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
    try {
      const res = await getExpensesAction();
      setExpenses(res.data || []);
    } catch (e) {
      console.error("Error loading expenses:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    getExpensesAction()
      .then((res) => {
        if (isMounted) {
          setExpenses(res.data || []);
          setLoading(false);
        }
      })
      .catch((e) => {
        console.error("Error loading expenses:", e);
        if (isMounted) {
          setExpenses([]);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
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
      (exp.place && exp.place.toLowerCase().includes(q)) ||
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

  // Download Project Expenses PDF
  const downloadProjectPdf = () => {
    if (filteredProjectExpenses.length === 0) {
      toast.warning("No project expenses to download.");
      return;
    }
    try {
      generateExpensesPdf({
        title: "Project Expenses Ledger",
        category: "project",
        expenses: filteredProjectExpenses.map((exp) => ({
          date: exp.date,
          project_name: exp.name,
          place: exp.place,
          project_number: exp.project_number,
          description: exp.description || "",
          amount: Number(exp.amount) || 0,
        })),
      });
      toast.success("Project expenses PDF downloaded successfully!");
    } catch (e) {
      console.error("PDF generation error:", e);
      toast.error("Failed to generate project expenses PDF.");
    }
  };

  // Download Self Expenses PDF
  const downloadSelfPdf = () => {
    if (filteredSelfExpenses.length === 0) {
      toast.warning("No self expenses to download.");
      return;
    }
    try {
      generateExpensesPdf({
        title: "Self & Overhead Expenses Ledger",
        category: "self",
        expenses: filteredSelfExpenses.map((exp) => ({
          date: exp.date,
          description: exp.description || "",
          amount: Number(exp.amount) || 0,
        })),
      });
      toast.success("Self expenses PDF downloaded successfully!");
    } catch (e) {
      console.error("PDF generation error:", e);
      toast.error("Failed to generate self expenses PDF.");
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

      {/* KPI Stats Cards - Project Expenses & Self Expenses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
            placeholder="Search expenses by description, client name, place..."
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

      {loading && expenses.length === 0 ? (
        <ExpensesPageSkeleton />
      ) : (
        <div className="space-y-8">
          {/* ======================================================== */}
          {/* TABLE 1: PROJECT-BASED EXPENSES TABLE */}
          {/* ======================================================== */}
          {(activeFilter === "all" || activeFilter === "project") && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 px-1">
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

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={downloadProjectPdf}
                    variant="outline"
                    size="sm"
                    className="h-8 bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 text-xs font-semibold gap-1.5 shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5 text-rose-400" />
                    <span>Download PDF</span>
                  </Button>

                  <Button
                    onClick={() => openRecordModal("project")}
                    size="sm"
                    className="h-8 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold gap-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Project Expense</span>
                  </Button>
                </div>
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
                <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-sm bg-slate-950">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[750px]">
                      <thead>
                        <tr className="bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-800">
                          <th className="py-2.5 px-3 w-12 text-center border-r border-slate-800 bg-slate-900/90 text-slate-500 font-mono select-none">
                            #
                          </th>
                          <th className="py-2.5 px-4 border-r border-slate-800 font-bold w-32">
                            DATE
                          </th>
                          <th className="py-2.5 px-4 border-r border-slate-800 font-bold w-52">
                            PROJECT &amp; CUSTOMER
                          </th>
                          <th className="py-2.5 px-4 border-r border-slate-800 font-bold">
                            DESCRIPTION / PURPOSE
                          </th>
                          <th className="py-2.5 px-4 border-r border-slate-800 font-bold text-right w-36">
                            AMOUNT (₹)
                          </th>
                          <th className="py-2.5 px-3 font-bold text-center w-16">
                            ACTION
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-xs font-mono">
                        {filteredProjectExpenses.map((exp, idx) => (
                          <tr
                            key={exp.id}
                            className="hover:bg-slate-900/70 transition-colors group border-b border-slate-800/80"
                          >
                            <td className="py-2.5 px-3 text-center bg-slate-900/50 border-r border-slate-800 text-slate-400 select-none text-[11px] font-mono group-hover:text-amber-400">
                              {idx + 1}
                            </td>

                            <td className="py-2.5 px-4 border-r border-slate-800 text-slate-300">
                              {exp.date}
                            </td>

                            <td className="py-2.5 px-4 border-r border-slate-800 font-sans">
                              <Link
                                href={exp.project_id ? `/dashboard/projects/${exp.project_id}` : "/dashboard/projects"}
                                className="font-bold text-white hover:text-amber-400 transition-colors block"
                              >
                                <span>{exp.name || "Project"}</span>
                                {exp.place && (
                                  <span className="text-slate-400 text-xs font-normal ml-1.5">
                                    ({exp.place})
                                  </span>
                                )}
                              </Link>
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
                    </table>
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
              <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                      <span>Self &amp; Overhead Expenses</span>
                      <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Total: ₹{filteredSelfTotal.toLocaleString("en-IN")}
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Personal draws, shop electricity, van diesel, crew tea/snacks, and general tools.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={downloadSelfPdf}
                    variant="outline"
                    size="sm"
                    className="h-8 bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 text-xs font-semibold gap-1.5 shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5 text-rose-400" />
                    <span>Download PDF</span>
                  </Button>

                  <Button
                    onClick={() => openRecordModal("self")}
                    size="sm"
                    className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Self Expense</span>
                  </Button>
                </div>
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
                <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-sm bg-slate-950">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-800">
                          <th className="py-2.5 px-3 w-12 text-center border-r border-slate-800 bg-slate-900/90 text-slate-500 font-mono select-none">
                            #
                          </th>
                          <th className="py-2.5 px-4 border-r border-slate-800 font-bold w-32">
                            DATE
                          </th>
                          <th className="py-2.5 px-4 border-r border-slate-800 font-bold">
                            DESCRIPTION / PURPOSE
                          </th>
                          <th className="py-2.5 px-4 border-r border-slate-800 font-bold text-right w-36">
                            AMOUNT (₹)
                          </th>
                          <th className="py-2.5 px-3 font-bold text-center w-16">
                            ACTION
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-xs font-mono">
                        {filteredSelfExpenses.map((exp, idx) => (
                          <tr
                            key={exp.id}
                            className="hover:bg-slate-900/70 transition-colors group border-b border-slate-800/80"
                          >
                            <td className="py-2.5 px-3 text-center bg-slate-900/50 border-r border-slate-800 text-slate-400 select-none text-[11px] font-mono group-hover:text-emerald-400">
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
                    </table>
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
