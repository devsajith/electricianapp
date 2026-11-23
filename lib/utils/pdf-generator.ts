import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { VOLTERA_HEADER_BASE64 } from "./voltera-header";

/**
 * Common Voltera Brand Letterhead Header
 * Renders official brand banner (Emblem, Voltera Electrical & Plumbing, Contact info)
 */
function drawVolteraHeader(doc: jsPDF): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  try {
    doc.addImage(VOLTERA_HEADER_BASE64, "PNG", 15, 8, 180, 28.2);
  } catch {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(30, 58, 95);
    doc.text("Voltera Electrical & Plumbing Solutions", 15, 18);
  }

  // Decorative Separator Line under header
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(15, 39, pageWidth - 15, 39);

  return 44; // Baseline for subheader details
}

/**
 * Common Voltera Signatory Footer
 */
function drawVolteraSignatory(doc: jsPDF, finalY: number): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let signY = finalY + 14;
  if (signY > pageHeight - 35) {
    doc.addPage();
    signY = 30;
  }

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 95);
  doc.text("For Voltera Electrical and Plumbing Solutions", pageWidth - 15, signY, {
    align: "right",
  });

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Authorised Signatory", pageWidth - 15, signY + 12, { align: "right" });
}

/**
 * Common Multi-page Numbering
 */
function drawPageNumbers(doc: jsPDF): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
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
}

