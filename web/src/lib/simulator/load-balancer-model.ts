/**
 * Load balancer config, routing math, and distribution snapshot helpers.
 */

import type { SimHealth } from "./types";

export type LoadBalancerRoutingStatus =
  | "idle"
  | "healthy"
  | "reduced_targets"
  | "no_healthy_targets"
  | "throughput_limited";

export type LoadBalancerDistributionKind =
  | "idle"
  | "single_target"
  | "even"
  | "weighted"
  | "uneven"
  | "reduced_capacity";

export interface LoadBalancerConfig {
  replicas: number;
  algorithm: string;
  maxConnections: number;
  maxRoutingThroughputRps: number;
  baseRoutingLatencyMs: number;
  healthCheckMs: number;
  stickySession: boolean;
}

export interface LoadBalancerTargetRow {
  targetId: string;
  label: string;
  rps: number;
  percent: number;
  healthy: boolean;
  health: SimHealth;
  healthLabel: string;
}

export interface LoadBalancerDistributionSnapshot {
  incomingRps: number;
  outgoingRps: number;
  rejectedRps: number;
  healthyTargetPools: number;
  totalTargetPools: number;
  algorithm: string;
  routingStatus: LoadBalancerRoutingStatus;
  distributionKind: LoadBalancerDistributionKind;
  statusTitle: string;
  statusMessage: string;
  distributionLabel: string;
  distributions: LoadBalancerTargetRow[];
}

export const DEFAULT_LB_CONFIG: LoadBalancerConfig = {
  replicas: 1,
  algorithm: "round_robin",
  maxConnections: 10_000,
  maxRoutingThroughputRps: 10_000,
  baseRoutingLatencyMs: 1,
  healthCheckMs: 5000,
  stickySession: false,
};

export function parseLoadBalancerConfig(raw: Record<string, unknown>): LoadBalancerConfig {
  const cfg = { ...DEFAULT_LB_CONFIG };
  if (typeof raw.replicas === "number") cfg.replicas = raw.replicas;
  if (typeof raw.algorithm === "string") cfg.algorithm = raw.algorithm;
  if (typeof raw.maxConnections === "number") cfg.maxConnections = raw.maxConnections;
  if (typeof raw.maxRoutingThroughputRps === "number") {
    cfg.maxRoutingThroughputRps = raw.maxRoutingThroughputRps;
  }
  if (typeof raw.baseRoutingLatencyMs === "number") {
    cfg.baseRoutingLatencyMs = raw.baseRoutingLatencyMs;
  }
  if (typeof raw.healthCheckMs === "number") cfg.healthCheckMs = raw.healthCheckMs;
  if (typeof raw.stickySession === "boolean") cfg.stickySession = raw.stickySession;
  cfg.replicas = Math.max(1, Math.round(cfg.replicas));
  cfg.maxConnections = Math.max(10, cfg.maxConnections);
  cfg.maxRoutingThroughputRps = Math.max(100, cfg.maxRoutingThroughputRps);
  cfg.baseRoutingLatencyMs = Math.max(0.1, cfg.baseRoutingLatencyMs);
  return cfg;
}

export function loadBalancerMaxRoutingRps(cfg: LoadBalancerConfig): number {
  return cfg.maxRoutingThroughputRps * cfg.replicas;
}

export function computeLoadBalancerRoutingAmounts(incomingRps: number, cfg: LoadBalancerConfig): {
  outgoingRps: number;
  rejectedRps: number;
} {
  if (incomingRps <= 0) {
    return { outgoingRps: 0, rejectedRps: 0 };
  }
  const cap = loadBalancerMaxRoutingRps(cfg);
  const outgoingRps = Math.min(incomingRps, cap);
  return {
    outgoingRps,
    rejectedRps: Math.max(0, incomingRps - outgoingRps),
  };
}

export function targetHealthLabel(health: SimHealth, healthy: boolean): string {
  if (!healthy || health === "down") return "Unavailable";
  if (health === "failing") return "Unavailable";
  if (health === "degraded") return "Degraded";
  return "Healthy";
}

export function algorithmDisplayLabel(algorithm: string): string {
  switch (algorithm) {
    case "round_robin": return "Round Robin";
    case "weighted":
    case "weighted_round_robin": return "Weighted Round Robin";
    case "least_connections": return "Least Connections";
    case "least_response_time": return "Least Response Time";
    case "path_based": return "Path-based Routing";
    case "header_based": return "Header-based Routing";
    case "ip_hash": return "IP Hash";
    default: return algorithm.replace(/_/g, " ");
  }
}

