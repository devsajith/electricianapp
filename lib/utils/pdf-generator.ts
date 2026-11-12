import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface PdfMaterialItem {
  name: string;
  cat?: string | null;
  brand?: string | null;
  unit: string;
  qty: number | string;
}

export interface GenerateMaterialListPdfOptions {
  clientName?: string | null;
  items: PdfMaterialItem[];
}

export function generateMaterialListPdf({
  clientName,
  items,
}: GenerateMaterialListPdfOptions) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const client = clientName && clientName.trim() ? clientName.trim() : "—";

  // 1. Standard Document Header
  // Title: MATERIAL LIST
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(30, 58, 95); // Deep corporate navy #1e3a5f
  doc.text("MATERIAL LIST", 15, 18);

  // Decorative Accent Line
  doc.setDrawColor(30, 58, 95);
  doc.setLineWidth(0.6);
  doc.line(15, 22, pageWidth - 15, 22);

  // 2. Page Header: Client Name (Left) & Pandali Electricals (Right) - No "To:" or "From:" labels
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text(client, 15, 30);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 95); // Corporate navy
  doc.text("Pandali Electricals", pageWidth - 15, 30, { align: "right" });

  // Thin separator under header details
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(15, 34, pageWidth - 15, 34);

  // 3. Materials List Table (Standard Grid Design)
  const tableData = items.map((it, idx) => [
    String(idx + 1),
    it.name,
    it.cat || "—",
    it.brand || "—",
    it.unit || "No",
    String(it.qty),
  ]);

  const totalQuantity = items.reduce(
    (acc, it) => acc + (Number(it.qty) || 0),
    0
  );

  autoTable(doc, {
    startY: 38,
    head: [["S.No", "Material Description", "Category", "Brand", "Unit", "Qty"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [30, 58, 95], // #1e3a5f Standard corporate navy header
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: "bold",
      halign: "left",
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 14, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 28, halign: "center" },
      3: { cellWidth: 32 },
      4: { cellWidth: 18, halign: "center" },
      5: { cellWidth: 18, halign: "center", fontStyle: "bold" },
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 2.8,
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      lineWidth: 0.15,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    foot: [
      [
        "",
        `Total Items: ${items.length}`,
        "",
        "",
        "Total Qty",
        String(totalQuantity),
      ],
    ],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: "bold",
      fontSize: 9,
      lineColor: [203, 213, 225],
      lineWidth: 0.15,
    },
    margin: { left: 15, right: 15 },
  });

  // 4. Standard Signatory Section
  const autoTableDoc = doc as unknown as { lastAutoTable?: { finalY?: number } };
  const finalY = autoTableDoc.lastAutoTable?.finalY || 180;

  let signY = finalY + 12;
  if (signY > pageHeight - 35) {
    doc.addPage();
    signY = 30;
  }

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text("For ", pageWidth - 55, signY);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Pandali Electricals", pageWidth - 48, signY);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Authorised Signatory", pageWidth - 55, signY + 14);

  // 5. Standard Page Numbering
  const pageCount = (
    doc.internal as unknown as { getNumberOfPages: () => number }
  ).getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, {
      align: "center",
    });
  }

  const safeClient = client.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 30);
  doc.save(`Material_List_${safeClient || "Pandali"}.pdf`);
}

// ============================================================================
// CLIENT PAYMENT STATEMENT PDF GENERATOR
// ============================================================================

export interface PdfPaymentItem {
  id?: string;
  payment_date?: string;
  amount: number | string;
  method?: string | null;
  payment_info?: string | null;
  project_name?: string | null;
  project_number?: string | null;
}

export interface GeneratePaymentStatementPdfOptions {
  clientName?: string | null;
  projectNumber?: string | null;
  projectPlace?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  payments: PdfPaymentItem[];
}

