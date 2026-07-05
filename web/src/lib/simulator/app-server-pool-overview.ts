/**
 * Pool overview analysis — request-time breakdown, bottleneck, operational status.
 */

import type { SimEdge, SimNode, RuntimeMetrics, SimHealth } from "./types";
import type { AppServerConfig } from "./app-server-model";
import { parseDependencyConfig, syncDependencyLatencyMs } from "./dependency-edge-config";

export type PoolOperationalStatus =
  | "healthy"
  | "under_pressure"
  | "at_capacity"
  | "overloaded";

export type BottleneckKind =
  | "application_compute"
  | "database"
  | "cache"
  | "external_api"
  | "queue"
  | "queue_backlog"
  | "pool_capacity"
  | "uneven_instances"
  | "none";

export interface RequestTimeBreakdown {
  applicationComputeMs: number;
  databaseWaitMs: number;
  cacheWaitMs: number;
  externalApiWaitMs: number;
  queueWaitMs: number;
  totalEffectiveMs: number;
}

export interface PrimaryBottleneck {
  kind: BottleneckKind;
  label: string;
  targetNodeId?: string;
  targetEdgeId?: string;
}

export interface PoolOverviewAnalysis {
  operationalStatus: PoolOperationalStatus;
  statusTitle: string;
  statusExplanation: string;
  inspectNextLabel: string;
  inspectNextNodeId?: string;
  inspectNextEdgeId?: string;
  requestTime: RequestTimeBreakdown;
  primaryBottleneck: PrimaryBottleneck;
  slotsFullWaitingOnIo: boolean;
  showInstanceTableDefault: boolean;
  evenDistributionMessage: string;
}

export interface PoolInstanceRow {
  index: number;
  incomingRps: number;
  activeRequests: number;
  maxSlots: number;
  utilizationPercent: number;
  p95LatencyMs: number;
  health: SimHealth;
}

export function formatDurationMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const sec = ms / 1000;
  if (sec < 10) return `${sec.toFixed(1)} sec`;
  return `${Math.round(sec)} sec`;
}

export function computeRequestTimeBreakdown(
  appCfg: AppServerConfig,
  outboundEdges: SimEdge[],
  nodeMap: Map<string, SimNode>,
  metrics: Record<string, RuntimeMetrics>,
): RequestTimeBreakdown {
  let databaseWaitMs = 0;
  let cacheWaitMs = 0;
  let externalApiWaitMs = 0;
  let queueWaitMs = 0;

  for (const edge of outboundEdges) {
    const target = nodeMap.get(edge.target);
    if (!target) continue;
    const dep = parseDependencyConfig(edge, target.type);
    if (!dep) continue;

    const contrib = syncDependencyLatencyMs(dep, target, metrics[target.id]);
    switch (dep.kind) {
      case "database":
        databaseWaitMs += contrib.syncMs + contrib.retryMs;
        break;
      case "cache":
        cacheWaitMs += contrib.syncMs;
        break;
      case "external":
        externalApiWaitMs += contrib.syncMs + contrib.retryMs;
        break;
      case "queue":
        queueWaitMs += contrib.queueBlockMs;
        break;
    }
  }

  const totalEffectiveMs = Math.max(
    appCfg.applicationComputeTimeMs,
    appCfg.applicationComputeTimeMs +
      databaseWaitMs +
      cacheWaitMs +
      externalApiWaitMs +
      queueWaitMs,
  );

  return {
    applicationComputeMs: appCfg.applicationComputeTimeMs,
    databaseWaitMs,
    cacheWaitMs,
    externalApiWaitMs,
    queueWaitMs,
    totalEffectiveMs,
  };
}

interface DepContribution {
  kind: BottleneckKind;
  waitMs: number;
  label: string;
  targetNodeId: string;
  edgeId: string;
}

