import type { SimComponentType, EdgeProtocol, SimDesign } from "../types";
import { uid } from "../types";
import { COMPONENT_REGISTRY } from "../component-registry";
import { suggestEdgeProtocol } from "../traffic-contracts";
import type { AcceptanceCriteria } from "../evaluator";

export type LearningMode = "beginner" | "interview" | "sandbox";

export type MilestonePhase =
  | "product_update"
  | "run_simulation"
  | "observe"
  | "failure"
  | "reflection"
  | "suggested_solution"
  | "learner_action"
  | "run_after"
  | "tradeoffs"
  | "complete";

/** Persisted course progress saved on SimDesign */
export interface CourseProgress {
  courseId: string;
  milestoneId: string;
  phase: MilestonePhase;
  completedMilestoneIds: string[];
  reflectionCorrect: boolean | null;
  failureObserved: boolean;
  simulationRuns: number;
  afterSimRuns: number;
}

export interface SimulationMetricsSnapshot {
  label?: string;
  p95LatencyMs: number;
  errorRate: number;
  dbCpuPercent?: number;
  cacheHitRate?: number;
  totalRps?: number;
  description?: string;
}

export interface SnapshotNode {
  type: SimComponentType;
  label: string;
  x: number;
  y: number;
  config?: Record<string, string | number | boolean>;
  /** If true, node exists in simulation but is invisible on canvas */
  hidden?: boolean;
}

export interface SnapshotEdge {
  sourceLabel: string;
  targetLabel: string;
  protocol?: EdgeProtocol;
}

export interface ArchitectureSnapshot {
  nodes: SnapshotNode[];
  edges: SnapshotEdge[];
  /** Client traffic — requests per second */
  trafficRps?: number;
}

export interface ReflectionQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface TradeoffSet {
  improved: string[];
  harder: string[];
  doesNotSolve: string[];
}

export interface CourseMilestone {
  id: string;
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  milestoneIndex: number;
  milestoneCount: number;
  title: string;
  productUpdate: string;
  userProblem: string;
  goal: string;
  task: string;
  architecture: ArchitectureSnapshot;
  expectsFailure?: boolean;
  failureDescription?: string;
  bottleneckNodeLabel?: string;
  reflectionQuestion?: ReflectionQuestion;
  suggestedComponent?: SimComponentType;
  suggestedComponentHint?: string;
  /** Labels describing expected wiring, e.g. "Shoppers → Load Balancer" */
  expectedConnections?: string[];
  beforeMetrics: SimulationMetricsSnapshot;
  afterMetrics?: SimulationMetricsSnapshot;
  tradeoffs: TradeoffSet;
  evolutionLabel: string;
  checklist: string[];
  /** Runtime metric-based acceptance criteria — replaces static architecture checks */
  acceptanceCriteria?: AcceptanceCriteria;
  /** @deprecated Use acceptanceCriteria instead. Kept for backward compat during migration. */
  validateArchitecture?: (design: SimDesign) => boolean;
}

export interface CourseChapter {
  id: string;
  number: number;
  title: string;
  summary: string;
  milestones: CourseMilestone[];
}

export interface CourseDef {
  id: string;
  title: string;
  subtitle: string;
  chapters: CourseChapter[];
}

export function getAllMilestones(course: CourseDef): CourseMilestone[] {
  return course.chapters.flatMap((c) => c.milestones);
}

export function getMilestoneById(course: CourseDef, id: string): CourseMilestone | null {
  return getAllMilestones(course).find((m) => m.id === id) ?? null;
}

export function snapshotToDesign(
  base: SimDesign,
  snapshot: ArchitectureSnapshot,
): SimDesign {
  const labelToId = new Map<string, string>();
  const nodes = snapshot.nodes.map((n) => {
    const id = `${n.type}_${uid()}`;
    labelToId.set(n.label, id);
    const def = COMPONENT_REGISTRY[n.type];
    return {
      id,
      type: n.type,
      label: n.label,
      position: { x: n.x, y: n.y },
      config: { ...def.defaultConfig, ...n.config },
      ...(n.hidden ? { hidden: true } : {}),
    };
  });

  const edges = snapshot.edges
    .map((e) => {
      const source = labelToId.get(e.sourceLabel);
      const target = labelToId.get(e.targetLabel);
      if (!source || !target) return null;
      const sourceNode = nodes.find((n) => n.id === source);
      const targetNode = nodes.find((n) => n.id === target);
      const protocol: EdgeProtocol = e.protocol ?? (
        sourceNode && targetNode
          ? suggestEdgeProtocol(sourceNode.type, targetNode.type)
          : "http"
      );
      return {
        id: `e_${uid()}`,
        source,
        target,
        protocol,
        config: { bandwidthMbps: 1000, latencyMs: 1, encrypted: false, weight: 1 },
      };
    })
    .filter(Boolean) as SimDesign["edges"];

  if (snapshot.trafficRps != null) {
    const client = nodes.find((n) => n.type === "client");
    if (client) {
      const users = 1000;
      client.config = {
        ...client.config,
        activeUsers: users,
        requestsPerUserPerSecond: snapshot.trafficRps / users,
        userActivityPreset: "custom",
        requestsPerSecond: snapshot.trafficRps,
      };
    }
  }

  return {
    ...base,
    nodes,
    edges,
    updatedAt: new Date().toISOString(),
  };
}

/** Phases a milestone goes through, in order */
export function phasesForMilestone(m: CourseMilestone): MilestonePhase[] {
  if (!m.expectsFailure) {
    return ["product_update", "run_simulation", "observe", "tradeoffs", "complete"];
  }
  const phases: MilestonePhase[] = [
    "product_update",
    "run_simulation",
    "failure",
  ];
  if (m.reflectionQuestion) phases.push("reflection");
  phases.push("suggested_solution", "learner_action", "run_after", "tradeoffs", "complete");
  return phases;
}

export function nextPhase(current: MilestonePhase, m: CourseMilestone): MilestonePhase | null {
  const phases = phasesForMilestone(m);
  const i = phases.indexOf(current);
  if (i < 0 || i >= phases.length - 1) return null;
  return phases[i + 1] ?? null;
}
