"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Wallet,
  X,
  Check,
  AlertCircle,
  Calendar,
  IndianRupee,
  Building2,
  FileText,
  CreditCard,
  Smartphone,
  Banknote,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Payment, PaymentMethod, PaymentType, PAYMENT_METHODS, PAYMENT_TYPES, PAYMENT_MILESTONES } from "@/lib/types/payment";
import { recordPaymentAction } from "@/app/dashboard/payments/actions";
import { getProjectsAction, ProjectRecord } from "@/app/dashboard/projects/actions";

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  onSuccess?: (payment?: Payment) => void;
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  defaultProjectId,
  onSuccess,
}: RecordPaymentModalProps) {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const [projectId, setProjectId] = useState<string>(defaultProjectId || "");
  const [amount, setAmount] = useState<string>("");
  const [paymentType, setPaymentType] = useState<PaymentType>("Advance");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [, startTransition] = useTransition();

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setPaymentDate(new Date().toISOString().split("T")[0]);
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
  }, [isOpen, defaultProjectId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!projectId) {
      setErrorMessage("Please select a project for this payment.");
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
        const res = await recordPaymentAction({
          project_id: projectId,
          amount: numAmount,
          payment_date: paymentDate,
          payment_method: paymentMethod,
          payment_type: paymentType,
          reference_number: referenceNumber.trim() || undefined,
          notes: notes.trim() || undefined,
        });

        if (res.error) {
          setErrorMessage(res.error);
          setSaving(false);
        } else {
          setSuccessMessage("Client payment recorded successfully!");
          setTimeout(() => {
            setAmount("");
            setReferenceNumber("");
            setNotes("");
            setSaving(false);
            onSuccess?.(res.data);
            onClose();
          }, 800);
        }
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Failed to record payment.");
        setSaving(false);
      }
    });
  };

  const selectedProj = projects.find((p) => p.id === projectId);

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "UPI":
        return <Smartphone className="w-3.5 h-3.5" />;
      case "Cash":
        return <Banknote className="w-3.5 h-3.5" />;
      case "Bank Transfer":
        return <Building2 className="w-3.5 h-3.5" />;
      case "Cheque":
        return <FileText className="w-3.5 h-3.5" />;
      case "Card":
        return <CreditCard className="w-3.5 h-3.5" />;
      default:
        return <Wallet className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Wallet className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-white text-base leading-tight">
                Record Client Payment
              </h3>
              <p className="text-[11px] text-slate-400">
                Log advances, stage settlements, or final balance received
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Project Selector */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Select Project <span className="text-amber-400">*</span>
            </label>
            {loadingProjects ? (
              <div className="h-10 bg-slate-800/50 rounded-xl animate-pulse flex items-center px-3 text-xs text-slate-500">
                Loading projects...
              </div>
            ) : (
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
              >
                <option value="">-- Choose Project --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.project_number} — {p.customer_name} ({p.project_type})
                  </option>
                ))}
              </select>
            )}
            {selectedProj && (
              <p className="mt-1 text-[11px] text-slate-500">
                Client: <span className="text-slate-300 font-medium">{selectedProj.customer_name}</span> • Phone: {selectedProj.customer_phone || "N/A"}
              </p>
            )}
          </div>

          {/* Payment Amount */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Payment Amount Received <span className="text-emerald-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400">
                <IndianRupee className="w-4 h-4" />
              </div>
              <input
                type="number"
                step="any"
                min="1"
                placeholder="e.g. 15000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-base font-bold text-emerald-400 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          {/* Payment Type Selector (Advance, Milestone, Final, Retention, Full) */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Payment Type <span className="text-amber-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PAYMENT_TYPES.map((t) => {
                const isSelected = paymentType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setPaymentType(t.id);
                      if (!notes) {
                        if (t.id === "Advance") setNotes("Advance Booking (20%)");
                        else if (t.id === "Milestone") setNotes("Rough-in / Conduiting Stage (30%)");
                        else if (t.id === "Final Settlement") setNotes("Final Testing & Handover (5%)");
                        else if (t.id === "Full Payment") setNotes("Full Settlement");
                      }
                    }}
                    className={`flex flex-col p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                      isSelected
                        ? "bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-sm"
                        : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <span className="font-bold truncate">{t.label}</span>
                    <span className="text-[10px] text-slate-500 truncate">{t.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Payment Mode / Channel
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((m) => {
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                      isSelected
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-sm"
                        : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <span className={isSelected ? "text-emerald-400" : "text-slate-400"}>
                      {getMethodIcon(m.id)}
                    </span>
                    <span className="truncate">{m.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reference / UTR / Cheque Number */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Reference / Transaction ID / Cheque No.
            </label>
            <input
              type="text"
              placeholder={
                paymentMethod === "UPI"
                  ? "e.g. UPI Ref / UTR: 4291840281"
                  : paymentMethod === "Cheque"
                  ? "e.g. Cheque No: 440192 (SBI)"
                  : paymentMethod === "Bank Transfer"
                  ? "e.g. NEFT/IMPS Ref: HDFC99281"
                  : "e.g. Receipt No / Cash voucher"
              }
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>

          {/* Milestone Quick Chips */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Milestone / Stage (Quick Select)
              </label>
              <span className="text-[10px] text-slate-500">
                Tap to fill notes
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PAYMENT_MILESTONES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setNotes(m)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                    notes === m
                      ? "bg-amber-500/20 border-amber-500/40 text-amber-300 font-semibold"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Custom Notes */}
            <textarea
              rows={2}
              placeholder="e.g. Advance 30% received for wiring materials and conduit rough-in..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 resize-none"
            />
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Payment Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="border-slate-800 text-slate-300 hover:bg-slate-800 text-xs px-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs gap-1.5 shadow-md px-5"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Record Payment</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
