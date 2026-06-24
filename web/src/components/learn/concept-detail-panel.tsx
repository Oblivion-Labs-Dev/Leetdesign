"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { CONCEPT_CATALOG } from "@/lib/content/learn/roadmap";
import { ConceptLogo } from "./concept-logo";

export function ConceptDetailPanel({
  conceptSlug,
  moduleTitle,
  conceptIndex,
  totalConcepts,
  completedConceptSlugs,
  isLessonOpen = false,
  onOpenLesson,
  onCloseLesson,
}: {
  conceptSlug: string;
  moduleTitle: string;
  conceptIndex: number;
  totalConcepts: number;
  completedConceptSlugs: string[];
  isLessonOpen?: boolean;
  onOpenLesson?: (slug: string) => void;
  onCloseLesson?: () => void;
}) {
  const concept = CONCEPT_CATALOG[conceptSlug];
  if (!concept) return null;

  const isCompleted = completedConceptSlugs.includes(conceptSlug);
  const canOpenLesson = concept.hasLesson && !isLessonOpen;

  return (
    <aside className="roadmap-panel studio-card">
      <div className="roadmap-panel-top">
        <div className="roadmap-panel-meta">
          <span className="roadmap-panel-track">{moduleTitle}</span>
          <span className="roadmap-panel-index">
            Concept {conceptIndex + 1} of {totalConcepts}
          </span>
        </div>
      </div>

      <div className="roadmap-panel-icon-wrap">
        <ConceptLogo slug={conceptSlug} size="md" />
      </div>

      <h2 className="roadmap-panel-title">{concept.title}</h2>
      {isCompleted ? (
        <p className="roadmap-panel-done">
          <Check className="h-4 w-4" /> Completed
        </p>
      ) : null}

      <p className="roadmap-panel-summary">{concept.panelSummary}</p>

      <div className="roadmap-panel-points">
        <h3>Key points</h3>
        <ul>
          {concept.panelKeyPoints.map((point) => (
            <li key={point}>
              <Check className="h-4 w-4 shrink-0 text-[var(--studio-green)]" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {canOpenLesson ? (
        <button
          type="button"
          onClick={() => onOpenLesson?.(conceptSlug)}
          className="roadmap-panel-cta"
        >
          {isCompleted ? "Review lesson" : "Continue Learning"}
          <ArrowRight className="h-4 w-4" />
        </button>
      ) : isLessonOpen ? (
        <button
          type="button"
          onClick={onCloseLesson}
          className="roadmap-panel-back"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to overview
        </button>
      ) : (
        <p className="roadmap-panel-soon">Lesson coming soon</p>
      )}
    </aside>
  );
}
