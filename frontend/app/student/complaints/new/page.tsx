"use client";

import { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import api from "@/lib/api";

type Room = {
    id: string;
    block: string;
    room_number: string;
    floor: number;
    capacity: number;
    hostel_id: string;
    apartment: string | null;
};

type DuplicateDetail = {
    message: string;
    similar_complaint_id?: string;
    confidence?: number;
    reason?: string;
};

async function getRooms(): Promise<Room[]> {
    const response = await api.get("/api/v1/rooms/options");
    return response.data;
}

export default function NewComplaintPage() {
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [duplicate, setDuplicate] =
        useState<DuplicateDetail | null>(null);

    const {
        data: rooms = [],
        isLoading: roomsLoading,
        isError: roomsError,
    } = useQuery({
        queryKey: ["rooms"],
        queryFn: getRooms,
    });

    useEffect(() => {
        async function loadUser() {
            try {
                const response = await api.get("/api/v1/auth/me");
                setCurrentUser(response.data);
            } catch (error) {
                console.error("Failed to load user:", error);
            } finally {
                setLoadingUser(false);
            }
        }

        loadUser();
    }, []);

    

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setError("");
        setDuplicate(null);

        if (!currentUser?.room) {
            setError(
                "You cannot create a complaint until a room has been assigned to you.",
            );
            return;
        }

        setLoading(true);

        try {
            const response = await api.post(
                "/api/v1/complaints",
                {
                    title,
                    description,

                    // Use the room assigned by Admin.
                    block: currentUser.room.block,
                    floor: currentUser.room.floor,
                    room_number: currentUser.room.room_number,
                    apartment: currentUser.room.apartment,
                },
            );

            const complaint = response.data;

            router.push(
                `/student/complaints/${complaint.id}`,
            );
        } catch (error: any) {
            if (error?.response?.status === 409) {
                setDuplicate(error.response.data.detail);
                return;
            }

            if (error?.response?.status === 401) {
                localStorage.removeItem("access_token");
                router.replace("/login");
                return;
            }

            setError(
                error?.response?.data?.detail ||
                "Unable to create complaint.",
            );
        } finally {
            setLoading(false);
        }
    }

    if (roomsLoading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-zinc-50">
                <p className="text-sm text-zinc-500">
                    room information...
                </p>
            </main>
        );
    }

    if (roomsError) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
                <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
                    <h1 className="font-semibold text-zinc-900">
                        Unable to load rooms
                    </h1>

                    <p className="mt-2 text-sm text-zinc-500">
                        Please refresh the page and try again.
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-zinc-50">
            <header className="border-b border-zinc-200 bg-white">
                <div className="mx-auto flex h-16 max-w-4xl items-center px-6">
                    <button
                        onClick={() => router.back()}
                        className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
                    >
                        ← Back
                    </button>

                    <h1 className="ml-6 text-lg font-semibold text-zinc-900">
                        Report a Complaint
                    </h1>
                </div>
            </header>

            <div className="mx-auto max-w-2xl px-6 py-10">
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-zinc-900">
                            What is the problem?
                        </h2>

                        <p className="mt-2 text-sm text-zinc-500">
                            Describe the issue clearly so hostel staff can
                            resolve it quickly.
                        </p>
                    </div>

                    {duplicate && (
                        <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50 p-5">
                            <h3 className="font-semibold text-orange-900">
                                Similar complaint found
                            </h3>

                            <p className="mt-2 text-sm text-orange-800">
                                {duplicate.message}
                            </p>

                            {duplicate.confidence !== undefined && (
                                <p className="mt-2 text-sm text-orange-800">
                                    Confidence:{" "}
                                    {Math.round(
                                        duplicate.confidence * 100,
                                    )}
                                    %
                                </p>
                            )}

                            {duplicate.reason && (
                                <p className="mt-2 text-sm text-orange-800">
                                    {duplicate.reason}
                                </p>
                            )}

                            {duplicate.similar_complaint_id && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.push(
                                            `/student/complaints/${duplicate.similar_complaint_id}`,
                                        )
                                    }
                                    className="mt-4 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
                                >
                                    View Similar Complaint
                                </button>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >
                        <div>
                            <label
                                htmlFor="title"
                                className="mb-2 block text-sm font-medium text-zinc-700"
                            >
                                Complaint title
                            </label>

                            <input
                                id="title"
                                value={title}
                                onChange={(event) =>
                                    setTitle(event.target.value)
                                }
                                placeholder="e.g. Water leaking from ceiling"
                                required
                                maxLength={200}
                                className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="description"
                                className="mb-2 block text-sm font-medium text-zinc-700"
                            >
                                Description
                            </label>

                            <textarea
                                id="description"
                                value={description}
                                onChange={(event) =>
                                    setDescription(event.target.value)
                                }
                                placeholder="Describe what is happening..."
                                required
                                rows={6}
                                className="w-full resize-none rounded-lg border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                            />
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-zinc-900">
                                Your room
                            </h3>

                            {loadingUser ? (
                                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                                    <p className="text-sm text-zinc-500">
                                        Loading your room...
                                    </p>
                                </div>
                            ) : currentUser?.room ? (
                                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                        Assigned room
                                    </p>

                                    <p className="mt-2 font-semibold text-zinc-900">
                                        Block {currentUser.room.block}
                                        {" • "}
                                        Floor {currentUser.room.floor}
                                        {" • "}
                                        Room {currentUser.room.room_number}
                                    </p>

                                    {currentUser.room.apartment && (
                                        <p className="mt-1 text-sm text-zinc-500">
                                            Apartment {currentUser.room.apartment}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                                    <p className="font-medium text-red-700">
                                        No room assigned
                                    </p>

                                    <p className="mt-1 text-sm text-red-600">
                                        You have not been assigned a room yet.
                                        Please contact the administrator.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="rounded-lg border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={
                                    loading ||
                                    loadingUser ||
                                    !currentUser?.room
                                }

                                className="rounded-lg bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading
                                    ? "Submitting..."
                                    : "Submit Complaint"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}

function roomNumberSort(a: string, b: string) {
    const numberA = Number(a);
    const numberB = Number(b);

    if (!Number.isNaN(numberA) && !Number.isNaN(numberB)) {
        return numberA - numberB;
    }

    return a.localeCompare(b);
}