"use client";

import Image from "next/image";
import { Lock } from "lucide-react";
import type { LearnPathStep, LearnRoadmapProgress } from "@/types/learn";

export function RoadmapAsideSummary({
  stats,
  steps,
  progressPct,
  activeStepId,
  heroImageSrc = "/Concepts/database.png",
  onStepSelect,
}: {
  stats: LearnRoadmapProgress["stats"];
  steps: LearnPathStep[];
  progressPct: number;
  activeStepId?: string;
  heroImageSrc?: string;
  onStepSelect?: (stepId: string) => void;
}) {
  return (
    <section className="roadmap-aside-summary studio-card">
      <div className="roadmap-aside-summary-row">
        <div className="roadmap-aside-visual" aria-hidden>
          <Image
            src={heroImageSrc}
            alt=""
            width={80}
            height={80}
            className="roadmap-aside-image"
            priority
            unoptimized
          />
        </div>
        <dl className="roadmap-aside-metrics">
          <div className="roadmap-aside-metric">
            <dt>Learned</dt>
            <dd>
              {stats.completedCount}
              <span className="roadmap-aside-metric-dim">/{stats.conceptCount}</span>
            </dd>
          </div>
          <div className="roadmap-aside-metric">
            <dt>Time left</dt>
            <dd>{stats.timeLeft}</dd>
          </div>
          <div className="roadmap-aside-metric">
            <dt>Progress</dt>
            <dd>{stats.progressPct}%</dd>
          </div>
        </dl>
      </div>

      <div className="roadmap-aside-progress" aria-hidden>
        <div
          className="roadmap-aside-progress-fill"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="roadmap-aside-modules" role="tablist" aria-label="Learning modules">
        {steps.map((step, i) => {
          const isActive = step.id === activeStepId;
          const isDone = step.status === "completed";
          const isLocked = step.status === "locked";

          return (
            <button
              key={step.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={step.title}
              title={step.title}
              disabled={isLocked}
              onClick={() => onStepSelect?.(step.id)}
              className={`roadmap-aside-module ${
                isActive
                  ? "roadmap-aside-module--active"
                  : isDone
                    ? "roadmap-aside-module--done"
                    : isLocked
                      ? "roadmap-aside-module--locked"
                      : ""
              }`}
            >
              {isLocked ? <Lock className="h-3 w-3" /> : i + 1}
            </button>
          );
        })}
      </div>
    </section>
  );
}
