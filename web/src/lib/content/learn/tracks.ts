import type { LearnTrack } from "@/types/learn";

export const LEARN_TRACKS: LearnTrack[] = [
  {
    slug: "oop",
    title: "OOP fundamentals",
    summary:
      "The four mechanisms your language gives you to implement clean design — focused on what actually shows up in LLD interviews.",
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
    summary:
      "Five principles for class design in LLD interviews — apply when the problem calls for them, not as ceremony.",
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
