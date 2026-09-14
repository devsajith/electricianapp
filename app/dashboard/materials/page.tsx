import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MaterialsPage() {
  const inventory = [
    { name: "200A Main Breaker Panel (Square D)", SKU: "EL-PNL-200", stock: 12, unitPrice: "$240.00" },
    { name: "12/2 NM-B Wire (250ft Roll)", SKU: "WIR-122-250", stock: 35, unitPrice: "$115.00" },
    { name: "Single Pole 20A Circuit Breakers", SKU: "BRK-SP-20", stock: 140, unitPrice: "$8.50" },
    { name: "Commercial Grade Duplex Receptacles", SKU: "OUT-COM-15", stock: 85, unitPrice: "$4.20" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Materials & Inventory</h1>
          <p className="text-xs text-slate-400">Track electrical components, wire reels, breakers, and supplies.</p>
        </div>
        <Button className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 shadow-md">
          <Plus className="w-3.5 h-3.5" />
          <span>Add Material</span>
        </Button>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold text-slate-500">
              <th className="py-3 px-3">SKU</th>
              <th className="py-3 px-3">Item Description</th>
              <th className="py-3 px-3">Stock Level</th>
              <th className="py-3 px-3 text-right">Unit Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {inventory.map((item) => (
              <tr key={item.SKU} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3.5 px-3 font-mono text-slate-400">{item.SKU}</td>
                <td className="py-3.5 px-3 font-semibold text-slate-200">{item.name}</td>
                <td className="py-3.5 px-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300">
                    {item.stock} in stock
                  </span>
                </td>
                <td className="py-3.5 px-3 text-right font-bold text-slate-200">{item.unitPrice}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
