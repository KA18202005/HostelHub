"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  FileText,
  Home,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Tag,
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
import { useCurrentUser, getDashboardRoute } from "@/src/hooks/useCurrentUser";

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
  reported_by_name?: string;
  reported_by_email?: string;
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
  priority?: string,
  category?: string,
  search?: string
): Promise<PaginatedComplaintResponse> {
  const params: Record<string, string | number> = {
    page,
    limit: 10,
  };
  if (status && status !== "ALL") params.status = status;
  if (priority && priority !== "ALL") params.priority = priority;
  if (category && category !== "ALL") params.category = category;
  if (search && search.trim()) params.search = search.trim();

  const response = await api.get("/api/v1/complaints/all", { params });
  return response.data;
}

function roomLabel(complaint: Complaint) {
  if (complaint.apartment) {
    return `Block ${complaint.block} • Floor ${complaint.floor} • Apt ${complaint.apartment} • Room ${complaint.room_number}`;
  }
  return `Block ${complaint.block} • Floor ${complaint.floor} • Room ${complaint.room_number}`;
}

export default function StaffComplaintsPage() {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["staff-complaints", page, statusFilter, priorityFilter, categoryFilter, search],
    queryFn: () => getComplaints(page, statusFilter, priorityFilter, categoryFilter, search),
    placeholderData: (previousData) => previousData,
  });

  const rawComplaints = useMemo(() => {
    return Array.isArray(data?.items) ? data.items : [];
  }, [data]);

  const filteredComplaints = useMemo(() => {
    return rawComplaints.filter((complaint) => {
      const query = search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        complaint.title.toLowerCase().includes(query) ||
        complaint.description.toLowerCase().includes(query) ||
        complaint.category.toLowerCase().includes(query) ||
        complaint.block.toLowerCase().includes(query) ||
        complaint.room_number.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "ALL" || complaint.status === statusFilter;

      const matchesPriority =
        priorityFilter === "ALL" || complaint.priority === priorityFilter;

      const matchesCategory =
        categoryFilter === "ALL" ||
        complaint.category.toUpperCase() === categoryFilter.toUpperCase();

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesCategory
      );
    });
  }, [rawComplaints, search, statusFilter, priorityFilter, categoryFilter]);

  const hasActiveFilters =
    search !== "" ||
    statusFilter !== "ALL" ||
    priorityFilter !== "ALL" ||
    categoryFilter !== "ALL";

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };

  const handlePriorityChange = (val: string) => {
    setPriorityFilter(val);
    setPage(1);
  };

  const handleCategoryChange = (val: string) => {
    setCategoryFilter(val);
    setPage(1);
  };

  const handleResetFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setCategoryFilter("ALL");
    setPage(1);
  }, []);

  const { user } = useCurrentUser();
  const dashboardHref = getDashboardRoute(user?.role);

  const totalComplaints = data?.total ?? 0;
  const startItem = totalComplaints > 0 && data ? (data.page - 1) * data.limit + 1 : 0;
  const endItem = data ? Math.min(data.page * data.limit, totalComplaints) : 0;

  return (
    <AppShell role={user?.role} maxWidth="wide">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200/60 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={dashboardHref}
                className="text-xs font-semibold text-zinc-400 hover:text-zinc-700 transition-colors focus-visible:ring-2 focus-visible:ring-zinc-900 rounded outline-none"
              >
                Dashboard
              </Link>
              <span className="text-zinc-300">/</span>
              <span className="text-xs font-semibold text-zinc-900">
                Complaints
              </span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
              Hostel Complaints Directory
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-500">
              Search, filter, assign, and track maintenance tickets submitted across all hostels.
            </p>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 active:scale-95 transition-all shadow-2xs self-start sm:self-auto focus-visible:ring-2 focus-visible:ring-zinc-900 outline-none disabled:opacity-50"
          >
            <RefreshCw size={14} className={isFetching ? "animate-spin text-zinc-900" : ""} />
            <span>{isFetching ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>

        {/* Search and Filters Bar */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by title, description, block or room number..."
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

            {/* Filter Selects */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex items-center gap-2.5">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="rounded-2xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-zinc-700 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 transition-colors cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => handlePriorityChange(e.target.value)}
                className="rounded-2xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-zinc-700 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 transition-colors cursor-pointer"
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="col-span-2 sm:col-span-1 rounded-2xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-zinc-700 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 transition-colors cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="ELECTRICAL">Electrical</option>
                <option value="PLUMBING">Plumbing</option>
                <option value="INTERNET">Internet</option>
                <option value="CLEANING">Cleaning</option>
                <option value="FURNITURE">Furniture</option>
                <option value="WATER">Water</option>
                <option value="MESS">Mess</option>
                <option value="OTHER">Other</option>
              </select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 rounded-2xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 active:scale-95 transition-all"
                >
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-zinc-100">
            <span>
              {totalComplaints > 0 ? (
                <>
                  Showing <span className="font-bold text-zinc-700">{startItem}–{endItem}</span> of{" "}
                  <span className="font-bold text-zinc-700">{totalComplaints}</span> complaints
                  {hasActiveFilters && (
                    <span className="ml-1 text-zinc-500">
                      ({filteredComplaints.length} on this page match filters)
                    </span>
                  )}
                </>
              ) : (
                "0 complaints"
              )}
            </span>

            {data && data.pages > 1 && (
              <span className="font-medium text-zinc-500">
                Page {data.page} of {data.pages}
              </span>
            )}
          </div>
        </div>

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
              Please verify your staff authentication and network connection.
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
            title="No complaints registered"
            description="There are currently no complaints in the system queue."
          />
        ) : filteredComplaints.length === 0 ? (
          <EmptyState
            icon={<SlidersHorizontal size={28} />}
            title="No matching complaints on this page"
            description="No tickets on page match your active search term or filter criteria."
            action={
              <button
                type="button"
                onClick={handleResetFilters}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-2xs active:scale-95 transition-all"
              >
                Clear all filters
              </button>
            }
          />
        ) : (
          <div className="space-y-3.5">
            {filteredComplaints.map((complaint) => (
              <div
                key={complaint.id}
                onClick={() =>
                  router.push(`/staff/complaints/${complaint.id}`)
                }
                className="group rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-xs hover:border-zinc-300 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                        <Tag size={11} className="text-zinc-500" />
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
                  <div className="flex items-center gap-3">
                    <span>ID: {complaint.id.slice(0, 8)}...</span>
                    {complaint.assigned_to_id ? (
                      <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                        Staff Assigned
                      </span>
                    ) : (
                      <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                        Unassigned
                      </span>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1 font-semibold text-zinc-600 group-hover:text-zinc-950 transition-colors">
                    <span>Manage ticket</span>
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