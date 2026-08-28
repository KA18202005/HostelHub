"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  FileText,
  Home,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { StatGridSkeleton, CardListSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { getDashboardRoute } from "@/src/hooks/useCurrentUser";

type DashboardComplaint = {
  id: string;
  title: string;
  priority: string;
  status: string;
  created_at: string;
};

type StudentDashboard = {
  total_complaints: number;
  open_complaints: number;
  in_progress_complaints: number;
  resolved_complaints: number;
  unread_notifications: number;
  recent_complaints: DashboardComplaint[];
};

type UserProfile = {
  name: string;
  email: string;
  role: string;
  room?: {
    block: string;
    floor: number;
    room_number: string;
    apartment?: string;
  };
};

async function getStudentDashboard(): Promise<StudentDashboard> {
  const response = await api.get("/api/v1/dashboard/student");
  return response.data;
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function checkStudentAccess() {
      try {
        const response = await api.get("/api/v1/auth/me");
        if (response.data.role !== "STUDENT") {
          router.replace(getDashboardRoute(response.data.role));
          return;
        }
        setUser(response.data);
      } catch (error) {
        console.error("Authentication failed:", error);
        localStorage.removeItem("access_token");
        router.replace("/login");
      }
    }

    checkStudentAccess();
  }, [router]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["student-dashboard"],
    queryFn: getStudentDashboard,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <AppShell role="STUDENT" maxWidth="wide">
        <div className="space-y-8">
          <div className="flex flex-col gap-2">
            <div className="h-8 w-64 animate-pulse rounded-lg bg-zinc-200" />
            <div className="h-4 w-96 animate-pulse rounded-lg bg-zinc-200" />
          </div>
          <StatGridSkeleton count={4} />
          <CardListSkeleton count={3} />
        </div>
      </AppShell>
    );
  }

  if (isError || !data) {
    return (
      <AppShell role="STUDENT" maxWidth="wide">
        <div className="mx-auto max-w-md py-12">
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-8 text-center shadow-xl shadow-zinc-200/30">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <AlertCircle size={24} />
            </div>
            <h1 className="mt-4 text-lg font-bold text-zinc-900">
              Unable to load dashboard
            </h1>
            <p className="mt-2 text-xs text-zinc-500">
              There was a problem communicating with the server.
            </p>
            <button
              onClick={() => refetch()}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors"
            >
              <RefreshCw size={14} />
              <span>Refresh data</span>
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="STUDENT" maxWidth="wide" userName={user?.name}>
      <div className="space-y-8">
        {/* Welcome & Actions Header */}
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center border-b border-zinc-200/60 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Student Workspace
              </span>
              {user?.room && (
                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-700 border border-zinc-200/60">
                  <Home size={11} className="text-zinc-500" />
                  <span>
                    Block {user.room.block} • Room {user.room.room_number}
                    {user.room.apartment ? ` (${user.room.apartment})` : ""}
                  </span>
                </span>
              )}
            </div>

            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
              Welcome back, {user?.name ? user.name.split(" ")[0] : "Student"}
            </h1>

            <p className="mt-1 text-xs sm:text-sm text-zinc-500">
              Track maintenance requests, get updates, and keep your hostel room in top shape.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/student/complaints/new"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-5 py-3 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-zinc-800 active:scale-98 transition-all hover:shadow-md"
            >
              <Plus size={17} />
              <span>Report New Issue</span>
            </Link>
          </div>
        </div>

        {/* Metrics Grid with subtle stagger */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <StatCard
              label="Total Complaints"
              value={data.total_complaints}
              icon={<FileSpreadsheet size={19} />}
              variant="default"
            />
          </div>
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-100">
            <StatCard
              label="Open"
              value={data.open_complaints}
              icon={<Clock size={19} />}
              variant="blue"
              description="Awaiting staff triage"
            />
          </div>
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150">
            <StatCard
              label="In Progress"
              value={data.in_progress_complaints}
              icon={<Sparkles size={19} />}
              variant="amber"
              description="Currently being fixed"
            />
          </div>
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200">
            <StatCard
              label="Resolved"
              value={data.resolved_complaints}
              icon={<CheckCircle2 size={19} />}
              variant="emerald"
              description="Successfully completed"
            />
          </div>
        </section>

        {/* Recent Complaints Section */}
        <section className="rounded-3xl border border-zinc-200/80 bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5">
            <div>
              <h2 className="text-base font-bold text-zinc-900">
                Recent Complaints
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Latest issues submitted from your assigned room.
              </p>
            </div>

            <Link
              href="/student/complaints"
              className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 hover:text-zinc-950 transition-colors"
            >
              <span>View all ({data.total_complaints})</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {data.recent_complaints.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<FileText size={26} />}
                title="No complaints reported yet"
                description="Everything looks good! If you ever encounter an issue with plumbing, electricity, internet or furniture, report it here."
                action={
                  <Link
                    href="/student/complaints/new"
                    className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 transition-colors"
                  >
                    <Plus size={15} />
                    <span>Report your first issue</span>
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {data.recent_complaints.map((complaint) => (
                <div
                  key={complaint.id}
                  onClick={() => router.push(`/student/complaints/${complaint.id}`)}
                  className="group flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between hover:bg-zinc-50/80 transition-all cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm text-zinc-900 group-hover:text-blue-600 transition-colors truncate">
                      {complaint.title}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-400">
                      Submitted on{" "}
                      {new Date(complaint.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2.5">
                    <PriorityBadge priority={complaint.priority} size="sm" />
                    <StatusBadge status={complaint.status} size="sm" />
                    <div className="hidden sm:flex size-7 items-center justify-center rounded-lg text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all">
                      <ArrowRight size={15} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
