import * as React from "react";
import { cn } from "@/lib/utils";

export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "text-body-16 flex h-11 w-full rounded-md border border-[#7f6a2c] bg-[#10171b]/80 px-3 py-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a732e]/70",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

