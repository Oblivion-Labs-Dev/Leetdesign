import type { SimDesign, DesignSummary } from "./types";
import { getCourseById, getPlayableMilestones } from "./courses";
import { createCourseDesign, applyMilestoneSnapshot } from "./course-store";

const STORAGE_KEY = "leetdesign:designs";

function readAll(): Record<string, SimDesign> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, SimDesign>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function saveDesign(design: SimDesign): void {
  const all = readAll();
  all[design.id] = { ...design, updatedAt: new Date().toISOString() };
  writeAll(all);
}

export function loadDesign(id: string): SimDesign | null {
  return readAll()[id] ?? null;
}

export function deleteDesign(id: string): void {
  const all = readAll();
  delete all[id];
  writeAll(all);
}

export function listDesigns(): DesignSummary[] {
  const all = readAll();
  return Object.values(all)
    .map((d) => {
      const course = d.courseId ? getCourseById(d.courseId) : null;
      const playable = course ? getPlayableMilestones(course) : [];
      const completedCount = d.courseProgress?.completedMilestoneIds.length ?? 0;

      return {
        id: d.id,
        name: d.name,
        description: d.description,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        nodeCount: d.nodes.length,
        edgeCount: d.edges.length,
        scenarioId: d.scenarioId,
        challengeId: d.challengeId,
        projectKind: d.projectKind,
        courseId: d.courseId,
        courseMilestoneId: d.courseMilestoneId,
        completedMilestoneCount: course ? completedCount : undefined,
        totalMilestoneCount: course ? playable.length : undefined,
      };
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function findDesignByCourseId(courseId: string): SimDesign | null {
  const all = readAll();
  return Object.values(all).find((d) => d.courseId === courseId) ?? null;
}

/** Reset a guided course to chapter 1, keeping the same design id */
export function resetGuidedCourse(courseId: string): SimDesign | null {
  const existing = findDesignByCourseId(courseId);
  if (!existing) return null;

  const course = getCourseById(courseId);
  const firstMilestone = course?.chapters.flatMap((c) => c.milestones)[0];
  if (!course || !firstMilestone) return null;

  const fresh = createCourseDesign(courseId);
  if (!fresh) return null;

  const reset: SimDesign = applyMilestoneSnapshot(
    {
      ...fresh,
      id: existing.id,
      createdAt: existing.createdAt,
      courseProgress: undefined,
    },
    firstMilestone,
  );

  saveDesign(reset);
  return reset;
}

export function duplicateDesign(id: string, newName: string): SimDesign | null {
  const src = loadDesign(id);
  if (!src) return null;
  const copy: SimDesign = {
    ...src,
    id: crypto.randomUUID(),
    name: newName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveDesign(copy);
  return copy;
}
