"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Send,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Estimate, EstimateStatus } from "@/lib/types/estimate";
import { getEstimateById, updateEstimateStatus } from "@/lib/estimate-store";
import { getEstimateByIdAction, updateEstimateStatusAction } from "../actions";
import { QuotationPdfPreview } from "@/components/estimates/quotation-pdf-preview";

export default function EstimateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [estimate, setEstimate] = useState<Estimate | null>(() =>
    getEstimateById(resolvedParams.id)
  );
  const [loading, setLoading] = useState(!estimate);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 2500);

    const fetchEstimate = async () => {
      try {
        const dbData = await getEstimateByIdAction(resolvedParams.id);
        clearTimeout(timer);
        if (isMounted && dbData) {
          setEstimate(dbData);
          setLoading(false);
          return;
        }
      } catch {
        // Ignore DB error and fallback to local store
      }
      if (isMounted) {
        clearTimeout(timer);
        setEstimate(getEstimateById(resolvedParams.id));
        setLoading(false);
      }
    };
    fetchEstimate();
    return () => {
      isMounted = false;
      clearTimeout(timer);
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

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-400 text-xs">
        Loading quotation details...
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-200">Quotation Not Found</h2>
        <p className="text-xs text-slate-400">
          The requested quotation proposal does not exist or has been removed.
        </p>
        <Link href="/dashboard/estimates">
          <Button variant="outline" className="text-xs border-slate-700">
            Back to Estimates
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Status Management Toolbar */}
      <div className="print:hidden max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/estimates">
            <Button
              variant="outline"
              size="xs"
              className="border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Back
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Status:</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                estimate.status === "Approved"
                  ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/40"
                  : estimate.status === "Sent"
                  ? "bg-blue-950/80 text-blue-400 border-blue-500/40"
                  : estimate.status === "Rejected"
                  ? "bg-rose-950/80 text-rose-400 border-rose-500/40"
                  : "bg-slate-800 text-slate-300 border-slate-700"
              }`}
            >
              {estimate.status}
            </span>
          </div>
        </div>

        {/* Status Transition Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {estimate.status === "Draft" && (
            <Button
              onClick={() => handleStatusUpdate("Sent")}
              size="xs"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Mark as Sent</span>
            </Button>
          )}

          {estimate.status !== "Approved" && (
            <Button
              onClick={() => handleStatusUpdate("Approved")}
              size="xs"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve</span>
            </Button>
          )}

          {estimate.status === "Approved" && (
            <Button
              onClick={() => router.push("/dashboard/projects")}
              size="xs"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold gap-1.5 shadow-sm"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>View Projects</span>
            </Button>
          )}

          {estimate.status !== "Rejected" && (
            <Button
              onClick={() => handleStatusUpdate("Rejected")}
              variant="outline"
              size="xs"
              className="border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reject</span>
            </Button>
          )}
        </div>
      </div>

      {/* Embedded Authentic PDF Quotation View */}
      <QuotationPdfPreview estimate={estimate} isModal={false} />
    </div>
  );
}
