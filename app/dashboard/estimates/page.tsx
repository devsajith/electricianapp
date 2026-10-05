"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
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
  MapPin,
  FileSpreadsheet,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Quotation, QuotationStatus } from "@/lib/types/quotation";
import { getQuotationsAction, updateQuotationStatusAction } from "./actions";

export default function EstimatesPage() {
  const [estimates, setEstimates] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [, startTransition] = useTransition();

  const loadEstimates = useCallback(async () => {
    setLoading(true);
    try {
      const dbData = await getQuotationsAction();
      setEstimates(dbData || []);
    } catch {
      setEstimates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    getQuotationsAction()
      .then((dbData) => {
        if (isMounted) {
          setEstimates(dbData || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setEstimates([]);
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleStatusChange = (id: string, status: QuotationStatus) => {
    startTransition(async () => {
      setEstimates((prev) =>
        prev.map((est) => (est.id === id ? { ...est, status } : est))
      );
      if (id && !id.startsWith("est-1")) {
        await updateQuotationStatusAction(id, status);
      }
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-emerald-950/80 text-emerald-400 border-emerald-500/40";
      case "Sent":
        return "bg-blue-950/80 text-blue-400 border-blue-500/40";
      case "Draft":
        return "bg-slate-800 text-slate-300 border-slate-700";
      case "Rejected":
        return "bg-rose-950/80 text-rose-400 border-rose-500/40";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  // Filtered estimates list
  const filteredEstimates = estimates.filter((est) => {
    const matchesStatus =
      selectedStatus === "All" ||
      est.status.toLowerCase() === selectedStatus.toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      est.quotation_number.toLowerCase().includes(q) ||
      (est.client_name && est.client_name.toLowerCase().includes(q)) ||
      (est.description && est.description.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

  // KPI Statistics
  const pendingCount = estimates.filter((e) => e.status === "Sent").length;
  const draftCount = estimates.filter((e) => e.status === "Draft").length;
  const approvedCount = estimates.filter((e) => e.status === "Approved").length;

  const exportToCsv = () => {
    if (filteredEstimates.length === 0) return;
    const headers = ["Row", "Quote #", "Date", "Client", "Place", "Phone", "Quoted Rate", "Unit", "Status"];
    const rows = filteredEstimates.map((est, idx) => {
      const client = est.client_name || "Client";
      const place = est.client_place || "—";
      const unitStr = est.unit || "Squarefeet";
      const rateVal = est.rate || 0;
      const dateStr = est.created_at ? new Date(est.created_at).toLocaleDateString() : "N/A";
      return [
        idx + 1,
        `"${est.quotation_number}"`,
        `"${dateStr}"`,
        `"${client.replace(/"/g, '""')}"`,
        `"${place.replace(/"/g, '""')}"`,
        `"${(est.client_phone || "").replace(/"/g, '""')}"`,
        rateVal,
        `"${unitStr.replace(/"/g, '""')}"`,
        `"${est.status}"`,
      ];
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Quotations_Register_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-md bg-amber-500/10 text-amber-400">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Quotations
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Draft, track, send, and convert electrical project proposals.
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
            <Button className="h-10 sm:h-9 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 shadow-sm">
              <Plus className="w-4 h-4" />
              <span>Create Quotation</span>
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
            <FileText className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-white">
            {estimates.length}
          </div>
          <div className="text-[10px] text-slate-500">
            total generated
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">
              Approved
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-emerald-400">
            {approvedCount}
          </div>
          <div className="text-[10px] text-slate-500">Ready for scheduling</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">
              Awaiting Approval
            </span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-white">
            {pendingCount}
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
            {draftCount}
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
              placeholder="Search by Quote Number or Client..."
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

        {/* Excel Spreadsheet Container */}
        <div className="rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950">
          {/* Excel Green Ribbon Bar */}
          <div className="bg-[#107c41] px-4 py-2 flex flex-wrap items-center justify-between text-white border-b border-emerald-800 text-xs">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span className="font-bold tracking-wide">Quotations_Register.xlsx</span>
              <span className="bg-emerald-900/60 text-emerald-200 text-[10px] px-2 py-0.5 rounded font-mono font-semibold">
                AutoSave [ON]
              </span>
              <span className="text-[11px] text-emerald-100 hidden sm:inline ml-2">
                Showing {filteredEstimates.length} of {estimates.length} quotations
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportToCsv}
                className="flex items-center gap-1.5 px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded font-medium text-xs shadow-sm transition-colors border border-emerald-600"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Excel (.CSV)</span>
              </button>
            </div>
          </div>

          {filteredEstimates.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <FileText className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm font-semibold text-slate-300">No matching quotations found</p>
              <p className="text-xs text-slate-500">Try adjusting your status or search filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-700">
                    <th className="py-2 px-3 w-12 text-center border-r border-slate-700/80 bg-slate-900/90 text-slate-500 font-mono select-none">
                      ◢
                    </th>
                    <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold w-36">
                      <div className="text-[10px] text-emerald-400 font-mono">A</div>
                      QUOTE #
                    </th>
                    <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold">
                      <div className="text-[10px] text-emerald-400 font-mono">B</div>
                      CLIENT & PLACE
                    </th>
                    <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold w-48">
                      <div className="text-[10px] text-emerald-400 font-mono">C</div>
                      QUOTED RATE
                    </th>
                    <th className="py-2.5 px-4 border-r border-slate-700/80 font-bold text-center w-36">
                      <div className="text-[10px] text-emerald-400 font-mono">D</div>
                      STATUS
                    </th>
                    <th className="py-2.5 px-4 font-bold text-center w-28">
                      <div className="text-[10px] text-emerald-400 font-mono">E</div>
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs font-mono">
                  {filteredEstimates.map((est, idx) => {
                    const client = est.client_name || "Client";
                    const place = est.client_place || "—";
                    const unitStr = est.unit || "Sq.Ft";
                    const rateVal = est.rate || 0;

                    return (
                      <tr
                        key={est.id}
                        className="hover:bg-emerald-500/10 transition-colors group border-b border-slate-800/80"
                      >
                        <td className="py-2.5 px-3 text-center bg-slate-900/70 border-r border-slate-800 text-slate-400 select-none text-[11px] font-mono group-hover:text-emerald-400 group-hover:bg-emerald-950/30">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-4 border-r border-slate-800">
                          <div className="font-mono font-bold text-emerald-400">
                            {est.quotation_number}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {est.created_at ? new Date(est.created_at).toLocaleDateString() : "N/A"}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 border-r border-slate-800 font-sans">
                          <div className="font-bold text-slate-100">
                            {client}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="truncate max-w-[240px]">{place}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 border-r border-slate-800">
                          {rateVal > 0 ? (
                            <div>
                              <span className="font-mono font-extrabold text-emerald-400 text-sm">
                                ₹{rateVal}
                              </span>
                              <span className="text-[11px] text-slate-400 ml-1.5 font-medium font-sans">
                                / {unitStr.toLowerCase().includes("meter") ? "meter" : "sq.ft"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500 font-sans">Custom</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 border-r border-slate-800 text-center font-sans">
                          <select
                            value={est.status}
                            onChange={(e) =>
                              handleStatusChange(
                                est.id,
                                e.target.value as QuotationStatus
                              )
                            }
                            className={`px-3 py-1 rounded text-xs font-bold border focus:outline-none cursor-pointer ${getStatusBadgeClass(
                              est.status
                            )}`}
                          >
                            <option value="Draft" className="bg-slate-900 text-slate-200">Draft</option>
                            <option value="Sent" className="bg-slate-900 text-slate-200">Sent</option>
                            <option value="Approved" className="bg-slate-900 text-slate-200">Approved</option>
                            <option value="Rejected" className="bg-slate-900 text-slate-200">Rejected</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-4 text-center font-sans">
                          <Link href={`/dashboard/estimates/${est.id}`}>
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-1 rounded px-2.5 shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
