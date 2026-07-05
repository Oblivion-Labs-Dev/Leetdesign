"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BookOpen, Layers, Sparkles, Target } from "lucide-react";
import { useDesignStore } from "@/lib/simulator/store";
import { useCourseStore } from "@/lib/simulator/course-store";
import { getCourseById, getPlayableMilestones } from "@/lib/simulator/courses";
import { LeetdesignLogo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";

export function CourseSidePanel() {
  const design = useDesignStore((s) => s.design);
  const progress = useCourseStore((s) => s.progress);
  const initCourse = useCourseStore((s) => s.initCourse);
  const getCurrentMilestone = useCourseStore((s) => s.getCurrentMilestone);

  const courseId = design?.courseId;
  const course = courseId ? getCourseById(courseId) : null;
  const milestone = getCurrentMilestone();

  useEffect(() => {
    if (!design?.courseId || progress) return;
    initCourse(design.courseId, design.courseMilestoneId, design.courseProgress);
  }, [design?.courseId, design?.courseMilestoneId, design?.courseProgress, progress, initCourse]);

  const playableCount = course ? getPlayableMilestones(course).length : 0;
  const completedCount = progress?.completedMilestoneIds.length ?? 0;
  const courseProgressPct =
    playableCount > 0 ? Math.round((completedCount / playableCount) * 100) : 0;

  return (
    <aside className="ws-course-panel flex h-full w-[300px] shrink-0 flex-col border-l border-[var(--clay-border)] bg-[var(--clay-surface)]">
      {course && milestone ? (
        <>
          <div className="shrink-0 border-b border-[var(--clay-border)] px-4 py-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-md bg-[var(--clay-lilac)]/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--clay-lilac)]">
                Chapter {milestone.chapterNumber}
              </span>
              <span className="text-[10px] text-[var(--clay-text-subtle)]">
                {milestone.chapterTitle}
              </span>
            </div>
            <h2 className="text-base font-semibold leading-snug text-[var(--clay-text)]">
              {milestone.title}
            </h2>
            {playableCount > 0 && (
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-[9px] text-[var(--clay-text-subtle)]">
                  <span>Course progress</span>
                  <span>{courseProgressPct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[var(--clay-surface-2)]">
                  <div
                    className="h-full rounded-full bg-[var(--clay-lilac)] transition-all duration-500"
                    style={{ width: `${courseProgressPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <section className="space-y-4">
              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
                  <Sparkles className="h-3 w-3" />
                  Scenario
                </div>
                <p className="text-[13px] leading-relaxed text-[var(--clay-text-muted)]">
                  {milestone.productUpdate}
                </p>
              </div>

              <div className="rounded-xl border border-[var(--clay-border)] bg-[var(--clay-bg-soft)] p-3">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--clay-primary)]">
                  <Target className="h-3 w-3" />
                  Your goal
                </div>
                <p className="text-xs leading-relaxed text-[var(--clay-text-muted)]">
                  {milestone.goal}
                </p>
              </div>

              <div className="rounded-xl border border-dashed border-[var(--clay-border)] px-3 py-2.5">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
                  <Layers className="h-3 w-3" />
                  Task
                </div>
                <p className="text-xs leading-relaxed text-[var(--clay-text)]">
                  {milestone.task}
                </p>
              </div>
            </section>
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">
          <BookOpen className="mb-3 h-8 w-8 text-[var(--clay-text-subtle)]" />
          <p className="text-sm text-[var(--clay-text-muted)]">
            Select a guided course from Projects to begin.
          </p>
        </div>
      )}

      <LeetdesignPromo />
    </aside>
  );
}

function LeetdesignPromo() {
  return (
    <div className="shrink-0 border-t border-[var(--clay-border)] p-4">
      <div
        className={cn(
          "rounded-2xl border border-[var(--clay-border)] p-4",
          "bg-gradient-to-br from-[var(--clay-surface-2)] to-[var(--clay-bg-soft)]",
        )}
      >
        <LeetdesignLogo variant="clay" compact className="mb-3" />
        <p className="text-xs leading-relaxed text-[var(--clay-text-muted)]">
          Practice system design like LeetCode — compose architectures, run traffic, and learn
          why things break.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <Link
            href="/projects"
            className="inline-flex items-center justify-center rounded-lg bg-[var(--clay-primary)]/12 px-3 py-2 text-[11px] font-semibold text-[var(--clay-primary)] transition-colors hover:bg-[var(--clay-primary)]/20"
          >
            Browse courses
          </Link>
          <Link
            href="/practice"
            className="inline-flex items-center justify-center rounded-lg border border-[var(--clay-border)] px-3 py-2 text-[11px] font-medium text-[var(--clay-text-muted)] transition-colors hover:bg-[var(--clay-surface-2)]"
          >
            Free-form practice
          </Link>
        </div>
      </div>
    </div>
  );
}
