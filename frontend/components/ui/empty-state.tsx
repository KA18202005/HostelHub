import React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-white/70 px-6 py-14 text-center backdrop-blur-xs shadow-2xs transition-all",
        className
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 shadow-inner border border-zinc-200/60">
        {icon}
      </div>

      <h3 className="mt-4 text-base font-bold text-zinc-900 tracking-tight">
        {title}
      </h3>

      <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-zinc-500 leading-relaxed">
        {description}
      </p>

      {action && <div className="mt-6 animate-in fade-in duration-200">{action}</div>}
    </div>
  );
}