export function algorithmDescription(algorithm: string, idle: boolean): string {
  if (idle) {
    return "Routing will begin when traffic reaches this component.";
  }
  switch (algorithm) {
    case "round_robin":
      return "Requests are distributed evenly across healthy targets.";
    case "weighted":
    case "weighted_round_robin":
      return "Traffic is split according to each target's routing weight.";
    case "least_connections":
      return "New requests prefer targets with fewer active requests.";
    case "least_response_time":
      return "New requests prefer targets responding fastest.";
    case "path_based":
      return "Requests are routed based on path or route rules.";
    default:
      return "Requests are distributed across healthy targets.";
  }
}

function percentsRoughlyEqual(percents: number[], tolerance = 3): boolean {
  if (percents.length < 2) return true;
  const first = percents[0];
  return percents.every((p) => Math.abs(p - first) <= tolerance);
}

export function computeDistributionKind(
  routingStatus: LoadBalancerRoutingStatus,
  algorithm: string,
  healthyCount: number,
  totalCount: number,
  percents: number[],
): LoadBalancerDistributionKind {
  if (routingStatus === "idle") return "idle";
  if (healthyCount < totalCount) return "reduced_capacity";
  if (healthyCount <= 1) return "single_target";
  if (algorithm === "weighted" || algorithm === "weighted_round_robin") return "weighted";
  if (algorithm === "round_robin" && percentsRoughlyEqual(percents)) return "even";
  return "uneven";
}

export function distributionKindLabel(kind: LoadBalancerDistributionKind): string {
  switch (kind) {
    case "idle": return "Idle";
    case "single_target": return "Single target";
    case "even": return "Even";
    case "weighted": return "Weighted";
    case "uneven": return "Uneven";
    case "reduced_capacity": return "Reduced target capacity";
  }
}

function routingStatusCopy(status: LoadBalancerRoutingStatus): { title: string; message: string } {
  switch (status) {
    case "idle":
      return {
        title: "Idle",
        message: "No incoming traffic to route.",
      };
    case "healthy":
      return {
        title: "Routing",
        message: "Traffic is being distributed across healthy targets.",
      };
    case "reduced_targets":
      return {
        title: "Degraded routing",
        message: "One or more targets are unavailable. Traffic is being routed through the remaining targets.",
      };
    case "no_healthy_targets":
      return {
        title: "No healthy targets",
        message: "No healthy backend targets are available.",
      };
    case "throughput_limited":
      return {
        title: "Throughput limited",
        message: "The load balancer has reached its routing throughput limit.",
      };
  }
}

export function loadBalancerNodeFooter(snapshot: LoadBalancerDistributionSnapshot): {
  idle: boolean;
  primary: string;
  secondary: string;
  dotMuted: boolean;
} {
  const poolWord = snapshot.totalTargetPools === 1 ? "target pool" : "pools";

  if (snapshot.routingStatus === "idle") {
    return {
      idle: true,
      primary: "Idle",
      secondary: `${snapshot.totalTargetPools} ${poolWord} · waiting for traffic`,
      dotMuted: true,
    };
  }

  const primary = `${Math.round(snapshot.incomingRps).toLocaleString("en-US")} RPS incoming`;

  let secondary: string;
  if (snapshot.totalTargetPools === 1) {
    secondary = `1 ${poolWord} · 100% routed`;
  } else if (snapshot.distributionKind === "even") {
    secondary = `${snapshot.totalTargetPools} pools · evenly distributed`;
  } else if (snapshot.distributionKind === "weighted") {
    secondary = `${snapshot.totalTargetPools} pools · weighted split`;
  } else if (snapshot.distributionKind === "reduced_capacity") {
    secondary = `${snapshot.healthyTargetPools}/${snapshot.totalTargetPools} pools · reduced capacity`;
  } else {
    secondary = `${snapshot.totalTargetPools} pools · ${snapshot.distributionLabel.toLowerCase()}`;
  }

  return {
    idle: false,
    primary,
    secondary,
    dotMuted: snapshot.routingStatus === "no_healthy_targets",
  };
}

export interface LoadBalancerReplicaRow {
  index: number;
  incomingRps: number;
  outgoingRps: number;
  activeConnections: number;
  maxConnections: number;
  utilizationPercent: number;
  routingThroughputCapRps: number;
  p95LatencyMs: number;
  health: SimHealth;
}

export function lbReplicaHealthLabel(health: SimHealth): string {
  switch (health) {
    case "healthy": return "Healthy";
    case "degraded": return "Degraded";
    case "failing": return "Unavailable";
    case "down": return "Down";
  }
}

