"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export type UserRole = "STUDENT" | "STAFF" | "ADMIN";

export type UserRoom = {
  id?: string;
  block: string;
  floor: number;
  room_number: string;
  apartment: string | null;
};

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  room_id: string | null;
  is_active: boolean;
  room?: UserRoom | null;
};

export function getDashboardRoute(role?: string | null): string {
  if (!role) return "/dashboard";
  const normalized = role.toUpperCase();
  switch (normalized) {
    case "ADMIN":
      return "/admin";
    case "STAFF":
      return "/staff";
    case "STUDENT":
      return "/student";
    default:
      return "/dashboard";
  }
}

async function fetchCurrentUser(): Promise<CurrentUser | null> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (!token) {
    return null;
  }

  const response = await api.get("/api/v1/auth/me");
  return response.data;
}

export function useCurrentUser() {
  const query = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  const user = query.data ?? null;
  const role: UserRole | null = user?.role ?? null;
  const isAuthenticated = Boolean(user);

  return {
    user,
    role,
    isAuthenticated,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}