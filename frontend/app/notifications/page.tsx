"use client";

import { useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  AlertCircle,
  Bell,
  Check,
  Loader2,
  RefreshCw,
} from "lucide-react";
import api from "@/lib/api";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { CardListSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useCurrentUser, getDashboardRoute } from "@/src/hooks/useCurrentUser";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  user_id: string;
  created_at: string;
};

const PAGE_LIMIT = 10;

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { success } = useToast();

  const [role, setRole] = useState<string>("STUDENT");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [markingId, setMarkingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        const [userRes, notifRes] = await Promise.all([
          api.get("/api/v1/auth/me").catch(() => ({ data: { role: "STUDENT" } })),
          api.get("/api/v1/notifications", {
            params: { page: 1, limit: PAGE_LIMIT },
          }),
        ]);

        if (isMounted) {
          if (userRes.data?.role) setRole(userRes.data.role);
          const list = Array.isArray(notifRes.data) ? notifRes.data : [];
          setNotifications(list);
          setHasMore(list.length === PAGE_LIMIT);
          setPage(1);
        }
      } catch (err: unknown) {
        console.error(err);
        if (isMounted) setError("Unable to load notifications.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setError("");
      const notifRes = await api.get("/api/v1/notifications", {
        params: { page: 1, limit: PAGE_LIMIT },
      });
      const list = Array.isArray(notifRes.data) ? notifRes.data : [];
      setNotifications(list);
      setHasMore(list.length === PAGE_LIMIT);
      setPage(1);
    } catch (err: unknown) {
      console.error(err);
      setError("Unable to refresh notifications.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const notifRes = await api.get("/api/v1/notifications", {
        params: { page: nextPage, limit: PAGE_LIMIT },
      });
      const nextBatch = Array.isArray(notifRes.data) ? notifRes.data : [];

      setNotifications((prev) => {
        // De-duplicate by id in case any notification appeared during pagination
        const existingIds = new Set(prev.map((n) => n.id));
        const uniqueNext = nextBatch.filter((n) => !existingIds.has(n.id));
        return [...prev, ...uniqueNext];
      });

      setPage(nextPage);
      setHasMore(nextBatch.length === PAGE_LIMIT);
    } catch (err: unknown) {
      console.error("Failed to load more notifications:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  async function markAsRead(notificationId: string) {
    try {
      setMarkingId(notificationId);
      await api.patch(`/api/v1/notifications/${notificationId}/read`);

      setNotifications((current) =>
        current.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      await queryClient.invalidateQueries({ queryKey: ["notifications", "unread"] });
      success("Marked as read");
    } catch (err: unknown) {
      console.error("Failed to mark notification as read:", err);
    } finally {
      setMarkingId(null);
    }
  }

  const { user } = useCurrentUser();
  const effectiveRole = user?.role ?? role;
  const homeHref = getDashboardRoute(effectiveRole);

  return (
    <AppShell role={effectiveRole} maxWidth="narrow">
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
                Notifications
              </span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
              Notification Center
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-500">
              Real-time updates regarding status changes and assignments on your tickets.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
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
              Unable to load notifications
            </h2>
            <p className="mt-1 text-xs text-zinc-500">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<Bell size={28} />}
            title="All caught up!"
            description="You do not have any notifications at the moment."
          />
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "rounded-3xl border p-5 sm:p-6 transition-all duration-200",
                  notification.is_read
                    ? "border-zinc-200/80 bg-white shadow-xs"
                    : "border-blue-200/80 bg-blue-50/50 shadow-sm"
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-2xl transition-colors",
                      notification.is_read
                        ? "bg-zinc-100 text-zinc-500"
                        : "bg-blue-600 text-white shadow-xs"
                    )}
                  >
                    <Bell size={18} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold text-sm text-zinc-900">
                          {notification.title}
                        </h2>
                        {!notification.is_read && (
                          <span className="size-2 rounded-full bg-blue-600 shrink-0 animate-pulse" />
                        )}
                      </div>

                      <span className="text-[11px] text-zinc-400 shrink-0">
                        {new Date(notification.created_at).toLocaleString()}
                      </span>
                    </div>

                    <p className="mt-1 text-xs sm:text-sm text-zinc-600 leading-relaxed">
                      {notification.message}
                    </p>

                    {!notification.is_read && (
                      <div className="mt-3.5 pt-2 border-t border-blue-100/80 flex justify-end">
                        <button
                          type="button"
                          onClick={() => markAsRead(notification.id)}
                          disabled={markingId === notification.id}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-blue-200 px-3.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 active:scale-95 transition-all shadow-2xs focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
                        >
                          <Check size={13} />
                          <span>Mark as read</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
                  <span>{loadingMore ? "Loading more..." : `Load More Notifications`}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}