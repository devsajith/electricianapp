"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, User, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createLabourAction } from "../actions";

export default function NewLabourPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [place, setPlace] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !phone.trim() || !place.trim()) {
      setError("All fields are required.");
      return;
    }

    startTransition(async () => {
      const result = await createLabourAction({
        name: name.trim(),
        phone: phone.trim(),
        place: place.trim(),
      });

      if (result.error) {
        setError(result.error);
      } else {
        router.push("/dashboard/labour");
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/labour">
          <Button variant="outline" size="sm" className="border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Labour List
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Add Labour</h1>
          <p className="text-xs text-slate-400 mt-1">Register a new worker with Name, Phone No, and Place.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
            {error}
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Worker Name <span className="text-rose-400">*</span></label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Suresh Kumar" className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500" required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Phone Number <span className="text-rose-400">*</span></label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 9876543210" className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500" required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Place <span className="text-rose-400">*</span></label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="text" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="e.g. Kochi / Aluva" className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500" required />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link href="/dashboard/labour">
            <Button type="button" variant="outline" className="border-slate-800 text-slate-300 hover:bg-slate-800 text-xs">Cancel</Button>
          </Link>
          <Button type="submit" disabled={isPending} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-2 shadow-md">
            <Save className="w-4 h-4" />
            <span>{isPending ? "Saving..." : "Save Labour"}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
