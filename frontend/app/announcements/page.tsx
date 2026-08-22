"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

type AnnouncementAttachment = {
    id: string;
    announcement_id: string;
    uploaded_by_id: string;
    filename: string;
    stored_filename: string;
    content_type: string;
    file_size: number;
};

type Announcement = {
    id: string;
    title: string;
    message: string;
    hostel_id: string | null;
    created_by_id: string;
    is_active: boolean;
    created_at: string;
    attachments?: AnnouncementAttachment[];
};


export default function AnnouncementsPage() {
    const router = useRouter();

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function loadAnnouncements() {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                "/api/v1/announcements"
            );

            const announcementData: Announcement[] = response.data;

            const announcementsWithAttachments = await Promise.all(
                announcementData.map(async (announcement) => {
                    try {
                        const attachmentResponse = await api.get(
                            `/api/v1/announcement-attachments/${announcement.id}`
                        );

                        return {
                            ...announcement,
                            attachments: attachmentResponse.data,
                        };
                    } catch (attachmentError) {
                        console.error(
                            `Failed to load attachments for announcement ${announcement.id}:`,
                            attachmentError
                        );

                        return {
                            ...announcement,
                            attachments: [],
                        };
                    }
                })
            );

            setAnnouncements(announcementsWithAttachments);
        } catch (error: any) {
            console.error(
                "Failed to load announcements:",
                error
            );

            if (error?.response?.status === 401) {
                localStorage.removeItem("access_token");
                router.replace("/login");
                return;
            }

            setError(
                error?.response?.data?.detail ||
                "Unable to load announcements."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAnnouncements();
    }, []);

    async function openAttachment(
        storedFilename: string,
    ) {
        try {
            const response = await api.get(
                `/api/v1/announcement-attachments/file/${storedFilename}`,
                {
                    responseType: "blob",
                },
            );

            const blobUrl = URL.createObjectURL(
                response.data,
            );

            window.open(blobUrl, "_blank");

            setTimeout(() => {
                URL.revokeObjectURL(blobUrl);
            }, 60000);
        } catch (error: any) {
            console.error(
                "Failed to open attachment:",
                error,
            );

            if (error?.response?.status === 401) {
                localStorage.removeItem("access_token");
                router.replace("/login");
                return;
            }

            setError(
                error?.response?.data?.detail ||
                "Unable to open attachment.",
            );
        }
    }

    return (
        <main className="min-h-screen bg-gray-50 p-6">
            <div className="mx-auto max-w-4xl">

                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Announcements
                        </h1>

                        <p className="mt-1 text-gray-600">
                            Stay updated with hostel announcements.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => router.push("/dashboard")}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-100"
                    >
                        Back
                    </button>
                </div>

                {loading && (
                    <div className="rounded-xl bg-white p-6 shadow-sm">
                        Loading announcements...
                    </div>
                )}

                {!loading && error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
                        {error}
                    </div>
                )}

                {!loading &&
                    !error &&
                    announcements.length === 0 && (
                        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900">
                                No announcements
                            </h2>

                            <p className="mt-2 text-sm text-gray-500">
                                There are no announcements available right now.
                            </p>
                        </div>
                    )}

                {!loading &&
                    !error &&
                    announcements.length > 0 && (
                        <div className="space-y-4">
                            {announcements.map(
                                (announcement) => (
                                    <article
                                        key={announcement.id}
                                        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                                    >
                                        <h2 className="text-xl font-semibold text-gray-900">
                                            {announcement.title}
                                        </h2>

                                        <p className="mt-3 whitespace-pre-wrap text-gray-700">
                                            {announcement.message}
                                        </p>

                                        {announcement.attachments &&
                                            announcement.attachments.length > 0 && (
                                                <div className="mt-5 space-y-3">
                                                    <h3 className="text-sm font-semibold text-gray-900">
                                                        Attachments
                                                    </h3>

                                                    {announcement.attachments.map(
                                                        (attachment) => (
                                                            <div
                                                                key={attachment.id}
                                                                className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                                                            >
                                                                <div className="min-w-0">
                                                                    <p className="truncate text-sm font-medium text-gray-900">
                                                                        {attachment.filename}
                                                                    </p>

                                                                    <p className="mt-1 text-xs text-gray-500">
                                                                        {attachment.content_type ===
                                                                            "application/pdf"
                                                                            ? "PDF"
                                                                            : "Image"}{" "}
                                                                        •{" "}
                                                                        {(
                                                                            attachment.file_size /
                                                                            1024 /
                                                                            1024
                                                                        ).toFixed(2)}{" "}
                                                                        MB
                                                                    </p>
                                                                </div>

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        openAttachment(
                                                                            attachment.stored_filename,
                                                                        )
                                                                    }
                                                                    className="ml-4 shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                                                >
                                                                    {attachment.content_type ===
                                                                        "application/pdf"
                                                                        ? "Open PDF"
                                                                        : "View Image"}
                                                                </button>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            )}

                                        <p className="mt-4 text-xs text-gray-500">
                                            {new Date(
                                                announcement.created_at
                                            ).toLocaleString()}
                                        </p>
                                    </article>
                                )
                            )}
                        </div>
                    )}
            </div>
        </main>
    );
}