import type { LearnLesson } from "@/types/learn";

export const ocpLesson: LearnLesson = {
  slug: "open-closed",
  trackSlug: "solid",
  title: "Open/Closed",
  subtitle: "",
  heroImage: "/Concepts/Open_Closed.png",
  readMinutes: 7,
  difficulty: "beginner",
  tableOfContents: [
    { id: "what-is-ocp", label: "What is OCP?" },
    { id: "why-it-matters", label: "Why it matters" },
    { id: "payment-example", label: "Example: payment types" },
    { id: "when-not-to-force", label: "When not to force OCP" },
    { id: "common-mistakes", label: "Common mistakes" },
    { id: "quiz", label: "Quiz" },
  ],
  objectives: [
    "Define OCP and distinguish extension from modification",
    "Add new payment types with new classes instead of editing branch logic",
    "Recognize when a simple branch is enough",
  ],
  blocks: [
    {
      type: "heading",
      level: 2,
      id: "what-is-ocp",
      text: "What is OCP?",
    },
    {
      type: "paragraph",
      text: "The Open/Closed Principle says classes should be open for extension but closed for modification. You add new behavior by writing new types — not by reopening code that already works.",
    },
    {
      type: "paragraph",
      text: "Every time you modify existing code, you risk breaking things that already work. If stable orchestration depends on interfaces from the start, new functionality becomes a matter of adding implementations. The old code never changes.",
    },
    {
      type: "diagram",
      id: "ocp-core-extends",
      caption:
        "PaymentProcessor stays closed. New payment types extend the design without editing it.",
    },

    {
      type: "heading",
      level: 2,
      id: "why-it-matters",
      text: "Why it matters",
    },
    {
      type: "paragraph",
      text: "In LLD problems with growing variation — payment methods, discount rules, notification channels — OCP keeps the core flow stable. New types plug in; the orchestrator does not grow another branch.",
    },
    {
      type: "list",
      items: [
        "Modify — add another else if to process(type, amount)",
        "Extend — add CryptoPayment implements PaymentMethod",
      ],
    },

    {
      type: "heading",
      level: 2,
      id: "payment-example",
      text: "Example: payment types",
    },
    {
      type: "heading",
      level: 3,
      text: "Without OCP",
    },
    {
      type: "paragraph",
      text: "PaymentProcessor branches on a type string. Adding crypto means editing this method.",
    },
    {
      type: "code",
      language: "typescript",
      caption: "Every new payment type edits process()",
      code: `class PaymentProcessor {
  process(type: string, amount: number): void {
    if (type === "credit") {
      // credit card logic
    } else if (type === "paypal") {
      // PayPal logic
    }
    // Adding crypto means modifying this method
  }
}`,
    },
    {
      type: "paragraph",
      text: "Why this fails: each new provider edits working code. Merge conflicts pile up. Regression tests must re-run the entire processor because the shared method changed.",
    },
    {
      type: "heading",
      level: 3,
      text: "With OCP",
    },
    {
      type: "paragraph",
      text: "Each payment type is its own class. PaymentProcessor delegates to PaymentMethod — unchanged when you add crypto.",
    },
    {
      type: "code",
      language: "typescript",
      caption: "Extend by adding a class, not editing the processor",
      code: `interface PaymentMethod {
  process(amount: number): void;
}

class CreditCardPayment implements PaymentMethod {
  process(amount: number): void {
    // credit card logic
  }
}

class PayPalPayment implements PaymentMethod {
  process(amount: number): void {
    // PayPal logic
  }
}

class CryptoPayment implements PaymentMethod {
  process(amount: number): void {
    // crypto logic
  }
}

class PaymentProcessor {
  process(method: PaymentMethod, amount: number): void {
    method.process(amount);
  }
}`,
    },
    {
      type: "paragraph",
      text: "What improves: ship CryptoPayment without touching PaymentProcessor. Existing credit and PayPal tests stay valid. Extension happens through new classes.",
    },
    {
      type: "diagram",
      id: "ocp-switch-vs-extend",
      caption:
        "Left: modify process() for each type. Right: add a new PaymentMethod class.",
    },

    {
      type: "heading",
      level: 2,
      id: "when-not-to-force",
      text: "When not to force OCP",
    },
    {
      type: "paragraph",
      text: "If you have two fixed payment types that never change, an interface plus three classes may be overkill. OCP pays off when extension is real and recurring. Say that out loud in interviews — it shows judgment.",
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
        "Adding else if branches while calling it a quick fix — debt compounds",
        "Creating interfaces but still editing a factory switch for every new type",
        "Abstracting stable code that will never get a second implementation",
      ],
    },

    { type: "divider" },
    {
      type: "quiz",
      title: "Quiz",
      anchorId: "quiz",
      questions: [
        {
          question: "What does open/closed mean?",
          options: [
            "Files must stay open in the editor",
            "Open for extension, closed for modification",
            "Classes cannot be imported across modules",
            "All methods must be public",
          ],
          correctIndex: 1,
          explanation:
            "Add behavior with new types. Avoid editing stable, working code paths.",
        },
        {
          question: "How do you add cryptocurrency payments under OCP?",
          options: [
            "Add another if (type === \"crypto\") to process()",
            "Create CryptoPayment implements PaymentMethod",
            "Duplicate PaymentProcessor in a new file",
            "Make process() public on every payment class",
          ],
          correctIndex: 1,
          explanation:
            "Extension through a new class keeps PaymentProcessor unchanged.",
        },
        {
          question: "Why avoid modifying PaymentProcessor for each new type?",
          options: [
            "Switch statements are banned in TypeScript",
            "Each edit risks breaking working payment flows",
            "PaymentProcessor can only accept one constructor argument",
            "Crypto cannot be called from if blocks",
          ],
          correctIndex: 1,
          explanation:
            "Stable orchestration should not change when you add a provider.",
        },
        {
          question: "OCP pairs most naturally with which OOP idea?",
          options: [
            "Public fields on data classes",
            "Polymorphism — one call site, many implementations",
            "Deep inheritance trees only",
            "Global variables for configuration",
          ],
          correctIndex: 1,
          explanation:
            "Interfaces let you extend behavior without modifying callers.",
        },
      ],
    },
  ],
  keyTakeaways: [
    "Extend with new types; keep stable orchestration closed.",
    "Growing switch statements signal an OCP opportunity.",
    "Do not over-abstract when variation is unlikely.",
  ],
  panelSummary:
    "Software entities should be open for extension but closed for modification.",
  panelKeyPoints: [
    "Add behavior with new types, not edits",
    "Protect stable code paths from churn",
    "Apply when extension is real, not ritual",
  ],
};
