"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Bell,
    CheckCircle2,
    Clock3,
    FileText,
    Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { logout } from "@/lib/auth";

type ComplaintStatus =
    | "OPEN"
    | "ASSIGNED"
    | "IN_PROGRESS"
    | "RESOLVED"
    | "CLOSED";

type ComplaintPriority =
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "URGENT";

type DashboardComplaint = {
    id: string;
    title: string;
    priority: ComplaintPriority;
    status: ComplaintStatus;
    created_at: string;
};

type StudentDashboard = {
    total_complaints: number;
    open_complaints: number;
    in_progress_complaints: number;
    resolved_complaints: number;
    unread_notifications: number;
    recent_complaints: DashboardComplaint[];
};

async function getStudentDashboard(): Promise<StudentDashboard> {
    const response = await api.get("/api/v1/dashboard/student");

    return response.data;
}

function statusLabel(status: ComplaintStatus) {
    return status.replaceAll("_", " ");
}

function priorityClass(priority: ComplaintPriority) {
    switch (priority) {
        case "URGENT":
            return "bg-red-100 text-red-700";

        case "HIGH":
            return "bg-orange-100 text-orange-700";

        case "MEDIUM":
            return "bg-yellow-100 text-yellow-700";

        default:
            return "bg-zinc-100 text-zinc-600";
    }
}

function statusClass(status: ComplaintStatus) {
    switch (status) {
        case "OPEN":
            return "bg-blue-100 text-blue-700";

        case "ASSIGNED":
            return "bg-purple-100 text-purple-700";

        case "IN_PROGRESS":
            return "bg-yellow-100 text-yellow-700";

        case "RESOLVED":
            return "bg-green-100 text-green-700";

        case "CLOSED":
            return "bg-zinc-100 text-zinc-600";

        default:
            return "bg-zinc-100 text-zinc-600";
    }
}

export default function StudentDashboardPage() {
    const router = useRouter();

    useEffect(() => {
        async function checkStudentAccess() {
            try {
                const response = await api.get(
                    "/api/v1/auth/me"
                );

                if (response.data.role !== "STUDENT") {
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

        checkStudentAccess();
    }, [router]);

    const { data, isLoading, isError } = useQuery({
        queryKey: ["student-dashboard"],
        queryFn: getStudentDashboard,
        refetchInterval: 30000,
    });

    if (isLoading) {
        return (
            <main className="min-h-screen bg-zinc-50">
                <div className="mx-auto max-w-7xl px-6 py-10">
                    <div className="animate-pulse">
                        <div className="h-8 w-48 rounded bg-zinc-200" />
                        <div className="mt-3 h-4 w-72 rounded bg-zinc-200" />

                        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {[1, 2, 3, 4].map((item) => (
                                <div
                                    key={item}
                                    className="h-32 rounded-2xl bg-zinc-200"
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    if (isError || !data) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
                <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
                    <h1 className="text-xl font-semibold text-zinc-900">
                        Unable to load dashboard
                    </h1>

                    <p className="mt-2 text-sm text-zinc-500">
                        Please try refreshing the page.
                    </p>

                    <button
                        onClick={() => window.location.reload()}
                        className="mt-5 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white"
                    >
                        Refresh
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-zinc-50">
            {/* Header */}
            <header className="border-b border-zinc-200 bg-white">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                    <div>
                        <h1 className="text-xl font-bold text-zinc-900">
                            HostelHub
                        </h1>
                    </div>

                    <button
                        onClick={() => router.push("/notifications")}
                        className="relative rounded-lg p-2 text-zinc-600 transition hover:bg-zinc-100"
                        aria-label="Notifications"
                    >
                        <Bell size={21} />

                        {data.unread_notifications > 0 && (
                            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                                {data.unread_notifications > 9
                                    ? "9+"
                                    : data.unread_notifications}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => router.push("/announcements")}
                        className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                        Announcements
                    </button>

                    <button
                        type="button"
                        onClick={logout}
                        className="rounded-lg border border-gray-200 bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-600"
                    >
                        Logout
                    </button>
                </div>
            </header>
            <div className="mx-auto max-w-7xl px-6 py-10">
                {/* Welcome */}
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div>
                        <p className="text-sm font-medium text-zinc-500">
                            Student Dashboard
                        </p>

                        <h2 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
                            Your complaints
                        </h2>

                        <p className="mt-2 text-zinc-500">
                            Track your hostel complaints and their progress.
                        </p>
                    </div>

                    <button
                        onClick={() => router.push("/student/complaints/new")}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700"
                    >
                        <Plus size={18} />
                        Report Complaint
                    </button>
                </div>

                {/* Statistics */}
                <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Complaints"
                        value={data.total_complaints}
                        icon={<FileText size={21} />}
                    />

                    <StatCard
                        title="Open"
                        value={data.open_complaints}
                        icon={<Clock3 size={21} />}
                    />

                    <StatCard
                        title="In Progress"
                        value={data.in_progress_complaints}
                        icon={<Clock3 size={21} />}
                    />

                    <StatCard
                        title="Resolved"
                        value={data.resolved_complaints}
                        icon={<CheckCircle2 size={21} />}
                    />
                </section>

                {/* Recent complaints */}
                <section className="mt-8 rounded-2xl border border-zinc-200 bg-white">
                    <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-5">
                        <div>
                            <h3 className="font-semibold text-zinc-900">
                                Recent Complaints
                            </h3>

                            <p className="mt-1 text-sm text-zinc-500">
                                Your latest submitted complaints.
                            </p>
                        </div>

                        <button
                            onClick={() => router.push("/student/complaints")}
                            className="text-sm font-medium text-zinc-700 hover:text-zinc-950"
                        >
                            View all
                        </button>
                    </div>

                    {data.recent_complaints.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <FileText
                                size={32}
                                className="mx-auto text-zinc-300"
                            />

                            <p className="mt-3 font-medium text-zinc-700">
                                No complaints yet
                            </p>

                            <p className="mt-1 text-sm text-zinc-500">
                                Report your first hostel issue.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-100">
                            {data.recent_complaints.map((complaint) => (
                                <button
                                    key={complaint.id}
                                    onClick={() =>
                                        router.push(
                                            `/student/complaints/${complaint.id}`,
                                        )
                                    }
                                    className="flex w-full flex-col gap-3 px-6 py-5 text-left transition hover:bg-zinc-50 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="min-w-0">
                                        <h4 className="truncate font-medium text-zinc-900">
                                            {complaint.title}
                                        </h4>

                                        <p className="mt-1 text-xs text-zinc-400">
                                            {new Date(
                                                complaint.created_at,
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div className="flex shrink-0 gap-2">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-medium ${priorityClass(
                                                complaint.priority,
                                            )}`}
                                        >
                                            {complaint.priority}
                                        </span>

                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(
                                                complaint.status,
                                            )}`}
                                        >
                                            {statusLabel(complaint.status)}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

function StatCard({
    title,
    value,
    icon,
}: {
    title: string;
    value: number;
    icon: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-500">
                    {title}
                </p>

                <div className="text-zinc-400">{icon}</div>
            </div>

            <p className="mt-4 text-3xl font-bold text-zinc-900">
                {value}
            </p>
        </div>
    );
}