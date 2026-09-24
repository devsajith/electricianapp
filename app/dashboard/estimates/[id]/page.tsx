"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  CheckCircle2,
  XCircle,
  Send,
  Building2,
  Calendar,
  FileCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Estimate, EstimateStatus, EstimateItem } from "@/lib/types/estimate";
import { getEstimateById, updateEstimateStatus } from "@/lib/estimate-store";
import { getEstimateByIdAction, updateEstimateStatusAction } from "../actions";

export default function EstimateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchEstimate = async () => {
      setLoading(true);
      try {
        const dbData = await getEstimateByIdAction(resolvedParams.id);
        if (isMounted && dbData) {
          setEstimate(dbData);
          setLoading(false);
          return;
        }
      } catch {
        // Ignore DB error and fallback to local store
      }
      if (isMounted) {
        setEstimate(getEstimateById(resolvedParams.id));
        setLoading(false);
      }
    };
    fetchEstimate();
    return () => {
      isMounted = false;
    };
  }, [resolvedParams.id]);

  const handleStatusUpdate = async (newStatus: EstimateStatus) => {
    if (!estimate) return;
    updateEstimateStatus(estimate.id, newStatus);
    setEstimate({ ...estimate, status: newStatus });
    if (estimate.id && !estimate.id.startsWith("est-1")) {
      await updateEstimateStatusAction(estimate.id, newStatus);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-400 text-xs">
        Loading estimate details...
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-200">Estimate Not Found</h2>
        <p className="text-xs text-slate-400">
          The requested estimate proposal does not exist or has been removed.
        </p>
        <Link href="/dashboard/estimates">
          <Button variant="outline" className="text-xs border-slate-700">
            Back to Estimates
          </Button>
        </Link>
      </div>
    );
  }

  const getStatusBadgeClass = (status: EstimateStatus) => {
    switch (status) {
      case "Approved":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "Sent":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "Draft":
        return "bg-slate-700/50 text-slate-300 border-slate-600/40";
      case "Rejected":
        return "bg-red-500/10 text-red-400 border-red-500/30";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  // Safe fallback for work items
  const displayItems: EstimateItem[] = estimate.items || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Quick Action Toolbar */}
      <div className="print:hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div>
          <Link
            href="/dashboard/estimates"
            className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:underline mb-2 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Estimates
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight font-mono">
              {estimate.estimate_number}
            </h1>
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-bold border ${getStatusBadgeClass(
                estimate.status
              )}`}
            >
              {estimate.status}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            onClick={handlePrint}
            variant="outline"
            className="h-9 text-xs border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Print Quote</span>
          </Button>

          {estimate.status === "Draft" && (
            <Button
              onClick={() => handleStatusUpdate("Sent")}
              className="h-9 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Mark as Sent</span>
            </Button>
          )}

          {estimate.status !== "Approved" && (
            <Button
              onClick={() => handleStatusUpdate("Approved")}
              className="h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve</span>
            </Button>
          )}

          {estimate.status === "Approved" && (
            <Button
              onClick={() => {
                router.push("/dashboard/projects");
              }}
              className="h-9 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>View Projects</span>
            </Button>
          )}

          {estimate.status !== "Rejected" && (
            <Button
              onClick={() => handleStatusUpdate("Rejected")}
              variant="outline"
              className="h-9 text-xs border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reject</span>
            </Button>
          )}
        </div>
      </div>

      {/* Printable Invoice & Proposal Document */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-sm space-y-8 print:bg-white print:text-slate-900 print:border-none print:shadow-none print:p-0">
        {/* Company Header & Quote Title */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6 border-b border-slate-800 print:border-slate-300 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-amber-500 text-slate-950 font-extrabold text-sm flex items-center justify-center">
                <Zap className="w-4 h-4 fill-current" />
              </span>
              <span className="text-xl font-extrabold text-white print:text-slate-900 tracking-tight">
                Electrician App Contracting
              </span>
            </div>
            <p className="text-xs text-slate-400 print:text-slate-600">
              Licensed & Insured Electrical Services
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <h2 className="text-2xl font-black text-amber-400 print:text-amber-600 tracking-tight uppercase">
              Project Estimate
            </h2>
            <div className="text-xs text-slate-300 print:text-slate-700 font-mono">
              Quote #: <strong>{estimate.estimate_number}</strong>
            </div>
            {estimate.created_at && (
              <div className="text-xs text-slate-400 print:text-slate-600 flex items-center sm:justify-end gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span suppressHydrationWarning>
                  Date: {new Date(estimate.created_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Project Details */}
        <div className="bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-xl p-5 space-y-2">
          <h3 className="text-xs font-bold text-amber-400 print:text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            Project Specification
          </h3>
          <div className="text-sm font-bold text-slate-100 print:text-slate-900">
            {estimate.project_name || "General Electrical Work"}
          </div>
          {estimate.description && (
            <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed pt-1">
              {estimate.description}
            </p>
          )}
        </div>

        {/* Work Items Breakdown Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 print:text-slate-900 uppercase tracking-wider">
            Work Items & Cost Breakdown
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-slate-300">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 print:bg-slate-100 border-b border-slate-800 print:border-slate-300 text-[11px] uppercase tracking-wider font-bold text-slate-400 print:text-slate-700">
                  <th className="py-3 px-4 w-5/12">Description</th>
                  <th className="py-3 px-4 text-center w-2/12">Qty</th>
                  <th className="py-3 px-4 text-center w-2/12">Unit</th>
                  <th className="py-3 px-4 text-right w-2/12">Rate (₹)</th>
                  <th className="py-3 px-4 text-right w-2/12">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 print:divide-slate-200 text-xs text-slate-200 print:text-slate-800">
                {displayItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      No work items listed.
                    </td>
                  </tr>
                ) : (
                  displayItems.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-800/20">
                      <td className="py-3 px-4 font-semibold">
                        {item.description}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {item.qty}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-400 print:text-slate-600">
                        {item.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400 print:text-slate-700">
                        ₹{(item.rate || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-100 print:text-slate-900">
                        ₹{(item.amount || 0).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Totals Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t border-slate-800 print:border-slate-300 pt-6">
          <div className="w-full sm:w-1/2 space-y-4">
            {estimate.terms_conditions && (
              <div className="p-4 rounded-xl bg-slate-950/60 print:bg-slate-50 border border-slate-800/80 print:border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-amber-400 print:text-amber-700 uppercase tracking-wider block">
                  Terms & Conditions
                </span>
                <p className="text-xs text-slate-300 print:text-slate-700 whitespace-pre-line leading-relaxed">
                  {estimate.terms_conditions}
                </p>
              </div>
            )}
          </div>

          <div className="w-full sm:w-72 p-5 rounded-xl bg-slate-950/80 print:bg-slate-100 border border-slate-800 print:border-slate-300 space-y-3 text-xs">
            <div className="flex justify-between text-slate-400 print:text-slate-700">
              <span>Subtotal:</span>
              <span className="font-mono text-slate-200 print:text-slate-900 font-bold">
                ₹{(estimate.subtotal || 0).toLocaleString("en-IN")}
              </span>
            </div>

            {estimate.discount > 0 && (
              <div className="flex justify-between text-emerald-400 print:text-emerald-700">
                <span>Discount:</span>
                <span className="font-mono font-bold">
                  -₹{(estimate.discount || 0).toLocaleString("en-IN")}
                </span>
              </div>
            )}

            {estimate.tax > 0 && (
              <div className="flex justify-between text-slate-400 print:text-slate-700">
                <span>Tax:</span>
                <span className="font-mono text-slate-300 print:text-slate-800">
                  +₹{(estimate.tax || 0).toLocaleString("en-IN")}
                </span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 print:border-slate-300 flex justify-between items-center">
              <span className="font-bold text-white print:text-slate-900 uppercase text-xs">
                Total Amount:
              </span>
              <span className="text-xl font-extrabold text-amber-400 print:text-amber-600 font-mono">
                ₹{(estimate.total || 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
