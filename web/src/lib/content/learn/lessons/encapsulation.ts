import type { LearnLesson } from "@/types/learn";

export const encapsulationLesson: LearnLesson = {
  slug: "encapsulation",
  trackSlug: "oop",
  title: "Encapsulation",
  subtitle:
    "Learn how to hide the messy details and expose only what the outside world needs.",
  readMinutes: 18,
  difficulty: "beginner",
  objectives: [
    "Explain encapsulation in plain English — no jargon required",
    "Spot when code breaks because data is too exposed",
    "Write a simple class with private data and public methods",
    "Understand why this idea matters beyond toy examples",
  ],
  blocks: [
    {
      type: "paragraph",
      text: "If you have never written a class before, that is completely fine. Start here. Encapsulation is one of the most useful ideas in programming — and once you see it, you will notice broken examples everywhere.",
    },
    {
      type: "highlight",
      text: "Encapsulation means keeping an object's data private and letting the outside world interact only through a small, safe set of methods.",
    },
    {
      type: "callout",
      variant: "definition",
      title: "In one line",
      text: "Encapsulation = data + behavior + controlled access.",
    },

    { type: "heading", level: 2, text: "Think of it like an ATM" },
    {
      type: "paragraph",
      text: "You do not walk into a bank vault and move cash yourself. You press buttons on an ATM: withdraw, deposit, check balance. The bank hides how money is stored, counted, and protected. You only get the operations the bank allows.",
    },
    {
      type: "diagram",
      id: "encapsulation-atm",
      caption:
        "The ATM is the public interface. The vault is private — you never touch it directly.",
    },
    {
      type: "paragraph",
      text: "A well-designed object works the same way. Other parts of your program are the customer. Your object is the bank. They should use your buttons (methods), not reach into your vault (raw data).",
    },

    { type: "divider" },
    { type: "heading", level: 2, text: "What lives inside an object?" },
    {
      type: "paragraph",
      text: "Every object in object-oriented programming combines three things. Understanding these three pieces is the whole lesson.",
    },
    {
      type: "list",
      ordered: true,
      items: [
        "Data — the information it remembers (e.g. account balance, user name, cart items)",
        "Behavior — the actions it can perform (e.g. withdraw money, send email, add to cart)",
        "Access control — rules about who can touch the data directly (usually: nobody outside the object)",
      ],
    },
    {
      type: "diagram",
      id: "encapsulation-object",
      caption:
        "Data stays inside. The outside world talks to your object through public methods.",
    },
    {
      type: "highlight",
      text: "The golden rule: other code should not be able to change your object's data unless you explicitly allow it.",
    },

    { type: "heading", level: 2, text: "A story: the broken bank account" },
    {
      type: "paragraph",
      text: "Imagine we model a bank account with a single public number called balance. Any other file in the project can write account.balance = -500 or account.balance = 999999. Nothing stops it. The account can go negative, or inflate magically, and no one gets notified.",
    },
    {
      type: "callout",
      variant: "warning",
      title: "Why this hurts",
      text: "When data is public, every part of your app becomes responsible for keeping it valid. One forgotten check in one file — and your whole model is wrong.",
    },
    {
      type: "code",
      language: "typescript",
      caption: "❌ Bad — balance is public. Anyone can break it.",
      code: `class BankAccount {
  // Anyone can read AND write this directly
  balance: number = 0;
}

const account = new BankAccount();

// Oops — no validation, no log, no fraud check
account.balance = -100;
account.balance = 1_000_000;`,
    },
    {
      type: "diagram",
      id: "encapsulation-bad-vs-good",
      caption: "Left: chaos. Right: the object enforces its own rules.",
    },

    { type: "heading", level: 2, text: "The fix: make data private" },
    {
      type: "paragraph",
      text: "In TypeScript (and most OOP languages), you mark internal fields as private. That means only code inside the class can read or write them. Everyone else must go through methods you define.",
    },
    {
      type: "highlight",
      text: "private is not about secrecy from hackers — it is about protecting your object from accidental misuse by your own teammates (or future you).",
    },
    {
      type: "code",
      language: "typescript",
      caption: "✅ Good — balance is private. Rules live inside withdraw().",
      code: `class BankAccount {
  private balance: number;

  constructor(startingAmount: number) {
    if (startingAmount < 0) {
      throw new Error("Cannot open account with negative balance");
    }
    this.balance = startingAmount;
  }

  withdraw(amount: number): void {
    if (amount <= 0) {
      throw new Error("Withdrawal must be positive");
    }
    if (amount > this.balance) {
      throw new Error("Not enough money");
    }
    this.balance -= amount;
    // You could also log here, notify fraud team, etc.
  }

  getBalance(): number {
    return this.balance;
  }
}`,
    },
    {
      type: "callout",
      variant: "insight",
      title: "What changed?",
      text: "The balance still exists — but now every change goes through withdraw(), where you check amounts, throw errors, and could add logging. Callers cannot skip those rules.",
    },

    { type: "heading", level: 3, text: "Try it step by step" },
    {
      type: "paragraph",
      text: "Read the flow below. Each step shows what happens when another part of the app uses our safe account.",
    },
    {
      type: "list",
      ordered: true,
      items: [
        "const account = new BankAccount(500) — account opens with $500 inside (private)",
        "account.withdraw(50) — the method checks: amount > 0? enough balance? then subtracts",
        "account.getBalance() — returns 450 without exposing the field for writing",
        "account.balance = 0 — TypeScript error! balance is private",
      ],
    },

    {
      type: "animation",
      id: "encapsulation-vault",
      caption:
        "Think of private fields locked in a vault. Public methods are the only doors in.",
    },

    { type: "divider" },
    { type: "heading", level: 2, text: "Getters and setters — when do you need them?" },
    {
      type: "paragraph",
      text: "Sometimes you want outside code to read a value but not write it freely. A getter (like getBalance()) returns a copy or snapshot. A setter lets you write — but only if you validate first.",
    },
    {
      type: "code",
      language: "typescript",
      caption: "A setter with validation — age cannot be negative",
      code: `class UserProfile {
  private age: number = 0;

  setAge(value: number): void {
    if (value < 0 || value > 150) {
      throw new Error("Invalid age");
    }
    this.age = value;
  }

  getAge(): number {
    return this.age;
  }
}`,
    },
    {
      type: "callout",
      variant: "tip",
      title: "Beginner tip",
      text: "Prefer behavior methods (withdraw, upgradePlan, addItem) over bare setters when there is logic involved. setBalance(500) is usually a smell; deposit(500) tells a clearer story.",
    },

    { type: "heading", level: 2, text: "Three mistakes beginners make" },
    {
      type: "list",
      items: [
        "Making every field public because it is faster — you pay for it later in bugs",
        "Writing giant getter/setter pairs for everything with zero validation",
        "Exposing internal lists or arrays that callers can mutate: return copies, or expose read-only views",
      ],
    },
    {
      type: "callout",
      variant: "warning",
      title: "Leaky collections",
      text: "If your class holds private items: Item[] and you return that same array from a getter, callers can call .push() on it and bypass your addItem() logic. Return [...this.items] or freeze the array.",
    },

    { type: "heading", level: 2, text: "Why interviewers and senior devs care" },
    {
      type: "paragraph",
      text: "Encapsulation is not just a classroom exercise. In real systems — a payment service, a user session, a cache — you need to change internals without breaking every caller. Private data + a stable public API is how teams ship refactors safely.",
    },
    {
      type: "highlight",
      text: "Every public method is a promise. Keep that surface small, and you stay free to improve everything behind it.",
    },
    {
      type: "callout",
      variant: "insight",
      title: "Interview signal",
      text: "Strong answers explain why a field is private — tie it to invariants (rules that must always be true). Example: 'Balance must never be negative' is an invariant; encapsulation enforces it in one place.",
    },

    { type: "divider" },
    {
      type: "quiz",
      title: "Quiz — check your understanding",
      questions: [
        {
          question:
            "In plain English, what is encapsulation?",
          options: [
            "Copying code from one file to another",
            "Hiding internal data and exposing only controlled methods",
            "Making every variable global so it is easy to access",
            "Writing the same function twice for safety",
          ],
          correctIndex: 1,
          explanation:
            "Encapsulation bundles data with behavior and restricts direct access. Callers use your methods — they do not reach into private fields.",
        },
        {
          question:
            "Why is public balance: number considered risky?",
          options: [
            "It makes the file too long",
            "Any code can set invalid values and skip validation",
            "TypeScript does not support numbers",
            "Private fields run slower",
          ],
          correctIndex: 1,
          explanation:
            "Public data lets every caller change state without checks. One mistake anywhere can corrupt your object.",
        },
        {
          question:
            "What does the private keyword do in a class?",
          options: [
            "Encrypts data on disk",
            "Allows only code inside the class to access that member",
            "Makes the variable read-only forever",
            "Hides the class from the compiler",
          ],
          correctIndex: 1,
          explanation:
            "private limits access to the class body. Outside code must use the public methods you provide.",
        },
        {
          question:
            "Which is the better design for a bank account?",
          options: [
            "account.balance = account.balance - 50",
            "account.withdraw(50)",
            "account.setBalance(account.balance - 50) with no checks",
            "A global variable called TOTAL_MONEY",
          ],
          correctIndex: 1,
          explanation:
            "withdraw(50) keeps validation, logging, and business rules inside the object — exactly what encapsulation is for.",
        },
        {
          question:
            "What is an invariant?",
          options: [
            "A variable that never changes type",
            "A rule that must always stay true (e.g. balance ≥ 0)",
            "A private method with no parameters",
            "A comment at the top of a file",
          ],
          correctIndex: 1,
          explanation:
            "Invariants are the truths your object must maintain. Encapsulation lets you enforce them in one place instead of scattered across the codebase.",
        },
      ],
    },
  ],
  keyTakeaways: [
    "Encapsulation = data + behavior + controlled access.",
    "Keep fields private; expose behavior through methods.",
    "Public data lets anyone break your rules — private data keeps rules in one place.",
    "Small public APIs make code easier to change and test.",
    "Think ATM, not open vault: buttons in, vault hidden.",
  ],
  panelSummary:
    "Encapsulation is the bundling of data and methods that operate on that data within a single unit, while restricting direct access to some of the object's components.",
  panelKeyPoints: [
    "Protects data from unintended interference",
    "Hides implementation details from the outside world",
    "Makes code more modular and easier to maintain",
  ],
};
