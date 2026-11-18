"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Users, Calendar, Receipt } from "lucide-react";
import { HeaderSlot } from "@/components/header-context";

export function LabourDetailSkeleton({ showHeaderSlot = true }: { showHeaderSlot?: boolean }) {
  return (
    <>
      {showHeaderSlot && (
        <HeaderSlot>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Link
              href="/dashboard/labour"
              aria-label="Back to Labour"
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            {/* Shimmering Avatar Circle */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-800 animate-pulse shrink-0 ring-1 ring-slate-700/60" />

            {/* Shimmering Worker Info */}
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-4 sm:h-5 w-32 sm:w-40 bg-slate-800 rounded-md animate-pulse" />
                <div className="hidden sm:block h-4 w-16 bg-amber-500/10 border border-amber-500/20 rounded-full animate-pulse" />
              </div>
              <div className="h-3 w-36 sm:w-48 bg-slate-800/60 rounded animate-pulse" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
            <div className="h-8 w-24 rounded-full bg-slate-800 animate-pulse" />
          </div>
        </HeaderSlot>
      )}

      <div className="max-w-4xl lg:max-w-5xl mx-auto flex flex-col relative pb-8 md:pb-6 select-none space-y-4">
        {/* Toggle Pills Skeleton */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl mb-1 shadow-sm">
          <div className="h-8 flex-1 rounded-xl bg-slate-800/70 animate-pulse" />
          <div className="h-8 flex-1 rounded-xl bg-slate-800/40 animate-pulse" />
        </div>

        {/* Summary Card Skeleton */}
        <div className="p-4 rounded-2xl bg-[#181a20] border border-[#282b35] shadow-md flex items-center justify-between gap-3">
          <div className="space-y-2">
            <div className="h-3.5 w-24 bg-slate-800 rounded animate-pulse" />
            <div className="flex items-center gap-2 flex-wrap">
              <div className="h-6 w-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 animate-pulse" />
              <div className="h-6 w-24 rounded-full bg-amber-500/10 border border-amber-500/20 animate-pulse" />
            </div>
          </div>
          <div className="h-8 w-28 rounded-xl bg-slate-800 animate-pulse" />
        </div>

        {/* Calendar / Ledger Skeleton */}
        <div className="p-4 rounded-2xl bg-[#181a20] border border-[#282b35] shadow-sm space-y-3 animate-pulse">
          <div className="flex items-center justify-between pb-2 border-b border-[#282b35]">
            <div className="h-4 w-32 bg-slate-800 rounded" />
            <div className="h-6 w-20 bg-slate-800 rounded-lg" />
          </div>
          <div className="grid grid-cols-7 gap-1.5 pt-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-10 rounded-xl bg-slate-800/40" />
            ))}
          </div>
        </div>

        {/* Bottom Bar Skeleton */}
        <div className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent pointer-events-none">
          <div className="max-w-3xl mx-auto flex items-center gap-2 p-2 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl animate-pulse">
            <div className="h-10 flex-1 rounded-xl bg-amber-500/20 border border-amber-500/30" />
            <div className="h-10 flex-1 rounded-xl bg-emerald-500/20 border border-emerald-500/30" />
          </div>
        </div>
      </div>
    </>
  );
}
