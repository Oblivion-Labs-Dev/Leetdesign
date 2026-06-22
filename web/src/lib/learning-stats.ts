import { ALL_COMPONENTS } from "@/lib/content/components";
import { PROJECTS } from "@/lib/content/projects";
import {
  getComponentsSeen,
  getProjectProgressList,
  getVisitDays,
  trackVisit,
} from "@/lib/local-store";

export interface ComponentSeenStat {
  componentId: string;
  label: string;
  fromProjectId: string;
  seenAt: string;
}

export interface ProjectProgressStat {
  projectId: string;
  title: string;
  stageIndex: number;
  status: "in_progress" | "completed";
  updatedAt: string;
}

export interface VisitDayStat {
  day: string;
  count: number;
}

export interface LearningStats {
  componentsSeen: ComponentSeenStat[];
  componentsTotal: number;
  activeProjects: ProjectProgressStat[];
  completedProjects: ProjectProgressStat[];
  visits: VisitDayStat[];
  currentStreak: number;
  longestStreak: number;
}

function calcStreaks(visits: VisitDayStat[]): {
  current: number;
  longest: number;
} {
  if (visits.length === 0) return { current: 0, longest: 0 };
  const days = new Set(visits.map((v) => v.day));
  let longest = 0;
  let runStart: Date | null = null;
  let prev: Date | null = null;
  for (const v of visits) {
    const d = new Date(v.day + "T00:00:00Z");
    if (prev) {
      const diff = (d.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000);
      if (diff !== 1) runStart = d;
    } else {
      runStart = d;
    }
    if (runStart) {
      const len =
        (d.getTime() - runStart.getTime()) / (24 * 60 * 60 * 1000) + 1;
      if (len > longest) longest = len;
    }
    prev = d;
  }
  let current = 0;
  const today = new Date();
  for (let i = 0; i < 1000; i++) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (days.has(key)) current += 1;
    else break;
  }
  return { current, longest };
}

export async function getCurrentUserLearningStats(): Promise<LearningStats> {
  await trackVisit();

  const [seen, progress, visitsRaw] = await Promise.all([
    getComponentsSeen(),
    getProjectProgressList(),
    getVisitDays(120),
  ]);

  const componentsSeen: ComponentSeenStat[] = seen.map((row) => ({
    componentId: row.componentId,
    label:
      ALL_COMPONENTS.find((c) => c.id === row.componentId)?.label ??
      row.componentId,
    fromProjectId: row.projectId,
    seenAt: row.seenAt,
  }));

  const projectMap = new Map(PROJECTS.map((p) => [p.id, p]));
  const mapped: ProjectProgressStat[] = progress.map((row) => ({
    projectId: row.projectId,
    title: projectMap.get(row.projectId)?.shortTitle ?? row.projectId,
    stageIndex: row.stageIndex,
    status: row.status,
    updatedAt: row.updatedAt,
  }));

  const visits: VisitDayStat[] = visitsRaw.map((v) => ({
    day: v.day,
    count: v.count,
  }));
  const streaks = calcStreaks(visits);

  return {
    componentsSeen,
    componentsTotal: ALL_COMPONENTS.length,
    activeProjects: mapped.filter((p) => p.status === "in_progress"),
    completedProjects: mapped.filter((p) => p.status === "completed"),
    visits,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
  };
}
