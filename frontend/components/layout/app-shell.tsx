"use client";

import React from "react";
import { Navbar } from "./navbar";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  role?: "STUDENT" | "STAFF" | "ADMIN" | string;
  userName?: string;
  className?: string;
  maxWidth?: "default" | "narrow" | "wide" | "full";
}

export function AppShell({
  children,
  role: explicitRole,
  userName: explicitUserName,
  className,
  maxWidth = "default",
}: AppShellProps) {
  const { user } = useCurrentUser();

  const effectiveRole = user?.role ?? explicitRole;
  const effectiveUserName = user?.name || explicitUserName;

  const maxWidthClass =
    maxWidth === "narrow"
      ? "max-w-4xl"
      : maxWidth === "wide"
      ? "max-w-7xl"
      : maxWidth === "full"
      ? "max-w-full"
      : "max-w-6xl";

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 antialiased flex flex-col selection:bg-zinc-900 selection:text-white">
      <Navbar role={effectiveRole} userName={effectiveUserName} />
      <main className="flex-1">
        <div
          className={cn(
            "mx-auto px-4 py-8 sm:px-6 lg:px-8 animate-in fade-in slide-in-from-bottom-1 duration-200 motion-reduce:animate-none",
            maxWidthClass,
            className
          )}
        >
          {children}
        </div>
      </main>
      <footer className="border-t border-zinc-200/80 bg-white/70 backdrop-blur-xs py-6 text-center text-xs text-zinc-400">
        HostelHub • AI-Powered Hostel Operations • IIIT Bhubaneswar
      </footer>
    </div>
  );
}