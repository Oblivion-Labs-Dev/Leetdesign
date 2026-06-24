import type { LearnLesson } from "@/types/learn";

export const inheritanceLesson: LearnLesson = {
  slug: "inheritance",
  trackSlug: "oop",
  title: "Inheritance",
  subtitle: "Reuse behavior. Specialize with care.",
  readMinutes: 5,
  difficulty: "beginner",
  objectives: [
    "Explain is-a relationships with inheritance",
    "Spot when composition is the better tool",
    "Avoid fragile base-class problems",
  ],
  blocks: [
    {
      type: "paragraph",
      text: "Inheritance lets a subclass acquire fields and methods from a parent class while overriding or extending behavior. It models specialization: a SavingsAccount is a BankAccount with extra rules.",
    },
    {
      type: "callout",
      variant: "definition",
      title: "Summary",
      text: "Inheritance = shared implementation + specialized behavior.",
    },
    { type: "heading", level: 2, text: "When it helps" },
    {
      type: "paragraph",
      text: "Shared logic belongs in the base class once. Subclasses focus on differences. But deep trees create tight coupling — a change in Animal can break Dog, Cat, and every test that mocked them.",
    },
    {
      type: "code",
      language: "typescript",
      code: `class Shape {
  constructor(protected color: string) {}
  area(): number {
    throw new Error("Subclass must implement");
  }
}

class Circle extends Shape {
  constructor(color: string, private radius: number) {
    super(color);
  }
  area() {
    return Math.PI * this.radius ** 2;
  }
}`,
    },
    {
      type: "callout",
      variant: "warning",
      title: "Caution",
      text: "Prefer composition when behavior varies independently. Inheritance is not a reuse hammer.",
    },
  ],
  keyTakeaways: [
    "Use inheritance for true is-a relationships.",
    "Keep hierarchies shallow and intention-revealing.",
    "Favor composition when reuse does not imply subtyping.",
  ],
  panelSummary:
    "Inheritance lets a class acquire properties and behaviors of another class — reuse code while specializing behavior in subclasses.",
  panelKeyPoints: [
    "Promotes code reuse across related types",
    "Models is-a relationships clearly",
    "Watch for deep hierarchies that hurt flexibility",
  ],
};