export function generatePaymentStatementPdf({
  clientName,
  projectNumber,
  projectPlace,
  fromDate,
  toDate,
  payments,
}: GeneratePaymentStatementPdfOptions) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const client = clientName && clientName.trim() ? clientName.trim() : "All Clients";

  // 1. Document Header
  // Title: STATEMENT OF PAYMENTS RECEIVED
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(30, 58, 95); // Corporate Navy #1e3a5f
  doc.text("STATEMENT OF PAYMENTS RECEIVED", 15, 18);

  // Decorative Accent Line
  doc.setDrawColor(30, 58, 95);
  doc.setLineWidth(0.6);
  doc.line(15, 22, pageWidth - 15, 22);

  // 2. Header Info: Client Name (Left) & Pandali Electricals (Right) - No "To:" or "From:" labels
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text(client, 15, 30);

  // Subtitle under client if project info exists
  const subDetails = [projectNumber, projectPlace].filter(Boolean).join(" • ");
  if (subDetails) {
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(subDetails, 15, 34);
  }

  // Right Header: Pandali Electricals
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 95); // Corporate Navy
  doc.text("Pandali Electricals", pageWidth - 15, 30, { align: "right" });

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Contractor & Electrical Works", pageWidth - 15, 34, { align: "right" });

  // Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(15, 37, pageWidth - 15, 37);

  // 3. Summary Metric Box
  const totalAmount = payments.reduce(
    (acc, p) => acc + (Number(p.amount) || 0),
    0
  );
  const totalCount = payments.length;

  let periodText = "All Recorded Payments";
  if (fromDate && toDate) {
    periodText = `${fromDate} to ${toDate}`;
  } else if (fromDate) {
    periodText = `From ${fromDate}`;
  } else if (toDate) {
    periodText = `Up to ${toDate}`;
  }

  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.2);
  doc.roundedRect(15, 41, pageWidth - 30, 14, 1.5, 1.5, "FD");

  // Box Item 1: Total Received
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("TOTAL RECEIVED", 20, 46);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(22, 101, 52); // green-800
  doc.text(`Rs. ${totalAmount.toLocaleString("en-IN")}`, 20, 51);

  // Box Item 2: Transactions Count
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("TRANSACTIONS", 85, 46);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalCount} Verified Payments`, 85, 51);

  // Box Item 3: Period / Statement Date
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("STATEMENT PERIOD", 145, 46);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(periodText, 145, 51);

  // 4. Payments Table
  // Sort payments by date ascending for chronological statement
  const sortedPayments = [...payments].sort((a, b) =>
    (a.payment_date || "").localeCompare(b.payment_date || "")
  );

  const tableData = sortedPayments.map((p, idx) => [
    String(idx + 1),
    p.payment_date || "—",
    p.method || "Cash",
    p.payment_info || p.project_name || "Payment Received",
    `Rs. ${(Number(p.amount) || 0).toLocaleString("en-IN")}`,
  ]);

  autoTable(doc, {
    startY: 60,
    head: [["#", "Payment Date", "Payment Mode", "Description / Reference", "Amount Received"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [30, 58, 95], // Corporate Navy #1e3a5f
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: "bold",
      halign: "left",
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 28, halign: "center" },
      2: { cellWidth: 32, halign: "center" },
      3: { cellWidth: "auto" },
      4: { cellWidth: 38, halign: "right", fontStyle: "bold" },
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 2.8,
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      lineWidth: 0.15,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    foot: [
      [
        "",
        `Total: ${totalCount} Payments`,
        "",
        "TOTAL AMOUNT RECEIVED:",
        `Rs. ${totalAmount.toLocaleString("en-IN")}`,
      ],
    ],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: "bold",
      fontSize: 9,
      halign: "right",
      lineColor: [203, 213, 225],
      lineWidth: 0.15,
    },
    margin: { left: 15, right: 15 },
  });

  // 5. Signatory Block
  const autoTableDoc = doc as unknown as { lastAutoTable?: { finalY?: number } };
  const finalY = autoTableDoc.lastAutoTable?.finalY || 180;

  let signY = finalY + 14;
  if (signY > pageHeight - 35) {
    doc.addPage();
    signY = 30;
  }

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text("For ", pageWidth - 55, signY);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Pandali Electricals", pageWidth - 48, signY);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Authorised Signatory", pageWidth - 55, signY + 14);

  // 6. Page Numbering
  const pageCount = (
    doc.internal as unknown as { getNumberOfPages: () => number }
  ).getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, {
      align: "center",
    });
  }

  const safeClient = client.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 30);
  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`Payment_Statement_${safeClient}_${dateStr}.pdf`);
}
