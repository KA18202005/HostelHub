import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination Navigation"
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-3 rounded-3xl border border-zinc-200/80 bg-white px-5 py-3.5 shadow-xs",
        className
      )}
    >
      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous page"
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 active:scale-95 transition-all disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-zinc-900 outline-none"
        >
          <ChevronLeft size={15} />
          <span>Previous</span>
        </button>

        <span className="sm:hidden text-xs font-medium text-zinc-500">
          Page <span className="font-bold text-zinc-900">{currentPage}</span> of{" "}
          <span className="font-bold text-zinc-900">{totalPages}</span>
        </span>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
          className="sm:hidden inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 active:scale-95 transition-all disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-zinc-900 outline-none"
        >
          <span>Next</span>
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Center page indicators on sm+ */}
      <div className="hidden sm:flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
          // Show first, last, current, current - 1, current + 1
          if (
            totalPages <= 6 ||
            p === 1 ||
            p === totalPages ||
            Math.abs(p - currentPage) <= 1
          ) {
            const isCurrent = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={isCurrent ? "page" : undefined}
                className={cn(
                  "flex size-8 items-center justify-center rounded-xl text-xs font-semibold transition-all",
                  isCurrent
                    ? "bg-zinc-900 text-white shadow-xs"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                )}
              >
                {p}
              </button>
            );
          } else if (p === 2 || p === totalPages - 1) {
            return (
              <span key={p} className="px-1 text-xs text-zinc-400 select-none">
                …
              </span>
            );
          }
          return null;
        })}
      </div>

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Next page"
        className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 active:scale-95 transition-all disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-zinc-900 outline-none"
      >
        <span>Next</span>
        <ChevronRight size={15} />
      </button>
    </nav>
  );
}
