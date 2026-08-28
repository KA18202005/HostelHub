"use client";

import React, { useEffect, useRef } from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary" | "warning";
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
}: ConfirmDialogProps) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      setTimeout(() => confirmBtnRef.current?.focus(), 50);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-zinc-950/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => {
          if (!loading) onClose();
        }}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 sm:p-7 shadow-2xl transition-all animate-in zoom-in-95 duration-200 border border-zinc-200/80">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors focus-visible:ring-2 focus-visible:ring-zinc-900 outline-none"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-xs",
              variant === "danger"
                ? "bg-rose-100/80 text-rose-600 border border-rose-200/60"
                : variant === "warning"
                ? "bg-amber-100/80 text-amber-600 border border-amber-200/60"
                : "bg-blue-100/80 text-blue-600 border border-blue-200/60"
            )}
          >
            <AlertTriangle size={22} />
          </div>

          <div className="flex-1 pr-4">
            <h3
              id="confirm-dialog-title"
              className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight"
            >
              {title}
            </h3>
            <p
              id="confirm-dialog-desc"
              className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-600"
            >
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-zinc-700 hover:bg-zinc-50 active:scale-[0.98] transition-all disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-zinc-900 outline-none"
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs active:scale-[0.98] transition-all disabled:opacity-50 focus-visible:ring-2 outline-none",
              variant === "danger"
                ? "bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-500 hover:shadow-md hover:shadow-rose-600/10"
                : variant === "warning"
                ? "bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500 hover:shadow-md hover:shadow-amber-600/10"
                : "bg-zinc-900 hover:bg-zinc-800 focus-visible:ring-zinc-900 hover:shadow-md hover:shadow-zinc-900/10"
            )}
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            <span>{loading ? "Processing..." : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
