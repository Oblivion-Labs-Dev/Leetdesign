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
    /** Load balancer weighted routing — relative share to this backend */
    weight: number;
    /** Application Server → downstream dependency settings */
    [key: string]: string | number | boolean;
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
  /** 0–100% of derived capacity — drives the load bar on canvas nodes */
  utilizationPercent: number;
  cpuPercent: number;
  memoryPercent: number;
  queueDepth: number;
  activeConnections: number;
  rpsHistory: number[];
  latencyHistory: number[];
  errorHistory: number[];
  diagnosisReason: string;
  diagnosisSuggestion: string;
  /** Application Server: RPS completed successfully */
  completedRps?: number;
  /** Application Server: derived total capacity (read-only) */
  totalCapacityRps?: number;
  /** Application Server: replica count for node card */
  instanceCount?: number;
  /** Application Server: instances actually receiving traffic */
  effectiveInstanceCount?: number;
  /** Application Server: in-flight request count */
  activeRequests?: number;
  /** Application Server: capacity derivation breakdown for UI */
  derivedCapacityBreakdown?: {
    maxConcurrentPerInstance: number;
    effectiveInstanceCount: number;
    effectiveRequestTimeMs: number;
    capacityPerInstanceRps: number;
  };
  /** Application Server pool: healthy replicas (≤ configuredInstanceCount) */
  healthyInstanceCount?: number;
  /** Application Server pool: incoming RPS ÷ healthy instances */
  perInstanceRps?: number;
  /** Application Server pool: derived capacity per healthy instance */
  derivedCapacityPerInstanceRps?: number;
  /** Application Server pool: healthy instances × derived capacity per instance */
  poolCapacityRps?: number;
  /** Application Server pool: incoming ÷ pool capacity (0–100) */
  poolUtilizationPercent?: number;
  /** Load Balancer: traffic distribution snapshot */
  loadBalancerDistribution?: {
    incomingRps: number;
    healthyTargetPools: number;
    algorithm: string;
    distributions: Array<{
      targetId: string;
      label: string;
      rps: number;
      percent: number;
      healthy: boolean;
    }>;
  };
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

/**
 * How a component routes traffic downstream in the simulation engine.
 * - split: divides incoming traffic evenly among downstream targets (LB, API Gateway)
 * - filter: absorbs a fraction (hit rate), forwards the rest (Cache, CDN)
 * - throttle: caps traffic at a configured limit, drops excess (Rate Limiter)
 * - buffer: absorbs bursts into a queue, drains at consumer rate (Message Queue)
 * - passthrough: processes traffic and responds; does NOT forward unless wired (App Server, DB)
 * - source: generates traffic (Client)
 * - none: does not participate in traffic simulation (observability, infra)
 */
export type RoutingBehavior =
  | "split"
  | "filter"
  | "throttle"
  | "buffer"
  | "passthrough"
  | "source"
  | "none";

export interface ComponentDef {
  type: SimComponentType;
  label: string;
  category: ComponentCategory;
  description: string;
  layer: ArchLayer;
  routingBehavior: RoutingBehavior;
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
  weight: 1,
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
