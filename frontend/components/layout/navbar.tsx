"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Building2,
  LogOut,
  Menu,
  X,
  PlusCircle,
  FileText,
  Megaphone,
  LayoutDashboard,
} from "lucide-react";
import { logout } from "@/lib/auth";
import { useUnreadNotifications } from "@/src/hooks/useUnreadNotifications";
import { useCurrentUser, getDashboardRoute, UserRole } from "@/src/hooks/useCurrentUser";
import { RoleBadge } from "@/components/ui/role-badge";
import { cn } from "@/lib/utils";

interface NavbarProps {
  role?: "STUDENT" | "STAFF" | "ADMIN" | string;
  userName?: string;
}

export function Navbar({ role: fallbackRole, userName: fallbackUserName }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { user, isLoading: isUserLoading } = useCurrentUser();
  const { data: unreadNotifications = [] } = useUnreadNotifications();
  const unreadCount = unreadNotifications.length;

  // Single source of truth: authenticated user profile always takes precedence over fallback props
  const effectiveRole: UserRole | null =
    user?.role ??
    (fallbackRole && ["ADMIN", "STAFF", "STUDENT"].includes(fallbackRole.toUpperCase())
      ? (fallbackRole.toUpperCase() as UserRole)
      : null);

  const effectiveUserName = user?.name || fallbackUserName;
  const homeHref = effectiveRole ? getDashboardRoute(effectiveRole) : "/dashboard";

  const getNavLinks = () => {
    if (!effectiveRole) return [];

    switch (effectiveRole) {
      case "ADMIN":
        return [
          { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
          { href: "/staff/complaints", label: "Complaints", icon: FileText },
          { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
        ];
      case "STAFF":
        return [
          { href: "/staff", label: "Dashboard", icon: LayoutDashboard },
          { href: "/staff/complaints", label: "Complaints", icon: FileText },
          { href: "/announcements", label: "Announcements", icon: Megaphone },
        ];
      case "STUDENT":
        return [
          { href: "/student", label: "Dashboard", icon: LayoutDashboard },
          { href: "/student/complaints", label: "My Complaints", icon: FileText },
          { href: "/announcements", label: "Announcements", icon: Megaphone },
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Desktop Navigation */}
        <div className="flex items-center gap-6">
          <Link
            href={homeHref}
            className="flex items-center gap-2.5 group focus-visible:ring-2 focus-visible:ring-zinc-900 rounded-xl outline-none"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-xs group-hover:bg-zinc-800 transition-colors">
              <Building2 size={19} className="text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-zinc-900">
                  HostelHub
                </span>
                {isUserLoading && !effectiveRole ? (
                  <div className="h-4 w-12 animate-pulse rounded-md bg-zinc-100" />
                ) : effectiveRole ? (
                  <RoleBadge role={effectiveRole} size="sm" />
                ) : null}
              </div>
              <span className="text-[10px] font-medium tracking-wide text-zinc-400">
                IIIT Bhubaneswar
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {isUserLoading && !effectiveRole ? (
              <div className="flex items-center gap-1.5 py-1">
                <div className="h-8 w-20 animate-pulse rounded-xl bg-zinc-100" />
                <div className="h-8 w-24 animate-pulse rounded-xl bg-zinc-100" />
                <div className="h-8 w-28 animate-pulse rounded-xl bg-zinc-100" />
              </div>
            ) : (
              navLinks.map((link) => {
                const Icon = link.icon;
                const isActive =
                  pathname === link.href ||
                  (link.href !== homeHref && pathname.startsWith(link.href));

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-150 focus-visible:ring-2 focus-visible:ring-zinc-900 outline-none",
                      isActive
                        ? "bg-zinc-100 text-zinc-950 shadow-2xs"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                    )}
                  >
                    <Icon size={15} className={isActive ? "text-zinc-950" : "text-zinc-400"} />
                    <span>{link.label}</span>
                  </Link>
                );
              })
            )}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-3">
          {/* User Name Pill if available */}
          {isUserLoading && !effectiveUserName ? (
            <div className="hidden lg:flex h-6 w-24 animate-pulse rounded-full bg-zinc-100" />
          ) : effectiveUserName ? (
            <div className="hidden lg:flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span className="max-w-[120px] truncate">{effectiveUserName}</span>
            </div>
          ) : null}

          {/* Quick Action Button for Student */}
          {effectiveRole === "STUDENT" && (
            <button
              type="button"
              onClick={() => router.push("/student/complaints/new")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 active:scale-95 transition-all hover:shadow-sm focus-visible:ring-2 focus-visible:ring-zinc-900 outline-none"
            >
              <PlusCircle size={15} />
              <span>Report Issue</span>
            </button>
          )}

          {/* Quick Action for Admin */}
          {effectiveRole === "ADMIN" && (
            <button
              type="button"
              onClick={() => router.push("/admin/announcements/create")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 active:scale-95 transition-all hover:shadow-sm focus-visible:ring-2 focus-visible:ring-zinc-900 outline-none"
            >
              <PlusCircle size={15} />
              <span>New Announcement</span>
            </button>
          )}

          {/* Notifications Bell */}
          <Link
            href="/notifications"
            className={cn(
              "relative flex size-9 items-center justify-center rounded-xl border border-zinc-200/80 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-zinc-900 outline-none",
              pathname === "/notifications" && "bg-zinc-100 border-zinc-300 text-zinc-950"
            )}
            aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs animate-in zoom-in duration-200">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* Logout */}
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200/80 bg-white px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 outline-none cursor-pointer"
            title="Sign out"
          >
            <LogOut size={15} />
            <span className="hidden xl:inline">Sign out</span>
          </button>
        </div>

        {/* Mobile Header Icons */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/notifications"
            className="relative flex size-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600"
            aria-label="Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex size-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 active:scale-95 transition-transform cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-zinc-200 bg-white px-4 py-4 md:hidden animate-in slide-in-from-top-2 duration-150 shadow-lg">
          <div className="flex flex-col gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-zinc-100 text-zinc-950 font-bold"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                  )}
                >
                  <Icon size={17} className={isActive ? "text-zinc-950" : "text-zinc-400"} />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {effectiveRole === "STUDENT" && (
              <Link
                href="/student/complaints/new"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-xs"
              >
                <PlusCircle size={16} />
                <span>Report Complaint</span>
              </Link>
            )}

            {effectiveRole === "ADMIN" && (
              <Link
                href="/admin/announcements/create"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-xs"
              >
                <PlusCircle size={16} />
                <span>New Announcement</span>
              </Link>
            )}

            <button
              type="button"
              onClick={logout}
              className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50/50 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-100 cursor-pointer"
            >
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}