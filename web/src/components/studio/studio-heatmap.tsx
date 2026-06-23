"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { StudioCard } from "@/components/studio/studio-card";
import type { LearningStats } from "@/lib/learning-stats";

const DOW = ["M", "T", "W", "T", "F", "S", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function StudioHeatmap({ stats }: { stats: LearningStats }) {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const visitMap = useMemo(
    () => new Map(stats.visits.map((v) => [v.day, v.count])),
    [stats.visits],
  );

  const grid = useMemo(() => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startDow = (first.getDay() + 6) % 7;
    const cells: { day: number; key: string; count: number }[] = [];
    for (let d = 1; d <= last.getDate(); d++) {
      const date = new Date(year, month, d);
      const key = date.toISOString().slice(0, 10);
      cells.push({ day: d, key, count: visitMap.get(key) ?? 0 });
    }
    return { cells, startDow };
  }, [month, year, visitMap]);

  const isCurrent = month === today.getMonth() && year === today.getFullYear();
  const activeDays = grid.cells.filter((c) => c.count > 0).length;

  const goBack = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1);
  };
  const goForward = () => {
    if (isCurrent) return;
    if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1);
  };

  return (
    <StudioCard className="flex flex-col p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-semibold text-[var(--studio-text)]">
            {MONTHS[month]} {year}
          </h2>
          <span className="text-[11px] text-[var(--studio-text-muted)]">
            {activeDays} active days
          </span>
        </div>
        <div className="flex gap-1">
          <button type="button" onClick={goBack} className="grid h-6 w-6 place-items-center rounded-lg border border-[var(--studio-border)] text-[var(--studio-text-muted)] hover:text-[var(--studio-text)]" aria-label="Previous month">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={goForward} disabled={isCurrent} className="grid h-6 w-6 place-items-center rounded-lg border border-[var(--studio-border)] text-[var(--studio-text-muted)] hover:text-[var(--studio-text)] disabled:opacity-30" aria-label="Next month">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1">
        {DOW.map((d, i) => (
          <div key={i} className="pb-1 text-center text-[10px] font-medium text-[var(--studio-text-subtle)]">{d}</div>
        ))}
        {Array.from({ length: grid.startDow }, (_, i) => <div key={`p${i}`} />)}
        {grid.cells.map((cell) => {
          const isToday = cell.key === today.toISOString().slice(0, 10);
          const isActive = cell.count > 0;
          return (
            <div key={cell.key} className="grid aspect-square place-items-center">
              <span
                className={`grid h-7 w-7 place-items-center rounded-full text-[11px] tabular-nums ${
                  isActive
                    ? "bg-[var(--studio-purple)] font-semibold text-white"
                    : isToday
                      ? "font-semibold text-[var(--studio-text)] ring-1 ring-[var(--studio-purple)]"
                      : "text-[var(--studio-text-subtle)]"
                }`}
                title={`${cell.key}: ${cell.count}`}
              >
                {cell.day}
              </span>
            </div>
          );
        })}
      </div>
    </StudioCard>
  );
}
