"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2 } from "lucide-react";
import api from "@/lib/api";

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    async function redirectByRole() {
      try {
        const response = await api.get("/api/v1/auth/me");
        const role = response.data?.role?.toUpperCase();

        if (role === "ADMIN") {
          router.replace("/admin");
          return;
        }
        if (role === "STAFF") {
          router.replace("/staff");
          return;
        }
        if (role === "STUDENT") {
          router.replace("/student");
          return;
        }

        // Invalid or unknown role - clear token and safely redirect to login
        console.error("Unrecognized user role:", role);
        localStorage.removeItem("access_token");
        router.replace("/login");
      } catch (error) {
        console.error("Authentication failed:", error);
        localStorage.removeItem("access_token");
        router.replace("/login");
      }
    }

    redirectByRole();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-3xl border border-zinc-200/80 bg-white p-8 text-center shadow-xl shadow-zinc-200/40">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-xs">
          <Building2 size={22} />
        </div>

        <div className="mt-6 flex flex-col items-center justify-center">
          <Loader2 className="size-6 animate-spin text-zinc-900" />
          <h2 className="mt-3 text-base font-semibold text-zinc-900">
            Opening your dashboard
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            Verifying your workspace access...
          </p>
        </div>
      </div>
    </main>
  );
}
