"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Loader2,
  FolderPlus,
  FolderCheck,
  CheckCircle2,
  XCircle,
  Send,
  Trash2,
  Share2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Quotation, QuotationStatus } from "@/lib/types/quotation";
import {
  getQuotationByIdAction,
  updateQuotationStatusAction,
  deleteQuotationAction,
  convertQuotationToProjectAction,
} from "../actions";

export default function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [addingToProject, setAddingToProject] = useState(false);

  const handleAddToProject = async () => {
    if (!quotation) return;
    setAddingToProject(true);
    try {
      const res = await convertQuotationToProjectAction(quotation.id);
      if (res.error) {
        alert(res.error);
        setAddingToProject(false);
        return;
      }
      setQuotation({ ...quotation, status: "Approved" });
      router.push("/dashboard/projects");
    } catch (err) {
      console.error("Error adding to project:", err);
      alert("Failed to add to project. Please try again.");
    } finally {
      setAddingToProject(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchQuotation = async () => {
      try {
        const dbData = await getQuotationByIdAction(resolvedParams.id);
        if (isMounted) {
          setQuotation(dbData);
          setLoading(false);
        }
      } catch {
        if (isMounted) setLoading(false);
      }
    };
    fetchQuotation();
    return () => {
      isMounted = false;
    };
  }, [resolvedParams.id]);

  const handleStatusUpdate = async (newStatus: QuotationStatus) => {
    if (!quotation) return;
    setQuotation({ ...quotation, status: newStatus });
    await updateQuotationStatusAction(quotation.id, newStatus);
  };

  const handleDelete = async () => {
    if (!quotation || !confirm("Are you sure you want to delete this quotation?")) return;
    await deleteQuotationAction(quotation.id);
    router.push("/dashboard/estimates");
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Direct 1-Click PDF Download fitting onto 1 page if short
  const handleDownloadPdf = async () => {
    if (!quotation) return;
    const docElement = document.getElementById("quotation-print-document");
    if (!docElement) return;

    setDownloadingPdf(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(docElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      // Fit to 1 page if short/medium (with 10% auto-scaling tolerance)
      if (imgHeight <= pdfHeight * 1.10) {
        const fitScale = imgHeight > pdfHeight ? (pdfHeight / imgHeight) * 0.98 : 1;
        const finalWidth = imgWidth * fitScale;
        const finalHeight = imgHeight * fitScale;
        const marginX = (pdfWidth - finalWidth) / 2;
        const marginY = (pdfHeight - finalHeight) / 2;
        pdf.addImage(imgData, "PNG", marginX, Math.max(0, marginY), finalWidth, finalHeight);
      } else {
        // Multi-page if very long table
        let heightLeft = imgHeight;
        let position = 0;
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pdfHeight;
        }
      }

      // File name format: ClientNamePlaceName.pdf (e.g. SubashAdimali.pdf)
      const toPascalCase = (str?: string | null) => {
        if (!str) return "";
        return str
          .replace(/^(Mr\.|Mrs\.|Ms\.|Dr\.)\s*/i, "")
          .split(/[\s,._-]+/)
          .filter(Boolean)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join("");
      };

      const namePart = toPascalCase(quotation.client_name);
      const placePart = toPascalCase(quotation.client_place);
      const fileName = `${namePart}${placePart}` || "Quotation";

      pdf.save(`${fileName}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-sm">
        Loading quotation document...
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-200">Quotation Not Found</h2>
        <Link href="/dashboard/estimates">
          <Button variant="outline" className="text-xs border-slate-700">
            Back to Quotations
          </Button>
        </Link>
      </div>
    );
  }

  // Format currency with two decimal places
  const formatRate = (rate: number) => {
    return `Rs. ${rate.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Split terms into list items if multiline
  const termsList = quotation.terms
    ? quotation.terms
        .split("\n")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="space-y-6 pb-16">
      {/* TOP CONTROLS TOOLBAR */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/estimates">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quotations</span>
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Status:</span>
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-bold border ${
                quotation.status === "Approved"
                  ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/40"
                  : quotation.status === "Sent"
                  ? "bg-blue-950/80 text-blue-400 border-blue-500/40"
                  : quotation.status === "Rejected"
                  ? "bg-rose-950/80 text-rose-400 border-rose-500/40"
                  : "bg-slate-800 text-slate-300 border-slate-700"
              }`}
            >
              {quotation.status}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <Button
            onClick={handleShare}
            variant="outline"
            size="sm"
            className="border-slate-800 text-slate-300 hover:bg-slate-800 text-xs gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Link Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Link</span>
              </>
            )}
          </Button>

          {/* Simple Direct PDF Download Button */}
          <Button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            size="sm"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 shadow-md active:scale-95 transition-all"
          >
            {downloadingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Downloading PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </>
            )}
          </Button>

          {quotation.status === "Draft" && (
            <Button
              onClick={() => handleStatusUpdate("Sent")}
              size="sm"
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs gap-1"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Mark Sent</span>
            </Button>
          )}

          {quotation.status !== "Approved" ? (
            <Button
              onClick={handleAddToProject}
              disabled={addingToProject}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-md active:scale-95 transition-all"
            >
              {addingToProject ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Adding to Projects...</span>
                </>
              ) : (
                <>
                  <FolderPlus className="w-4 h-4" />
                  <span>Add to Project</span>
                </>
              )}
            </Button>
          ) : (
            <Link href="/dashboard/projects">
              <Button
                size="sm"
                variant="outline"
                className="border-emerald-500/40 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-950/60 text-xs gap-1.5"
              >
                <FolderCheck className="w-4 h-4" />
                <span>In Projects</span>
              </Button>
            </Link>
          )}

          {quotation.status !== "Rejected" && (
            <Button
              onClick={() => handleStatusUpdate("Rejected")}
              size="sm"
              variant="outline"
              className="text-rose-400 border-rose-500/30 hover:bg-rose-500/10 text-xs gap-1"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reject</span>
            </Button>
          )}

          <Button
            onClick={handleDelete}
            size="sm"
            variant="ghost"
            className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
            title="Delete Quotation"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* DOCUMENT PREVIEW CONTAINER (Engineered to fit 1 A4 page for short/medium tables) */}
      <div className="flex justify-center">
        <div
          id="quotation-print-document"
          className="quotation-print-sheet w-full max-w-[800px] bg-white text-slate-900 rounded-xl shadow-2xl p-6 sm:p-10 border border-slate-200 flex flex-col justify-between"
        >
          <div>
            {/* Header: Company Name & Subtitle */}
            <div className="text-center pb-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1a365d]">
                Pandali Electricals
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Electrical Contractors & Suppliers
              </p>
              <div className="w-full border-b border-slate-800 mt-3"></div>
            </div>

            {/* Document Title */}
            <div className="text-center py-3">
              <h2 className="text-base sm:text-lg font-extrabold tracking-wider uppercase text-slate-900">
                QUOTATION
              </h2>
            </div>

            {/* Metadata 2-Column Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs leading-relaxed mb-4">
              {/* Left Column: To / Client Details */}
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900">To,</div>
                <div className="font-bold text-slate-900 pl-3">
                  {quotation.client_name}
                </div>
                {quotation.client_address && (
                  <div className="text-slate-700 pl-3">
                    {quotation.client_address}
                  </div>
                )}
                {quotation.client_phone && (
                  <div className="text-slate-700 pl-3 text-[11px]">
                    Phone: {quotation.client_phone}
                  </div>
                )}
                <div className="pt-1 pl-3">
                  <span className="font-bold text-slate-900">Place:</span>{" "}
                  <span className="text-slate-800 font-medium pl-1">
                    {quotation.client_place || "—"}
                  </span>
                </div>
              </div>

              {/* Right Column: Quotation No & Date */}
              <div className="text-right space-y-0.5 flex flex-col items-end justify-between">
                <div>
                  <span className="font-bold text-slate-900">Quotation No:</span>{" "}
                  <span className="text-slate-900 font-medium">
                    {quotation.quotation_number}
                  </span>
                </div>
                <div className="pt-1">
                  <span className="font-bold text-slate-900">Date:</span>{" "}
                  <span className="text-slate-900 font-medium">
                    {quotation.quotation_date ||
                      (quotation.created_at
                        ? new Date(quotation.created_at).toLocaleDateString("en-GB")
                        : "18/10/2026")}
                  </span>
                </div>
                {quotation.project_type && (
                  <div className="pt-0.5 text-[11px] text-slate-700">
                    <span className="font-bold text-slate-900">Work Type:</span>{" "}
                    <span className="font-medium text-slate-900">
                      {quotation.project_type}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Subject Line */}
            <div className="text-xs mb-2 text-slate-900 leading-normal">
              <strong className="font-bold">Subject:</strong>{" "}
              <span>{quotation.subject}</span>
            </div>

            {/* Introductory Paragraph */}
            <div className="text-xs text-slate-800 mb-4 leading-relaxed">
              {quotation.intro_text}
            </div>

            {/* Itemized Rate Table */}
            <div className="overflow-x-auto mb-5 border border-slate-300">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#1e3a5f] text-white font-bold">
                    <th className="py-2 px-3 w-12 text-center border-r border-[#2d4d77]">
                      No
                    </th>
                    <th className="py-2 px-4 border-r border-[#2d4d77]">
                      Description
                    </th>
                    <th className="py-2 px-4 w-24 border-r border-[#2d4d77]">
                      Unit
                    </th>
                    <th className="py-2 px-4 w-32 text-right">
                      Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {quotation.items && quotation.items.length > 0 ? (
                    quotation.items.map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-center border-r border-slate-300 text-slate-700">
                          {index + 1}
                        </td>
                        <td className="py-2 px-4 border-r border-slate-300 text-slate-900 leading-snug">
                          {item.description}
                        </td>
                        <td className="py-2 px-4 border-r border-slate-300 text-slate-700">
                          {item.unit}
                        </td>
                        <td className="py-2 px-4 text-right font-medium text-slate-900 font-mono whitespace-nowrap">
                          {formatRate(item.rate)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400">
                        No items specified.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Terms & Conditions */}
            <div className="mb-5 text-xs space-y-1 text-slate-800 leading-relaxed">
              <div className="font-bold text-slate-900 mb-0.5">
                Terms & Conditions
              </div>
              {termsList.map((term, idx) => (
                <div key={idx} className="text-slate-800">
                  {term}
                </div>
              ))}
            </div>

            {/* Authorised Signatory Block */}
            <div className="mt-6 pt-2">
              <div className="text-xs text-slate-900">
                For <strong className="font-bold">Pandali Electricals</strong>
              </div>
              <div className="h-14 sm:h-16"></div>
              <div className="text-xs text-slate-900 font-medium">
                Authorised Signatory
              </div>
            </div>
          </div>

          {/* Letterhead Footer */}
          <div className="pt-4 border-t border-slate-200 mt-6 text-center text-[10px] sm:text-[11px] text-slate-500">
            Pandali Electricals | Hyderabad | +91 98765 43210 | info@pandalielectricals.example
          </div>
        </div>
      </div>
    </div>
  );
}
