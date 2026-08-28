import React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  description?: string;
  trend?: string;
  variant?: "default" | "blue" | "amber" | "emerald" | "purple" | "rose";
  className?: string;
}

const variantStyles = {
  default: "hover:border-zinc-300 text-zinc-900",
  blue: "hover:border-blue-300 text-blue-900 bg-blue-50/20",
  amber: "hover:border-amber-300 text-amber-900 bg-amber-50/20",
  emerald: "hover:border-emerald-300 text-emerald-900 bg-emerald-50/20",
  purple: "hover:border-purple-300 text-purple-900 bg-purple-50/20",
  rose: "hover:border-rose-300 text-rose-900 bg-rose-50/20",
};

const iconStyles = {
  default: "text-zinc-600 bg-zinc-100 border border-zinc-200/60",
  blue: "text-blue-600 bg-blue-100/80 border border-blue-200/60",
  amber: "text-amber-600 bg-amber-100/80 border border-amber-200/60",
  emerald: "text-emerald-600 bg-emerald-100/80 border border-emerald-200/60",
  purple: "text-purple-600 bg-purple-100/80 border border-purple-200/60",
  rose: "text-rose-600 bg-rose-100/80 border border-rose-200/60",
};

export function StatCard({
  label,
  value,
  icon,
  description,
  variant = "default",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          {label}
        </p>
        {icon && (
          <div
            className={cn(
              "flex size-9 items-center justify-center rounded-xl shadow-2xs transition-transform duration-200 group-hover:scale-105",
              iconStyles[variant]
            )}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
          {value}
        </p>
      </div>

      {description && (
        <p className="mt-1.5 text-xs text-zinc-500 font-medium">
          {description}
        </p>
      )}
    </div>
  );
}
