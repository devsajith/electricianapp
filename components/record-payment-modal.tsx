"use client";

import React, { useState, useEffect, useTransition, useRef } from "react";
import {
  Wallet,
  X,
  Check,
  AlertCircle,
  Calendar,
  IndianRupee,
  Building2,
  Smartphone,
  Banknote,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Payment } from "@/lib/types/payment";
import { recordPaymentAction } from "@/app/dashboard/payments/actions";
import { getProjectsAction, ProjectRecord } from "@/app/dashboard/projects/actions";

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  onSuccess?: (payment?: Payment) => void;
}

const PAYMENT_METHODS_OPTIONS = [
  { id: "Cash", label: "Cash", icon: Banknote, color: "text-amber-400" },
  { id: "GPay", label: "GPay", icon: Smartphone, color: "text-emerald-400" },
  { id: "Account Transfer", label: "Account Transfer", icon: Building2, color: "text-blue-400" },
] as const;

export function RecordPaymentModal(props: RecordPaymentModalProps) {
  if (!props.isOpen) return null;
  return <RecordPaymentModalContent {...props} />;
}

function RecordPaymentModalContent({
  onClose,
  defaultProjectId,
  onSuccess,
}: RecordPaymentModalProps) {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const [projectId, setProjectId] = useState<string>(defaultProjectId || "");
  const [amount, setAmount] = useState<string>("");
  const [paymentType, setPaymentType] = useState<string>("Advance");
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "GPay" | "Account Transfer">("Cash");
  const [paymentDate, setPaymentDate] = useState<string>(
    () => new Date().toISOString().split("T")[0]
  );

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const dateInputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;
    getProjectsAction().then((data) => {
      if (!isMounted) return;
      setProjects(data || []);
      if (!defaultProjectId && data && data.length > 0 && data[0].id) {
        setProjectId(data[0].id);
      }
      setLoadingProjects(false);
    });
    return () => {
      isMounted = false;
    };
  }, [defaultProjectId]);

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

    if (!paymentType.trim()) {
      setErrorMessage("Please specify the payment type (e.g. Advance, Stage 1).");
      return;
    }

    if (!paymentDate) {
      setErrorMessage("Please choose a payment date.");
      return;
    }

    setSaving(true);
    startTransition(async () => {
      try {
        const res = await recordPaymentAction({
          project_id: projectId,
          amount: numAmount,
          payment_date: paymentDate,
          method: paymentMethod,
          payment_info: paymentType.trim(),
        });

        if (res.error) {
          setErrorMessage(res.error);
          setSaving(false);
        } else {
          setSuccessMessage("Client payment recorded successfully!");
          setTimeout(() => {
            setAmount("");
            setPaymentType("Advance");
            setSaving(false);
            onSuccess?.(res.data);
            onClose();
          }, 700);
        }
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Failed to record payment.");
        setSaving(false);
      }
    });
  };

  const selectedProj = projects.find((p) => p.id === projectId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Wallet className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-white text-base leading-tight">
                Record Received Payment
              </h3>
              <p className="text-[11px] text-slate-400">
                Track payments received from clients
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
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

          {/* 1. Project Selector */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Select Client / Project <span className="text-amber-400">*</span>
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
                    {p.name} — {p.project_number} ({p.type})
                  </option>
                ))}
              </select>
            )}
            {selectedProj && (
              <p className="mt-1 text-[11px] text-slate-500">
                Client: <span className="text-slate-300 font-medium">{selectedProj.name}</span> • Place: {selectedProj.place || "N/A"}
              </p>
            )}
          </div>

          {/* 2. Amount */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Amount Received <span className="text-emerald-400">*</span>
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

          {/* 3. Payment Type (Text Box) */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              Payment Type <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              placeholder="e.g. Advance, Stage 1, Conduit stage, Final settlement"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
            />
            <p className="mt-1 text-[10px] text-slate-500">
              Type of payment received (e.g. Advance, Material Advance, Final Payment)
            </p>
          </div>

          {/* 4. Payment Method (Cash, GPay, Account Transfer) */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Payment Method <span className="text-amber-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS_OPTIONS.map((m) => {
                const isSelected = paymentMethod === m.id;
                const IconComponent = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-emerald-500/10 border-emerald-500/50 text-white shadow-sm ring-1 ring-emerald-500/30"
                        : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 mb-1 ${isSelected ? m.color : "text-slate-400"}`} />
                    <span className="truncate">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Payment Date (Date Picker) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="payment_date"
                className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                Payment Date <span className="text-amber-400">*</span>
              </label>
              <button
                type="button"
                onClick={() => setPaymentDate(new Date().toISOString().split("T")[0])}
                className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold transition-colors"
              >
                Today
              </button>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                ref={dateInputRef}
                id="payment_date"
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker?.();
                  } catch {}
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 cursor-pointer [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={saving}
              className="border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs gap-1.5 shadow-sm"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Record Payment
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
