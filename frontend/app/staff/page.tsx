"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Sparkles,
  UserCheck,
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

type Complaint = {
  id: string;
  title: string;
  priority: string;
  status: string;
  created_at?: string;
};

type StaffDashboard = {
  total_complaints: number;
  unassigned_complaints: number;
  assigned_complaints: number;
  in_progress_complaints: number;
  resolved_complaints: number;
  closed_complaints: number;
  recent_complaints: Complaint[];
};

type UserProfile = {
  name: string;
  email: string;
  role: string;
};

async function getStaffDashboard(): Promise<StaffDashboard> {
  const response = await api.get("/api/v1/dashboard/staff");
  return response.data;
}

export default function StaffPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function checkStaffAccess() {
      try {
        const response = await api.get("/api/v1/auth/me");
        const role = response.data.role;

        if (role !== "STAFF") {
          router.replace(getDashboardRoute(role));
          return;
        }

        setUser(response.data);
      } catch (error) {
        console.error("Authentication failed:", error);
        localStorage.removeItem("access_token");
        router.replace("/login");
      }
    }

    checkStaffAccess();
  }, [router]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["staff-dashboard"],
    queryFn: getStaffDashboard,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <AppShell role="STAFF" maxWidth="wide">
        <div className="space-y-8">
          <div className="flex flex-col gap-2">
            <div className="h-8 w-64 animate-pulse rounded-lg bg-zinc-200" />
            <div className="h-4 w-96 animate-pulse rounded-lg bg-zinc-200" />
          </div>
          <StatGridSkeleton count={6} />
          <CardListSkeleton count={4} />
        </div>
      </AppShell>
    );
  }

  if (isError || !data) {
    return (
      <AppShell role="STAFF" maxWidth="wide">
        <div className="mx-auto max-w-md py-12">
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-8 text-center shadow-xl shadow-zinc-200/30">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <AlertCircle size={24} />
            </div>
            <h1 className="mt-4 text-lg font-bold text-zinc-900">
              Unable to load staff dashboard
            </h1>
            <p className="mt-2 text-xs text-zinc-500">
              Please verify your maintenance staff permissions and network status.
            </p>
            <button
              onClick={() => refetch()}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors"
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="STAFF" maxWidth="wide" userName={user?.name}>
      <div className="space-y-8">
        {/* Welcome & Actions Header */}
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center border-b border-zinc-200/60 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Staff Maintenance Center
              </span>
              {data.unassigned_complaints > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-300/60 animate-pulse">
                  <AlertTriangle size={11} />
                  <span>{data.unassigned_complaints} unassigned</span>
                </span>
              )}
            </div>

            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
              Maintenance Overview
            </h1>

            <p className="mt-1 text-xs sm:text-sm text-zinc-500">
              Monitor real-time hostel maintenance requests, triage urgent tickets, and assign staff.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/staff/complaints"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-5 py-3 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-zinc-800 active:scale-98 transition-all hover:shadow-md focus-visible:ring-2 focus-visible:ring-zinc-900 outline-none"
            >
              <FileText size={16} />
              <span>Manage Complaints ({data.total_complaints})</span>
            </Link>
          </div>
        </div>

        {/* 6-Card Metrics Grid with Stagger */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <StatCard
              label="Total Complaints"
              value={data.total_complaints}
              icon={<FileSpreadsheet size={19} />}
              variant="default"
              description="All reported hostel tickets"
            />
          </div>
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-100">
            <StatCard
              label="Unassigned"
              value={data.unassigned_complaints}
              icon={<AlertTriangle size={19} />}
              variant="amber"
              description="Needs staff assignment"
            />
          </div>
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150">
            <StatCard
              label="Assigned"
              value={data.assigned_complaints}
              icon={<UserCheck size={19} />}
              variant="purple"
              description="Allocated to maintenance"
            />
          </div>
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200">
            <StatCard
              label="In Progress"
              value={data.in_progress_complaints}
              icon={<Clock size={19} />}
              variant="blue"
              description="Repairs currently underway"
            />
          </div>
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-250">
            <StatCard
              label="Resolved"
              value={data.resolved_complaints}
              icon={<CheckCircle2 size={19} />}
              variant="emerald"
              description="Repairs finished"
            />
          </div>
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-300">
            <StatCard
              label="Closed"
              value={data.closed_complaints}
              icon={<Sparkles size={19} />}
              variant="default"
              description="Archived and verified"
            />
          </div>
        </section>

        {/* Recent Complaints Section */}
        <section className="rounded-3xl border border-zinc-200/80 bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5">
            <div>
              <h2 className="text-base font-bold text-zinc-900">
                Recent Complaints Requiring Attention
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Latest reported problems submitted across all hostel blocks.
              </p>
            </div>

            <Link
              href="/staff/complaints"
              className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 hover:text-zinc-950 transition-colors"
            >
              <span>View all</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {data.recent_complaints.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<CheckCircle2 size={26} />}
                title="All caught up!"
                description="There are currently no active complaints requiring attention in the hostel queue."
              />
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {data.recent_complaints.map((complaint) => (
                <div
                  key={complaint.id}
                  onClick={() => router.push(`/staff/complaints/${complaint.id}`)}
                  className="group flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between hover:bg-zinc-50/80 transition-all cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm text-zinc-900 group-hover:text-blue-600 transition-colors truncate">
                      {complaint.title}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-400">
                      {complaint.created_at
                        ? `Reported on ${new Date(complaint.created_at).toLocaleString()}`
                        : "Recently created"}
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
