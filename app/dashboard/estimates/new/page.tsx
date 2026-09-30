"use client";

import { useState, useEffect } from "react";
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
  Eye,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Estimate, EstimateItem } from "@/lib/types/estimate";
import { validateIndianPhone } from "@/lib/project-utils";
import { createEstimateAction } from "../actions";
import { QuotationPdfPreview } from "@/components/estimates/quotation-pdf-preview";

export default function CreateEstimatePage() {
  const router = useRouter();

  // Form states
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientPlace, setClientPlace] = useState("");
  const [unit, setUnit] = useState<"Squarefeet" | "Meter">("Squarefeet");
  const [rate, setRate] = useState<string>("");
  const [description, setDescription] = useState<string>(
    "Complete concealed conduit piping, box fixing, wiring & DB dressing"
  );
  const [estimateNumber, setEstimateNumber] = useState<string>(() => {
    return `EST-2026-${Math.floor(100 + Math.random() * 900)}`;
  });

  // Validation & UI states
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // PDF Preview Modal state
  const [previewEstimate, setPreviewEstimate] = useState<Estimate | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Auto-generate Estimate number on mount
  useEffect(() => {
    const randomSeq = Math.floor(100 + Math.random() * 900);
    setEstimateNumber(`EST-2026-${randomSeq}`);
  }, []);

  const numRate = parseFloat(rate) || 0;

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!clientName.trim()) {
      newErrors.clientName = "Client name is required.";
    }

    const phoneValidation = validateIndianPhone(clientPhone);
    if (!phoneValidation.isValid) {
      newErrors.clientPhone = phoneValidation.error || "Valid Indian mobile number is required.";
    }

    if (!clientPlace.trim()) {
      newErrors.clientPlace = "Place / Site location is required.";
    }

    if (!rate || isNaN(numRate) || numRate <= 0) {
      newErrors.rate = "Please enter a valid rate (e.g. 65).";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validate();
  };

  // Build the estimate object for live preview or saving
  const constructEstimateObject = (): Estimate => {
    const unitLabel = unit.toLowerCase().includes("meter") ? "meter" : "sqft";
    const workItems: EstimateItem[] = [
      {
        id: `item-${Date.now()}`,
        description: description.trim() || `Electrical & Plumbing Work (${unit})`,
        qty: 1,
        quantity: 1,
        unit: unitLabel,
        rate: numRate,
        amount: numRate,
      },
    ];

    return {
      id: `est-${Date.now()}`,
      estimate_number: estimateNumber,
      client_name: clientName.trim(),
      client_phone: clientPhone.trim(),
      client_place: clientPlace.trim(),
      project_name: `${clientName.trim()} (Wiring & Plumbing)`,
      quotation_unit: unit,
      rate: numRate,
      description: description.trim(),
      items: workItems,
      subtotal: numRate,
      discount: 0,
      tax: 0,
      total: numRate,
      status: "Draft",
      created_at: new Date().toISOString(),
    };
  };

  const handleOpenPreview = () => {
    if (!validate()) {
      setTouched({
        clientName: true,
        clientPhone: true,
        clientPlace: true,
        rate: true,
      });
      return;
    }
    const previewObj = constructEstimateObject();
    setPreviewEstimate(previewObj);
    setIsPreviewOpen(true);
  };

  const handleSaveAndGenerate = async () => {
    setServerError(null);
    if (!validate()) {
      setTouched({
        clientName: true,
        clientPhone: true,
        clientPlace: true,
        rate: true,
      });
      return;
    }

    setSaving(true);
    const estimateObj = constructEstimateObject();

    try {
      const res = await createEstimateAction({
        estimate_number: estimateNumber,
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        client_place: clientPlace.trim(),
        quotation_unit: unit,
        rate: numRate,
        description: description.trim(),
        subtotal: numRate,
        discount: 0,
        tax: 0,
        total_amount: numRate,
        status: "Draft",
        items: estimateObj.items,
      });

      if (res.error) {
        setServerError(res.error);
        setSaving(false);
        return;
      }

      // Success: open PDF preview with the saved or returned record
      const finalEstimate = res.data || estimateObj;
      setPreviewEstimate(finalEstimate);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error("Save estimate error:", err);
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
            size="xs"
            className="border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Estimates
          </Button>
        </Link>

        <span className="text-xs font-mono font-bold text-amber-400 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
          {estimateNumber}
        </span>
      </div>

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Create Client Rate Quotation
            </h1>
            <p className="text-xs text-slate-400">
              Generate an official rate quotation per Square Feet or Meter with instant downloadable PDF.
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
        {/* Field 1: Name of the client */}
        <div>
          <label
            htmlFor="clientName"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5 text-amber-400" />
            Name of the client <span className="text-amber-400">*</span>
          </label>
          <input
            id="clientName"
            type="text"
            required
            value={clientName}
            onChange={(e) => {
              setClientName(e.target.value);
              if (touched.clientName) validate();
            }}
            onBlur={() => handleBlur("clientName")}
            placeholder="e.g. Sujith Kumar"
            className={`w-full px-4 py-2.5 bg-slate-950/60 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 min-h-[44px] transition-all ${
              touched.clientName && errors.clientName
                ? "border-rose-500/60 focus:ring-rose-500/40"
                : "border-slate-800 focus:ring-amber-500/40"
            }`}
          />
          {touched.clientName && errors.clientName && (
            <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.clientName}
            </p>
          )}
        </div>

        {/* Field 2: Phone number (phno) */}
        <div>
          <label
            htmlFor="clientPhone"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5 text-amber-400" />
            Phone Number <span className="text-amber-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400 pointer-events-none">
              <span className="text-xs font-mono font-bold text-amber-400">🇮🇳 +91</span>
              <span className="text-slate-700">|</span>
            </div>
            <input
              id="clientPhone"
              type="tel"
              required
              value={clientPhone}
              onChange={(e) => {
                setClientPhone(e.target.value);
                if (touched.clientPhone) validate();
              }}
              onBlur={() => handleBlur("clientPhone")}
              placeholder="9876543210"
              maxLength={14}
              className={`w-full pl-20 pr-4 py-2.5 bg-slate-950/60 border rounded-xl text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 min-h-[44px] transition-all ${
                touched.clientPhone && errors.clientPhone
                  ? "border-rose-500/60 focus:ring-rose-500/40"
                  : "border-slate-800 focus:ring-amber-500/40"
              }`}
            />
          </div>
          {touched.clientPhone && errors.clientPhone ? (
            <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.clientPhone}
            </p>
          ) : (
            <p className="text-[11px] text-slate-500 mt-1">
              10-digit Indian mobile number for client contact & WhatsApp quote
            </p>
          )}
        </div>

        {/* Field 3: Place */}
        <div>
          <label
            htmlFor="clientPlace"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            Place / Location <span className="text-amber-400">*</span>
          </label>
          <input
            id="clientPlace"
            type="text"
            required
            value={clientPlace}
            onChange={(e) => {
              setClientPlace(e.target.value);
              if (touched.clientPlace) validate();
            }}
            onBlur={() => handleBlur("clientPlace")}
            placeholder="e.g. Aluva, Kochi"
            className={`w-full px-4 py-2.5 bg-slate-950/60 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 min-h-[44px] transition-all ${
              touched.clientPlace && errors.clientPlace
                ? "border-rose-500/60 focus:ring-rose-500/40"
                : "border-slate-800 focus:ring-amber-500/40"
            }`}
          />
          {touched.clientPlace && errors.clientPlace && (
            <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.clientPlace}
            </p>
          )}
        </div>

        {/* Field 4: Selection for Meter vs Squarefeet */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
            Quotation Measurement Unit <span className="text-amber-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setUnit("Squarefeet")}
              className={`p-3.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                unit === "Squarefeet"
                  ? "bg-amber-500/10 border-amber-500/60 text-white shadow-sm ring-1 ring-amber-500/30"
                  : "bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <div>
                <span className="text-sm font-bold block text-white">Square Feet</span>
                <span className="text-[11px] text-slate-400">Rate per sq.ft</span>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  unit === "Squarefeet" ? "border-amber-400 bg-amber-400 text-slate-950" : "border-slate-600"
                }`}
              >
                {unit === "Squarefeet" && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setUnit("Meter")}
              className={`p-3.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                unit === "Meter"
                  ? "bg-amber-500/10 border-amber-500/60 text-white shadow-sm ring-1 ring-amber-500/30"
                  : "bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <div>
                <span className="text-sm font-bold block text-white">Meter</span>
                <span className="text-[11px] text-slate-400">Rate per meter (mtr)</span>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  unit === "Meter" ? "border-amber-400 bg-amber-400 text-slate-950" : "border-slate-600"
                }`}
              >
                {unit === "Meter" && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
              </div>
            </button>
          </div>
        </div>

        {/* Field 5: Rate Input */}
        <div>
          <label
            htmlFor="rate"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
          >
            Rate per {unit === "Squarefeet" ? "Square Feet" : "Meter"} (₹) <span className="text-amber-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-amber-400 pointer-events-none">
              ₹
            </span>
            <input
              id="rate"
              type="number"
              step="any"
              min="0"
              required
              value={rate}
              onChange={(e) => {
                setRate(e.target.value);
                if (touched.rate) validate();
              }}
              onBlur={() => handleBlur("rate")}
              placeholder={unit === "Squarefeet" ? "e.g. 65" : "e.g. 50"}
              className={`w-full pl-8 pr-4 py-3 bg-slate-950/60 border rounded-xl text-base font-mono font-bold text-white placeholder-slate-600 focus:outline-none focus:ring-2 min-h-[48px] transition-all ${
                touched.rate && errors.rate
                  ? "border-rose-500/60 focus:ring-rose-500/40"
                  : "border-slate-800 focus:ring-amber-500/40"
              }`}
            />
          </div>
          {touched.rate && errors.rate && (
            <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.rate}
            </p>
          )}
        </div>

        {/* Rate Summary Callout */}
        {numRate > 0 && (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Agreed Quotation Rate
              </span>
              <p className="text-xs text-slate-300 mt-0.5">
                Billing basis: <strong className="text-white">Per {unit === "Squarefeet" ? "Square Feet" : "Meter"}</strong>
              </p>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-amber-400 font-mono">
                ₹{numRate}{" "}
                <span className="text-xs font-normal text-slate-400">
                  / {unit === "Squarefeet" ? "sq.ft" : "meter"}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Field 6: Work Scope / Specifications (Optional) */}
        <div>
          <label
            htmlFor="description"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
          >
            Work Scope / Specifications <span className="text-slate-500 font-normal">(Optional)</span>
          </label>
          <textarea
            id="description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Work specifications included in this quotation..."
            className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={handleOpenPreview}
            className="w-full sm:w-auto h-11 border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold gap-2"
          >
            <Eye className="w-4 h-4 text-amber-400" />
            <span>Preview Quotation PDF</span>
          </Button>

          <Button
            type="button"
            onClick={handleSaveAndGenerate}
            disabled={saving}
            className="w-full sm:w-auto h-11 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-2 shadow-lg shadow-amber-500/10"
          >
            <FileCheck className="w-4 h-4" />
            <span>{saving ? "Saving & Generating PDF..." : "Save & Generate PDF"}</span>
          </Button>
        </div>
      </div>

      {/* Realistic A4 PDF Preview Modal */}
      {isPreviewOpen && previewEstimate && (
        <QuotationPdfPreview
          estimate={previewEstimate}
          isModal={true}
          onClose={() => {
            setIsPreviewOpen(false);
            router.push("/dashboard/estimates");
          }}
        />
      )}
    </div>
  );
}
