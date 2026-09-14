import { RefreshCw } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4 text-center">
      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
      <div>
        <h3 className="text-base font-bold text-white">Loading Portal Data...</h3>
        <p className="text-xs text-slate-400 mt-1">
          Synchronizing electrical projects, materials, and estimates.
        </p>
      </div>
    </div>
  );
}
