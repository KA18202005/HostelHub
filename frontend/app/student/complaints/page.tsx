"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import api from "@/lib/api";

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
    page: number
): Promise<PaginatedComplaintResponse> {
    const response = await api.get("/api/v1/complaints", {
        params: {
            page,
            limit: 10,
        },
    });

    return response.data;
}

function statusLabel(status: ComplaintStatus) {
    return status.replaceAll("_", " ");
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

function priorityClass(priority: ComplaintPriority) {
    switch (priority) {
        case "URGENT":
            return "bg-red-100 text-red-700";

        case "HIGH":
            return "bg-orange-100 text-orange-700";

        case "MEDIUM":
            return "bg-yellow-100 text-yellow-700";

        case "LOW":
            return "bg-zinc-100 text-zinc-600";

        default:
            return "bg-zinc-100 text-zinc-600";
    }
}

function roomLabel(complaint: Complaint) {
    if (complaint.apartment) {
        return `${complaint.block} Block • Floor ${complaint.floor} • Apartment ${complaint.apartment} • Room ${complaint.room_number}`;
    }

    return `${complaint.block} Block • Floor ${complaint.floor} • Room ${complaint.room_number}`;
}

export default function StudentComplaintsPage() {
    const router = useRouter();

    const [page, setPage] = useState(1);

    const {
        data,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["student-complaints", page],
        queryFn: () => getComplaints(page),
        placeholderData: (previousData) => previousData,
    });

    const complaints = data?.items ?? [];

    if (isLoading) {
        return (
            <main className="min-h-screen bg-zinc-50">
                <div className="mx-auto max-w-5xl px-6 py-10">
                    <div className="animate-pulse">
                        <div className="h-8 w-56 rounded bg-zinc-200" />
                        <div className="mt-3 h-4 w-80 rounded bg-zinc-200" />

                        <div className="mt-8 space-y-4">
                            {[1, 2, 3].map((item) => (
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

    if (isError) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
                <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
                    <h1 className="text-xl font-semibold text-zinc-900">
                        Unable to load complaints
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
            <header className="border-b border-zinc-200 bg-white">
                <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
                    <button
                        onClick={() => router.push("/student")}
                        className="text-xl font-bold text-zinc-900"
                    >
                        HostelHub
                    </button>

                    <button
                        onClick={() =>
                            router.push("/student/complaints/new")
                        }
                        className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700"
                    >
                        <Plus size={17} />
                        Report Complaint
                    </button>
                </div>
            </header>

            <div className="mx-auto max-w-5xl px-6 py-10">
                <div>
                    <p className="text-sm font-medium text-zinc-500">
                        Student Dashboard
                    </p>

                    <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
                        All Complaints
                    </h1>

                    <p className="mt-2 text-zinc-500">
                        View and track all complaints you have submitted.
                    </p>
                </div>

                {!complaints || complaints.length === 0 ? (
                    <section className="mt-8 rounded-2xl border border-zinc-200 bg-white px-6 py-16 text-center">
                        <FileText
                            size={40}
                            className="mx-auto text-zinc-300"
                        />

                        <h2 className="mt-4 font-semibold text-zinc-900">
                            No complaints yet
                        </h2>

                        <p className="mt-2 text-sm text-zinc-500">
                            You haven't submitted any complaints.
                        </p>

                        <button
                            onClick={() =>
                                router.push(
                                    "/student/complaints/new"
                                )
                            }
                            className="mt-6 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white"
                        >
                            Report a Complaint
                        </button>
                    </section>
                ) : (
                    <section className="mt-8 space-y-4">
                        {complaints.map((complaint) => (
                            <button
                                key={complaint.id}
                                type="button"
                                onClick={() =>
                                    router.push(
                                        `/student/complaints/${complaint.id}`
                                    )
                                }
                                className="w-full rounded-2xl border border-zinc-200 bg-white p-6 text-left transition hover:border-zinc-300 hover:shadow-sm"
                            >
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <h2 className="truncate text-lg font-semibold text-zinc-900">
                                            {complaint.title}
                                        </h2>

                                        <p className="mt-2 line-clamp-2 text-sm text-zinc-500">
                                            {complaint.description}
                                        </p>

                                        <p className="mt-3 text-xs text-zinc-400">
                                            {roomLabel(complaint)}
                                        </p>
                                    </div>

                                    <div className="flex shrink-0 gap-2">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-medium ${priorityClass(
                                                complaint.priority
                                            )}`}
                                        >
                                            {complaint.priority}
                                        </span>

                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(
                                                complaint.status
                                            )}`}
                                        >
                                            {statusLabel(
                                                complaint.status
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4">
                                    <span className="text-xs text-zinc-400">
                                        {complaint.category}
                                    </span>

                                    <span className="text-xs font-medium text-zinc-500">
                                        View details →
                                    </span>
                                </div>
                            </button>
                        ))}
                    </section>

                )}
            </div>
            {data && data.pages > 1 && (
                <div className="mt-6 flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-6 py-4">
                    <button
                        type="button"
                        onClick={() => setPage((current) => current - 1)}
                        disabled={page === 1}
                        className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Previous
                    </button>

                    <span className="text-sm text-zinc-500">
                        Page {data.page} of {data.pages}
                    </span>

                    <button
                        type="button"
                        onClick={() => setPage((current) => current + 1)}
                        disabled={page === data.pages}
                        className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            )}
        </main>
    );
}