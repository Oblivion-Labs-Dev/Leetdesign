"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { StudioCard } from "@/components/studio/studio-card";
import type { LearningStats } from "@/lib/learning-stats";

const WEEKLY_GOAL = 6;

export function StudioMomentum({ stats }: { stats: LearningStats }) {
  const recentDays = new Set<string>();
  const now = Date.now();
  stats.visits.forEach((v) => {
    if (now - new Date(v.day).getTime() < 7 * 86400000) recentDays.add(v.day);
  });
  const done = recentDays.size;
  const remaining = Math.max(WEEKLY_GOAL - done, 0);
  const pct = Math.min(Math.round((done / WEEKLY_GOAL) * 100), 100);

  return (
    <StudioCard className="flex h-full items-center gap-4 p-5">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--studio-purple)_18%,transparent)] text-[var(--studio-purple-light)]">
        <Star className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-[var(--studio-text)]">
          Keep the momentum going!
        </h3>
        <p className="mt-0.5 text-xs text-[var(--studio-text-muted)]">
          You&apos;re doing great. Solve {remaining > 0 ? remaining : 3} more problems to reach your weekly goal.
        </p>
        <div className="mt-2.5 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--studio-surface-2)]">
            <div
              className="h-full rounded-full bg-[var(--studio-purple)]"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="shrink-0 text-xs font-bold tabular-nums text-[var(--studio-text)]">
            {done} / {WEEKLY_GOAL}
          </span>
        </div>
      </div>

      <Link href="/practice" className="studio-btn-ghost shrink-0">
        View Practice
      </Link>
    </StudioCard>
  );
}
