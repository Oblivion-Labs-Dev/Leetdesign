import type { SimDesign, DesignSummary } from "../simulator/types";

/**
 * Persistence adapter that switches between localStorage (offline/dev)
 * and the server API (production with Postgres).
 *
 * Strategy: use localStorage as primary for now (instant, no setup needed).
 * The API layer is available for when DATABASE_URL is configured.
 * A future migration step will sync localStorage → API on first login.
 */

const USE_API = typeof window !== "undefined" && process.env.NEXT_PUBLIC_USE_DB === "true";

// ── localStorage implementation (current default) ──────────────────

const STORAGE_KEY = "leetdesign:designs";

function readAllLocal(): Record<string, SimDesign> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAllLocal(data: Record<string, SimDesign>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ── API implementation ─────────────────────────────────────────────

async function apiSaveDesign(design: SimDesign): Promise<void> {
  const { id, name, description, courseId, courseMilestoneId, projectKind, ...rest } = design;
  await fetch(`/api/designs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      description,
      data: { nodes: rest.nodes, edges: rest.edges, simulation: rest.simulation },
      courseId,
      milestoneId: courseMilestoneId,
      projectKind,
    }),
  }).catch(() => {
    // Fallback to localStorage on network failure
    const all = readAllLocal();
    all[design.id] = { ...design, updatedAt: new Date().toISOString() };
    writeAllLocal(all);
  });
}

async function apiLoadDesign(id: string): Promise<SimDesign | null> {
  try {
    const res = await fetch(`/api/designs/${id}`);
    if (!res.ok) return null;
    const row = await res.json();
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      ...(row.data as object),
      courseId: row.courseId,
      courseMilestoneId: row.milestoneId,
      projectKind: row.projectKind,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    } as SimDesign;
  } catch {
    return null;
  }
}

async function apiListDesigns(): Promise<DesignSummary[]> {
  try {
    const res = await fetch("/api/designs");
    if (!res.ok) return [];
    const rows = await res.json();
    return rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      nodeCount: 0,
      edgeCount: 0,
      courseId: r.courseId,
      milestoneId: r.milestoneId,
      projectKind: r.projectKind,
    }));
  } catch {
    return [];
  }
}

// ── Public persistence interface ───────────────────────────────────

export function saveDesign(design: SimDesign): void {
  if (USE_API) {
    apiSaveDesign(design);
    return;
  }
  const all = readAllLocal();
  all[design.id] = { ...design, updatedAt: new Date().toISOString() };
  writeAllLocal(all);
}

export function loadDesign(id: string): SimDesign | null {
  if (USE_API) {
    // For sync usage, fall back to localStorage; async version used in page loads
    const all = readAllLocal();
    return all[id] ?? null;
  }
  const all = readAllLocal();
  return all[id] ?? null;
}

export async function loadDesignAsync(id: string): Promise<SimDesign | null> {
  if (USE_API) {
    return apiLoadDesign(id);
  }
  return loadDesign(id);
}

export function deleteDesign(id: string): void {
  if (USE_API) {
    fetch(`/api/designs/${id}`, { method: "DELETE" }).catch(() => {});
  }
  const all = readAllLocal();
  delete all[id];
  writeAllLocal(all);
}

export function listDesigns(): DesignSummary[] {
  const all = readAllLocal();
  return Object.values(all)
    .map((d) => ({
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
    }))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function listDesignsAsync(): Promise<DesignSummary[]> {
  if (USE_API) {
    return apiListDesigns();
  }
  return listDesigns();
}

export function findDesignByCourseId(courseId: string): SimDesign | null {
  const all = readAllLocal();
  return Object.values(all).find((d) => d.courseId === courseId) ?? null;
}

export function resetGuidedCourse(courseId: string): SimDesign | null {
  const all = readAllLocal();
  const existing = Object.values(all).find((d) => d.courseId === courseId);
  if (!existing) return null;
  delete all[existing.id];
  writeAllLocal(all);
  if (USE_API) {
    fetch(`/api/designs/${existing.id}`, { method: "DELETE" }).catch(() => {});
  }
  return existing;
}

export function duplicateDesign(id: string, newName: string): SimDesign | null {
  const all = readAllLocal();
  const src = all[id];
  if (!src) return null;
  const dup: SimDesign = {
    ...src,
    id: crypto.randomUUID(),
    name: newName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    courseId: undefined,
    courseMilestoneId: undefined,
    courseProgress: undefined,
  };
  all[dup.id] = dup;
  writeAllLocal(all);
  return dup;
}
