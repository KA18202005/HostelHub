"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, ShieldCheck, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      router.replace("/dashboard");
    }
  }, [router]);

  function handleGoogleLogin() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    window.location.href = `${apiUrl}/api/v1/auth/google/login`;
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 selection:bg-zinc-900 selection:text-white">
      {/* Soft background decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 size-96 bg-blue-100/50 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 size-96 bg-indigo-100/40 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
        {/* Card */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-8 shadow-xl shadow-zinc-200/40 sm:p-10">
          <div className="text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-md">
              <Building2 size={24} />
            </div>

            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200/60">
              <Sparkles size={12} />
              <span>IIIT Bhubaneswar Portal</span>
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900">
              Welcome to HostelHub
            </h1>

            <p className="mt-2 text-xs sm:text-sm text-zinc-500 leading-relaxed">
              Sign in with your authorized university Google account to manage complaints and announcements.
            </p>
          </div>

          <div className="mt-8">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="group relative flex w-full items-center justify-center gap-3 rounded-2xl border border-zinc-200 bg-white px-5 py-3.5 text-sm font-semibold text-zinc-800 shadow-xs transition-all duration-200 hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-md active:scale-98 focus-visible:ring-2 focus-visible:ring-zinc-900 outline-none"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="shrink-0"
              >
                <path
                  fill="#4285F4"
                  d="M21.35 12.23c0-.79-.07-1.55-.23-2.27H12v4.3h5.22a4.46 4.46 0 0 1-1.94 2.92v2.42h3.14c1.84-1.69 2.93-4.18 2.93-7.37Z"
                />
                <path
                  fill="#34A853"
                  d="M12 21.5c2.63 0 4.84-.87 6.45-2.35l-3.14-2.42c-.87.58-1.98.93-3.31.93-2.54 0-4.69-1.72-5.46-4.03H3.3v2.5A9.74 9.74 0 0 0 12 21.5Z"
                />
                <path
                  fill="#FBBC05"
                  d="M6.54 13.63A5.85 5.85 0 0 1 6.23 12c0-.57.11-1.12.31-1.63v-2.5H3.3A9.74 9.74 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.37l3.24-2.74Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 6.34c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.4 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.7 5.37l3.24 2.5C7.31 8.06 9.46 6.34 12 6.34Z"
                />
              </svg>

              <span>Continue with Google</span>
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 rounded-2xl bg-zinc-50 border border-zinc-100 p-3 text-center text-xs text-zinc-500">
            <ShieldCheck size={16} className="text-zinc-400 shrink-0" />
            <span>Secured via IIIT Bhubaneswar Single Sign-On</span>
          </div>
        </div>
      </div>
    </main>
  );
}
