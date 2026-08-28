import React from "react";
import { cn } from "@/lib/utils";

interface RoleBadgeProps {
  role: string;
  className?: string;
  size?: "sm" | "md";
}

const roleConfig: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  STUDENT: {
    label: "Student",
    bg: "bg-blue-50 text-blue-700",
    text: "text-blue-700",
    border: "border-blue-200/80",
  },
  STAFF: {
    label: "Staff",
    bg: "bg-indigo-50 text-indigo-700",
    text: "text-indigo-700",
    border: "border-indigo-200/80",
  },
  ADMIN: {
    label: "Admin",
    bg: "bg-purple-50 text-purple-700",
    text: "text-purple-700",
    border: "border-purple-200/80",
  },
};

export function RoleBadge({ role, className, size = "md" }: RoleBadgeProps) {
  const normalized = (role || "").toUpperCase();
  const config = roleConfig[normalized] || {
    label: normalized || "User",
    bg: "bg-zinc-100 text-zinc-700",
    text: "text-zinc-700",
    border: "border-zinc-200",
  };

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[11px]"
      : "px-2.5 py-1 text-xs";

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
      {config.label}
    </span>
  );
}
