import type { LearnLesson } from "@/types/learn";

export const encapsulationLesson: LearnLesson = {
  slug: "encapsulation",
  trackSlug: "oop",
  title: "Encapsulation",
  subtitle: "",
  heroImage: "/Concepts/encapsulation.png",
  readMinutes: 8,
  difficulty: "beginner",
  tableOfContents: [
    { id: "what-is-encapsulation", label: "What is encapsulation?" },
    { id: "public-vs-private", label: "Public vs private" },
    { id: "bank-account-example", label: "Example: BankAccount" },
    { id: "getters-and-setters", label: "Getters and setters" },
    { id: "common-mistakes", label: "Common mistakes" },
    { id: "quiz", label: "Quiz" },
  ],
  objectives: [
    "Explain encapsulation in one sentence",
    "Use public and private to control access",
    "Protect fields with methods that enforce rules",
  ],
  blocks: [
    {
      type: "heading",
      level: 2,
      id: "what-is-encapsulation",
      text: "What is encapsulation?",
    },
    {
      type: "paragraph",
      text: "Encapsulation keeps an object's data private and exposes only the methods other code needs. Callers use your methods — they don't edit your fields directly.",
    },
    {
      type: "diagram",
      id: "encapsulation-object",
      caption:
        "Callers use public methods. Private fields stay inside the object.",
    },

    {
      type: "heading",
      level: 2,
      id: "public-vs-private",
      text: "Public vs private",
    },
    {
      type: "paragraph",
      text: "public — other code can call it. private — only code inside the same class can access it. Default fields to private; expose behavior through public methods.",
    },
    {
      type: "diagram",
      id: "encapsulation-atm",
      caption:
        "Public methods are the entry point. Private fields are not visible outside the class.",
    },

    {
      type: "heading",
      level: 2,
      id: "bank-account-example",
      text: "Example: BankAccount",
    },
    {
      type: "paragraph",
      text: "A public balance field lets any file set invalid values — no checks, no logging, one bad line breaks the account.",
    },
    {
      type: "code",
      language: "typescript",
      caption: "Public balance — any code can corrupt state",
      code: `class BankAccount {
  balance: number = 0;  // public — risky
}

const account = new BankAccount();
account.balance = -100;`,
    },
    {
      type: "paragraph",
      text: "Make balance private and route changes through methods that validate input.",
    },
    {
      type: "code",
      language: "typescript",
      caption: "Private balance — rules live in withdraw()",
      code: `class BankAccount {
  private balance: number;

  constructor(startingAmount: number) {
    if (startingAmount < 0) throw new Error("Negative balance");
    this.balance = startingAmount;
  }

  withdraw(amount: number): void {
    if (amount <= 0) throw new Error("Must be positive");
    if (amount > this.balance) throw new Error("Insufficient funds");
    this.balance -= amount;
  }

  getBalance(): number {
    return this.balance;
  }
}`,
    },
    {
      type: "diagram",
      id: "encapsulation-bad-vs-good",
      caption: "Left: anyone edits balance. Right: changes go through withdraw().",
    },

    { type: "divider" },
    {
      type: "heading",
      level: 2,
      id: "getters-and-setters",
      text: "Getters and setters",
    },
    {
      type: "paragraph",
      text: "Use getters and setters when reads or writes need validation. When there is real logic, prefer a named method — deposit(500) over setBalance(500).",
    },
    {
      type: "code",
      language: "typescript",
      caption: "Setter that rejects invalid input",
      code: `class UserProfile {
  private age: number = 0;

  setAge(value: number): void {
    if (value < 0 || value > 150) throw new Error("Invalid age");
    this.age = value;
  }

  getAge(): number {
    return this.age;
  }
}`,
    },

    {
      type: "heading",
      level: 2,
      id: "common-mistakes",
      text: "Common mistakes",
    },
    {
      type: "list",
      items: [
        "Leaving fields public for speed — bugs spread when many files touch the same data",
        "Getters and setters with no validation — extra code, no protection",
        "Returning a private array directly — callers can still mutate it with .push(); return a copy instead",
      ],
    },

    { type: "divider" },
    {
      type: "quiz",
      title: "Quiz",
      anchorId: "quiz",
      questions: [
        {
          question: "What is encapsulation?",
          options: [
            "Copying the same function into many files",
            "Hiding internal data and exposing controlled methods",
            "Making every variable global",
            "Deleting unused code",
          ],
          correctIndex: 1,
          explanation:
            "Encapsulation limits direct access to fields. Other code uses your methods.",
        },
        {
          question: "What does private mean on a field?",
          options: [
            "Only code inside the same class can access it",
            "The field is encrypted on disk",
            "The field can never change",
            "The field is hidden from the compiler",
          ],
          correctIndex: 0,
          explanation:
            "private limits access to the class body. External code must use public methods.",
        },
        {
          question: "Why is a public balance field risky?",
          options: [
            "It makes the class file longer",
            "Any code can set invalid values without running your checks",
            "TypeScript cannot store numbers in fields",
            "Private fields are slower at runtime",
          ],
          correctIndex: 1,
          explanation:
            "Public fields let every caller skip validation.",
        },
        {
          question: "Which is the better way to take $50 from an account?",
          options: [
            "account.balance = account.balance - 50",
            "account.withdraw(50)",
            "account.setBalance(account.balance - 50) with no checks",
            "A shared global variable for all accounts",
          ],
          correctIndex: 1,
          explanation:
            "withdraw(50) runs validation and keeps rules in one place.",
        },
      ],
    },
  ],
  keyTakeaways: [
    "Keep fields private; expose behavior through public methods.",
    "Public fields let bugs spread — validation belongs inside the class.",
    "Prefer named methods (deposit, withdraw) when there is business logic.",
  ],
  panelSummary:
    "Encapsulation bundles data and methods in one unit and restricts direct access to internal state.",
  panelKeyPoints: [
    "Protects data from unintended external changes",
    "Hides implementation behind public methods",
    "Makes code easier to test and change",
  ],
};
