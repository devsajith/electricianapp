"use client";

import { useEffect, useState, useRef } from "react";
import { createProjectAction, ProjectRecord } from "./actions";
import { X, Plus, Loader2, Zap, AlertCircle, Calendar, Phone, MapPin, Layers, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { validateIndianPhone, PROJECT_TYPES, PROJECT_STATUSES } from "@/lib/project-utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newProject?: ProjectRecord) => void;
}

export function CreateProjectModal({ isOpen, onClose, onSuccess }: ModalProps) {
  const [pending, setPending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // References for date picker trigger
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  // Form field states for client-side validation
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [place, setPlace] = useState("");
  const [projectType, setProjectType] = useState<string>("Wiring");
  const [status, setStatus] = useState<string>("Ongoing");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [workDescription, setWorkDescription] = useState("");

  // Validation error state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCustomerName("");
      setCustomerPhone("");
      setPlace("");
      setProjectType("Wiring");
      setStatus("Ongoing");
      setStartDate(new Date().toISOString().split("T")[0]);
      setEndDate("");
      setWorkDescription("");
      setErrors({});
      setTouched({});
      setServerError(null);
      setPending(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };

    switch (field) {
      case "customer_name":
        if (!value.trim()) {
          newErrors.customer_name = "Client name is required.";
        } else if (value.trim().length < 2) {
          newErrors.customer_name = "Name must be at least 2 characters.";
        } else {
          delete newErrors.customer_name;
        }
        break;

      case "customer_phone":
        if (!value.trim()) {
          newErrors.customer_phone = "Phone number is required.";
        } else {
          const res = validateIndianPhone(value);
          if (!res.isValid) {
            newErrors.customer_phone = res.error || "Enter a valid 10-digit Indian phone number.";
          } else {
            delete newErrors.customer_phone;
          }
        }
        break;

      case "place":
        if (!value.trim()) {
          newErrors.place = "Place is required.";
        } else {
          delete newErrors.place;
        }
        break;

      case "end_date":
        if (value && startDate) {
          if (new Date(value) < new Date(startDate)) {
            newErrors.end_date = "End date cannot be earlier than start date.";
          } else {
            delete newErrors.end_date;
          }
        } else {
          delete newErrors.end_date;
        }
        break;

      case "start_date":
        if (endDate && value) {
          if (new Date(endDate) < new Date(value)) {
            newErrors.end_date = "End date cannot be earlier than start date.";
          } else {
            delete newErrors.end_date;
          }
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Run full validation
    const submitErrors: Record<string, string> = {};

    if (!customerName.trim()) {
      submitErrors.customer_name = "Client name is required.";
    }

    if (!customerPhone.trim()) {
      submitErrors.customer_phone = "Phone number is required.";
    } else {
      const res = validateIndianPhone(customerPhone);
      if (!res.isValid) {
        submitErrors.customer_phone = res.error || "Enter a valid 10-digit Indian phone number.";
      }
    }

    if (!place.trim()) {
      submitErrors.place = "Place is required.";
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      submitErrors.end_date = "End date cannot be earlier than start date.";
    }

    if (Object.keys(submitErrors).length > 0) {
      setErrors(submitErrors);
      setTouched({
        customer_name: true,
        customer_phone: true,
        place: true,
        start_date: true,
        end_date: true,
      });
      return;
    }

    setPending(true);
    setServerError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const res = await createProjectAction(null, formData);

      if (res?.error) {
        setServerError(res.error);
        setPending(false);
        return;
      }

      if (res?.success && res.project) {
        onSuccess?.(res.project);
      } else {
        onSuccess?.();
      }
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create project.";
      setServerError(message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-0 sm:my-8 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Add Project</h2>
              <p className="text-[11px] text-slate-400">New electrical & plumbing job setup</p>
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
        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1"
        >
          {serverError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Row 1: Name of the client */}
          <div>
            <label
              htmlFor="customer_name"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
            >
              Name of the client <span className="text-amber-400">*</span>
            </label>
            <input
              id="customer_name"
              name="customer_name"
              type="text"
              required
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                validateField("customer_name", e.target.value);
              }}
              onBlur={() => handleBlur("customer_name")}
              placeholder="Name"
              className={`w-full px-3.5 py-2.5 bg-slate-950/60 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 min-h-[44px] transition-all ${
                touched.customer_name && errors.customer_name
                  ? "border-rose-500/60 focus:ring-rose-500/40"
                  : "border-slate-800 focus:ring-amber-500/40"
              }`}
            />
            {touched.customer_name && errors.customer_name && (
              <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.customer_name}
              </p>
            )}
          </div>

          {/* Row 2: Phone number (India) */}
          <div>
            <label
              htmlFor="customer_phone"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
            >
              Phone Number (India) <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400 pointer-events-none">
                <span className="text-xs font-mono font-bold text-amber-400/90">🇮🇳 +91</span>
                <span className="text-slate-700">|</span>
              </div>
              <input
                id="customer_phone"
                name="customer_phone"
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => {
                  setCustomerPhone(e.target.value);
                  validateField("customer_phone", e.target.value);
                }}
                onBlur={() => handleBlur("customer_phone")}
                placeholder="9876543210"
                maxLength={14}
                className={`w-full pl-20 pr-4 py-2.5 bg-slate-950/60 border rounded-xl text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 min-h-[44px] transition-all ${
                  touched.customer_phone && errors.customer_phone
                    ? "border-rose-500/60 focus:ring-rose-500/40"
                    : "border-slate-800 focus:ring-amber-500/40"
                }`}
              />
            </div>
            {touched.customer_phone && errors.customer_phone ? (
              <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.customer_phone}
              </p>
            ) : (
              <p className="text-[11px] text-slate-500 mt-1">
                10-digit Indian mobile number (e.g. 9876543210)
              </p>
            )}
          </div>

          {/* Row 3: Project Type & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="project_type"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Project Type <span className="text-amber-400">*</span>
              </label>
              <select
                id="project_type"
                name="project_type"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 min-h-[44px]"
              >
                {PROJECT_TYPES.map((type) => (
                  <option key={type} value={type} className="bg-slate-900 text-slate-100">
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5"
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${
                  status === "Completed"
                    ? "text-emerald-400"
                    : status === "Pending"
                    ? "text-rose-400"
                    : "text-blue-400"
                }`} />
                Status <span className="text-amber-400">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold border focus:outline-none focus:ring-2 min-h-[44px] transition-all ${
                  status === "Completed"
                    ? "bg-emerald-950/50 text-emerald-300 border-emerald-500/50 focus:ring-emerald-500/40"
                    : status === "Pending"
                    ? "bg-rose-950/50 text-rose-300 border-rose-500/50 focus:ring-rose-500/40"
                    : "bg-blue-950/50 text-blue-300 border-blue-500/50 focus:ring-blue-500/40"
                }`}
              >
                {PROJECT_STATUSES.map((st) => (
                  <option
                    key={st}
                    value={st}
                    className={`bg-slate-900 font-semibold ${
                      st === "Completed"
                        ? "text-emerald-400"
                        : st === "Pending"
                        ? "text-rose-400"
                        : "text-blue-400"
                    }`}
                  >
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Place */}
          <div>
            <label
              htmlFor="place"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              Place <span className="text-amber-400">*</span>
            </label>
            <input
              id="place"
              name="place"
              type="text"
              required
              value={place}
              onChange={(e) => {
                setPlace(e.target.value);
                validateField("place", e.target.value);
              }}
              onBlur={() => handleBlur("place")}
              placeholder="e.g. Ernakulam / MG Road"
              className={`w-full px-3.5 py-2.5 bg-slate-950/60 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 min-h-[44px] transition-all ${
                touched.place && errors.place
                  ? "border-rose-500/60 focus:ring-rose-500/40"
                  : "border-slate-800 focus:ring-amber-500/40"
              }`}
            />
            {touched.place && errors.place && (
              <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.place}
              </p>
            )}
          </div>

          {/* Row 5: Start Date and End Date (Date Pickers) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="start_date"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  Start Date
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date().toISOString().split("T")[0];
                    setStartDate(today);
                    validateField("start_date", today);
                  }}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold transition-colors"
                >
                  Today
                </button>
              </div>
              <div
                onClick={() => startDateRef.current?.showPicker?.()}
                className="relative cursor-pointer group"
              >
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  ref={startDateRef}
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    validateField("start_date", e.target.value);
                  }}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/60 border border-slate-800 group-hover:border-amber-500/40 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 min-h-[44px] [color-scheme:dark] cursor-pointer"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    startDateRef.current?.showPicker?.();
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-amber-400 transition-colors"
                  title="Open Calendar"
                >
                  <Calendar className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="end_date"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  End Date
                </label>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      const base = startDate ? new Date(startDate) : new Date();
                      base.setDate(base.getDate() + 7);
                      const d = base.toISOString().split("T")[0];
                      setEndDate(d);
                      validateField("end_date", d);
                    }}
                    className="text-slate-400 hover:text-amber-300 font-medium"
                  >
                    +1 Wk
                  </button>
                  <span className="text-slate-700">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      const base = startDate ? new Date(startDate) : new Date();
                      base.setDate(base.getDate() + 15);
                      const d = base.toISOString().split("T")[0];
                      setEndDate(d);
                      validateField("end_date", d);
                    }}
                    className="text-slate-400 hover:text-amber-300 font-medium"
                  >
                    +15 Days
                  </button>
                  <span className="text-slate-700">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      const base = startDate ? new Date(startDate) : new Date();
                      base.setMonth(base.getMonth() + 1);
                      const d = base.toISOString().split("T")[0];
                      setEndDate(d);
                      validateField("end_date", d);
                    }}
                    className="text-slate-400 hover:text-amber-300 font-medium"
                  >
                    +1 Mo
                  </button>
                </div>
              </div>
              <div
                onClick={() => endDateRef.current?.showPicker?.()}
                className="relative cursor-pointer group"
              >
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  ref={endDateRef}
                  id="end_date"
                  name="end_date"
                  type="date"
                  min={startDate || undefined}
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    validateField("end_date", e.target.value);
                  }}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  className={`w-full pl-10 pr-10 py-2.5 bg-slate-950/60 border group-hover:border-amber-500/40 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 min-h-[44px] [color-scheme:dark] cursor-pointer transition-all ${
                    errors.end_date
                      ? "border-rose-500/60 focus:ring-rose-500/40"
                      : "border-slate-800 focus:ring-amber-500/40"
                  }`}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    endDateRef.current?.showPicker?.();
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-amber-400 transition-colors"
                  title="Open Calendar"
                >
                  <Calendar className="w-4 h-4" />
                </button>
              </div>
              {errors.end_date && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.end_date}
                </p>
              )}
            </div>
          </div>

          {/* Row 6: Description (Optional) */}
          <div>
            <label
              htmlFor="work_description"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
            >
              Description <span className="text-slate-500 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              id="work_description"
              name="work_description"
              rows={2}
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              placeholder="e.g. 3BHK full concealed wiring, DB fixing, and bathroom plumbing..."
              className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 px-5 text-xs border-slate-700 hover:bg-slate-800 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="h-10 px-6 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold gap-1.5 shadow-md"
            >
              {pending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add Project
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
