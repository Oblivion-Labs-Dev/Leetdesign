import type { LearnTrack } from "@/types/learn";

export const LEARN_TRACKS: LearnTrack[] = [
  {
    slug: "oop",
    title: "OOP fundamentals",
    summary:
      "Encapsulation, inheritance, and polymorphism — the building blocks every system design interview assumes you know.",
    tag: "Foundations",
    lessonSlugs: [
      "encapsulation",
      "abstraction",
      "inheritance",
      "polymorphism",
    ],
  },
  {
    slug: "solid",
    title: "SOLID principles",
    summary: "Five principles for maintainable object-oriented design.",
    tag: "Foundations",
    lessonSlugs: [
      "single-responsibility",
      "open-closed",
      "liskov-substitution",
      "interface-segregation",
      "dependency-inversion",
    ],
  },
  {
    slug: "patterns",
    title: "Design patterns",
    summary: "Strategy, Factory, Observer, Adapter — applied in real services.",
    tag: "SE I",
    lessonSlugs: [],
  },
];

export function getTrack(slug: string): LearnTrack | undefined {
  return LEARN_TRACKS.find((t) => t.slug === slug);
}