function collectDependencyContributions(
  outboundEdges: SimEdge[],
  nodeMap: Map<string, SimNode>,
  metrics: Record<string, RuntimeMetrics>,
): DepContribution[] {
  const out: DepContribution[] = [];

  for (const edge of outboundEdges) {
    const target = nodeMap.get(edge.target);
    if (!target) continue;
    const dep = parseDependencyConfig(edge, target.type);
    if (!dep) continue;

    const contrib = syncDependencyLatencyMs(dep, target, metrics[target.id]);
    const waitMs = contrib.syncMs + contrib.retryMs + contrib.queueBlockMs;
    if (waitMs <= 0) continue;

    let kind: BottleneckKind = "none";
    let label = target.label;

    switch (dep.kind) {
      case "database":
        kind = "database";
        label = `${target.label} latency`;
        break;
      case "cache":
        kind = "cache";
        label = `${target.label} (cache misses)`;
        break;
      case "external":
        kind = "external_api";
        label = `${target.label} latency`;
        break;
      case "queue":
        kind = "queue";
        label = `${target.label} publish wait`;
        break;
    }

    out.push({ kind, waitMs, label, targetNodeId: target.id, edgeId: edge.id });
  }

  return out;
}

function deriveOperationalStatus(
  utilizationPercent: number,
  slotUtilizationPercent: number,
  queueDepth: number,
  errorRate: number,
): PoolOperationalStatus {
  if (errorRate > 0.12 || utilizationPercent >= 110) return "overloaded";
  if (utilizationPercent >= 92 || slotUtilizationPercent >= 88 || queueDepth >= 25) {
    return "at_capacity";
  }
  if (utilizationPercent >= 65 || slotUtilizationPercent >= 60 || queueDepth >= 8 || errorRate > 0.03) {
    return "under_pressure";
  }
  return "healthy";
}

function operationalStatusTitle(status: PoolOperationalStatus): string {
  switch (status) {
    case "healthy": return "Healthy";
    case "under_pressure": return "Under pressure";
    case "at_capacity": return "At capacity";
    case "overloaded": return "Overloaded";
  }
}

function buildExplanation(
  status: PoolOperationalStatus,
  bottleneck: PrimaryBottleneck,
  breakdown: RequestTimeBreakdown,
  params: {
    queueDepth: number;
    slotsFull: boolean;
    healthyCount: number;
    configuredCount: number;
    cacheHitRateLow: boolean;
  },
): string {
  const { queueDepth, slotsFull, healthyCount, configuredCount, cacheHitRateLow } = params;
  const ioBound = breakdown.databaseWaitMs + breakdown.cacheWaitMs + breakdown.externalApiWaitMs;

  if (healthyCount < configuredCount) {
    return "Traffic is concentrated on fewer healthy instances, so each replica carries more load.";
  }

  if (queueDepth > 15 && bottleneck.kind !== "database") {
    return "Requests are arriving faster than the pool can complete them, so a backlog is forming in the queue.";
  }

  switch (bottleneck.kind) {
    case "application_compute":
      if (slotsFull) {
        return "Instances are spending most of their time executing application logic, and all request slots are occupied.";
      }
      return "Instances are spending most of their time executing application logic.";
    case "database":
      if (slotsFull || status === "at_capacity" || status === "overloaded") {
        return `Requests are spending most of their time waiting on ${bottleneck.label.replace(/ latency$/, "")}, so all request slots are occupied.`;
      }
      return "Instances are waiting on SQL queries, which keeps request slots occupied.";
    case "cache":
      if (cacheHitRateLow) {
        return "Low cache hit rate is sending more reads to the database, keeping request slots busy.";
      }
      return "Cache lookups are adding wait time on the critical path.";
    case "external_api":
      return "Instances are waiting on external API responses, which keeps request slots occupied.";
    case "queue":
      return "Publishing to the message queue is blocking request completion.";
    case "queue_backlog":
      return "Requests are arriving faster than the pool can complete them.";
    case "pool_capacity":
      return "Incoming traffic exceeds the pool's derived throughput at the current per-request service time.";
    default:
      if (slotsFull && ioBound > breakdown.applicationComputeMs) {
        return "Request slots are full because work is blocked waiting on downstream dependencies — not because CPU is busy.";
      }
      if (status === "healthy") {
        return "The pool has spare capacity. Traffic is flowing without slot exhaustion.";
      }
      return "The pool is handling current load within normal operating bounds.";
  }
}

