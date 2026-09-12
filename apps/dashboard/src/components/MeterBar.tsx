import { cn } from "cn";

export function MeterBar({
  value,
  max,
  label,
  className,
}: {
  value: number;
  max: number;
  label?: string;
  className?: string;
}) {
  const percent = Math.min(100, (value / Math.max(1, max)) * 100);
  return (
    <div
      className={cn("h-0.5 w-full overflow-hidden rounded-full bg-muted", className)}
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
    >
      <div className="h-full bg-foreground" style={{ width: `${percent}%` }} />
    </div>
  );
}
