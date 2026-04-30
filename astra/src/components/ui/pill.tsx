import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "brand" | "accent" | "success" | "warning" | "danger";

const TONE: Record<Tone, string> = {
  neutral:
    "bg-[var(--surface-2)] text-[var(--foreground-muted)] border border-[var(--border)]",
  brand:
    "bg-[var(--tone-brand-bg)] text-[var(--tone-brand-text)] border border-[var(--tone-brand-border)]",
  accent:
    "bg-[var(--tone-accent-bg)] text-[var(--tone-accent-text)] border border-[var(--tone-accent-border)]",
  success:
    "bg-[var(--tone-success-bg)] text-[var(--tone-success-text)] border border-[var(--tone-success-border)]",
  warning:
    "bg-[var(--tone-warning-bg)] text-[var(--tone-warning-text)] border border-[var(--tone-warning-border)]",
  danger:
    "bg-[var(--tone-danger-bg)] text-[var(--tone-danger-text)] border border-[var(--tone-danger-border)]",
};

interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Pill({ className, tone = "neutral", ...props }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide uppercase",
        TONE[tone],
        className,
      )}
      {...props}
    />
  );
}
