"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Plus,
  RefreshCw,
  Search,
  Shield,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import api from "@/lib/api";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/ui/stat-card";
import { StatGridSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { getDashboardRoute } from "@/src/hooks/useCurrentUser";
import { cn } from "@/lib/utils";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  room_id: string | null;
};

type PaginatedAdminUserResponse = {
  items: AdminUser[];
  page: number;
  limit: number;
  total: number;
  pages: number;
};

type RoomOption = {
  id: string;
  block: string;
  floor: number;
  apartment: string | null;
  room_number: string;
  capacity: number;
};

type AdminDashboard = {
  total_users: number;
  total_hostels: number;
  total_rooms: number;
  total_complaints: number;
  open_complaints: number;
  unassigned_complaints: number;
  assigned_complaints: number;
  in_progress_complaints: number;
  resolved_complaints: number;
  closed_complaints: number;
};

async function getRoomOptions(): Promise<RoomOption[]> {
  const response = await api.get("/api/v1/rooms/options", {
    params: { limit: 100 },
  });
  return Array.isArray(response.data) ? response.data : [];
}

async function getAdminUsers(page: number): Promise<PaginatedAdminUserResponse> {
  const response = await api.get("/api/v1/admin/users", {
    params: {
      page,
      limit: 10,
    },
  });
  return response.data;
}

async function getAdminDashboard(): Promise<AdminDashboard> {
  const response = await api.get("/api/v1/dashboard/admin");
  return response.data;
}

