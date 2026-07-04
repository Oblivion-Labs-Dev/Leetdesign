"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { LearnLesson, LearnRoadmapProgress } from "@/types/learn";
import { CONCEPT_CATALOG } from "@/lib/content/learn/roadmap";
import { getLesson } from "@/lib/content/learn/registry";
import { RoadmapAsideSummary } from "./roadmap-aside-summary";
import { RoadmapOverview } from "./roadmap-overview";
import {
  RoadmapScrollCanvas,
  scrollToModuleSection,
} from "./roadmap-scroll-canvas";
import { ConceptDetailPanel } from "./concept-detail-panel";
import { LessonTemplate } from "./lesson-template";

function inlineLessonHref(slug: string) {
  return `/brushup?concept=${slug}&read=1`;
}

function resolveConceptSlug(
  candidate: string | null,
  validSlugs: string[],
  fallback: string,
): string {
  if (candidate && validSlugs.includes(candidate)) return candidate;
  return fallback;
}

export function BrushupExperience({
  progress,
  activeLesson,
  lessonCompleted = false,
  heroImageSrc,
  lessonHeroImages = {},
}: {
  progress: LearnRoadmapProgress;
  activeLesson?: LearnLesson;
  lessonCompleted?: boolean;
  heroImageSrc?: string;
  lessonHeroImages?: Record<string, string>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const validSlugs = progress.conceptSlugs;
  const defaultConcept =
    activeLesson?.slug ?? validSlugs[0] ?? "encapsulation";
  const inLesson = Boolean(activeLesson);

  const conceptFromUrl = searchParams.get("concept");
  const readFromUrl = searchParams.get("read") === "1";
  const resolvedFromUrl = resolveConceptSlug(
    conceptFromUrl,
    validSlugs,
    defaultConcept,
  );
  const initial = inLesson ? activeLesson!.slug : resolvedFromUrl;
  const [selectedConcept, setSelectedConcept] = useState(initial);
  const [expandedStepId, setExpandedStepId] = useState<string | null>(() => {
    const concept = CONCEPT_CATALOG[initial];
    return concept?.stepId ?? progress.steps[0]?.id ?? null;
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const pendingScrollStepId = useRef<string | null>(null);

  const activeLessonContent = useMemo(() => {
    if (activeLesson) return activeLesson;
    if (!readFromUrl) return undefined;
    const concept = CONCEPT_CATALOG[selectedConcept];
    if (!concept?.hasLesson) return undefined;
    return getLesson(concept.trackSlug, concept.slug);
  }, [activeLesson, readFromUrl, selectedConcept]);

  const isReading = Boolean(activeLessonContent);

  useEffect(() => {
    const next = inLesson
      ? activeLesson!.slug
      : resolveConceptSlug(conceptFromUrl, validSlugs, defaultConcept);
    if (next !== selectedConcept) {
      setSelectedConcept(next);
    }
    const concept = CONCEPT_CATALOG[next];
    if (concept) setExpandedStepId(concept.stepId);
  }, [
    activeLesson,
    conceptFromUrl,
    defaultConcept,
    inLesson,
    selectedConcept,
    validSlugs,
  ]);

  useEffect(() => {
    if (!isReading) return;
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [activeLessonContent?.slug, isReading]);

  useEffect(() => {
    if (isReading || !pendingScrollStepId.current) return;
    const stepId = pendingScrollStepId.current;
    pendingScrollStepId.current = null;
    requestAnimationFrame(() => scrollToModuleSection(stepId, scrollRef.current));
  }, [isReading]);

  const selectConcept = useCallback(
    (slug: string) => {
      if (!validSlugs.includes(slug)) return;
      setSelectedConcept(slug);
      const concept = CONCEPT_CATALOG[slug];
      if (concept) setExpandedStepId(concept.stepId);
      router.replace(`/brushup?concept=${slug}`, { scroll: false });
    },
    [router, validSlugs],
  );

  const openLesson = useCallback(
    (slug: string) => {
      if (!validSlugs.includes(slug)) return;
      const concept = CONCEPT_CATALOG[slug];
      if (!concept?.hasLesson) {
        selectConcept(slug);
        return;
      }
      setSelectedConcept(slug);
      setExpandedStepId(concept.stepId);
      router.push(inlineLessonHref(slug), { scroll: false });
    },
    [router, selectConcept, validSlugs],
  );

  const closeLesson = useCallback(() => {
    router.replace(`/brushup?concept=${selectedConcept}`, { scroll: false });
  }, [router, selectedConcept]);

  const selectModule = useCallback(
    (stepId: string) => {
      const step = progress.steps.find((s) => s.id === stepId);
      if (!step || step.status === "locked") return;
      setExpandedStepId(stepId);
      if (isReading) {
        pendingScrollStepId.current = stepId;
        closeLesson();
        return;
      }
      scrollToModuleSection(stepId, scrollRef.current);
    },
    [closeLesson, isReading, progress.steps],
  );

  const activeStep = useMemo(() => {
    const concept = CONCEPT_CATALOG[selectedConcept];
    if (!concept) return progress.steps[0];
    return (
      progress.steps.find((s) => s.id === concept.stepId) ?? progress.steps[0]
    );
  }, [progress.steps, selectedConcept]);

  const stepConceptSlugs = activeStep?.conceptSlugs ?? [];
  const conceptIndex = Math.max(0, stepConceptSlugs.indexOf(selectedConcept));

  const lessonCompletedNow =
    lessonCompleted ||
    progress.completedConceptSlugs.includes(selectedConcept);

  return (
    <div className="roadmap-page">
      <div className={`roadmap-body ${isReading ? "roadmap-body--reading" : ""}`}>
        <div className={`roadmap-main ${isReading ? "roadmap-main--reading" : ""}`}>
          <RoadmapScrollCanvas
            scrollRef={scrollRef}
            moduleSpy={!isReading}
            onVisibleStepChange={setExpandedStepId}
          >
            {isReading && activeLessonContent ? (
              <div className="roadmap-content-pane" key={activeLessonContent.slug}>
                <LessonTemplate
                  lesson={activeLessonContent}
                  heroImageSrc={lessonHeroImages[activeLessonContent.slug]}
                  alreadyCompleted={lessonCompletedNow}
                  embedded
                  inlineNav
                  onBackToOverview={closeLesson}
                />
              </div>
            ) : (
              <RoadmapOverview
                steps={progress.steps}
                selectedConcept={selectedConcept}
                completedConceptSlugs={progress.completedConceptSlugs}
                onSelectConcept={selectConcept}
              />
            )}
          </RoadmapScrollCanvas>
        </div>

        <aside className="roadmap-aside">
          <RoadmapAsideSummary
            stats={progress.stats}
            steps={progress.steps}
            progressPct={progress.stats.progressPct}
            activeStepId={expandedStepId ?? activeStep?.id}
            heroImageSrc={heroImageSrc}
            onStepSelect={selectModule}
          />
          <ConceptDetailPanel
            conceptSlug={selectedConcept}
            moduleTitle={activeStep?.title ?? "Learning path"}
            conceptIndex={conceptIndex}
            totalConcepts={stepConceptSlugs.length}
            completedConceptSlugs={progress.completedConceptSlugs}
            isLessonOpen={isReading}
            onOpenLesson={openLesson}
            onCloseLesson={closeLesson}
          />
        </aside>
      </div>
    </div>
  );
}
