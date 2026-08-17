"use client";

import { useParams, useRouter } from "next/navigation";
import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import api from "@/lib/api";

type StaffUser = {
    id: string;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
};


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

type ComplaintAttachment = {
    id: string;
    complaint_id: string;
    uploaded_by_id: string;
    filename: string;
    stored_filename: string;
    content_type: string;
    file_size: number;
    created_at: string;
};

type ComplaintHistory = {
    id: string;
    complaint_id: string;
    user_id: string;
    user_name: string;
    action: string;
    old_value: string | null;
    new_value: string | null;
    created_at: string;
};

async function getComplaint(
    complaintId: string
): Promise<Complaint> {
    const response = await api.get(
        `/api/v1/complaints/${complaintId}`
    );

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

export default function StaffComplaintDetailPage() {
    const params = useParams();
    const router = useRouter();

    const queryClient = useQueryClient();
    const complaintId = params.id as string;

    const assignMutation = useMutation({
        mutationFn: async (assignedToId: string) => {
            const response = await api.patch(
                `/api/v1/complaints/${complaintId}/assign`,
                {
                    assigned_to_id: assignedToId,
                }
            );

            return response.data;
        },

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["staff-complaint", complaintId],
            });

            queryClient.invalidateQueries({
                queryKey: ["staff-complaints"],
            });
        },
    });

    const statusMutation = useMutation({
        mutationFn: async (status: string) => {
            const response = await api.patch(
                `/api/v1/complaints/${complaintId}/status`,
                {
                    status,
                }
            );

            return response.data;
        },

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["staff-complaint", complaintId],
            });

            queryClient.invalidateQueries({
                queryKey: ["staff-complaints"],
            });

            queryClient.invalidateQueries({
                queryKey: ["staff-dashboard"],
            });
        },
    });


    const {
        data: complaint,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["staff-complaint", complaintId],
        queryFn: () => getComplaint(complaintId),
        enabled: Boolean(complaintId),
    });



    const {
        data: attachments = [],
    } = useQuery({
        queryKey: ["staff-complaint-attachments", complaintId],
        queryFn: async (): Promise<ComplaintAttachment[]> => {
            const response = await api.get(
                `/api/v1/attachments/${complaintId}/attachments`
            );

            return response.data;
        },
        enabled: Boolean(complaintId),
    });


    const {
        data: history = [],
    } = useQuery({
        queryKey: ["staff-complaint-history", complaintId],
        queryFn: async (): Promise<ComplaintHistory[]> => {
            const response = await api.get(
                `/api/v1/complaints/${complaintId}/history`
            );

            return response.data;
        },
        enabled: Boolean(complaintId),
    });


    const {
        data: staffUsers = [],
    } = useQuery({
        queryKey: ["staff-users"],
        queryFn: async (): Promise<StaffUser[]> => {
            const response = await api.get(
                "/api/v1/admin/staff"
            );

            return response.data;
        },
    });

    if (isLoading) {
        return (
            <main className="min-h-screen bg-zinc-50">
                <div className="mx-auto max-w-5xl px-6 py-10">
                    <div className="animate-pulse">
                        <div className="h-8 w-72 rounded bg-zinc-200" />
                        <div className="mt-8 h-40 rounded-2xl bg-zinc-200" />
                        <div className="mt-6 h-32 rounded-2xl bg-zinc-200" />
                    </div>
                </div>
            </main>
        );
    }

    if (isError || !complaint) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
                <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
                    <h1 className="text-xl font-semibold text-zinc-900">
                        Complaint not found
                    </h1>

                    <p className="mt-2 text-sm text-zinc-500">
                        The complaint could not be loaded.
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            router.push("/staff/complaints")
                        }
                        className="mt-5 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white"
                    >
                        Back to Complaints
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
                        type="button"
                        onClick={() => router.push("/dashboard")}
                        className="text-xl font-bold text-zinc-900"
                    >
                        HostelHub
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            router.push("/staff/complaints")
                        }
                        className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
                    >
                        All Complaints
                    </button>
                </div>
            </header>

            <div className="mx-auto max-w-5xl px-6 py-10">
                <button
                    type="button"
                    onClick={() =>
                        router.push("/staff/complaints")
                    }
                    className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
                >
                    ← Back to complaints
                </button>

                <div className="mt-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
                                {complaint.title}
                            </h1>

                            <p className="mt-2 text-sm text-zinc-500">
                                Complaint ID: {complaint.id}
                            </p>
                        </div>

                        <div className="flex gap-2">
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
                </div>

                <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6">
                    <h2 className="text-lg font-semibold text-zinc-900">
                        Complaint
                    </h2>

                    <div className="mt-5">
                        <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-700">
                            {complaint.description}
                        </p>
                    </div>
                </section>

                <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6">
                    <h2 className="text-lg font-semibold text-zinc-900">
                        Room
                    </h2>

                    <p className="mt-3 text-sm text-zinc-600">
                        {roomLabel(complaint)}
                    </p>
                </section>

                <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6">
                    <h2 className="text-lg font-semibold text-zinc-900">
                        Complaint Information
                    </h2>

                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                                Category
                            </p>

                            <p className="mt-1 text-sm text-zinc-700">
                                {complaint.category}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                                Reported By
                            </p>

                            <p className="mt-1 break-all text-sm text-zinc-700">
                                {complaint.reported_by_id}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                                Assigned To
                            </p>

                            <select
                                value={complaint.assigned_to_id ?? ""}
                                onChange={(event) => {
                                    const assignedToId = event.target.value;

                                    if (!assignedToId) {
                                        return;
                                    }

                                    assignMutation.mutate(assignedToId);
                                }}
                                disabled={
                                    assignMutation.isPending ||
                                    staffUsers.length === 0
                                }
                                className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:border-zinc-400"
                            >
                                <option value="">
                                    Select staff member
                                </option>

                                {staffUsers.map((staff) => (
                                    <option
                                        key={staff.id}
                                        value={staff.id}
                                    >
                                        {staff.name} ({staff.email})
                                    </option>
                                ))}
                            </select>

                            {assignMutation.isPending && (
                                <p className="mt-2 text-xs text-zinc-500">
                                    Assigning complaint...
                                </p>
                            )}

                            {assignMutation.isError && (
                                <p className="mt-2 text-xs text-red-600">
                                    Failed to assign complaint. Please try again.
                                </p>
                            )}

                            {assignMutation.isSuccess && (
                                <p className="mt-2 text-xs text-green-600">
                                    Complaint assigned successfully.
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                            Status
                        </p>

                        <select
                            value={complaint.status}
                            onChange={(event) => {
                                const newStatus = event.target.value;

                                if (newStatus === complaint.status) {
                                    return;
                                }

                                statusMutation.mutate(newStatus);
                            }}
                            disabled={statusMutation.isPending}
                            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:border-zinc-400"
                        >
                            <option value={complaint.status}>
                                {complaint.status.replaceAll("_", " ")}
                            </option>

                            {complaint.status === "OPEN" && (
                                <option value="ASSIGNED">
                                    ASSIGNED
                                </option>
                            )}

                            {complaint.status === "ASSIGNED" && (
                                <option value="IN_PROGRESS">
                                    IN PROGRESS
                                </option>
                            )}

                            {complaint.status === "IN_PROGRESS" && (
                                <option value="RESOLVED">
                                    RESOLVED
                                </option>
                            )}

                            {complaint.status === "RESOLVED" && (
                                <option value="CLOSED">
                                    CLOSED
                                </option>
                            )}
                        </select>

                        {statusMutation.isPending && (
                            <p className="mt-2 text-xs text-zinc-500">
                                Updating status...
                            </p>
                        )}

                        {statusMutation.isError && (
                            <p className="mt-2 text-xs text-red-600">
                                Failed to update status. Please try again.
                            </p>
                        )}

                        {statusMutation.isSuccess && (
                            <p className="mt-2 text-xs text-green-600">
                                Status updated successfully.
                            </p>
                        )}
                    </div>
                </section>


                <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6">
                    <h2 className="text-lg font-semibold text-zinc-900">
                        Attachments
                    </h2>

                    {attachments.length === 0 ? (
                        <p className="mt-4 text-sm text-zinc-500">
                            No attachments uploaded.
                        </p>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {attachments.map((attachment) => (
                                <div
                                    key={attachment.id}
                                    className="flex items-center justify-between gap-4 rounded-xl border border-zinc-100 p-4"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-zinc-900">
                                            {attachment.filename}
                                        </p>

                                        <p className="mt-1 text-xs text-zinc-500">
                                            {Math.round(
                                                attachment.file_size / 1024
                                            )}{" "}
                                            KB
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={async () => {
                                            try {
                                                const response = await api.get<Blob>(
                                                    `/api/v1/attachments/file/${encodeURIComponent(
                                                        attachment.stored_filename
                                                    )}`,
                                                    {
                                                        responseType: "blob",
                                                    }
                                                );

                                                const url = window.URL.createObjectURL(
                                                    response.data
                                                );

                                                window.open(url, "_blank");

                                                setTimeout(() => {
                                                    window.URL.revokeObjectURL(url);
                                                }, 10000);
                                            } catch (error) {
                                                console.error(
                                                    "Failed to open attachment:",
                                                    error
                                                );
                                            }
                                        }}
                                        className="shrink-0 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                                    >
                                        Open
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6">
                    <h2 className="text-lg font-semibold text-zinc-900">
                        Activity History
                    </h2>

                    {history.length === 0 ? (
                        <p className="mt-4 text-sm text-zinc-500">
                            No activity recorded yet.
                        </p>
                    ) : (
                        <div className="mt-5 space-y-4">
                            {history.map((item) => (
                                <div
                                    key={item.id}
                                    className="border-l-2 border-zinc-200 pl-4"
                                >
                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-sm font-medium text-zinc-900">
                                            {item.action.replaceAll(
                                                "_",
                                                " "
                                            )}
                                        </p>

                                        <p className="text-xs text-zinc-400">
                                            {new Date(
                                                item.created_at
                                            ).toLocaleString()}
                                        </p>
                                    </div>

                                    <p className="mt-1 text-xs text-zinc-500">
                                        By {item.user_name}
                                    </p>

                                    {(item.old_value ||
                                        item.new_value) && (
                                            <p className="mt-2 text-sm text-zinc-600">
                                                {item.old_value && (
                                                    <>
                                                        <span className="text-zinc-400">
                                                            {item.old_value}
                                                        </span>
                                                        {" → "}
                                                    </>
                                                )}

                                                {item.new_value && (
                                                    <span className="font-medium text-zinc-700">
                                                        {item.new_value}
                                                    </span>
                                                )}
                                            </p>
                                        )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>



                {complaint.ai_reason && (
                    <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6">
                        <h2 className="text-lg font-semibold text-zinc-900">
                            AI Assessment
                        </h2>

                        <p className="mt-4 text-sm leading-7 text-zinc-600">
                            {complaint.ai_reason}
                        </p>
                    </section>
                )}
            </div>
        </main>
    );
}