"use client";

import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#181a20] rounded-2xl border border-slate-200 dark:border-[#282b35] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  variant === "danger"
                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25"
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25"
                }`}
              >
                {variant === "danger" ? (
                  <Trash2 className="w-5 h-5 stroke-[2.2]" />
                ) : (
                  <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  {title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Action confirmation
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#121316] border border-slate-200 dark:border-[#24262f] text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {description}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={onClose}
              className="rounded-xl font-bold text-xs"
            >
              {cancelLabel}
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={isLoading}
              onClick={onConfirm}
              className={`rounded-xl font-bold text-xs shadow-sm active:scale-95 transition-all ${
                variant === "danger"
                  ? "bg-rose-600 hover:bg-rose-500 text-white"
                  : "bg-amber-500 hover:bg-amber-400 text-slate-950"
              }`}
            >
              {isLoading ? "Processing..." : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
