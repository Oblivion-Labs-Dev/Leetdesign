"use client";

import { GitBranch } from "lucide-react";
import { getCourseById, getEvolutionSteps } from "@/lib/simulator/courses";
import { useCourseStore } from "@/lib/simulator/course-store";
import { cn } from "@/lib/utils";

interface CourseEvolutionTimelineProps {
  courseId: string;
  onRestore: (milestoneId: string) => void;
}

export function CourseEvolutionTimeline({ courseId, onRestore }: CourseEvolutionTimelineProps) {
  const course = getCourseById(courseId);
  const progress = useCourseStore((s) => s.progress);
  if (!course) return null;

  const steps = getEvolutionSteps(course);
  if (steps.length === 0) return null;

  return (
    <div className="border-b border-[var(--clay-border)] px-3 py-2">
      <div className="mb-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
        <GitBranch className="h-3 w-3" />
        System evolution
      </div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {steps.map((step, i) => {
          const completed = progress?.completedMilestoneIds.includes(step.milestoneId);
          const current = progress?.milestoneId === step.milestoneId;
          return (
            <button
              key={step.milestoneId}
              type="button"
              onClick={() => onRestore(step.milestoneId)}
              title={`Chapter ${step.chapterNumber}: ${step.label}`}
              className={cn(
                "shrink-0 rounded-lg border px-2 py-1 text-[9px] font-medium transition-colors",
                current
                  ? "border-[var(--clay-primary)] bg-[var(--clay-primary)]/12 text-[var(--clay-primary)]"
                  : completed
                    ? "border-emerald-400/30 bg-emerald-500/8 text-emerald-700"
                    : "border-[var(--clay-border)] text-[var(--clay-text-subtle)] hover:bg-[var(--clay-surface-2)]",
              )}
            >
              {i + 1}. {step.label}
            </button>
          );
        })}
        {/* Placeholder steps for upcoming chapters */}
        {course.chapters.filter((c) => c.milestones.length === 0).slice(0, 3).map((ch) => (
          <span
            key={ch.id}
            className="shrink-0 rounded-lg border border-dashed border-[var(--clay-border)] px-2 py-1 text-[9px] text-[var(--clay-text-subtle)] opacity-50"
          >
            Ch.{ch.number} …
          </span>
        ))}
      </div>
    </div>
  );
}
