/**
 * Dependency settings on Application Server → downstream connections.
 * @see docs/COMPONENT-MODEL.md
 */

import type { SimComponentType, SimEdge, SimNode, RuntimeMetrics } from "./types";

export type DependencyKind = "database" | "cache" | "queue" | "external";

export type SyncMode = "sync" | "async";
export type RetryPolicy = "none" | "conservative" | "aggressive";
export type QueueDeliveryFailure = "drop" | "retry" | "fail_request";
export type ExternalRequired = "required" | "optional";
export type ExternalExecution = "sequential" | "parallel";

const DB_TYPES: ReadonlySet<SimComponentType> = new Set([
  "sql_database",
  "nosql_database",
  "graph_database",
  "time_series_db",
  "data_warehouse",
  "search_index",
]);

const CACHE_TYPES: ReadonlySet<SimComponentType> = new Set([
  "redis_cache",
  "local_cache",
  "distributed_cache",
]);

const QUEUE_TYPES: ReadonlySet<SimComponentType> = new Set([
  "message_queue",
  "event_bus",
  "pub_sub",
]);

const EXTERNAL_TYPES: ReadonlySet<SimComponentType> = new Set([
  "object_storage",
  "notification_service",
]);

export function getDependencyKind(targetType: SimComponentType): DependencyKind | null {
  if (DB_TYPES.has(targetType)) return "database";
  if (CACHE_TYPES.has(targetType)) return "cache";
  if (QUEUE_TYPES.has(targetType)) return "queue";
  if (EXTERNAL_TYPES.has(targetType)) return "external";
  return null;
}

export function isAppServerDependencyEdge(sourceType: SimComponentType, targetType: SimComponentType): boolean {
  return sourceType === "app_server" && getDependencyKind(targetType) !== null;
}

export interface DatabaseDepConfig {
  kind: "database";
  queriesPerRequest: number;
  syncMode: SyncMode;
  requiredForSuccess: boolean;
  retryPolicy: RetryPolicy;
  timeoutMs: number;
  readWriteSplit: boolean;
}

export interface CacheDepConfig {
  kind: "cache";
  lookupsPerRequest: number;
  cacheHitRate: number;
  syncMode: SyncMode;
  requiredForSuccess: boolean;
}

export interface QueueDepConfig {
  kind: "queue";
  eventsPerCompletedRequest: number;
  syncAckRequired: boolean;
  retryPolicy: RetryPolicy;
  deliveryFailureBehavior: QueueDeliveryFailure;
}

export interface ExternalDepConfig {
  kind: "external";
  callsPerRequest: number;
  required: ExternalRequired;
  execution: ExternalExecution;
  timeoutMs: number;
  retryPolicy: RetryPolicy;
}

export type DependencyConfig = DatabaseDepConfig | CacheDepConfig | QueueDepConfig | ExternalDepConfig;

function str(raw: Record<string, string | number | boolean>, key: string, fallback: string): string {
  const v = raw[key];
  return typeof v === "string" ? v : fallback;
}

function num(raw: Record<string, string | number | boolean>, key: string, fallback: number): number {
  const v = raw[key];
  return typeof v === "number" ? v : fallback;
}

function bool(raw: Record<string, string | number | boolean>, key: string, fallback: boolean): boolean {
  const v = raw[key];
  return typeof v === "boolean" ? v : fallback;
}

export function deriveBaseLatencyForNode(node: SimNode): number {
  if (node.type === "app_server") return 20;
  const c = node.config;
  switch (node.type) {
    case "sql_database": return (c.avgQueryTimeMs as number) ?? 5;
    case "nosql_database": return (c.avgQueryTimeMs as number) ?? 3;
    case "search_index": return (c.avgQueryTimeMs as number) ?? 15;
    case "redis_cache":
    case "local_cache":
    case "distributed_cache": return 1;
    case "message_queue":
    case "event_bus":
    case "pub_sub": return 2;
    case "object_storage": return (c.avgLatencyMs as number) ?? 50;
    case "notification_service": return 5;
    default: return 5;
  }
}

