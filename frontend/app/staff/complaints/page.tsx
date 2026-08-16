"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import api from "@/lib/api";

type Complaint = {
    id: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    ai_reason: string | null;

    room_id: string;
    block: string;
    floor: number;
    room_number: string;
    apartment: string | null;

    reported_by_id: string;
    assigned_to_id: string | null;
};

async function getComplaints(): Promise<Complaint[]> {
    const response = await api.get("/api/v1/complaints/all");
    return response.data;
}

function roomLabel(complaint: Complaint) {
    if (complaint.apartment) {
        return `${complaint.block} Block • Floor ${complaint.floor} • Apartment ${complaint.apartment} • Room ${complaint.room_number}`;
    }

    return `${complaint.block} Block • Floor ${complaint.floor} • Room ${complaint.room_number}`;
}

function statusClass(status: string) {
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

function priorityClass(priority: string) {
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

export default function StaffComplaintsPage() {
    const router = useRouter();

    const {
        data: complaints,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["staff-complaints"],
        queryFn: getComplaints,
    });

    if (isLoading) {
        return (
            <main className="min-h-screen bg-zinc-50">
                <div className="mx-auto max-w-6xl px-6 py-10">
                    <div className="animate-pulse">
                        <div className="h-8 w-64 rounded bg-zinc-200" />

                        <div className="mt-8 space-y-4">
                            {[1, 2, 3, 4].map((item) => (
                                <div
                                    key={item}
                                    className="h-36 rounded-2xl bg-zinc-200"
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
                        Please check your staff authentication and try again.
                    </p>

                    <button
                        type="button"
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
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                    <button
                        type="button"
                        onClick={() => router.push("/staff")}
                        className="text-xl font-bold text-zinc-900"
                    >
                        HostelHub
                    </button>

                    <button
                        type="button"
                        onClick={() => router.push("/staff")}
                        className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
                    >
                        Staff Dashboard
                    </button>
                </div>
            </header>

            <div className="mx-auto max-w-6xl px-6 py-10">
                <div>
                    <p className="text-sm font-medium text-zinc-500">
                        Staff Dashboard
                    </p>

                    <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
                        All Complaints
                    </h1>

                    <p className="mt-2 text-zinc-500">
                        View and manage complaints submitted by students.
                    </p>
                </div>

                {!complaints || complaints.length === 0 ? (
                    <section className="mt-8 rounded-2xl border border-zinc-200 bg-white px-6 py-16 text-center">
                        <h2 className="font-semibold text-zinc-900">
                            No complaints found
                        </h2>

                        <p className="mt-2 text-sm text-zinc-500">
                            There are currently no complaints to manage.
                        </p>
                    </section>
                ) : (
                    <section className="mt-8 space-y-4">
                        {complaints.map((complaint) => (
                            <button
                                key={complaint.id}
                                type="button"
                                onClick={() =>
                                    router.push(
                                        `/staff/complaints/${complaint.id}`
                                    )
                                }
                                className="w-full rounded-2xl border border-zinc-200 bg-white p-6 text-left transition hover:border-zinc-300 hover:shadow-sm"
                            >
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="min-w-0">
                                        <h2 className="text-lg font-semibold text-zinc-900">
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
                                            {complaint.status.replaceAll(
                                                "_",
                                                " "
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
        </main>
    );
}