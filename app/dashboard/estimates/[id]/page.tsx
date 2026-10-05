"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Send,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Quotation, QuotationStatus } from "@/lib/types/quotation";
import { getQuotationByIdAction, updateQuotationStatusAction, deleteQuotationAction } from "../actions";

export default function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchQuotation = async () => {
      try {
        const dbData = await getQuotationByIdAction(resolvedParams.id);
        if (isMounted) {
          setQuotation(dbData);
          setLoading(false);
        }
      } catch {
        if (isMounted) setLoading(false);
      }
    };
    fetchQuotation();
    return () => {
      isMounted = false;
    };
  }, [resolvedParams.id]);

  const handleStatusUpdate = async (newStatus: QuotationStatus) => {
    if (!quotation) return;
    setQuotation({ ...quotation, status: newStatus });
    await updateQuotationStatusAction(quotation.id, newStatus);
  };

  const handleDelete = async () => {
    if (!quotation || !confirm("Are you sure you want to delete this quotation?")) return;
    await deleteQuotationAction(quotation.id);
    router.push("/dashboard/estimates");
  };

  if (loading) {
    return <div className="py-16 text-center text-slate-400 text-xs">Loading quotation details...</div>;
  }

  if (!quotation) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-200">Quotation Not Found</h2>
        <Link href="/dashboard/estimates">
          <Button variant="outline" className="text-xs border-slate-700">
            Back to Quotations
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/estimates">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Status:</span>
            <span className="px-3 py-1 rounded-full text-xs font-bold border bg-slate-800 text-slate-300">
              {quotation.status}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {quotation.status === "Draft" && (
            <Button onClick={() => handleStatusUpdate("Sent")} size="sm" className="bg-blue-600 text-white">
              <Send className="w-4 h-4 mr-1.5" /> Mark as Sent
            </Button>
          )}
          {quotation.status !== "Approved" && (
            <Button onClick={() => handleStatusUpdate("Approved")} size="sm" className="bg-emerald-600 text-white">
              <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve
            </Button>
          )}
          {quotation.status !== "Rejected" && (
            <Button onClick={() => handleStatusUpdate("Rejected")} size="sm" variant="outline" className="text-rose-400 border-rose-500/30">
              <XCircle className="w-4 h-4 mr-1.5" /> Reject
            </Button>
          )}
          <Button onClick={handleDelete} size="sm" variant="outline" className="text-rose-500 border-rose-500/30 ml-auto">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Details View */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-8">
        <div className="flex justify-between items-start border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-black text-white">{quotation.quotation_number}</h1>
            <p className="text-sm text-slate-400 mt-1">
              Created: {new Date(quotation.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-400">Rate</p>
            <p className="text-2xl font-bold text-amber-400">₹{quotation.rate} <span className="text-sm text-slate-400">/ {quotation.unit}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">Client Details</h3>
            <p className="text-base font-bold text-slate-200">{quotation.client_name}</p>
            <p className="text-sm text-slate-400">{quotation.client_phone}</p>
            <p className="text-sm text-slate-400">{quotation.client_place}</p>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">Scope & Terms</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400">Description</p>
                <p className="text-sm text-slate-200">{quotation.description || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Terms</p>
                <p className="text-sm text-slate-200">{quotation.terms || "N/A"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
