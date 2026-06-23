"use client";

import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";
import { PROJECTS } from "@/lib/content/projects";
import { getJourney } from "@/lib/content/journeys";
import { StudioCard } from "@/components/studio/studio-card";
import type { LearningStats } from "@/lib/learning-stats";

const CONTINUE_IMAGE = {
  src: "/studio-continue-image-2.png",
  alt: "System design stack",
};

function ContinueIllustration() {
  return (
    <div className="relative -ml-2 hidden min-h-[200px] w-[200px] shrink-0 sm:block lg:-ml-4 lg:w-[240px]">
      <Image
        src={CONTINUE_IMAGE.src}
        alt={CONTINUE_IMAGE.alt}
        fill
        className="object-contain object-left"
        sizes="(max-width: 1024px) 200px, 240px"
        priority
      />
    </div>
  );
}

function projectProgress(row: LearningStats["activeProjects"][0]) {
  const journey = getJourney(row.projectId);
  const total = journey?.stages.length ?? 1;
  const stageTitle = journey?.stages[row.stageIndex]?.title ?? "Getting started";
  const pct = Math.round(((row.stageIndex + 1) / total) * 100);
  return { stageTitle, pct, totalStages: total, stageIndex: row.stageIndex + 1 };
}

export function StudioContinueCard({ stats }: { stats: LearningStats }) {
  const active = stats.activeProjects[0];
  const fallback = PROJECTS[0];
  const project = active
    ? PROJECTS.find((p) => p.id === active.projectId)
    : fallback;
  const prog = active ? projectProgress(active) : null;
  const tags = project?.tags ?? fallback.tags;
  const pct = prog?.pct ?? 8;

  return (
    <StudioCard
      className="relative flex h-full min-h-[200px] overflow-hidden"
      data-tour="continue-card"
    >
      <div className="flex min-w-0 max-w-[72%] flex-1 flex-col justify-between p-5 sm:max-w-[68%]">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--studio-text-subtle)]">
            Continue Designing
          </p>
          <h2 className="mt-1 text-2xl font-bold text-[var(--studio-text)]">
            {active ? active.title : fallback.shortTitle}
          </h2>
          {prog && (
            <p className="mt-1.5 text-sm text-[var(--studio-text-muted)]">
              Stage {prog.stageIndex}/{prog.totalStages} &middot; {prog.stageTitle}
            </p>
          )}
          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg border border-[var(--studio-border)] bg-[var(--studio-surface-2)] px-2.5 py-1 text-[11px] capitalize text-[var(--studio-text-muted)]"
                >
                  {tag.replace("-", " ")}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="rounded-lg border border-[var(--studio-border)] bg-[var(--studio-surface-2)] px-2.5 py-1 text-[11px] text-[var(--studio-text-subtle)]">
                  +{tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 w-full max-w-[550px]">
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="text-[var(--studio-text-muted)]">Progress</span>
            <span className="font-semibold tabular-nums text-[var(--studio-text)]">{pct}%</span>
          </div>
          <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[var(--studio-surface-2)]">
            <div
              className="h-full rounded-full bg-[var(--studio-purple)]"
              style={{ width: `${pct}%` }}
            />
          </div>
          <Link
            href={active ? `/projects/${active.projectId}` : `/projects/${fallback.id}`}
            className="studio-btn-primary w-fit"
          >
            <Play className="h-3.5 w-3.5" /> Resume
          </Link>
        </div>
      </div>

      <ContinueIllustration />
    </StudioCard>
  );
}
