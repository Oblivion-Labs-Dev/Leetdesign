import { Flame, Calendar } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type { VisitDayStat } from "@/lib/learning-stats";

const DAYS_TO_SHOW = 119; // 17 weeks
const DOW = ["S", "M", "T", "W", "T", "F", "S"];

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function intensity(count: number): string {
  if (count <= 0) return "bg-[var(--surface-2)] border border-[var(--border)]";
  if (count === 1) return "bg-violet-500/30";
  if (count === 2) return "bg-violet-500/55";
  if (count === 3) return "bg-violet-500/75";
  return "bg-gradient-to-br from-violet-500 to-cyan-400";
}

export function ActivityCalendar({
  visits,
  currentStreak,
  longestStreak,
}: {
  visits: VisitDayStat[];
  currentStreak: number;
  longestStreak: number;
}) {
  // Build map by day for fast lookup.
  const byDay = new Map<string, number>();
  for (const v of visits) byDay.set(v.day, v.count);

  // Today (UTC), then walk back DAYS_TO_SHOW-1 days.
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Pad start to align to Sunday so the grid is stable.
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - (DAYS_TO_SHOW - 1));
  const padBack = start.getUTCDay(); // 0..6
  if (padBack > 0) {
    start.setUTCDate(start.getUTCDate() - padBack);
  }

  // Build cells in column-major (week) order.
  const totalCells = (DAYS_TO_SHOW + padBack);
  const weeks = Math.ceil(totalCells / 7);
  const cells: { date: Date; count: number; inRange: boolean }[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: { date: Date; count: number; inRange: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + w * 7 + d);
      const inRange = date >= start && date <= today;
      col.push({ date, count: byDay.get(dayKey(date)) ?? 0, inRange });
    }
    cells.push(col);
  }

  const totalDays = visits.filter((v) => v.count > 0).length;

  return (
    <Card data-tour="activity-calendar">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>Activity</CardTitle>
          <CardDescription className="mt-1">
            Days you have actually shown up at Astra.
          </CardDescription>
        </div>
        <div className="hidden gap-3 text-right sm:flex">
          <Stat
            icon={Flame}
            value={String(currentStreak)}
            label="Current streak"
            tone="text-amber-300"
          />
          <Stat
            icon={Calendar}
            value={String(longestStreak)}
            label="Longest"
            tone="text-cyan-300"
          />
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 overflow-x-auto pb-1">
        <div className="grid select-none grid-rows-7 gap-1 pr-1 pt-3 text-[9px] uppercase tracking-wider text-[var(--foreground-subtle)]">
          {DOW.map((d, i) => (
            <span
              key={i}
              className={`h-3 w-3 leading-3 ${i % 2 === 1 ? "" : "opacity-0"}`}
            >
              {d}
            </span>
          ))}
        </div>
        <div className="flex gap-1">
          {cells.map((col, i) => (
            <div key={i} className="grid grid-rows-7 gap-1">
              {col.map((cell, j) => (
                <span
                  key={j}
                  title={
                    cell.inRange
                      ? `${dayKey(cell.date)} — ${cell.count} visit${cell.count === 1 ? "" : "s"}`
                      : ""
                  }
                  className={`h-3 w-3 rounded-[3px] ${
                    cell.inRange
                      ? intensity(cell.count)
                      : "bg-transparent"
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--foreground-subtle)]">
        <span>{totalDays} active days in the last {DAYS_TO_SHOW} days</span>
        <div className="flex items-center gap-1">
          <span>Less</span>
          <span className={`h-3 w-3 rounded-[3px] ${intensity(0)}`} />
          <span className={`h-3 w-3 rounded-[3px] ${intensity(1)}`} />
          <span className={`h-3 w-3 rounded-[3px] ${intensity(2)}`} />
          <span className={`h-3 w-3 rounded-[3px] ${intensity(3)}`} />
          <span className={`h-3 w-3 rounded-[3px] ${intensity(4)}`} />
          <span>More</span>
        </div>
      </div>
    </Card>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/60 px-3 py-2">
      <div className="flex items-center justify-end gap-1">
        <Icon className={`h-3.5 w-3.5 ${tone}`} />
        <span className="text-base font-semibold text-[var(--foreground)]">
          {value}
        </span>
      </div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--foreground-subtle)]">
        {label}
      </div>
    </div>
  );
}
