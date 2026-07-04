import { create } from "zustand";
import type { LearningMode, MilestonePhase, SimulationMetricsSnapshot, CourseMilestone, CourseProgress } from "./courses/types";
import { nextPhase, phasesForMilestone, getMilestoneById } from "./courses/types";
import { getCourseById, STORE_GROWTH_COURSE } from "./courses/store-growth";
import type { SimDesign } from "./types";
import { snapshotToDesign } from "./courses/types";

export type { CourseProgress };

interface CourseState {
  progress: CourseProgress | null;
  learningMode: LearningMode;
  showTradeoffs: boolean;
  showReflection: boolean;
  /** Display metrics from milestone config (before/after story) */
  displayBeforeMetrics: SimulationMetricsSnapshot | null;
  displayAfterMetrics: SimulationMetricsSnapshot | null;
  metricsMode: "none" | "before" | "after" | "live";

  initCourse: (courseId: string, milestoneId?: string, savedProgress?: CourseProgress) => void;
  setLearningMode: (mode: LearningMode) => void;
  setPhase: (phase: MilestonePhase) => void;
  advancePhase: () => void;
  answerReflection: (answer: string) => boolean;
  markFailureObserved: () => void;
  markSimulationRun: () => void;
  markAfterSimulationRun: () => void;
  completeMilestone: () => void;
  goToMilestone: (milestoneId: string) => SimDesign | null;
  getCurrentMilestone: () => CourseMilestone | null;
  setShowTradeoffs: (show: boolean) => void;
  setShowReflection: (show: boolean) => void;
  setMetricsMode: (mode: CourseState["metricsMode"]) => void;
  resetCourse: () => void;
}

const DEFAULT_COURSE = STORE_GROWTH_COURSE;

