export type LearnCalloutVariant = "insight" | "tip" | "warning" | "definition";

export type LearnDiagramId =
  | "encapsulation-vault"
  | "encapsulation-object"
  | "encapsulation-bad-vs-good"
  | "encapsulation-atm"
  | "abstraction-interface"
  | "abstraction-swap"
  | "inheritance-hierarchy"
  | "inheritance-vs-composition"
  | "polymorphism-dispatch"
  | "polymorphism-switch"
  | "srp-god-class"
  | "srp-split"
  | "ocp-core-extends"
  | "ocp-switch-vs-extend"
  | "lsp-broken-substitute"
  | "lsp-honest-types";

export type LearnQuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type LearnBlock =
  | { type: "heading"; level: 2 | 3; text: string; id?: string }
  | { type: "paragraph"; text: string }
  | { type: "highlight"; text: string }
  | {
      type: "callout";
      variant: LearnCalloutVariant;
      title?: string;
      text: string;
    }
  | { type: "list"; ordered?: boolean; items: string[] }
  | {
      type: "image";
      src: string;
      alt: string;
      caption?: string;
    }
  | {
      type: "code";
      language: string;
      code: string;
      caption?: string;
    }
  | {
      type: "animation";
      id: "encapsulation-vault";
      caption?: string;
    }
  | {
      type: "diagram";
      id: LearnDiagramId;
      caption?: string;
    }
  | {
      type: "quiz";
      title?: string;
      anchorId?: string;
      questions: LearnQuizQuestion[];
    }
  | { type: "divider" };

export type LessonTocEntry = {
  id: string;
  label: string;
};

export interface LearnLesson {
  slug: string;
  trackSlug: string;
  title: string;
  subtitle: string;
  readMinutes: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  objectives: string[];
  blocks: LearnBlock[];
  /** Optional override — friendlier labels than raw heading text */
  tableOfContents?: LessonTocEntry[];
  /** Optional hero beside the table of contents — path under /public */
  heroImage?: string;
  keyTakeaways: string[];
  /** Short copy for the concept detail panel */
  panelSummary: string;
  panelKeyPoints: string[];
}

export interface LearnTrack {
  slug: string;
  title: string;
  summary: string;
  tag: string;
  lessonSlugs: string[];
}

export type PathStepStatus = "completed" | "in_progress" | "locked";

export interface LearnPathStep {
  id: string;
  title: string;
  description?: string;
  estMinutes?: number;
  status: PathStepStatus;
  progressPct?: number;
  trackSlug?: string;
  conceptSlugs?: string[];
  /** Previous module title — shown on locked cards */
  unlockAfterTitle?: string;
}

export interface FoundationsRoadmap {
  title: string;
  subtitle: string;
  quote: { text: string; author: string };
  stats: {
    conceptCount: number;
    timeLeft: string;
    progressPct: number;
  };
  steps: LearnPathStep[];
}

export interface LearnRoadmapProgress extends FoundationsRoadmap {
  completedConceptSlugs: string[];
  stats: {
    conceptCount: number;
    completedCount: number;
    timeLeft: string;
    progressPct: number;
  };
  conceptSlugs: string[];
}
