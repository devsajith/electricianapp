import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Account & Business Settings</h1>
          <p className="text-xs text-slate-400">Configure company profile, license numbers, and tax defaults.</p>
        </div>
        <Button className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 shadow-md">
          <Save className="w-3.5 h-3.5" />
          <span>Save Changes</span>
        </Button>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm max-w-2xl space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Company Name</label>
          <input
            type="text"
            defaultValue="VoltCraft Electrical Contracting LLC"
            className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Master Electrician License #</label>
          <input
            type="text"
            defaultValue="ME-894102-TX"
            className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Default Hourly Billing Rate ($)</label>
          <input
            type="text"
            defaultValue="85.00"
            className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200"
          />
        </div>
      </div>
    </div>
  );
}
