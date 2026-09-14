import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentsPage() {
  const payments = [
    { id: "PAY-301", client: "Apex Retail Plaza", method: "ACH Transfer", status: "Paid", amount: "$4,500.00", date: "Sep 14, 2026" },
    { id: "PAY-302", client: "Sarah Jenkins", method: "Credit Card (Stripe)", status: "Paid", amount: "$2,800.00", date: "Sep 12, 2026" },
    { id: "PAY-303", client: "Marcus Vance", method: "Check", status: "Pending", amount: "$1,250.00", date: "Sep 10, 2026" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Client Payments & Invoices</h1>
          <p className="text-xs text-slate-400">Track client transactions, deposits, and outstanding balances.</p>
        </div>
        <Button className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 shadow-md">
          <Plus className="w-3.5 h-3.5" />
          <span>Record Payment</span>
        </Button>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold text-slate-500">
              <th className="py-3 px-3">Payment ID</th>
              <th className="py-3 px-3">Client</th>
              <th className="py-3 px-3">Payment Method</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3.5 px-3 font-mono text-slate-400">{p.id}</td>
                <td className="py-3.5 px-3 font-semibold text-slate-200">{p.client}</td>
                <td className="py-3.5 px-3 text-slate-400">{p.method}</td>
                <td className="py-3.5 px-3">
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {p.status}
                  </span>
                </td>
                <td className="py-3.5 px-3 text-right font-bold text-slate-200">{p.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
