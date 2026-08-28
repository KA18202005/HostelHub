"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  FileText,
  Home,
  RefreshCw,
  Sparkles,
  Tag,
  User,
  UserCheck,
  X,
} from "lucide-react";
import api from "@/lib/api";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge, ComplaintStatus } from "@/components/ui/status-badge";
import { PriorityBadge, ComplaintPriority } from "@/components/ui/priority-badge";
import { useToast } from "@/components/ui/toast";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";

type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
};

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
  reported_by_name: string;
  reported_by_email: string;
  assigned_to_id: string | null;
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

async function getComplaint(complaintId: string): Promise<Complaint> {
  const response = await api.get(`/api/v1/complaints/${complaintId}`);
  return response.data;
}

function roomLabel(complaint: Complaint) {
  if (complaint.apartment) {
    return `Block ${complaint.block} • Floor ${complaint.floor} • Apt ${complaint.apartment} • Room ${complaint.room_number}`;
  }
  return `Block ${complaint.block} • Floor ${complaint.floor} • Room ${complaint.room_number}`;
}

export default function StaffComplaintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const complaintId = params.id as string;
  const { success, error: toastError } = useToast();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");

  const {
    data: complaint,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["staff-complaint", complaintId],
    queryFn: () => getComplaint(complaintId),
    enabled: Boolean(complaintId),
  });

  const { data: attachments = [] } = useQuery({
    queryKey: ["staff-complaint-attachments", complaintId],
    queryFn: async (): Promise<ComplaintAttachment[]> => {
      const response = await api.get(
        `/api/v1/attachments/${complaintId}/attachments`
      );
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: Boolean(complaintId),
  });

  const { data: history = [] } = useQuery({
    queryKey: ["staff-complaint-history", complaintId],
    queryFn: async (): Promise<ComplaintHistory[]> => {
      const response = await api.get(
        `/api/v1/complaints/${complaintId}/history`
      );
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: Boolean(complaintId),
  });

  const { data: staffUsers = [] } = useQuery({
    queryKey: ["staff-users"],
    queryFn: async (): Promise<StaffUser[]> => {
      const response = await api.get("/api/v1/admin/staff");
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  // ESC key for modal preview
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

  const assignMutation = useMutation({
    mutationFn: async (assignedToId: string) => {
      const response = await api.patch(
        `/api/v1/complaints/${complaintId}/assign`,
        {
          assigned_to_id: assignedToId,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["staff-complaint", complaintId],
      });
      queryClient.invalidateQueries({
        queryKey: ["staff-complaints"],
      });
      queryClient.invalidateQueries({
        queryKey: ["staff-complaint-history", complaintId],
      });
      success("Complaint assigned successfully");
    },
    onError: () => {
      toastError("Failed to assign complaint");
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await api.patch(
        `/api/v1/complaints/${complaintId}/status`,
        {
          status,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["staff-complaint", complaintId],
      });
      queryClient.invalidateQueries({
        queryKey: ["staff-complaints"],
      });
      queryClient.invalidateQueries({
        queryKey: ["staff-dashboard"],
      });
      queryClient.invalidateQueries({
        queryKey: ["staff-complaint-history", complaintId],
      });
      success("Status updated successfully");
    },
    onError: () => {
      toastError("Failed to update status");
    },
  });

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

  const { user } = useCurrentUser();

  if (isLoading) {
    return (
      <AppShell role={user?.role} maxWidth="default">
        <div className="space-y-6">
          <div className="h-6 w-32 animate-pulse rounded bg-zinc-200" />
          <div className="h-40 animate-pulse rounded-3xl bg-zinc-200" />
          <div className="h-32 animate-pulse rounded-3xl bg-zinc-200" />
        </div>
      </AppShell>
    );
  }

  if (isError || !complaint) {
    return (
      <AppShell role={user?.role} maxWidth="default">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-xs">
          <AlertCircle size={32} className="mx-auto text-rose-500" />
          <h1 className="mt-3 text-lg font-bold text-zinc-900">
            Complaint Not Found
          </h1>
          <p className="mt-1 text-xs text-zinc-500">
            The requested maintenance ticket could not be loaded.
          </p>
          <button
            onClick={() => router.push("/staff/complaints")}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white active:scale-95 transition-all"
          >
            <span>Back to directory</span>
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role={user?.role} maxWidth="default">
      <div className="space-y-6">
        {/* Navigation & Actions Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200/60 pb-5">
          <div className="flex items-center gap-2">
            <Link
              href="/staff/complaints"
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-zinc-900 outline-none"
            >
              <ArrowLeft size={14} />
              <span>All Complaints</span>
            </Link>
            <span className="text-zinc-300">/</span>
            <span className="text-xs font-mono text-zinc-400">
              #{complaint.id.slice(0, 8)}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <StatusBadge status={complaint.status} size="md" />
            <PriorityBadge priority={complaint.priority} size="md" />
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex size-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-zinc-900 outline-none"
              title="Refresh"
              aria-label="Refresh complaint"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Action Controls Card: Assignment & Status Workflow */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2">
            <UserCheck size={18} className="text-zinc-700" />
            <h2 className="text-sm font-bold text-zinc-900">
              Ticket Management Controls
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Assign Staff Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 block">
                Assigned Staff Member
              </label>
              <select
                value={complaint.assigned_to_id ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) assignMutation.mutate(val);
                }}
                disabled={assignMutation.isPending || staffUsers.length === 0}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-xs sm:text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 disabled:bg-zinc-50 transition-all cursor-pointer"
              >
                <option value="">Select staff member to assign...</option>
                {staffUsers.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} ({staff.email})
                  </option>
                ))}
              </select>
              {assignMutation.isPending && (
                <p className="text-[11px] text-zinc-400 animate-pulse">
                  Updating assignment...
                </p>
              )}
            </div>

            {/* Workflow Status Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 block">
                Workflow Status Transition
              </label>
              <select
                value={complaint.status}
                onChange={(e) => {
                  const newStatus = e.target.value;
                  if (newStatus !== complaint.status) {
                    statusMutation.mutate(newStatus);
                  }
                }}
                disabled={statusMutation.isPending}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-xs sm:text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 disabled:bg-zinc-50 transition-all cursor-pointer"
              >
                <option value={complaint.status}>
                  Current: {complaint.status.replaceAll("_", " ")}
                </option>

                {complaint.status === "OPEN" && (
                  <option value="ASSIGNED">Advance to: ASSIGNED</option>
                )}

                {complaint.status === "ASSIGNED" && (
                  <option value="IN_PROGRESS">Advance to: IN PROGRESS</option>
                )}

                {complaint.status === "IN_PROGRESS" && (
                  <option value="RESOLVED">Advance to: RESOLVED</option>
                )}

                {complaint.status === "RESOLVED" && (
                  <option value="CLOSED">Advance to: CLOSED</option>
                )}
              </select>
              {statusMutation.isPending && (
                <p className="text-[11px] text-zinc-400 animate-pulse">
                  Updating status...
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Main Details Card */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                <Tag size={11} className="text-zinc-500" />
                <span>{complaint.category}</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                <Home size={11} className="text-zinc-500" />
                <span>{roomLabel(complaint)}</span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
              {complaint.title}
            </h1>

            <div className="mt-4 rounded-2xl bg-zinc-50/70 p-5 border border-zinc-100">
              <p className="text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap">
                {complaint.description}
              </p>
            </div>
          </div>

          {/* AI Assessment */}
          {complaint.ai_reason && (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5 shadow-2xs">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs mb-1.5">
                <Sparkles size={15} className="text-indigo-600 animate-pulse" />
                <span>AI Automated Triage &amp; Assessment</span>
              </div>
              <p className="text-xs sm:text-sm text-indigo-950/90 leading-relaxed">
                {complaint.ai_reason}
              </p>
            </div>
          )}

          {/* Reporter & Location Grid */}
          <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-zinc-100">
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Reported By (Resident)
              </span>
              <p className="mt-1 text-sm font-bold text-zinc-900">
                {complaint.reported_by_name}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {complaint.reported_by_email}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Affected Hostel Room
              </span>
              <p className="mt-1 text-sm font-bold text-zinc-900">
                Block {complaint.block} • Floor {complaint.floor} • Room {complaint.room_number}
              </p>
              {complaint.apartment && (
                <p className="mt-0.5 text-xs text-zinc-500">
                  Apartment {complaint.apartment}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Attachments Section */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900">
              Resident Attachments ({attachments.length})
            </h2>
            <p className="text-xs text-zinc-500">
              Photos uploaded by the student for this maintenance request
            </p>
          </div>

          {attachments.length === 0 ? (
            <p className="text-xs text-zinc-400 py-3">
              No photos or documents were attached.
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
                      <span>View File</span>
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
              Audit &amp; Activity Log
            </h2>
            <p className="text-xs text-zinc-500">
              Recorded actions, assignments, and status updates
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
