import { cn } from "@/lib/utils";

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "text-body-16 inline-flex items-center rounded-full px-3 py-1 font-semibold bg-[#d8ecff] text-[#1f4fc9]",
        className,
      )}
    >
      {children}
    </span>
  );
}

