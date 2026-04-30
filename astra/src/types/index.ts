export type BadgeLevel =
  | "intern"
  | "sde1"
  | "sde2"
  | "senior"
  | "principal";

export interface BadgeMeta {
  id: BadgeLevel;
  title: string;
  shortTitle: string;
  description: string;
  color: string;
  unlockXp: number;
}

export interface UserProfile {
  id: string;
  alias: string;
  fullName: string;
  workEmail: string;
  avatarUrl?: string;
  badge: BadgeLevel;
  xp: number;
  /** In-product currency, branded as "Stardust". */
  stardust: number;
  status?: string | null;
  mood?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  leetcodeUrl?: string | null;
  websiteUrl?: string | null;
  joinedAt: string;
}

export type ComponentType =
  | "client"
  | "load_balancer"
  | "api_gateway"
  | "service"
  | "cache"
  | "database"
  | "object_store"
  | "message_queue"
  | "stream"
  | "search"
  | "cdn"
  | "auth"
  | "scheduler"
  | "worker"
  | "analytics"
  | "monitor";

export interface InventoryComponent {
  id: string;
  type: ComponentType;
  label: string;
  shortDescription: string;
  whenToUse: string;
  tradeoffs: string[];
  iconKey: string;
}

export type SystemHealth = "healthy" | "degraded" | "failing" | "down";

export interface PipelineNode {
  id: string;
  type: ComponentType;
  label: string;
  status: SystemHealth;
  metrics?: {
    rps?: number;
    latencyMs?: number;
    errorRate?: number;
  };
  /** If true, this slot is empty and waits for the user to drop a component */
  isMissingSlot?: boolean;
  /** Acceptable component types when missing */
  acceptedTypes?: ComponentType[];
}

export interface PipelineEdge {
  id: string;
  source: string;
  target: string;
  protocol?: "http" | "grpc" | "tcp" | "async";
  animated?: boolean;
}

export interface PipelineGraph {
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  health: SystemHealth;
}

export type DeliveryStage =
  | "branch_created"
  | "checks_running"
  | "checks_failed"
  | "checks_passed"
  | "conflict_detected"
  | "merge_ready"
  | "merged"
  | "rejected";

export interface DeliveryEvent {
  id: string;
  stage: DeliveryStage;
  label: string;
  detail?: string;
  at: number;
  status: "pending" | "running" | "success" | "fail";
}

export type Difficulty = "intern" | "sde1" | "sde2" | "senior" | "principal";

export interface ProjectDefinition {
  id: string;
  title: string;
  shortTitle: string;
  summary: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
  tags: string[];
  paid: boolean;
  scenarios: string[]; // scenario ids
  cover?: string;
  /**
   * Hello-Interview style briefing — the user-facing problem statement that
   * the simulated journey teaches against. Appears on the project landing
   * page (before "Start project") and on the project transcript page.
   */
  briefing?: ProjectBriefing;
}

export interface ProjectBriefing {
  oneLiner: string;
  /** "What the user can do" — drives the API later. */
  functional: string[];
  /** "How well it has to work" — drives the deep dive sections. */
  nonFunctional: string[];
  /** Domain entities the design pivots around. */
  coreEntities: { name: string; description: string }[];
  /** Public API the system exposes. */
  api: ApiSpec[];
  /** A short paragraph + bullet list describing the high level design. */
  highLevel: { paragraph: string; bullets: string[] };
  /**
   * Each non-functional requirement gets one deep dive — this is where the
   * actual engineering tradeoffs live. Mirrors how Hello-Interview structures
   * answers (Latency / Scale / Availability / Consistency / etc).
   */
  deepDives: { title: string; body: string; takeaways?: string[] }[];
}

export interface ApiSpec {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  body?: Record<string, string>;
  query?: Record<string, string>;
  returns: string;
  notes?: string;
}

export interface ScenarioDefinition {
  id: string;
  projectId: string;
  title: string;
  objective: string;
  storyline: string;
  incident: {
    title: string;
    botMessage: string;
    severity: "low" | "medium" | "high" | "critical";
    symptoms: string[];
  };
  startingGraph: PipelineGraph;
  inventory: string[]; // inventory component ids available for this scenario
  acceptableSolutions: AcceptableSolution[];
  rewardXp: number;
  rewardCurrency: number;
}

// ---------- Project journey schema (Round 4 redesign) ----------

export type JourneyStageKind =
  | "intro"
  | "teach_component"
  | "incident"
  | "code_edit"
  | "ship"
  | "summary";

interface JourneyStageBase {
  id: string;
  kind: JourneyStageKind;
  title: string;
  /** Short tagline shown in stage header */
  subtitle?: string;
  /** What the bot says when this stage starts */
  botMessage?: string;
  /** Optional pipeline mutations applied when this stage starts */
  pipelineMutations?: PipelineMutation[];
  /** Quick trade-offs the bot expands on so the user understands *why*. */
  tradeoffs?: string[];
  /** Back-of-the-envelope numbers shown in the bot panel. */
  napkinMath?: { label: string; calc: string }[];
  /** A short "alternatives we rejected" list so the user thinks broadly. */
  alternatives?: string[];
  /**
   * Human-readable phase this stage belongs to (e.g. "Read scale", "Write
   * scale & durability"). Surfaces in the project progress bar so the user
   * can see exactly where they are inside the journey.
   */
  phase?: string;
}

