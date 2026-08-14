"use client";

import { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

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

    const [selectedBlock, setSelectedBlock] = useState("");
    const [selectedFloor, setSelectedFloor] = useState("");
    const [selectedApartment, setSelectedApartment] = useState("");
    const [selectedRoom, setSelectedRoom] = useState("");

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

    const blocks = useMemo(() => {
        return Array.from(
            new Set(rooms.map((room) => room.block)),
        ).sort();
    }, [rooms]);

    const floors = useMemo(() => {
        return Array.from(
            new Set(
                rooms
                    .filter((room) => room.block === selectedBlock)
                    .map((room) => room.floor),
            ),
        ).sort((a, b) => a - b);
    }, [rooms, selectedBlock]);


    const apartments = useMemo(() => {
        return Array.from(
            new Set(
                rooms
                    .filter(
                        (room) =>
                            room.block === selectedBlock &&
                            room.floor === Number(selectedFloor) &&
                            room.apartment !== null,
                    )
                    .map((room) => room.apartment)
                    .filter(
                        (apartment): apartment is string =>
                            apartment !== null,
                    ),
            ),
        ).sort();
    }, [rooms, selectedBlock, selectedFloor]);

    const availableRooms = useMemo(() => {
        return rooms
            .filter(
                (room) =>
                    room.block === selectedBlock &&
                    room.floor === Number(selectedFloor) &&
                    (room.apartment === null ||
                        room.apartment === selectedApartment),
            )
            .sort((a, b) =>
                roomNumberSort(a.room_number, b.room_number),
            );
    }, [rooms, selectedBlock, selectedFloor, selectedApartment]);

    const selectedRoomData = rooms.find(
        (room) => room.id === selectedRoom,
    );

    function handleBlockChange(value: string) {
        setSelectedBlock(value);
        setSelectedFloor("");
        setSelectedApartment("");
        setSelectedRoom("");
    }

    function handleFloorChange(value: string) {
        setSelectedFloor(value);
        setSelectedApartment("");
        setSelectedRoom("");
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setError("");
        setDuplicate(null);

        if (!selectedRoomData) {
            setError("Please select your room.");
            return;
        }

        setLoading(true);

        try {
            const response = await api.post("/api/v1/complaints", {
                title,
                description,
                block: selectedRoomData.block,
                floor: selectedRoomData.floor,
                room_number: selectedRoomData.room_number,
                apartment: selectedRoomData.apartment,
            });

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
                    Loading room information...
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

                            <div
                                className={`grid gap-4 ${apartments.length > 0
                                    ? "sm:grid-cols-4"
                                    : "sm:grid-cols-3"
                                    }`}
                            >
                                <div>
                                    <label
                                        htmlFor="block"
                                        className="mb-2 block text-sm font-medium text-zinc-700"
                                    >
                                        Block
                                    </label>

                                    <select
                                        id="block"
                                        value={selectedBlock}
                                        onChange={(event) =>
                                            handleBlockChange(event.target.value)
                                        }
                                        required
                                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-3 text-sm outline-none focus:border-zinc-900"
                                    >
                                        <option value="">
                                            Select block
                                        </option>

                                        {blocks.map((block) => (
                                            <option key={block} value={block}>
                                                {block}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {apartments.length > 0 && (
                                    <div>
                                        <label
                                            htmlFor="apartment"
                                            className="mb-2 block text-sm font-medium text-zinc-700"
                                        >
                                            Apartment
                                        </label>

                                        <select
                                            id="apartment"
                                            value={selectedApartment}
                                            onChange={(event) => {
                                                setSelectedApartment(event.target.value);
                                                setSelectedRoom("");
                                            }}
                                            disabled={!selectedFloor}
                                            required
                                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-3 text-sm outline-none disabled:bg-zinc-100 focus:border-zinc-900"
                                        >
                                            <option value="">
                                                Select apartment
                                            </option>

                                            {apartments.map((apartment) => (
                                                <option
                                                    key={apartment}
                                                    value={apartment}
                                                >
                                                    Apartment {apartment}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label
                                        htmlFor="floor"
                                        className="mb-2 block text-sm font-medium text-zinc-700"
                                    >
                                        Floor
                                    </label>

                                    <select
                                        id="floor"
                                        value={selectedFloor}
                                        onChange={(event) =>
                                            handleFloorChange(event.target.value)
                                        }
                                        disabled={!selectedBlock}
                                        required
                                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-3 text-sm outline-none disabled:bg-zinc-100 focus:border-zinc-900"
                                    >
                                        <option value="">
                                            Select floor
                                        </option>

                                        {floors.map((floor) => (
                                            <option
                                                key={floor}
                                                value={floor}
                                            >
                                                Floor {floor}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label
                                        htmlFor="room"
                                        className="mb-2 block text-sm font-medium text-zinc-700"
                                    >
                                        Room
                                    </label>

                                    <select
                                        id="room"
                                        value={selectedRoom}
                                        onChange={(event) =>
                                            setSelectedRoom(event.target.value)
                                        }
                                        disabled={!selectedFloor}
                                        required
                                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-3 text-sm outline-none disabled:bg-zinc-100 focus:border-zinc-900"
                                    >
                                        <option value="">
                                            Select room
                                        </option>

                                        {availableRooms.map((room) => (
                                            <option
                                                key={room.id}
                                                value={room.id}
                                            >
                                                Room {room.room_number}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
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
                                    !selectedRoomData ||
                                    (apartments.length > 0 && !selectedApartment)
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