"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileCheck,
  Zap,
  Phone,
  MapPin,
  User,
  Calculator,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createQuotationAction } from "../actions";

export default function CreateEstimatePage() {
  const router = useRouter();

  // Form states
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientPlace, setClientPlace] = useState("");
  const [unit, setUnit] = useState<"Sqft" | "Meter" | "Point" | "Nos">("Sqft");
  const [rate, setRate] = useState<string>("");
  const [description, setDescription] = useState<string>(
    "Complete concealed conduit piping, box fixing, wiring & DB dressing"
  );
  const [terms, setTerms] = useState<string>("50% advance, 50% on completion");
  const [quotationNumber] = useState<string>(() => {
    return `QT-${Math.floor(1000 + Math.random() * 9000)}`;
  });

  // Validation & UI states
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const numRate = parseFloat(rate) || 0;

  const handleSave = async () => {
    setServerError(null);
    if (!clientName.trim() || !clientPlace.trim() || !rate) {
      setServerError("Please fill out required fields (Name, Place, Rate).");
      return;
    }

    setSaving(true);

    try {
      const res = await createQuotationAction({
        quotation_number: quotationNumber,
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        client_place: clientPlace.trim(),
        unit: unit,
        rate: numRate,
        description: description.trim(),
        terms: terms.trim(),
        status: "Draft",
      });

      if (res.error) {
        setServerError(res.error);
        setSaving(false);
        return;
      }

      router.push("/dashboard/estimates");
    } catch (err) {
      console.error("Save quotation error:", err);
      setServerError("Failed to save quotation. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/estimates">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Quotations
          </Button>
        </Link>
        <span className="text-sm font-mono font-bold text-amber-400 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
          {quotationNumber}
        </span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Create Quotation
            </h1>
            <p className="text-xs text-slate-400">
              Generate an official rate quotation
            </p>
          </div>
        </div>
      </div>

      {serverError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Main Quotation Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-amber-400" />
            Client Name *
          </label>
          <input
            type="text"
            required
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="e.g. Sujith Kumar"
            className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-amber-400" />
            Phone Number
          </label>
          <input
            type="tel"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            placeholder="9876543210"
            className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            Place / Location *
          </label>
          <input
            type="text"
            required
            value={clientPlace}
            onChange={(e) => setClientPlace(e.target.value)}
            placeholder="e.g. Aluva, Kochi"
            className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
            Unit *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {["Sqft", "Meter", "Point", "Nos"].map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u as "Sqft" | "Meter" | "Point" | "Nos")}
                className={`p-3 rounded-xl border text-center font-bold text-sm transition-all ${
                  unit === u
                    ? "bg-amber-500/10 border-amber-500/60 text-white shadow-sm ring-1 ring-amber-500/30"
                    : "bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Rate per {unit} (₹) *
          </label>
          <input
            type="number"
            step="any"
            required
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="e.g. 65"
            className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-base font-mono font-bold text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Work specifications..."
            className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Terms & Conditions
          </label>
          <textarea
            rows={2}
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            placeholder="Payment terms..."
            className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>

        <div className="pt-4 flex justify-end border-t border-slate-800">
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 shadow-lg shadow-amber-500/10"
          >
            <FileCheck className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Quotation"}
          </Button>
        </div>
      </div>
    </div>
  );
}
