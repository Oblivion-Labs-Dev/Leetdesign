import type { LearnLesson } from "@/types/learn";

export const dipLesson: LearnLesson = {
  slug: "dependency-inversion",
  trackSlug: "solid",
  title: "Dependency Inversion",
  subtitle: "",
  readMinutes: 8,
  difficulty: "beginner",
  tableOfContents: [
    { id: "what-is-dip", label: "What is DIP?" },
    { id: "inversion-explained", label: "What inversion means" },
    { id: "notification-example", label: "Example: notifications" },
    { id: "dip-vs-di", label: "DIP vs dependency injection" },
    { id: "putting-solid-together", label: "Putting SOLID together" },
    { id: "common-mistakes", label: "Common mistakes" },
    { id: "quiz", label: "Quiz" },
  ],
  objectives: [
    "Define DIP and explain why high-level code should depend on abstractions",
    "Refactor a service that constructs concrete dependencies inline",
    "Distinguish DIP the principle from dependency injection the technique",
  ],
  blocks: [
    {
      type: "heading",
      level: 2,
      id: "what-is-dip",
      text: "What is DIP?",
    },
    {
      type: "paragraph",
      text: "The Dependency Inversion Principle says your code should depend on abstractions, not concrete implementations. NotificationService should accept a MessageSender interface — not construct EmailSender directly.",
    },
    {
      type: "paragraph",
      text: "This matters for testability and flexibility. When NotificationService depends on a concrete EmailSender, you cannot unit test without sending real email, and you cannot swap to SMS without modifying the service.",
    },

    {
      type: "heading",
      level: 2,
      id: "inversion-explained",
      text: "What inversion means",
    },
    {
      type: "paragraph",
      text: "Normally, business logic conforms to whatever the implementation provides. With DIP, you flip this: define an interface based on what your business logic needs, then have implementations conform to that interface. The implementation adapts to the domain — not the other way around.",
    },
    {
      type: "list",
      items: [
        "High-level module — NotificationService (business policy)",
        "Low-level module — EmailSender, SmsSender (infrastructure)",
        "Both depend on MessageSender (abstraction)",
      ],
    },

    {
      type: "heading",
      level: 2,
      id: "notification-example",
      text: "Example: notifications",
    },
    {
      type: "heading",
      level: 3,
      text: "Without DIP",
    },
    {
      type: "paragraph",
      text: "NotificationService creates EmailSender internally. It is tightly coupled to one channel.",
    },
    {
      type: "code",
      language: "typescript",
      caption: "Service hard-wired to email",
      code: `class EmailSender {
  send(message: string): void {
    // SMTP details
  }
}

class NotificationService {
  private emailSender = new EmailSender();

  notify(message: string): void {
    this.emailSender.send(message);
  }
}`,
    },
    {
      type: "paragraph",
      text: "Why this fails: switching to SMS edits NotificationService. Tests hit real SMTP or need brittle monkey-patching. Business logic and infrastructure are glued together.",
    },
    {
      type: "heading",
      level: 3,
      text: "With DIP",
    },
    {
      type: "paragraph",
      text: "Define MessageSender from what NotificationService needs. Inject the implementation.",
    },
    {
      type: "code",
      language: "typescript",
      caption: "Depend on abstraction, inject implementation",
      code: `interface MessageSender {
  send(message: string): void;
}

class EmailSender implements MessageSender {
  send(message: string): void {
    // SMTP details
  }
}

class SmsSender implements MessageSender {
  send(message: string): void {
    // Twilio details
  }
}

class NotificationService {
  constructor(private sender: MessageSender) {}

  notify(message: string): void {
    this.sender.send(message);
  }
}`,
    },
    {
      type: "paragraph",
      text: "What improves: pass EmailSender or SmsSender at startup. Unit tests inject a fake MessageSender. NotificationService never imports SMTP or Twilio types.",
    },

    {
      type: "heading",
      level: 2,
      id: "dip-vs-di",
      text: "DIP vs dependency injection",
    },
    {
      type: "paragraph",
      text: "DIP is a design principle — depend on abstractions. Dependency injection is a technique — passing dependencies through a constructor or factory. Injection helps achieve DIP, but they are not the same thing.",
    },
    {
      type: "list",
      items: [
        "DIP — NotificationService imports MessageSender, not EmailSender",
        "DI — NotificationService receives MessageSender via constructor",
        "You can violate DIP even with injection if you inject concrete types everywhere",
      ],
    },

    {
      type: "heading",
      level: 2,
      id: "putting-solid-together",
      text: "Putting SOLID together",
    },
    {
      type: "paragraph",
      text: "You do not need to name these principles constantly. Use them to guide decisions and mention them briefly when explaining tradeoffs. Focus on the reasoning — the principles show through naturally.",
    },
    {
      type: "list",
      items: [
        "SRP — keep classes focused on one reason to change",
        "OCP — add new types instead of editing stable code",
        "LSP — subtypes must honor the parent contract",
        "ISP — small interfaces, no forced unused methods",
        "DIP — business logic depends on abstractions, not infrastructure",
      ],
    },
    {
      type: "paragraph",
      text: "Broader design ideas pair with SOLID: KISS (start simple), DRY (one source of truth), YAGNI (build for today), separation of concerns (independent testing), and the Law of Demeter (do not reach through object graphs). Apply SOLID when class design complexity warrants it — not as a checklist to recite.",
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
        "Injecting concrete classes while calling it dependency injection",
        "Defining interfaces that mirror one implementation with no variation",
        "Inverting everything — simple scripts do not need ports and adapters",
      ],
    },

    { type: "divider" },
    {
      type: "quiz",
      title: "Quiz",
      anchorId: "quiz",
      questions: [
        {
          question: "What does Dependency Inversion require?",
          options: [
            "All classes must be singletons",
            "High-level modules depend on abstractions, not concrete implementations",
            "Low-level modules import business logic directly",
            "Every field must be injected",
          ],
          correctIndex: 1,
          explanation:
            "Define the contract from the domain side; implementations conform to it.",
        },
        {
          question: "What is the main benefit of MessageSender injection?",
          options: [
            "Faster TypeScript compilation",
            "Swap channels and test with fakes without editing NotificationService",
            "Email is deprecated",
            "Constructors are required by SOLID law",
          ],
          correctIndex: 1,
          explanation:
            "Abstractions isolate business logic from infrastructure details.",
        },
        {
          question: "How is DIP different from dependency injection?",
          options: [
            "They are identical terms",
            "DIP is the principle; injection is one technique to achieve it",
            "DIP only applies to databases",
            "Injection violates DIP by default",
          ],
          correctIndex: 1,
          explanation:
            "You can inject concrete types and still violate DIP.",
        },
        {
          question: "When should you apply the full SOLID stack?",
          options: [
            "On every function regardless of complexity",
            "When class relationships and variation points warrant it",
            "Never in interviews",
            "Only in Java projects",
          ],
          correctIndex: 1,
          explanation:
            "Use principles as tools for thinking — not ritual complexity.",
        },
      ],
    },
  ],
  keyTakeaways: [
    "Depend on abstractions — domain defines the contract.",
    "Injection helps achieve DIP; they are not the same thing.",
    "SOLID guides decisions; KISS keeps you from over-engineering.",
  ],
  panelSummary:
    "High-level modules should not depend on low-level modules. Both should depend on abstractions.",
  panelKeyPoints: [
    "Domain defines the interface; infrastructure implements it",
    "Enables testing with fakes and swapping channels",
    "Pair with judgment — not every class needs inversion",
  ],
};
