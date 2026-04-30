import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number; // 0..1
  className?: string;
  tone?: "brand" | "accent" | "success";
}

export function Progress({ value, className, tone = "brand" }: ProgressProps) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const color =
    tone === "accent"
      ? "from-cyan-400 to-sky-500"
      : tone === "success"
        ? "from-emerald-400 to-emerald-500"
        : "from-violet-400 to-fuchsia-500";
  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]",
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full bg-gradient-to-r", color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
