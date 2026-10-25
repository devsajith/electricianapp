"use client";

import React, { useState } from "react";
import {
  X,
  IndianRupee,
  Calendar as CalendarIcon,
  CreditCard,
  Building2,
  FileText,
  Loader2,
  AlertCircle,
  Wallet,
} from "lucide-react";
import { Labour } from "@/lib/types/labour";
import { ProjectRecord } from "@/app/dashboard/projects/actions";
import { Button } from "@/components/ui/button";

interface LabourPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: Labour;
  projects: ProjectRecord[];
  onSavePayment: (paymentData: {
    amount: number;
    date: string;
    projectId?: string;
    projectName?: string;
    paymentMethod: string;
    notes?: string;
  }) => Promise<void>;
}

const QUICK_AMOUNTS = [500, 1000, 2000, 3000, 5000];

export function LabourPaymentModal({
  isOpen,
  onClose,
  worker,
  projects,
  onSavePayment,
}: LabourPaymentModalProps) {
  const todayStr = new Date().toISOString().split("T")[0];

  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>(todayStr);
  const [projectId, setProjectId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [notes, setNotes] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setErrorMsg("Please enter a valid payment amount.");
      return;
    }

    if (!date) {
      setErrorMsg("Please choose a payment date.");
      return;
    }

    setIsSaving(true);

    try {
      const selectedProj = projects.find((p) => p.id === projectId);
      const projectName = selectedProj
        ? `${selectedProj.name}${selectedProj.place ? ` (${selectedProj.place})` : ""}`
        : "Direct Wage";

      await onSavePayment({
        amount: numAmount,
        date,
        projectId: projectId || undefined,
        projectName,
        paymentMethod,
        notes: notes.trim() || undefined,
      });

      setAmount("");
      setNotes("");
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to record wage payment.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#181a20] border-t sm:border border-[#2a2d36] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 shadow-2xl max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#282b35]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1a73e8]/15 text-[#8ab4f8] border border-[#1a73e8]/30 flex items-center justify-center font-bold text-lg shadow-sm">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base leading-tight">
                Pay Worker / Record Wage
              </h3>
              <p className="text-xs text-slate-400">
                Worker: <strong className="text-white">{worker.name}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-blue-400" />
              <span>Wage Amount to Pay (₹)</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-emerald-400">
                ₹
              </span>
              <input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                className="w-full pl-11 pr-4 py-3 bg-[#121317] border border-[#2d303a] rounded-2xl text-2xl font-bold font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            {/* Quick Amount Pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {QUICK_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(String(val))}
                  className="px-2.5 py-1 rounded-xl text-xs font-semibold font-mono bg-[#14151a] hover:bg-[#20222b] text-slate-300 hover:text-white border border-[#262834] transition-colors"
                >
                  ₹{val.toLocaleString("en-IN")}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Date & Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>Date Paid</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#121317] border border-[#2d303a] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                <span>Payment Mode</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#121317] border border-[#2d303a] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="Cash">Cash</option>
                <option value="UPI / Google Pay">UPI / Google Pay</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          {/* Linked Project (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Charge to Project (Optional)</span>
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#121317] border border-[#2d303a] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">General / Direct Wage (No Project)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.place ? `(${p.place})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Notes / Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Note / Reference (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Weekly settlement, food advance..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#121317] border border-[#2d303a] rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 h-11 rounded-2xl bg-[#1a73e8] hover:bg-[#1557bf] text-white font-bold text-sm shadow-md shadow-[#1a73e8]/30 transition-all flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Recording Payment...</span>
                </>
              ) : (
                <>
                  <IndianRupee className="w-4 h-4" />
                  <span>
                    Confirm Payment {amount ? `₹${Number(amount).toLocaleString("en-IN")}` : ""}
                  </span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
