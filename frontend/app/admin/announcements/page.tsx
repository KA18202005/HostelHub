"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

type AnnouncementBlock = {
    id: string;
    announcement_id: string;
    block: string;
};

type Announcement = {
    id: string;
    title: string;
    message: string;
    hostel_id: string | null;
    created_by_id: string;
    is_active: boolean;
    created_at: string;
    blocks?: string[];
};

export default function AdminAnnouncementsPage() {
    const router = useRouter();

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deactivatingId, setDeactivatingId] = useState<string | null>(
        null
    );

    async function loadAnnouncements() {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                "/api/v1/announcements"
            );

            setAnnouncements(response.data);
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

    async function handleDeactivate(
        announcementId: string
    ) {
        const confirmed = window.confirm(
            "Are you sure you want to deactivate this announcement?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeactivatingId(announcementId);
            setError("");

            await api.patch(
                `/api/v1/announcements/${announcementId}/deactivate`
            );

            setAnnouncements((current) =>
                current.map((announcement) =>
                    announcement.id === announcementId
                        ? {
                            ...announcement,
                            is_active: false,
                        }
                        : announcement
                )
            );
        } catch (error: any) {
            console.error(
                "Failed to deactivate announcement:",
                error
            );

            if (error?.response?.status === 401) {
                localStorage.removeItem("access_token");
                router.replace("/login");
                return;
            }

            setError(
                error?.response?.data?.detail ||
                "Unable to deactivate announcement."
            );
        } finally {
            setDeactivatingId(null);
        }
    }

    return (
        <main className="min-h-screen bg-gray-50 px-6 py-8">
            <div className="mx-auto max-w-4xl">

                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <button
                            type="button"
                            onClick={() =>
                                router.push("/admin")
                            }
                            className="mb-4 text-sm font-medium text-gray-600 hover:text-gray-900"
                        >
                            ← Back to Admin
                        </button>

                        <h1 className="text-3xl font-bold text-gray-900">
                            Manage Announcements
                        </h1>

                        <p className="mt-2 text-gray-600">
                            View and manage hostel announcements.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            router.push(
                                "/admin/announcements/create"
                            )
                        }
                        className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                        Create Announcement
                    </button>
                </div>

                {error && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                        {error}
                    </div>
                )}

                {loading && (
                    <div className="rounded-2xl border bg-white p-6 shadow-sm">
                        Loading announcements...
                    </div>
                )}

                {!loading &&
                    announcements.length === 0 && (
                        <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900">
                                No announcements
                            </h2>

                            <p className="mt-2 text-sm text-gray-500">
                                There are currently no announcements.
                            </p>
                        </div>
                    )}

                {!loading &&
                    announcements.length > 0 && (
                        <div className="space-y-5">
                            {announcements.map(
                                (announcement) => (
                                    <article
                                        key={announcement.id}
                                        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <h2 className="text-xl font-semibold text-gray-900">
                                                        {
                                                            announcement.title
                                                        }
                                                    </h2>

                                                    <span
                                                        className={
                                                            announcement.is_active
                                                                ? "rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"
                                                                : "rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500"
                                                        }
                                                    >
                                                        {announcement.is_active
                                                            ? "Active"
                                                            : "Inactive"}
                                                    </span>
                                                </div>

                                                <p className="mt-3 whitespace-pre-wrap text-gray-700">
                                                    {
                                                        announcement.message
                                                    }
                                                </p>

                                                {announcement.blocks &&
                                                    announcement.blocks.length >
                                                    0 && (
                                                        <div className="mt-4">
                                                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                                Hostel Blocks
                                                            </p>

                                                            <div className="mt-2 flex flex-wrap gap-2">
                                                                {announcement.blocks.map(
                                                                    (block, index) => (
                                                                        <span
                                                                            key={`${block}-${index}`}
                                                                            className="rounded-lg bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700"
                                                                        >
                                                                            {block}
                                                                        </span>
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                <p className="mt-4 text-xs text-gray-500">
                                                    {new Date(
                                                        announcement.created_at
                                                    ).toLocaleString()}
                                                </p>
                                            </div>

                                            {announcement.is_active && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDeactivate(
                                                            announcement.id
                                                        )
                                                    }
                                                    disabled={
                                                        deactivatingId ===
                                                        announcement.id
                                                    }
                                                    className="shrink-0 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {deactivatingId ===
                                                        announcement.id
                                                        ? "Deactivating..."
                                                        : "Deactivate"}
                                                </button>
                                            )}
                                        </div>
                                    </article>
                                )
                            )}
                        </div>
                    )}
            </div>
        </main>
    );
}