function buildInspectNext(bottleneck: PrimaryBottleneck): string {
  switch (bottleneck.kind) {
    case "database":
    case "cache":
    case "external_api":
    case "queue":
      return `Inspect ${bottleneck.label.replace(/ latency$/, "").replace(/ \(cache misses\)$/, "")}`;
    case "queue_backlog":
      return "Review pool capacity settings";
    case "application_compute":
      return "Review application compute time";
    case "uneven_instances":
      return "Check instance health and load balancer targets";
    default:
      return "Review connected dependencies";
  }
}

function identifyPrimaryBottleneck(
  breakdown: RequestTimeBreakdown,
  deps: DepContribution[],
  params: {
    queueDepth: number;
    utilizationPercent: number;
    healthyCount: number;
    configuredCount: number;
    appCfg: AppServerConfig;
  },
): PrimaryBottleneck {
  const { queueDepth, utilizationPercent, healthyCount, configuredCount, appCfg } = params;

  if (healthyCount < configuredCount) {
    return { kind: "uneven_instances", label: "Uneven instance health" };
  }

  if (queueDepth > 20) {
    return { kind: "queue_backlog", label: "Request queue backlog" };
  }

  if (utilizationPercent >= 100 && deps.length === 0) {
    return { kind: "pool_capacity", label: "Pool throughput limit" };
  }

  const candidates: Array<{ kind: BottleneckKind; waitMs: number; label: string; targetNodeId?: string; edgeId?: string }> = [
    { kind: "application_compute", waitMs: breakdown.applicationComputeMs, label: "Application compute" },
    ...deps,
  ];

  candidates.sort((a, b) => b.waitMs - a.waitMs);
  const top = candidates[0];

  if (!top || top.waitMs <= 0) {
    return { kind: "none", label: "None detected" };
  }

  return {
    kind: top.kind,
    label: top.label,
    targetNodeId: top.targetNodeId,
    targetEdgeId: top.edgeId,
  };
}

export function analyzePoolOverview(input: {
  appCfg: AppServerConfig;
  metrics: RuntimeMetrics;
  outboundEdges: SimEdge[];
  nodeMap: Map<string, SimNode>;
  allMetrics: Record<string, RuntimeMetrics>;
  configuredCount: number;
  healthyCount: number;
  poolCapacityRps: number;
  capacityPerInstanceRps: number;
}): PoolOverviewAnalysis {
  const {
    appCfg,
    metrics,
    outboundEdges,
    nodeMap,
    allMetrics,
    configuredCount,
    healthyCount,
    poolCapacityRps,
    capacityPerInstanceRps,
  } = input;

  const requestTime = computeRequestTimeBreakdown(appCfg, outboundEdges, nodeMap, allMetrics);
  const deps = collectDependencyContributions(outboundEdges, nodeMap, allMetrics);

  const maxSlots = appCfg.maxConcurrentRequestsPerInstance * healthyCount;
  const activeRequests = metrics.activeRequests ?? metrics.activeConnections ?? 0;
  const slotUtilizationPercent =
    maxSlots > 0 ? Math.min(100, Math.round((activeRequests / maxSlots) * 100)) : 0;
  const utilizationPercent =
    metrics.poolUtilizationPercent ?? metrics.utilizationPercent ?? 0;

  const operationalStatus = deriveOperationalStatus(
    utilizationPercent,
    slotUtilizationPercent,
    metrics.queueDepth,
    metrics.errorRate,
  );

  const slotsFull = slotUtilizationPercent >= 85;
  const ioWait =
    requestTime.databaseWaitMs + requestTime.cacheWaitMs + requestTime.externalApiWaitMs;
  const slotsFullWaitingOnIo = slotsFull && ioWait > requestTime.applicationComputeMs;

  let cacheHitRateLow = false;
  for (const edge of outboundEdges) {
    const target = nodeMap.get(edge.target);
    if (!target) continue;
    const dep = parseDependencyConfig(edge, target.type);
    if (dep?.kind === "cache" && dep.cacheHitRate < 0.5) {
      cacheHitRateLow = true;
      break;
    }
  }

  const primaryBottleneck = identifyPrimaryBottleneck(requestTime, deps, {
    queueDepth: metrics.queueDepth,
    utilizationPercent,
    healthyCount,
    configuredCount,
    appCfg,
  });

  const statusExplanation = buildExplanation(operationalStatus, primaryBottleneck, requestTime, {
    queueDepth: metrics.queueDepth,
    slotsFull: slotsFullWaitingOnIo || slotsFull,
    healthyCount,
    configuredCount,
    cacheHitRateLow,
  });

  const perInstanceRps =
    metrics.perInstanceRps ??
    (healthyCount > 0 ? metrics.currentRps / healthyCount : 0);

  const hasUnhealthy = healthyCount < configuredCount;
  const showInstanceTableDefault = hasUnhealthy;

  const evenDistributionMessage =
    `All ${healthyCount} healthy instance${healthyCount === 1 ? "" : "s"} ${healthyCount === 1 ? "is" : "are"} receiving approximately ${formatRpsShort(perInstanceRps)} each.`;

  return {
    operationalStatus,
    statusTitle: operationalStatusTitle(operationalStatus),
    statusExplanation,
    inspectNextLabel: buildInspectNext(primaryBottleneck),
    inspectNextNodeId: primaryBottleneck.targetNodeId,
    inspectNextEdgeId: primaryBottleneck.targetEdgeId,
    requestTime,
    primaryBottleneck,
    slotsFullWaitingOnIo,
    showInstanceTableDefault,
    evenDistributionMessage,
  };
}

