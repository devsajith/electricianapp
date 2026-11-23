"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  FolderPlus,
  Wallet,
  Receipt,
  Plus,
  ChevronDown,
  FolderKanban,
  FileSpreadsheet,
  UserPlus,
  Loader2,
} from "lucide-react";
import { ProjectRecord } from "@/app/dashboard/projects/actions";
import { Payment } from "@/lib/types/payment";
import { Expense } from "@/lib/types/expense";
import { Labour, LabourEntry } from "@/lib/types/labour";
import { createLabourAction } from "@/app/dashboard/labour/actions";
import { RecordPaymentModal } from "@/components/record-payment-modal";
import { RecordExpenseModal } from "@/components/record-expense-modal";
import { CreateProjectModal } from "@/app/dashboard/projects/create-project-modal";

interface DashboardClientProps {
  initialProjects: ProjectRecord[];
  initialPayments: Payment[];
  initialExpenses: Expense[];
  initialLabours?: Labour[];
  initialLabourEntries?: LabourEntry[];
  userEmail?: string | null;
}

// Vibrant palette for contact avatars like Google Pay
const AVATAR_COLORS = [
  "bg-amber-600",
  "bg-blue-600",
  "bg-emerald-600",
  "bg-purple-600",
  "bg-rose-600",
  "bg-teal-600",
  "bg-indigo-600",
  "bg-cyan-600",
  "bg-orange-600",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function DashboardClient({
  initialProjects,
  initialPayments,
  initialExpenses,
  initialLabours = [],
  userEmail,
}: DashboardClientProps) {
  const router = useRouter();

  // Search state for client name & project filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllAvatars, setShowAllAvatars] = useState(false);

  // Labour state
  const [labours, setLabours] = useState<Labour[]>(initialLabours);
  const [isAddLabourOpen, setIsAddLabourOpen] = useState(false);
  const [workerName, setWorkerName] = useState("");
  const [workerPhone, setWorkerPhone] = useState("");
  const [workerPlace, setWorkerPlace] = useState("");
  const [workerSaving, setWorkerSaving] = useState(false);
  const [workerError, setWorkerError] = useState<string | null>(null);

  // Modals state
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const selectedProjectId = undefined;

  // Financial Metrics Calculation
  const currentMonthPrefix = new Date().toISOString().substring(0, 7); // YYYY-MM

  const thisMonthPayments = initialPayments.filter((p) =>
    (p.payment_date || "").startsWith(currentMonthPrefix)
  );
  const totalMoneyInMonth = thisMonthPayments.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0
  );

  const thisMonthExpenses = initialExpenses.filter((e) =>
    (e.date || "").startsWith(currentMonthPrefix)
  );
  const totalMoneyOutMonth = thisMonthExpenses.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0
  );

  const activeJobs = initialProjects.filter(
    (p) =>
      p.status.toLowerCase().includes("progress") ||
      p.status.toLowerCase().includes("ongoing") ||
      p.status.toLowerCase().includes("scheduled") ||
      p.status.toLowerCase().includes("pending")
  );

  // Filter projects based on search query (Client name, phone, project number, place)
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return initialProjects;
    const query = searchQuery.toLowerCase().trim();
    return initialProjects.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.phone && p.phone.includes(query)) ||
        (p.project_number && p.project_number.toLowerCase().includes(query)) ||
        (p.place && p.place.toLowerCase().includes(query)) ||
        (p.type && p.type.toLowerCase().includes(query))
    );
  }, [initialProjects, searchQuery]);

  // Filter labours based on search query
  const filteredLabours = useMemo(() => {
    if (!searchQuery.trim()) return labours;
    const query = searchQuery.toLowerCase().trim();
    return labours.filter(
      (l) =>
        l.name.toLowerCase().includes(query) ||
        (l.phone && l.phone.includes(query)) ||
        (l.place && l.place.toLowerCase().includes(query))
    );
  }, [labours, searchQuery]);

  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerName.trim()) {
      setWorkerError("Worker name is required.");
      return;
    }
    if (!workerPhone.trim()) {
      setWorkerError("Phone number is required.");
      return;
    }
    if (!workerPlace.trim()) {
      setWorkerError("Place is required.");
      return;
    }

    setWorkerSaving(true);
    setWorkerError(null);
    try {
      const res = await createLabourAction({
        name: workerName.trim(),
        phone: workerPhone.trim(),
        place: workerPlace.trim(),
      });
      if (res.error) {
        setWorkerError(res.error);
      } else if (res.data) {
        setLabours((prev) => [res.data!, ...prev]);
        setWorkerName("");
        setWorkerPhone("");
        setWorkerPlace("");
        setIsAddLabourOpen(false);
      }
    } catch (err: unknown) {
      setWorkerError(err instanceof Error ? err.message : "Failed to add worker.");
    } finally {
      setWorkerSaving(false);
    }
  };

  const displayedAvatars = showAllAvatars
    ? filteredProjects
    : filteredProjects.slice(0, 7);

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-4 select-none">
      {/* 1. Google Pay Style Search Pill with Client Name Search + Settings Avatar */}
      <div className="relative flex items-center gap-2.5 sm:gap-3">
        <div className="relative flex-1">
          <div className="group flex items-center w-full h-12 px-4 rounded-full bg-[#1e2025] hover:bg-[#252830] focus-within:bg-[#252830] border border-[#2e323b] focus-within:border-[#1a73e8] focus-within:ring-2 focus-within:ring-[#1a73e8]/25 transition-all shadow-sm">
            <Search className="w-5 h-5 text-slate-400 group-focus-within:text-[#8ab4f8] mr-3 shrink-0 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client name or project..."
              className="w-full h-full bg-transparent border-0 outline-none ring-0 shadow-none text-sm font-sans text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors shrink-0 ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Top-Right Settings Avatar (Matches Google Pay profile avatar in Image 1) */}
        <Link
          href="/dashboard/settings"
          title="Settings"
          aria-label="Settings"
          className="w-12 h-12 rounded-full bg-[#1e2025] hover:bg-[#262830] border border-[#2e323b] hover:border-amber-500/50 flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-sm overflow-hidden"
        >
          <div className="w-9 h-9 rounded-full bg-[#1a73e8] text-white flex items-center justify-center font-bold text-sm shadow-sm">
            {userEmail ? userEmail.charAt(0).toUpperCase() : "E"}
          </div>
        </Link>
      </div>

      {/* 3. The 4 Primary Action Buttons - Unified Module Navigation */}
      <div className="grid grid-cols-4 gap-2.5 sm:gap-4 md:gap-6 pt-1">
        {/* Action 1: Projects */}
        <Link
          href="/dashboard/projects"
          className="flex flex-col items-center group active:scale-95 transition-transform"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#0b57d0] group-hover:bg-[#1a73e8] flex items-center justify-center text-white shadow-md shadow-[#0b57d0]/25 transition-colors">
            <FolderKanban className="w-7 h-7 stroke-[2]" />
          </div>
          <span className="text-xs font-bold text-slate-100 mt-2 text-center leading-tight">
            Projects
          </span>
        </Link>

        {/* Action 2: Quotations */}
        <Link
          href="/dashboard/estimates"
          className="flex flex-col items-center group active:scale-95 transition-transform"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#0b57d0] group-hover:bg-[#1a73e8] flex items-center justify-center text-white shadow-md shadow-[#0b57d0]/25 transition-colors">
            <FileSpreadsheet className="w-7 h-7 stroke-[2]" />
          </div>
          <span className="text-xs font-bold text-slate-100 mt-2 text-center leading-tight">
            Quotations
          </span>
        </Link>

        {/* Action 3: Payments */}
        <Link
          href="/dashboard/payments"
          className="flex flex-col items-center group active:scale-95 transition-transform"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#0b57d0] group-hover:bg-[#1a73e8] flex items-center justify-center text-white shadow-md shadow-[#0b57d0]/25 transition-colors">
            <Wallet className="w-7 h-7 stroke-[2]" />
          </div>
          <span className="text-xs font-bold text-slate-100 mt-2 text-center leading-tight">
            Payments
          </span>
        </Link>

        {/* Action 4: Expenses */}
        <Link
          href="/dashboard/expenses"
          className="flex flex-col items-center group active:scale-95 transition-transform"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#0b57d0] group-hover:bg-[#1a73e8] flex items-center justify-center text-white shadow-md shadow-[#0b57d0]/25 transition-colors">
            <Receipt className="w-7 h-7 stroke-[2]" />
          </div>
          <span className="text-xs font-bold text-slate-100 mt-2 text-center leading-tight">
            Expenses
          </span>
        </Link>
      </div>

      {/* 4. Secondary Quick Metric Pills Row (Like Tap & Pay, UPI Lite, Rewards in GPay) */}
      <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
        <Link
          href="/dashboard/projects"
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#1e2025] hover:bg-[#262830] border border-[#2e323b] text-xs font-semibold text-slate-200 whitespace-nowrap transition-colors shrink-0"
        >
          <div className="w-2 h-2 rounded-full bg-[#1a73e8] animate-pulse" />
          <span>Active Jobs: {activeJobs.length}</span>
        </Link>

        <Link
          href="/dashboard/payments"
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#1e2025] hover:bg-[#262830] border border-[#2e323b] text-xs font-semibold text-slate-200 whitespace-nowrap transition-colors shrink-0"
        >
          <Wallet className="w-3.5 h-3.5 text-emerald-400" />
          <span>This Month In: ₹{totalMoneyInMonth.toLocaleString("en-IN")}</span>
        </Link>

        <Link
          href="/dashboard/expenses"
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#1e2025] hover:bg-[#262830] border border-[#2e323b] text-xs font-semibold text-slate-200 whitespace-nowrap transition-colors shrink-0"
        >
          <Receipt className="w-3.5 h-3.5 text-rose-400" />
          <span>Expenses: ₹{totalMoneyOutMonth.toLocaleString("en-IN")}</span>
        </Link>
      </div>

      {/* 5. Google Pay "Send money" People / Projects Avatar Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Projects
            </h3>
            <p className="text-[11px] text-slate-400">
              Select client to view expenses and payments timeline
            </p>
          </div>
          <Link
            href="/dashboard/projects"
            className="text-xs font-bold text-[#8ab4f8] hover:text-blue-300"
          >
            Manage &gt;
          </Link>
        </div>

        {/* Responsive Avatar Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-y-4 sm:gap-y-6 gap-x-2.5 sm:gap-x-4">
          {displayedAvatars.map((p) => {
            const initial = p.name ? p.name.trim().charAt(0).toUpperCase() : "P";
            const colorClass = getAvatarColor(p.name);

            return (
              <Link
                key={p.id || p.project_number}
                href={`/dashboard/projects/${p.id}`}
                className="flex flex-col items-center group text-center active:scale-95 transition-transform"
              >
                {/* Circle Avatar */}
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${colorClass} flex items-center justify-center text-white text-xl font-bold shadow-md group-hover:ring-2 ring-blue-400 transition-all`}
                >
                  {initial}
                </div>
                {/* Client Name under Circle */}
                <span className="text-xs font-semibold text-slate-200 mt-2 truncate w-full px-1">
                  {p.name}
                </span>
                {/* Subtle project badge */}
                <span className="text-[10px] text-slate-400 font-mono truncate w-full px-1">
                  {p.type || "Wiring"}
                </span>
              </Link>
            );
          })}

          {/* "+ Add New" or "More" Avatar */}
          {filteredProjects.length > 7 && !showAllAvatars ? (
            <button
              type="button"
              onClick={() => setShowAllAvatars(true)}
              className="flex flex-col items-center group text-center active:scale-95 transition-transform"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#1e2025] border border-[#2e323b] flex items-center justify-center text-slate-300 group-hover:text-white transition-colors">
                <ChevronDown className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-slate-200 mt-2">More</span>
              <span className="text-[10px] text-slate-400">View all</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setProjectModalOpen(true)}
              className="flex flex-col items-center group text-center active:scale-95 transition-transform"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#1e2025] border border-dashed border-slate-600 hover:border-amber-400 flex items-center justify-center text-amber-400 transition-colors">
                <Plus className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-slate-200 mt-2">New Job</span>
              <span className="text-[10px] text-slate-400">+ Add</span>
            </button>
          )}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-8 px-4 rounded-2xl bg-[#181a20] border border-[#262932]">
            <p className="text-xs text-slate-400">
              No project matches &ldquo;{searchQuery}&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => setProjectModalOpen(true)}
              className="mt-3 px-4 py-1.5 rounded-full bg-[#1a73e8] text-white text-xs font-bold"
            >
              + Create Project for &ldquo;{searchQuery}&rdquo;
            </button>
          </div>
        )}
      </div>

      {/* 6. Labours Avatar Grid (Like Image 1) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Labours
            </h3>
            <p className="text-[11px] text-slate-400">
              Select worker to view wage payouts and work log
            </p>
          </div>
          <Link
            href="/dashboard/labour"
            className="text-xs font-bold text-[#8ab4f8] hover:text-blue-300"
          >
            Manage &gt;
          </Link>
        </div>

        {/* Responsive Labours Avatar Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-y-4 sm:gap-y-6 gap-x-2.5 sm:gap-x-4">
          {filteredLabours.map((worker) => {
            const initial = worker.name ? worker.name.trim().charAt(0).toUpperCase() : "W";
            const colorClass = getAvatarColor(worker.name);

            return (
              <Link
                key={worker.id}
                href={`/dashboard/labour/${worker.id}`}
                className="flex flex-col items-center group text-center active:scale-95 transition-transform"
              >
                {/* Circle Avatar */}
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${colorClass} flex items-center justify-center text-white text-xl font-bold shadow-md group-hover:ring-2 ring-emerald-400 transition-all`}
                >
                  {initial}
                </div>
                {/* Worker Name under Circle */}
                <span className="text-xs font-semibold text-slate-200 mt-2 truncate w-full px-1">
                  {worker.name}
                </span>
                {/* Location / Tag */}
                <span className="text-[10px] text-slate-400 font-mono truncate w-full px-1">
                  {worker.place || "Worker"}
                </span>
              </Link>
            );
          })}

          {/* "+ Add Worker" Avatar */}
          <button
            type="button"
            onClick={() => {
              setWorkerName("");
              setWorkerPhone("");
              setWorkerPlace("");
              setWorkerError(null);
              setIsAddLabourOpen(true);
            }}
            className="flex flex-col items-center group text-center active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#1e2025] border border-dashed border-slate-600 hover:border-emerald-400 flex items-center justify-center text-emerald-400 transition-colors">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-slate-200 mt-2">New Worker</span>
            <span className="text-[10px] text-slate-400">+ Add</span>
          </button>
        </div>

        {filteredLabours.length === 0 && (
          <div className="text-center py-8 px-4 rounded-2xl bg-[#181a20] border border-[#262932]">
            <p className="text-xs text-slate-400">
              No worker matches &ldquo;{searchQuery}&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => {
                setWorkerName("");
                setWorkerPhone("");
                setWorkerPlace("");
                setWorkerError(null);
                setIsAddLabourOpen(true);
              }}
              className="mt-3 px-4 py-1.5 rounded-full bg-[#1a73e8] text-white text-xs font-bold"
            >
              + Add Worker for &ldquo;{searchQuery}&rdquo;
            </button>
          </div>
        )}
      </div>

      {/* 7. Floating Blue "Add Project" Pill */}
      <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 md:left-auto md:right-8 md:translate-x-0 z-30 pointer-events-auto">
        <button
          type="button"
          onClick={() => setProjectModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#1a73e8] hover:bg-[#1557bf] text-white font-bold text-sm shadow-xl shadow-[#1a73e8]/30 active:scale-95 transition-all border border-blue-400/30"
        >
          <FolderPlus className="w-5 h-5 stroke-[2.5]" />
          <span>Add Project</span>
        </button>
      </div>

      {/* Modals triggered from quick actions */}
      <RecordPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        defaultProjectId={selectedProjectId}
        onSuccess={() => {
          setPaymentModalOpen(false);
          router.refresh();
        }}
      />

      <RecordExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        defaultProjectId={selectedProjectId}
        onSuccess={() => {
          setExpenseModalOpen(false);
          router.refresh();
        }}
      />

      <CreateProjectModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onSuccess={() => {
          setProjectModalOpen(false);
          router.refresh();
        }}
      />

      {/* Add Labour Modal */}
      {isAddLabourOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsAddLabourOpen(false)}
        >
          <div
            className="bg-[#181a20] border border-[#2a2d36] rounded-3xl p-5 space-y-4 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#282b35]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Add New Worker</h3>
                  <p className="text-[11px] text-slate-400">Register electrician helper or technician</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddLabourOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {workerError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                {workerError}
              </div>
            )}

            <form onSubmit={handleCreateWorker} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Worker Name *
                </label>
                <input
                  type="text"
                  required
                  value={workerName}
                  onChange={(e) => setWorkerName(e.target.value)}
                  placeholder="e.g. Sujith Kumar"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#111216] border border-[#2a2d36] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1a73e8]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={workerPhone}
                  onChange={(e) => setWorkerPhone(e.target.value)}
                  placeholder="e.g. 9847123456"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#111216] border border-[#2a2d36] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1a73e8]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Place / Location *
                </label>
                <input
                  type="text"
                  required
                  value={workerPlace}
                  onChange={(e) => setWorkerPlace(e.target.value)}
                  placeholder="e.g. Kochi, Aluva"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#111216] border border-[#2a2d36] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1a73e8]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddLabourOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={workerSaving}
                  className="px-4 py-2 rounded-xl bg-[#1a73e8] hover:bg-[#1557bf] text-xs font-bold text-white disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {workerSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Worker</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
