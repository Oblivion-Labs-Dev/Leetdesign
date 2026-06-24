import type { LearnPathStep, LearnRoadmapProgress } from "@/types/learn";
import { getConceptsCompleted } from "@/lib/local-store";
import {
  CONCEPT_CATALOG,
  getAllConceptSlugs,
  ROADMAP_META,
  ROADMAP_STEP_DEFS,
} from "./roadmap";
import { getLesson } from "./registry";

function formatMinutes(total: number): string {
  if (total <= 0) return "0m";
  if (total < 60) return `${total}m`;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function moduleProgress(
  conceptSlugs: string[],
  completed: Set<string>,
): number {
  if (conceptSlugs.length === 0) return 0;
  const done = conceptSlugs.filter((s) => completed.has(s)).length;
  return Math.round((done / conceptSlugs.length) * 100);
}

function moduleStatus(
  conceptSlugs: string[],
  completed: Set<string>,
): LearnPathStep["status"] {
  if (conceptSlugs.length === 0) return "in_progress";
  const done = conceptSlugs.every((s) => completed.has(s));
  if (done) return "completed";
  return "in_progress";
}

export async function getLearnRoadmapProgress(): Promise<LearnRoadmapProgress> {
  const rows = await getConceptsCompleted();
  const completed = new Set(rows.map((r) => r.conceptSlug));
  const allSlugs = getAllConceptSlugs();

  let minutesLeft = 0;
  for (const slug of allSlugs) {
    if (completed.has(slug)) continue;
    const concept = CONCEPT_CATALOG[slug];
    if (!concept.hasLesson) continue;
    const lesson = getLesson(concept.trackSlug, slug);
    if (lesson) minutesLeft += lesson.readMinutes;
  }

  const completedCount = allSlugs.filter((s) => completed.has(s)).length;
  const progressPct =
    allSlugs.length > 0
      ? Math.round((completedCount / allSlugs.length) * 100)
      : 0;

  const steps: LearnPathStep[] = [];

  for (const def of ROADMAP_STEP_DEFS) {
    const conceptSlugs = def.conceptSlugs ?? [];
    const status = moduleStatus(conceptSlugs, completed);
    const stepProgressPct =
      status === "in_progress" && conceptSlugs.length > 0
        ? moduleProgress(conceptSlugs, completed)
        : status === "completed"
          ? 100
          : undefined;

    steps.push({
      id: def.id,
      title: def.title,
      description: def.description,
      estMinutes: def.estMinutes,
      status,
      progressPct: stepProgressPct,
      trackSlug: def.trackSlug,
      conceptSlugs: def.conceptSlugs,
    });
  }

  return {
    ...ROADMAP_META,
    completedConceptSlugs: [...completed],
    stats: {
      conceptCount: allSlugs.length,
      completedCount,
      timeLeft: formatMinutes(minutesLeft),
      progressPct,
    },
    steps,
    conceptSlugs: allSlugs,
  };
}
