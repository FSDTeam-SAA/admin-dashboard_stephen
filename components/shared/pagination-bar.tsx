"use client";

import { Button } from "@/components/ui/button";

export function PaginationBar({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (next: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, idx) => idx + 1);

  return (
    <div className="flex items-center gap-2">
      <Button size="icon" variant="outline" onClick={() => onChange(page - 1)} disabled={page <= 1}>
        ‹
      </Button>
      {pages.map((p) => (
        <Button
          key={p}
          size="icon"
          variant={p === page ? "default" : "outline"}
          onClick={() => onChange(p)}
        >
          {p}
        </Button>
      ))}
      <Button size="icon" variant="outline" onClick={() => onChange(page + 1)} disabled={page >= totalPages}>
        ›
      </Button>
    </div>
  );
}

