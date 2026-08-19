"use client";

import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

type Notification = {
    id: string;
    title: string;
    message: string;
    is_read: boolean;
    user_id: string;
    created_at: string;
};

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function loadNotifications() {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                "/api/v1/notifications"
            );

            setNotifications(response.data);
        } catch (err) {
            console.error(err);
            setError("Unable to load notifications.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadNotifications();
    }, []);

    async function markAsRead(
        notificationId: string
    ) {
        try {
            await api.patch(
                `/api/v1/notifications/${notificationId}/read`
            );

            setNotifications((current) =>
                current.map((notification) =>
                    notification.id === notificationId
                        ? {
                            ...notification,
                            is_read: true,
                        }
                        : notification
                )
            );
        } catch (err) {
            console.error(
                "Failed to mark notification as read:",
                err
            );
        }
    }

    return (
        <main className="min-h-screen bg-zinc-50 p-6">
            <div className="mx-auto max-w-3xl">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900">
                            Notifications
                        </h1>

                        <p className="mt-1 text-sm text-zinc-500">
                            Updates about your complaints.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => router.push("/dashboard")}
                        className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                    >
                        Back to Dashboard
                    </button>
                </div>

                {loading && (
                    <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                        <p className="text-sm text-zinc-500">
                            Loading notifications...
                        </p>
                    </div>
                )}

                {error && (
                    <div className="rounded-2xl border border-red-200 bg-white p-6">
                        <p className="text-sm text-red-600">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={loadNotifications}
                            className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {!loading &&
                    !error &&
                    notifications.length === 0 && (
                        <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center">
                            <Bell
                                size={32}
                                className="mx-auto text-zinc-300"
                            />

                            <p className="mt-3 font-medium text-zinc-700">
                                No notifications
                            </p>

                            <p className="mt-1 text-sm text-zinc-500">
                                You're all caught up.
                            </p>
                        </div>
                    )}

                {!loading &&
                    !error &&
                    notifications.length > 0 && (
                        <div className="space-y-3">
                            {notifications.map(
                                (notification) => (
                                    <div
                                        key={notification.id}
                                        className={`rounded-2xl border bg-white p-5 ${notification.is_read
                                                ? "border-zinc-200"
                                                : "border-blue-200 bg-blue-50/30"
                                            }`}
                                    >
                                        <div className="flex gap-4">
                                            <div className="mt-1">
                                                <Bell
                                                    size={20}
                                                    className={
                                                        notification.is_read
                                                            ? "text-zinc-400"
                                                            : "text-blue-600"
                                                    }
                                                />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                    <h2 className="font-semibold text-zinc-900">
                                                        {
                                                            notification.title
                                                        }
                                                    </h2>

                                                    <span className="text-xs text-zinc-400">
                                                        {new Date(
                                                            notification.created_at
                                                        ).toLocaleString()}
                                                    </span>
                                                </div>

                                                <p className="mt-2 text-sm leading-6 text-zinc-600">
                                                    {
                                                        notification.message
                                                    }
                                                </p>

                                                {!notification.is_read && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            markAsRead(
                                                                notification.id
                                                            )
                                                        }
                                                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-700"
                                                    >
                                                        <Check
                                                            size={14}
                                                        />
                                                        Mark as read
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    )}
            </div>
        </main>
    );
}