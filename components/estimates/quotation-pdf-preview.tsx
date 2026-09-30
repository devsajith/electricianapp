"use client";

import React, { useRef, useState } from "react";
import {
  Download,
  Printer,
  X,
  FileCheck,
  Phone,
  MapPin,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Estimate } from "@/lib/types/estimate";
import { formatPhoneNumber } from "@/lib/project-utils";

interface QuotationPdfPreviewProps {
  estimate: Estimate;
  onClose?: () => void;
  isModal?: boolean;
}

/**
 * Converts a number to Indian Rupee words
 */
function numberToWordsIndian(num: number): string {
  if (!num || isNaN(num) || num <= 0) return "Zero Rupees Only";
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function convertTwoDigits(n: number): string {
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
  }

  function convertThreeDigits(n: number): string {
    let str = "";
    if (Math.floor(n / 100) > 0) {
      str += a[Math.floor(n / 100)] + " Hundred ";
    }
    const rem = n % 100;
    if (rem > 0) {
      str += convertTwoDigits(rem);
    }
    return str.trim();
  }

  let n = Math.floor(num);
  let words = "";

  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const remainder = n;

  if (crore > 0) words += convertTwoDigits(crore) + " Crore ";
  if (lakh > 0) words += convertTwoDigits(lakh) + " Lakh ";
  if (thousand > 0) words += convertTwoDigits(thousand) + " Thousand ";
  if (remainder > 0) words += convertThreeDigits(remainder) + " ";

  return words.trim() ? `Rupees ${words.trim()} Only` : "Zero Rupees Only";
}

