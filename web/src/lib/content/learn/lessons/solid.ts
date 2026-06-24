import type { LearnLesson } from "@/types/learn";

function solidLesson(
  slug: string,
  title: string,
  subtitle: string,
  summary: string,
  points: string[],
  body: string,
  minutes: number,
): LearnLesson {
  return {
    slug,
    trackSlug: "solid",
    title,
    subtitle,
    readMinutes: minutes,
    difficulty: "intermediate",
    objectives: [`Explain the ${title} principle`, "Spot violations in real code", "Refactor toward a cleaner design"],
    blocks: [
      { type: "paragraph", text: body },
      {
        type: "callout",
        variant: "definition",
        title: "Summary",
        text: summary,
      },
      {
        type: "callout",
        variant: "tip",
        title: "Interview signal",
        text: "Name a concrete symptom of violating this principle, then the refactor you would apply.",
      },
    ],
    keyTakeaways: points,
    panelSummary: body,
    panelKeyPoints: points,
  };
}

export const srpLesson = solidLesson(
  "single-responsibility",
  "Single Responsibility",
  "One reason to change.",
  "A class should have only one reason to change.",
  [
    "Split classes that mix unrelated concerns",
    "Smaller units are easier to test",
    "Clear ownership reduces merge conflicts",
  ],
  "The Single Responsibility Principle says a module should do one job well. When authentication, billing, and email formatting live in one service, every feature team steps on the same file.",
  4,
);

export const ocpLesson = solidLesson(
  "open-closed",
  "Open/Closed",
  "Open for extension. Closed for modification.",
  "Software entities should be open for extension but closed for modification.",
  [
    "Add behavior with new types, not edits",
    "Protect stable code paths from churn",
    "Pairs naturally with polymorphism",
  ],
  "Open/Closed encourages you to extend behavior through new implementations instead of editing core logic. Payment routing should accept new providers without rewriting the checkout flow.",
  4,
);

export const lspLesson = solidLesson(
  "liskov-substitution",
  "Liskov Substitution",
  "Subtypes must honor the contract.",
  "Subtypes must be substitutable for their base types without breaking correctness.",
  [
    "Subclasses cannot weaken preconditions",
    "Callers should not need instanceof checks",
    "Broken substitutability hints at a modeling mistake",
  ],
  "Liskov Substitution means any subclass should be usable wherever the parent is expected. If Square cannot honor Rectangle's setWidth semantics, the hierarchy is lying about the contract.",
  4,
);

export const ispLesson = solidLesson(
  "interface-segregation",
  "Interface Segregation",
  "Small interfaces beat fat ones.",
  "Clients should not depend on methods they do not use.",
  [
    "Split bloated interfaces by role",
    "Avoid forcing no-op implementations",
    "Role interfaces clarify dependencies",
  ],
  "Interface Segregation pushes you to break large interfaces into focused ones. A Printer that also exposes fax and scan forces simple label printers to implement dead methods.",
  4,
);

export const dipLesson = solidLesson(
  "dependency-inversion",
  "Dependency Inversion",
  "Depend on abstractions.",
  "High-level modules should not depend on low-level modules. Both should depend on abstractions.",
  [
    "Inject interfaces at construction time",
    "Infrastructure becomes swappable",
    "Enables testing with fakes and mocks",
  ],
  "Dependency Inversion flips the usual dependency direction: domain code defines ports, infrastructure implements adapters. Your OrderService depends on PaymentPort, not Stripe's SDK directly.",
  4,
);
