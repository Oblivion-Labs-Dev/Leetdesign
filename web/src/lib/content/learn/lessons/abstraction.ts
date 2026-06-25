import type { LearnLesson } from "@/types/learn";

export const abstractionLesson: LearnLesson = {
  slug: "abstraction",
  trackSlug: "oop",
  title: "Abstraction",
  subtitle: "",
  heroImage: "/Concepts/abstraction.png",
  readMinutes: 8,
  difficulty: "beginner",
  tableOfContents: [
    { id: "what-is-abstraction", label: "What is abstraction?" },
    { id: "vs-encapsulation", label: "Abstraction vs encapsulation" },
    { id: "where-to-look", label: "Where to introduce one" },
    { id: "payment-example", label: "Example: checkout payments" },
    { id: "right-level", label: "Choosing the right level" },
    { id: "common-mistakes", label: "Common mistakes" },
    { id: "quiz", label: "Quiz" },
  ],
  objectives: [
    "Define abstraction and describe what callers see versus what stays hidden",
    "Recognize tangled logic and variation points that call for an interface",
    "Design a contract at the right level — not too vague, not too specific",
  ],
  blocks: [
    {
      type: "heading",
      level: 2,
      id: "what-is-abstraction",
      text: "What is abstraction?",
    },
    {
      type: "paragraph",
      text: "Abstraction exposes only what is essential and hides implementation details behind a clear interface. You define what something can do without revealing how it does it.",
    },
    {
      type: "paragraph",
      text: "When checkout depends on a PaymentGateway interface instead of Stripe's SDK directly, you can swap providers without rewriting order logic. The caller calls charge(amount) and gets a result — it does not need to know about API keys, webhooks, or retry policies.",
    },
    {
      type: "diagram",
      id: "abstraction-interface",
      caption:
        "Checkout depends on the PaymentGateway contract. Concrete providers stay behind it.",
    },

    {
      type: "heading",
      level: 2,
      id: "vs-encapsulation",
      text: "Abstraction vs encapsulation",
    },
    {
      type: "paragraph",
      text: "Encapsulation controls access — private fields, public methods. Abstraction controls complexity — you choose which operations belong on the public surface. They work together: a class can encapsulate its state while presenting an abstract interface to the rest of the app.",
    },
    {
      type: "list",
      items: [
        "Encapsulation — who can touch internal data",
        "Abstraction — which operations callers see at all",
      ],
    },

    {
      type: "heading",
      level: 2,
      id: "where-to-look",
      text: "Where to introduce one",
    },
    {
      type: "paragraph",
      text: "Abstraction shows up where logic feels tangled or requirements suggest multiple approaches — different payment providers, notification channels, storage backends. In interviews, those variation points are signals to define a contract and hide the messy details behind it.",
    },
    {
      type: "list",
      items: [
        "Multiple providers for the same operation (pay, notify, store)",
        "Callers importing vendor SDK types directly",
        "Tests that need to stub a whole external service to run",
      ],
    },

    {
      type: "heading",
      level: 2,
      id: "payment-example",
      text: "Example: checkout payments",
    },
    {
      type: "heading",
      level: 3,
      text: "Without abstraction",
    },
    {
      type: "paragraph",
      text: "OrderService constructs Stripe's client inline. Every change to the payment stack touches checkout code.",
    },
    {
      type: "code",
      language: "typescript",
      caption: "Checkout tightly coupled to one vendor",
      code: `class Order {
  constructor(public total: number, public cardToken: string) {}
}

class StripeClient {
  charge(amount: number, cardToken: string): string {
    return "ch_123";
  }
}

class OrderService {
  checkout(order: Order): void {
    const stripe = new StripeClient();
    stripe.charge(order.total, order.cardToken);
  }
}`,
    },
    {
      type: "paragraph",
      text: "Why this fails: adding PayPal or a test double means rewriting OrderService. Callers learn vendor-specific setup, and integration tests hit real APIs.",
    },
    {
      type: "heading",
      level: 3,
      text: "With abstraction",
    },
    {
      type: "paragraph",
      text: "Define PaymentGateway with the one operation checkout needs. Each provider implements the details.",
    },
    {
      type: "code",
      language: "typescript",
      caption: "Stable interface, hidden provider details",
      code: `interface PaymentGateway {
  charge(amount: number, cardToken: string): string;
}

class StripeGateway implements PaymentGateway {
  charge(amount: number, cardToken: string): string {
    // API key, retries, idempotency — hidden here
    return "ch_123";
  }
}

class PayPalGateway implements PaymentGateway {
  charge(amount: number, cardToken: string): string {
    return "pp_456";
  }
}

class OrderService {
  constructor(private payments: PaymentGateway) {}

  checkout(order: Order): void {
    this.payments.charge(order.total, order.cardToken);
  }
}`,
    },
    {
      type: "paragraph",
      text: "What improves: OrderService only calls charge(). You inject Stripe, PayPal, or a fake gateway in tests without changing checkout logic.",
    },
    {
      type: "diagram",
      id: "abstraction-swap",
      caption:
        "Left: checkout is tied to one vendor. Right: swap providers without rewriting checkout.",
    },

    {
      type: "heading",
      level: 2,
      id: "right-level",
      text: "Choosing the right level",
    },
    {
      type: "paragraph",
      text: "The hard part is picking the right abstraction. Too vague and the interface is meaningless — doWork(), handleRequest(). Too specific and you have not hidden anything — callers still depend on vendor types.",
    },
    {
      type: "list",
      items: [
        "Ask what the caller needs to do, not how it happens internally",
        "Name operations in domain terms: charge, send, reserve — not processStripePayload",
        "One interface per variation axis — do not force unrelated methods on every implementer",
      ],
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
        "Leaking implementation types — returning vendor charge objects to the UI",
        "God interfaces — dozens of methods force every implementer to stub unused ones",
        "Abstracting too early — one implementation with no variation does not need an interface yet",
      ],
    },

    { type: "divider" },
    {
      type: "quiz",
      title: "Quiz",
      anchorId: "quiz",
      questions: [
        {
          question: "What is abstraction?",
          options: [
            "Deleting unused variables",
            "Showing essential behavior while hiding implementation detail",
            "Making every method static",
            "Copying code into a base class",
          ],
          correctIndex: 1,
          explanation:
            "Abstraction gives callers a simple contract and hides how it is fulfilled.",
        },
        {
          question: "When is an interface a good signal in an LLD problem?",
          options: [
            "When every class already has exactly one method",
            "When requirements mention multiple providers or strategies for the same action",
            "When you want to avoid writing tests",
            "When the problem has no variation points",
          ],
          correctIndex: 1,
          explanation:
            "Multiple payment methods, notifiers, or storage backends are classic abstraction points.",
        },
        {
          question: "Why define a PaymentGateway interface?",
          options: [
            "To make TypeScript compile faster",
            "So checkout depends on charge(), not a specific vendor SDK",
            "To prevent any class from having more than one method",
            "Because interfaces run faster than classes",
          ],
          correctIndex: 1,
          explanation:
            "A stable interface lets you swap providers or use mocks without rewriting callers.",
        },
        {
          question: "Which interface name is too vague to be useful?",
          options: [
            "PaymentGateway.charge(amount, token)",
            "NotificationSender.send(to, message)",
            "Handler.doWork()",
            "StorageBackend.save(key, data)",
          ],
          correctIndex: 2,
          explanation:
            "doWork() does not tell callers what to expect or what invariants hold.",
        },
      ],
    },
  ],
  keyTakeaways: [
    "Abstraction exposes what, hides how.",
    "Look for variation points — multiple providers, tangled vendor code.",
    "Name the contract around caller needs, not internal mechanics.",
  ],
  panelSummary:
    "Abstraction focuses on what an object does rather than how it does it — exposing only essential behavior and hiding complexity.",
  panelKeyPoints: [
    "Simplifies interaction with complex systems",
    "Reduces cognitive load for callers",
    "Enables swapping implementations behind a stable interface",
  ],
};
