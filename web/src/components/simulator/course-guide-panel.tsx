"use client";

import { useEffect, useRef } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  MousePointerClick,
  PartyPopper,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
} from "lucide-react";
import { useDesignStore, useSimulationStore } from "@/lib/simulator/store";
import { useCourseStore, applyMilestoneSnapshot } from "@/lib/simulator/course-store";
import { getCourseById, getMilestoneById, getPlayableMilestones } from "@/lib/simulator/courses";
import { resetGuidedCourse } from "@/lib/simulator/persistence";
import { useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/lib/simulator/workspace-store";
import { MilestoneReflection } from "./milestone-reflection";
import { TradeoffPanel } from "./tradeoff-panel";
import { MetricsCompare } from "./metrics-compare";
import { cn } from "@/lib/utils";
import type { CourseMilestone } from "@/lib/simulator/courses/types";

export function CourseGuidePanel() {
  const router = useRouter();
  const design = useDesignStore((s) => s.design);
  const loadDesign = useDesignStore((s) => s.loadDesign);
  const updateCourseProgress = useDesignStore((s) => s.updateCourseProgress);
  const save = useDesignStore((s) => s.save);
  const running = useSimulationStore((s) => s.running);
  const systemHealth = useSimulationStore((s) => s.systemHealth);
  const totalRps = useSimulationStore((s) => s.totalSystemRps);
  const toggle = useSimulationStore((s) => s.toggle);

  const progress = useCourseStore((s) => s.progress);
  const learningMode = useCourseStore((s) => s.learningMode);
  const initCourse = useCourseStore((s) => s.initCourse);
  const advancePhase = useCourseStore((s) => s.advancePhase);
  const setPhase = useCourseStore((s) => s.setPhase);
  const answerReflection = useCourseStore((s) => s.answerReflection);
  const markFailureObserved = useCourseStore((s) => s.markFailureObserved);
  const markSimulationRun = useCourseStore((s) => s.markSimulationRun);
  const markAfterSimulationRun = useCourseStore((s) => s.markAfterSimulationRun);
  const completeMilestone = useCourseStore((s) => s.completeMilestone);
  const getCurrentMilestone = useCourseStore((s) => s.getCurrentMilestone);

  const resetCourse = useCourseStore((s) => s.resetCourse);

  const setMode = useWorkspaceStore((s) => s.setMode);

  const courseId = design?.courseId;
  const course = courseId ? getCourseById(courseId) : null;
  const milestone = getCurrentMilestone();

  useEffect(() => {
    if (!design?.courseId || progress) return;
    initCourse(design.courseId, design.courseMilestoneId, design.courseProgress);
  }, [design?.courseId, design?.courseMilestoneId, design?.courseProgress, progress, initCourse]);

  // Persist progress with debounce to avoid render loops
  const progressRef = useRef(progress);
  progressRef.current = progress;
  useEffect(() => {
    if (!design?.courseId || !progress) return;
    const timer = setTimeout(() => {
      updateCourseProgress(progress);
    }, 500);
    return () => clearTimeout(timer);
  }, [progress?.phase, progress?.milestoneId, progress?.completedMilestoneIds.length]);

  // Auto-advance: simulation started → wait a bit then move to observe (Ch1) or wait for failure (Ch2)
  useEffect(() => {
    if (!progress || !milestone || !running) return;
    if (progress.phase !== "run_simulation") return;

    markSimulationRun();

    if (!milestone.expectsFailure) {
      // Let user watch for 3 seconds, then advance to observe
      const timer = setTimeout(() => {
        setPhase("observe");
      }, 3000);
      return () => clearTimeout(timer);
    }
    // For failure milestones, we wait for the systemHealth effect below
  }, [running, progress?.phase, milestone?.id]);

  // Auto-advance: failure detected
  useEffect(() => {
    if (!progress || !milestone?.expectsFailure) return;
    if (progress.phase !== "run_simulation") return;
    if (!running || systemHealth === "healthy") return;

    markFailureObserved();
    setPhase("failure");
  }, [systemHealth, running, progress?.phase, milestone?.id]);

  // Auto-advance: run_after simulation started → wait then allow continue
  useEffect(() => {
    if (!progress || !running) return;
    if (progress.phase !== "run_after") return;

    markAfterSimulationRun();
  }, [running, progress?.phase]);

  // Learner action validation — use acceptance criteria from evaluator
  // If the user proactively fixes the architecture and simulation passes, let them skip ahead
  const alreadySolved = (() => {
    if (!milestone?.acceptanceCriteria || !design || !running) return false;
    // Check if system is healthy and handling the required RPS
    if (systemHealth !== "healthy" && systemHealth !== "degraded") return false;
    const metrics = useSimulationStore.getState().metrics;
    let totalErrors = 0;
    let maxP95 = 0;
    let nodeCount = 0;
    for (const node of design.nodes) {
      const m = metrics[node.id];
      if (!m || node.type === "client") continue;
      nodeCount++;
      totalErrors += m.errorRate;
      if (m.p95LatencyMs > maxP95) maxP95 = m.p95LatencyMs;
    }
    const avgError = nodeCount > 0 ? totalErrors / nodeCount : 0;
    const criteria = milestone.acceptanceCriteria;
    return maxP95 <= criteria.maxP95LatencyMs &&
      avgError <= criteria.maxErrorRate &&
      totalRps >= criteria.minHandledRps;
  })();

  useEffect(() => {
    if (!progress || !milestone?.acceptanceCriteria || !design || !alreadySolved) return;

    const skipPhases = ["failure", "reflection", "suggested_solution", "learner_action"];
    if (!skipPhases.includes(progress.phase)) return;

    if (progress.phase === "learner_action") {
      setPhase("run_after");
      setMode("run");
    }
  }, [alreadySolved, progress?.phase, milestone?.id]);

  if (!course || !progress || !milestone) return null;

  const phase = progress.phase;

  const handlePrimary = () => {
    switch (phase) {
      case "product_update":
        setMode("run");
        setPhase("run_simulation");
        if (!running) toggle();
        break;
      case "run_simulation":
        if (!running) {
          setMode("run");
          toggle();
        } else if (!milestone.expectsFailure) {
          // Already running and healthy — user can manually advance
          setPhase("observe");
        }
        break;
      case "observe":
        advancePhase();
        break;
      case "failure":
        if (alreadySolved) {
          setPhase("run_after");
          setMode("run");
        } else {
          advancePhase();
        }
        break;
      case "reflection":
        if (alreadySolved) {
          setPhase("run_after");
          setMode("run");
        }
        break;
      case "suggested_solution":
        if (alreadySolved) {
          setPhase("run_after");
          setMode("run");
        } else {
          setMode("compose");
          advancePhase();
        }
        break;
      case "learner_action":
        if (alreadySolved) {
          setPhase("run_after");
          setMode("run");
        } else {
          setMode("compose");
        }
        break;
      case "run_after":
        setMode("run");
        if (!running) toggle();
        else advancePhase();
        break;
      case "tradeoffs":
        handleCompleteMilestone();
        break;
      case "complete":
        handleCompleteMilestone();
        break;
      default:
        advancePhase();
    }
  };

  const handleCompleteMilestone = () => {
    const nextMilestoneId = getNextMilestoneId(course, milestone.id);
    completeMilestone();
    const updatedProgress = useCourseStore.getState().progress;

    if (nextMilestoneId && design) {
      const nextM = getMilestoneById(course, nextMilestoneId);
      if (nextM) {
        loadDesign(
          applyMilestoneSnapshot(
            {
              ...design,
              courseMilestoneId: nextM.id,
              courseProgress: updatedProgress ?? undefined,
            },
            nextM,
          ),
        );
      }
    } else if (design && updatedProgress) {
      loadDesign({ ...design, courseProgress: updatedProgress });
    }
    save();
  };

  const handleResetCourse = () => {
    if (!design?.courseId) return;
    if (!window.confirm("Reset to chapter 1? All progress will be cleared.")) return;
    const reset = resetGuidedCourse(design.courseId);
    if (!reset) return;
    resetCourse();
    loadDesign(reset);
    save();
    router.replace(`/projects/${reset.id}`);
  };

  const playableCount = course ? getPlayableMilestones(course).length : 0;
  const completedCount = progress?.completedMilestoneIds.length ?? 0;
  const courseProgressPct = playableCount > 0 ? Math.round((completedCount / playableCount) * 100) : 0;

  return (
    <aside className="ws-course-panel flex h-full w-[320px] shrink-0 flex-col border-l border-[var(--clay-border)] bg-[var(--clay-surface)]">
      {/* Header */}
      <div className="shrink-0 border-b border-[var(--clay-border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[var(--clay-lilac)]" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--clay-lilac)]">
              Chapter {milestone.chapterNumber} &middot; {milestone.chapterTitle}
            </div>
            <div className="text-sm font-semibold text-[var(--clay-text)]">
              {milestone.title}
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetCourse}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[var(--clay-text-subtle)] hover:bg-[var(--clay-surface-2)] hover:text-[var(--clay-text)]"
            title="Reset course to chapter 1"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        {playableCount > 0 && (
          <div className="mt-2">
            <div className="mb-1 flex items-center justify-between text-[10px] text-[var(--clay-text-subtle)]">
              <span>Course progress</span>
              <span className="tabular-nums">{completedCount}/{playableCount} chapters</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-[var(--clay-border)]">
              <div
                className="h-full rounded-full bg-[var(--clay-lilac)] transition-all"
                style={{ width: `${Math.max(courseProgressPct, completedCount > 0 ? courseProgressPct : 4)}%` }}
              />
            </div>
          </div>
        )}

        {/* Milestone checklist progress */}
        <div className="mt-2 flex gap-1">
          {milestone.checklist.map((item, i) => {
            const done = isChecklistDone(item, phase, progress, milestone);
            return (
              <div
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  done ? "bg-emerald-500" : "bg-[var(--clay-border)]",
                )}
                title={item}
              />
            );
          })}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-4 p-4">
          {/* Product update - always visible */}
          <div className="rounded-xl bg-[var(--clay-bg-soft)] p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
              <Sparkles className="h-3 w-3" />
              Product update
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--clay-text)]">
              {milestone.productUpdate}
            </p>
          </div>

          {/* Goal */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
              Your goal
            </div>
            <p className="mt-0.5 text-xs text-[var(--clay-text-muted)]">{milestone.goal}</p>
          </div>

          {/* Phase-specific content */}
          {phase === "product_update" && (
            <PhaseCard>
              <p className="text-xs text-[var(--clay-text-muted)]">
                Ready? Click the button below to start the simulation and see traffic flowing.
              </p>
            </PhaseCard>
          )}

          {(phase === "run_simulation" || phase === "observe") && (
            <PhaseCard>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  running ? "animate-pulse bg-emerald-500" : "bg-[var(--clay-border)]",
                )} />
                <span className="text-xs font-medium text-[var(--clay-text)]">
                  {running ? `Simulation running — ${totalRps} rps` : "Simulation paused"}
                </span>
              </div>
              {running && systemHealth === "healthy" && !milestone.expectsFailure && (
                <p className="mt-2 text-xs text-emerald-600">
                  System is healthy. Everything looks good at this traffic level.
                </p>
              )}
            </PhaseCard>
          )}

          {phase === "failure" && (
            <>
              {milestone.failureDescription && !alreadySolved && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-500/8 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <div>
                    <div className="text-xs font-semibold text-amber-700">System failing</div>
                    <p className="mt-0.5 text-xs leading-relaxed text-[var(--clay-text-muted)]">
                      {milestone.failureDescription}
                    </p>
                  </div>
                </div>
              )}
              {alreadySolved && (
                <div className="flex items-start gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/8 p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div>
                    <div className="text-xs font-semibold text-emerald-700">Already fixed!</div>
                    <p className="mt-0.5 text-xs leading-relaxed text-[var(--clay-text-muted)]">
                      You&apos;ve already added the right components. Click below to verify.
                    </p>
                  </div>
                </div>
              )}
              {running && !alreadySolved && (
                <div className="flex items-center gap-2 text-xs text-[var(--clay-text-muted)]">
                  <Zap className="h-3 w-3 text-amber-500" />
                  Live: {totalRps} rps &middot; {systemHealth}
                </div>
              )}
            </>
          )}

          {phase === "reflection" && milestone.reflectionQuestion && (
            <MilestoneReflection
              question={milestone.reflectionQuestion}
              onAnswer={answerReflection}
              learningMode={learningMode}
              showExplanation={learningMode === "beginner"}
            />
          )}

          {(phase === "suggested_solution" || phase === "learner_action") && (
            <>
              {milestone.suggestedComponentHint && (
                <div className="rounded-xl border border-[var(--clay-primary)]/25 bg-[var(--clay-primary)]/5 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--clay-primary)]">
                    Suggested fix
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--clay-text)]">
                    {milestone.suggestedComponentHint}
                  </p>
                </div>
              )}
              {phase === "learner_action" && (
                <div className="flex items-start gap-2 rounded-xl border border-[var(--clay-border)] bg-[var(--clay-surface-2)] p-3">
                  <MousePointerClick className="mt-0.5 h-4 w-4 shrink-0 text-[var(--clay-primary)]" />
                  <div>
                    <div className="text-xs font-semibold text-[var(--clay-text)]">Your turn</div>
                    <p className="mt-0.5 text-xs text-[var(--clay-text-muted)]">
                      Right-click anywhere on the canvas to add components. {milestone.task}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {phase === "run_after" && (
            <PhaseCard>
              <p className="text-xs text-[var(--clay-text-muted)]">
                Great work! Now run the simulation again to see how your changes perform under the same traffic.
              </p>
              {running && (
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    systemHealth === "healthy" ? "bg-emerald-500" : "bg-amber-500",
                  )} />
                  <span className="text-[var(--clay-text)]">{totalRps} rps &middot; {systemHealth}</span>
                </div>
              )}
            </PhaseCard>
          )}

          {(phase === "observe" || phase === "failure" || phase === "run_after" || phase === "tradeoffs") && (
            <MetricsCompare
              before={milestone.beforeMetrics}
              after={milestone.afterMetrics}
              showAfter={phase === "run_after" || phase === "tradeoffs" || (phase === "observe" && !milestone.expectsFailure)}
              liveHealthy={phase === "observe" && !milestone.expectsFailure && systemHealth === "healthy"}
            />
          )}

          {phase === "tradeoffs" && (
            <TradeoffPanel tradeoffs={milestone.tradeoffs} />
          )}

          {phase === "complete" && (
            <div className="flex flex-col items-center gap-2 rounded-xl bg-emerald-500/8 p-4 text-center">
              <PartyPopper className="h-6 w-6 text-emerald-600" />
              <div className="text-sm font-semibold text-emerald-700">Milestone complete!</div>
              <p className="text-xs text-[var(--clay-text-muted)]">
                You&apos;ve successfully evolved the architecture.
              </p>
            </div>
          )}

          {/* Checklist */}
          <div>
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
              Checklist
            </div>
            <ul className="space-y-1.5">
              {milestone.checklist.map((item, i) => {
                const done = isChecklistDone(item, phase, progress, milestone);
                return (
                  <li key={i} className="flex items-center gap-2 text-[11px]">
                    {done ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 shrink-0 text-[var(--clay-border)]" />
                    )}
                    <span className={cn(
                      done ? "text-[var(--clay-text-subtle)] line-through" : "text-[var(--clay-text)]",
                    )}>
                      {item}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* Footer with CTA */}
      <div className="shrink-0 border-t border-[var(--clay-border)] px-4 py-3">
        <button
          type="button"
          onClick={handlePrimary}
          disabled={phase === "reflection" && !alreadySolved}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
            phase === "reflection" && !alreadySolved
              ? "cursor-not-allowed bg-[var(--clay-surface-2)] text-[var(--clay-text-subtle)]"
              : "bg-gradient-to-b from-[var(--clay-primary)] to-[var(--clay-primary-dark)] text-white shadow-[0_4px_12px_-4px_rgba(107,140,174,0.45)] hover:shadow-[0_6px_20px_-4px_rgba(107,140,174,0.55)]",
          )}
        >
          {(phase === "run_simulation" || phase === "run_after") && !running ? (
            <Play className="h-4 w-4" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          {getPrimaryLabel(phase, running, milestone, alreadySolved)}
        </button>
      </div>
    </aside>
  );
}

function PhaseCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--clay-border)] bg-[var(--clay-surface-2)]/50 p-3">
      {children}
    </div>
  );
}

function getPrimaryLabel(
  phase: string,
  running: boolean,
  milestone: { expectsFailure?: boolean },
  solved?: boolean,
): string {
  switch (phase) {
    case "product_update":
      return "Run simulation";
    case "run_simulation":
      if (!running) return "Run simulation";
      if (milestone.expectsFailure) return "Watching for failure...";
      return "Skip — continue";
    case "observe":
      return "Continue";
    case "failure":
      return solved ? "Already fixed — verify it" : "What went wrong?";
    case "reflection":
      return solved ? "Skip — already fixed" : "Answer the question above";
    case "suggested_solution":
      return solved ? "Verify my fix" : "Got it — let me fix it";
    case "learner_action":
      return solved ? "Verify my fix" : "Right-click canvas to add";
    case "run_after":
      return running ? "Looks good — continue" : "Run simulation again";
    case "tradeoffs":
      return "Next milestone";
    case "complete":
      return "Continue course";
    default:
      return "Continue";
  }
}

function isChecklistDone(
  item: string,
  phase: string,
  progress: { simulationRuns: number; failureObserved: boolean; reflectionCorrect: boolean | null },
  milestone: CourseMilestone,
): boolean {
  const lower = item.toLowerCase();
  if (lower.includes("run simulation") || lower.includes("re-run")) {
    return progress.simulationRuns > 0 || phase === "observe" || phase === "tradeoffs" || phase === "failure" || phase === "run_after";
  }
  if (lower.includes("healthy") || lower.includes("confirm")) {
    return phase === "tradeoffs" || phase === "complete" || (phase === "observe" && !milestone.expectsFailure);
  }
  if (lower.includes("failure") || lower.includes("observe")) {
    return progress.failureObserved || phase === "failure" || ["reflection", "suggested_solution", "learner_action", "run_after", "tradeoffs", "complete"].includes(phase);
  }
  if (lower.includes("bottleneck") || lower.includes("identify")) {
    return progress.reflectionCorrect === true || ["suggested_solution", "learner_action", "run_after", "tradeoffs", "complete"].includes(phase);
  }
  if (lower.includes("add") || lower.includes("load balancer")) {
    return ["run_after", "tradeoffs", "complete"].includes(phase);
  }
  if (lower.includes("trade-off") || lower.includes("review")) {
    return phase === "complete";
  }
  if (lower.includes("compare")) {
    return phase === "tradeoffs" || phase === "complete";
  }
  return false;
}

function getNextMilestoneId(course: ReturnType<typeof getCourseById>, currentId: string): string | null {
  if (!course) return null;
  const all = course.chapters.flatMap((c) => c.milestones);
  const idx = all.findIndex((m) => m.id === currentId);
  return all[idx + 1]?.id ?? null;
}
