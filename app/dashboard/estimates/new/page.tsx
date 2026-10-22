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
  Plus,
  Trash2,
  Calendar,
  Building,
  AlertCircle,
  FileText,
  Droplet,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  QuotationItem,
  QuotationProjectType,
  DEFAULT_QUOTATION_SUBJECT,
  DEFAULT_QUOTATION_INTRO,
  DEFAULT_QUOTATION_TERMS,
} from "@/lib/types/quotation";
import { createQuotationAction } from "../actions";

export default function CreateEstimatePage() {
  const router = useRouter();

  // Initialize with stable defaults for SSR, then generate on client mount to prevent hydration mismatch
  const [quotationNumber, setQuotationNumber] = useState<string>("PE/2026/0142");
  // Today's date in YYYY-MM-DD for native HTML5 datepicker
  const [quotationDate, setQuotationDate] = useState<string>("2026-10-18");

  // Client Details required fields (empty by default, placeholders provided)
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientPlace, setClientPlace] = useState("");
  const [projectType, setProjectType] = useState<QuotationProjectType>("Wiring");
  const [clientAddress, setClientAddress] = useState("");

  // Helper to re-generate auto quotation number
  const handleRegenerateNumber = () => {
    const random = Math.floor(100 + Math.random() * 900);
    setQuotationNumber(`PE/2026/0${random}`);
  };

  useEffect(() => {
    handleRegenerateNumber();

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setQuotationDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  // Format YYYY-MM-DD to DD/MM/YYYY for letterhead storage
  const formatDisplayDate = (dStr: string) => {
    if (!dStr) return "";
    const parts = dStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dStr;
  };

  // Standard Header text
  const [subject, setSubject] = useState(DEFAULT_QUOTATION_SUBJECT);
  const [introText, setIntroText] = useState(DEFAULT_QUOTATION_INTRO);

  // Update default subject dynamically if project type changes
  const handleProjectTypeSelect = (type: QuotationProjectType) => {
    setProjectType(type);
    if (
      subject === DEFAULT_QUOTATION_SUBJECT ||
      subject.startsWith("Quotation for")
    ) {
      if (type === "Wiring") {
        setSubject(
          "Quotation for electrical wiring and fixture installation, common areas, Block A."
        );
      } else if (type === "Plumbing") {
        setSubject(
          "Quotation for plumbing, pipe fitting and sanitaryware installation, common areas, Block A."
        );
      } else {
        setSubject(
          "Quotation for electrical wiring, plumbing, and fixture installation, common areas, Block A."
        );
      }
    }
  };

  // Dynamic Table Rows (Starts with 1 empty row, no dummy text)
  const [items, setItems] = useState<QuotationItem[]>([
    {
      id: "1",
      description: "",
      unit: "Nos",
      rate: 0,
    },
  ]);

  // Standard Terms
  const [terms, setTerms] = useState(DEFAULT_QUOTATION_TERMS);

  // Validation & UI states
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Row operations
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        description: "",
        unit: "Nos",
        rate: 0,
      },
    ]);
  };

  const handleUpdateItem = (
    index: number,
    field: keyof QuotationItem,
    value: string | number
  ) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setServerError(null);

    if (!clientName.trim()) {
      setServerError("Please enter the Client Name.");
      return;
    }

    if (!clientPlace.trim()) {
      setServerError("Please enter the Client Place / Location.");
      return;
    }

    const validItems = items.filter((it) => it.description.trim() || Number(it.rate) > 0);
    if (validItems.length === 0) {
      setServerError("Please add at least one line item with description in the table.");
      return;
    }

    setSaving(true);

    try {
      const res = await createQuotationAction({
        quotation_number: quotationNumber.trim(),
        quotation_date: formatDisplayDate(quotationDate.trim()),
        client_name: clientName.trim(),
        client_phone: clientPhone.trim() || null,
        client_place: clientPlace.trim(),
        project_type: projectType,
        client_address: clientAddress.trim() || null,
        subject: subject.trim(),
        intro_text: introText.trim(),
        items: items.map((it, idx) => ({
          id: String(idx + 1),
          description: it.description.trim() || "Item",
          unit: it.unit.trim() || "Nos",
          rate: Number(it.rate) || 0,
        })),
        terms: terms.trim(),
        status: "Draft",
      });

      if (res.error) {
        setServerError(res.error);
        setSaving(false);
        return;
      }

      if (res.data?.id) {
        router.push(`/dashboard/estimates/${res.data.id}`);
      } else {
        router.push("/dashboard/estimates");
      }
    } catch (err) {
      console.error("Save quotation error:", err);
      setServerError("Failed to save quotation. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const commonUnits = ["Nos", "Meter", "Point", "Set", "Sqft", "Job", "Rft"];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/estimates">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Quotations
          </Button>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Create New Quotation
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Fill in client details and add itemized rate rows
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

      {/* SECTION 1: Client Details Form (Ordered: Name, Number, Place, Date, Project Type) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-amber-400" />
            <span>Client & Project Details</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              Client Name *
            </label>
            <input
              type="text"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter client name"
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          {/* 2. Number (Phone Number) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              Phone Number
            </label>
            <input
              type="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="Enter phone number"
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          {/* 3. Place */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              Place / Location *
            </label>
            <input
              type="text"
              required
              value={clientPlace}
              onChange={(e) => setClientPlace(e.target.value)}
              placeholder="Enter place / city"
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          {/* 4. Date (with date picker default current date) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Date *
            </label>
            <input
              type="date"
              required
              value={quotationDate}
              onChange={(e) => setQuotationDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 [color-scheme:dark] cursor-pointer"
            />
          </div>

          {/* Optional Client Association / Address */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              Client Association / Address (Optional)
            </label>
            <input
              type="text"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              placeholder="Enter client address / building / society (optional)"
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>
        </div>

        {/* 5. Project Type Selection (Wiring, Plumbing, Wiring and Plumbing) */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Project Type *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: "Wiring" as const,
                title: "Wiring",
                desc: "Electrical wiring, conduit, MCB & fixtures",
                icon: Zap,
                color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
              },
              {
                id: "Plumbing" as const,
                title: "Plumbing",
                desc: "Piping, sanitaryware, fittings & valves",
                icon: Droplet,
                color: "text-sky-400 bg-sky-500/10 border-sky-500/30",
              },
              {
                id: "Wiring and Plumbing" as const,
                title: "Wiring & Plumbing",
                desc: "Complete electrical & plumbing package",
                icon: Layers,
                color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
              },
            ].map((pt) => {
              const Icon = pt.icon;
              const isSelected = projectType === pt.id;
              return (
                <button
                  key={pt.id}
                  type="button"
                  onClick={() => handleProjectTypeSelect(pt.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all active:scale-[0.98] flex items-center gap-3 ${
                    isSelected
                      ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500 shadow-md"
                      : "border-slate-800 bg-slate-950/40 hover:border-slate-700 text-slate-400"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg border shrink-0 ${
                      isSelected ? pt.color : "bg-slate-900 border-slate-800 text-slate-400"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3
                      className={`text-xs font-bold leading-tight ${
                        isSelected ? "text-white" : "text-slate-300"
                      }`}
                    >
                      {pt.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                      {pt.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 2: Standard Subject & Paragraph */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Subject & Intro Paragraph (Standard)</span>
          </h2>
          <span className="text-[11px] text-slate-500 font-medium">
            Pre-filled standard across all quotations
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Subject Line
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Introductory Paragraph
          </label>
          <textarea
            rows={2}
            value={introText}
            onChange={(e) => setIntroText(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>
      </div>

      {/* SECTION 3: Dynamic Itemized Rate Schedule Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Quotation Items & Rate Schedule</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Add rows with item description, unit, and rate.
            </p>
          </div>
          <Button
            type="button"
            onClick={handleAddItem}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Row</span>
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={item.id || index}
              className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col md:flex-row items-stretch md:items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-amber-400 shrink-0">
                {index + 1}
              </div>

              {/* Description */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Enter item description..."
                  value={item.description}
                  onChange={(e) =>
                    handleUpdateItem(index, "description", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                />
              </div>

              {/* Unit */}
              <div className="w-full md:w-36">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    list={`units-list-${index}`}
                    placeholder="Unit (e.g. Nos)"
                    value={item.unit}
                    onChange={(e) =>
                      handleUpdateItem(index, "unit", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 text-center focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                  />
                  <datalist id={`units-list-${index}`}>
                    {commonUnits.map((u) => (
                      <option key={u} value={u} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Rate */}
              <div className="w-full md:w-40 flex items-center gap-2">
                <div className="relative w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={item.rate === 0 ? "" : item.rate}
                    onChange={(e) =>
                      handleUpdateItem(index, "rate", parseFloat(e.target.value) || 0)
                    }
                    className="w-full pl-7 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                  />
                </div>

                {items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(index)}
                    className="h-8 w-8 p-0 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 shrink-0"
                    title="Remove row"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
            <span>Total rows: {items.length}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              className="border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Item Row</span>
            </Button>
          </div>
        </div>
      </div>

      {/* SECTION 4: Terms & Conditions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800/80 pb-3">
          Terms & Conditions (Standard)
        </h2>
        <textarea
          rows={4}
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500/40"
        />
        <div className="text-[11px] text-slate-500 flex items-center justify-between">
          <span>Printed above Authorised Signatory on the final letterhead</span>
          <button
            type="button"
            onClick={() => setTerms(DEFAULT_QUOTATION_TERMS)}
            className="text-amber-400 hover:underline"
          >
            Reset to Standard 3 Terms
          </button>
        </div>
      </div>

      {/* Bottom Save Action */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="text-xs text-slate-400">
          Generated quotation will be branded with <strong className="text-white">Pandali Electricals</strong>.
        </div>
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-8 shadow-lg shadow-amber-500/10 text-xs h-10 gap-2"
        >
          <FileCheck className="w-4 h-4" />
          {saving ? "Generating Document..." : "Create & View Quotation"}
        </Button>
      </div>
    </div>
  );
}
