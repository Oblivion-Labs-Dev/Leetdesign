"use client";

import { useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { getJourney } from "@/lib/content/journeys";
import { StudioCard } from "@/components/studio/studio-card";
import type { LearningStats, ProjectProgressStat } from "@/lib/learning-stats";

type Session = {
  projectId: string;
  title: string;
  pct: number;
};

function buildSessions(rows: ProjectProgressStat[]): Session[] {
  return rows.map((row) => {
    const journey = getJourney(row.projectId);
    const total = journey?.stages.length ?? 1;
    const pct = Math.round(((row.stageIndex + 1) / total) * 100);
    return {
      projectId: row.projectId,
      title: row.title,
      pct: row.status === "completed" ? 100 : pct,
    };
  });
}

export function StudioSessions({ stats }: { stats: LearningStats }) {
  const sessions = useMemo(
    () => buildSessions([...stats.activeProjects, ...stats.completedProjects]).slice(0, 1),
    [stats.activeProjects, stats.completedProjects],
  );

  const session = sessions[0];

  return (
    <StudioCard className="p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--studio-text)]">Sessions</h2>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-[var(--studio-border)] bg-[var(--studio-surface-2)] px-2 py-1 text-[10px] font-medium text-[var(--studio-text-muted)]"
        >
          This Week <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      {session ? (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--studio-text)]">{session.title}</span>
            <span className="text-[11px] tabular-nums font-semibold text-[var(--studio-text-muted)]">
              {session.pct}%
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--studio-surface-2)]">
            <div
              className="h-full rounded-full bg-[var(--studio-purple)]"
              style={{ width: `${session.pct}%` }}
            />
          </div>
        </div>
      ) : (
        <p className="mt-4 text-center text-xs text-[var(--studio-text-muted)]">No sessions yet</p>
      )}
    </StudioCard>
  );
}
