"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, FolderKanban, FileSpreadsheet } from "lucide-react";
import { HeaderSlot } from "@/components/header-context";

interface ProjectDetailSkeletonProps {
  showHeaderSlot?: boolean;
}

/**
 * Skeleton loader displayed when opening an individual project detail page (/dashboard/projects/[id]).
 * Replicates the client header, navigation tabs, financial summary ribbon, transaction timeline bubbles,
 * and bottom action bar.
 */
export function ProjectDetailSkeleton({ showHeaderSlot = true }: ProjectDetailSkeletonProps) {
  return (
    <>
      {showHeaderSlot && (
        <HeaderSlot>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Back button */}
            <Link
              href="/dashboard/projects"
              aria-label="Back to Projects"
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            {/* Shimmering Avatar Circle */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-800 animate-pulse shrink-0 ring-1 ring-slate-700/60" />

            {/* Shimmering Project & Client Info */}
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-4 sm:h-5 w-32 sm:w-44 bg-slate-800 rounded-md animate-pulse" />
                <div className="hidden sm:block h-4 w-16 bg-amber-500/10 border border-amber-500/20 rounded-full animate-pulse" />
              </div>
              <div className="h-3 w-40 sm:w-56 bg-slate-800/60 rounded animate-pulse" />
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
            <div className="h-8 w-24 sm:w-28 rounded-full bg-slate-800 animate-pulse" />
          </div>
        </HeaderSlot>
      )}

      <div className="max-w-3xl mx-auto flex flex-col min-h-[calc(100vh-8rem)] relative pb-28 select-none space-y-4">
        {/* Tab Navigation Bar Skeleton */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl mb-1 shadow-sm">
          <div className="h-8 flex-1 rounded-xl bg-slate-800/50 animate-pulse" />
          <div className="h-8 flex-1 rounded-xl bg-slate-800/30 animate-pulse" />
          <div className="h-8 flex-1 rounded-xl bg-slate-800/70 animate-pulse" />
        </div>

        {/* Summary Banner Card Skeleton */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#181a20] border border-[#282b35] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="space-y-2">
            <div className="h-3.5 w-28 bg-slate-800 rounded animate-pulse" />
            <div className="flex items-center gap-2 flex-wrap">
              <div className="h-6 w-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 animate-pulse" />
              <div className="h-6 w-24 rounded-full bg-rose-500/10 border border-rose-500/20 animate-pulse" />
              <div className="h-6 w-28 rounded-full bg-slate-800/80 border border-slate-700/60 animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-28 rounded-xl bg-amber-500/15 border border-amber-500/20 animate-pulse" />
            <div className="h-4 w-20 bg-slate-800/60 rounded animate-pulse" />
          </div>
        </div>

        {/* Timeline Feed Transaction Bubbles Skeleton */}
        <div className="flex-1 space-y-5 pt-2 pb-12">
          {/* Date separator pill */}
          <div className="flex items-center justify-center py-1">
            <div className="h-5 w-24 rounded-full bg-slate-800/70 border border-slate-700/50 animate-pulse" />
          </div>

          {/* Expense Bubble (Left side) */}
          <div className="flex justify-start mr-8 sm:mr-24">
            <div className="w-full max-w-sm rounded-3xl rounded-tl-xs bg-[#1f2127] border border-[#2d313c] p-4 space-y-2.5 animate-pulse shadow-md">
              <div className="flex items-center justify-between">
                <div className="h-3.5 w-32 bg-rose-500/20 rounded" />
                <div className="w-3.5 h-3.5 rounded bg-slate-800" />
              </div>
              <div className="h-7 sm:h-8 w-32 bg-slate-800 rounded my-1" />
              <div className="flex items-center justify-between">
                <div className="h-3 w-36 bg-slate-800/60 rounded" />
                <div className="h-3 w-16 bg-slate-800/40 rounded" />
              </div>
            </div>
          </div>

          {/* Payment Bubble (Right side) */}
          <div className="flex justify-end ml-8 sm:ml-24">
            <div className="w-full max-w-sm rounded-3xl rounded-tr-xs bg-[#282a32] border border-[#383c48] p-4 space-y-2.5 animate-pulse shadow-md">
              <div className="flex items-center justify-between">
                <div className="h-3.5 w-36 bg-emerald-500/20 rounded" />
                <div className="w-3.5 h-3.5 rounded bg-slate-800" />
              </div>
              <div className="h-7 sm:h-8 w-36 bg-slate-800 rounded my-1" />
              <div className="flex items-center justify-between">
                <div className="h-3 w-40 bg-slate-800/60 rounded" />
                <div className="h-3 w-16 bg-slate-800/40 rounded" />
              </div>
            </div>
          </div>

          {/* Date separator pill */}
          <div className="flex items-center justify-center py-1">
            <div className="h-5 w-20 rounded-full bg-slate-800/70 border border-slate-700/50 animate-pulse" />
          </div>

          {/* Another Expense Bubble (Left side) */}
          <div className="flex justify-start mr-8 sm:mr-24">
            <div className="w-full max-w-sm rounded-3xl rounded-tl-xs bg-[#1f2127] border border-[#2d313c] p-4 space-y-2.5 animate-pulse shadow-md">
              <div className="flex items-center justify-between">
                <div className="h-3.5 w-28 bg-rose-500/20 rounded" />
                <div className="w-3.5 h-3.5 rounded bg-slate-800" />
              </div>
              <div className="h-7 sm:h-8 w-28 bg-slate-800 rounded my-1" />
              <div className="flex items-center justify-between">
                <div className="h-3 w-32 bg-slate-800/60 rounded" />
                <div className="h-3 w-14 bg-slate-800/40 rounded" />
              </div>
            </div>
          </div>

          {/* Another Payment Bubble (Right side) */}
          <div className="flex justify-end ml-8 sm:ml-24">
            <div className="w-full max-w-sm rounded-3xl rounded-tr-xs bg-[#282a32] border border-[#383c48] p-4 space-y-2.5 animate-pulse shadow-md">
              <div className="flex items-center justify-between">
                <div className="h-3.5 w-32 bg-emerald-500/20 rounded" />
                <div className="w-3.5 h-3.5 rounded bg-slate-800" />
              </div>
              <div className="h-7 sm:h-8 w-32 bg-slate-800 rounded my-1" />
              <div className="flex items-center justify-between">
                <div className="h-3 w-36 bg-slate-800/60 rounded" />
                <div className="h-3 w-14 bg-slate-800/40 rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar Skeleton */}
        <div className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent pointer-events-none">
          <div className="max-w-3xl mx-auto flex items-center gap-2 p-2 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl animate-pulse">
            <div className="h-10 flex-1 rounded-xl bg-emerald-600/20 border border-emerald-500/30" />
            <div className="h-10 flex-1 rounded-xl bg-rose-600/20 border border-rose-500/30" />
            <div className="h-10 w-28 sm:w-36 rounded-xl bg-slate-800/60 border border-slate-700/60 hidden xs:block" />
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Skeleton row for the Excel-style projects table.
 */
export function ProjectRowSkeleton({ index }: { index: number }) {
  return (
    <tr className="border-b border-slate-800/80 animate-pulse">
      {/* Excel Row Index */}
      <td className="py-2.5 px-2 text-center font-mono text-[11px] text-slate-500 bg-slate-900/70 border-r border-slate-800 select-none">
        {index}
      </td>

      {/* Column A: Name & Type */}
      <td className="py-2.5 px-3 border-r border-slate-800">
        <div className="space-y-1.5">
          <div className="h-4 w-36 sm:w-44 bg-slate-800 rounded" />
          <div className="h-3 w-28 bg-slate-800/60 rounded" />
        </div>
      </td>

      {/* Column B: Place */}
      <td className="py-2.5 px-3 border-r border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full bg-slate-800 shrink-0" />
          <div className="h-3.5 w-28 bg-slate-800/70 rounded" />
        </div>
      </td>

      {/* Column C: Status */}
      <td className="py-2.5 px-3 border-r border-slate-800">
        <div className="h-6 w-20 bg-slate-800/80 rounded-full" />
      </td>

      {/* Column D: Actions */}
      <td className="py-2.5 px-2 text-center">
        <div className="h-7 w-16 bg-slate-800/80 rounded-lg mx-auto" />
      </td>
    </tr>
  );
}

/**
 * Skeleton loader displayed when navigating to or loading the Projects Master page (/dashboard/projects).
 */
export function ProjectsPageSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm animate-pulse">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-amber-500/10 text-amber-400">
              <FolderKanban className="w-5 h-5" />
            </span>
            <div className="h-5 w-28 bg-slate-800 rounded" />
          </div>
          <div className="h-3.5 w-64 bg-slate-800/60 rounded" />
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="h-9 w-24 rounded-lg bg-slate-800" />
          <div className="h-9 w-28 rounded-lg bg-amber-500/30" />
        </div>
      </div>

      {/* Search & Filter Strip */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 animate-pulse">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="h-10 flex-1 bg-slate-950/60 border border-slate-800 rounded-xl" />
          <div className="h-10 w-32 bg-slate-950/60 border border-slate-800 rounded-xl" />
        </div>
        <div className="flex items-center gap-2 border-t border-slate-800/60 pt-3 overflow-x-auto pb-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-7 w-20 rounded-xl bg-slate-800/60 shrink-0" />
          ))}
        </div>
      </div>

      {/* Excel Table Skeleton */}
      <div className="rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950">
        <div className="bg-[#107c41] px-4 py-2 flex items-center justify-between text-white border-b border-emerald-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded bg-white/10">
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            </div>
            <span className="font-semibold text-xs tracking-wide">
              Projects_Master.xlsx - Client Project Registry
            </span>
          </div>
          <div className="h-6 w-28 bg-white/15 rounded" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px] font-sans">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-700 text-slate-300 text-[11px] font-mono select-none">
                <th className="w-12 py-2 px-2 text-center border-r border-slate-700/80 bg-slate-900 text-slate-500 font-bold text-[10px]">
                  ◢
                </th>
                <th className="py-2 px-3 border-r border-slate-700/80 font-bold tracking-wider">
                  NAME &amp; TYPE
                </th>
                <th className="py-2 px-3 border-r border-slate-700/80 font-bold tracking-wider">
                  PLACE / SITE
                </th>
                <th className="py-2 px-3 border-r border-slate-700/80 font-bold tracking-wider">
                  STATUS
                </th>
                <th className="w-28 py-2 px-2 text-center font-bold tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {Array.from({ length: 6 }).map((_, idx) => (
                <ProjectRowSkeleton key={idx} index={idx + 1} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
