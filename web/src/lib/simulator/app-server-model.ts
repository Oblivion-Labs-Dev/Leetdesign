/**
 * Application Server — admission, queueing, and derived capacity (pure functions).
 * @see docs/COMPONENT-MODEL.md
 */

import type { SimDesign, SimEdge, SimNode, RuntimeMetrics } from "./types";
import {
  getDependencyKind,
  parseDependencyConfig,
  syncDependencyLatencyMs,
  summarizeDependencyEdge,
  type DependencySummary,
  deriveBaseLatencyForNode,
} from "./dependency-edge-config";

export type QueueFullBehavior = "reject" | "drop_oldest" | "drop_newest";

export interface AppServerConfig {
  instanceCount: number;
  maxConcurrentRequestsPerInstance: number;
  applicationComputeTimeMs: number;
  responseDeadlineMs: number;
  maxWaitingQueue: number;
  queueFullBehavior: QueueFullBehavior;
}

export const DEFAULT_APP_SERVER: AppServerConfig = {
  instanceCount: 1,
  maxConcurrentRequestsPerInstance: 200,
  applicationComputeTimeMs: 20,
  responseDeadlineMs: 3000,
  maxWaitingQueue: 1000,
  queueFullBehavior: "reject",
};

const UPSTREAM_ROUTERS = new Set(["load_balancer", "reverse_proxy", "api_gateway"]);

export interface EffectiveRequestBreakdown {
  applicationComputeTimeMs: number;
  synchronousDependencyLatencyMs: number;
  retryDelayMs: number;
  queuePublishBlockingTimeMs: number;
  effectiveRequestTimeMs: number;
}

export interface DerivedCapacityBreakdown {
  capacityPerInstanceRps: number;
  totalCapacityRps: number;
  effectiveInstanceCount: number;
  configuredInstanceCount: number;
  maxConcurrentPerInstance: number;
  effectiveRequestTimeMs: number;
  hasUpstreamRouter: boolean;
}

export interface AppServerSimState {
  activeRequests: number;
  queueDepth: number;
}

export interface AppServerTickResult {
  completedRps: number;
  rejectedRps: number;
  activeRequests: number;
  queueDepth: number;
  responseTimeMs: number;
  errorRate: number;
  /** Steady-state max completion rate from slots × service time (derived, not configured) */
  maxCompletionRps: number;
  nextState: AppServerSimState;
}

export function parseAppServerConfig(
  raw: Record<string, string | number | boolean>,
): AppServerConfig {
  const cfg: AppServerConfig = { ...DEFAULT_APP_SERVER };

  if (typeof raw.instanceCount === "number") cfg.instanceCount = raw.instanceCount;
  else if (typeof raw.replicas === "number") cfg.instanceCount = raw.replicas;

  if (typeof raw.maxConcurrentRequestsPerInstance === "number") {
    cfg.maxConcurrentRequestsPerInstance = raw.maxConcurrentRequestsPerInstance;
  } else if (typeof raw.maxConcurrentReqs === "number") {
    cfg.maxConcurrentRequestsPerInstance = raw.maxConcurrentReqs;
  }

  if (typeof raw.applicationComputeTimeMs === "number") {
    cfg.applicationComputeTimeMs = raw.applicationComputeTimeMs;
  } else if (typeof raw.avgProcessingTimeMs === "number") {
    cfg.applicationComputeTimeMs = raw.avgProcessingTimeMs;
  }

  if (typeof raw.responseDeadlineMs === "number") cfg.responseDeadlineMs = raw.responseDeadlineMs;
  else if (typeof raw.requestTimeoutMs === "number") cfg.responseDeadlineMs = raw.requestTimeoutMs;

  if (typeof raw.maxWaitingQueue === "number") cfg.maxWaitingQueue = raw.maxWaitingQueue;

  if (typeof raw.queueFullBehavior === "string") {
    const b = raw.queueFullBehavior as QueueFullBehavior;
    if (b === "reject" || b === "drop_oldest" || b === "drop_newest") {
      cfg.queueFullBehavior = b;
    }
  }

  cfg.instanceCount = Math.max(1, Math.round(cfg.instanceCount));
  cfg.maxConcurrentRequestsPerInstance = Math.max(1, cfg.maxConcurrentRequestsPerInstance);
  cfg.applicationComputeTimeMs = Math.max(1, cfg.applicationComputeTimeMs);
  cfg.responseDeadlineMs = Math.max(100, cfg.responseDeadlineMs);
  cfg.maxWaitingQueue = Math.max(0, Math.round(cfg.maxWaitingQueue));

  return cfg;
}

