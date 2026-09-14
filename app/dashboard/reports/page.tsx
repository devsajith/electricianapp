import { Download, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Business & Financial Reports</h1>
          <p className="text-xs text-slate-400">Analyze profit margins, job profitability, and material cost trends.</p>
        </div>
        <Button className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 shadow-md">
          <Download className="w-3.5 h-3.5" />
          <span>Export Summary (PDF)</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase">Gross Profit Margin</span>
          <div className="text-2xl font-bold text-white mt-2">38.4%</div>
          <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
            <TrendingUp className="w-3.5 h-3.5" /> +4.2% higher than industry average
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase">Average Project Revenue</span>
          <div className="text-2xl font-bold text-white mt-2">$3,712.50</div>
          <p className="text-xs text-slate-400 mt-1">Based on 24 completed jobs</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase">Material Cost Ratio</span>
          <div className="text-2xl font-bold text-white mt-2">26.8%</div>
          <p className="text-xs text-slate-400 mt-1">Optimal target threshold (&lt;30%)</p>
        </div>
      </div>
    </div>
  );
}
