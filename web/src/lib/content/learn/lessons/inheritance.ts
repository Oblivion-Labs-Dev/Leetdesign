import type { LearnLesson } from "@/types/learn";

export const inheritanceLesson: LearnLesson = {
  slug: "inheritance",
  trackSlug: "oop",
  title: "Inheritance",
  subtitle: "",
  heroImage: "/Concepts/inheritance.png",
  readMinutes: 8,
  difficulty: "beginner",
  tableOfContents: [
    { id: "what-is-inheritance", label: "What is inheritance?" },
    { id: "when-it-works", label: "When inheritance works" },
    { id: "when-it-breaks", label: "When inheritance breaks down" },
    { id: "composition-alternative", label: "Composition instead" },
    { id: "interview-default", label: "Default in interviews" },
    { id: "common-mistakes", label: "Common mistakes" },
    { id: "quiz", label: "Quiz" },
  ],
  objectives: [
    "Explain inheritance as shared implementation with a real is-a relationship",
    "Identify the fragile base class problem and false is-a hierarchies",
    "Choose composition and interfaces when behavior varies instead of state",
  ],
  blocks: [
    {
      type: "heading",
      level: 2,
      id: "what-is-inheritance",
      text: "What is inheritance?",
    },
    {
      type: "paragraph",
      text: "Inheritance lets one class be a more specific version of another, automatically getting the parent's fields and behavior. It is a tool for sharing implementation — but it comes with a cost: tight coupling.",
    },
    {
      type: "paragraph",
      text: "When a subclass inherits a parent's methods, any change in the parent can break every child. That is the fragile base class problem. Inheritance creates rigidity when the relationship is not genuinely stable.",
    },
    {
      type: "diagram",
      id: "inheritance-hierarchy",
      caption:
        "SavingsAccount and CheckingAccount share stable account behavior and add their own fields.",
    },

    {
      type: "heading",
      level: 2,
      id: "when-it-works",
      text: "When inheritance works",
    },
    {
      type: "paragraph",
      text: "Inheritance makes sense when you have stable, shared implementation that multiple subclasses genuinely need. Bank accounts are a classic example — savings and checking both track balance, accept deposits and withdrawals, and maintain the same core rules.",
    },
    {
      type: "heading",
      level: 3,
      text: "Shared implementation",
    },
    {
      type: "code",
      language: "typescript",
      caption: "Stable base behavior both subtypes truly share",
      code: `abstract class BankAccount {
  protected balance = 0;

  deposit(amount: number): void {
    if (amount <= 0) throw new Error("Invalid amount");
    this.balance += amount;
  }

  withdraw(amount: number): boolean {
    if (amount > this.balance) return false;
    this.balance -= amount;
    return true;
  }

  getBalance(): number {
    return this.balance;
  }
}

class SavingsAccount extends BankAccount {
  constructor(private interestRate: number) {
    super();
  }
}

class CheckingAccount extends BankAccount {
  constructor(private overdraftLimit: number) {
    super();
  }
}`,
    },
    {
      type: "paragraph",
      text: "What improves: deposit and withdraw live once in BankAccount. Subclasses add only what differs — interest rate or overdraft limit — without overriding core money movement in incompatible ways.",
    },

    {
      type: "heading",
      level: 2,
      id: "when-it-breaks",
      text: "When inheritance breaks down",
    },
    {
      type: "paragraph",
      text: "The classic interview mistake is using inheritance to model behavior differences. If subclasses override methods with completely different implementations, the hierarchy is lying about what is shared.",
    },
    {
      type: "heading",
      level: 3,
      text: "Behavior variation through overrides",
    },
    {
      type: "code",
      language: "typescript",
      caption: "ElectricCar forced into an engine hierarchy",
      code: `class Car {
  startEngine(): void {
    // gasoline ignition sequence
  }
}

class ElectricCar extends Car {
  startEngine(): void {
    // electric motor startup — completely different mechanism
  }
}`,
    },
    {
      type: "paragraph",
      text: "Why this fails: electric cars do not share useful engine logic with gasoline cars. Adding a hybrid forces awkward choices — extend Car or ElectricCar? Neither models the problem cleanly.",
    },

    {
      type: "heading",
      level: 2,
      id: "composition-alternative",
      text: "Composition instead",
    },
    {
      type: "paragraph",
      text: "When behavior varies, isolate it in its own abstraction and compose it. You still get abstraction and polymorphism without forcing a parent-child relationship.",
    },
    {
      type: "heading",
      level: 3,
      text: "Drivetrain composition",
    },
    {
      type: "code",
      language: "typescript",
      caption: "Car has-a Drivetrain — no false is-a link",
      code: `interface Drivetrain {
  start(): void;
}

class GasEngine implements Drivetrain {
  start(): void {
    // gasoline startup
  }
}

class ElectricMotor implements Drivetrain {
  start(): void {
    // electric startup
  }
}

class Car {
  constructor(private drivetrain: Drivetrain) {}

  start(): void {
    this.drivetrain.start();
  }
}`,
    },
    {
      type: "paragraph",
      text: "What improves: model any car by injecting the right Drivetrain. A hybrid can hold two drivetrains. Car never changes when you add hydrogen or another motor type.",
    },
    {
      type: "diagram",
      id: "inheritance-vs-composition",
      caption:
        "Left: ElectricCar extends Car with incompatible overrides. Right: compose Drivetrain instead.",
    },

    {
      type: "heading",
      level: 2,
      id: "interview-default",
      text: "Default in interviews",
    },
    {
      type: "paragraph",
      text: "Default to interfaces with composition. Reach for inheritance only when you genuinely need to share stable implementation and the is-a relationship holds. In most LLD interviews, you do not need inheritance at all — and saying that out loud shows mature judgment.",
    },
    {
      type: "list",
      items: [
        "SavingsAccount is-a BankAccount — shared money rules are stable",
        "ElectricCar is-a Car for startEngine() — behavior is not shared",
        "Car has-a Drivetrain — composition models the variation",
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
        "Subclassing for code reuse when the child is not really a subtype",
        "Overriding core methods with incompatible behavior — breaks LSP",
        "Deep trees where a small parent change breaks every descendant",
      ],
    },

    { type: "divider" },
    {
      type: "quiz",
      title: "Quiz",
      anchorId: "quiz",
      questions: [
        {
          question: "When should you use inheritance?",
          options: [
            "Whenever two classes share a method name",
            "When the subclass is-a parent and shares stable implementation",
            "When you want to avoid interfaces entirely",
            "When a class needs unrelated behaviors from two parents",
          ],
          correctIndex: 1,
          explanation:
            "Inheritance models genuine specialization with shared, stable behavior.",
        },
        {
          question: "Why is BankAccount a good base class here?",
          options: [
            "It makes TypeScript compile faster",
            "Deposit and withdraw rules are identical across account types",
            "It prevents subclasses from adding fields",
            "It removes the need for encapsulation",
          ],
          correctIndex: 1,
          explanation:
            "Shared money movement is stable. Subclasses add fields, not incompatible overrides.",
        },
        {
          question: "Why is ElectricCar extends Car often a poor choice?",
          options: [
            "TypeScript forbids electric vehicles",
            "startEngine() behavior is not genuinely shared",
            "Interfaces cannot model cars",
            "Composition is always forbidden in OOP",
          ],
          correctIndex: 1,
          explanation:
            "Forcing behavior differences into overrides signals composition fits better.",
        },
        {
          question: "What is the safer default in most LLD interviews?",
          options: [
            "Deep inheritance trees for every entity",
            "Interfaces with composition; inheritance only when sharing stable code",
            "Public fields for speed",
            "One god class with flags for every variant",
          ],
          correctIndex: 1,
          explanation:
            "Composition avoids fragile base classes while still enabling polymorphism.",
        },
      ],
    },
  ],
  keyTakeaways: [
    "Inherit when is-a holds and shared implementation is stable.",
    "Override-heavy hierarchies often mean composition fits better.",
    "Default to interfaces + composition in interviews; inheritance is the exception.",
  ],
  panelSummary:
    "Inheritance shares implementation across related types — use it when the is-a relationship and shared behavior are genuinely stable.",
  panelKeyPoints: [
    "Watch the fragile base class problem",
    "Behavior variation favors composition",
    "Most LLD designs need interfaces more than deep trees",
  ],
};
