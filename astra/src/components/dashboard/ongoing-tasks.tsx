import Link from "next/link";
import { ArrowRight, Activity, CheckCircle2 } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import type { LearningStats, ProjectProgressStat } from "@/lib/learning-stats";
import { getJourney } from "@/lib/content/journeys";

interface OngoingTask {
  projectId: string;
  title: string;
  stageTitle: string;
  pct: number;
  status: "in_progress" | "completed";
}

function buildTasks(rows: ProjectProgressStat[]): OngoingTask[] {
  return rows.map((row) => {
    const journey = getJourney(row.projectId);
    const total = journey?.stages.length ?? 1;
    const stageTitle = journey?.stages[row.stageIndex]?.title ?? "—";
    const pct = Math.round(((row.stageIndex + 1) / total) * 100);
    return {
      projectId: row.projectId,
      title: row.title,
      stageTitle,
      pct: row.status === "completed" ? 100 : pct,
      status: row.status,
    };
  });
}

export function OngoingTasks({ stats }: { stats: LearningStats }) {
  const tasks = buildTasks([
    ...stats.activeProjects,
    ...stats.completedProjects,
  ]);

  return (
    <Card data-tour="ongoing-tasks">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>Your tasks</CardTitle>
          <CardDescription className="mt-1">
            Projects you have started — pick up where you left off.
          </CardDescription>
        </div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-xs text-violet-300 hover:text-violet-200"
        >
          All projects <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-2)]/40 p-4 text-sm text-[var(--foreground-muted)]">
          No tasks yet. Open the{" "}
          <Link href="/projects" className="text-violet-300 hover:text-violet-200">
            Projects
          </Link>{" "}
          page to start one.
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {tasks.map((t) => (
            <li
              key={t.projectId}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {t.status === "completed" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                    ) : (
                      <Activity className="h-3.5 w-3.5 text-violet-300" />
                    )}
                    {t.title}
                  </div>
                  <div className="truncate text-xs text-[var(--foreground-muted)]">
                    {t.status === "completed" ? "Shipped" : t.stageTitle}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Pill tone={t.status === "completed" ? "success" : "brand"}>
                    {t.pct}%
                  </Pill>
                  <Link
                    href={`/projects/${t.projectId}`}
                    className="rounded-lg border border-[var(--border)] px-2.5 py-1 text-[11px] text-[var(--foreground-muted)] hover:border-violet-500/40 hover:text-violet-200"
                  >
                    {t.status === "completed" ? "Review" : "Resume"}
                  </Link>
                </div>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--background-soft)]">
                <div
                  className={`h-1.5 rounded-full ${
                    t.status === "completed"
                      ? "bg-emerald-400"
                      : "bg-gradient-to-r from-violet-500 to-cyan-400"
                  }`}
                  style={{ width: `${t.pct}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