// ============================================================================
// 1. MATERIAL LIST REQUISITION PDF GENERATOR
// ============================================================================

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
  const client = clientName && clientName.trim() ? clientName.trim() : "—";

  // 1. Official Brand Header Banner
  drawVolteraHeader(doc);

  // 2. Sub-Header: Client / Project Name (Left) & Date (Right) - No list name
  const hasClient = client && client !== "—";
  if (hasClient) {
    doc.setFontSize(10.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text(client, 15, 45);
  }

  const todayStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Date: ${todayStr}`, pageWidth - 15, 45, { align: "right" });

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
    startY: 49,
    head: [["S.No", "Material Description", "Category", "Brand", "Unit", "Qty"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [30, 58, 95], // #1e3a5f Corporate navy header
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
  drawVolteraSignatory(doc, finalY);

  // 5. Page Numbering
  drawPageNumbers(doc);

  const safeClient = client.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 30);
  doc.save(`Voltera_Materials_${safeClient || "Document"}.pdf`);
}

// ============================================================================
// 2. CLIENT PAYMENT STATEMENT PDF GENERATOR
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
  const client = clientName && clientName.trim() ? clientName.trim() : "All Clients";

  // 1. Official Brand Header Banner
  drawVolteraHeader(doc);

  // 2. Sub-Header: Document Title & Client Info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 95); // Corporate Navy
  doc.text("STATEMENT OF PAYMENTS RECEIVED", 15, 45);

  const subDetails = [client !== "All Clients" ? client : null, projectNumber, projectPlace]
    .filter(Boolean)
    .join(" • ");

  if (subDetails) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(subDetails, 15, 50);
  }

  const todayStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Date: ${todayStr}`, pageWidth - 15, 45, { align: "right" });

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

  const boxY = subDetails ? 54 : 50;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.2);
  doc.roundedRect(15, boxY, pageWidth - 30, 14, 1.5, 1.5, "FD");

  // Box Item 1: Total Received
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("TOTAL RECEIVED", 20, boxY + 5);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(22, 101, 52); // green-800
  doc.text(`Rs. ${totalAmount.toLocaleString("en-IN")}`, 20, boxY + 10);

  // Box Item 2: Transactions Count
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("TRANSACTIONS", 85, boxY + 5);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalCount} Verified Payments`, 85, boxY + 10);

  // Box Item 3: Period / Statement Date
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("STATEMENT PERIOD", 145, boxY + 5);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(periodText, 145, boxY + 10);

  // 4. Payments Table
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
    startY: boxY + 18,
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
  drawVolteraSignatory(doc, finalY);

  // 6. Page Numbering
  drawPageNumbers(doc);

  const safeClient = client.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 30);
  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`Voltera_Payment_Statement_${safeClient}_${dateStr}.pdf`);
}

// ============================================================================
// 3. DAILY WORK SUMMARY PDF GENERATOR
// ============================================================================

export interface DailyWorkSummaryPdfItem {
  date: string;
  formattedDate: string;
  dayName: string;
  workersCount: number;
  workerNames: string[];
  shifts: number;
  ot: number;
}

export interface GenerateDailyWorkSummaryPdfOptions {
  projectName: string;
  totalWorkDays: number;
  totalDeployments: number;
  totalShifts: number;
  totalOtHours: number;
  days: DailyWorkSummaryPdfItem[];
}

export function generateDailyWorkSummaryPdf({
  projectName,
  totalWorkDays,
  totalDeployments,
  totalShifts,
  totalOtHours,
  days,
}: GenerateDailyWorkSummaryPdfOptions) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const projTitle = projectName && projectName.trim() ? projectName.trim() : "Project";

  // 1. Official Brand Header Banner
  drawVolteraHeader(doc);

  // 2. Sub-Header: Document Title & Project
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 95); // Corporate Navy
  doc.text("DAILY WORK & LABOR SUMMARY", 15, 45);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Project: ${projTitle} • Site Attendance & Deployments`, 15, 50);

  const todayStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Date: ${todayStr}`, pageWidth - 15, 45, { align: "right" });

  // 3. Metric Summary Box
  const boxY = 54;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, boxY, pageWidth - 30, 15, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.roundedRect(15, boxY, pageWidth - 30, 15, 2, 2, "S");

  const colWidth = (pageWidth - 30) / 4;

  const metrics = [
    { label: "WORK DAYS", val: `${totalWorkDays} Days` },
    { label: "DEPLOYMENTS", val: `${totalDeployments}` },
    { label: "TOTAL SHIFTS", val: `${totalShifts.toFixed(1)} Shifts` },
    { label: "OVERTIME", val: `+${totalOtHours.toFixed(1)} hrs` },
  ];

  metrics.forEach((m, idx) => {
    const x = 15 + idx * colWidth + colWidth / 2;
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(m.label, x, boxY + 5, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(m.val, x, boxY + 11, { align: "center" });
  });

  // 4. Daily Summary Table
  const tableData = days.map((d, idx) => [
    String(idx + 1),
    d.formattedDate,
    d.dayName || "—",
    `${d.workersCount} ${d.workersCount === 1 ? "Worker" : "Workers"}${
      d.workerNames.length > 0 ? ` (${d.workerNames.join(", ")})` : ""
    }`,
    `${d.shifts.toFixed(1)}`,
    d.ot > 0 ? `+${d.ot.toFixed(1)}h` : "—",
  ]);

  autoTable(doc, {
    startY: boxY + 19,
    head: [["#", "Work Date", "Day", "Workers Deployed", "Shifts", "Extra (OT)"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [30, 58, 95], // #1e3a5f Corporate navy
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: "bold",
      halign: "left",
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 26, fontStyle: "bold" },
      2: { cellWidth: 16, halign: "center" },
      3: { cellWidth: "auto" },
      4: { cellWidth: 20, halign: "center", fontStyle: "bold" },
      5: { cellWidth: 22, halign: "center", fontStyle: "bold" },
    },
    styles: {
      fontSize: 8,
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
        `TOTAL (${totalWorkDays} DAYS)`,
        "—",
        `${totalDeployments} Total Deployments`,
        `${totalShifts.toFixed(1)} Shifts`,
        `+${totalOtHours.toFixed(1)} hrs`,
      ],
    ],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "center",
      lineColor: [203, 213, 225],
      lineWidth: 0.15,
    },
    margin: { left: 15, right: 15 },
  });

  // 5. Signatory Block
  const autoTableDoc = doc as unknown as { lastAutoTable?: { finalY?: number } };
  const finalY = autoTableDoc.lastAutoTable?.finalY || 180;
  drawVolteraSignatory(doc, finalY);

  // 6. Page Numbering
  drawPageNumbers(doc);

  const safeProj = projTitle.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 30);
  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`Voltera_Work_Summary_${safeProj}_${dateStr}.pdf`);
}

// ============================================================================
// 4. EXPENSES REPORT PDF GENERATOR
// ============================================================================

export interface PdfExpenseItem {
  date: string;
  project_name?: string | null;
  project_number?: string | null;
  place?: string | null;
  description: string;
  amount: number | string;
}

export interface GenerateExpensesPdfOptions {
  title: string;
  category: "project" | "self" | "all";
  expenses: PdfExpenseItem[];
}

export function generateExpensesPdf({
  title,
  category,
  expenses,
}: GenerateExpensesPdfOptions) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const dateStr = new Date().toISOString().slice(0, 10);

  // 1. Official Brand Header Banner
  drawVolteraHeader(doc);

  // 2. Sub-Header: Title & Category
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 95); // Corporate Navy #1e3a5f
  doc.text(title.toUpperCase(), 15, 45);

  const catLabel =
    category === "project"
      ? "Project-based Site Expenses"
      : category === "self"
      ? "Self & Overhead Expenses"
      : "All Expenses";

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(catLabel, 15, 50);

  const todayStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Date: ${todayStr}`, pageWidth - 15, 45, { align: "right" });

  // 3. Summary Metric Box
  const totalAmount = expenses.reduce(
    (acc, e) => acc + (Number(e.amount) || 0),
    0
  );

  const boxY = 54;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.2);
  doc.roundedRect(15, boxY, pageWidth - 30, 14, 1.5, 1.5, "FD");

  // Box Item 1: Total Amount
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("TOTAL AMOUNT", 20, boxY + 5);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(
    category === "project" ? 180 : 22,
    category === "project" ? 83 : 101,
    category === "project" ? 9 : 52
  );
  doc.text(`Rs. ${totalAmount.toLocaleString("en-IN")}`, 20, boxY + 10);

  // Box Item 2: Transactions Count
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("ENTRIES COUNT", 85, boxY + 5);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`${expenses.length} Records`, 85, boxY + 10);

  // Box Item 3: Category
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("EXPENSE TYPE", 145, boxY + 5);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(
    category === "project"
      ? "Project Site"
      : category === "self"
      ? "Self / Overhead"
      : "Combined",
    145,
    boxY + 10
  );

  // 4. Expenses Table
  if (category === "project") {
    const tableData = expenses.map((e, idx) => [
      String(idx + 1),
      e.date || "—",
      e.project_name
        ? `${e.project_name}${e.place ? ` (${e.place})` : ""}`
        : "Project",
      e.description || "—",
      `Rs. ${(Number(e.amount) || 0).toLocaleString("en-IN")}`,
    ]);

    autoTable(doc, {
      startY: boxY + 18,
      head: [["S.No", "Date", "Project & Customer", "Description / Purpose", "Amount"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [30, 58, 95],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: "bold",
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 14, halign: "center" },
        1: { cellWidth: 26, halign: "center" },
        2: { cellWidth: 50 },
        3: { cellWidth: "auto" },
        4: { cellWidth: 28, halign: "right", fontStyle: "bold" },
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
      foot: [["", "TOTAL", "", "", `Rs. ${totalAmount.toLocaleString("en-IN")}`]],
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
  } else {
    const tableData = expenses.map((e, idx) => [
      String(idx + 1),
      e.date || "—",
      e.description || "—",
      `Rs. ${(Number(e.amount) || 0).toLocaleString("en-IN")}`,
    ]);

    autoTable(doc, {
      startY: boxY + 18,
      head: [["S.No", "Date", "Description / Purpose", "Amount"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [30, 58, 95],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: "bold",
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 14, halign: "center" },
        1: { cellWidth: 30, halign: "center" },
        2: { cellWidth: "auto" },
        3: { cellWidth: 32, halign: "right", fontStyle: "bold" },
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
      foot: [["", "TOTAL", "", `Rs. ${totalAmount.toLocaleString("en-IN")}`]],
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
  }

  // 5. Signatory Block
  const autoTableDoc = doc as unknown as { lastAutoTable?: { finalY?: number } };
  const finalY = autoTableDoc.lastAutoTable?.finalY || 180;
  drawVolteraSignatory(doc, finalY);

  // 6. Page Numbering
  drawPageNumbers(doc);

  const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, "_");
  doc.save(`Voltera_${safeTitle}_${dateStr}.pdf`);
}

// ============================================================================
// 5. OFFICIAL CLIENT QUOTATION PDF GENERATOR
// ============================================================================

export interface GenerateQuotationPdfOptions {
  quotationNumber: string;
  quotationDate?: string | null;
  clientName: string;
  clientAddress?: string | null;
  clientPhone?: string | null;
  clientPlace?: string | null;
  projectType?: string | null;
  subject?: string | null;
  introText?: string | null;
  items: { description: string; unit: string; rate: number }[];
  terms?: string[] | string | null;
}

export function generateQuotationPdf({
  quotationNumber,
  quotationDate,
  clientName,
  clientAddress,
  clientPhone,
  clientPlace,
  projectType,
  subject,
  introText,
  items,
  terms,
}: GenerateQuotationPdfOptions) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. Official Brand Header Banner
  drawVolteraHeader(doc);

  // 2. Document Title: QUOTATION
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(30, 58, 95);
  doc.text("QUOTATION", pageWidth / 2, 45, { align: "center" });

  // 3. Client & Quotation Metadata Box
  // Left: Client Details
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("To,", 15, 52);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(clientName || "Client", 15, 57);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  let leftY = 61;
  if (clientAddress) {
    doc.text(clientAddress, 15, leftY);
    leftY += 4.5;
  }
  const clientExtra = [
    clientPlace ? `Place: ${clientPlace}` : null,
    clientPhone ? `Phone: ${clientPhone}` : null,
  ]
    .filter(Boolean)
    .join(" • ");
  if (clientExtra) {
    doc.text(clientExtra, 15, leftY);
    leftY += 4.5;
  }

  // Right: Quotation Metadata
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Quotation No:", pageWidth - 55, 52);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(quotationNumber || "—", pageWidth - 15, 52, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Date:", pageWidth - 55, 57);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(
    quotationDate || new Date().toLocaleDateString("en-GB"),
    pageWidth - 15,
    57,
    { align: "right" }
  );

  if (projectType) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Work Type:", pageWidth - 55, 62);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(projectType, pageWidth - 15, 62, { align: "right" });
  }

  // 4. Subject line
  const metaEndY = Math.max(leftY, 68);
  let nextY = metaEndY + 2;

  if (subject) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 95);
    doc.text("Subject:", 15, nextY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    const splitSubject = doc.splitTextToSize(subject, pageWidth - 35);
    doc.text(splitSubject, 30, nextY);
    nextY += splitSubject.length * 4.5 + 2;
  }

  // 5. Items Table
  const tableData = items.map((it, idx) => [
    String(idx + 1),
    it.description,
    it.unit || "Nos",
    `Rs. ${(Number(it.rate) || 0).toLocaleString("en-IN")}`,
  ]);

  autoTable(doc, {
    startY: nextY + 1,
    head: [["#", "Work / Material Description", "Unit", "Rate (Rs.)"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [30, 58, 95], // #1e3a5f Corporate navy
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: "bold",
      halign: "left",
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 26, halign: "center" },
      3: { cellWidth: 34, halign: "right", fontStyle: "bold" },
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
    margin: { left: 15, right: 15 },
  });

  const autoTableDoc = doc as unknown as { lastAutoTable?: { finalY?: number } };
  let currentY = autoTableDoc.lastAutoTable?.finalY || nextY + 30;

  // 6. Terms & Conditions
  const termsList: string[] = Array.isArray(terms)
    ? terms
    : typeof terms === "string"
    ? terms.split("\n").map((t) => t.trim()).filter(Boolean)
    : [];

  if (termsList.length > 0) {
    if (currentY + 25 > pageHeight - 35) {
      doc.addPage();
      currentY = 25;
    } else {
      currentY += 6;
    }

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Terms & Conditions:", 15, currentY);
    currentY += 4.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    termsList.forEach((term) => {
      const splitTerm = doc.splitTextToSize(term, pageWidth - 30);
      doc.text(splitTerm, 15, currentY);
      currentY += splitTerm.length * 4;
    });
  }

  // 7. Authorised Signatory Block
  drawVolteraSignatory(doc, currentY);

  // 8. Multi-page Numbering
  drawPageNumbers(doc);

  const safeNum = quotationNumber.replace(/[^a-zA-Z0-9_-]/g, "_");
  doc.save(`Voltera_Quotation_${safeNum || "Document"}.pdf`);
}
