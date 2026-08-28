"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Edit3,
  Eye,
  FileText,
  Home,
  Loader2,
  RefreshCw,
  Sparkles,
  Tag,
  UploadCloud,
  User,
  X,
} from "lucide-react";
import api from "@/lib/api";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge, ComplaintStatus } from "@/components/ui/status-badge";
import { PriorityBadge, ComplaintPriority } from "@/components/ui/priority-badge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type Complaint = {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  ai_reason: string | null;
  room_id: string;
  block: string;
  floor: number;
  room_number: string;
  apartment: string | null;
  reported_by_id: string;
  assigned_to_id: string | null;
};

type Room = {
  id: string;
  block: string;
  floor: number;
  room_number: string;
  apartment: string | null;
  capacity: number;
};

type ComplaintHistory = {
  id: string;
  complaint_id: string;
  user_id: string;
  user_name: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
};

type ComplaintAttachment = {
  id: string;
  complaint_id: string;
  uploaded_by_id: string;
  filename: string;
  stored_filename: string;
  content_type: string;
  file_size: number;
  created_at: string;
};

const STEPS: { status: ComplaintStatus; label: string; step: number }[] = [
  { status: "OPEN", label: "Submitted", step: 1 },
  { status: "ASSIGNED", label: "Assigned", step: 2 },
  { status: "IN_PROGRESS", label: "In Progress", step: 3 },
  { status: "RESOLVED", label: "Resolved", step: 4 },
  { status: "CLOSED", label: "Closed", step: 5 },
];

function getStatusStepIndex(status: string): number {
  switch (status) {
    case "OPEN":
      return 1;
    case "ASSIGNED":
      return 2;
    case "IN_PROGRESS":
      return 3;
    case "RESOLVED":
      return 4;
    case "CLOSED":
      return 5;
    default:
      return 1;
  }
}

