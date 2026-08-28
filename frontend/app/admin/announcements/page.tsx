"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import {
  AlertCircle,
  Calendar,
  Loader2,
  Megaphone,
  Plus,
  RefreshCw,
  XCircle,
} from "lucide-react";
import api from "@/lib/api";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CardListSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type Announcement = {
  id: string;
  title: string;
  message: string;
  hostel_id: string | null;
  created_by_id: string;
  is_active: boolean;
  created_at: string;
  blocks?: string[];
};

const PAGE_LIMIT = 10;

export default function AdminAnnouncementsPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    announcement: Announcement | null;
  }>({ isOpen: false, announcement: null });

  const loadAnnouncements = useCallback(async () => {
    try {
      setRefreshing(true);
      setError("");

      const response = await api.get("/api/v1/announcements", {
        params: { page: 1, limit: PAGE_LIMIT },
      });
      const list = Array.isArray(response.data) ? response.data : [];
      setAnnouncements(list);
      setPage(1);
      setHasMore(list.length === PAGE_LIMIT);
    } catch (err: unknown) {
      console.error("Failed to load announcements:", err);

      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          localStorage.removeItem("access_token");
          router.replace("/login");
          return;
        }

        setError(
          err.response?.data?.detail || "Unable to load announcements."
        );
      } else {
        setError("Unable to load announcements.");
      }
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [router]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const response = await api.get("/api/v1/announcements", {
        params: { page: nextPage, limit: PAGE_LIMIT },
      });
      const nextBatch = Array.isArray(response.data) ? response.data : [];

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
        const response = await api.get("/api/v1/announcements", {
          params: { page: 1, limit: PAGE_LIMIT },
        });
        if (isMounted) {
          const list = Array.isArray(response.data) ? response.data : [];
          setAnnouncements(list);
          setPage(1);
          setHasMore(list.length === PAGE_LIMIT);
        }
      } catch {
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

  async function handleDeactivate(announcementId: string) {
    try {
      setDeactivatingId(announcementId);
      setError("");

      await api.patch(`/api/v1/announcements/${announcementId}/deactivate`);

      setAnnouncements((current) =>
        current.map((a) =>
          a.id === announcementId ? { ...a, is_active: false } : a
        )
      );
      success("Announcement deactivated successfully");
    } catch (err: unknown) {
      console.error(err);
      toastError("Failed to deactivate announcement");
    } finally {
      setDeactivatingId(null);
      setConfirmModal({ isOpen: false, announcement: null });
    }
  }

  return (
    <AppShell role="ADMIN" maxWidth="wide">
      <div className="space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200/60 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin"
                className="text-xs font-semibold text-zinc-400 hover:text-zinc-700 transition-colors focus-visible:ring-2 focus-visible:ring-zinc-900 rounded outline-none"
              >
                Admin Console
              </Link>
              <span className="text-zinc-300">/</span>
              <span className="text-xs font-semibold text-zinc-900">
                Announcements
              </span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
              Hostel Broadcasts &amp; Notices
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-500">
              Publish university-wide notices or target specific hostel blocks with file attachments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadAnnouncements}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 active:scale-95 transition-all shadow-2xs focus-visible:ring-2 focus-visible:ring-zinc-900 outline-none disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin text-zinc-900" : ""} />
              <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
            </button>

            <Link
              href="/admin/announcements/create"
              className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-zinc-800 active:scale-98 transition-all hover:shadow-md focus-visible:ring-2 focus-visible:ring-zinc-900 outline-none"
            >
              <Plus size={16} />
              <span>Create Announcement</span>
            </Link>
          </div>
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
            title="No announcements yet"
            description="Broadcast important notices, maintenance schedules, or hostel updates to residents."
            action={
              <Link
                href="/admin/announcements/create"
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
              >
                <Plus size={15} />
                <span>Create first announcement</span>
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <article
                key={announcement.id}
                className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs space-y-4 hover:border-zinc-300 transition-all"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border",
                          announcement.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                            : "bg-zinc-100 text-zinc-600 border-zinc-200"
                        )}
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            announcement.is_active ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"
                          )}
                        />
                        <span>{announcement.is_active ? "Active Notice" : "Inactive / Archived"}</span>
                      </span>

                      <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                        <Calendar size={13} />
                        <span>{new Date(announcement.created_at).toLocaleString()}</span>
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-zinc-900 pt-1">
                      {announcement.title}
                    </h2>
                  </div>

                  {announcement.is_active && (
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmModal({ isOpen: true, announcement })
                      }
                      disabled={deactivatingId === announcement.id}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/50 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 hover:text-rose-700 active:scale-95 transition-all self-start sm:self-auto focus-visible:ring-2 focus-visible:ring-rose-500 outline-none"
                    >
                      <XCircle size={14} />
                      <span>Deactivate</span>
                    </button>
                  )}
                </div>

                <p className="text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap rounded-2xl bg-zinc-50/70 p-4 border border-zinc-100">
                  {announcement.message}
                </p>

                {announcement.blocks && announcement.blocks.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      Target Blocks:
                    </span>
                    {announcement.blocks.map((block, idx) => (
                      <span
                        key={`${block}-${idx}`}
                        className="rounded-lg bg-zinc-100 border border-zinc-200 px-2 py-0.5 text-xs font-bold text-zinc-700"
                      >
                        Block {block}
                      </span>
                    ))}
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

      {/* Deactivate Confirmation Modal */}
      {confirmModal.announcement && (
        <ConfirmDialog
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, announcement: null })}
          onConfirm={() =>
            handleDeactivate(confirmModal.announcement!.id)
          }
          title="Deactivate Announcement"
          description={`Are you sure you want to deactivate "${confirmModal.announcement.title}"? It will no longer appear in resident feeds.`}
          confirmText="Deactivate"
          variant="danger"
          loading={deactivatingId === confirmModal.announcement.id}
        />
      )}
    </AppShell>
  );
}