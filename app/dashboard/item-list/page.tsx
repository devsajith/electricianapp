import { PackageOpen } from "lucide-react";

export default function ItemListPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <div className="p-4 bg-amber-500/10 rounded-full">
        <PackageOpen className="w-12 h-12 text-amber-500" />
      </div>
      <h1 className="text-2xl font-bold text-white tracking-tight">Material Lists</h1>
      <p className="text-slate-400 max-w-md">
        The material list generation feature is currently being updated to match the new database schema. Check back soon!
      </p>
    </div>
  );
}
