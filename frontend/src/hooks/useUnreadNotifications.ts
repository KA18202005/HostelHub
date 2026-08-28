"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export type Notification = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  user_id: string;
  created_at: string;
};

async function getUnreadNotifications(): Promise<Notification[]> {
  try {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;
    if (!token) return [];
    const response = await api.get("/api/v1/notifications/unread", {
      params: { limit: 100 },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch {
    return [];
  }
}

export function useUnreadNotifications() {
  return useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: getUnreadNotifications,
    refetchInterval: 30000,
    placeholderData: [],
  });
}