"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function CreateAnnouncementPage() {
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [blocks, setBlocks] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [attachment, setAttachment] = useState<File | null>(null);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (loading) {
            return;
        }

        setError("");

        if (!title.trim()) {
            setError("Please enter an announcement title.");
            return;
        }

        if (!message.trim()) {
            setError("Please enter an announcement message.");
            return;
        }

        setLoading(true);

        try {
            const response = await api.post("/api/v1/announcements", {
                title: title.trim(),
                message: message.trim(),
                blocks: blocks
                    .split(",")
                    .map((block) => block.trim())
                    .filter(Boolean),
            });

            const announcementId = response.data.id;

            if (attachment) {
                const formData = new FormData();

                formData.append("file", attachment);

                await api.post(
                    `/api/v1/announcement-attachments/${announcementId}`,
                    formData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    },
                );
            }

            router.push("/announcements");
        } catch (error: any) {
            console.error(
                "Failed to create announcement:",
                error,
            );

            if (error?.response?.status === 401) {
                localStorage.removeItem("access_token");
                router.replace("/login");
                return;
            }

            setError(
                error?.response?.data?.detail ||
                "Unable to create announcement.",
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-gray-50 px-6 py-8">
            <div className="mx-auto max-w-3xl">
                <div className="mb-8">
                    <button
                        type="button"
                        onClick={() =>
                            router.push("/announcements")
                        }
                        className="mb-4 text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                        ← Back to Announcements
                    </button>

                    <h1 className="text-3xl font-bold text-gray-900">
                        Create Announcement
                    </h1>

                    <p className="mt-2 text-gray-600">
                        Publish an announcement for hostel
                        residents.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="rounded-2xl border bg-white p-6 shadow-sm"
                >
                    {error && (
                        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        <div>
                            <label
                                htmlFor="title"
                                className="mb-2 block text-sm font-semibold text-gray-900"
                            >
                                Title
                            </label>

                            <input
                                id="title"
                                type="text"
                                value={title}
                                onChange={(event) =>
                                    setTitle(
                                        event.target.value,
                                    )
                                }
                                placeholder="Enter announcement title"
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="message"
                                className="mb-2 block text-sm font-semibold text-gray-900"
                            >
                                Message
                            </label>

                            <textarea
                                id="message"
                                value={message}
                                onChange={(event) =>
                                    setMessage(
                                        event.target.value,
                                    )
                                }
                                placeholder="Write the announcement..."
                                rows={7}
                                className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="blocks"
                                className="mb-2 block text-sm font-semibold text-gray-900"
                            >
                                Hostel Blocks
                            </label>

                            <input
                                id="blocks"
                                type="text"
                                value={blocks}
                                onChange={(event) =>
                                    setBlocks(event.target.value)
                                }
                                placeholder="Example: A, B, C"
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
                                disabled={loading}
                            />

                            <p className="mt-2 text-xs text-gray-500">
                                Enter one or more hostel blocks separated by commas.
                                Leave empty to send the announcement to all hostels.
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="attachment"
                                className="mb-2 block text-sm font-semibold text-gray-900"
                            >
                                Attachment
                            </label>

                            <input
                                id="attachment"
                                type="file"
                                accept="image/jpeg,image/png,image/webp,application/pdf"
                                onChange={(event) => {
                                    setAttachment(
                                        event.target.files?.[0] ?? null
                                    );
                                }}
                                disabled={loading}
                                className="block w-full rounded-xl border border-gray-300 p-3 text-sm"
                            />

                            <p className="mt-2 text-xs text-gray-500">
                                Optional. JPG, PNG, or WEBP images only.
                                Maximum size: 5 MB.
                            </p>

                            {attachment && (
                                <div className="mt-3 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {attachment.name}
                                        </p>

                                        <p className="text-xs text-gray-500">
                                            {(attachment.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setAttachment(null)}
                                        disabled={loading}
                                        className="text-sm font-medium text-red-600 hover:text-red-700"
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() =>
                                    router.push(
                                        "/announcements",
                                    )
                                }
                                disabled={loading}
                                className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={loading}
                                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading
                                    ? "Publishing..."
                                    : "Publish Announcement"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </main>
    );
}