"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileQuestion,
  Home,
  Loader2,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import api from "@/lib/api";
import { AppShell } from "@/components/layout/app-shell";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type UserRoom = {
  block: string;
  floor: number;
  room_number: string;
  apartment: string | null;
};

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  room: UserRoom | null;
};

type DuplicateDetail = {
  message: string;
  similar_complaint_id?: string;
  confidence?: number;
  reason?: string;
};

export default function NewComplaintPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [duplicate, setDuplicate] = useState<DuplicateDetail | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await api.get("/api/v1/auth/me");
        setCurrentUser(response.data);
      } catch (err) {
        console.error("Failed to load user:", err);
      } finally {
        setLoadingUser(false);
      }
    }

    loadUser();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setError("");
    setDuplicate(null);

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();

    if (!trimmedTitle) {
      setError("Please enter a complaint title.");
      return;
    }

    if (trimmedTitle.length < 5) {
      setError("Complaint title must be at least 5 characters.");
      return;
    }

    if (!trimmedDesc) {
      setError("Please enter a complaint description.");
      return;
    }

    if (trimmedDesc.length < 10) {
      setError("Complaint description must be at least 10 characters.");
      return;
    }

    if (!currentUser?.room) {
      setError(
        "You cannot create a complaint until a hostel room has been assigned to your account by an administrator."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/api/v1/complaints", {
        title: trimmedTitle,
        description: trimmedDesc,
        block: currentUser.room.block,
        floor: currentUser.room.floor,
        room_number: currentUser.room.room_number,
        apartment: currentUser.room.apartment,
      });

      const complaint = response.data;
      success("Complaint reported successfully!");

      if (attachment) {
        try {
          const formData = new FormData();
          formData.append("file", attachment);

          await api.post(
            `/api/v1/attachments/${complaint.id}/attachments`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );
        } catch (attachmentError) {
          console.error("Attachment upload failed:", attachmentError);
          toastError(
            "Attachment upload failed",
            "You can upload the image from the complaint details page."
          );
        }
      }

      router.push(`/student/complaints/${complaint.id}`);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 409) {
          setDuplicate(err.response.data.detail);
          return;
        }

        if (err.response?.status === 401) {
          localStorage.removeItem("access_token");
          router.replace("/login");
          return;
        }

        setError(
          err.response?.data?.detail ||
            "Unable to create complaint. Please try again."
        );
      } else {
        setError("Unable to create complaint. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell role="STUDENT" maxWidth="narrow" userName={currentUser?.name}>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2">
          <Link
            href="/student/complaints"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors focus-visible:ring-2 focus-visible:ring-zinc-900 rounded-lg outline-none"
          >
            <ArrowLeft size={14} />
            <span>Back to Complaints</span>
          </Link>
        </div>

        {/* Header */}
        <div className="border-b border-zinc-200/60 pb-5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
            Report a Maintenance Issue
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-500">
            Submit an issue for your hostel room. Our AI triage system will verify similarity and assign it to the staff.
          </p>
        </div>

        {/* Duplicate Warning Card */}
        {duplicate && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50/90 p-6 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 border border-amber-200">
                <Sparkles size={22} className="animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-amber-950">
                  Similar Existing Complaint Detected
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-amber-800 leading-relaxed">
                  {duplicate.message}
                </p>

                {duplicate.reason && (
                  <div className="mt-3 rounded-xl bg-amber-100/70 p-3 text-xs text-amber-900 font-medium">
                    <span className="font-bold">AI Analysis:</span> {duplicate.reason}
                  </div>
                )}

                {duplicate.confidence !== undefined && (
                  <div className="mt-3 space-y-1.5 max-w-xs">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                      <span>Similarity Confidence</span>
                      <span>{Math.round(duplicate.confidence * 100)}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-amber-200/80 overflow-hidden">
                      <div
                        className="h-full bg-amber-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.round(duplicate.confidence * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {duplicate.similar_complaint_id && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/student/complaints/${duplicate.similar_complaint_id}`
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-amber-800 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-900 active:scale-95 transition-all"
                    >
                      <span>View Existing Complaint</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800 flex items-center gap-3 animate-in shake duration-200">
            <AlertTriangle size={18} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Room Verification */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Home size={18} className="text-zinc-600" />
              <h2 className="text-sm font-bold text-zinc-900">
                Location &amp; Room Details
              </h2>
            </div>

            {loadingUser ? (
              <div className="flex items-center gap-3 rounded-2xl bg-zinc-50 p-4 text-xs text-zinc-400">
                <Loader2 size={16} className="animate-spin" />
                <span>Verifying your assigned hostel room...</span>
              </div>
            ) : currentUser?.room ? (
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Assigned Room
                  </span>
                  <p className="mt-0.5 text-sm font-bold text-zinc-900">
                    Block {currentUser.room.block} • Floor {currentUser.room.floor} • Room {currentUser.room.room_number}
                    {currentUser.room.apartment ? ` (Apartment ${currentUser.room.apartment})` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60 shrink-0">
                  <CheckCircle2 size={13} />
                  <span>Verified resident</span>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4">
                <p className="text-xs font-bold text-rose-900">
                  No Room Assigned
                </p>
                <p className="mt-1 text-xs text-rose-700">
                  You have not been assigned to a hostel room in the system yet. Please reach out to the hostel warden or administrator.
                </p>
              </div>
            )}
          </div>

          {/* Card 2: Complaint Information */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2">
              <FileQuestion size={18} className="text-zinc-600" />
              <h2 className="text-sm font-bold text-zinc-900">
                Issue Description
              </h2>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="title"
                  className="text-xs font-semibold text-zinc-700"
                >
                  Complaint Title <span className="text-rose-500">*</span>
                </label>
                <span
                  className={cn(
                    "text-[11px] font-medium",
                    title.length >= 5 ? "text-emerald-600" : "text-zinc-400"
                  )}
                >
                  {title.length}/200
                </span>
              </div>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Ceiling fan making humming noise / Tap leaking"
                maxLength={200}
                required
                disabled={loading}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 transition-all disabled:bg-zinc-50"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="description"
                  className="text-xs font-semibold text-zinc-700"
                >
                  Detailed Description <span className="text-rose-500">*</span>
                </label>
                <span
                  className={cn(
                    "text-[11px] font-medium",
                    description.length >= 10 ? "text-emerald-600" : "text-zinc-400"
                  )}
                >
                  {description.length >= 10 ? `${description.length} chars (valid)` : "Min. 10 chars"}
                </span>
              </div>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue clearly, including how long it has persisted and any relevant details..."
                rows={5}
                required
                disabled={loading}
                className="w-full rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 transition-all resize-none disabled:bg-zinc-50"
              />
            </div>
          </div>

          {/* Card 3: Photo Attachment */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <UploadCloud size={18} className="text-zinc-600" />
              <h2 className="text-sm font-bold text-zinc-900">
                Photo Attachment (Optional)
              </h2>
            </div>

            <FileUpload
              selectedFile={attachment}
              onFileSelect={(file) => setAttachment(file)}
              allowedTypes={["image/jpeg", "image/png", "image/webp"]}
              maxSizeMB={5}
              disabled={loading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={loading}
              className="rounded-2xl border border-zinc-200 bg-white px-6 py-3 text-xs sm:text-sm font-semibold text-zinc-700 hover:bg-zinc-50 active:scale-95 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || loadingUser || !currentUser?.room}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-6 py-3 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-zinc-800 active:scale-98 transition-all disabled:cursor-not-allowed disabled:opacity-50 hover:shadow-md"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              <span>{loading ? "Submitting Issue..." : "Submit Complaint"}</span>
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
