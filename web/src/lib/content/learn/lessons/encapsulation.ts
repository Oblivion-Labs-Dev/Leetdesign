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
    { id: "why-interviews-care", label: "Why interviewers care" },
    { id: "library-example", label: "Example: library catalog" },
    { id: "defensive-copies", label: "Returning collections safely" },
    { id: "common-mistakes", label: "Common mistakes" },
    { id: "quiz", label: "Quiz" },
  ],
  objectives: [
    "Define encapsulation and explain why it improves predictability",
    "Spot public fields and leaky collection returns in a class design",
    "Route state changes through methods that enforce invariants",
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
      text: "Encapsulation keeps an object's data private and lets the object control how that data is used. Other code interacts through methods — not by reaching in and changing fields directly.",
    },
    {
      type: "paragraph",
      text: "The payoff is predictability. When your BankAccount owns its balance and only changes it through deposit() and withdraw(), you can enforce rules in one place — no negative balances, log every transaction, trigger fraud checks. If balance were public, nothing guarantees those rules run.",
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
      id: "why-interviews-care",
      text: "Why interviewers care",
    },
    {
      type: "paragraph",
      text: "In LLD interviews, encapsulation is a basic hygiene check. Do your classes expose fields directly, or do they provide methods? Do you return references to mutable internal collections that callers can still modify, or do you return copies or read-only views?",
    },
    {
      type: "list",
      items: [
        "Fields should default to private — expose behavior, not raw state",
        "Business rules belong inside the class, not scattered across callers",
        "If you need to return a collection, return a copy or an unmodifiable view",
      ],
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
      id: "library-example",
      text: "Example: library catalog",
    },
    {
      type: "heading",
      level: 3,
      text: "Without encapsulation",
    },
    {
      type: "paragraph",
      text: "A public books array lets any caller remove items, add duplicates, or mark a book as available without going through borrow rules.",
    },
    {
      type: "code",
      language: "typescript",
      caption: "Public catalog — any code can corrupt inventory",
      code: `class LibraryCatalog {
  books: Book[] = [];
}

class Book {
  constructor(public title: string, public available: boolean) {}
}

const catalog = new LibraryCatalog();
catalog.books.push(new Book("Design Patterns", true));
catalog.books[0].available = false; // no borrow record, no due date`,
    },
    {
      type: "paragraph",
      text: "Why this fails: checkout logic, hold limits, and audit trails cannot be enforced. One screen can mark a reserved book as available while another still thinks it is on loan.",
    },
    {
      type: "heading",
      level: 3,
      text: "With encapsulation",
    },
    {
      type: "paragraph",
      text: "Keep the catalog private. Expose borrow() and returnBook() so every state change runs the same checks.",
    },
    {
      type: "code",
      language: "typescript",
      caption: "Private catalog — rules live in borrow()",
      code: `class LibraryCatalog {
  private books: Book[] = [];

  addBook(book: Book): void {
    this.books.push(book);
  }

  borrow(title: string): Book | null {
    const book = this.books.find((b) => b.title === title && b.available);
    if (!book) return null;
    book.available = false;
    return book;
  }

  returnBook(title: string): void {
    const book = this.books.find((b) => b.title === title);
    if (book) book.available = true;
  }
}`,
    },
    {
      type: "paragraph",
      text: "What improves: callers cannot skip validation. Every borrow runs the same lookup and availability check. The class owns its invariants.",
    },
    {
      type: "diagram",
      id: "encapsulation-bad-vs-good",
      caption: "Left: anyone edits the list. Right: changes go through borrow().",
    },

    { type: "divider" },
    {
      type: "heading",
      level: 2,
      id: "defensive-copies",
      text: "Returning collections safely",
    },
    {
      type: "heading",
      level: 3,
      text: "Leaking internal state",
    },
    {
      type: "paragraph",
      text: "Even with a private array, returning the array directly still lets callers mutate it from outside.",
    },
    {
      type: "code",
      language: "typescript",
      caption: "Getter returns the live internal list",
      code: `class LibraryCatalog {
  private books: Book[] = [];

  getBooks(): Book[] {
    return this.books; // caller can .push() or .splice()
  }
}`,
    },
    {
      type: "paragraph",
      text: "Why this fails: encapsulation looks correct on paper, but external code still changes inventory without borrow().",
    },
    {
      type: "heading",
      level: 3,
      text: "Return a copy or a safe view",
    },
    {
      type: "code",
      language: "typescript",
      caption: "Snapshot — callers cannot mutate the private list",
      code: `class LibraryCatalog {
  private books: Book[] = [];

  getAvailableTitles(): string[] {
    return this.books
      .filter((b) => b.available)
      .map((b) => b.title);
  }
}`,
    },
    {
      type: "paragraph",
      text: "What improves: callers get the data they need without a handle on mutable internals. If you must return objects, return copies or read-only interfaces.",
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
        "Public fields for speed — bugs spread when many classes touch the same data",
        "Getters with no validation — extra boilerplate, no protection",
        "Returning private arrays or maps directly — callers mutate them with .push() or .delete()",
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
          question: "Why do interviewers care about encapsulation?",
          options: [
            "It makes compiled code run on fewer CPU cores",
            "It shows whether a class protects its invariants or exposes raw state",
            "It replaces the need for interfaces",
            "It only applies to frontend components",
          ],
          correctIndex: 1,
          explanation:
            "Public fields and leaky getters are a common LLD red flag.",
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
          question: "What is wrong with return this.books from a getter?",
          options: [
            "Arrays cannot be return types in TypeScript",
            "Callers receive a reference and can mutate the private list",
            "It forces the method to be async",
            "It prevents the class from having other methods",
          ],
          correctIndex: 1,
          explanation:
            "Return a copy, a snapshot, or data shaped for the caller — not the live collection.",
        },
      ],
    },
  ],
  keyTakeaways: [
    "Hide state, expose behavior — keep fields private and route changes through methods.",
    "Rules belong inside the class so every caller gets the same guarantees.",
    "Return copies or safe views when exposing collection data.",
  ],
  panelSummary:
    "Encapsulation bundles data and behavior in one unit and restricts direct access to internal state.",
  panelKeyPoints: [
    "Protects data from unintended external changes",
    "Hides implementation behind public methods",
    "Basic hygiene check in LLD interviews",
  ],
};
