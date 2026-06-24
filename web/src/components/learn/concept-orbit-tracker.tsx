"use client";

import type { LearnRoadmapProgress } from "@/types/learn";
import { CONCEPT_CATALOG } from "@/lib/content/learn/roadmap";

export function ConceptOrbitTracker({
  progress,
  activeSlug,
  onSelect,
}: {
  progress: LearnRoadmapProgress;
  activeSlug: string;
  onSelect: (slug: string) => void;
}) {
  const { conceptSlugs, completedConceptSlugs, stats } = progress;
  const completed = new Set(completedConceptSlugs);
  const size = 200;
  const center = size / 2;
  const radius = 72;

  return (
    <div className="concept-orbit" style={{ width: size, height: size }}>
      <svg
        className="concept-orbit-ring"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--studio-border)"
          strokeWidth="2"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--studio-purple)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${(stats.progressPct / 100) * (2 * Math.PI * radius)} ${2 * Math.PI * radius}`}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>

      <div className="concept-orbit-core">
        <div className="concept-orbit-pct">{stats.progressPct}%</div>
        <div className="concept-orbit-label">Path</div>
      </div>

      {conceptSlugs.map((slug, i) => {
        const angle = (i / conceptSlugs.length) * 2 * Math.PI - Math.PI / 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        const concept = CONCEPT_CATALOG[slug];
        const isActive = slug === activeSlug;
        const isDone = completed.has(slug);

        return (
          <button
            key={slug}
            type="button"
            title={concept?.title}
            onClick={() => onSelect(slug)}
            className={`concept-orbit-node ${isActive ? "concept-orbit-node--active" : ""} ${isDone ? "concept-orbit-node--done" : ""}`}
            style={{
              left: x,
              top: y,
            }}
          >
            <span className="concept-orbit-node-dot" />
            <span className="concept-orbit-node-label">{concept?.title}</span>
          </button>
        );
      })}
    </div>
  );
}
