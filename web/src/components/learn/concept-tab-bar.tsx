"use client";

import { Check } from "lucide-react";
import { CONCEPT_CATALOG } from "@/lib/content/learn/roadmap";
import { ConceptLogo } from "./concept-logo";

export function ConceptTabBar({
  conceptSlugs,
  selectedConcept,
  completedConceptSlugs,
  onSelect,
}: {
  conceptSlugs: string[];
  selectedConcept: string;
  completedConceptSlugs: string[];
  onSelect: (slug: string) => void;
}) {
  const completed = new Set(completedConceptSlugs);

  if (conceptSlugs.length === 0) return null;

  return (
    <div className="concept-tab-bar" role="tablist" aria-label="Concepts in this module">
      {conceptSlugs.map((slug) => {
        const concept = CONCEPT_CATALOG[slug];
        if (!concept) return null;
        const active = selectedConcept === slug;
        const done = completed.has(slug);

        return (
          <button
            key={slug}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(slug)}
            className={`concept-tab ${active ? "concept-tab--active" : ""} ${done ? "concept-tab--done" : ""}`}
          >
            <span className="concept-tab-icon">
              {done ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <ConceptLogo slug={slug} size="sm" />
              )}
            </span>
            <span className="concept-tab-label">{concept.title}</span>
          </button>
        );
      })}
    </div>
  );
}
