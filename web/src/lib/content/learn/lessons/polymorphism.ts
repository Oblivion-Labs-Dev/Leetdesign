import type { LearnLesson } from "@/types/learn";

export const polymorphismLesson: LearnLesson = {
  slug: "polymorphism",
  trackSlug: "oop",
  title: "Polymorphism",
  subtitle: "",
  heroImage: "/Concepts/polymorphism.png",
  readMinutes: 8,
  difficulty: "beginner",
  tableOfContents: [
    { id: "what-is-polymorphism", label: "What is polymorphism?" },
    { id: "how-it-works", label: "How it works" },
    { id: "parking-example", label: "Example: parking vehicles" },
    { id: "tradeoffs", label: "Tradeoffs in interviews" },
    { id: "putting-it-together", label: "Putting OOP together" },
    { id: "common-mistakes", label: "Common mistakes" },
    { id: "quiz", label: "Quiz" },
  ],
  objectives: [
    "Define polymorphism and describe how runtime dispatch selects behavior",
    "Replace type-check branching with a shared interface method",
    "Explain when polymorphism helps extensibility and when explicit branches are acceptable",
  ],
  blocks: [
    {
      type: "heading",
      level: 2,
      id: "what-is-polymorphism",
      text: "What is polymorphism?",
    },
    {
      type: "paragraph",
      text: "Polymorphism replaces if (type === \"truck\") chains. Instead of checking types, you call the same method and let each object handle itself. Different objects respond to the same action in their own way.",
    },
    {
      type: "paragraph",
      text: "It follows naturally from abstraction. Once you define a Vehicle interface, each implementation provides its own behavior. When you call getRequiredSpotSize() on Vehicle, the runtime runs the version on the actual object — no type checking required.",
    },
    {
      type: "diagram",
      id: "polymorphism-dispatch",
      caption:
        "ParkingLot calls parkVehicle() — Car, Motorcycle, and Truck each supply their own spot rule.",
    },

    {
      type: "heading",
      level: 2,
      id: "how-it-works",
      text: "How it works",
    },
    {
      type: "paragraph",
      text: "The caller holds a reference to a parent type — an interface or base class. It does not branch on concrete names. At runtime, the language dispatches to the implementation on the actual object.",
    },
    {
      type: "list",
      items: [
        "Same method name at the call site",
        "Different classes provide different behavior",
        "Callers stay unchanged when you add a new implementation",
      ],
    },

    {
      type: "heading",
      level: 2,
      id: "parking-example",
      text: "Example: parking vehicles",
    },
    {
      type: "heading",
      level: 3,
      text: "Without polymorphism",
    },
    {
      type: "paragraph",
      text: "ParkingLot inspects a type string and picks spot logic in every branch.",
    },
    {
      type: "code",
      language: "typescript",
      caption: "Branching on vehicle type",
      code: `class ParkingLot {
  parkVehicle(vehicle: { type: string }): boolean {
    if (vehicle.type === "car") {
      return this.findSpotBySize("regular") !== null;
    } else if (vehicle.type === "motorcycle") {
      return this.findSpotBySize("compact") !== null;
    } else if (vehicle.type === "truck") {
      return this.findSpotBySize("large") !== null;
    }
    return false;
  }

  private findSpotBySize(size: string): ParkingSpot | null {
    return null;
  }
}`,
    },
    {
      type: "paragraph",
      text: "Why this fails: every new vehicle type edits ParkingLot. The lot knows implementation details it should not own, and tests must cover every branch.",
    },
    {
      type: "heading",
      level: 3,
      text: "With polymorphism",
    },
    {
      type: "paragraph",
      text: "Each vehicle class implements getRequiredSpotSize(). ParkingLot asks once and searches for a matching spot.",
    },
    {
      type: "code",
      language: "typescript",
      caption: "One call site, many vehicle types",
      code: `enum SpotSize {
  COMPACT,
  REGULAR,
  LARGE,
}

interface Vehicle {
  getRequiredSpotSize(): SpotSize;
}

class Car implements Vehicle {
  getRequiredSpotSize() {
    return SpotSize.REGULAR;
  }
}

class Motorcycle implements Vehicle {
  getRequiredSpotSize() {
    return SpotSize.COMPACT;
  }
}

class Truck implements Vehicle {
  getRequiredSpotSize() {
    return SpotSize.LARGE;
  }
}

class ParkingLot {
  parkVehicle(vehicle: Vehicle): boolean {
    const size = vehicle.getRequiredSpotSize();
    return this.findSpotBySize(size) !== null;
  }

  private findSpotBySize(size: SpotSize): ParkingSpot | null {
    return null;
  }
}`,
    },
    {
      type: "paragraph",
      text: "What improves: add Bus implements Vehicle and ParkingLot never changes. The lot depends on getRequiredSpotSize(), not on string literals or instanceof checks.",
    },
    {
      type: "diagram",
      id: "polymorphism-switch",
      caption:
        "Left: every new vehicle type edits the branch. Right: new type = new class, same caller.",
    },

    {
      type: "heading",
      level: 2,
      id: "tradeoffs",
      text: "Tradeoffs in interviews",
    },
    {
      type: "paragraph",
      text: "Highly polymorphic code can be harder to trace when debugging — the implementation that runs is not obvious from the call site alone. Some teams prefer explicit branches for two or three fixed types. In interviews, be ready to explain the tradeoff: polymorphism buys extensibility; branches can be simpler when types rarely change.",
    },
    {
      type: "list",
      items: [
        "Use polymorphism when behavior varies by type and new types are likely",
        "Growing if/else or switch on type is a smell — consider an interface",
        "If you only ever have two fixed cases, a branch may be fine — say so out loud",
      ],
    },

    {
      type: "heading",
      level: 2,
      id: "putting-it-together",
      text: "Putting OOP together",
    },
    {
      type: "paragraph",
      text: "You do not need to recite these terms in an interview. What matters is how you design when requirements arrive.",
    },
    {
      type: "list",
      items: [
        "Encapsulation — hide state, expose behavior; keep fields private",
        "Abstraction — define interfaces where behavior varies (payments, notifications, storage)",
        "Polymorphism — let objects handle themselves; avoid type-check chains",
        "Inheritance — share stable implementation; default to composition when behavior diverges",
      ],
    },
    {
      type: "paragraph",
      text: "The concepts show through in your class diagram and method names — not in vocabulary. When you see \"support multiple payment methods,\" reach for an interface. When you see yourself writing type checks, reach for polymorphism.",
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
        "Keeping if/else chains after introducing an interface — half-migrated design",
        "Using instanceof everywhere instead of trusting the shared contract",
        "Breaking substitutability — a subclass that throws on a method the parent supports",
      ],
    },

    { type: "divider" },
    {
      type: "quiz",
      title: "Quiz",
      anchorId: "quiz",
      questions: [
        {
          question: "What is polymorphism?",
          options: [
            "Copying a class into multiple files",
            "Same call site, different behavior depending on the actual object",
            "Making every method static",
            "Hiding all methods behind private fields",
          ],
          correctIndex: 1,
          explanation:
            "The caller invokes one method; the runtime runs the implementation on the real object.",
        },
        {
          question: "Why replace vehicle.type string checks with a Vehicle interface?",
          options: [
            "Interfaces compile faster",
            "New vehicle types plug in without editing ParkingLot",
            "TypeScript cannot compile switch statements",
            "Parking lots require enums by default",
          ],
          correctIndex: 1,
          explanation:
            "Polymorphism lets you extend via new classes instead of growing branch logic.",
        },
        {
          question: "What does vehicle.getRequiredSpotSize() rely on at runtime?",
          options: [
            "A global variable set at startup",
            "Dispatch to the implementation on the concrete vehicle object",
            "The compiler picking the largest spot",
            "A separate if block for each vehicle class inside ParkingLot",
          ],
          correctIndex: 1,
          explanation:
            "The lot calls one method name; Truck's version runs for trucks.",
        },
        {
          question: "Which smell suggests you need polymorphism?",
          options: [
            "A class with one method",
            "Growing chains of if/else or switch on type strings",
            "Private fields on a data class",
            "A function shorter than ten lines",
          ],
          correctIndex: 1,
          explanation:
            "Repeated branching on type means callers should use a shared contract instead.",
        },
      ],
    },
  ],
  keyTakeaways: [
    "Polymorphism = one call site, many implementations.",
    "Replace type branching with interfaces when behavior varies by type.",
    "Be ready to discuss extensibility versus traceability in interviews.",
  ],
  panelSummary:
    "Polymorphism allows objects of different types to be treated through the same interface — the right behavior is chosen at runtime.",
  panelKeyPoints: [
    "Write code against interfaces, not concrete classes",
    "Extend behavior without modifying existing callers",
    "Core to plugin architectures and strategy patterns",
  ],
};
