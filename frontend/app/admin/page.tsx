"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";


import api from "@/lib/api";

type AdminUser = {
    id: string;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
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

async function getAdminUsers(): Promise<AdminUser[]> {
    const response = await api.get(
        "/api/v1/admin/users"
    );

    return response.data;
}

async function getAdminDashboard(): Promise<AdminDashboard> {
    const response = await api.get(
        "/api/v1/dashboard/admin"
    );

    return response.data;
}

export default function AdminPage() {
    const router = useRouter();

    useEffect(() => {
        async function checkAdminAccess() {
            try {
                const response = await api.get(
                    "/api/v1/auth/me"
                );

                if (response.data.role !== "ADMIN") {
                    router.replace("/dashboard");
                }
            } catch (error) {
                console.error(
                    "Authentication failed:",
                    error
                );

                localStorage.removeItem("access_token");
                router.replace("/login");
            }
        }

        checkAdminAccess();
    }, [router]);


    const [updatingRole, setUpdatingRole] = useState<string | null>(
        null
    );

    const [roleFilter, setRoleFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const [search, setSearch] = useState("");

    async function updateUserRole(
        userId: string,
        role: string
    ) {
        try {
            setUpdatingRole(userId);

            await api.patch(
                `/api/v1/admin/users/${userId}/role`,
                {
                    role,
                }
            );

            window.location.reload();
        } catch (error) {
            console.error(
                "Failed to update user role:",
                error
            );
        } finally {
            setUpdatingRole(null);
        }
    }

    async function updateUserStatus(
        userId: string,
        isActive: boolean
    ) {
        try {
            setUpdatingRole(userId);

            await api.patch(
                `/api/v1/admin/users/${userId}/status`,
                {
                    is_active: isActive,
                }
            );

            window.location.reload();
        } catch (error) {
            console.error(
                "Failed to update user status:",
                error
            );
        } finally {
            setUpdatingRole(null);
        }
    }

    const {
        data: users = [],
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["admin-users"],
        queryFn: getAdminUsers,
    });

    const {
        data: dashboard,
        isLoading: isDashboardLoading,
        isError: isDashboardError,
    } = useQuery({
        queryKey: ["admin-dashboard"],
        queryFn: getAdminDashboard,
    });

    const totalUsers = users.length;

    const studentCount = users.filter(
        (user) => user.role === "STUDENT"
    ).length;

    const staffCount = users.filter(
        (user) => user.role === "STAFF"
    ).length;

    const adminCount = users.filter(
        (user) => user.role === "ADMIN"
    ).length;

    const activeUsers = users.filter(
        (user) => user.is_active
    ).length;

    const inactiveUsers = users.filter(
        (user) => !user.is_active
    ).length;

    const filteredUsers = users.filter((user) => {
        const query = search.trim().toLowerCase();

        const matchesSearch =
            !query ||
            user.name.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query);

        const matchesRole =
            roleFilter === "ALL" ||
            user.role === roleFilter;

        const matchesStatus =
            statusFilter === "ALL" ||
            (statusFilter === "ACTIVE" && user.is_active) ||
            (statusFilter === "INACTIVE" && !user.is_active);

        return (
            matchesSearch &&
            matchesRole &&
            matchesStatus
        );
    });

    if (isLoading || isDashboardLoading) {
        return (
            <main className="min-h-screen bg-zinc-50 p-8">
                <div className="mx-auto max-w-7xl">
                    <div className="animate-pulse">
                        <div className="h-8 w-48 rounded bg-zinc-200" />

                        <div className="mt-8 h-64 rounded-2xl bg-zinc-200" />
                    </div>
                </div>
            </main>
        );
    }

    if (isError || isDashboardError) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
                <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
                    <h1 className="text-xl font-semibold text-zinc-900">
                        Unable to load admin dashboard
                    </h1>

                    <p className="mt-2 text-sm text-zinc-500">
                        Please make sure you are logged in as an admin.
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-zinc-50">
            <header className="border-b border-zinc-200 bg-white">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                    <button
                        type="button"
                        onClick={() => router.push("/admin")}
                        className="text-xl font-bold text-zinc-900"
                    >
                        HostelHub
                    </button>

                    <span className="text-sm font-medium text-zinc-500">
                        Admin Dashboard
                    </span>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-6 py-10">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900">
                            Admin Dashboard
                        </h1>

                        <p className="mt-2 text-zinc-500">
                            Manage HostelHub users and access.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            router.push("/staff/complaints")
                        }
                        className="rounded-lg bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700"
                    >
                        Manage Complaints
                    </button>
                </div>

                <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard
                        label="Total Users"
                        value={totalUsers}
                    />

                    <StatCard
                        label="Students"
                        value={studentCount}
                    />

                    <StatCard
                        label="Staff"
                        value={staffCount}
                    />

                    <StatCard
                        label="Admins"
                        value={adminCount}
                    />

                    <StatCard
                        label="Active Users"
                        value={activeUsers}
                    />

                    <StatCard
                        label="Inactive Users"
                        value={inactiveUsers}
                    />
                </section>

                <section className="mt-8">
                    <div>
                        <h2 className="text-xl font-semibold text-zinc-900">
                            Complaint Overview
                        </h2>

                        <p className="mt-1 text-sm text-zinc-500">
                            Current hostel complaint status.
                        </p>
                    </div>

                    {dashboard && (
                        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <StatCard
                                label="Total Complaints"
                                value={dashboard.total_complaints}
                            />

                            <StatCard
                                label="Open"
                                value={dashboard.open_complaints}
                            />

                            <StatCard
                                label="Unassigned"
                                value={dashboard.unassigned_complaints}
                            />

                            <StatCard
                                label="Assigned"
                                value={dashboard.assigned_complaints}
                            />

                            <StatCard
                                label="In Progress"
                                value={dashboard.in_progress_complaints}
                            />

                            <StatCard
                                label="Resolved"
                                value={dashboard.resolved_complaints}
                            />

                            <StatCard
                                label="Closed"
                                value={dashboard.closed_complaints}
                            />
                        </div>
                    )}
                </section>

                <section className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                    <div className="flex flex-col gap-4 border-b border-zinc-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-zinc-900">
                                Users
                            </h2>

                            <p className="mt-1 text-sm text-zinc-500">
                                {filteredUsers.length} of {users.length} users
                            </p>
                        </div>

                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                            <input
                                type="text"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search by name or email..."
                                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 sm:w-64"
                            />

                            <select
                                value={roleFilter}
                                onChange={(event) =>
                                    setRoleFilter(event.target.value)
                                }
                                className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-700 outline-none focus:border-zinc-400"
                            >
                                <option value="ALL">
                                    All Roles
                                </option>

                                <option value="STUDENT">
                                    Students
                                </option>

                                <option value="STAFF">
                                    Staff
                                </option>

                                <option value="ADMIN">
                                    Admins
                                </option>
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(event.target.value)
                                }
                                className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-700 outline-none focus:border-zinc-400"
                            >
                                <option value="ALL">
                                    All Status
                                </option>

                                <option value="ACTIVE">
                                    Active
                                </option>

                                <option value="INACTIVE">
                                    Inactive
                                </option>
                            </select>
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch("");
                                    setRoleFilter("ALL");
                                    setStatusFilter("ALL");
                                }}
                                className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                            >
                                Reset
                            </button>
                        </div>

                    </div>

                    {users.length === 0 ? (
                        <div className="px-6 py-10 text-center">
                            <p className="text-sm text-zinc-500">
                                No users found.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-175 text-left">
                                <thead className="border-b border-zinc-200 bg-zinc-50">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                            Name
                                        </th>

                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                            Email
                                        </th>

                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                            Role
                                        </th>

                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                            Status
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-zinc-100">
                                    {filteredUsers.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="hover:bg-zinc-50"
                                        >
                                            <td className="px-6 py-4 text-sm font-medium text-zinc-900">
                                                {user.name}
                                            </td>

                                            <td className="px-6 py-4 text-sm text-zinc-600">
                                                {user.email}
                                            </td>

                                            <td className="px-6 py-4">
                                                <select
                                                    value={user.role}
                                                    disabled={updatingRole === user.id}
                                                    onChange={(event) =>
                                                        updateUserRole(
                                                            user.id,
                                                            event.target.value
                                                        )
                                                    }
                                                    className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:border-zinc-400 disabled:opacity-50"
                                                >
                                                    <option value="STUDENT">
                                                        STUDENT
                                                    </option>

                                                    <option value="STAFF">
                                                        STAFF
                                                    </option>

                                                    <option value="ADMIN">
                                                        ADMIN
                                                    </option>
                                                </select>
                                            </td>

                                            <td className="px-6 py-4">
                                                <button
                                                    type="button"
                                                    disabled={updatingRole === user.id}
                                                    onClick={() =>
                                                        updateUserStatus(
                                                            user.id,
                                                            !user.is_active
                                                        )
                                                    }
                                                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${user.is_active
                                                        ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700"
                                                        : "bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700"
                                                        } disabled:cursor-not-allowed disabled:opacity-50`}
                                                >
                                                    {user.is_active
                                                        ? "Active"
                                                        : "Inactive"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}


function StatCard({
    label,
    value,
}: {
    label: string;
    value: number;
}) {
    return (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <p className="text-sm font-medium text-zinc-500">
                {label}
            </p>

            <p className="mt-3 text-3xl font-bold text-zinc-900">
                {value}
            </p>
        </div>
    );
}