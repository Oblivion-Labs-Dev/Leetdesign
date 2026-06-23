"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";
import { StudioCard } from "@/components/studio/studio-card";
import type { LearningStats } from "@/lib/learning-stats";

const DOW = ["M", "T", "W", "T", "F", "S", "S"];

export function StudioStreak({ stats }: { stats: LearningStats }) {
  const visitSet = useMemo(
    () => new Set(stats.visits.map((v) => v.day)),
    [stats.visits],
  );

  const streak = stats.currentStreak;

  const weekDays = useMemo(() => {
    const today = new Date();
    const dow = (today.getDay() + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - dow);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const isFuture = d > today;
      const active = visitSet.has(key);
      return { key, label: DOW[i], active, isFuture };
    });
  }, [visitSet]);

  return (
    <StudioCard className="flex h-full flex-col justify-center p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--studio-text)]">
          🔥 Your Streak
        </h2>
        <span className="text-lg font-bold tabular-nums text-[var(--studio-text)]">
          {streak} days
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-1">
        {weekDays.map((day) => (
          <div key={day.key} className="flex flex-col items-center gap-1.5">
            <div
              className={`grid h-8 w-8 place-items-center rounded-full ${
                day.active
                  ? "bg-[var(--studio-purple)] text-white"
                  : day.isFuture
                    ? "border border-dashed border-[var(--studio-border)]"
                    : "border border-[var(--studio-border)]"
              }`}
            >
              {day.active ? (
                <Check className="h-4 w-4" strokeWidth={2.5} />
              ) : null}
            </div>
            <span className="text-[10px] font-medium text-[var(--studio-text-subtle)]">
              {day.label}
            </span>
          </div>
        ))}
      </div>
    </StudioCard>
  );
}