export default function AdminPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [page, setPage] = useState(1);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    user: AdminUser | null;
  }>({ isOpen: false, user: null });

  useEffect(() => {
    async function checkAdminAccess() {
      try {
        const response = await api.get("/api/v1/auth/me");
        if (response.data.role !== "ADMIN") {
          router.replace(getDashboardRoute(response.data.role));
          return;
        }
      } catch (error) {
        console.error("Authentication failed:", error);
        localStorage.removeItem("access_token");
        router.replace("/login");
      }
    }

    checkAdminAccess();
  }, [router]);

  const {
    data: usersData,
    isLoading: isUsersLoading,
    isError: isUsersError,
    refetch: refetchUsers,
    isFetching: isUsersFetching,
  } = useQuery({
    queryKey: ["admin-users", page],
    queryFn: () => getAdminUsers(page),
    placeholderData: (previousData) => previousData,
  });

  const {
    data: roomOptions = [],
    isLoading: isRoomsLoading,
  } = useQuery({
    queryKey: ["room-options"],
    queryFn: getRoomOptions,
  });

  const {
    data: dashboard,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: getAdminDashboard,
  });

  const rawUsers = useMemo(() => {
    return Array.isArray(usersData?.items) ? usersData.items : [];
  }, [usersData]);

  const filteredUsers = useMemo(() => {
    return rawUsers.filter((user) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q);

      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && user.is_active) ||
        (statusFilter === "INACTIVE" && !user.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [rawUsers, search, roleFilter, statusFilter]);

  const totalUsersCount = usersData?.total ?? dashboard?.total_users ?? 0;
  const startItem = totalUsersCount > 0 && usersData ? (usersData.page - 1) * usersData.limit + 1 : 0;
  const endItem = usersData ? Math.min(usersData.page * usersData.limit, totalUsersCount) : 0;

  async function updateUserRole(userId: string, newRole: string) {
    try {
      setUpdatingUser(userId);
      await api.patch(`/api/v1/admin/users/${userId}/role`, { role: newRole });
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      success("User role updated successfully");
    } catch (err) {
      console.error(err);
      toastError("Failed to update role");
    } finally {
      setUpdatingUser(null);
    }
  }

  async function updateUserStatus(userId: string, isActive: boolean) {
    try {
      setUpdatingUser(userId);
      await api.patch(`/api/v1/admin/users/${userId}/status`, {
        is_active: isActive,
      });
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      success(isActive ? "User account activated" : "User account deactivated");
    } catch (err) {
      console.error(err);
      toastError("Failed to update user status");
    } finally {
      setUpdatingUser(null);
      setConfirmModal({ isOpen: false, user: null });
    }
  }

  async function updateUserRoom(userId: string, roomId: string | null) {
    try {
      setUpdatingUser(userId);
      await api.patch(`/api/v1/admin/users/${userId}/room`, {
        room_id: roomId || null,
      });
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      success("Room assignment updated");
    } catch (err) {
      console.error(err);
      toastError("Failed to assign room");
    } finally {
      setUpdatingUser(null);
    }
  }

  const handleRefresh = useCallback(() => {
    refetchUsers();
    refetchDashboard();
  }, [refetchUsers, refetchDashboard]);

  const isLoading = (isUsersLoading && !usersData) || isDashboardLoading;
  const isError = isUsersError || isDashboardError;

  if (isLoading) {
    return (
      <AppShell role="ADMIN" maxWidth="wide">
        <div className="space-y-8">
          <div className="flex flex-col gap-2">
            <div className="h-8 w-64 animate-pulse rounded-lg bg-zinc-200" />
            <div className="h-4 w-96 animate-pulse rounded-lg bg-zinc-200" />
          </div>
          <StatGridSkeleton count={4} />
          <div className="h-96 animate-pulse rounded-3xl bg-zinc-200" />
        </div>
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell role="ADMIN" maxWidth="wide">
        <div className="mx-auto max-w-md py-12">
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-xl shadow-zinc-200/30">
            <AlertCircle size={28} className="mx-auto text-rose-500" />
            <h1 className="mt-4 text-lg font-bold text-zinc-900">
              Unable to load admin console
            </h1>
            <p className="mt-2 text-xs text-zinc-500">
              Please verify your administrator privileges and connectivity.
            </p>
            <button
              onClick={handleRefresh}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800"
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="ADMIN" maxWidth="wide">
      <div className="space-y-8">
        {/* Welcome & Actions Header */}
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center border-b border-zinc-200/60 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Administration Console
              </span>
            </div>

            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
              System Overview &amp; Users
            </h1>

            <p className="mt-1 text-xs sm:text-sm text-zinc-500">
              Manage student room allocations, maintenance staff access, and hostel infrastructure.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isUsersFetching}
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-zinc-700 hover:bg-zinc-50 active:scale-95 transition-all shadow-2xs focus-visible:ring-2 focus-visible:ring-zinc-900 outline-none disabled:opacity-50"
            >
              <RefreshCw size={14} className={isUsersFetching ? "animate-spin text-zinc-900" : ""} />
              <span>{isUsersFetching ? "Refreshing..." : "Refresh"}</span>
            </button>

            <Link
              href="/staff/complaints"
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-zinc-700 hover:bg-zinc-50 active:scale-95 transition-all shadow-2xs focus-visible:ring-2 focus-visible:ring-zinc-900 outline-none"
            >
              <FileText size={15} />
              <span>Manage Complaints</span>
            </Link>

            <Link
              href="/admin/announcements/create"
              className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-zinc-800 active:scale-98 transition-all hover:shadow-md focus-visible:ring-2 focus-visible:ring-zinc-900 outline-none"
            >
              <Plus size={15} />
              <span>New Announcement</span>
            </Link>
          </div>
        </div>

        {/* User Metric Stats with Stagger */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <StatCard
              label="Total Accounts"
              value={totalUsersCount}
              icon={<Users size={19} />}
              variant="default"
            />
          </div>
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-100">
            <StatCard
              label="Hostels"
              value={dashboard?.total_hostels ?? 0}
              icon={<UserCheck size={19} />}
              variant="blue"
              description="Active student hostels"
            />
          </div>
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150">
            <StatCard
              label="Rooms"
              value={dashboard?.total_rooms ?? roomOptions.length}
              icon={<Shield size={19} />}
              variant="purple"
              description="Hostel room units"
            />
          </div>
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200">
            <StatCard
              label="Total Complaints"
              value={dashboard?.total_complaints ?? 0}
              icon={<CheckCircle2 size={19} />}
              variant="emerald"
              description="All-time reported issues"
            />
          </div>
        </section>

        {/* Complaints Overview Summary */}
        {dashboard && (
          <section className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-zinc-900">
                Complaint Pipeline Overview
              </h2>
              <p className="text-xs text-zinc-500">
                Live complaint metrics across all hostel blocks
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 pt-1">
              <div className="rounded-2xl bg-zinc-50 p-4 border border-zinc-100">
                <span className="text-[11px] font-semibold uppercase text-zinc-400">Total</span>
                <p className="mt-1 text-2xl font-bold text-zinc-900">{dashboard.total_complaints}</p>
              </div>
              <div className="rounded-2xl bg-blue-50/50 p-4 border border-blue-100">
                <span className="text-[11px] font-semibold uppercase text-blue-600">Open</span>
                <p className="mt-1 text-2xl font-bold text-blue-900">{dashboard.open_complaints}</p>
              </div>
              <div className="rounded-2xl bg-purple-50/50 p-4 border border-purple-100">
                <span className="text-[11px] font-semibold uppercase text-purple-600">Assigned</span>
                <p className="mt-1 text-2xl font-bold text-purple-900">{dashboard.assigned_complaints}</p>
              </div>
              <div className="rounded-2xl bg-amber-50/50 p-4 border border-amber-100">
                <span className="text-[11px] font-semibold uppercase text-amber-600">In Progress</span>
                <p className="mt-1 text-2xl font-bold text-amber-900">{dashboard.in_progress_complaints}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50/50 p-4 border border-emerald-100">
                <span className="text-[11px] font-semibold uppercase text-emerald-600">Resolved</span>
                <p className="mt-1 text-2xl font-bold text-emerald-900">{dashboard.resolved_complaints}</p>
              </div>
            </div>
          </section>
        )}

        {/* Users Management Section */}
        <section className="rounded-3xl border border-zinc-200/80 bg-white shadow-xs overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-zinc-100 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-900">
                User Management Directory
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                {totalUsersCount > 0 ? (
                  <>
                    Showing <span className="font-bold text-zinc-700">{startItem}–{endItem}</span> of{" "}
                    <span className="font-bold text-zinc-700">{totalUsersCount}</span> registered accounts
                  </>
                ) : (
                  "Registered university members"
                )}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 sm:w-64">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search name or email..."
                  className="w-full rounded-2xl border border-zinc-200 bg-white py-2 pl-9 pr-8 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 transition-all"
                />
                {search.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                    aria-label="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 transition-colors cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                <option value="STUDENT">Students</option>
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Admins</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 transition-colors cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>
            </div>
          </div>

          {rawUsers.length === 0 && totalUsersCount === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<Users size={28} />}
                title="No users found"
                description="No user accounts have been registered in the database."
              />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<Users size={28} />}
                title="No matching users on this page"
                description="No user accounts on this page match your search or filter settings."
                action={
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setRoleFilter("ALL");
                      setStatusFilter("ALL");
                      setPage(1);
                    }}
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-2xs active:scale-95 transition-all"
                  >
                    Reset filters
                  </button>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/50 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    <th className="py-3.5 pl-6 pr-4">User</th>
                    <th className="py-3.5 px-4">Role Allocation</th>
                    <th className="py-3.5 px-4">Assigned Room</th>
                    <th className="py-3.5 pr-6 pl-4 text-right">Account Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs">
                  {filteredUsers.map((user) => {
                    const isBusy = updatingUser === user.id;

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-zinc-50/60 transition-colors"
                      >
                        <td className="py-4 pl-6 pr-4">
                          <div>
                            <p className="font-bold text-zinc-900">{user.name}</p>
                            <p className="text-[11px] text-zinc-400">{user.email}</p>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <select
                            value={user.role}
                            disabled={isBusy}
                            onChange={(e) =>
                              updateUserRole(user.id, e.target.value)
                            }
                            className="rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 disabled:opacity-50 transition-colors cursor-pointer"
                          >
                            <option value="STUDENT">STUDENT</option>
                            <option value="STAFF">STAFF</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>

                        <td className="py-4 px-4">
                          {user.role === "STUDENT" ? (
                            <select
                              value={user.room_id ?? ""}
                              disabled={isBusy || isRoomsLoading}
                              onChange={(e) =>
                                updateUserRoom(user.id, e.target.value || null)
                              }
                              className="w-full max-w-[220px] rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-700 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 disabled:opacity-50 transition-colors cursor-pointer truncate"
                            >
                              <option value="">No Room (Unassigned)</option>
                              {roomOptions.map((room) => (
                                <option key={room.id} value={room.id}>
                                  Block {room.block} • Rm {room.room_number}
                                  {room.apartment ? ` (${room.apartment})` : ""}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-zinc-400 text-xs">
                              Not applicable
                            </span>
                          )}
                        </td>

                        <td className="py-4 pr-6 pl-4 text-right">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => {
                              if (user.is_active) {
                                setConfirmModal({ isOpen: true, user });
                              } else {
                                updateUserStatus(user.id, true);
                              }
                            }}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 active:scale-95",
                              user.is_active
                                ? "bg-emerald-50 text-emerald-700 hover:bg-rose-50 hover:text-rose-700 border border-emerald-200/80"
                                : "bg-rose-50 text-rose-700 hover:bg-emerald-50 hover:text-emerald-700 border border-rose-200/80"
                            )}
                          >
                            <span
                              className={cn(
                                "size-1.5 rounded-full shrink-0",
                                user.is_active ? "bg-emerald-500" : "bg-rose-500"
                              )}
                            />
                            <span>{user.is_active ? "Active" : "Inactive"}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* User Pagination */}
          {usersData && usersData.pages > 1 && (
            <div className="p-4 border-t border-zinc-100">
              <Pagination
                currentPage={usersData.page}
                totalPages={usersData.pages}
                onPageChange={(newPage) => {
                  setPage(newPage);
                }}
              />
            </div>
          )}
        </section>
      </div>

      {/* Confirmation Modal for Deactivation */}
      {confirmModal.user && (
        <ConfirmDialog
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, user: null })}
          onConfirm={() =>
            updateUserStatus(confirmModal.user!.id, false)
          }
          title="Deactivate Account"
          description={`Are you sure you want to deactivate ${confirmModal.user.name}'s account (${confirmModal.user.email})? They will lose access to the portal until reactivated.`}
          confirmText="Deactivate"
          variant="danger"
          loading={updatingUser === confirmModal.user.id}
        />
      )}
    </AppShell>
  );
}