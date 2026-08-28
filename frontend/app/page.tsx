"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Building2,
  Bell,
  FileSpreadsheet,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900 selection:bg-zinc-900 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-xs">
              <Building2 size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-zinc-900">
                HostelHub
              </span>
              <span className="text-[10px] font-medium tracking-wide text-zinc-400">
                IIIT Bhubaneswar
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 transition-colors"
            >
              <span>Get Started</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-32">
          <div className="absolute inset-0 -z-10 flex items-center justify-center">
            <div className="h-[400px] w-[700px] rounded-full bg-gradient-to-tr from-blue-100/60 to-purple-100/40 blur-3xl" />
          </div>

          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200/80 bg-white/80 px-3.5 py-1 text-xs font-medium text-zinc-600 shadow-2xs backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Sparkles size={13} className="text-blue-600" />
              <span>AI-Powered Hostel Management Platform</span>
            </div>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl text-balance">
              Smart hostel maintenance, effortless resolution.
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-zinc-600 text-balance leading-relaxed">
              Automated duplicate detection, instant maintenance staff dispatch, real-time ticket tracking, and direct campus announcements — all in one centralized hub.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-7 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-zinc-800 active:scale-98 transition-all"
              >
                <span>Access University Portal</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="border-t border-zinc-200/80 bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Built for Campus Living
              </h2>
              <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                Everything required to keep hostels running smoothly
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="rounded-3xl border border-zinc-200/80 bg-zinc-50/50 p-6 sm:p-8 transition-all hover:bg-zinc-50 hover:border-zinc-300 hover:shadow-xs">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                  <Bot size={22} />
                </div>
                <h3 className="mt-4 text-base font-bold text-zinc-900">
                  AI Duplicate Prevention
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Natural language embeddings instantly identify recurring hostel complaints to eliminate duplicate reports and avoid wasted technician visits.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="rounded-3xl border border-zinc-200/80 bg-zinc-50/50 p-6 sm:p-8 transition-all hover:bg-zinc-50 hover:border-zinc-300 hover:shadow-xs">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Zap size={22} />
                </div>
                <h3 className="mt-4 text-base font-bold text-zinc-900">
                  Instant Dispatch &amp; Triage
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Automatic category classification and priority assignments routes tickets directly to qualified electrical, plumbing, or facility staff.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="rounded-3xl border border-zinc-200/80 bg-zinc-50/50 p-6 sm:p-8 transition-all hover:bg-zinc-50 hover:border-zinc-300 hover:shadow-xs">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
                  <Bell size={22} />
                </div>
                <h3 className="mt-4 text-base font-bold text-zinc-900">
                  Real-time Notifications
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Residents receive transparent progress notifications at every step — from assignment to in-progress repairs and verified closure.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="rounded-3xl border border-zinc-200/80 bg-zinc-50/50 p-6 sm:p-8 transition-all hover:bg-zinc-50 hover:border-zinc-300 hover:shadow-xs">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <FileSpreadsheet size={22} />
                </div>
                <h3 className="mt-4 text-base font-bold text-zinc-900">
                  Audited Ticket Timelines
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Every comment, technician assignment, status change, and photo attachment is logged with tamper-evident audit history.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="rounded-3xl border border-zinc-200/80 bg-zinc-50/50 p-6 sm:p-8 transition-all hover:bg-zinc-50 hover:border-zinc-300 hover:shadow-xs">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                  <ShieldCheck size={22} />
                </div>
                <h3 className="mt-4 text-base font-bold text-zinc-900">
                  Role-Based University Auth
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Single sign-on tailored for Students, Maintenance Staff, Wardens, and University Administrators with strict room validation.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="rounded-3xl border border-zinc-200/80 bg-zinc-50/50 p-6 sm:p-8 transition-all hover:bg-zinc-50 hover:border-zinc-300 hover:shadow-xs">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-zinc-200 text-zinc-800">
                  <Building2 size={22} />
                </div>
                <h3 className="mt-4 text-base font-bold text-zinc-900">
                  Hostel-Wide Broadcasts
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Broadcast notices and attachments targeting entire campuses or specific hostel wings and room clusters effortlessly.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/80 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-zinc-600" />
            <span className="font-semibold text-zinc-700">HostelHub</span>
            <span>•</span>
            <span>IIIT Bhubaneswar Hostel Operations</span>
          </div>

          <p>© {new Date().getFullYear()} IIIT Bhubaneswar. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