export function QuotationPdfPreview({
  estimate,
  onClose,
  isModal = false,
}: QuotationPdfPreviewProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  // Normalize display data
  const clientName =
    estimate.client_name ||
    estimate.project_name?.replace(/ \([^)]*\)/, "") ||
    "Prospective Client";
  const clientPhone = estimate.client_phone || "";
  const clientPlace = estimate.client_place || "Local Site";
  const quoteNumber = estimate.estimate_number || "EST-2026-001";
  const quoteDate = estimate.created_at
    ? new Date(estimate.created_at).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(
    "en-IN",
    { day: "2-digit", month: "short", year: "numeric" }
  );

  const unit = estimate.quotation_unit || "Squarefeet";
  const unitLabel = unit.toLowerCase().includes("meter") ? "Meter (mtr)" : "Square Feet (sq.ft)";
  const rate = Number(estimate.rate) || (estimate.items?.[0]?.rate ?? 0);

  const handleDownloadPdf = async () => {
    if (!printRef.current || downloading) return;
    setDownloading(true);

    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(printRef.current, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 1024,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Quotation-${quoteNumber}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      // Fallback to print
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const content = (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto space-y-4">
      {/* Top Action Controls Toolbar (Excluded in Print) */}
      <div className="print:hidden w-full flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-5 py-3.5 shadow-lg">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <FileCheck className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-white leading-tight">
              Official Quotation Preview
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              {quoteNumber} • {clientName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handlePrint}
            size="sm"
            className="h-9 px-3 text-xs border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 gap-1.5"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>Print</span>
          </Button>

          <Button
            onClick={handleDownloadPdf}
            disabled={downloading}
            size="sm"
            className="h-9 px-4 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 gap-1.5 shadow-sm"
          >
            <Download className={`w-4 h-4 ${downloading ? "animate-bounce" : ""}`} />
            <span>{downloading ? "Generating PDF..." : "Download PDF"}</span>
          </Button>

          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-2 ml-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* AUTHENTIC A4 QUOTATION SHEET (PRINT & PDF TARGET)            */}
      {/* ============================================================ */}
      <div className="w-full flex justify-center overflow-x-auto p-1 sm:p-4">
        <div
          ref={printRef}
          className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 p-8 sm:p-12 shadow-2xl rounded-sm border border-slate-200 print:border-none print:shadow-none print:p-8 flex flex-col justify-between"
          style={{
            fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
            color: "#0f172a",
          }}
        >
          {/* Top Section */}
          <div className="space-y-6">
            {/* Header: Company Brand & Quotation Badge */}
            <div className="border-b-2 border-slate-900 pb-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                {/* Brand / Contractor Title */}
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black text-lg">
                      ⚡
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase leading-none">
                        KANNAN ELECTRICALS & PLUMBING
                      </h1>
                      <p className="text-[11px] font-semibold text-amber-700 tracking-wider uppercase mt-0.5">
                        Govt. Licensed Electrical Contractor & Piping Specialists
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-2 font-medium">
                    Aluva - Perumbavoor Road, Ernakulam, Kerala • Mob: +91 94470 00000
                  </p>
                </div>

                {/* Quotation Tag & Details */}
                <div className="sm:text-right bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">
                    Official Document
                  </span>
                  <span className="text-base font-black text-slate-950 font-mono tracking-wide block">
                    RATE QUOTATION
                  </span>
                  <div className="text-[11px] text-slate-600 space-y-0.5 mt-1 font-mono">
                    <div>
                      <span className="text-slate-400">Quote No:</span>{" "}
                      <strong className="text-slate-900 font-bold">{quoteNumber}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Date:</span> {quoteDate}
                    </div>
                    <div>
                      <span className="text-slate-400">Validity:</span> {validUntil}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Client & Project Information Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Quotation Provided To:
                </span>
                <h2 className="text-sm font-bold text-slate-950 uppercase">
                  {clientName}
                </h2>
                {clientPhone && (
                  <p className="text-slate-700 mt-1 flex items-center gap-1.5 font-medium">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span>{formatPhoneNumber(clientPhone)}</span>
                  </p>
                )}
                {clientPlace && (
                  <p className="text-slate-700 mt-0.5 flex items-center gap-1.5 font-medium">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span>{clientPlace}</span>
                  </p>
                )}
              </div>

              <div className="border-t sm:border-t-0 sm:border-l sm:pl-4 border-slate-200 pt-2 sm:pt-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Quotation Specifications:
                </span>
                <div className="space-y-1 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pricing Basis:</span>
                    <strong className="text-slate-900 font-bold uppercase">
                      Per {unit === "Squarefeet" ? "Square Feet" : "Meter"}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Agreed Unit Rate:</span>
                    <strong className="text-amber-800 font-extrabold font-mono text-sm">
                      ₹{rate.toLocaleString("en-IN")}{" "}
                      <span className="text-[11px] font-normal text-slate-600">
                        / {unit.toLowerCase().includes("meter") ? "meter" : "sq.ft"}
                      </span>
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Measurement Type:</span>
                    <span className="text-slate-800 font-medium">
                      Actual Site Measurement
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scope of Work Table */}
            <div>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-12 text-center rounded-l">#</th>
                    <th className="py-2.5 px-3">Description of Work & Scope</th>
                    <th className="py-2.5 px-3 text-center">Billing Unit</th>
                    <th className="py-2.5 px-3 text-right rounded-r">Quoted Rate (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 border-b border-slate-200">
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-4 px-3 text-center text-slate-500 font-mono">1</td>
                    <td className="py-4 px-3">
                      <p className="font-bold text-slate-900 text-sm">
                        {estimate.description || `Electrical & Plumbing Work (${unitLabel})`}
                      </p>
                      <span className="text-[11px] text-slate-500">
                        Concealed conduit piping, metal/PVC box fixing, wire pulling, DB dressing & circuit testing
                      </span>
                    </td>
                    <td className="py-4 px-3 text-center font-medium capitalize text-slate-700">
                      {unit === "Squarefeet" ? "Square Feet" : "Meter"}
                    </td>
                    <td className="py-4 px-3 text-right font-mono font-black text-slate-950 text-sm">
                      ₹{rate.toLocaleString("en-IN")}{" "}
                      <span className="text-[10px] font-normal text-slate-500">
                        / {unit.toLowerCase().includes("meter") ? "meter" : "sq.ft"}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Rate & In Words Strip */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
              <div className="text-xs text-slate-600 max-w-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Rate in words
                </span>
                <p className="font-semibold text-slate-900 italic mt-0.5">
                  {numberToWordsIndian(rate)} per {unit === "Squarefeet" ? "Square Feet" : "Meter"}
                </p>
              </div>

              <div className="w-full sm:w-64 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Billing Basis:</span>
                  <span className="font-medium text-slate-900">Actual site measurement</span>
                </div>
                <div className="border-t border-slate-300 pt-1.5 flex justify-between items-center">
                  <span className="font-extrabold text-slate-950 uppercase text-xs">
                    Quoted Rate:
                  </span>
                  <span className="text-base font-black text-slate-950 font-mono">
                    ₹{rate.toLocaleString("en-IN")}{" "}
                    <span className="text-xs font-normal text-slate-500">
                      / {unit.toLowerCase().includes("meter") ? "mtr" : "sq.ft"}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="border-t border-slate-200 pt-4 text-[11px] text-slate-600 space-y-1.5">
              <h3 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">
                Terms & Conditions
              </h3>
              <ol className="list-decimal pl-4 space-y-0.5 leading-relaxed text-slate-600">
                <li>
                  Final billing will be computed strictly on actual site measurement at the agreed rate of <strong>₹{rate.toLocaleString("en-IN")} per {unit === "Squarefeet" ? "Square Feet" : "Meter"}</strong>.
                </li>
                <li>
                  Measurement of completed work will be taken jointly by the client and contractor upon completion of piping and wiring stages.
                </li>
                <li>
                  Payment stages: 50% advance before starting work, 40% after conduit/wiring completion, 10% balance upon final testing.
                </li>
                <li>
                  All electrical materials used comply with standard IS safety codes (Finolex/RR Kabel wiring & Legrand/Schneider fixtures).
                </li>
                <li>
                  This quotation is strictly valid for 30 calendar days from the date of issue.
                </li>
              </ol>
            </div>
          </div>

          {/* Footer Signature Section */}
          <div className="border-t-2 border-slate-900 pt-6 mt-8 flex justify-between items-end">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-bold uppercase tracking-wider mb-2">
                <CheckCircle className="w-3 h-3 text-amber-600" />
                Verified Rate Quotation
              </div>
              <p className="text-[10px] text-slate-500">
                Generated via Kannan Electrician & Plumbing Management System
              </p>
            </div>

            <div className="text-right">
              <div className="w-40 border-b border-slate-400 mb-1"></div>
              <p className="text-xs font-black text-slate-950 uppercase">
                Authorized Signatory
              </p>
              <p className="text-[10px] text-slate-500">
                Kannan Electricals & Plumbing
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <div className="w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-2xl">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
