import type { FoundationsRoadmap, LearnPathStep } from "@/types/learn";

export const ROADMAP_META = {
  title: "Software Engineering Foundations",
  subtitle:
    "Master the core concepts of software engineering through a structured learning path. From programming basics to system design.",
  quote: {
    text: "Programs must be written for people to read, and only incidentally for machines to execute.",
    author: "Harold Abelson",
  },
};

export type ConceptCatalogEntry = {
  slug: string;
  trackSlug: string;
  stepId: string;
  title: string;
  panelSummary: string;
  panelKeyPoints: string[];
  hasLesson: boolean;
};

/** Static step definitions — status and progress are computed from user data. */
export const ROADMAP_STEP_DEFS: Pick<
  LearnPathStep,
  "id" | "title" | "trackSlug" | "conceptSlugs" | "description" | "estMinutes"
>[] = [
  {
    id: "oop",
    title: "OOP Foundations",
    trackSlug: "oop",
    conceptSlugs: ["encapsulation", "abstraction", "inheritance", "polymorphism"],
    description:
      "Encapsulation, abstraction, inheritance, and polymorphism — the OOP tools interviewers expect you to apply naturally.",
    estMinutes: 15,
  },
  {
    id: "solid",
    title: "SOLID Principles",
    trackSlug: "solid",
    conceptSlugs: [
      "single-responsibility",
      "open-closed",
      "liskov-substitution",
      "interface-segregation",
      "dependency-inversion",
    ],
    description:
      "SRP, OCP, LSP, ISP, and DIP — principles for designing classes and relationships in LLD interviews.",
    estMinutes: 20,
  },
  {
    id: "lld",
    title: "Low-Level Design",
    conceptSlugs: [],
    description: "Design classes, APIs, and components that hold up in production.",
    estMinutes: 25,
  },
  {
    id: "system-design",
    title: "System Design",
    conceptSlugs: [],
    description: "Architect distributed systems that scale with real-world constraints.",
    estMinutes: 30,
  },
];

/** Reserved for future gated modules — all steps are open for now. */
export const ALWAYS_UNLOCKED_STEP_IDS = new Set(
  ROADMAP_STEP_DEFS.map((step) => step.id),
);

export const CONCEPT_CATALOG: Record<string, ConceptCatalogEntry> = {
  encapsulation: {
    slug: "encapsulation",
    trackSlug: "oop",
    stepId: "oop",
    title: "Encapsulation",
    panelSummary:
      "Encapsulation keeps data private and routes changes through methods — a basic hygiene check in LLD interviews.",
    panelKeyPoints: [
      "Protects data from unintended external changes",
      "Hides implementation behind public methods",
      "Return copies when exposing collections",
    ],
    hasLesson: true,
  },
  abstraction: {
    slug: "abstraction",
    trackSlug: "oop",
    stepId: "oop",
    title: "Abstraction",
    panelSummary:
      "Abstraction focuses on what an object does rather than how it does it — exposing only essential behavior and hiding complexity.",
    panelKeyPoints: [
      "Simplifies interaction with complex systems",
      "Reduces cognitive load for callers",
      "Enables swapping implementations behind a stable interface",
    ],
    hasLesson: true,
  },
  inheritance: {
    slug: "inheritance",
    trackSlug: "oop",
    stepId: "oop",
    title: "Inheritance",
    panelSummary:
      "Inheritance shares stable implementation across related types — default to composition when behavior varies.",
    panelKeyPoints: [
      "Use when is-a holds and shared code is stable",
      "Watch the fragile base class problem",
      "Composition + interfaces fit most LLD problems",
    ],
    hasLesson: true,
  },
  polymorphism: {
    slug: "polymorphism",
    trackSlug: "oop",
    stepId: "oop",
    title: "Polymorphism",
    panelSummary:
      "Polymorphism allows objects of different types to be treated through the same interface — the right behavior is chosen at runtime.",
    panelKeyPoints: [
      "Write code against interfaces, not concrete classes",
      "Extend behavior without modifying existing callers",
      "Core to plugin architectures and strategy patterns",
    ],
    hasLesson: true,
  },
  "single-responsibility": {
    slug: "single-responsibility",
    trackSlug: "solid",
    stepId: "solid",
    title: "Single Responsibility",
    panelSummary:
      "A class should have only one reason to change — one job, one axis of responsibility.",
    panelKeyPoints: [
      "Split classes that mix unrelated concerns",
      "Smaller units are easier to test",
      "Clear ownership reduces merge conflicts",
    ],
    hasLesson: true,
  },
  "open-closed": {
    slug: "open-closed",
    trackSlug: "solid",
    stepId: "solid",
    title: "Open/Closed",
    panelSummary:
      "Software entities should be open for extension but closed for modification.",
    panelKeyPoints: [
      "Add behavior with new types, not edits",
      "Protect stable code paths from churn",
      "Pairs naturally with polymorphism",
    ],
    hasLesson: true,
  },
  "liskov-substitution": {
    slug: "liskov-substitution",
    trackSlug: "solid",
    stepId: "solid",
    title: "Liskov Substitution",
    panelSummary:
      "Subtypes must be substitutable for their base types without breaking correctness.",
    panelKeyPoints: [
      "Subclasses cannot weaken preconditions",
      "Callers should not need instanceof checks",
      "Broken substitutability hints at a modeling mistake",
    ],
    hasLesson: true,
  },
  "interface-segregation": {
    slug: "interface-segregation",
    trackSlug: "solid",
    stepId: "solid",
    title: "Interface Segregation",
    panelSummary:
      "Clients should not be forced to depend on methods they do not use.",
    panelKeyPoints: [
      "Split bloated interfaces by role",
      "Avoid forcing no-op implementations",
      "Role interfaces clarify dependencies",
    ],
    hasLesson: true,
  },
  "dependency-inversion": {
    slug: "dependency-inversion",
    trackSlug: "solid",
    stepId: "solid",
    title: "Dependency Inversion",
    panelSummary:
      "High-level modules should not depend on low-level modules. Both should depend on abstractions.",
    panelKeyPoints: [
      "Inject interfaces at construction time",
      "Infrastructure becomes swappable",
      "Enables testing with fakes and mocks",
    ],
    hasLesson: true,
  },
};

export function getAllConceptSlugs(): string[] {
  return Object.keys(CONCEPT_CATALOG);
}

export function getStepForConcept(conceptSlug: string) {
  const concept = CONCEPT_CATALOG[conceptSlug];
  if (!concept) return undefined;
  return ROADMAP_STEP_DEFS.find((s) => s.id === concept.stepId);
}

/** @deprecated Use getLearnRoadmapProgress() for live data */
export const FOUNDATIONS_ROADMAP: FoundationsRoadmap = {
  ...ROADMAP_META,
  stats: {
    conceptCount: 0,
    timeLeft: "0m",
    progressPct: 0,
  },
  steps: [],
};
