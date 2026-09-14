import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ExpensesPage() {
  const expenses = [
    { id: "EXP-801", category: "Permits & Licenses", vendor: "City Electrical Department", amount: "$350.00", date: "Sep 13, 2026" },
    { id: "EXP-802", category: "Equipment Rental", vendor: "Sunbelt Rentals (Scissor Lift)", amount: "$620.00", date: "Sep 11, 2026" },
    { id: "EXP-803", category: "Vehicle Fuel", vendor: "Shell Fleet Services", amount: "$145.00", date: "Sep 09, 2026" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Project Expenses</h1>
          <p className="text-xs text-slate-400">Record job site overhead, equipment rentals, fuel, and permit fees.</p>
        </div>
        <Button className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 shadow-md">
          <Plus className="w-3.5 h-3.5" />
          <span>Record Expense</span>
        </Button>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold text-slate-500">
              <th className="py-3 px-3">Expense ID</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3">Vendor / Payee</th>
              <th className="py-3 px-3">Date</th>
              <th className="py-3 px-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {expenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3.5 px-3 font-mono text-slate-400">{exp.id}</td>
                <td className="py-3.5 px-3 font-semibold text-slate-200">{exp.category}</td>
                <td className="py-3.5 px-3 text-slate-400">{exp.vendor}</td>
                <td className="py-3.5 px-3 text-slate-400">{exp.date}</td>
                <td className="py-3.5 px-3 text-right font-bold text-slate-200">{exp.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
