"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Calendar,
  Eye,
  FileText,
  Loader2,
  Megaphone,
  RefreshCw,
} from "lucide-react";
import api from "@/lib/api";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { CardListSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useCurrentUser, getDashboardRoute } from "@/src/hooks/useCurrentUser";

type AnnouncementAttachment = {
  id: string;
  announcement_id: string;
  uploaded_by_id: string;
  filename: string;
  stored_filename: string;
  content_type: string;
  file_size: number;
};

type Announcement = {
  id: string;
  title: string;
  message: string;
  hostel_id: string | null;
  created_by_id: string;
  is_active: boolean;
  created_at: string;
  blocks?: string[];
  attachments?: AnnouncementAttachment[];
};

const PAGE_LIMIT = 10;

export default function AnnouncementsPage() {
  const { error: toastError } = useToast();

  const [role, setRole] = useState<string>("STUDENT");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchBatchWithAttachments = async (pageNum: number) => {
    const response = await api.get("/api/v1/announcements", {
      params: { page: pageNum, limit: PAGE_LIMIT },
    });
    const announcementData: Announcement[] = Array.isArray(response.data) ? response.data : [];

    const withAttachments = await Promise.all(
      announcementData.map(async (announcement) => {
        try {
          const attachmentResponse = await api.get(
            `/api/v1/announcement-attachments/${announcement.id}`
          );
          return {
            ...announcement,
            attachments: Array.isArray(attachmentResponse.data) ? attachmentResponse.data : [],
          };
        } catch {
          return {
            ...announcement,
            attachments: [],
          };
        }
      })
    );
    return withAttachments;
  };

  const loadAnnouncements = useCallback(async () => {
    try {
      setRefreshing(true);
      setError("");

      const items = await fetchBatchWithAttachments(1);
      setAnnouncements(items);
      setPage(1);
      setHasMore(items.length === PAGE_LIMIT);
    } catch (err: unknown) {
      console.error("Failed to load announcements:", err);
      setError("Unable to load announcements.");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const nextBatch = await fetchBatchWithAttachments(nextPage);

      setAnnouncements((prev) => {
        const existingIds = new Set(prev.map((a) => a.id));
        const uniqueNext = nextBatch.filter((a) => !existingIds.has(a.id));
        return [...prev, ...uniqueNext];
      });

      setPage(nextPage);
      setHasMore(nextBatch.length === PAGE_LIMIT);
    } catch (err: unknown) {
      console.error("Failed to load more announcements:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const [userRes, initialItems] = await Promise.all([
          api.get("/api/v1/auth/me").catch(() => ({ data: { role: "STUDENT" } })),
          fetchBatchWithAttachments(1),
        ]);

        if (!isMounted) return;

        if (userRes.data?.role) setRole(userRes.data.role);
        setAnnouncements(initialItems);
        setPage(1);
        setHasMore(initialItems.length === PAGE_LIMIT);
      } catch (err: unknown) {
        console.error(err);
        if (isMounted) setError("Unable to load announcements.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  async function openAttachment(storedFilename: string) {
    try {
      const response = await api.get(
        `/api/v1/announcement-attachments/file/${storedFilename}`,
        {
          responseType: "blob",
        }
      );

      const blobUrl = URL.createObjectURL(response.data);
      window.open(blobUrl, "_blank");

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 60000);
    } catch (err: unknown) {
      console.error("Failed to open attachment:", err);
      toastError("Unable to open attachment");
    }
  }

  const { user } = useCurrentUser();
  const effectiveRole = user?.role ?? role;
  const homeHref = getDashboardRoute(effectiveRole);

  return (
    <AppShell role={effectiveRole} maxWidth="wide">
      <div className="space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200/60 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={homeHref}
                className="text-xs font-semibold text-zinc-400 hover:text-zinc-700 transition-colors focus-visible:ring-2 focus-visible:ring-zinc-900 rounded outline-none"
              >
                Dashboard
              </Link>
              <span className="text-zinc-300">/</span>
              <span className="text-xs font-semibold text-zinc-900">
                Announcements
              </span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
              Hostel Notice Board
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-500">
              Stay informed with official updates, scheduled maintenance, and hostel notifications.
            </p>
          </div>

          <button
            type="button"
            onClick={loadAnnouncements}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 active:scale-95 transition-all shadow-2xs self-start sm:self-auto focus-visible:ring-2 focus-visible:ring-zinc-900 outline-none disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin text-zinc-900" : ""} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <CardListSkeleton count={3} />
        ) : error ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-xs">
            <AlertCircle size={28} className="mx-auto text-rose-500" />
            <h2 className="mt-3 text-base font-bold text-zinc-900">
              Unable to load announcements
            </h2>
            <p className="mt-1 text-xs text-zinc-500">{error}</p>
            <button
              onClick={loadAnnouncements}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        ) : announcements.length === 0 ? (
          <EmptyState
            icon={<Megaphone size={28} />}
            title="No active announcements"
            description="There are currently no announcements posted for your hostel."
          />
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <article
                key={announcement.id}
                className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4 transition-all hover:border-zinc-300"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200/60">
                        <Megaphone size={11} />
                        <span>Official Notice</span>
                      </span>

                      <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                        <Calendar size={13} />
                        <span>{new Date(announcement.created_at).toLocaleString()}</span>
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-bold text-zinc-900 pt-1">
                      {announcement.title}
                    </h2>
                  </div>
                </div>

                <div className="rounded-2xl bg-zinc-50/70 p-5 border border-zinc-100">
                  <p className="text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap">
                    {announcement.message}
                  </p>
                </div>

                {/* Attachments */}
                {announcement.attachments &&
                  announcement.attachments.length > 0 && (
                    <div className="space-y-2.5 pt-2 border-t border-zinc-100">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Attached Files &amp; Documents
                      </h3>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {announcement.attachments.map((att) => (
                          <div
                            key={att.id}
                            className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-2xs"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
                                <FileText size={18} />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-bold text-zinc-900">
                                  {att.filename}
                                </p>
                                <p className="text-[10px] text-zinc-400 mt-0.5 font-medium">
                                  {att.content_type === "application/pdf"
                                    ? "PDF Document"
                                    : "Image"}{" "}
                                  • {(att.file_size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => openAttachment(att.stored_filename)}
                              className="ml-3 shrink-0 inline-flex items-center gap-1 rounded-xl bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-zinc-900 outline-none"
                            >
                              <Eye size={13} />
                              <span>View</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </article>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-6 py-3 text-xs font-semibold text-zinc-700 shadow-xs hover:bg-zinc-50 active:scale-98 transition-all hover:shadow-md focus-visible:ring-2 focus-visible:ring-zinc-900 outline-none disabled:opacity-50"
                >
                  {loadingMore && <Loader2 size={14} className="animate-spin text-zinc-900" />}
                  <span>{loadingMore ? "Loading more notices..." : "Load Older Announcements"}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}