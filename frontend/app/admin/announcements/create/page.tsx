"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Megaphone,
  UploadCloud,
} from "lucide-react";
import api from "@/lib/api";
import { AppShell } from "@/components/layout/app-shell";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/components/ui/toast";

export default function CreateAnnouncementPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [blocks, setBlocks] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;
    setError("");

    const trimmedTitle = title.trim();
    const trimmedMessage = message.trim();

    if (!trimmedTitle) {
      setError("Please enter an announcement title.");
      return;
    }

    if (!trimmedMessage) {
      setError("Please enter the announcement message content.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/api/v1/announcements", {
        title: trimmedTitle,
        message: trimmedMessage,
        blocks: blocks
          .split(",")
          .map((b) => b.trim())
          .filter(Boolean),
      });

      const announcementId = response.data.id;
      success("Announcement published successfully!");

      if (attachment) {
        try {
          const formData = new FormData();
          formData.append("file", attachment);

          await api.post(
            `/api/v1/announcement-attachments/${announcementId}`,
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
            "Notice created, but attachment could not be uploaded."
          );
        }
      }

      router.push("/announcements");
    } catch (err: unknown) {
      console.error("Failed to create announcement:", err);

      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          localStorage.removeItem("access_token");
          router.replace("/login");
          return;
        }

        setError(
          err.response?.data?.detail || "Unable to publish announcement."
        );
      } else {
        setError("Unable to publish announcement.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell role="ADMIN" maxWidth="narrow">
      <div className="space-y-6">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Link
            href="/admin/announcements"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Announcements</span>
          </Link>
        </div>

        {/* Header */}
        <div className="border-b border-zinc-200/60 pb-5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
            Publish New Announcement
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-500">
            Create a notice for all hostel blocks or target specific resident wings.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800 flex items-center gap-3">
            <AlertTriangle size={18} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Content */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2">
              <Megaphone size={18} className="text-zinc-700" />
              <h2 className="text-sm font-bold text-zinc-900">
                Notice Content
              </h2>
            </div>

            <div>
              <label
                htmlFor="title"
                className="text-xs font-semibold text-zinc-700 block mb-1.5"
              >
                Announcement Title <span className="text-rose-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Scheduled Water Supply Maintenance / Wi-Fi Upgrade"
                required
                disabled={loading}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100 transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="text-xs font-semibold text-zinc-700 block mb-1.5"
              >
                Message &amp; Instructions <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write the full announcement details, timings, and contact instructions..."
                rows={6}
                required
                disabled={loading}
                className="w-full rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100 transition-all resize-none"
              />
            </div>

            <div>
              <label
                htmlFor="blocks"
                className="text-xs font-semibold text-zinc-700 block mb-1.5"
              >
                Target Hostel Blocks (Optional)
              </label>
              <input
                id="blocks"
                type="text"
                value={blocks}
                onChange={(e) => setBlocks(e.target.value)}
                placeholder="e.g., A, B, C (Leave blank for all hostel blocks)"
                disabled={loading}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100 transition-all"
              />
              <p className="mt-1.5 text-[11px] text-zinc-400">
                Separate multiple block letters with commas. If left empty, the broadcast is shown to all residents.
              </p>
            </div>
          </div>

          {/* Card 2: Attachment */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <UploadCloud size={18} className="text-zinc-700" />
              <h2 className="text-sm font-bold text-zinc-900">
                Attachment (Optional Document or Photo)
              </h2>
            </div>

            <FileUpload
              selectedFile={attachment}
              onFileSelect={(file) => setAttachment(file)}
              allowedTypes={[
                "image/jpeg",
                "image/png",
                "image/webp",
                "application/pdf",
              ]}
              maxSizeMB={5}
              disabled={loading}
            />
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-2">
            <button
              type="button"
              onClick={() => router.push("/admin/announcements")}
              disabled={loading}
              className="rounded-2xl border border-zinc-200 bg-white px-6 py-3 text-xs sm:text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-6 py-3 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-zinc-800 transition-all hover:shadow-md disabled:opacity-50"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              <span>{loading ? "Publishing..." : "Publish Announcement"}</span>
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