/** Even-split view of each load balancer replica (representative average). */
export function deriveLoadBalancerReplicaRows(
  cfg: LoadBalancerConfig,
  metrics: {
    currentRps: number;
    activeConnections: number;
    p95LatencyMs: number;
    health: SimHealth;
  },
  dist?: Pick<LoadBalancerDistributionSnapshot, "incomingRps" | "outgoingRps" | "routingStatus">,
): LoadBalancerReplicaRow[] {
  const n = Math.max(1, cfg.replicas);
  const isIdle = !dist || dist.routingStatus === "idle" || dist.incomingRps <= 0;
  const incoming = isIdle ? 0 : dist.incomingRps;
  const outgoing = isIdle ? 0 : dist.outgoingRps;
  const perIncoming = incoming / n;
  const perOutgoing = outgoing / n;
  const perConn = metrics.activeConnections / n;
  const maxConnPerReplica = cfg.maxConnections;
  const util = maxConnPerReplica > 0
    ? Math.min(100, Math.round((perConn / maxConnPerReplica) * 100))
    : 0;

  return Array.from({ length: n }, (_, i) => ({
    index: i + 1,
    incomingRps: Math.round(perIncoming * 10) / 10,
    outgoingRps: Math.round(perOutgoing * 10) / 10,
    activeConnections: Math.round(perConn * 10) / 10,
    maxConnections: maxConnPerReplica,
    utilizationPercent: util,
    routingThroughputCapRps: cfg.maxRoutingThroughputRps,
    p95LatencyMs: metrics.p95LatencyMs,
    health: metrics.health,
  }));
}

export function buildLoadBalancerDistribution(params: {
  incomingRps: number;
  cfg: LoadBalancerConfig;
  algorithm: string;
  allTargets: Array<{ id: string; label: string; health: SimHealth; healthy: boolean }>;
  healthyTargets: Array<{ id: string; label: string; health: SimHealth; fraction: number }>;
}): LoadBalancerDistributionSnapshot {
  const { incomingRps, cfg, algorithm, allTargets, healthyTargets } = params;
  const totalTargetPools = allTargets.length;
  const healthyTargetPools = healthyTargets.length;

  if (incomingRps <= 0) {
    const status = routingStatusCopy("idle");
    return {
      incomingRps: 0,
      outgoingRps: 0,
      rejectedRps: 0,
      healthyTargetPools,
      totalTargetPools,
      algorithm,
      routingStatus: "idle",
      distributionKind: "idle",
      statusTitle: status.title,
      statusMessage: status.message,
      distributionLabel: "Idle",
      distributions: allTargets.map((t) => ({
        targetId: t.id,
        label: t.label,
        rps: 0,
        percent: 0,
        healthy: t.healthy,
        health: t.health,
        healthLabel: targetHealthLabel(t.health, t.healthy),
      })),
    };
  }

  const { outgoingRps, rejectedRps } = healthyTargetPools === 0
    ? { outgoingRps: 0, rejectedRps: incomingRps }
    : computeLoadBalancerRoutingAmounts(incomingRps, cfg);

  let routingStatus: LoadBalancerRoutingStatus;
  if (healthyTargetPools === 0) {
    routingStatus = "no_healthy_targets";
  } else if (rejectedRps > 0) {
    routingStatus = "throughput_limited";
  } else if (healthyTargetPools < totalTargetPools) {
    routingStatus = "reduced_targets";
  } else {
    routingStatus = "healthy";
  }

  const routedPercents = healthyTargets.map((t) => t.fraction * 100);
  const distributionKind = computeDistributionKind(
    routingStatus,
    algorithm,
    healthyTargetPools,
    totalTargetPools,
    routedPercents,
  );
  const distributionLabel = distributionKindLabel(distributionKind);
  const status = routingStatusCopy(routingStatus);

  const routedById = new Map<string, { rps: number; percent: number }>();
  if (healthyTargetPools > 0 && outgoingRps > 0) {
    healthyTargets.forEach((t) => {
      routedById.set(t.id, {
        rps: Math.round(outgoingRps * t.fraction),
        percent: Math.round(t.fraction * 1000) / 10,
      });
    });
  }

  const distributions: LoadBalancerTargetRow[] = allTargets.map((t) => {
    const routed = routedById.get(t.id);
    return {
      targetId: t.id,
      label: t.label,
      rps: routed?.rps ?? 0,
      percent: routed?.percent ?? 0,
      healthy: t.healthy,
      health: t.health,
      healthLabel: targetHealthLabel(t.health, t.healthy),
    };
  });

  return {
    incomingRps: Math.round(incomingRps),
    outgoingRps: Math.round(outgoingRps),
    rejectedRps: Math.round(rejectedRps),
    healthyTargetPools,
    totalTargetPools,
    algorithm,
    routingStatus,
    distributionKind,
    statusTitle: status.title,
    statusMessage: status.message,
    distributionLabel,
    distributions,
  };
}