export function appServerConfigToStorage(
  cfg: AppServerConfig,
): Record<string, string | number | boolean> {
  return {
    instanceCount: cfg.instanceCount,
    maxConcurrentRequestsPerInstance: cfg.maxConcurrentRequestsPerInstance,
    applicationComputeTimeMs: cfg.applicationComputeTimeMs,
    responseDeadlineMs: cfg.responseDeadlineMs,
    maxWaitingQueue: cfg.maxWaitingQueue,
    queueFullBehavior: cfg.queueFullBehavior,
  };
}

export function hasUpstreamTrafficRouter(
  inboundNodeIds: string[],
  nodeMap: Map<string, SimNode>,
): boolean {
  return inboundNodeIds.some((id) => UPSTREAM_ROUTERS.has(nodeMap.get(id)?.type ?? ""));
}

export function effectiveInstanceCount(
  cfg: AppServerConfig,
  hasRouter: boolean,
): number {
  if (cfg.instanceCount <= 1) return cfg.instanceCount;
  return hasRouter ? cfg.instanceCount : 1;
}

export function computeEffectiveRequestTime(
  appCfg: AppServerConfig,
  outboundEdges: SimEdge[],
  nodeMap: Map<string, SimNode>,
  metrics: Record<string, RuntimeMetrics>,
): EffectiveRequestBreakdown {
  let synchronousDependencyLatencyMs = 0;
  let retryDelayMs = 0;
  let queuePublishBlockingTimeMs = 0;

  for (const edge of outboundEdges) {
    const target = nodeMap.get(edge.target);
    if (!target) continue;
    const dep = parseDependencyConfig(edge, target.type);
    if (!dep) continue;

    const contrib = syncDependencyLatencyMs(dep, target, metrics[target.id]);
    synchronousDependencyLatencyMs += contrib.syncMs;
    retryDelayMs += contrib.retryMs;
    queuePublishBlockingTimeMs += contrib.queueBlockMs;
  }

  const effectiveRequestTimeMs =
    appCfg.applicationComputeTimeMs +
    synchronousDependencyLatencyMs +
    retryDelayMs +
    queuePublishBlockingTimeMs;

  return {
    applicationComputeTimeMs: appCfg.applicationComputeTimeMs,
    synchronousDependencyLatencyMs,
    retryDelayMs,
    queuePublishBlockingTimeMs,
    effectiveRequestTimeMs: Math.max(appCfg.applicationComputeTimeMs, effectiveRequestTimeMs),
  };
}

export function deriveCapacityPerInstanceRps(
  maxConcurrent: number,
  effectiveRequestTimeMs: number,
): number {
  if (effectiveRequestTimeMs <= 0) return maxConcurrent * 1000;
  return maxConcurrent / (effectiveRequestTimeMs / 1000);
}

export function deriveCapacityBreakdown(
  cfg: AppServerConfig,
  effectiveRequestTimeMs: number,
  hasRouter: boolean,
): DerivedCapacityBreakdown {
  const effectiveInstanceCountVal = effectiveInstanceCount(cfg, hasRouter);
  const capacityPerInstanceRps = deriveCapacityPerInstanceRps(
    cfg.maxConcurrentRequestsPerInstance,
    effectiveRequestTimeMs,
  );

  return {
    capacityPerInstanceRps,
    totalCapacityRps: capacityPerInstanceRps * effectiveInstanceCountVal,
    effectiveInstanceCount: effectiveInstanceCountVal,
    configuredInstanceCount: cfg.instanceCount,
    maxConcurrentPerInstance: cfg.maxConcurrentRequestsPerInstance,
    effectiveRequestTimeMs,
    hasUpstreamRouter: hasRouter,
  };
}

/**
 * Slot-based admission + queue simulation.
 *
 * Inputs (from config): maxSlots, maxWaitingQueue, queueFullBehavior, responseDeadlineMs
 * Derived: maxCompletionRps = maxSlots / serviceTimeSec
 * Outcomes: completedRps, queueDepth, activeRequests, responseTimeMs, errorRate
 */
