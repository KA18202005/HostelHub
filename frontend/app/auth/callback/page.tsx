"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function AuthCallbackPage() {
  const router = useRouter();

  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }

    started.current = true;

    async function completeLogin() {
      try {
        const params = new URLSearchParams(
          window.location.search,
        );

        const token = params.get("access_token");

        if (!token) {
          // The callback may have been opened again
          // after the token was already processed.
          const existingToken =
            localStorage.getItem("access_token");

          if (existingToken) {
            const response = await api.get("/api/v1/auth/me");

            redirectByRole(response.data.role);
            return;
          }

          throw new Error("Access token missing.");
        }

        localStorage.setItem("access_token", token);

        // Remove token from browser URL.
        window.history.replaceState(
          null,
          "",
          "/auth/callback",
        );

        const response = await api.get("/api/v1/auth/me");

        redirectByRole(response.data.role);
      } catch (error) {
        console.error("Authentication failed:", error);

        localStorage.removeItem("access_token");

        setError(
          "Unable to complete Google sign-in. Please try again.",
        );
      }
    }

    function redirectByRole(role: string) {
      if (role === "ADMIN") {
        router.replace("/admin");
        return;
      }

      if (role === "STAFF") {
        router.replace("/staff");
        return;
      }

      router.replace("/student");
    }

    completeLogin();
  }, [router]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-red-600">
            Sign-in failed
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            {error}
          </p>

          <button
            onClick={() => router.replace("/login")}
            className="mt-6 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900" />

        <p className="mt-4 text-sm text-zinc-500">
          Completing sign-in...
        </p>
      </div>
    </main>
  );
}