export interface JourneyIntroStage extends JourneyStageBase {
  kind: "intro";
  what: string; // what the project is
  doing: string; // what the user will do
}

export interface JourneyTeachComponentStage extends JourneyStageBase {
  kind: "teach_component";
  componentId: string; // refers to ALL_COMPONENTS
  story: string; // narrative explaining why we need this component
  whatItIs: string;
  whatItDoes: string;
  /** When the user clicks "Add to system", we run these mutations */
  addMutations: PipelineMutation[];
}

export interface JourneyIncidentStage extends JourneyStageBase {
  kind: "incident";
  severity: "low" | "medium" | "high" | "critical";
  storyline: string;
  symptoms: string[];
  /** Slot id (matches the missing slot in the pipeline) */
  expectedSlotId: string;
  /** Acceptable component types user can drop into the slot */
  acceptedTypes: ComponentType[];
  /** Component id the user is expected to drop (anchored to a teach_component) */
  expectedComponentId: string;
}

export interface JourneyShipStage extends JourneyStageBase {
  kind: "ship";
  branchName: string;
  checks: { id: string; label: string; durationMs: number }[];
}

/**
 * "Write a tiny snippet, commit & merge, watch CI run, and the main pipeline
 * updates with the new component." Triggered after the user drops the right
 * component in the simulated pipeline during an incident.
 */
export interface JourneyCodeEditStage extends JourneyStageBase {
  kind: "code_edit";
  /** Used for narration ("the cache you just wired up...") */
  componentId: string;
  language: "typescript" | "python" | "go" | "javascript";
  fileName: string;
  /** Snippet shown in the editor with `{{cursor}}` placeholder for hints. */
  placeholderCode: string;
  /** Lines that should appear in the snippet for it to be considered "valid" */
  expectedLines?: string[];
  branchName: string;
  checks: { id: string; label: string; durationMs: number }[];
  /** Mutations applied AFTER successful commit & merge (e.g., fill_slot). */
  successMutations: PipelineMutation[];
  rewardXp?: number;
  rewardCurrency?: number;
}

export interface JourneySummaryStage extends JourneyStageBase {
  kind: "summary";
  recap: string[];
  rewardXp: number;
  rewardCurrency: number;
}

export type JourneyStage =
  | JourneyIntroStage
  | JourneyTeachComponentStage
  | JourneyIncidentStage
  | JourneyCodeEditStage
  | JourneyShipStage
  | JourneySummaryStage;

export type PipelineMutation =
  | { kind: "add_node"; node: PipelineNode }
  | {
      kind: "add_missing_slot";
      slot: PipelineNode & { isMissingSlot: true; acceptedTypes: ComponentType[] };
    }
  | { kind: "add_edge"; edge: PipelineEdge }
  | { kind: "fill_slot"; slotId: string; withNode: PipelineNode }
  | { kind: "set_health"; health: SystemHealth }
  | { kind: "remove_node"; nodeId: string }
  | { kind: "remove_edge"; edgeId: string };

export interface ProjectJourney {
  projectId: string;
  startGraph: PipelineGraph;
  inventory: string[]; // baseline inventory ids for whole journey
  stages: JourneyStage[];
}

export interface AcceptableSolution {
  id: string;
  description: string;
  /** Mapping from missingSlot node id -> required component type */
  placements: Record<string, ComponentType>;
}

export interface PracticeExercise {
  id: string;
  projectId?: string;
  title: string;
  prompt: string;
  nfrs: string[];
  inventory: string[];
  rubricHints: string[];
  rewardXp: number;
  rewardCurrency: number;
}

export interface ArchitectureSnapshot {
  exerciseId: string;
  nodes: {
    id: string;
    type: ComponentType;
    name: string;
    purpose?: string;
    config?: Record<string, string | number | boolean>;
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    protocol?: "http" | "grpc" | "tcp" | "async";
  }[];
  notes?: string;
  submittedAt: string;
}

export interface ScoreBreakdown {
  correctness: number;
  reliability: number;
  scalability: number;
  cost: number;
  clarity: number;
  total: number;
}

export interface ReviewVerdict {
  passed: boolean;
  score: ScoreBreakdown;
  strengths: string[];
  gaps: string[];
  recommendedNext?: string;
}

export type TaskStatus =
  | "todo"
  | "in_progress"
  | "committed"
  | "under_review"
  | "done";

export interface TaskboardItem {
  id: string;
  title: string;
  projectId?: string;
  status: TaskStatus;
  owner: string; // alias
  priority: "low" | "med" | "high";
}
