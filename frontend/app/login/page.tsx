"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("access_token");

        if (token) {
            router.replace("/dashboard");
        }
    }, [router]);

    function handleGoogleLogin() {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        window.location.href = `${apiUrl}/api/v1/auth/google/login`;
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-6">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-zinc-900">
                        Welcome to HostelHub
                    </h1>

                    <p className="mt-2 text-sm text-zinc-500">
                        Sign in with your IIIT Bhubaneswar Google account.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="flex w-full items-center justify-center gap-3 rounded-lg border border-zinc-300 bg-white px-4 py-3 font-medium text-zinc-800 transition hover:bg-zinc-50"
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
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

                    Continue with Google
                </button>

                <p className="mt-6 text-center text-xs text-zinc-400">
                    Only authorized IIIT Bhubaneswar accounts can access HostelHub.
                </p>
            </div>
        </main>
    );
}