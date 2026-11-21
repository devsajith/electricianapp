"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";
import { ToastItem, toastStore, toast } from "@/lib/toast";

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubscribe = toastStore.subscribe((list) => {
      setToasts(list);
    });
    return () => unsubscribe();
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-2 sm:p-0"
    >
      {toasts.map((t) => {
        let borderColor = "border-slate-200 dark:border-slate-800";
        let bgColor = "bg-white dark:bg-slate-900";
        let icon = <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />;
        let titleColor = "text-slate-900 dark:text-white";
        let indicatorColor = "bg-blue-500";

        if (t.type === "success") {
          borderColor = "border-emerald-300 dark:border-emerald-500/40";
          bgColor = "bg-emerald-50/90 dark:bg-[#121f18]";
          icon = (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          );
          indicatorColor = "bg-emerald-500";
        } else if (t.type === "error") {
          borderColor = "border-rose-300 dark:border-rose-500/40";
          bgColor = "bg-rose-50/90 dark:bg-[#221316]";
          icon = (
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          );
          indicatorColor = "bg-rose-500";
        } else if (t.type === "warning") {
          borderColor = "border-amber-300 dark:border-amber-500/40";
          bgColor = "bg-amber-50/90 dark:bg-[#211a12]";
          icon = (
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          );
          indicatorColor = "bg-amber-500";
        } else if (t.type === "info") {
          borderColor = "border-blue-300 dark:border-blue-500/40";
          bgColor = "bg-blue-50/90 dark:bg-[#121926]";
          icon = (
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
          );
          indicatorColor = "bg-blue-500";
        }

        return (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-lg backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-top-3 ${bgColor} ${borderColor}`}
          >
            <div className="pt-0.5">{icon}</div>

            <div className="flex-1 min-w-0 pr-1">
              {t.title && (
                <h5 className={`text-xs font-bold ${titleColor} truncate mb-0.5`}>
                  {t.title}
                </h5>
              )}
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-snug break-words">
                {t.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => toast.dismiss(t.id)}
              aria-label="Close notification"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
