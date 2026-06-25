import type { LearnLesson } from "@/types/learn";

export const srpLesson: LearnLesson = {
  slug: "single-responsibility",
  trackSlug: "solid",
  title: "Single Responsibility",
  subtitle: "",
  heroImage: "/Concepts/SRP.png",
  readMinutes: 7,
  difficulty: "beginner",
  tableOfContents: [
    { id: "solid-context", label: "SOLID in LLD interviews" },
    { id: "what-is-srp", label: "What is SRP?" },
    { id: "report-example", label: "Example: Report class" },
    { id: "when-to-split", label: "When to split" },
    { id: "common-mistakes", label: "Common mistakes" },
    { id: "quiz", label: "Quiz" },
  ],
  objectives: [
    "Define SRP as one reason to change per class",
    "Split a class that mixes content, formatting, and persistence",
    "Apply SRP when the problem calls for it — not as ceremony",
  ],
  blocks: [
    {
      type: "heading",
      level: 2,
      id: "solid-context",
      text: "SOLID in LLD interviews",
    },
    {
      type: "paragraph",
      text: "SOLID principles apply when you are designing classes and their relationships — which is most LLD interview problems. They come from an era of deep inheritance hierarchies in Java and C#. Modern code often favors composition and simpler modules.",
    },
    {
      type: "paragraph",
      text: "Use these principles when the problem calls for them. Do not break KISS by forcing patterns where a straightforward design works. In interviews, explain the reasoning behind your split — that matters more than naming the acronym.",
    },

    {
      type: "heading",
      level: 2,
      id: "what-is-srp",
      text: "What is SRP?",
    },
    {
      type: "paragraph",
      text: "The Single Responsibility Principle says a class should have one reason to change. If a class mixes multiple unrelated concerns, split them. This is the foundation of good class design — each change stays isolated.",
    },
    {
      type: "paragraph",
      text: "Ask: what one part of the business would force me to edit this class? If PDF formatting, file storage, and report content logic all live together, you have three reasons in one file.",
    },
    {
      type: "diagram",
      id: "srp-god-class",
      caption:
        "Report changes when content rules, PDF library, or storage backend change — three reasons in one class.",
    },

    {
      type: "heading",
      level: 2,
      id: "report-example",
      text: "Example: Report class",
    },
    {
      type: "heading",
      level: 3,
      text: "Without SRP",
    },
    {
      type: "paragraph",
      text: "Report generates content, formats PDFs, and writes files — three jobs with three unrelated change triggers.",
    },
    {
      type: "code",
      language: "typescript",
      caption: "Content, PDF, and file I/O in one class",
      code: `class Report {
  generateContent(): string {
    return "Q4 summary";
  }

  printToPdf(content: string): Buffer {
    // PDF library layout, fonts, margins
    return Buffer.from(content);
  }

  saveToFile(content: string, path: string): void {
    fs.writeFileSync(path, content);
  }
}`,
    },
    {
      type: "paragraph",
      text: "Why this fails: when the PDF library changes, you touch Report. When storage moves from disk to S3, you touch Report again. When content rules change, same file. Tests need filesystem and PDF setup just to verify content logic.",
    },
    {
      type: "heading",
      level: 3,
      text: "With SRP",
    },
    {
      type: "paragraph",
      text: "Each class owns one concern. Report only builds content.",
    },
    {
      type: "code",
      language: "typescript",
      caption: "One reason to change per class",
      code: `class Report {
  generateContent(): string {
    return "Q4 summary";
  }
}

class PdfRenderer {
  render(content: string): Buffer {
    // PDF formatting — changes when layout library changes
    return Buffer.from(content);
  }
}

class FileArchiver {
  save(content: string | Buffer, path: string): void {
    fs.writeFileSync(path, content);
  }
}`,
    },
    {
      type: "paragraph",
      text: "What improves: PDF library upgrade → only PdfRenderer. Switch to cloud storage → only FileArchiver. Content rule change → only Report. Each edit is isolated.",
    },
    {
      type: "diagram",
      id: "srp-split",
      caption:
        "Left: one class, three jobs. Right: Report, PdfRenderer, and FileArchiver each change for one reason.",
    },

    {
      type: "heading",
      level: 2,
      id: "when-to-split",
      text: "When to split",
    },
    {
      type: "list",
      items: [
        "Different teams or stakeholders own different parts of the class",
        "Tests need unrelated dependencies (SMTP + database + PDF) for one behavior",
        "You describe the class with \"and\" — it generates and formats and saves",
      ],
    },
    {
      type: "paragraph",
      text: "A thin coordinator that wires Report → PdfRenderer → FileArchiver is fine. SRP is about reasons to change, not counting methods or banning orchestration.",
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
        "Splitting by layer only but keeping unrelated business rules in one service",
        "Creating a class per method — SRP is about change axes, not line count",
        "Over-splitting stable code that never changes independently",
      ],
    },

    { type: "divider" },
    {
      type: "quiz",
      title: "Quiz",
      anchorId: "quiz",
      questions: [
        {
          question: "What does SRP mean in practice?",
          options: [
            "A class may only have one method",
            "A class should have only one reason to change",
            "Every file must be under 100 lines",
            "One class per database table",
          ],
          correctIndex: 1,
          explanation:
            "SRP is about one job and one source of change — not arbitrary size limits.",
        },
        {
          question: "Why is Report with PDF and file I/O a problem?",
          options: [
            "TypeScript cannot import fs and pdf in one file",
            "Unrelated changes force edits to the same class",
            "private fields are not allowed in report classes",
            "PDF files must be generated asynchronously",
          ],
          correctIndex: 1,
          explanation:
            "Content, formatting, and storage each change for different reasons.",
        },
        {
          question: "When the PDF library upgrades, which class should change?",
          options: [
            "Report",
            "PdfRenderer",
            "FileArchiver",
            "All three equally",
          ],
          correctIndex: 1,
          explanation:
            "Formatting concerns stay in PdfRenderer after the split.",
        },
        {
          question: "When should you not force SRP?",
          options: [
            "When a class genuinely has one reason to change",
            "When splitting adds complexity without independent change axes",
            "When designing for an LLD interview",
            "When the class has more than one method",
          ],
          correctIndex: 1,
          explanation:
            "Apply SRP when concerns actually change separately — not as ceremony.",
        },
      ],
    },
  ],
  keyTakeaways: [
    "One class, one reason to change.",
    "Split when content, format, storage, or delivery share one file.",
    "Use SRP when the problem calls for it — keep designs simple.",
  ],
  panelSummary:
    "A class should have only one reason to change — the foundation of focused class design.",
  panelKeyPoints: [
    "Split classes that mix unrelated concerns",
    "Isolated changes are easier to test",
    "Apply when change axes are real, not as ritual",
  ],
};