function formatRpsShort(n: number): string {
  if (n < 10) return `${n.toFixed(1)} RPS`;
  return `${Math.round(n)} RPS`;
}

export function derivePoolInstanceRows(
  configuredCount: number,
  healthyCount: number,
  perInstanceRps: number,
  totalActiveRequests: number,
  maxConcurrentPerInstance: number,
  poolP95Ms: number,
  instanceHealth: SimHealth,
): PoolInstanceRow[] {
  const n = Math.max(1, Math.round(configuredCount));
  const healthy = Math.max(1, Math.min(n, Math.round(healthyCount)));
  const perActive = totalActiveRequests / healthy;
  const perUtil = Math.min(
    100,
    Math.round((perActive / maxConcurrentPerInstance) * 100),
  );

  return Array.from({ length: n }, (_, i) => {
    const isHealthy = i < healthy;
    return {
      index: i + 1,
      incomingRps: isHealthy ? perInstanceRps : 0,
      activeRequests: isHealthy ? Math.round(perActive * 10) / 10 : 0,
      maxSlots: maxConcurrentPerInstance,
      utilizationPercent: isHealthy ? perUtil : 0,
      p95LatencyMs: isHealthy ? poolP95Ms : 0,
      health: isHealthy ? instanceHealth : "down",
    };
  });
}

export function instanceHealthLabel(health: SimHealth): string {
  switch (health) {
    case "healthy": return "Healthy";
    case "degraded": return "Degraded";
    case "failing": return "Unhealthy";
    case "down": return "Down";
  }
}

export function operationalStatusStyles(status: PoolOperationalStatus): {
  border: string;
  bg: string;
  title: string;
} {
  switch (status) {
    case "healthy":
      return {
        border: "border-emerald-400/25",
        bg: "bg-emerald-500/6",
        title: "text-emerald-800",
      };
    case "under_pressure":
      return {
        border: "border-amber-400/25",
        bg: "bg-amber-500/6",
        title: "text-amber-800",
      };
    case "at_capacity":
      return {
        border: "border-orange-400/25",
        bg: "bg-orange-500/6",
        title: "text-orange-800",
      };
    case "overloaded":
      return {
        border: "border-rose-400/25",
        bg: "bg-rose-500/6",
        title: "text-rose-800",
      };
  }
}

/** Downstream component type label for bottleneck display */
export function bottleneckDisplayLabel(kind: BottleneckKind, rawLabel: string): string {
  if (kind === "database") return rawLabel.includes("latency") ? rawLabel : `${rawLabel} latency`;
  if (kind === "none") return "None detected";
  return rawLabel;
}
