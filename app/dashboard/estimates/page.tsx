"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  RefreshCw,
  IndianRupee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Estimate, EstimateStatus } from "@/lib/types/estimate";
import { getEstimates, updateEstimateStatus } from "@/lib/estimate-store";
import { getEstimatesAction, updateEstimateStatusAction } from "./actions";

export default function EstimatesPage() {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [, startTransition] = useTransition();

  const loadEstimates = async () => {
    setLoading(true);
    try {
      const dbData = await getEstimatesAction();
      if (dbData && dbData.length > 0) {
        setEstimates(dbData);
      } else {
        setEstimates(getEstimates());
      }
    } catch {
      setEstimates(getEstimates());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEstimates();
  }, []);

  const handleStatusChange = (id: string, status: EstimateStatus) => {
    startTransition(async () => {
      updateEstimateStatus(id, status);
      setEstimates((prev) =>
        prev.map((est) => (est.id === id ? { ...est, status } : est))
      );
      if (id && !id.startsWith("est-1")) {
        await updateEstimateStatusAction(id, status);
      }
    });
  };

  const getStatusBadgeClass = (status: EstimateStatus) => {
    switch (status) {
      case "Approved":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "Sent":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "Draft":
        return "bg-slate-700/50 text-slate-300 border-slate-600/40";
      case "Rejected":
        return "bg-red-500/10 text-red-400 border-red-500/30";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  const getAmount = (est: Estimate) => est.total ?? (est as { grand_total?: number }).grand_total ?? 0;

  // Filtered estimates list
  const filteredEstimates = estimates.filter((est) => {
    const matchesStatus =
      selectedStatus === "All" ||
      est.status.toLowerCase() === selectedStatus.toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      est.estimate_number.toLowerCase().includes(q) ||
      (est.project_name && est.project_name.toLowerCase().includes(q)) ||
      (est.description && est.description.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

  // KPI Statistics
  const totalValue = estimates.reduce((acc, curr) => acc + getAmount(curr), 0);
  const approvedTotal = estimates
    .filter((e) => e.status === "Approved")
    .reduce((acc, curr) => acc + getAmount(curr), 0);
  const pendingCount = estimates.filter((e) => e.status === "Sent").length;
  const draftCount = estimates.filter((e) => e.status === "Draft").length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-md bg-amber-500/10 text-amber-400">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Estimates & Quotations
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Draft, track, send, and convert itemized electrical project proposals.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
          <Button
            variant="outline"
            onClick={loadEstimates}
            disabled={loading}
            className="h-10 sm:h-9 text-xs border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 gap-1.5"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                loading ? "animate-spin text-amber-400" : ""
              }`}
            />
            Refresh
          </Button>
          <Link href="/dashboard/estimates/new">
            <Button className="h-10 sm:h-9 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 shadow-md">
              <Plus className="w-4 h-4" />
              <span>Create Estimate</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">
              Total Quotes
            </span>
            <IndianRupee className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-white">
            ₹{totalValue.toLocaleString("en-IN")}
          </div>
          <div className="text-[10px] text-slate-500">
            {estimates.length} total generated
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">
              Approved Total
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-emerald-400">
            ₹{approvedTotal.toLocaleString("en-IN")}
          </div>
          <div className="text-[10px] text-slate-500">Ready for scheduling</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">
              Awaiting Approval
            </span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-blue-400">
            {pendingCount} Sent
          </div>
          <div className="text-[10px] text-slate-500">Sent to clients</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">
              Drafts
            </span>
            <AlertCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-slate-200">
            {draftCount} Drafts
          </div>
          <div className="text-[10px] text-slate-500">Unsent proposals</div>
        </div>
      </div>

      {/* Main Content Area: Search, Filters & List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        {/* Search & Status Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Estimate Number or Project..."
              className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-base sm:text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {["All", "Draft", "Sent", "Approved", "Rejected"].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedStatus === status
                      ? "bg-amber-500 text-slate-950 shadow-sm font-bold"
                      : "bg-slate-950/50 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  {status}
                </button>
              )
            )}
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto rounded-xl border border-slate-800/80">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/90 border-b border-slate-800 text-[11px] uppercase tracking-wider font-bold text-slate-300">
                <th className="py-3.5 px-4">Estimate Number</th>
                <th className="py-3.5 px-4">Project</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Total Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredEstimates.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 text-center text-slate-400 text-xs"
                  >
                    No matching estimates found.
                  </td>
                </tr>
              ) : (
                filteredEstimates.map((est) => (
                  <tr
                    key={est.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Estimate Number */}
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                      {est.estimate_number}
                    </td>

                    {/* Project */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-100">
                        {est.project_name || "General Electrical Work"}
                      </div>
                      {est.description && est.description !== est.project_name && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">
                          {est.description}
                        </div>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-400">
                      {est.created_at
                        ? new Date(est.created_at).toLocaleDateString()
                        : "N/A"}
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-100 text-sm">
                      ₹{getAmount(est).toLocaleString("en-IN")}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <select
                        value={est.status}
                        onChange={(e) =>
                          handleStatusChange(
                            est.id,
                            e.target.value as EstimateStatus
                          )
                        }
                        className={`px-3 py-1 rounded-full text-xs font-bold border focus:outline-none cursor-pointer ${getStatusBadgeClass(
                          est.status
                        )}`}
                      >
                        <option
                          value="Draft"
                          className="bg-slate-900 text-slate-200"
                        >
                          Draft
                        </option>
                        <option
                          value="Sent"
                          className="bg-slate-900 text-slate-200"
                        >
                          Sent
                        </option>
                        <option
                          value="Approved"
                          className="bg-slate-900 text-slate-200"
                        >
                          Approved
                        </option>
                        <option
                          value="Rejected"
                          className="bg-slate-900 text-slate-200"
                        >
                          Rejected
                        </option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <Link href={`/dashboard/estimates/${est.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>View Quote</span>
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
