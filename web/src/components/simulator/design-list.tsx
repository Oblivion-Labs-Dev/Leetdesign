"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Clock,
  Trash2,
  Copy,
  GraduationCap,
  Target,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import {
  listDesigns,
  deleteDesign,
  duplicateDesign,
  saveDesign,
  findDesignByCourseId,
  resetGuidedCourse,
} from "@/lib/simulator/persistence";
import { createDesign } from "@/lib/simulator/types";
import type { DesignSummary } from "@/lib/simulator/types";
import {
  GUIDED_COURSES,
  DESIGN_CHALLENGES,
  createGuidedDesign,
  createChallengeDesign,
} from "@/lib/simulator/project-catalog";
import { getCourseById, getMilestoneById } from "@/lib/simulator/courses";
import { cn } from "@/lib/utils";

export function DesignList() {
  const router = useRouter();
  const [designs, setDesigns] = useState<DesignSummary[]>([]);

  useEffect(() => {
    setDesigns(listDesigns());
  }, []);

  const refresh = () => setDesigns(listDesigns());

  const handleNew = () => {
    const d = createDesign("Untitled Design");
    d.projectKind = "free";
    saveDesign(d);
    router.push(`/projects/${d.id}`);
  };

  const handleGuidedOpen = (courseId: string) => {
    const existing = findDesignByCourseId(courseId);
    if (existing) {
      router.push(`/projects/${existing.id}`);
      return;
    }
    const d = createGuidedDesign(courseId);
    if (!d) return;
    saveDesign(d);
    router.push(`/projects/${d.id}`);
  };

  const handleGuidedReset = (courseId: string) => {
    if (!window.confirm("Reset this course to chapter 1? Your progress will be cleared.")) return;
    const reset = resetGuidedCourse(courseId);
    if (reset) {
      refresh();
      router.push(`/projects/${reset.id}`);
    }
  };

  const handleChallengeStart = (challengeId: string) => {
    const d = createChallengeDesign(challengeId);
    if (!d) return;
    saveDesign(d);
    router.push(`/projects/${d.id}`);
  };

  const handleDelete = (id: string) => {
    deleteDesign(id);
    refresh();
  };

  const handleDuplicate = (id: string, name: string) => {
    duplicateDesign(id, `${name} (copy)`);
    refresh();
  };

  const userDesigns = designs.filter(
    (d) => d.projectKind === "free" || (!d.projectKind && !d.scenarioId && !d.challengeId && !d.courseId),
  );
  const inProgressChallenges = designs.filter((d) => d.projectKind === "challenge" || d.challengeId);

  const ago = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--clay-lilac)]">
            Design Studio
          </div>
          <h2 className="text-xl font-semibold text-[var(--clay-text)] sm:text-2xl">
            System Design Simulator
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--clay-text-muted)]">
            Follow guided courses step-by-step, or tackle design challenges on your own with pass/fail checks.
          </p>
        </div>
        <button type="button" onClick={handleNew} className="studio-btn-primary inline-flex items-center gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Blank canvas
        </button>
      </div>

      {/* Section 1: Guided courses */}
      <section className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-[var(--clay-lilac)]" />
          <h3 className="text-sm font-semibold text-[var(--clay-text)]">Guided courses</h3>
          <span className="text-[10px] text-[var(--clay-text-subtle)]">Step-by-step learning</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {GUIDED_COURSES.map((course) => {
            const saved = designs.find((d) => d.courseId === course.id);
            const completed = saved?.completedMilestoneCount ?? 0;
            const total = saved?.totalMilestoneCount ?? course.steps;
            const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;
            const courseDef = getCourseById(course.id);
            const currentMilestone = saved?.courseMilestoneId && courseDef
              ? getMilestoneById(courseDef, saved.courseMilestoneId)
              : null;
            const hasProgress = Boolean(saved && (completed > 0 || saved.updatedAt));

            return (
              <div key={course.id} className="studio-card group p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--clay-lilac)]/12">
                    <Sparkles className="h-5 w-5 text-[var(--clay-lilac)]" />
                  </div>
                  <span className="rounded-full bg-[var(--clay-lilac)]/12 px-2 py-0.5 text-[9px] font-semibold text-[var(--clay-lilac)]">
                    {course.difficulty}
                  </span>
                </div>
                <div className="mt-3 text-sm font-semibold text-[var(--clay-text)]">{course.title}</div>
                <p className="mt-1 line-clamp-2 text-xs text-[var(--clay-text-muted)]">{course.description}</p>
                <div className="mt-2 flex gap-2 text-[10px] text-[var(--clay-text-subtle)]">
                  <span>{course.steps} chapters</span>
                  <span>·</span>
                  <span>{course.duration}</span>
                </div>

                {saved && (
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-[10px]">
                      <span className="font-medium text-[var(--clay-text-muted)]">
                        {currentMilestone
                          ? `Ch.${currentMilestone.chapterNumber} · ${currentMilestone.title}`
                          : "In progress"}
                      </span>
                      <span className="tabular-nums text-[var(--clay-text-subtle)]">
                        {completed}/{total}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--clay-border)]">
                      <div
                        className="h-full rounded-full bg-[var(--clay-lilac)] transition-all"
                        style={{ width: `${Math.max(progressPct, hasProgress ? 8 : 0)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleGuidedOpen(course.id)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--clay-primary)]/12 py-2 text-xs font-semibold text-[var(--clay-primary)] transition-colors hover:bg-[var(--clay-primary)]/18"
                  >
                    {saved ? "Continue" : "Start course"}
                    <ArrowRight className="h-3 w-3" />
                  </button>
                  {saved && (
                    <button
                      type="button"
                      onClick={() => handleGuidedReset(course.id)}
                      className="inline-flex items-center justify-center gap-1 rounded-xl border border-[var(--clay-border)] px-2.5 py-2 text-xs font-semibold text-[var(--clay-text-subtle)] transition-colors hover:bg-[var(--clay-surface-2)] hover:text-[var(--clay-text)]"
                      title="Reset course to chapter 1"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: Design challenges */}
      <section className="mt-10">
        <div className="mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-[var(--clay-primary)]" />
          <h3 className="text-sm font-semibold text-[var(--clay-text)]">Design challenges</h3>
          <span className="text-[10px] text-[var(--clay-text-subtle)]">Attempt on your own — checks must pass</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {DESIGN_CHALLENGES.map((ch) => (
            <div key={ch.id} className="studio-card group p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--clay-primary)]/10">
                  <Target className="h-5 w-5 text-[var(--clay-primary)]" />
                </div>
                <span className="rounded-full bg-[var(--clay-surface-2)] px-2 py-0.5 text-[9px] font-semibold text-[var(--clay-text-subtle)]">
                  {ch.difficulty}
                </span>
              </div>
              <div className="mt-3 text-sm font-semibold text-[var(--clay-text)]">{ch.title}</div>
              <p className="mt-1 line-clamp-2 text-xs text-[var(--clay-text-muted)]">{ch.description}</p>
              <div className="mt-2 flex items-center gap-1 text-[10px] text-[var(--clay-text-subtle)]">
                <CheckCircle2 className="h-3 w-3" />
                {ch.checks.length} checks to pass
              </div>
              <button
                type="button"
                onClick={() => handleChallengeStart(ch.id)}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--clay-border)] py-2 text-xs font-semibold text-[var(--clay-text)] transition-colors hover:bg-[var(--clay-surface-2)]"
              >
                Start challenge <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        {inProgressChallenges.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--clay-text-subtle)]">
              In progress
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {inProgressChallenges.map((d) => (
                <SavedDesignCard
                  key={d.id}
                  design={d}
                  badge="Challenge"
                  badgeColor="primary"
                  onOpen={() => router.push(`/projects/${d.id}`)}
                  onDuplicate={() => handleDuplicate(d.id, d.name)}
                  onDelete={() => handleDelete(d.id)}
                  ago={ago(d.updatedAt)}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Section 3: Your work */}
      <section className="mt-10">
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[var(--clay-text)]">Your designs</h3>
          <span className="text-[10px] text-[var(--clay-text-subtle)]">Free-form sandbox work</span>
        </div>

        {userDesigns.length === 0 ? (
          <div className="studio-card grid place-items-center px-8 py-10 text-center">
            <div className="text-xs text-[var(--clay-text-muted)]">
              No sandbox designs yet. Start from a blank canvas or duplicate a challenge attempt.
            </div>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {userDesigns.map((d) => (
              <SavedDesignCard
                key={d.id}
                design={d}
                onOpen={() => router.push(`/projects/${d.id}`)}
                onDuplicate={() => handleDuplicate(d.id, d.name)}
                onDelete={() => handleDelete(d.id)}
                ago={ago(d.updatedAt)}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function SavedDesignCard({
  design,
  badge,
  badgeColor,
  onOpen,
  onDuplicate,
  onDelete,
  ago,
}: {
  design: DesignSummary;
  badge?: string;
  badgeColor?: "lilac" | "primary";
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  ago: string;
}) {
  return (
    <div
      onClick={onOpen}
      className={cn(
        "studio-card group cursor-pointer p-3 transition-all",
        "hover:border-[color-mix(in_srgb,var(--clay-primary)_40%,var(--clay-border))]",
      )}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="truncate text-sm font-semibold text-[var(--clay-text)]">{design.name}</div>
            {badge && (
              <span className={cn(
                "shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-semibold",
                badgeColor === "lilac" ? "bg-[var(--clay-lilac)]/12 text-[var(--clay-lilac)]" : "bg-[var(--clay-primary)]/12 text-[var(--clay-primary)]",
              )}>
                {badge}
              </span>
            )}
          </div>
          {design.description && (
            <div className="mt-0.5 line-clamp-1 text-xs text-[var(--clay-text-muted)]">{design.description}</div>
          )}
        </div>
        <div className="ml-2 flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            className="grid h-7 w-7 place-items-center rounded-lg text-[var(--clay-text-subtle)] hover:bg-[var(--clay-surface-2)]"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="grid h-7 w-7 place-items-center rounded-lg text-[var(--clay-text-subtle)] hover:bg-rose-500/10 hover:text-rose-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3 text-[10px] text-[var(--clay-text-subtle)]">
        <span>{design.nodeCount} components</span>
        <span>{design.edgeCount} connections</span>
        <span className="ml-auto inline-flex items-center gap-1">
          <Clock className="h-3 w-3" /> {ago}
        </span>
      </div>
    </div>
  );
}
