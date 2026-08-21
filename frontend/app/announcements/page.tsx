"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

type Announcement = {
    id: string;
    title: string;
    message: string;
    hostel_id: string | null;
    created_by_id: string;
    is_active: boolean;
    created_at: string;
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