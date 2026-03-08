import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-xl border border-[#2f3c44] bg-[#111c22]/85", className)}>{children}</div>;
}

