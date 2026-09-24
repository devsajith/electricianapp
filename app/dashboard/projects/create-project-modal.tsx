"use client";

import { useActionState, useEffect } from "react";
import { createProjectAction } from "./actions";
import { X, Plus, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateProjectModal({ isOpen, onClose, onSuccess }: ModalProps) {
  const [state, formAction, pending] = useActionState(createProjectAction, null);

  useEffect(() => {
    if (state?.success) {
      onSuccess?.();
      onClose();
    }
  }, [state, onClose, onSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-0 sm:my-8 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Create New Project</h2>
              <p className="text-[11px] text-slate-400">Project ID is auto-generated upon submission.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form action={formAction} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {state?.error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
              {state.error}
            </div>
          )}

          {/* Auto Project Number Notice Badge */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 fill-current" />
              <span className="text-[11px] sm:text-xs">Project ID auto-generated (e.g. <strong>PRJ-784920</strong>)</span>
            </div>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">Auto</span>
          </div>

          {/* Row 1: Project Type & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="project_type" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Project Type *
              </label>
              <select
                id="project_type"
                name="project_type"
                defaultValue="Residential Wiring"
                className="w-full px-3.5 py-3 sm:py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-base sm:text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 min-h-[44px] sm:min-h-0"
              >
                <option value="Residential Wiring">Residential Wiring</option>
                <option value="Residential Plumbing">Residential Plumbing</option>
                <option value="Residential Wiring and Plumbing">Residential Wiring and Plumbing</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Project Status *
              </label>
              <select
                id="status"
                name="status"
                defaultValue="Pending"
                className="w-full px-3.5 py-3 sm:py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-base sm:text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 min-h-[44px] sm:min-h-0"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Row 2: Customer Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="customer_name" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Customer Name *
              </label>
              <input
                id="customer_name"
                name="customer_name"
                type="text"
                required
                placeholder="e.g. Apex Retail Plaza / John Doe"
                className="w-full px-3.5 py-3 sm:py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-base sm:text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 min-h-[44px] sm:min-h-0"
              />
            </div>

            <div>
              <label htmlFor="customer_phone" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Phone Number
              </label>
              <input
                id="customer_phone"
                name="customer_phone"
                type="tel"
                placeholder="(555) 019-2834"
                className="w-full px-3.5 py-3 sm:py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-base sm:text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 min-h-[44px] sm:min-h-0"
              />
            </div>
          </div>

          {/* Row 3: Start Date & Expected Completion Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_date" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Start Date
              </label>
              <input
                id="start_date"
                name="start_date"
                type="date"
                className="w-full px-3.5 py-3 sm:py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-base sm:text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 min-h-[44px] sm:min-h-0"
              />
            </div>

            <div>
              <label htmlFor="expected_completion_date" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Expected Completion Date
              </label>
              <input
                id="expected_completion_date"
                name="expected_completion_date"
                type="date"
                className="w-full px-3.5 py-3 sm:py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-base sm:text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 min-h-[44px] sm:min-h-0"
              />
            </div>
          </div>

          {/* Row 4: Address (Optional) */}
          <div>
            <label htmlFor="address" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Address <span className="text-slate-500 lowercase font-normal">(optional)</span>
            </label>
            <input
              id="address"
              name="address"
              type="text"
              placeholder="123 Main Street, Suite 400"
              className="w-full px-3.5 py-3 sm:py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-base sm:text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 min-h-[44px] sm:min-h-0"
            />
          </div>

          {/* Row 5: Work Description (Optional) */}
          <div>
            <label htmlFor="work_description" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Work Description <span className="text-slate-500 lowercase font-normal">(optional)</span>
            </label>
            <textarea
              id="work_description"
              name="work_description"
              rows={2}
              placeholder="Detail scope of work (e.g. breaker replacement, plumbing pipe repair)..."
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-base sm:text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none"
            />
          </div>

          {/* Row 6: Notes (Optional) */}
          <div>
            <label htmlFor="notes" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Notes <span className="text-slate-500 lowercase font-normal">(optional)</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              placeholder="Additional client or site notes..."
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-base sm:text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-11 sm:h-9 px-5 text-xs border-slate-700 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="h-11 sm:h-9 px-6 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold gap-1.5 shadow-md"
            >
              {pending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Project...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Project
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
