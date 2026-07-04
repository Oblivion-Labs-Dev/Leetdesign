import type { LearnLesson } from "@/types/learn";

export const lspLesson: LearnLesson = {
  slug: "liskov-substitution",
  trackSlug: "solid",
  title: "Liskov Substitution",
  subtitle: "",
  heroImage: "/Concepts/LSP.png",
  readMinutes: 7,
  difficulty: "beginner",
  tableOfContents: [
    { id: "what-is-lsp", label: "What is LSP?" },
    { id: "red-flags", label: "Red flags in code" },
    { id: "refuel-example", label: "Example: refueling the fleet" },
    { id: "move-example", label: "Example: vehicles that move" },
    { id: "common-mistakes", label: "Common mistakes" },
    { id: "quiz", label: "Quiz" },
  ],
  objectives: [
    "Define LSP and explain substitutability for callers of a base type",
    "Spot subclasses that throw or force instanceof checks",
    "Refactor hierarchies so subtypes honor the parent contract",
  ],
  blocks: [
    {
      type: "heading",
      level: 2,
      id: "what-is-lsp",
      text: "What is LSP?",
    },
    {
      type: "paragraph",
      text: "The Liskov Substitution Principle says subtypes must work wherever the base type works. If code accepts MotorVehicle, every motor vehicle you pass in should behave the way callers assume — without special cases.",
    },
    {
      type: "paragraph",
      text: "Subclasses can add behavior, but they cannot remove or break behavior the parent promised. When a subclass throws for a method the parent provides, that is a red flag. If callers need if (vehicle instanceof ElectricCar), the hierarchy lied about the contract.",
    },
    {
      type: "diagram",
      id: "lsp-broken-substitute",
      caption:
        "Code expects every MotorVehicle to refuel — ElectricCar throws instead.",
    },

    {
      type: "heading",
      level: 2,
      id: "red-flags",
      text: "Red flags in code",
    },
    {
      type: "list",
      items: [
        "Override throws UnsupportedOperationException or similar",
        "Callers add instanceof before calling a parent method",
        "Empty or no-op overrides because the subclass does not support the operation",
      ],
    },
    {
      type: "paragraph",
      text: "In interviews, think carefully about what belongs in the base class versus a narrower interface. Not every bird flies — put fly() on FlyingBird, not on Bird.",
    },

    {
      type: "heading",
      level: 2,
      id: "refuel-example",
      text: "Example: refueling the fleet",
    },
    {
      type: "heading",
      level: 3,
      text: "Broken substitution",
    },
    {
      type: "paragraph",
      text: "ElectricCar extends MotorVehicle. refuel throws — charging is different, but fleet code was written against MotorVehicle.",
    },
    {
      type: "code",
      language: "typescript",
      caption: "ElectricCar inherits MotorVehicle but breaks refuel()",
      code: `class MotorVehicle {
  refuel(liters: number) {
    console.log(\`Added \${liters}L\`);
  }
}

class ElectricCar extends MotorVehicle {
  refuel() {
    throw new Error("Use charge() instead");
  }
}

function refuelFleet(vehicles: MotorVehicle[]) {
  for (const vehicle of vehicles) {
    vehicle.refuel(40);
  }
}

refuelFleet([new MotorVehicle(), new ElectricCar()]); // throws`,
    },
    {
      type: "paragraph",
      text: "Why this fails: refuelFleet trusts every MotorVehicle to accept fuel. ElectricCar is a MotorVehicle in the type system but not in behavior.",
    },
    {
      type: "heading",
      level: 3,
      text: "Honest modeling",
    },
    {
      type: "paragraph",
      text: "Share move() on Vehicle. Put refuel() only on Refuelable types.",
    },
    {
      type: "code",
      language: "typescript",
      caption: "Refuel only where it applies",
      code: `interface Vehicle {
  move(): void;
}

interface Refuelable {
  refuel(liters: number): void;
}

class PetrolCar implements Vehicle, Refuelable {
  move() { console.log("driving"); }
  refuel(liters: number) { console.log(\`Added \${liters}L\`); }
}

class ElectricCar implements Vehicle {
  move() { console.log("driving electric"); }
  charge(kWh: number) { console.log(\`Charged \${kWh} kWh\`); }
}

function refuelFleet(vehicles: Refuelable[]) {
  for (const vehicle of vehicles) {
    vehicle.refuel(40);
  }
}`,
    },
    {
      type: "paragraph",
      text: "What improves: refuelFleet only accepts Refuelable vehicles. No instanceof checks. ElectricCar is not passed where fuel rules apply.",
    },
    {
      type: "diagram",
      id: "lsp-honest-types",
      caption:
        "Car and Bicycle share Vehicle — refuel stays on types that actually need it.",
    },

    {
      type: "heading",
      level: 2,
      id: "move-example",
      text: "Example: vehicles that move",
    },
    {
      type: "heading",
      level: 3,
      text: "Broken substitution",
    },
    {
      type: "paragraph",
      text: "Bicycle extends MotorVehicle but has no engine. dispatch() calls startEngine() on every motor vehicle.",
    },
    {
      type: "code",
      language: "typescript",
      caption: "Subclass throws where callers expect an engine",
      code: `class MotorVehicle {
  startEngine() {
    console.log("engine on");
  }
}

class Bicycle extends MotorVehicle {
  startEngine() {
    throw new Error("Bicycles have no engine");
  }
}

function dispatch(vehicles: MotorVehicle[]) {
  for (const vehicle of vehicles) {
    vehicle.startEngine();
  }
}`,
    },
    {
      type: "paragraph",
      text: "Why this fails: dispatch trusts every MotorVehicle to start an engine. Bicycle forces runtime errors or defensive instanceof — a sign the model is wrong.",
    },
    {
      type: "heading",
      level: 3,
      text: "Honest modeling",
    },
    {
      type: "code",
      language: "typescript",
      caption: "Shared move() — no throw in a loop",
      code: `interface Vehicle {
  move(): void;
}

class Car implements Vehicle {
  move() { console.log("driving"); }
}

class Bicycle implements Vehicle {
  move() { console.log("pedaling"); }
}

function sendOnRoute(vehicles: Vehicle[]) {
  for (const vehicle of vehicles) {
    vehicle.move();
  }
}`,
    },
    {
      type: "paragraph",
      text: "What improves: sendOnRoute works for every Vehicle without special cases. An engine is not promised where one does not exist.",
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
        "Putting methods on the base class that only some subclasses support",
        "Fixing LSP violations with instanceof instead of fixing the model",
        "Subclassing for reuse when the child is not really a subtype",
      ],
    },

    { type: "divider" },
    {
      type: "quiz",
      title: "Quiz",
      anchorId: "quiz",
      questions: [
        {
          question: "What does Liskov Substitution require?",
          options: [
            "Every class must extend a base class",
            "Subtypes must work wherever their parent type is expected",
            "Subclasses must have more methods than the parent",
            "All fields must be public",
          ],
          correctIndex: 1,
          explanation:
            "Callers should not need special knowledge of the concrete subtype.",
        },
        {
          question: "Which is a red flag for LSP violations?",
          options: [
            "Private fields on a base class",
            "Subclass override that throws for a method callers expect to succeed",
            "Using interfaces instead of classes",
            "Short method names",
          ],
          correctIndex: 1,
          explanation:
            "Throwing in an override means the subtype broke the parent contract.",
        },
        {
          question: "What symptom suggests LSP was violated?",
          options: [
            "Too many private methods",
            "instanceof checks before calling a parent method",
            "Constructor injection",
            "Immutable fields",
          ],
          correctIndex: 1,
          explanation:
            "Defensive type checks mean the hierarchy lied about substitutability.",
        },
        {
          question: "How should refuel be modeled for electric cars?",
          options: [
            "ElectricCar extends MotorVehicle and refuel() throws",
            "Refuelable interface — electric cars implement Vehicle only",
            "Remove ElectricCar from the program",
            "Make refuel() return null",
          ],
          correctIndex: 1,
          explanation:
            "Do not promise refuel on types that cannot honor it.",
        },
      ],
    },
  ],
  keyTakeaways: [
    "Subtypes must honor the contract callers learned from the parent.",
    "Throws and instanceof checks signal a modeling mistake.",
    "Put operations on the narrowest interface that supports them.",
  ],
  panelSummary:
    "Subtypes must be substitutable for their base types without breaking correctness.",
  panelKeyPoints: [
    "Subclasses cannot break parent expectations",
    "Throws and instanceof are red flags",
    "Split interfaces when not all subtypes support an operation",
  ],
};
