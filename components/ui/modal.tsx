"use client";

import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 md:p-6">
      <div
        className={cn(
          "flex w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-[#2f3c44] bg-[#101c22] p-5",
          className,
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-title-24 text-white">{title}</h3>
          <button onClick={onClose} className="text-body-16 text-white/90">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

