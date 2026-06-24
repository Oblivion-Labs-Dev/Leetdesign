"use client";

import { Check, ChevronRight, Clock, Lock } from "lucide-react";
import { CONCEPT_CATALOG } from "@/lib/content/learn/roadmap";
import type { LearnPathStep } from "@/types/learn";
import { ConceptLogo } from "./concept-logo";

function ConceptRow({
  slug,
  active,
  completed,
  onSelect,
}: {
  slug: string;
  active: boolean;
  completed: boolean;
  onSelect: () => void;
}) {
  const concept = CONCEPT_CATALOG[slug];
  if (!concept) return null;

  const inProgress = active && !completed;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`roadmap-concept-row ${active ? "roadmap-concept-row--active" : ""} ${completed ? "roadmap-concept-row--done" : ""} ${inProgress ? "roadmap-concept-row--in-progress" : ""}`}
    >
      <span
        className={`roadmap-concept-row-icon ${completed ? "roadmap-concept-row-icon--done" : ""}`}
      >
        {completed ? (
          <Check className="roadmap-concept-row-check" strokeWidth={3} aria-hidden />
        ) : (
          <ConceptLogo slug={slug} size="sm" />
        )}
      </span>
      <span className="roadmap-concept-row-body">
        <span className="roadmap-concept-row-title-row">
          <span className="roadmap-concept-row-title">{concept.title}</span>
          {completed ? (
            <span className="roadmap-concept-status roadmap-concept-status--done">
              Completed
            </span>
          ) : inProgress ? (
            <span className="roadmap-concept-status roadmap-concept-status--progress">
              In progress
            </span>
          ) : null}
        </span>
        <span className="roadmap-concept-row-summary">{concept.panelSummary}</span>
      </span>
      <ChevronRight className="roadmap-concept-row-chevron h-4 w-4 shrink-0" aria-hidden />
    </button>
  );
}

function ModuleCard({
  step,
  selectedConcept,
  completedConceptSlugs,
  onSelectConcept,
}: {
  step: LearnPathStep;
  selectedConcept: string;
  completedConceptSlugs: string[];
  onSelectConcept: (slug: string) => void;
}) {
  const completed = new Set(completedConceptSlugs);
  const conceptSlugs = step.conceptSlugs ?? [];

  return (
    <section
      id={`module-${step.id}`}
      data-module-section={step.id}
      className="roadmap-module-card"
    >
      <header className="roadmap-module-card-head">
        <h2 className="roadmap-module-card-title">{step.title}</h2>
        <div className="roadmap-module-card-meta">
          {step.progressPct != null ? (
            <span className="roadmap-module-card-stat">
              <span className="roadmap-module-card-stat-track">
                <span
                  className="roadmap-module-card-stat-fill"
                  style={{ width: `${step.progressPct}%` }}
                />
              </span>
              {step.progressPct}%
            </span>
          ) : null}
          {step.estMinutes ? (
            <span className="roadmap-module-card-stat">
              <Clock className="h-3 w-3" aria-hidden />
              ~{step.estMinutes} min
            </span>
          ) : null}
        </div>
      </header>

      {step.description ? (
        <p className="roadmap-module-card-desc">{step.description}</p>
      ) : null}

      {conceptSlugs.length > 0 ? (
        <div className="roadmap-concept-list">
          {conceptSlugs.map((slug) => (
            <ConceptRow
              key={slug}
              slug={slug}
              active={selectedConcept === slug}
              completed={completed.has(slug)}
              onSelect={() => onSelectConcept(slug)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function LockedModuleRow({ step }: { step: LearnPathStep }) {
  return (
    <div className="roadmap-locked-row">
      <div className="roadmap-locked-row-icon" aria-hidden>
        <Lock className="h-4 w-4" />
      </div>
      <div className="roadmap-locked-row-body">
        <h3 className="roadmap-locked-row-title">{step.title}</h3>
        {step.description ? (
          <p className="roadmap-locked-row-desc">{step.description}</p>
        ) : null}
      </div>
      {step.unlockAfterTitle ? (
        <p className="roadmap-locked-row-hint">
          <Lock className="h-3 w-3 shrink-0" aria-hidden />
          Unlock after {step.unlockAfterTitle}
        </p>
      ) : null}
    </div>
  );
}

export function RoadmapOverview({
  steps,
  selectedConcept,
  completedConceptSlugs,
  onSelectConcept,
}: {
  steps: LearnPathStep[];
  selectedConcept: string;
  completedConceptSlugs: string[];
  onSelectConcept: (slug: string) => void;
}) {
  const unlockedSteps = steps.filter((s) => s.status !== "locked");
  const lockedSteps = steps.filter((s) => s.status === "locked");

  return (
    <div className="roadmap-overview roadmap-overview--spine">
      {unlockedSteps.map((step, i) => (
        <div
          key={step.id}
          className={`roadmap-module-section ${i === unlockedSteps.length - 1 ? "roadmap-module-section--last" : ""}`}
        >
          <span className="roadmap-module-node" aria-hidden>
            {i + 1}
          </span>
          <ModuleCard
            step={step}
            selectedConcept={selectedConcept}
            completedConceptSlugs={completedConceptSlugs}
            onSelectConcept={onSelectConcept}
          />
        </div>
      ))}

      {lockedSteps.length > 0 ? (
        <section className="roadmap-upcoming-card roadmap-module-section roadmap-module-section--upcoming">
          <h3 className="roadmap-upcoming-label">Upcoming</h3>
          <div className="roadmap-upcoming-list">
            {lockedSteps.map((step) => (
              <LockedModuleRow key={step.id} step={step} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
