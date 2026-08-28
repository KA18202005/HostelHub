import React from "react";
import { cn } from "@/lib/utils";

export type ComplaintPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface PriorityBadgeProps {
  priority: string | ComplaintPriority;
  className?: string;
  size?: "sm" | "md";
}

const priorityConfig: Record<
  string,
  { label: string; bg: string; text: string; border: string; indicator: string }
> = {
  LOW: {
    label: "Low",
    bg: "bg-slate-50 text-slate-700",
    text: "text-slate-700",
    border: "border-slate-200",
    indicator: "bg-slate-400",
  },
  MEDIUM: {
    label: "Medium",
    bg: "bg-amber-50 text-amber-800",
    text: "text-amber-800",
    border: "border-amber-200/80",
    indicator: "bg-amber-500",
  },
  HIGH: {
    label: "High",
    bg: "bg-orange-50 text-orange-800",
    text: "text-orange-800",
    border: "border-orange-200/80",
    indicator: "bg-orange-500",
  },
  URGENT: {
    label: "Urgent",
    bg: "bg-rose-50 text-rose-800",
    text: "text-rose-800",
    border: "border-rose-200/80",
    indicator: "bg-rose-600 animate-pulse",
  },
};

export function PriorityBadge({
  priority,
  className,
  size = "md",
}: PriorityBadgeProps) {
  const normalized = (priority || "").toUpperCase();
  const config = priorityConfig[normalized] || {
    label: normalized || "Normal",
    bg: "bg-zinc-100 text-zinc-700",
    text: "text-zinc-700",
    border: "border-zinc-200",
    indicator: "bg-zinc-400",
  };

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[11px] gap-1.5"
      : "px-2.5 py-1 text-xs gap-1.5";

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border transition-colors select-none",
        config.bg,
        config.border,
        sizeClasses,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full shrink-0", config.indicator)} />
      <span>{config.label}</span>
    </span>
  );
}
