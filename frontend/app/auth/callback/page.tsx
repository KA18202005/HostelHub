"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Building2, Loader2, RefreshCw } from "lucide-react";
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
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (!code) {
          const existingToken = localStorage.getItem("access_token");
          if (existingToken) {
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
            router.replace("/dashboard");
            return;
          }
          throw new Error("OAuth code missing.");
        }

        const response = await api.post("/api/v1/auth/exchange", { code });
        const token = response.data.access_token;

        if (!token) {
          throw new Error("Access token missing.");
        }

        localStorage.setItem("access_token", token);
        window.history.replaceState(null, "", "/auth/callback");

        const userResponse = await api.get("/api/v1/auth/me");
        const role = userResponse.data?.role?.toUpperCase();
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
        router.replace("/dashboard");
      } catch (err: unknown) {
        console.error("Authentication failed:", err);
        localStorage.removeItem("access_token");
        setError("Unable to complete Google sign-in. Please try again.");
      }
    }

    completeLogin();
  }, [router]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-xl shadow-zinc-200/40">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <AlertCircle size={24} />
          </div>

          <h1 className="mt-4 text-xl font-bold text-zinc-900">
            Sign-in failed
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            {error}
          </p>

          <button
            onClick={() => router.replace("/login")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw size={16} />
            <span>Try again</span>
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-3xl border border-zinc-200/80 bg-white p-8 text-center shadow-xl shadow-zinc-200/40">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-xs">
          <Building2 size={22} />
        </div>

        <div className="mt-6 flex flex-col items-center justify-center">
          <Loader2 className="size-6 animate-spin text-zinc-900" />
          <h2 className="mt-3 text-base font-semibold text-zinc-900">
            Completing sign-in
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            Authenticating your IIIT account...
          </p>
        </div>
      </div>
    </main>
  );
}
