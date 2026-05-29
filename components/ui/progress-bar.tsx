import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  className?: string;
  onChange?: (percent: number) => void;
}

export function ProgressBar({ value, className, onChange }: ProgressBarProps) {
  const safe = Math.max(0, Math.min(100, value || 0));

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onChange) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    onChange(Math.max(0, Math.min(100, percent)));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onChange || e.buttons !== 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    onChange(Math.max(0, Math.min(100, percent)));
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "h-4 w-full overflow-hidden rounded-full bg-[#dfe7f3]",
          onChange && "cursor-pointer select-none",
        )}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
      >
        <div
          className="h-full rounded-full bg-[#2dc978] transition-[width] duration-100"
          style={{ width: `${safe}%` }}
        />
      </div>
      <span className="text-body-16 text-white">{safe}%</span>
    </div>
  );
}

