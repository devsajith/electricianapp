import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LabourPage() {
  const electricians = [
    { name: "Robert Miller", role: "Master Electrician", rate: "$75/hr", hours: 42.5, status: "On Site (Apex Plaza)" },
    { name: "James Carter", role: "Journeyman Electrician", rate: "$55/hr", hours: 40.0, status: "On Site (Sarah Jenkins)" },
    { name: "Alex Rivera", role: "Apprentice", rate: "$35/hr", hours: 38.0, status: "In Transit" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Labour & Crew Tracking</h1>
          <p className="text-xs text-slate-400">Manage electrician hours, hourly rates, and active assignments.</p>
        </div>
        <Button className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 shadow-md">
          <Plus className="w-3.5 h-3.5" />
          <span>Log Labour Hours</span>
        </Button>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold text-slate-500">
              <th className="py-3 px-3">Electrician</th>
              <th className="py-3 px-3">Role</th>
              <th className="py-3 px-3">Current Assignment</th>
              <th className="py-3 px-3">Weekly Hours</th>
              <th className="py-3 px-3 text-right">Hourly Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {electricians.map((e) => (
              <tr key={e.name} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3.5 px-3 font-semibold text-slate-200">{e.name}</td>
                <td className="py-3.5 px-3 text-slate-400">{e.role}</td>
                <td className="py-3.5 px-3 text-amber-400 font-medium">{e.status}</td>
                <td className="py-3.5 px-3 text-slate-300">{e.hours} hrs</td>
                <td className="py-3.5 px-3 text-right font-bold text-slate-200">{e.rate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
