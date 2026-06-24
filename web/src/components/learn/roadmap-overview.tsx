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

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`roadmap-concept-row ${active ? "roadmap-concept-row--active" : ""} ${completed ? "roadmap-concept-row--done" : ""}`}
    >
      <span className="roadmap-concept-row-icon">
        {completed ? (
          <Check className="h-4 w-4" />
        ) : (
          <ConceptLogo slug={slug} size="sm" />
        )}
      </span>
      <span className="roadmap-concept-row-body">
        <span className="roadmap-concept-row-title">{concept.title}</span>
        <span className="roadmap-concept-row-summary">{concept.panelSummary}</span>
      </span>
      <ChevronRight className="roadmap-concept-row-chevron h-4 w-4 shrink-0" aria-hidden />
    </button>
  );
}

function ModuleCard({
  step,
  index,
  selectedConcept,
  completedConceptSlugs,
  onSelectConcept,
}: {
  step: LearnPathStep;
  index: number;
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
        <div className="roadmap-module-card-title-row">
          <span className="roadmap-module-index">{index + 1}</span>
          <h2 className="roadmap-module-card-title">{step.title}</h2>
        </div>
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
    <div className="roadmap-overview">
      {unlockedSteps.map((step, i) => (
        <ModuleCard
          key={step.id}
          step={step}
          index={i}
          selectedConcept={selectedConcept}
          completedConceptSlugs={completedConceptSlugs}
          onSelectConcept={onSelectConcept}
        />
      ))}

      {lockedSteps.length > 0 ? (
        <section className="roadmap-upcoming-card">
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
