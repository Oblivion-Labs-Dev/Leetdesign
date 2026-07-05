"use client";

import { useEffect } from "react";
import {
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Circle,
  Play,
  ArrowRight,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { useDesignStore } from "@/lib/simulator/store";
import { useSimulationStore } from "@/lib/simulator/store";
import { useCourseStore, applyMilestoneSnapshot } from "@/lib/simulator/course-store";
import { getCourseById, getMilestoneById } from "@/lib/simulator/courses";
import { useWorkspaceStore } from "@/lib/simulator/workspace-store";
import { MilestoneReflection } from "./milestone-reflection";
import { TradeoffPanel } from "./tradeoff-panel";
import { MetricsCompare } from "./metrics-compare";
import { cn } from "@/lib/utils";
import type { CourseMilestone } from "@/lib/simulator/courses/types";

export function CourseMissionDock() {
  const design = useDesignStore((s) => s.design);
  const loadDesign = useDesignStore((s) => s.loadDesign);
  const running = useSimulationStore((s) => s.running);
  const systemHealth = useSimulationStore((s) => s.systemHealth);
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

  const missionExpanded = useWorkspaceStore((s) => s.missionExpanded);
  const toggleMission = useWorkspaceStore((s) => s.toggleMission);
  const setMode = useWorkspaceStore((s) => s.setMode);
  const openFocusedCategory = useWorkspaceStore((s) => s.openFocusedCategory);

  const courseId = design?.courseId;
  const course = courseId ? getCourseById(courseId) : null;
  const milestone = getCurrentMilestone();

  useEffect(() => {
    if (!design?.courseId || progress) return;
    initCourse(design.courseId, design.courseMilestoneId);
  }, [design?.courseId, design?.courseMilestoneId, progress, initCourse]);

  // Auto-advance: simulation started
  useEffect(() => {
    if (!progress || !milestone || !running) return;
    if (progress.phase === "run_simulation") {
      markSimulationRun();
      if (!milestone.expectsFailure) {
        setPhase("observe");
      }
    }
    if (progress.phase === "run_after" && running) {
      markAfterSimulationRun();
    }
  }, [running, progress?.phase, milestone, markSimulationRun, markAfterSimulationRun, setPhase]);

  // Auto-advance: failure observed
  useEffect(() => {
    if (!progress || !milestone?.expectsFailure) return;
    if (
      (progress.phase === "run_simulation" || progress.phase === "observe") &&
      running &&
      systemHealth !== "healthy"
    ) {
      markFailureObserved();
      setPhase("failure");
    }
  }, [systemHealth, running, progress?.phase, milestone, markFailureObserved, setPhase]);

  // Healthy observe for chapter 1
  useEffect(() => {
    if (!progress || !milestone || milestone.expectsFailure) return;
    if (progress.phase === "observe" && running && systemHealth === "healthy" && progress.simulationRuns > 0) {
      // stay in observe until user clicks continue
    }
  }, [progress, milestone, running, systemHealth]);

  // Learner action validation (using acceptance criteria)
  useEffect(() => {
    if (!progress || progress.phase !== "learner_action" || !milestone?.acceptanceCriteria || !design || !running) return;
    if (systemHealth === "healthy" || systemHealth === "degraded") {
      setPhase("run_after");
      setMode("run");
    }
  }, [design, progress?.phase, milestone, setPhase, setMode, running, systemHealth]);

  // Highlight suggested component in beginner mode
  useEffect(() => {
    if (!milestone?.suggestedComponent || learningMode === "interview") return;
    if (progress?.phase === "suggested_solution" || progress?.phase === "learner_action") {
      const cat = "core"; // load_balancer is in core
      openFocusedCategory(cat);
    }
  }, [progress?.phase, milestone?.suggestedComponent, learningMode, openFocusedCategory]);

  if (!course || !progress || !milestone) return null;

  const phase = progress.phase;
  const primaryLabel = getPrimaryLabel(phase, running, milestone);
  const handlePrimary = () => {
    switch (phase) {
      case "product_update":
        setMode("run");
        setPhase("run_simulation");
        if (!running) toggle();
        break;
      case "run_simulation":
        setMode("run");
        if (!running) toggle();
        break;
      case "observe":
        advancePhase(); // → tradeoffs
        break;
      case "failure":
        if (milestone.reflectionQuestion) {
          advancePhase(); // → reflection
        } else {
          advancePhase();
        }
        break;
      case "reflection":
        break;
      case "suggested_solution":
        setMode("compose");
        advancePhase(); // → learner_action
        break;
      case "learner_action":
        setMode("compose");
        openFocusedCategory("core");
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
    if (!missionExpanded) toggleMission();
  };

  const handleCompleteMilestone = () => {
    const nextMilestoneId = getNextMilestoneId(course, milestone.id);
    completeMilestone();
    if (nextMilestoneId && design) {
      const nextM = getMilestoneById(course, nextMilestoneId);
      if (nextM) {
        loadDesign(applyMilestoneSnapshot({ ...design, courseMilestoneId: nextM.id }, nextM));
      }
    }
  };

  return (
    <div className="ws-mission-dock pointer-events-none">
      <div className="ws-mission-dock-inner pointer-events-auto">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--clay-lilac)]">
              Chapter {milestone.chapterNumber} · {milestone.chapterTitle}
            </div>
            <div className="text-sm font-semibold text-[var(--clay-text)]">
              Milestone {milestone.milestoneIndex} of {milestone.milestoneCount}
            </div>
            <p className="mt-0.5 line-clamp-1 text-xs text-[var(--clay-text-muted)]">{milestone.task}</p>
          </div>

          <button
            type="button"
            onClick={handlePrimary}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-b from-[var(--clay-primary)] to-[var(--clay-primary-dark)] px-3 py-1.5 text-xs font-semibold text-white shadow-[0_4px_12px_-4px_rgba(107,140,174,0.45)]"
          >
            {(phase === "run_simulation" || phase === "run_after") && !running ? (
              <Play className="h-3 w-3" />
            ) : (
              <ArrowRight className="h-3 w-3" />
            )}
            {primaryLabel}
          </button>

          <button
            type="button"
            onClick={toggleMission}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[var(--clay-text-subtle)] hover:bg-[var(--clay-surface-2)]"
          >
            {missionExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex gap-1 px-4 pb-2">
          {milestone.checklist.map((item, i) => {
            const done = isChecklistDone(item, phase, progress, milestone);
            return (
              <div
                key={item}
                className={cn(
                  "h-1 flex-1 rounded-full",
                  done ? "bg-emerald-500" : i === 0 ? "bg-[var(--clay-primary)]" : "bg-[var(--clay-border)]",
                )}
                title={item}
              />
            );
          })}
        </div>

        {missionExpanded && (
          <div className="max-h-[min(420px,45vh)] overflow-y-auto border-t border-[var(--clay-border)] px-4 py-3">
            <div className="mb-3 rounded-xl bg-[var(--clay-bg-soft)] p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
                <Sparkles className="h-3 w-3" />
                Product update
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[var(--clay-text)]">{milestone.productUpdate}</p>
            </div>

            <div className="mb-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">Goal</div>
              <p className="mt-0.5 text-xs text-[var(--clay-text-muted)]">{milestone.goal}</p>
            </div>

            {(phase === "failure" || (phase === "run_simulation" && milestone.expectsFailure && systemHealth !== "healthy")) && milestone.failureDescription && (
              <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-500/8 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p className="text-xs leading-relaxed text-[var(--clay-text-muted)]">{milestone.failureDescription}</p>
              </div>
            )}

            {(phase === "observe" || phase === "failure" || phase === "run_after" || phase === "tradeoffs") && (
              <MetricsCompare
                before={milestone.beforeMetrics}
                after={milestone.afterMetrics}
                showAfter={phase === "run_after" || phase === "tradeoffs" || (phase === "observe" && !milestone.expectsFailure)}
                liveHealthy={phase === "observe" && !milestone.expectsFailure && systemHealth === "healthy"}
              />
            )}

            {phase === "reflection" && milestone.reflectionQuestion && (
              <div className="mb-3">
                <MilestoneReflection
                  question={milestone.reflectionQuestion}
                  onAnswer={answerReflection}
                  learningMode={learningMode}
                  showExplanation={learningMode === "beginner"}
                />
              </div>
            )}

            {(phase === "suggested_solution" || phase === "learner_action") && milestone.suggestedComponentHint && (
              <div className="mb-3 rounded-xl border border-[var(--clay-primary)]/25 bg-[var(--clay-primary)]/5 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--clay-primary)]">
                  Suggested next step
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[var(--clay-text-muted)]">
                  {milestone.suggestedComponentHint}
                </p>
              </div>
            )}

            {phase === "tradeoffs" && (
              <TradeoffPanel tradeoffs={milestone.tradeoffs} className="mb-3" />
            )}

            <ul className="space-y-1">
              {milestone.checklist.map((item, i) => {
                const done = isChecklistDone(item, phase, progress, milestone);
                return (
                  <li key={i} className="flex items-center gap-1.5 text-[10px]">
                    {done ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Circle className="h-3 w-3 text-[var(--clay-border)]" />
                    )}
                    <span className={cn(done && "text-[var(--clay-text-subtle)] line-through")}>{item}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function getPrimaryLabel(
  phase: string,
  running: boolean,
  milestone: { expectsFailure?: boolean },
): string {
  switch (phase) {
    case "product_update":
      return "Run simulation";
    case "run_simulation":
      return running ? "Watch traffic" : "Run simulation";
    case "observe":
      return "Continue";
    case "failure":
      return "Continue";
    case "reflection":
      return "Select an answer";
    case "suggested_solution":
      return "Add component";
    case "learner_action":
      return "Open component shelf";
    case "run_after":
      return running ? "Compare results" : "Run again";
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
