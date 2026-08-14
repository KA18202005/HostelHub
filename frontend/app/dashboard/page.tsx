"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    async function redirectByRole() {
      try {
        const response = await api.get("/api/v1/auth/me");

        const role = response.data.role;

        if (role === "ADMIN") {
          router.replace("/admin");
          return;
        }

        if (role === "STAFF") {
          router.replace("/staff");
          return;
        }

        router.replace("/student");
      } catch (error) {
        console.error("Authentication failed:", error);

        localStorage.removeItem("access_token");
        router.replace("/login");
      }
    }

    redirectByRole();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900" />

        <p className="mt-4 text-sm text-zinc-500">
          Loading your dashboard...
        </p>
      </div>
    </main>
  );
}