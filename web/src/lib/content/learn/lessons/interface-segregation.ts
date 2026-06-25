import type { LearnLesson } from "@/types/learn";

export const ispLesson: LearnLesson = {
  slug: "interface-segregation",
  trackSlug: "solid",
  title: "Interface Segregation",
  subtitle: "",
  readMinutes: 7,
  difficulty: "beginner",
  tableOfContents: [
    { id: "what-is-isp", label: "What is ISP?" },
    { id: "fat-interface-problem", label: "The fat interface problem" },
    { id: "worker-example", label: "Example: workers and robots" },
    { id: "common-mistakes", label: "Common mistakes" },
    { id: "quiz", label: "Quiz" },
  ],
  objectives: [
    "Define ISP and explain why clients should not depend on unused methods",
    "Split a bloated interface into focused role interfaces",
    "Recognize empty stubs and throw overrides as ISP violations",
  ],
  blocks: [
    {
      type: "heading",
      level: 2,
      id: "what-is-isp",
      text: "What is ISP?",
    },
    {
      type: "paragraph",
      text: "The Interface Segregation Principle says prefer small, focused interfaces over large general-purpose ones. Do not force classes to implement methods they do not need.",
    },
    {
      type: "paragraph",
      text: "If a class only needs two methods from an interface with ten, that interface is too big. Split it into cohesive pieces. Classes implement the small interfaces they actually use.",
    },

    {
      type: "heading",
      level: 2,
      id: "fat-interface-problem",
      text: "The fat interface problem",
    },
    {
      type: "paragraph",
      text: "Fat interfaces force implementers to stub or throw on methods they will never use. That is a code smell — and a common source of LSP violations downstream.",
    },
    {
      type: "list",
      items: [
        "Robot implements eat() with an empty body or throw",
        "LabelPrinter implements scan() and fax() because Printer demands them",
        "Tests mock ten methods when the caller only uses two",
      ],
    },

    {
      type: "heading",
      level: 2,
      id: "worker-example",
      text: "Example: workers and robots",
    },
    {
      type: "heading",
      level: 3,
      text: "Without ISP",
    },
    {
      type: "paragraph",
      text: "Worker bundles work, eat, and sleep. Robot must implement all three even though it only works.",
    },
    {
      type: "code",
      language: "typescript",
      caption: "Robot forced to implement eat() and sleep()",
      code: `interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
}

class Robot implements Worker {
  work() {
    console.log("assembling");
  }

  eat() {
    // robots don't eat — empty stub or throw
  }

  sleep() {
    // robots don't sleep
  }
}`,
    },
    {
      type: "paragraph",
      text: "Why this fails: Robot carries methods it cannot meaningfully support. Callers might invoke eat() on any Worker and get nonsense. The interface lied about what Robot is.",
    },
    {
      type: "heading",
      level: 3,
      text: "With ISP",
    },
    {
      type: "paragraph",
      text: "Split by role. Human implements all three; Robot implements only Workable.",
    },
    {
      type: "code",
      language: "typescript",
      caption: "Small interfaces — implement only what applies",
      code: `interface Workable {
  work(): void;
}

interface Feedable {
  eat(): void;
}

interface Restable {
  sleep(): void;
}

class Human implements Workable, Feedable, Restable {
  work() { console.log("working"); }
  eat() { console.log("eating"); }
  sleep() { console.log("sleeping"); }
}

class Robot implements Workable {
  work() { console.log("assembling"); }
}`,
    },
    {
      type: "paragraph",
      text: "What improves: scheduleShift() accepts Workable — humans and robots both qualify. cafeteriaBreak() accepts Feedable — only humans. No empty stubs, no fake sleep on a robot.",
    },

    { type: "divider" },
    {
      type: "heading",
      level: 2,
      id: "common-mistakes",
      text: "Common mistakes",
    },
    {
      type: "list",
      items: [
        "One god interface per domain entity with every possible operation",
        "Default methods that throw not implemented on a shared interface",
        "Splitting so finely that callers juggle dozens of one-method interfaces",
      ],
    },

    { type: "divider" },
    {
      type: "quiz",
      title: "Quiz",
      anchorId: "quiz",
      questions: [
        {
          question: "What does Interface Segregation recommend?",
          options: [
            "One interface per file maximum",
            "Small focused interfaces — clients should not depend on unused methods",
            "All interfaces must extend a base interface",
            "Never use more than one interface per class",
          ],
          correctIndex: 1,
          explanation:
            "Split fat interfaces so implementers only promise what they support.",
        },
        {
          question: "Why is Robot implements Worker with empty eat() a smell?",
          options: [
            "Robots cannot implement interfaces in TypeScript",
            "Robot is forced to depend on methods it cannot meaningfully support",
            "eat() must be async",
            "Worker must be a class, not an interface",
          ],
          correctIndex: 1,
          explanation:
            "Fat interfaces create stubs, throws, and false contracts.",
        },
        {
          question: "How should cafeteriaBreak() type its parameter?",
          options: [
            "Worker — every worker eats",
            "Feedable — only types that actually eat",
            "Robot",
            "any",
          ],
          correctIndex: 1,
          explanation:
            "Accept the narrow interface that matches the operation.",
        },
        {
          question: "ISP often prevents which other SOLID violation?",
          options: [
            "SRP — classes with one method",
            "LSP — subclasses throwing on unused interface methods",
            "OCP — closed for modification",
            "DIP — constructor injection",
          ],
          correctIndex: 1,
          explanation:
            "Forced unused methods lead to throws and broken substitutability.",
        },
      ],
    },
  ],
  keyTakeaways: [
    "Prefer small, role-focused interfaces over fat ones.",
    "Empty stubs and throw overrides signal an interface is too big.",
    "Callers depend on the narrowest interface that fits the operation.",
  ],
  panelSummary:
    "Clients should not be forced to depend on methods they do not use.",
  panelKeyPoints: [
    "Split bloated interfaces by role",
    "Avoid forcing no-op implementations",
    "Narrow interfaces clarify dependencies",
  ],
};
