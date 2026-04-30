import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type { LearningStats } from "@/lib/learning-stats";

interface Slice {
  label: string;
  value: number;
  color: string;
}

export function SkillCoverage({ stats }: { stats: LearningStats }) {
  const total = stats.componentsTotal;
  const learned = stats.componentsSeen.length;
  const remaining = Math.max(total - learned, 0);
  const slices: Slice[] = [
    { label: "Learned", value: learned, color: "#a78bfa" },
    { label: "Remaining", value: remaining, color: "rgba(255,255,255,0.06)" },
  ];

  // Donut math.
  const radius = 56;
  const stroke = 14;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <Card>
      <CardTitle>Skill coverage</CardTitle>
      <CardDescription className="mt-1">
        Components you have been taught vs. the rest of the catalog.
      </CardDescription>

      <div className="mt-4 flex items-center gap-6">
        <div className="relative h-36 w-36 shrink-0">
          <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={stroke}
            />
            {slices.map((s) => {
              const dash = total > 0 ? (s.value / total) * circumference : 0;
              const seg = (
                <circle
                  key={s.label}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                />
              );
              offset += dash;
              return seg;
            })}
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="text-2xl font-semibold">
                {learned}
                <span className="text-sm text-[var(--foreground-muted)]">
                  /{total}
                </span>
              </div>
              <div className="text-[10px] uppercase tracking-wider text-[var(--foreground-subtle)]">
                Components
              </div>
            </div>
          </div>
        </div>

        <ul className="flex-1 space-y-2 text-sm">
          {slices.map((s) => (
            <li key={s.label} className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-sm"
                  style={{ background: s.color }}
                />
                {s.label}
              </span>
              <span className="tabular-nums text-[var(--foreground-muted)]">
                {s.value}
              </span>
            </li>
          ))}
          <li className="border-t border-[var(--border)] pt-2 text-xs text-[var(--foreground-subtle)]">
            Pick a project — every project teaches new components and grows this
            ring.
          </li>
        </ul>
      </div>
    </Card>
  );
}
