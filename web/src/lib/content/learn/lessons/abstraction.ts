import type { LearnLesson } from "@/types/learn";

export const abstractionLesson: LearnLesson = {
  slug: "abstraction",
  trackSlug: "oop",
  title: "Abstraction",
  subtitle: "Expose what matters. Hide the rest.",
  readMinutes: 5,
  difficulty: "beginner",
  objectives: [
    "Define abstraction in object-oriented design",
    "Distinguish abstraction from encapsulation",
    "Design stable interfaces that hide implementation churn",
  ],
  blocks: [
    {
      type: "paragraph",
      text: "Abstraction models essential behavior and omits implementation detail. Callers depend on the interface contract, not on internal mechanics.",
    },
    {
      type: "callout",
      variant: "definition",
      title: "Summary",
      text: "Abstraction = show the what, hide the how.",
    },
    { type: "heading", level: 2, text: "Why teams rely on it" },
    {
      type: "paragraph",
      text: "A PaymentProcessor interface can hide Stripe, Adyen, or an in-house ledger. Services depend on charge(amount) and refund(id) — not HTTP payloads or retry policies. That separation is what lets you swap vendors without rewriting checkout.",
    },
    {
      type: "code",
      language: "typescript",
      code: `interface NotificationSender {
  send(to: string, message: string): Promise<void>;
}

class EmailNotification implements NotificationSender {
  async send(to: string, message: string) {
    // SMTP details hidden here
  }
}`,
    },
    {
      type: "callout",
      variant: "tip",
      title: "Interview signal",
      text: "Strong answers name the caller benefit: less coupling, easier testing, safer refactors.",
    },
  ],
  keyTakeaways: [
    "Interfaces document intent better than concrete classes.",
    "Hide volatile details behind stable contracts.",
    "Abstraction pairs naturally with polymorphism.",
  ],
  panelSummary:
    "Abstraction focuses on what an object does rather than how it does it — exposing only essential behavior and hiding complexity.",
  panelKeyPoints: [
    "Simplifies interaction with complex systems",
    "Reduces cognitive load for callers",
    "Enables swapping implementations behind a stable interface",
  ],
};