export function defaultDependencyConfig(targetType: SimComponentType): Record<string, string | number | boolean> {
  const kind = getDependencyKind(targetType);
  if (!kind) return {};

  switch (kind) {
    case "database":
      return {
        depKind: "database",
        queriesPerRequest: 1,
        syncMode: "sync",
        requiredForSuccess: true,
        retryPolicy: "none",
        timeoutMs: 5000,
        readWriteSplit: false,
      };
    case "cache":
      return {
        depKind: "cache",
        lookupsPerRequest: 1,
        cacheHitRate: 0.8,
        syncMode: "sync",
        requiredForSuccess: false,
      };
    case "queue":
      return {
        depKind: "queue",
        eventsPerCompletedRequest: 1,
        syncAckRequired: false,
        retryPolicy: "none",
        deliveryFailureBehavior: "drop",
      };
    case "external":
      return {
        depKind: "external",
        callsPerRequest: 1,
        required: "optional",
        execution: "sequential",
        timeoutMs: 3000,
        retryPolicy: "none",
      };
  }
}

export function parseDependencyConfig(
  edge: SimEdge,
  targetType: SimComponentType,
): DependencyConfig | null {
  const kind = getDependencyKind(targetType);
  if (!kind) return null;
  const c = edge.config as Record<string, string | number | boolean>;

  switch (kind) {
    case "database":
      return {
        kind: "database",
        queriesPerRequest: Math.max(0, num(c, "queriesPerRequest", 1)),
        syncMode: str(c, "syncMode", "sync") as SyncMode,
        requiredForSuccess: bool(c, "requiredForSuccess", true),
        retryPolicy: str(c, "retryPolicy", "none") as RetryPolicy,
        timeoutMs: Math.max(1, num(c, "timeoutMs", 5000)),
        readWriteSplit: bool(c, "readWriteSplit", false),
      };
    case "cache":
      return {
        kind: "cache",
        lookupsPerRequest: Math.max(0, num(c, "lookupsPerRequest", 1)),
        cacheHitRate: Math.min(1, Math.max(0, num(c, "cacheHitRate", 0.8))),
        syncMode: str(c, "syncMode", "sync") as SyncMode,
        requiredForSuccess: bool(c, "requiredForSuccess", false),
      };
    case "queue":
      return {
        kind: "queue",
        eventsPerCompletedRequest: Math.max(0, num(c, "eventsPerCompletedRequest", 1)),
        syncAckRequired: bool(c, "syncAckRequired", false),
        retryPolicy: str(c, "retryPolicy", "none") as RetryPolicy,
        deliveryFailureBehavior: str(c, "deliveryFailureBehavior", "drop") as QueueDeliveryFailure,
      };
    case "external":
      return {
        kind: "external",
        callsPerRequest: Math.max(0, num(c, "callsPerRequest", 1)),
        required: str(c, "required", "optional") as ExternalRequired,
        execution: str(c, "execution", "sequential") as ExternalExecution,
        timeoutMs: Math.max(1, num(c, "timeoutMs", 3000)),
        retryPolicy: str(c, "retryPolicy", "none") as RetryPolicy,
      };
  }
}

function retryDelayMs(policy: RetryPolicy): number {
  switch (policy) {
    case "conservative": return 25;
    case "aggressive": return 50;
    default: return 0;
  }
}

function retryAttempts(policy: RetryPolicy): number {
  switch (policy) {
    case "conservative": return 1;
    case "aggressive": return 2;
    default: return 0;
  }
}

