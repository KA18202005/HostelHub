"use client";

import { useQuery } from "@tanstack/react-query";

import api from "@/lib/api";

type Notification = {
    id: string;
    title: string;
    message: string;
    is_read: boolean;
    user_id: string;
    created_at: string;
};

async function getUnreadNotifications(): Promise<Notification[]> {
    const response = await api.get(
        "/api/v1/notifications/unread"
    );

    return response.data;
}

export function useUnreadNotifications() {
    return useQuery({
        queryKey: ["notifications", "unread"],
        queryFn: getUnreadNotifications,
        refetchInterval: 30000,
    });
}