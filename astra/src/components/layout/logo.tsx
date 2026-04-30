import Link from "next/link";
import { cn } from "@/lib/utils";

export function AstraLogo({
  className,
  withWordmark = true,
}: {
  className?: string;
  withWordmark?: boolean;
}) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-[0_8px_30px_-10px_rgba(168,85,247,0.7)]">
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M12 2.5l1.8 5.4L19.5 9l-4.4 3.4 1.6 5.6L12 14.6 7.3 18l1.6-5.6L4.5 9l5.7-1.1L12 2.5z" />
        </svg>
        <span className="absolute inset-0 rounded-xl ring-1 ring-white/10" />
      </div>
      {withWordmark ? (
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight text-[var(--foreground)]">
            Astra
          </div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--foreground-subtle)]">
            an OblivionLabs co.
          </div>
        </div>
      ) : null}
    </Link>
  );
}