export function simulateAppServerTick(params: {
  incomingRps: number;
  dtSec: number;
  cfg: AppServerConfig;
  maxSlots: number;
  effectiveRequestTimeMs: number;
  state: AppServerSimState;
}): AppServerTickResult {
  const { incomingRps, dtSec, cfg, maxSlots, effectiveRequestTimeMs, state } = params;

  const serviceTimeSec = Math.max(effectiveRequestTimeMs / 1000, 0.001);
  const maxCompletionRps = maxSlots / serviceTimeSec;

  let active = state.activeRequests;
  let queue = state.queueDepth;
  let rejectedCount = 0;

  // 1. Complete in-flight work (frees slots)
  const completionRps = active / serviceTimeSec;
  const completions = Math.min(completionRps * dtSec, active);
  active -= completions;

  // 2. New arrivals this tick
  const arrivals = incomingRps * dtSec;
  let arrivalsRemaining = arrivals;

  // 3. Admit waiting queue into free slots (FIFO)
  const slotsAfterComplete = maxSlots - active;
  const admitFromQueue = Math.min(queue, slotsAfterComplete);
  queue -= admitFromQueue;
  active += admitFromQueue;

  // 4. Admit new arrivals into remaining slots
  const slotsForNew = maxSlots - active;
  const admitFromNew = Math.min(arrivalsRemaining, slotsForNew);
  active += admitFromNew;
  arrivalsRemaining -= admitFromNew;

  // 5. Overflow → waiting queue or reject/drop
  if (arrivalsRemaining > 0) {
    const projectedQueue = queue + arrivalsRemaining;
    if (projectedQueue <= cfg.maxWaitingQueue) {
      queue = projectedQueue;
    } else {
      const overflow = projectedQueue - cfg.maxWaitingQueue;
      switch (cfg.queueFullBehavior) {
        case "reject":
          rejectedCount += overflow;
          queue = cfg.maxWaitingQueue;
          break;
        case "drop_oldest": {
          const drop = Math.min(queue, overflow);
          queue -= drop;
          rejectedCount += drop;
          queue = Math.min(cfg.maxWaitingQueue, queue + arrivalsRemaining);
          break;
        }
        case "drop_newest":
          rejectedCount += overflow;
          queue = cfg.maxWaitingQueue;
          break;
      }
    }
  }

  const completedRps = dtSec > 0 ? completions / dtSec : 0;
  const rejectedRps = dtSec > 0 ? rejectedCount / dtSec : 0;

  const load = maxCompletionRps > 0 ? incomingRps / maxCompletionRps : incomingRps > 0 ? 999 : 0;

  const queueWaitMs = queue > 0 && maxCompletionRps > 0
    ? (queue / maxCompletionRps) * 1000
    : 0;

  const pressureMultiplier = load < 0.7
    ? 1 + Math.max(0, load - 0.5) * 0.4
    : load < 1.0
      ? 1 / Math.max(0.05, 1 - load * 0.65)
      : 1 + (load - 1) * 2;

  const responseTimeMs = effectiveRequestTimeMs * pressureMultiplier + queueWaitMs;

  let errorRate = 0;
  if (rejectedRps > 0 && incomingRps > 0) errorRate += rejectedRps / incomingRps;
  if (responseTimeMs > cfg.responseDeadlineMs) {
    const overRatio = (responseTimeMs - cfg.responseDeadlineMs) / cfg.responseDeadlineMs;
    errorRate = Math.min(1, errorRate + 0.05 + overRatio * 0.25);
  }
  if (load > 1) errorRate = Math.min(1, errorRate + (load - 1) * 0.15);

  return {
    completedRps,
    rejectedRps,
    activeRequests: active,
    queueDepth: queue,
    responseTimeMs,
    errorRate: Math.min(1, errorRate),
    maxCompletionRps,
    nextState: { activeRequests: active, queueDepth: queue },
  };
}

export function listConnectedDependencies(
  design: SimDesign,
  appNodeId: string,
): DependencySummary[] {
  const nodeMap = new Map(design.nodes.map((n) => [n.id, n]));
  const appNode = nodeMap.get(appNodeId);
  if (!appNode || appNode.type !== "app_server") return [];

  return design.edges
    .filter((e) => e.source === appNodeId)
    .map((e) => {
      const target = nodeMap.get(e.target);
      if (!target || !getDependencyKind(target.type)) return null;
      return summarizeDependencyEdge(e, target);
    })
    .filter((s): s is DependencySummary => s !== null);
}

export function formatCount(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}
