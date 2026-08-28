"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (options: { title: string; description?: string; type?: ToastType }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({
      title,
      description,
      type = "info",
    }: {
      title: string;
      description?: string;
      type?: ToastType;
    }) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, description, type }]);

      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, description?: string) => addToast({ title, description, type: "success" }),
    [addToast]
  );
  const error = useCallback(
    (title: string, description?: string) => addToast({ title, description, type: "error" }),
    [addToast]
  );
  const info = useCallback(
    (title: string, description?: string) => addToast({ title, description, type: "info" }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info }}>
      {children}
      <div
        aria-live="polite"
        role="status"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-3 fade-in zoom-in-98",
              t.type === "success" && "border-emerald-200/90 bg-emerald-50/95 text-emerald-950 shadow-emerald-950/5",
              t.type === "error" && "border-rose-200/90 bg-rose-50/95 text-rose-950 shadow-rose-950/5",
              t.type === "info" && "border-zinc-200/90 bg-white/95 text-zinc-950 shadow-zinc-950/5"
            )}
          >
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-xl",
                t.type === "success" && "bg-emerald-100 text-emerald-700",
                t.type === "error" && "bg-rose-100 text-rose-700",
                t.type === "info" && "bg-zinc-100 text-zinc-700"
              )}
            >
              {t.type === "success" && <CheckCircle2 size={16} />}
              {t.type === "error" && <AlertCircle size={16} />}
              {t.type === "info" && <Info size={16} />}
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-xs sm:text-sm font-bold tracking-tight">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 text-xs opacity-80 leading-relaxed">{t.description}</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-black/5 hover:text-zinc-700 transition-colors"
              aria-label="Dismiss toast"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
