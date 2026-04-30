"use client";

import {
  CheckCircle2,
  Circle,
  GitBranch,
  GitMerge,
  Loader2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import type { DeliveryEvent } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_ICON: Record<DeliveryEvent["status"], React.ComponentType<{ className?: string }>> = {
  pending: Circle,
  running: Loader2,
  success: CheckCircle2,
  fail: XCircle,
};

const STAGE_ICON: Partial<Record<DeliveryEvent["stage"], React.ComponentType<{ className?: string }>>> = {
  branch_created: GitBranch,
  conflict_detected: AlertTriangle,
  merged: GitMerge,
};

const STATUS_COLOR: Record<DeliveryEvent["status"], string> = {
  pending: "text-[var(--foreground-subtle)]",
  running: "text-violet-300",
  success: "text-emerald-400",
  fail: "text-rose-400",
};

export function DeliveryTimeline({
  events,
  empty = "No delivery run yet — submit a fix to trigger CI/CD.",
}: {
  events: DeliveryEvent[];
  empty?: string;
}) {
  return (
    <div className="surface flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div>
          <div className="text-sm font-semibold">Delivery Pipeline</div>
          <div className="text-[11px] text-[var(--foreground-subtle)]">
            Branch · Checks · Merge · Deploy
          </div>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6 py-10 text-center text-xs text-[var(--foreground-muted)]">
          {empty}
        </div>
      ) : (
        <ol className="relative flex-1 space-y-3 overflow-y-auto px-4 py-4">
          <span className="absolute left-[27px] top-2 bottom-2 w-px bg-[var(--border)]" />
          {events.map((e) => {
            const StatusIcon = STATUS_ICON[e.status];
            const StageIcon = STAGE_ICON[e.stage] ?? StatusIcon;
            return (
              <li
                key={e.id + e.at}
                className="relative flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/60 px-3 py-2.5"
              >
                <div
                  className={cn(
                    "z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--background-soft)] ring-1 ring-[var(--border)]",
                    STATUS_COLOR[e.status],
                  )}
                >
                  <StageIcon
                    className={cn(
                      "h-4 w-4",
                      e.status === "running" && "animate-spin",
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[13px] font-medium">{e.label}</div>
                    <span
                      className={cn(
                        "text-[10px] uppercase tracking-wider",
                        STATUS_COLOR[e.status],
                      )}
                    >
                      {e.status}
                    </span>
                  </div>
                  {e.detail ? (
                    <div className="mt-0.5 text-[11px] text-[var(--foreground-muted)]">
                      {e.detail}
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
