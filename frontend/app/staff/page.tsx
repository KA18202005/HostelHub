"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import api from "@/lib/api";

type Complaint = {
    id: string;
    title: string;
    priority: string;
    status: string;
    created_at?: string;
};

type StaffDashboard = {
    total_complaints: number;
    unassigned_complaints: number;
    assigned_complaints: number;
    in_progress_complaints: number;
    resolved_complaints: number;
    closed_complaints: number;
    recent_complaints: Complaint[];
};

async function getStaffDashboard(): Promise<StaffDashboard> {
    const response = await api.get(
        "/api/v1/dashboard/staff"
    );

    return response.data;
}

export default function StaffPage() {
    const router = useRouter();

    const {
        data,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["staff-dashboard"],
        queryFn: getStaffDashboard,
    });

    if (isLoading) {
        return (
            <main className="min-h-screen bg-zinc-50 p-8">
                <div className="mx-auto max-w-6xl">
                    <div className="animate-pulse">
                        <div className="h-8 w-64 rounded bg-zinc-200" />

                        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {[1, 2, 3, 4, 5, 6].map((item) => (
                                <div
                                    key={item}
                                    className="h-28 rounded-xl bg-zinc-200"
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    if (isError) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
                <div className="rounded-xl bg-white p-8 text-center shadow-sm">
                    <h1 className="text-xl font-semibold text-zinc-900">
                        Unable to load staff dashboard
                    </h1>

                    <p className="mt-2 text-sm text-zinc-500">
                        Please check that you are logged in as staff.
                    </p>
                </div>
            </main>
        );
    }

    if (!data) {
        return null;
    }

    return (
        <main className="min-h-screen bg-zinc-50">
            <header className="border-b border-zinc-200 bg-white">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                    <button
                        type="button"
                        onClick={() => router.push("/staff")}
                        className="text-xl font-bold text-zinc-900"
                    >
                        HostelHub
                    </button>

                    <span className="text-sm font-medium text-zinc-500">
                        Staff Dashboard
                    </span>
                </div>
            </header>

            <div className="mx-auto max-w-6xl px-6 py-10">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900">
                        Staff Dashboard
                    </h1>

                    <p className="mt-2 text-zinc-500">
                        Monitor and manage hostel complaints.
                    </p>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard
                        label="Total Complaints"
                        value={data.total_complaints}
                    />

                    <StatCard
                        label="Unassigned"
                        value={data.unassigned_complaints}
                    />

                    <StatCard
                        label="Assigned"
                        value={data.assigned_complaints}
                    />

                    <StatCard
                        label="In Progress"
                        value={data.in_progress_complaints}
                    />

                    <StatCard
                        label="Resolved"
                        value={data.resolved_complaints}
                    />

                    <StatCard
                        label="Closed"
                        value={data.closed_complaints}
                    />
                </div>

                <section className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-zinc-900">
                                Recent Complaints
                            </h2>

                            <p className="mt-1 text-sm text-zinc-500">
                                Latest complaints requiring attention.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                router.push("/staff/complaints")
                            }
                            className="text-sm font-medium text-blue-600 hover:underline"
                        >
                            View all
                        </button>
                    </div>

                    <div className="mt-6 space-y-3">
                        {data.recent_complaints.length === 0 ? (
                            <p className="py-8 text-center text-sm text-zinc-500">
                                No complaints found.
                            </p>
                        ) : (
                            data.recent_complaints.map(
                                (complaint) => (
                                    <button
                                        key={complaint.id}
                                        type="button"
                                        onClick={() =>
                                            router.push(
                                                `/staff/complaints/${complaint.id}`
                                            )
                                        }
                                        className="w-full rounded-xl border border-zinc-200 p-4 text-left transition hover:border-zinc-300 hover:shadow-sm"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-zinc-900">
                                                    {complaint.title}
                                                </p>

                                                <p className="mt-1 text-xs text-zinc-500">
                                                    {complaint.created_at
                                                        ? new Date(
                                                            complaint.created_at
                                                        ).toLocaleString()
                                                        : ""}
                                                </p>
                                            </div>

                                            <div className="flex shrink-0 gap-2">
                                                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                                                    {complaint.priority}
                                                </span>

                                                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                                                    {complaint.status.replaceAll(
                                                        "_",
                                                        " "
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                )
                            )
                        )}
                    </div>
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
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <p className="text-sm text-zinc-500">
                {label}
            </p>

            <p className="mt-2 text-3xl font-bold text-zinc-900">
                {value}
            </p>
        </div>
    );
}