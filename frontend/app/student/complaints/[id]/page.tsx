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

    block: string;
    floor: number;
    room_number: string;
    apartment: string | null;

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

function statusStep(status: string) {
    switch (status) {
        case "OPEN":
            return 1;

        case "ASSIGNED":
            return 2;

        case "IN_PROGRESS":
            return 3;

        case "RESOLVED":
            return 4;

        case "CLOSED":
            return 5;

        default:
            return 1;
    }
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

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewName, setPreviewName] = useState<string>("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editError, setEditError] = useState("");
    const [originalTitle, setOriginalTitle] = useState("");
    const [originalDescription, setOriginalDescription] = useState("");

    async function handleUpdateComplaint() {
        if (!complaint) {
            return;
        }

        const title = complaint.title.trim();
        const description = complaint.description.trim();

        if (!title) {
            setEditError("Title is required.");
            return;
        }

        if (title.length > 200) {
            setEditError("Title must not exceed 200 characters.");
            return;
        }

        if (!description) {
            setEditError("Description is required.");
            return;
        }

        if (description.length < 10) {
            setEditError("Description must be at least 10 characters.");
            return;
        }

        if (
            title === originalTitle.trim() &&
            description === originalDescription.trim()
        ) {
            setEditing(false);
            return;
        }

        try {
            setSaving(true);
            setEditError("");

            const response = await api.patch(
                `/api/v1/complaints/${complaintId}`,
                {
                    title,
                    description,
                },
            );

            setComplaint(response.data);
            setEditing(false);

            await loadComplaint();
        } catch (err: any) {
            setEditError(
                err?.response?.data?.detail ||
                "Unable to update complaint.",
            );
        } finally {
            setSaving(false);
        }
    }

    async function loadComplaint() {
        try {
            setLoading(true);
            setError("");

            const complaintResponse = await api.get(
                `/api/v1/complaints/${complaintId}`
            );

            const complaintData = complaintResponse.data;

            setComplaint(complaintData);

            const [roomResponse, historyResponse, attachmentResponse] =
                await Promise.all([
                    api.get(
                        `/api/v1/rooms/${complaintData.room_id}`
                    ),
                    api.get(
                        `/api/v1/complaints/${complaintId}/history`
                    ),
                    api.get(
                        `/api/v1/attachments/${complaintId}/attachments`
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

    useEffect(() => {
        if (!complaintId) {
            return;
        }

        loadComplaint();
    }, [complaintId]);


    useEffect(() => {
        if (!complaintId || editing) {
            return;
        }

        const interval = setInterval(() => {
            loadComplaint();
        }, 30000);

        return () => {
            clearInterval(interval);
        };
    }, [complaintId, editing]);

    async function handleUpload(
        event: React.ChangeEvent<HTMLInputElement>,
    ) {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        if (!allowedTypes.includes(file.type)) {
            setUploadError(
                "Only JPG, PNG, and WEBP images are allowed.",
            );
            event.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setUploadError(
                "Image size must not exceed 5 MB.",
            );
            event.target.value = "";
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

            setPreviewUrl(url);
            setPreviewName(storedFilename);
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
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <button
                            onClick={() => router.push("/student")}
                            className="mb-3 text-sm text-zinc-500 hover:text-zinc-900"
                        >
                            ← Back to dashboard
                        </button>

                        <h1 className="text-2xl font-semibold text-zinc-900">
                            Complaint Details
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <span
                            className={`rounded-full px-3 py-1 text-sm font-medium ${complaint.status === "OPEN"
                                ? "bg-blue-100 text-blue-700"
                                : complaint.status === "ASSIGNED"
                                    ? "bg-purple-100 text-purple-700"
                                    : complaint.status === "IN_PROGRESS"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : complaint.status === "RESOLVED"
                                            ? "bg-green-100 text-green-700"
                                            : complaint.status === "CLOSED"
                                                ? "bg-zinc-100 text-zinc-600"
                                                : "bg-zinc-100 text-zinc-700"
                                }`}
                        >
                            {formatStatus(complaint.status)}
                        </span>

                        <button
                            type="button"
                            onClick={loadComplaint}
                            disabled={loading}
                            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>
                </div>
                {/* Complaint */}
                <section className="rounded-xl border border-zinc-200 bg-white p-6">
                    <h2 className="text-xl font-semibold text-zinc-900">
                        {complaint.title}
                    </h2>

                    {!editing &&
                        complaint.status !== "RESOLVED" &&
                        complaint.status !== "CLOSED" && (
                            <button
                                type="button"
                                onClick={() => {
                                    setOriginalTitle(complaint.title);
                                    setOriginalDescription(complaint.description);
                                    setEditError("");
                                    setEditing(true);
                                }}
                                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                            >
                                Edit Complaint
                            </button>
                        )}

                    {editing && complaint && (
                        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6">
                            <h2 className="text-lg font-semibold text-zinc-900">
                                Edit Complaint
                            </h2>

                            <div className="mt-5 space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-zinc-700">
                                        Title
                                    </label>

                                    <input
                                        type="text"
                                        value={complaint.title}
                                        onChange={(event) =>
                                            setComplaint({
                                                ...complaint,
                                                title: event.target.value,
                                            })
                                        }
                                        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-zinc-700">
                                        Description
                                    </label>

                                    <textarea
                                        value={complaint.description}
                                        onChange={(event) =>
                                            setComplaint({
                                                ...complaint,
                                                description: event.target.value,
                                            })
                                        }
                                        rows={5}
                                        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={handleUpdateComplaint}
                                        disabled={saving}
                                        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                                    >
                                        {saving ? "Saving..." : "Save Changes"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditing(false);
                                            setEditError("");
                                            loadComplaint();
                                        }}
                                        disabled={saving}
                                        className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>

                                {editError && (
                                    <p className="text-sm text-red-600">
                                        {editError}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {!editing && (
                        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-600">
                            {complaint.description}
                        </p>
                    )}

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


                <section className="rounded-xl border border-zinc-200 bg-white p-6">
                    <h2 className="text-lg font-semibold text-zinc-900">
                        Complaint Progress
                    </h2>

                    <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-0">
                        {[
                            { step: 1, label: "Submitted" },
                            { step: 2, label: "Assigned" },
                            { step: 3, label: "In Progress" },
                            { step: 4, label: "Resolved" },
                            { step: 5, label: "Closed" },
                        ].map((item, index, steps) => {
                            const currentStep = statusStep(
                                complaint.status
                            );

                            const completed = item.step <= currentStep;
                            const isLast = index === steps.length - 1;

                            return (
                                <div
                                    key={item.step}
                                    className="flex flex-1 items-start sm:flex-col sm:items-center"
                                >
                                    <div className="flex flex-col items-center sm:w-full sm:flex-row">
                                        <div
                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${completed
                                                ? "bg-zinc-900 text-white"
                                                : "bg-zinc-100 text-zinc-400"
                                                }`}
                                        >
                                            {item.step}
                                        </div>

                                        {!isLast && (
                                            <div
                                                className={`h-8 w-0.5 sm:h-0.5 sm:flex-1 ${item.step < currentStep
                                                    ? "bg-zinc-900"
                                                    : "bg-zinc-200"
                                                    }`}
                                            />
                                        )}
                                    </div>

                                    <p
                                        className={`mt-2 text-sm font-medium ${completed
                                            ? "text-zinc-900"
                                            : "text-zinc-400"
                                            }`}
                                    >
                                        {item.label}
                                    </p>
                                </div>
                            );
                        })}
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

                    {previewUrl && (
                        <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <p className="truncate text-sm font-medium text-zinc-900">
                                    {previewName}
                                </p>

                                <button
                                    type="button"
                                    onClick={() => {
                                        URL.revokeObjectURL(previewUrl);
                                        setPreviewUrl(null);
                                        setPreviewName("");
                                    }}
                                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-200"
                                >
                                    Close
                                </button>
                            </div>

                            <img
                                src={previewUrl}
                                alt={previewName}
                                className="max-h-150 w-full rounded-lg object-contain"
                            />
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