export const useCourseStore = create<CourseState>((set, get) => ({
  progress: null,
  learningMode: "beginner",
  showTradeoffs: false,
  showReflection: false,
  displayBeforeMetrics: null,
  displayAfterMetrics: null,
  metricsMode: "none",

  initCourse: (courseId, milestoneId, savedProgress) => {
    const course = getCourseById(courseId) ?? DEFAULT_COURSE;

    if (savedProgress && savedProgress.courseId === courseId) {
      const milestone = getMilestoneById(course, savedProgress.milestoneId);
      if (milestone) {
        set({
          progress: savedProgress,
          showTradeoffs: savedProgress.phase === "tradeoffs",
          showReflection: savedProgress.phase === "reflection",
          displayBeforeMetrics: milestone.beforeMetrics,
          displayAfterMetrics: milestone.afterMetrics ?? null,
          metricsMode: savedProgress.phase === "run_after" || savedProgress.phase === "tradeoffs" ? "after" : "none",
        });
        return;
      }
    }

    const first =
      (milestoneId ? getMilestoneById(course, milestoneId) : null) ??
      course.chapters.flatMap((c) => c.milestones)[0];
    if (!first) return;

    set({
      progress: {
        courseId: course.id,
        milestoneId: first.id,
        phase: "product_update",
        completedMilestoneIds: [],
        reflectionCorrect: null,
        failureObserved: false,
        simulationRuns: 0,
        afterSimRuns: 0,
      },
      showTradeoffs: false,
      showReflection: false,
      displayBeforeMetrics: first.beforeMetrics,
      displayAfterMetrics: first.afterMetrics ?? null,
      metricsMode: "none",
    });
  },

  setLearningMode: (learningMode) => set({ learningMode }),

  setPhase: (phase) =>
    set((s) => {
      if (!s.progress) return s;
      return { progress: { ...s.progress, phase } };
    }),

  advancePhase: () => {
    const m = get().getCurrentMilestone();
    const progress = get().progress;
    if (!m || !progress) return;
    const next = nextPhase(progress.phase, m);
    if (!next) return;
    set({ progress: { ...progress, phase: next } });
    if (next === "tradeoffs") set({ showTradeoffs: true });
    if (next === "reflection") set({ showReflection: true });
  },

  answerReflection: (answer) => {
    const m = get().getCurrentMilestone();
    if (!m?.reflectionQuestion) return false;
    const correct = answer === m.reflectionQuestion.correctAnswer;
    set((s) => ({
      progress: s.progress ? { ...s.progress, reflectionCorrect: correct } : null,
      showReflection: !correct,
    }));
    if (correct) get().advancePhase();
    return correct;
  },

  markFailureObserved: () =>
    set((s) => ({
      progress: s.progress ? { ...s.progress, failureObserved: true } : null,
    })),

  markSimulationRun: () =>
    set((s) => ({
      progress: s.progress
        ? { ...s.progress, simulationRuns: s.progress.simulationRuns + 1 }
        : null,
      metricsMode: "live",
    })),

  markAfterSimulationRun: () =>
    set((s) => ({
      progress: s.progress
        ? { ...s.progress, afterSimRuns: s.progress.afterSimRuns + 1 }
        : null,
      metricsMode: "after",
    })),

  completeMilestone: () => {
    const progress = get().progress;
    const course = progress ? getCourseById(progress.courseId) : null;
    if (!progress || !course) return;

    const completed = [...progress.completedMilestoneIds, progress.milestoneId];
    const all = course.chapters.flatMap((c) => c.milestones);
    const currentIdx = all.findIndex((m) => m.id === progress.milestoneId);
    const nextMilestone = all[currentIdx + 1];

    if (nextMilestone) {
      set({
        progress: {
          courseId: progress.courseId,
          milestoneId: nextMilestone.id,
          phase: "product_update",
          completedMilestoneIds: completed,
          reflectionCorrect: null,
          failureObserved: false,
          simulationRuns: 0,
          afterSimRuns: 0,
        },
        showTradeoffs: false,
        showReflection: false,
        displayBeforeMetrics: nextMilestone.beforeMetrics,
        displayAfterMetrics: nextMilestone.afterMetrics ?? null,
        metricsMode: "none",
      });
    } else {
      set({
        progress: { ...progress, phase: "complete", completedMilestoneIds: completed },
        showTradeoffs: false,
      });
    }
  },

  goToMilestone: (milestoneId) => {
    const progress = get().progress;
    if (!progress) return null;
    const course = getCourseById(progress.courseId);
    const milestone = course ? getMilestoneById(course, milestoneId) : null;
    if (!milestone) return null;

    set({
      progress: {
        ...progress,
        milestoneId,
        phase: progress.completedMilestoneIds.includes(milestoneId) ? "complete" : "product_update",
      },
      displayBeforeMetrics: milestone.beforeMetrics,
      displayAfterMetrics: milestone.afterMetrics ?? null,
    });

    return null; // caller applies snapshot via applyMilestoneSnapshot
  },

  getCurrentMilestone: () => {
    const progress = get().progress;
    if (!progress) return null;
    const course = getCourseById(progress.courseId);
    if (!course) return null;
    return getMilestoneById(course, progress.milestoneId);
  },

  setShowTradeoffs: (showTradeoffs) => set({ showTradeoffs }),
  setShowReflection: (showReflection) => set({ showReflection }),
  setMetricsMode: (metricsMode) => set({ metricsMode }),

  resetCourse: () =>
    set({
      progress: null,
      learningMode: "beginner",
      showTradeoffs: false,
      showReflection: false,
      displayBeforeMetrics: null,
      displayAfterMetrics: null,
      metricsMode: "none",
    }),
}));

export function applyMilestoneSnapshot(design: SimDesign, milestone: CourseMilestone): SimDesign {
  return snapshotToDesign(
    { ...design, courseId: design.courseId, courseMilestoneId: milestone.id },
    milestone.architecture,
  );
}

/** Re-apply milestone baseline if saved design is missing expected components (e.g. after course data updates). */
export function ensureMilestoneArchitecture(design: SimDesign): SimDesign {
  if (!design.courseId || !design.courseMilestoneId) return design;
  const course = getCourseById(design.courseId);
  const milestone = course ? getMilestoneById(course, design.courseMilestoneId) : null;
  if (!milestone) return design;

  const expectedTypes = milestone.architecture.nodes
    .filter((n) => !n.hidden)
    .map((n) => n.type);
  const actualTypes = design.nodes.filter((n) => !n.hidden).map((n) => n.type);
  const missingBaseline = expectedTypes.some((t) => !actualTypes.includes(t));
  if (!missingBaseline) return design;

  return applyMilestoneSnapshot(
    { ...design, courseProgress: design.courseProgress },
    milestone,
  );
}

export function createCourseDesign(courseId: string): SimDesign | null {
  const course = getCourseById(courseId);
  const milestone = course?.chapters.flatMap((c) => c.milestones)[0];
  if (!course || !milestone) return null;

  const base: SimDesign = {
    id: crypto.randomUUID(),
    name: course.title,
    description: course.subtitle,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: [],
    edges: [],
    simulation: { tickRateMs: 100, timeScale: 1 },
    projectKind: "guided",
    courseId: course.id,
    courseMilestoneId: milestone.id,
  };

  return snapshotToDesign(base, milestone.architecture);
}
