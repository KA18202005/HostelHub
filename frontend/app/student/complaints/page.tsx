"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  FileText,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Home,
  Tag,
  ArrowRight,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge, ComplaintStatus } from "@/components/ui/status-badge";
import { PriorityBadge, ComplaintPriority } from "@/components/ui/priority-badge";
import { CardListSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

type ComplaintCategory = string;

type Complaint = {
  id: string;
  title: string;
  description: string;
  category: ComplaintCategory;
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

type PaginatedComplaintResponse = {
  items: Complaint[];
  page: number;
  limit: number;
  total: number;
  pages: number;
};

async function getComplaints(
  page: number,
  status?: string,
  search?: string
): Promise<PaginatedComplaintResponse> {
  const params: Record<string, string | number> = {
    page,
    limit: 10,
  };
  if (status && status !== "ALL") params.status = status;
  if (search && search.trim()) params.search = search.trim();

  const response = await api.get("/api/v1/complaints", { params });
  return response.data;
}

function roomLabel(complaint: Complaint) {
  if (complaint.apartment) {
    return `Block ${complaint.block} • Floor ${complaint.floor} • Apt ${complaint.apartment} • Room ${complaint.room_number}`;
  }
  return `Block ${complaint.block} • Floor ${complaint.floor} • Room ${complaint.room_number}`;
}

export default function StudentComplaintsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["student-complaints", page, statusFilter, search],
    queryFn: () => getComplaints(page, statusFilter, search),
    placeholderData: (previousData) => previousData,
  });

  const rawComplaints = useMemo(() => {
    return Array.isArray(data?.items) ? data.items : [];
  }, [data]);

  const filteredComplaints = useMemo(() => {
    return rawComplaints.filter((c) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "ALL" || c.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [rawComplaints, search, statusFilter]);

  const handleResetFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("ALL");
    setPage(1);
  }, []);

  const totalComplaints = data?.total ?? 0;
  const startItem = totalComplaints > 0 && data ? (data.page - 1) * data.limit + 1 : 0;
  const endItem = data ? Math.min(data.page * data.limit, totalComplaints) : 0;

  return (
    <AppShell role="STUDENT" maxWidth="default">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200/60 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/student"
                className="text-xs font-semibold text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                Dashboard
              </Link>
              <span className="text-zinc-300">/</span>
              <span className="text-xs font-semibold text-zinc-900">
                Complaints
              </span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
              My Complaints
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-500">
              Track and review all maintenance tickets you have submitted.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 active:scale-95 transition-all shadow-2xs focus-visible:ring-2 focus-visible:ring-zinc-900 outline-none disabled:opacity-50"
              title="Refresh complaints"
            >
              <RefreshCw size={14} className={isFetching ? "animate-spin text-zinc-900" : ""} />
              <span className="hidden sm:inline">{isFetching ? "Refreshing..." : "Refresh"}</span>
            </button>

            <Link
              href="/student/complaints/new"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-zinc-800 active:scale-98 transition-all hover:shadow-md focus-visible:ring-2 focus-visible:ring-zinc-900 outline-none"
            >
              <Plus size={16} />
              <span>Report Complaint</span>
            </Link>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by title, description or category..."
              className="w-full rounded-2xl border border-zinc-200 bg-white py-2.5 pl-10 pr-9 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 transition-all"
            />
            {search.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {["ALL", "OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-zinc-900",
                  statusFilter === st
                    ? "bg-zinc-900 text-white shadow-xs"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                )}
              >
                {st === "ALL" ? "All Statuses" : st.replaceAll("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Range and counts indicator */}
        {totalComplaints > 0 && (
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>
              Showing <span className="font-bold text-zinc-700">{startItem}–{endItem}</span> of{" "}
              <span className="font-bold text-zinc-700">{totalComplaints}</span> complaints
              {(search || statusFilter !== "ALL") && (
                <span className="ml-1 text-zinc-500">
                  ({filteredComplaints.length} on this page match filters)
                </span>
              )}
            </span>
            {data && data.pages > 1 && (
              <span className="font-medium text-zinc-500">
                Page {data.page} of {data.pages}
              </span>
            )}
          </div>
        )}

        {/* Complaints Content */}
        {isLoading ? (
          <CardListSkeleton count={4} />
        ) : isError ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-xs">
            <AlertCircle size={28} className="mx-auto text-rose-500" />
            <h2 className="mt-3 text-base font-bold text-zinc-900">
              Unable to load complaints
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              There was an error communicating with the server.
            </p>
            <button
              onClick={() => refetch()}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        ) : rawComplaints.length === 0 && totalComplaints === 0 ? (
          <EmptyState
            icon={<FileText size={28} />}
            title="No complaints found"
            description="You have not submitted any complaints yet. When you report an issue, it will show up here."
            action={
              <Link
                href="/student/complaints/new"
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 shadow-xs active:scale-95 transition-all"
              >
                <Plus size={15} />
                <span>Report an issue</span>
              </Link>
            }
          />
        ) : filteredComplaints.length === 0 ? (
          <EmptyState
            icon={<SlidersHorizontal size={28} />}
            title="No matching complaints on this page"
            description="No complaints match your current search or status filter criteria."
            action={
              <button
                type="button"
                onClick={handleResetFilters}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-2xs active:scale-95 transition-all"
              >
                Reset filters
              </button>
            }
          />
        ) : (
          <div className="space-y-3.5">
            {filteredComplaints.map((complaint) => (
              <div
                key={complaint.id}
                onClick={() =>
                  router.push(`/student/complaints/${complaint.id}`)
                }
                className="group rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-xs hover:border-zinc-300 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                        <Tag size={10} className="text-zinc-500" />
                        <span>{complaint.category}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 font-medium">
                        <Home size={11} className="text-zinc-400" />
                        <span>{roomLabel(complaint)}</span>
                      </span>
                    </div>

                    <h2 className="mt-2 text-base font-bold text-zinc-900 group-hover:text-blue-600 transition-colors truncate">
                      {complaint.title}
                    </h2>

                    <p className="mt-1 text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                      {complaint.description}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <PriorityBadge priority={complaint.priority} size="sm" />
                    <StatusBadge status={complaint.status} size="sm" />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 text-xs text-zinc-400">
                  <span>ID: {complaint.id.slice(0, 8)}...</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-zinc-600 group-hover:text-zinc-950 transition-colors">
                    <span>View details</span>
                    <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.pages > 1 && (
          <Pagination
            currentPage={data.page}
            totalPages={data.pages}
            onPageChange={(newPage) => {
              setPage(newPage);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        )}
      </div>
    </AppShell>
  );
}