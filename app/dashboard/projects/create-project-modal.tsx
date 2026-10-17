"use client";

import { useState, useRef } from "react";
import { createProjectAction, ProjectRecord, ProjectPlanFile } from "./actions";
import {
  X,
  Plus,
  Loader2,
  Zap,
  AlertCircle,
  Calendar,
  MapPin,
  Layers,
  CheckCircle2,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { validateIndianPhone, PROJECT_TYPES, PROJECT_STATUSES } from "@/lib/project-utils";
import { createClient } from "@/lib/supabase/client";

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileSlot {
  id: string;
  file: File | null;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newProject?: ProjectRecord) => void;
}

export function CreateProjectModal(props: ModalProps) {
  if (!props.isOpen) return null;
  return <CreateProjectModalContent {...props} />;
}

function CreateProjectModalContent({ onClose, onSuccess }: ModalProps) {
  const [pending, setPending] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  // Reference plans / files (1 file slot by default, + button to add more)
  const [fileSlots, setFileSlots] = useState<FileSlot[]>([
    { id: "slot-1", file: null },
  ]);

  // References for date picker trigger
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  // Form field states for client-side validation
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [place, setPlace] = useState("");
  const [type, setType] = useState<string>("Wiring");
  const [status, setStatus] = useState<string>("Ongoing");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");

  // Validation error state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };

    switch (field) {
      case "name":
        if (!value.trim()) {
          newErrors.name = "Client name is required.";
        } else if (value.trim().length < 2) {
          newErrors.name = "Name must be at least 2 characters.";
        } else {
          delete newErrors.name;
        }
        break;

      case "phone":
        if (!value.trim()) {
          newErrors.phone = "Phone number is required.";
        } else {
          const res = validateIndianPhone(value);
          if (!res.isValid) {
            newErrors.phone = res.error || "Enter a valid 10-digit Indian phone number.";
          } else {
            delete newErrors.phone;
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

  const handleFileChange = (slotId: string, file: File | null) => {
    if (file && file.size > 50 * 1024 * 1024) {
      setServerError(`File "${file.name}" exceeds the 50MB size limit.`);
      return;
    }
    setFileSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, file } : s))
    );
    setServerError(null);
  };

  const handleAddSlot = () => {
    setFileSlots((prev) => [
      ...prev,
      { id: `slot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, file: null },
    ]);
  };

  const handleRemoveSlot = (slotId: string) => {
    setFileSlots((prev) => {
      if (prev.length <= 1) {
        return [{ id: prev[0].id, file: null }];
      }
      return prev.filter((s) => s.id !== slotId);
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Run full validation
    const submitErrors: Record<string, string> = {};

    if (!name.trim()) {
      submitErrors.name = "Client name is required.";
    }

    if (!phone.trim()) {
      submitErrors.phone = "Phone number is required.";
    } else {
      const res = validateIndianPhone(phone);
      if (!res.isValid) {
        submitErrors.phone = res.error || "Enter a valid 10-digit Indian phone number.";
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
        name: true,
        phone: true,
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

      // Handle optional reference file uploads to Supabase Storage
      const validFiles = fileSlots
        .map((s) => s.file)
        .filter((f): f is File => f !== null);

      const uploadedPlans: ProjectPlanFile[] = [];
      if (validFiles.length > 0) {
        setUploadStatus(`Uploading ${validFiles.length} file${validFiles.length > 1 ? "s" : ""} to storage...`);
        const supabase = createClient();

        for (let i = 0; i < validFiles.length; i++) {
          const file = validFiles[i];
          setUploadStatus(`Uploading ${i + 1}/${validFiles.length}: ${file.name}...`);

          const fileExt = file.name.split(".").pop() || "";
          const sanitizedBase = file.name
            .replace(/\.[^/.]+$/, "")
            .replace(/[^a-zA-Z0-9_-]/g, "_")
            .substring(0, 30);
          const uniquePath = `plans/${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${sanitizedBase}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("project-plans")
            .upload(uniquePath, file, {
              cacheControl: "3600",
              upsert: false,
            });

          if (uploadError) {
            console.error("Storage upload error:", uploadError);
            throw new Error(
              `Upload failed for "${file.name}": ${uploadError.message}. Make sure the 'project-plans' storage bucket exists in Supabase.`
            );
          }

          const { data: urlData } = supabase.storage
            .from("project-plans")
            .getPublicUrl(uniquePath);

          uploadedPlans.push({
            id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `plan_${Date.now()}_${i}`,
            name: file.name,
            url: urlData.publicUrl,
            path: uniquePath,
            type: file.type || (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg"),
            size: file.size,
            uploaded_at: new Date().toISOString(),
          });
        }
      }

      if (uploadedPlans.length > 0) {
        formData.append("plans", JSON.stringify(uploadedPlans));
      }

      setUploadStatus("Saving project...");
      const res = await createProjectAction(null, formData);

      if (res?.error) {
        setServerError(res.error);
        setPending(false);
        setUploadStatus(null);
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
      setUploadStatus(null);
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
              htmlFor="name"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
            >
              Name of the client <span className="text-amber-400">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                validateField("name", e.target.value);
              }}
              onBlur={() => handleBlur("name")}
              placeholder="Name"
              className={`w-full px-3.5 py-2.5 bg-slate-950/60 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 min-h-[44px] transition-all ${
                touched.name && errors.name
                  ? "border-rose-500/60 focus:ring-rose-500/40"
                  : "border-slate-800 focus:ring-amber-500/40"
              }`}
            />
            {touched.name && errors.name && (
              <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Row 2: Phone number (India) */}
          <div>
            <label
              htmlFor="phone"
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
                id="phone"
                name="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  validateField("phone", e.target.value);
                }}
                onBlur={() => handleBlur("phone")}
                placeholder="9876543210"
                maxLength={14}
                className={`w-full pl-20 pr-4 py-2.5 bg-slate-950/60 border rounded-xl text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 min-h-[44px] transition-all ${
                  touched.phone && errors.phone
                    ? "border-rose-500/60 focus:ring-rose-500/40"
                    : "border-slate-800 focus:ring-amber-500/40"
                }`}
              />
            </div>
            {touched.phone && errors.phone ? (
              <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.phone}
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
                htmlFor="type"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Project Type <span className="text-amber-400">*</span>
              </label>
              <select
                id="type"
                name="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 min-h-[44px]"
              >
                {PROJECT_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-slate-900 text-slate-100">
                    {t}
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
              <div className="relative group">
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
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker?.();
                    } catch {}
                  }}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/60 border border-slate-800 group-hover:border-amber-500/40 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 min-h-[44px] [color-scheme:dark] cursor-pointer"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                      startDateRef.current?.showPicker?.();
                    } catch {}
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
              <div className="relative group">
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
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker?.();
                    } catch {}
                  }}
                  className={`w-full pl-10 pr-10 py-2.5 bg-slate-950/60 border group-hover:border-amber-500/40 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 min-h-[44px] [color-scheme:dark] cursor-pointer transition-all ${
                    errors.end_date
                      ? "border-rose-500/60 focus:ring-rose-500/40"
                      : "border-slate-800 focus:ring-amber-500/40"
                  }`}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                      endDateRef.current?.showPicker?.();
                    } catch {}
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
              htmlFor="description"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
            >
              Description <span className="text-slate-500 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 3BHK full concealed wiring, DB fixing, and bathroom plumbing..."
              className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none"
            />
          </div>

          {/* Row 7: Reference Home Plans & Documents (1 file option by default, + button for more) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-amber-400" />
                Reference Home Plan / File
                <span className="text-slate-500 font-normal lowercase">(optional)</span>
              </label>
              {fileSlots.filter((s) => s.file !== null).length > 0 && (
                <span className="text-[11px] font-mono text-amber-400 font-medium">
                  {fileSlots.filter((s) => s.file !== null).length}{" "}
                  {fileSlots.filter((s) => s.file !== null).length === 1 ? "file" : "files"} chosen
                </span>
              )}
            </div>

            {/* File Slots List */}
            <div className="space-y-2">
              {fileSlots.map((slot, index) => {
                const isPdf =
                  slot.file &&
                  (slot.file.type === "application/pdf" ||
                    slot.file.name.toLowerCase().endsWith(".pdf"));

                return (
                  <div key={slot.id} className="space-y-1">
                    {fileSlots.length > 1 && (
                      <span className="text-[10px] text-slate-400 font-semibold px-0.5">
                        File {index + 1}
                      </span>
                    )}

                    {slot.file ? (
                      /* Filled State */
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isPdf ? (
                            <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-200">{slot.file.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              {formatFileSize(slot.file.size)} • {isPdf ? "PDF Document" : "Image"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <label
                            htmlFor={`file-input-${slot.id}`}
                            className="px-2 py-1 text-[11px] font-medium text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded cursor-pointer transition-colors"
                          >
                            Change
                          </label>
                          <input
                            id={`file-input-${slot.id}`}
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0] || null;
                              if (f) handleFileChange(slot.id, f);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(slot.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Remove file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Empty State: 1 File Upload Input */
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor={`file-input-${slot.id}`}
                          className="flex-1 flex items-center justify-between px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 hover:border-amber-500/40 rounded-xl cursor-pointer text-xs transition-colors group min-h-[44px]"
                        >
                          <div className="flex items-center gap-2 text-slate-400 group-hover:text-slate-300">
                            <Paperclip className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>Choose Plan / Document (PDF, Image)</span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-400 group-hover:text-amber-300 group-hover:bg-slate-700 transition-colors font-medium">
                            Browse
                          </span>
                          <input
                            id={`file-input-${slot.id}`}
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0] || null;
                              if (f) handleFileChange(slot.id, f);
                            }}
                          />
                        </label>

                        {fileSlots.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(slot.id)}
                            className="p-2.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors shrink-0"
                            title="Remove this slot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* + Add Another File Button */}
            <div className="pt-1 flex items-center justify-between">
              <button
                type="button"
                onClick={handleAddSlot}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-amber-500/40 hover:border-amber-400 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400 hover:text-amber-300 text-xs font-semibold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add another file</span>
              </button>
              <span className="text-[10px] text-slate-500">
                Supports PDF, JPG, PNG (Max 50MB each)
              </span>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={pending}
              className="h-10 px-5 text-xs border-slate-700 hover:bg-slate-800 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="h-10 px-6 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold gap-1.5 shadow-md min-w-[120px]"
            >
              {pending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="truncate max-w-[200px]">{uploadStatus || "Creating..."}</span>
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