export default function StudentComplaintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const complaintId = params.id as string;
  const { success, error: toastError } = useToast();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [history, setHistory] = useState<ComplaintHistory[]>([]);
  const [attachments, setAttachments] = useState<ComplaintAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Edit State
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Upload State
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Image Preview Modal
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");

  const loadData = useCallback(async (isManual = false) => {
    if (!complaintId) return;

    try {
      if (isManual) setRefreshing(true);
      setError("");

      const complaintRes = await api.get(`/api/v1/complaints/${complaintId}`);
      const complaintData: Complaint = complaintRes.data;
      setComplaint(complaintData);

      const [roomRes, historyRes, attachRes] = await Promise.all([
        api.get(`/api/v1/rooms/${complaintData.room_id}`),
        api.get(`/api/v1/complaints/${complaintId}/history`),
        api.get(`/api/v1/attachments/${complaintId}/attachments`),
      ]);

      setRoom(roomRes.data);
      setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
      setAttachments(Array.isArray(attachRes.data) ? attachRes.data : []);
    } catch (err: unknown) {
      console.error(err);
      setError("Unable to load complaint details.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [complaintId]);

  const loadDataRef = useRef(loadData);
  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

  useEffect(() => {
    loadDataRef.current();
  }, []);

  // Polling every 30s
  useEffect(() => {
    if (!complaintId || editing) return;
    const interval = setInterval(() => {
      loadDataRef.current();
    }, 30000);
    return () => clearInterval(interval);
  }, [complaintId, editing]);

  // ESC handler for image modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    };
    if (previewUrl) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [previewUrl]);

  const handleStartEdit = () => {
    if (!complaint) return;
    setEditTitle(complaint.title);
    setEditDescription(complaint.description);
    setEditError("");
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditError("");
  };

  const handleSaveEdit = async () => {
    if (!complaint) return;
    const trimmedTitle = editTitle.trim();
    const trimmedDesc = editDescription.trim();

    if (!trimmedTitle) {
      setEditError("Title is required.");
      return;
    }
    if (trimmedTitle.length < 5) {
      setEditError("Title must be at least 5 characters.");
      return;
    }
    if (!trimmedDesc) {
      setEditError("Description is required.");
      return;
    }
    if (trimmedDesc.length < 10) {
      setEditError("Description must be at least 10 characters.");
      return;
    }

    try {
      setSaving(true);
      setEditError("");

      const res = await api.patch(`/api/v1/complaints/${complaintId}`, {
        title: trimmedTitle,
        description: trimmedDesc,
      });

      setComplaint(res.data);
      setEditing(false);
      success("Complaint updated successfully");
      await loadData();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setEditError(
          err.response?.data?.detail || "Unable to update complaint."
        );
      } else {
        setEditError("Unable to update complaint.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUploadAttachment = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Only JPG, PNG, and WEBP images are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size must not exceed 5 MB.");
      e.target.value = "";
      return;
    }

    try {
      setUploading(true);
      setUploadError("");

      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post(
        `/api/v1/attachments/${complaintId}/attachments`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setAttachments((prev) => [...prev, response.data]);
      success("Attachment uploaded successfully");
      e.target.value = "";
    } catch (err: unknown) {
      console.error("Upload error:", err);
      setUploadError("Failed to upload attachment.");
      toastError("Failed to upload attachment");
    } finally {
      setUploading(false);
    }
  };

  const openAttachment = async (storedFilename: string, filename: string) => {
    try {
      const response = await api.get<Blob>(
        `/api/v1/attachments/file/${encodeURIComponent(storedFilename)}`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(response.data);
      setPreviewUrl(url);
      setPreviewName(filename);
    } catch (err) {
      console.error("Failed to open attachment:", err);
      toastError("Unable to view attachment");
    }
  };

  if (loading) {
    return (
      <AppShell role="STUDENT" maxWidth="default">
        <div className="space-y-6">
          <div className="h-6 w-32 animate-pulse rounded bg-zinc-200" />
          <div className="h-40 animate-pulse rounded-3xl bg-zinc-200" />
          <div className="h-32 animate-pulse rounded-3xl bg-zinc-200" />
        </div>
      </AppShell>
    );
  }

  if (error || !complaint) {
    return (
      <AppShell role="STUDENT" maxWidth="default">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-xs">
          <AlertCircle size={32} className="mx-auto text-rose-500" />
          <h1 className="mt-3 text-lg font-bold text-zinc-900">
            Complaint Not Found
          </h1>
          <p className="mt-1 text-xs text-zinc-500">
            {error || "The complaint could not be retrieved."}
          </p>
          <button
            onClick={() => router.push("/student/complaints")}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white active:scale-95 transition-all"
          >
            <span>Back to complaints</span>
          </button>
        </div>
      </AppShell>
    );
  }

  const currentStep = getStatusStepIndex(complaint.status);
  const canEdit =
    complaint.status !== "RESOLVED" && complaint.status !== "CLOSED";

  return (
    <AppShell role="STUDENT" maxWidth="default">
      <div className="space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200/60 pb-5">
          <div className="flex items-center gap-2">
            <Link
              href="/student/complaints"
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-zinc-900 outline-none"
            >
              <ArrowLeft size={14} />
              <span>Complaints</span>
            </Link>
            <span className="text-zinc-300">/</span>
            <span className="text-xs font-mono text-zinc-400">
              #{complaint.id.slice(0, 8)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={complaint.status} size="md" />
            <PriorityBadge priority={complaint.priority} size="md" />

            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="inline-flex size-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-zinc-900 outline-none"
              title="Refresh complaint"
              aria-label="Refresh"
            >
              <RefreshCw
                size={15}
                className={cn(refreshing && "animate-spin text-zinc-900")}
              />
            </button>
          </div>
        </div>

        {/* Progress Stepper Card */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-6">
            <Clock size={16} className="text-zinc-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600">
              Lifecycle Progress
            </h2>
          </div>

          <div className="grid grid-cols-5 gap-2 relative">
            {STEPS.map((stepItem, idx) => {
              const isCompleted = stepItem.step <= currentStep;
              const isCurrent = stepItem.step === currentStep;

              return (
                <div
                  key={stepItem.status}
                  className="flex flex-col items-center text-center relative"
                >
                  {/* Connecting Line */}
                  {idx > 0 && (
                    <div
                      className={cn(
                        "absolute top-4 -left-1/2 w-full h-0.5 -z-0 transition-colors duration-300",
                        isCompleted ? "bg-zinc-900" : "bg-zinc-200"
                      )}
                    />
                  )}

                  <div
                    className={cn(
                      "relative z-10 flex size-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-200 shadow-xs",
                      isCurrent
                        ? "bg-zinc-900 text-white ring-4 ring-zinc-200 scale-105"
                        : isCompleted
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-400 border border-zinc-200"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <span>{stepItem.step}</span>
                    )}
                  </div>

                  <span
                    className={cn(
                      "mt-2 text-[11px] font-semibold transition-colors",
                      isCurrent
                        ? "text-zinc-900 font-bold"
                        : isCompleted
                        ? "text-zinc-700"
                        : "text-zinc-400"
                    )}
                  >
                    {stepItem.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Complaint Card */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          {!editing ? (
            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                      <Tag size={11} className="text-zinc-500" />
                      <span>{complaint.category}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                      <Home size={11} className="text-zinc-500" />
                      <span>
                        Block {complaint.block} • Room {complaint.room_number}
                        {complaint.apartment ? ` (${complaint.apartment})` : ""}
                      </span>
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 pt-1">
                    {complaint.title}
                  </h1>
                </div>

                {canEdit && (
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 active:scale-95 transition-all shadow-2xs focus-visible:ring-2 focus-visible:ring-zinc-900 outline-none"
                  >
                    <Edit3 size={14} />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              <div className="mt-5 rounded-2xl bg-zinc-50/70 p-5 border border-zinc-100">
                <p className="text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap">
                  {complaint.description}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-zinc-900">
                  Edit Complaint
                </h2>
                <span className="text-xs text-zinc-400">
                  Update issue title or description
                </span>
              </div>

              {editError && (
                <p className="text-xs font-semibold text-rose-600 animate-in shake duration-150">
                  {editError}
                </p>
              )}

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={5}
                  className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 transition-all resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 active:scale-95 transition-all disabled:opacity-50"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  <span>{saving ? "Saving..." : "Save changes"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 active:scale-95 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* AI Assessment Box */}
          {complaint.ai_reason && (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5 shadow-2xs">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs mb-1.5">
                <Sparkles size={15} className="text-indigo-600 animate-pulse" />
                <span>AI Automated Assessment</span>
              </div>
              <p className="text-xs sm:text-sm text-indigo-950/90 leading-relaxed">
                {complaint.ai_reason}
              </p>
            </div>
          )}

          {/* Room and Assignment Details */}
          <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-zinc-100">
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Assigned Hostel Room
              </span>
              <p className="mt-1 text-sm font-bold text-zinc-900">
                {room
                  ? `Block ${room.block} • Floor ${room.floor} • Room ${room.room_number}`
                  : `Block ${complaint.block} • Room ${complaint.room_number}`}
              </p>
              {room?.apartment && (
                <p className="mt-0.5 text-xs text-zinc-500">
                  Apartment {room.apartment}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Maintenance Assignment
              </span>
              <p className="mt-1 text-sm font-bold text-zinc-900">
                {complaint.assigned_to_id
                  ? "Assigned to Maintenance Staff"
                  : "Unassigned (In queue for triage)"}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Category: {complaint.category}
              </p>
            </div>
          </div>
        </div>

        {/* Attachments Section */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-900">
                Attachments ({attachments.length})
              </h2>
              <p className="text-xs text-zinc-500">
                Photos uploaded for this complaint
              </p>
            </div>

            <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-zinc-800 active:scale-95 transition-all shadow-2xs focus-within:ring-2 focus-within:ring-zinc-900">
              <UploadCloud size={15} />
              <span>{uploading ? "Uploading..." : "Upload Photo"}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploading}
                onChange={handleUploadAttachment}
              />
            </label>
          </div>

          {uploadError && (
            <p className="text-xs font-semibold text-rose-600 animate-in shake duration-150">{uploadError}</p>
          )}

          {attachments.length === 0 ? (
            <p className="text-xs text-zinc-400 py-3">
              No photos attached to this complaint.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 pt-2">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="group rounded-2xl border border-zinc-200 bg-zinc-50/50 p-3.5 hover:border-zinc-300 hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white border border-zinc-200 text-zinc-500 shadow-2xs">
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-zinc-900">
                        {att.filename}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-0.5 font-medium">
                        {Math.round(att.file_size / 1024)} KB
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 pt-2 border-t border-zinc-200/60">
                    <button
                      type="button"
                      onClick={() =>
                        openAttachment(att.stored_filename, att.filename)
                      }
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-white border border-zinc-200 px-2 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-zinc-900 outline-none"
                    >
                      <Eye size={13} />
                      <span>Preview</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Timeline */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900">
              Activity History
            </h2>
            <p className="text-xs text-zinc-500">
              Complete audit trail of updates and status transitions
            </p>
          </div>

          {history.length === 0 ? (
            <p className="text-xs text-zinc-400 py-2">
              No activity recorded yet.
            </p>
          ) : (
            <div className="space-y-4 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-zinc-200">
              {history.map((item) => (
                <div key={item.id} className="relative flex items-start gap-4">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white shadow-xs z-10">
                    <User size={13} />
                  </div>

                  <div className="flex-1 rounded-2xl border border-zinc-100 bg-zinc-50/60 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <p className="text-xs font-bold text-zinc-900">
                        {item.action.replaceAll("_", " ")}
                      </p>
                      <span className="text-[11px] text-zinc-400">
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-zinc-500">
                      By <span className="font-medium text-zinc-700">{item.user_name}</span>
                    </p>

                    {(item.old_value || item.new_value) && (
                      <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-white border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600">
                        {item.old_value && (
                          <span className="text-zinc-400 line-through">
                            {item.old_value}
                          </span>
                        )}
                        {item.old_value && item.new_value && <span>→</span>}
                        {item.new_value && (
                          <span className="font-semibold text-zinc-900">
                            {item.new_value}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={previewName}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => {
              URL.revokeObjectURL(previewUrl);
              setPreviewUrl(null);
            }}
          />
          <div className="relative z-10 max-w-2xl w-full rounded-3xl bg-white p-5 shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <span className="text-sm font-bold text-zinc-900 truncate">
                {previewName}
              </span>
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(null);
                }}
                className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors focus-visible:ring-2 focus-visible:ring-zinc-900 outline-none"
                aria-label="Close image preview"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-4 flex items-center justify-center bg-zinc-950 rounded-2xl overflow-hidden max-h-[70vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={previewName}
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
