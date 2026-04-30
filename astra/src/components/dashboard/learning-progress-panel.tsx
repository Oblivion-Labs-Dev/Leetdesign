import { Activity, BookOpen, FolderKanban } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type { LearningStats } from "@/lib/learning-stats";

export function LearningProgressPanel({ stats }: { stats: LearningStats }) {
  const compPct = stats.componentsTotal
    ? Math.round((stats.componentsSeen.length / stats.componentsTotal) * 100)
    : 0;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>Your learning progress</CardTitle>
          <CardDescription className="mt-1">
            Real numbers from what you have actually shipped at Astra. No
            credit until you do the work.
          </CardDescription>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Stat
          icon={BookOpen}
          label="Components learned"
          value={`${stats.componentsSeen.length} / ${stats.componentsTotal}`}
          hint={`${compPct}% of catalog`}
        />
        <Stat
          icon={FolderKanban}
          label="Projects in progress"
          value={String(stats.activeProjects.length)}
          hint="Pick one to start"
        />
        <Stat
          icon={Activity}
          label="Projects completed"
          value={String(stats.completedProjects.length)}
          hint="Shipped to main"
        />
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-wider text-[var(--foreground-subtle)]">
          <span>Components learned</span>
          <span>{compPct}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-[var(--surface-2)]">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all"
            style={{ width: `${compPct}%` }}
          />
        </div>
      </div>
    </Card>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-[var(--foreground-subtle)]">
          {label}
        </span>
        <Icon className="h-3.5 w-3.5 text-[var(--foreground-subtle)]" />
      </div>
      <div className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
        {value}
      </div>
      <div className="text-[11px] text-[var(--foreground-muted)]">{hint}</div>
    </div>
  );
}
