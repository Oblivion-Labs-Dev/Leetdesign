import type { LearnLesson } from "@/types/learn";

export const polymorphismLesson: LearnLesson = {
  slug: "polymorphism",
  trackSlug: "oop",
  title: "Polymorphism",
  subtitle: "One interface. Many implementations.",
  readMinutes: 5,
  difficulty: "beginner",
  objectives: [
    "Explain runtime vs compile-time polymorphism",
    "Write code against interfaces instead of concrete types",
    "Recognize polymorphism in strategy and plugin designs",
  ],
  blocks: [
    {
      type: "paragraph",
      text: "Polymorphism means many forms: different objects can respond to the same message with type-specific behavior. Callers hold a reference to an interface or base type; the runtime picks the right implementation.",
    },
    {
      type: "callout",
      variant: "definition",
      title: "Summary",
      text: "Polymorphism = same call site, different behavior.",
    },
    { type: "heading", level: 2, text: "In production systems" },
    {
      type: "paragraph",
      text: "A report exporter might support PDF, CSV, and JSON. The pipeline calls exporter.export(data) without branching on format everywhere. New formats plug in without touching the orchestrator.",
    },
    {
      type: "code",
      language: "typescript",
      code: `interface Exporter {
  export(rows: Record<string, unknown>[]): Buffer;
}

function deliver(exporter: Exporter, rows: Record<string, unknown>[]) {
  return exporter.export(rows);
}`,
    },
    {
      type: "callout",
      variant: "tip",
      title: "Interview signal",
      text: "Tie polymorphism to Open/Closed: extend via new types, not endless if/else chains.",
    },
  ],
  keyTakeaways: [
    "Program to interfaces, not implementations.",
    "Polymorphism removes format-specific branching.",
    "It is the backbone of extensible architectures.",
  ],
  panelSummary:
    "Polymorphism allows objects of different types to be treated through the same interface — the right behavior is chosen at runtime.",
  panelKeyPoints: [
    "Write code against interfaces, not concrete classes",
    "Extend behavior without modifying existing callers",
    "Core to plugin architectures and strategy patterns",
  ],
};
