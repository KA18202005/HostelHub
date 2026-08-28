"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, X, FileText, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  allowedTypes?: string[];
  maxSizeMB?: number;
  disabled?: boolean;
  className?: string;
}

export function FileUpload({
  onFileSelect,
  selectedFile,
  allowedTypes = ["image/jpeg", "image/png", "image/webp"],
  maxSizeMB = 5,
  disabled = false,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (file: File) => {
    setError("");

    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      setError(`Only ${allowedTypes.map((t) => t.split("/")[1].toUpperCase()).join(", ")} files are supported.`);
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size must not exceed ${maxSizeMB} MB.`);
      return;
    }

    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleRemove = () => {
    setError("");
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const isImage = selectedFile?.type.startsWith("image/");
  const previewUrl = isImage && selectedFile ? URL.createObjectURL(selectedFile) : null;

  return (
    <div className={cn("space-y-3", className)}>
      {!selectedFile ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => {
            if (!disabled && inputRef.current) {
              inputRef.current.click();
            }
          }}
          className={cn(
            "group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer",
            isDragging
              ? "border-blue-500 bg-blue-50/50"
              : "border-zinc-200 bg-zinc-50/50 hover:border-zinc-300 hover:bg-zinc-50",
            disabled && "cursor-not-allowed opacity-60"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={allowedTypes.join(",")}
            onChange={handleChange}
            disabled={disabled}
            className="hidden"
          />

          <div className="flex size-11 items-center justify-center rounded-xl bg-white text-zinc-600 shadow-xs group-hover:scale-105 transition-transform">
            <UploadCloud size={22} className="text-zinc-500 group-hover:text-blue-600 transition-colors" />
          </div>

          <p className="mt-3 text-sm font-semibold text-zinc-900">
            <span className="text-blue-600 hover:underline">Click to upload</span> or drag and drop
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            {allowedTypes.map((t) => t.split("/")[1].toUpperCase()).join(", ")} (max. {maxSizeMB}MB)
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            {previewUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={previewUrl}
                alt="Preview"
                className="size-12 rounded-xl object-cover border border-zinc-200"
              />
            ) : (
              <div className="flex size-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500">
                <FileText size={20} />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-medium text-zinc-900">
                  {selectedFile.name}
                </p>
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              </div>
              <p className="text-xs text-zinc-400">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="rounded-lg p-2 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            title="Remove file"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs font-medium text-rose-600 animate-in fade-in">
          {error}
        </p>
      )}
    </div>
  );
}
