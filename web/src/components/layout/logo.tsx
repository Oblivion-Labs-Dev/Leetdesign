import Link from "next/link";
import { cn } from "@/lib/utils";

function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-6 w-6", className)} aria-hidden>
      <rect x="4" y="10" width="7" height="7" rx="2.5" fill="#7BA892" />
      <rect x="13" y="5" width="7" height="7" rx="2.5" fill="#6B8CAE" />
      <rect x="13" y="14" width="7" height="7" rx="2.5" fill="#9B8DC4" />
    </svg>
  );
}

export function LeetdesignLogo({
  className,
  withWordmark = true,
  variant = "app",
}: {
  className?: string;
  withWordmark?: boolean;
  variant?: "app" | "clay";
}) {
  const isClay = variant === "clay";

  return (
    <Link href="/" className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "grid h-11 w-11 place-items-center rounded-2xl border",
          isClay
            ? "border-[var(--clay-border-strong)]"
            : "border-[var(--border-strong)]",
        )}
        style={
          isClay
            ? {
                background:
                  "linear-gradient(165deg, var(--clay-surface) 0%, var(--clay-surface-2) 100%)",
                boxShadow: "var(--clay-shadow-block)",
              }
            : {
                background:
                  "linear-gradient(165deg, var(--surface) 0%, var(--surface-2) 100%)",
                boxShadow:
                  "0 14px 0 -4px rgba(0, 0, 0, 0.25), 0 18px 32px -16px rgba(0, 0, 0, 0.45), inset 0 2px 0 rgba(255, 255, 255, 0.06)",
              }
        }
      >
        <LogoMark />
      </div>
      {withWordmark ? (
        <div className="leading-tight">
          <div
            className={cn(
              "text-base font-semibold tracking-tight",
              isClay
                ? "clay-display text-[var(--clay-text)]"
                : "text-[var(--foreground)]",
            )}
          >
            Leetdesign
          </div>
          <div
            className={cn(
              "text-[10px] font-medium uppercase tracking-[0.2em]",
              isClay
                ? "text-[var(--clay-text-muted)]"
                : "text-[var(--foreground-subtle)]",
            )}
          >
            system design
          </div>
        </div>
      ) : null}
    </Link>
  );
}
