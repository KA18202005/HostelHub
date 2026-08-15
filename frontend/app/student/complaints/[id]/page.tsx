"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
    reported_by_id: string;
    assigned_to_id: string | null;
};

type Room = {
    id: string;
    block: string;
    floor: number;
    room_number: string;
    apartment: string | null;
    capacity: number;
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

function formatStatus(status: string) {
    return status.replaceAll("_", " ");
}

function formatDate(date: string) {
    return new Date(date).toLocaleString();
}

export default function ComplaintDetailPage() {
    const params = useParams();
    const router = useRouter();

    const complaintId = params.id as string;

    const [complaint, setComplaint] = useState<Complaint | null>(null);
    const [room, setRoom] = useState<Room | null>(null);
    const [history, setHistory] = useState<ComplaintHistory[]>([]);
    const [attachments, setAttachments] = useState<ComplaintAttachment[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadComplaint() {
            try {
                setLoading(true);
                setError("");

                const complaintResponse = await api.get(
                    `/api/v1/complaints/${complaintId}`,
                );

                const complaintData = complaintResponse.data;

                setComplaint(complaintData);

                const [roomResponse, historyResponse, attachmentResponse] =
                    await Promise.all([
                        api.get(
                            `/api/v1/rooms/${complaintData.room_id}`,
                        ),
                        api.get(
                            `/api/v1/complaints/${complaintId}/history`,
                        ),
                        api.get(
                            `/api/v1/attachments/${complaintId}/attachments`,
                        ),
                    ]);

                setRoom(roomResponse.data);
                setHistory(historyResponse.data);
                setAttachments(attachmentResponse.data);
            } catch (err) {
                console.error(err);
                setError("Unable to load complaint.");
            } finally {
                setLoading(false);
            }
        }

        if (complaintId) {
            loadComplaint();
        }
    }, [complaintId]);

    async function handleUpload(
        event: React.ChangeEvent<HTMLInputElement>,
    ) {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        try {
            setUploading(true);
            setUploadError("");

            const formData = new FormData();
            formData.append("file", file);

            const response = await api.post(
                `/api/v1/attachments/${complaintId}/attachments`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                },
            );

            setAttachments((current) => [
                ...current,
                response.data,
            ]);

            event.target.value = "";
        } catch (err) {
            console.error(err);
            setUploadError("Failed to upload attachment.");
        } finally {
            setUploading(false);
        }
    }


    async function openAttachment(storedFilename: string) {
        try {
            const response = await api.get<Blob>(
                `/api/v1/attachments/file/${encodeURIComponent(
                    storedFilename
                )}`,
                {
                    responseType: "blob",
                }
            );

            const url = window.URL.createObjectURL(response.data);

            window.open(url, "_blank");

            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 10000);
        } catch (error) {
            console.error("Failed to open attachment:", error);
        }
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-zinc-50 p-6">
                <div className="mx-auto max-w-4xl">
                    <p className="text-sm text-zinc-500">
                        Loading complaint...
                    </p>
                </div>
            </main>
        );
    }

    if (error || !complaint) {
        return (
            <main className="min-h-screen bg-zinc-50 p-6">
                <div className="mx-auto max-w-4xl">
                    <div className="rounded-xl border border-red-200 bg-white p-6">
                        <h1 className="text-lg font-semibold text-red-600">
                            Unable to load complaint
                        </h1>

                        <p className="mt-2 text-sm text-zinc-600">
                            {error || "Complaint not found."}
                        </p>

                        <button
                            onClick={() =>
                                router.push("/student")
                            }
                            className="mt-5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
                        >
                            Back to dashboard
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-zinc-50 p-6">
            <div className="mx-auto max-w-4xl space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <button
                            onClick={() =>
                                router.push("/student")
                            }
                            className="mb-3 text-sm text-zinc-500 hover:text-zinc-900"
                        >
                            ← Back to dashboard
                        </button>

                        <h1 className="text-2xl font-semibold text-zinc-900">
                            Complaint Details
                        </h1>
                    </div>

                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-700">
                        {formatStatus(complaint.status)}
                    </span>
                </div>

                {/* Complaint */}
                <section className="rounded-xl border border-zinc-200 bg-white p-6">
                    <h2 className="text-xl font-semibold text-zinc-900">
                        {complaint.title}
                    </h2>

                    <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-600">
                        {complaint.description}
                    </p>

                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                        <div>
                            <p className="text-xs font-medium text-zinc-500">
                                Category
                            </p>

                            <p className="mt-1 text-sm font-medium text-zinc-900">
                                {complaint.category}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-medium text-zinc-500">
                                Priority
                            </p>

                            <p className="mt-1 text-sm font-medium text-zinc-900">
                                {complaint.priority}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-medium text-zinc-500">
                                Assigned to
                            </p>

                            <p className="mt-1 text-sm font-medium text-zinc-900">
                                {complaint.assigned_to_id
                                    ? "Staff assigned"
                                    : "Not assigned"}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Room */}
                {room && (
                    <section className="rounded-xl border border-zinc-200 bg-white p-6">
                        <h2 className="text-lg font-semibold text-zinc-900">
                            Affected Room
                        </h2>

                        <div className="mt-4 grid gap-4 sm:grid-cols-4">
                            <div>
                                <p className="text-xs text-zinc-500">
                                    Block
                                </p>
                                <p className="mt-1 font-medium text-zinc-900">
                                    {room.block}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-zinc-500">
                                    Floor
                                </p>
                                <p className="mt-1 font-medium text-zinc-900">
                                    {room.floor}
                                </p>
                            </div>

                            {room.apartment && (
                                <div>
                                    <p className="text-xs text-zinc-500">
                                        Apartment
                                    </p>
                                    <p className="mt-1 font-medium text-zinc-900">
                                        {room.apartment}
                                    </p>
                                </div>
                            )}

                            <div>
                                <p className="text-xs text-zinc-500">
                                    Room
                                </p>
                                <p className="mt-1 font-medium text-zinc-900">
                                    {room.room_number}
                                </p>
                            </div>
                        </div>
                    </section>
                )}

                {/* AI reason */}
                {complaint.ai_reason && (
                    <section className="rounded-xl border border-zinc-200 bg-white p-6">
                        <h2 className="text-lg font-semibold text-zinc-900">
                            AI Assessment
                        </h2>

                        <p className="mt-3 text-sm leading-6 text-zinc-600">
                            {complaint.ai_reason}
                        </p>
                    </section>
                )}

                {/* Attachments */}
                <section className="rounded-xl border border-zinc-200 bg-white p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-zinc-900">
                                Attachments
                            </h2>

                            <p className="mt-1 text-sm text-zinc-500">
                                Upload photos or other files related to this complaint.
                            </p>
                        </div>

                        <label className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
                            {uploading ? "Uploading..." : "Upload File"}

                            <input
                                type="file"
                                className="hidden"
                                onChange={handleUpload}
                                disabled={uploading}
                            />
                        </label>
                    </div>

                    {uploadError && (
                        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                            {uploadError}
                        </p>
                    )}

                    {attachments.length === 0 ? (
                        <p className="mt-6 text-sm text-zinc-500">
                            No attachments uploaded.
                        </p>
                    ) : (
                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            {attachments.map((attachment) => {
                                const isImage =
                                    attachment.content_type.startsWith("image/");

                                return (
                                    <div
                                        key={attachment.id}
                                        className="rounded-lg border border-zinc-200 p-4"
                                    >
                                        {isImage ? (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openAttachment(
                                                        attachment.stored_filename
                                                    )
                                                }
                                                className="mb-3 flex h-48 w-full items-center justify-center rounded-lg bg-zinc-100 text-sm font-medium text-blue-600 hover:bg-zinc-200"
                                            >
                                                Open image
                                            </button>
                                        ) : (
                                            <div className="mb-3 flex h-48 items-center justify-center rounded-lg bg-zinc-100">
                                                <span className="text-sm text-zinc-500">
                                                    File
                                                </span>
                                            </div>
                                        )}

                                        <p className="truncate text-sm font-medium text-zinc-900">
                                            {attachment.filename}
                                        </p>

                                        <p className="mt-1 text-xs text-zinc-500">
                                            {Math.round(
                                                attachment.file_size / 1024
                                            )}{" "}
                                            KB
                                        </p>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                openAttachment(attachment.stored_filename)
                                            }
                                            className="mt-3 text-sm font-medium text-blue-600 hover:underline"
                                        >
                                            Open file
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* History */}
                <section className="rounded-xl border border-zinc-200 bg-white p-6">
                    <h2 className="text-lg font-semibold text-zinc-900">
                        Complaint History
                    </h2>

                    {history.length === 0 ? (
                        <p className="mt-4 text-sm text-zinc-500">
                            No history available.
                        </p>
                    ) : (
                        <div className="mt-5 space-y-5">
                            {history.map((item) => (
                                <div
                                    key={item.id}
                                    className="border-l-2 border-zinc-200 pl-4"
                                >
                                    <p className="text-sm font-medium text-zinc-900">
                                        {item.action}
                                    </p>

                                    <p className="mt-1 text-xs text-zinc-500">
                                        {item.user_name} ·{" "}
                                        {formatDate(
                                            item.created_at,
                                        )}
                                    </p>

                                    {(item.old_value ||
                                        item.new_value) && (
                                            <p className="mt-2 text-sm text-zinc-600">
                                                {item.old_value && (
                                                    <>
                                                        {item.old_value}
                                                    </>
                                                )}

                                                {item.old_value &&
                                                    item.new_value && (
                                                        <> → </>
                                                    )}

                                                {item.new_value && (
                                                    <>
                                                        {item.new_value}
                                                    </>
                                                )}
                                            </p>
                                        )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>

            </div>
        </main>
    );
}