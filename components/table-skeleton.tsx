"use client";

import React from "react";
import { FileSpreadsheet } from "lucide-react";

export function TableRowsSkeleton({
  columns = 5,
  rows = 6,
}: {
  columns?: number;
  rows?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="border-b border-slate-800/80 animate-pulse">
          <td className="py-3 px-3 text-center bg-slate-900/70 border-r border-slate-800">
            <div className="w-4 h-3 bg-slate-800 rounded mx-auto" />
          </td>
          {Array.from({ length: columns - 1 }).map((_, cIdx) => (
            <td key={cIdx} className="py-3 px-4 border-r border-slate-800 last:border-r-0">
              <div className="space-y-1.5">
                <div
                  className="h-3.5 bg-slate-800 rounded"
                  style={{ width: `${Math.max(40, 85 - (cIdx * 15 + (rIdx % 3) * 10))}%` }}
                />
                {cIdx === 0 && <div className="h-2.5 w-24 bg-slate-800/60 rounded" />}
              </div>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function ExpensesPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse select-none">
      {/* Header Banner */}
      <div className="p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-5 w-32 bg-slate-800 rounded" />
          <div className="h-3.5 w-60 bg-slate-800/60 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 rounded-xl bg-slate-800" />
          <div className="h-9 w-32 rounded-xl bg-amber-500/20" />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 rounded-2xl bg-[#181a20] border border-[#282b35] space-y-2">
            <div className="h-3 w-24 bg-slate-800 rounded" />
            <div className="h-7 w-32 bg-slate-800 rounded font-mono" />
            <div className="h-3 w-20 bg-slate-800/60 rounded" />
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 pb-1">
        <div className="h-8 w-24 rounded-full bg-slate-800" />
        <div className="h-8 w-24 rounded-full bg-slate-800/60" />
        <div className="h-8 w-24 rounded-full bg-slate-800/60" />
      </div>

      {/* Table Container */}
      <div className="rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950">
        <div className="bg-[#107c41] px-4 py-2 flex items-center justify-between text-white border-b border-emerald-800">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span className="font-semibold text-xs">Expenses_Ledger.xlsx</span>
          </div>
          <div className="h-6 w-24 bg-white/20 rounded" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-700 text-slate-400 text-xs font-mono">
                <th className="py-2.5 px-3 w-12 text-center border-r border-slate-700">◢</th>
                <th className="py-2.5 px-4 border-r border-slate-700">DATE</th>
                <th className="py-2.5 px-4 border-r border-slate-700">DETAILS</th>
                <th className="py-2.5 px-4 border-r border-slate-700">AMOUNT</th>
                <th className="py-2.5 px-4">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              <TableRowsSkeleton columns={5} rows={6} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function PaymentsPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse select-none">
      {/* Header Banner */}
      <div className="p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-5 w-32 bg-slate-800 rounded" />
          <div className="h-3.5 w-64 bg-slate-800/60 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 rounded-xl bg-slate-800" />
          <div className="h-9 w-32 rounded-xl bg-emerald-500/20" />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 rounded-2xl bg-[#181a20] border border-[#282b35] space-y-2">
            <div className="h-3 w-24 bg-slate-800 rounded" />
            <div className="h-7 w-32 bg-slate-800 rounded font-mono" />
            <div className="h-3 w-20 bg-slate-800/60 rounded" />
          </div>
        ))}
      </div>

      {/* Table Container */}
      <div className="rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950">
        <div className="bg-[#107c41] px-4 py-2 flex items-center justify-between text-white border-b border-emerald-800">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span className="font-semibold text-xs">Payments_Ledger.xlsx</span>
          </div>
          <div className="h-6 w-24 bg-white/20 rounded" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-700 text-slate-400 text-xs font-mono">
                <th className="py-2.5 px-3 w-12 text-center border-r border-slate-700">◢</th>
                <th className="py-2.5 px-4 border-r border-slate-700">DATE</th>
                <th className="py-2.5 px-4 border-r border-slate-700">CUSTOMER / PROJECT</th>
                <th className="py-2.5 px-4 border-r border-slate-700">AMOUNT</th>
                <th className="py-2.5 px-4">METHOD</th>
              </tr>
            </thead>
            <tbody>
              <TableRowsSkeleton columns={5} rows={6} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function EstimatesPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse select-none">
      <div className="p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-5 w-32 bg-slate-800 rounded" />
          <div className="h-3.5 w-64 bg-slate-800/60 rounded" />
        </div>
        <div className="h-9 w-32 rounded-xl bg-amber-500/20" />
      </div>

      <div className="rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950">
        <div className="bg-[#107c41] px-4 py-2 flex items-center justify-between text-white border-b border-emerald-800">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span className="font-semibold text-xs">Quotations_Register.xlsx</span>
          </div>
          <div className="h-6 w-24 bg-white/20 rounded" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-700 text-slate-400 text-xs font-mono">
                <th className="py-2.5 px-3 w-12 text-center border-r border-slate-700">◢</th>
                <th className="py-2.5 px-4 border-r border-slate-700">QUOTE #</th>
                <th className="py-2.5 px-4 border-r border-slate-700">CLIENT / PLACE</th>
                <th className="py-2.5 px-4 border-r border-slate-700">AMOUNT</th>
                <th className="py-2.5 px-4">STATUS</th>
              </tr>
            </thead>
            <tbody>
              <TableRowsSkeleton columns={5} rows={6} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function ItemListPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse select-none">
      <div className="p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-5 w-36 bg-slate-800 rounded" />
          <div className="h-3.5 w-64 bg-slate-800/60 rounded" />
        </div>
        <div className="h-9 w-32 rounded-xl bg-amber-500/20" />
      </div>

      <div className="rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950">
        <div className="bg-[#107c41] px-4 py-2 flex items-center justify-between text-white border-b border-emerald-800">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span className="font-semibold text-xs">Material_Lists.xlsx</span>
          </div>
          <div className="h-6 w-24 bg-white/20 rounded" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-700 text-slate-400 text-xs font-mono">
                <th className="py-2.5 px-3 w-12 text-center border-r border-slate-700">◢</th>
                <th className="py-2.5 px-4 border-r border-slate-700">LIST TITLE</th>
                <th className="py-2.5 px-4 border-r border-slate-700">PROJECT / SITE</th>
                <th className="py-2.5 px-4 border-r border-slate-700">ITEMS</th>
                <th className="py-2.5 px-4">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              <TableRowsSkeleton columns={5} rows={6} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