/** Latency contribution from one synchronous dependency edge */
export function syncDependencyLatencyMs(
  dep: DependencyConfig,
  targetNode: SimNode,
  targetMetrics: RuntimeMetrics | undefined,
): { syncMs: number; retryMs: number; queueBlockMs: number } {
  const baseLatency = targetMetrics?.avgLatencyMs ?? deriveBaseLatencyForNode(targetNode);

  switch (dep.kind) {
    case "database": {
      if (dep.syncMode !== "sync" || dep.queriesPerRequest <= 0) {
        return { syncMs: 0, retryMs: 0, queueBlockMs: 0 };
      }
      const perQuery = Math.min(
        dep.timeoutMs,
        baseLatency > 10_000 ? dep.timeoutMs : baseLatency,
      );
      const attempts = 1 + retryAttempts(dep.retryPolicy);
      const syncMs = dep.queriesPerRequest * perQuery * attempts;
      const retryMs = dep.queriesPerRequest * retryDelayMs(dep.retryPolicy) * retryAttempts(dep.retryPolicy);
      return { syncMs, retryMs, queueBlockMs: 0 };
    }
    case "cache": {
      if (dep.syncMode !== "sync" || dep.lookupsPerRequest <= 0) {
        return { syncMs: 0, retryMs: 0, queueBlockMs: 0 };
      }
      const missPenalty = baseLatency * (1 - dep.cacheHitRate);
      const syncMs = dep.lookupsPerRequest * (1 + missPenalty);
      return { syncMs, retryMs: 0, queueBlockMs: 0 };
    }
    case "queue": {
      if (!dep.syncAckRequired || dep.eventsPerCompletedRequest <= 0) {
        return { syncMs: 0, retryMs: 0, queueBlockMs: 0 };
      }
      const blockMs = dep.eventsPerCompletedRequest * baseLatency;
      return { syncMs: 0, retryMs: 0, queueBlockMs: blockMs };
    }
    case "external": {
      if (dep.execution === "parallel" && dep.callsPerRequest > 1) {
        const perCall = Math.min(dep.timeoutMs, baseLatency);
        return { syncMs: perCall, retryMs: retryDelayMs(dep.retryPolicy), queueBlockMs: 0 };
      }
      if (dep.callsPerRequest <= 0) return { syncMs: 0, retryMs: 0, queueBlockMs: 0 };
      const perCall = Math.min(dep.timeoutMs, baseLatency);
      const attempts = 1 + retryAttempts(dep.retryPolicy);
      const syncMs = dep.callsPerRequest * perCall * attempts;
      const retryMs = dep.callsPerRequest * retryDelayMs(dep.retryPolicy) * retryAttempts(dep.retryPolicy);
      return { syncMs, retryMs, queueBlockMs: 0 };
    }
  }
}

/** Multiplier for downstream RPS on this edge (processing rate for sync deps, completed for async queue) */
export function edgeDownstreamMultiplier(
  dep: DependencyConfig,
  useCompletedRate: boolean,
): number {
  switch (dep.kind) {
    case "database":
      return dep.queriesPerRequest;
    case "cache":
      return dep.lookupsPerRequest;
    case "queue":
      return useCompletedRate ? dep.eventsPerCompletedRequest : 0;
    case "external":
      return dep.callsPerRequest;
  }
}

export interface DependencySummary {
  edgeId: string;
  targetId: string;
  targetLabel: string;
  targetType: SimComponentType;
  summary: string;
}

export function summarizeDependencyEdge(
  edge: SimEdge,
  target: SimNode,
): DependencySummary | null {
  const dep = parseDependencyConfig(edge, target.type);
  if (!dep) return null;

  let summary = "";
  switch (dep.kind) {
    case "database":
      summary = `${dep.queriesPerRequest} ${dep.syncMode} ${dep.queriesPerRequest === 1 ? "query" : "queries"} / request`;
      break;
    case "cache":
      summary = `${dep.lookupsPerRequest} lookup${dep.lookupsPerRequest === 1 ? "" : "s"} / request · ${Math.round(dep.cacheHitRate * 100)}% hit rate`;
      break;
    case "queue":
      summary = `${dep.eventsPerCompletedRequest} event${dep.eventsPerCompletedRequest === 1 ? "" : "s"} / completed request`;
      if (dep.syncAckRequired) summary += " · sync ack";
      break;
    case "external":
      summary = `${dep.callsPerRequest} call${dep.callsPerRequest === 1 ? "" : "s"} / request · ${dep.required}`;
      break;
  }

  return {
    edgeId: edge.id,
    targetId: target.id,
    targetLabel: target.label,
    targetType: target.type,
    summary,
  };
}

export function dependencyConfigToStorage(
  patch: Record<string, string | number | boolean>,
): Record<string, string | number | boolean> {
  return patch;
}
