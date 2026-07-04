export type SimComponentType =
  // Core
  | "client"
  | "api_gateway"
  | "load_balancer"
  | "web_server"
  | "app_server"
  | "reverse_proxy"
  | "rate_limiter"
  // Storage
  | "sql_database"
  | "nosql_database"
  | "object_storage"
  | "search_index"
  | "graph_database"
  | "time_series_db"
  | "data_lake"
  | "data_warehouse"
  // Caching
  | "redis_cache"
  | "cdn"
  | "local_cache"
  | "distributed_cache"
  // Messaging
  | "message_queue"
  | "event_bus"
  | "pub_sub"
  | "stream_processor"
  | "websocket_server"
  | "notification_service"
  // Infrastructure
  | "dns"
  | "service_mesh"
  | "kubernetes"
  | "firewall"
  | "secrets_manager"
  | "service_registry"
  // Observability
  | "metrics_collector"
  | "log_aggregator"
  | "distributed_tracing"
  | "alerting"
  | "health_check"
  | "status_page";

export type ComponentCategory =
  | "core"
  | "storage"
  | "caching"
  | "messaging"
  | "infrastructure"
  | "observability";

export type SimHealth = "healthy" | "degraded" | "failing" | "down";

export type EdgeProtocol = "http" | "grpc" | "tcp" | "websocket" | "async";

export interface SimNode {
  id: string;
  type: SimComponentType;
  label: string;
  position: { x: number; y: number };
  config: Record<string, string | number | boolean>;
  /** If true, node participates in simulation but is not rendered on canvas */
  hidden?: boolean;
}

export interface SimEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  protocol: EdgeProtocol;
  config: {
    bandwidthMbps: number;
    latencyMs: number;
    encrypted: boolean;
  };
}

export interface SimDesign {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  nodes: SimNode[];
  edges: SimEdge[];
  simulation: {
    tickRateMs: number;
    timeScale: number;
  };
  /** Guided learning scenario tied to this design */
  scenarioId?: string;
  /** Self-attempt challenge with pass/fail checks */
  challengeId?: string;
  /** Origin of this design */
  projectKind?: "guided" | "challenge" | "free";
  /** Evolving guided course */
  courseId?: string;
  courseMilestoneId?: string;
  /** Saved course progress for resume / reset */
  courseProgress?: import("./courses/types").CourseProgress;
}

export interface RuntimeMetrics {
  currentRps: number;
  totalRequests: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  health: SimHealth;
  errorRate: number;
  cpuPercent: number;
  memoryPercent: number;
  queueDepth: number;
  activeConnections: number;
  rpsHistory: number[];
  latencyHistory: number[];
  errorHistory: number[];
  diagnosisReason: string;
  diagnosisSuggestion: string;
}

export interface ConfigFieldDef {
  key: string;
  label: string;
  type: "number" | "boolean" | "select";
  default: string | number | boolean;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  group?: string;
}

export type ArchLayer =
  | "client_layer"
  | "edge_layer"
  | "gateway_layer"
  | "service_layer"
  | "data_layer"
  | "async_layer"
  | "infra_layer"
  | "observability_layer";

export interface ComponentDef {
  type: SimComponentType;
  label: string;
  category: ComponentCategory;
  description: string;
  layer: ArchLayer;
  /** One-sentence explanation for absolute beginners */
  explain: string;
  /** Real-world analogy everyone can relate to */
  analogy: string;
  /** When you'd use this in a real system */
  whenToUse: string;
  /** Common pitfalls and trade-offs */
  tradeoffs: string[];
  configFields: ConfigFieldDef[];
  defaultConfig: Record<string, string | number | boolean>;
  isTrafficSource?: boolean;
}

export interface CategoryDef {
  id: ComponentCategory;
  label: string;
  types: SimComponentType[];
}

export interface DesignSummary {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  nodeCount: number;
  edgeCount: number;
  scenarioId?: string;
  challengeId?: string;
  projectKind?: "guided" | "challenge" | "free";
  courseId?: string;
  courseMilestoneId?: string;
  completedMilestoneCount?: number;
  totalMilestoneCount?: number;
}

export const DEFAULT_EDGE_CONFIG: SimEdge["config"] = {
  bandwidthMbps: 1000,
  latencyMs: 1,
  encrypted: false,
};

export function createDesign(name: string, description = ""): SimDesign {
  return {
    id: crypto.randomUUID(),
    name,
    description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: [],
    edges: [],
    simulation: { tickRateMs: 100, timeScale: 1 },
  };
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}
