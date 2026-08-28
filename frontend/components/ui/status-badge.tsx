import React from "react";
import { cn } from "@/lib/utils";

export type ComplaintStatus =
  | "OPEN"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED";

interface StatusBadgeProps {
  status: string | ComplaintStatus;
  className?: string;
  size?: "sm" | "md";
}

const statusConfig: Record<
  string,
  { label: string; bg: string; text: string; dot: string; border: string; pulse?: boolean }
> = {
  OPEN: {
    label: "Open",
    bg: "bg-blue-50 text-blue-700",
    text: "text-blue-700",
    dot: "bg-blue-500",
    border: "border-blue-200/80",
  },
  ASSIGNED: {
    label: "Assigned",
    bg: "bg-purple-50 text-purple-700",
    text: "text-purple-700",
    dot: "bg-purple-500",
    border: "border-purple-200/80",
  },
  IN_PROGRESS: {
    label: "In Progress",
    bg: "bg-amber-50 text-amber-800",
    text: "text-amber-800",
    dot: "bg-amber-500",
    border: "border-amber-200/80",
    pulse: true,
  },
  RESOLVED: {
    label: "Resolved",
    bg: "bg-emerald-50 text-emerald-700",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    border: "border-emerald-200/80",
  },
  CLOSED: {
    label: "Closed",
    bg: "bg-zinc-100 text-zinc-600",
    text: "text-zinc-600",
    dot: "bg-zinc-400",
    border: "border-zinc-200",
  },
};

export function StatusBadge({ status, className, size = "md" }: StatusBadgeProps) {
  const normalized = (status || "").toUpperCase();
  const config = statusConfig[normalized] || {
    label: normalized.replaceAll("_", " ") || "Unknown",
    bg: "bg-zinc-100 text-zinc-600",
    text: "text-zinc-600",
    dot: "bg-zinc-400",
    border: "border-zinc-200",
  };

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[11px] gap-1.5"
      : "px-2.5 py-1 text-xs gap-1.5";

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold rounded-full border transition-all duration-150 select-none",
        config.bg,
        config.border,
        sizeClasses,
        className
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full shrink-0",
          config.dot,
          config.pulse && "animate-pulse"
        )}
      />
      <span>{config.label}</span>
    </span>
  );
}
