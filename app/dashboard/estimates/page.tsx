import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EstimatesPage() {
  const estimates = [
    { id: "EST-201", client: "Highland Heights HOA", scope: "Substation Repair", total: "$12,400.00", date: "Sep 10, 2026", status: "Sent" },
    { id: "EST-202", client: "David Miller", scope: "Whole-Home Generator", total: "$5,100.00", date: "Sep 12, 2026", status: "Approved" },
    { id: "EST-203", client: "Green Valley Bistro", scope: "Kitchen Lighting & Outlets", total: "$3,250.00", date: "Sep 14, 2026", status: "Draft" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Estimates & Quotes</h1>
          <p className="text-xs text-slate-400">Draft, send, and track client cost estimates.</p>
        </div>
        <Button className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 shadow-md">
          <Plus className="w-3.5 h-3.5" />
          <span>New Estimate</span>
        </Button>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold text-slate-500">
              <th className="py-3 px-3">Estimate ID</th>
              <th className="py-3 px-3">Client & Scope</th>
              <th className="py-3 px-3">Date</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {estimates.map((est) => (
              <tr key={est.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3.5 px-3 font-mono text-slate-400">{est.id}</td>
                <td className="py-3.5 px-3">
                  <div className="font-semibold text-slate-200">{est.client}</div>
                  <div className="text-[11px] text-slate-400">{est.scope}</div>
                </td>
                <td className="py-3.5 px-3 text-slate-400">{est.date}</td>
                <td className="py-3.5 px-3">
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {est.status}
                  </span>
                </td>
                <td className="py-3.5 px-3 text-right font-bold text-slate-200">{est.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
