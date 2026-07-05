/**
 * Beginner-friendly diagnostics and one-click fixes per component type.
 * Used by the "Basics" tab in component inspectors.
 */

import type { SimNode, SimDesign, RuntimeMetrics, SimComponentType } from "./types";
import { parseDatabaseConfig, databaseConfigToStorage } from "./database-model";
import { parseAppServerConfig, appServerConfigToStorage } from "./app-server-model";
import { parseLoadBalancerConfig } from "./load-balancer-model";
import { parseClientConfig, clientConfigToStorage } from "./client-traffic";
import { computeConnectionDemand } from "./database-model";

export type InspectorViewMode = "basics" | "advanced";

export interface BasicFixAction {
  id: string;
  label: string;
  description: string;
  applyLabel: string;
  /** Hide when already at or above this improvement */
  hidden?: boolean;
}

export interface ComponentBasicsSnapshot {
  statusLabel: "healthy" | "watch" | "problem" | "idle";
  headline: string;
  detail: string;
  fixes: BasicFixAction[];
  tips: string[];
}

type PatchFn = (nodeId: string, patch: Record<string, string | number | boolean>) => void;

function overloaded(m?: RuntimeMetrics): boolean {
  if (!m) return false;
  return m.utilizationPercent >= 80 || m.errorRate > 0.05 || m.health === "degraded" || m.health === "failing" || m.health === "down";
}

function problemHeadline(m?: RuntimeMetrics, fallback = "This component needs attention"): string {
  if (!m) return "Start the simulation to see live status";
  if (m.health === "down") return "Component is down";
  if (m.health === "failing") return "Component is failing under load";
  if (m.health === "degraded") return "Component is under stress";
  if (m.utilizationPercent >= 85) return "Running near capacity";
  if (m.errorRate > 0.05) return "Errors are showing up";
  return "Looks healthy";
}

function problemDetail(m?: RuntimeMetrics): string {
  if (!m) return "Run the simulation, then come back here for simple fixes.";
  if (m.diagnosisReason) return m.diagnosisReason;
  const parts: string[] = [];
  if (m.utilizationPercent > 0) parts.push(`${m.utilizationPercent}% utilized`);
  if (m.currentRps > 0) parts.push(`${Math.round(m.currentRps)} requests/sec`);
  if (m.errorRate > 0.02) parts.push(`${(m.errorRate * 100).toFixed(1)}% errors`);
  if (m.p95LatencyMs > 0) parts.push(`P95 ${Math.round(m.p95LatencyMs)} ms`);
  return parts.length > 0 ? parts.join(" · ") : "No traffic yet.";
}

export function getDatabaseBasics(
  node: SimNode,
  design: SimDesign,
  metrics: RuntimeMetrics | undefined,
  mergeNodeConfig: PatchFn,
): ComponentBasicsSnapshot {
  const cfg = parseDatabaseConfig(node.type, node.config);
  const dbm = metrics?.databaseMetrics;
  const conn = computeConnectionDemand(design, node.id);
  const fixes: BasicFixAction[] = [];
  const tips: string[] = [];
  const isRedis = cfg.engine === "redis";
  const isSql = cfg.family === "relational";

  if (isSql && cfg.topology.replicaCount < 3) {
    fixes.push({
      id: "add-read-replica",
      label: "Add a read replica",
      description: "Offload read traffic from the primary. Good when reads dominate.",
      applyLabel: `Add replica (${cfg.topology.replicaCount} → ${cfg.topology.replicaCount + 1})`,
      hidden: cfg.topology.replicaCount >= 3,
    });
  }

  if (isSql && cfg.topology.replicaCount > 0 && cfg.topology.replicaReadPercent < 70) {
    fixes.push({
      id: "route-reads-replicas",
      label: "Send reads to replicas",
      description: "Replicas exist but reads may still hit the primary.",
      applyLabel: "Route ~70% of reads to replicas",
    });
  }

  if (cfg.capacity.maxConnections < 2000) {
    fixes.push({
      id: "raise-max-connections",
      label: "Allow more connections",
      description: "App servers may be waiting for a free database connection.",
      applyLabel: `Raise limit (${cfg.capacity.maxConnections} → ${Math.min(10000, cfg.capacity.maxConnections + 500)})`,
    });
  }

  if (cfg.capacity.cpuUnits < 32) {
    fixes.push({
      id: "scale-cpu",
      label: "Give the database more CPU",
      description: "Vertical scale — simplest fix when queries are CPU-bound.",
      applyLabel: `Increase CPU (${cfg.capacity.cpuUnits} → ${cfg.capacity.cpuUnits + 4} units)`,
    });
  }

  if (conn.exceedsLimit) {
    fixes.push({
      id: "fix-pool-overflow",
      label: "Fix connection pool overflow",
      description: `Apps want ${conn.demandedConnections} connections but limit is ${conn.maxConnections}.`,
      applyLabel: `Raise max connections to ${conn.demandedConnections + 100}`,
    });
  }

  if (isRedis && cfg.redis && cfg.redis.maxMemoryMb < 16384) {
    fixes.push({
      id: "redis-memory",
      label: "Increase Redis memory",
      description: "More RAM reduces evictions and cache misses.",
      applyLabel: `Increase memory (${cfg.redis.maxMemoryMb} → ${cfg.redis.maxMemoryMb * 2} MB)`,
    });
  }

  if (cfg.engine === "dynamoStyle" && cfg.dynamo?.capacityMode === "provisioned") {
    fixes.push({
      id: "dynamo-capacity",
      label: "Raise provisioned capacity",
      description: "DynamoDB-style stores throttle when read/write units are exceeded.",
      applyLabel: "Double read & write capacity units",
    });
  }

  if (!overloaded(metrics) && metrics && metrics.currentRps > 0) {
    tips.push("Reads heavy? Add read replicas before sharding.");
    tips.push("Seeing connection errors? Check app pool sizes vs database max connections.");
    tips.push("Still slow after scaling? Add Redis in front for hot reads.");
  }

  let headline = problemHeadline(metrics);
  let detail = problemDetail(metrics);
  if (dbm?.warnings.length) detail = dbm.warnings[0];
  if (conn.exceedsLimit && !overloaded(metrics)) {
    headline = "Too many app connections";
    detail = `Apps are configured for ${conn.demandedConnections} connections but this database allows ${conn.maxConnections}.`;
  }

  return {
    statusLabel: !metrics ? "idle" : overloaded(metrics) ? "problem" : metrics.currentRps > 0 ? "healthy" : "idle",
    headline,
    detail,
    fixes: fixes.filter((f) => !f.hidden),
    tips,
  };
}

export function applyDatabaseFix(
  fixId: string,
  node: SimNode,
  design: SimDesign,
  mergeNodeConfig: PatchFn,
): void {
  const cfg = parseDatabaseConfig(node.type, node.config);
  switch (fixId) {
    case "add-read-replica":
      mergeNodeConfig(node.id, databaseConfigToStorage({
        ...cfg,
        topology: { ...cfg.topology, replicaCount: cfg.topology.replicaCount + 1 },
      }));
      break;
    case "route-reads-replicas":
      mergeNodeConfig(node.id, databaseConfigToStorage({
        ...cfg,
        topology: {
          ...cfg.topology,
          readRouting: "preferReplicas",
          replicaReadPercent: 70,
        },
      }));
      break;
    case "raise-max-connections":
      mergeNodeConfig(node.id, databaseConfigToStorage({
        ...cfg,
        capacity: {
          ...cfg.capacity,
          maxConnections: Math.min(10000, cfg.capacity.maxConnections + 500),
        },
      }));
      break;
    case "scale-cpu":
      mergeNodeConfig(node.id, databaseConfigToStorage({
        ...cfg,
        capacity: { ...cfg.capacity, cpuUnits: cfg.capacity.cpuUnits + 4 },
      }));
      break;
    case "fix-pool-overflow": {
      const conn = computeConnectionDemand(design, node.id);
      mergeNodeConfig(node.id, databaseConfigToStorage({
        ...cfg,
        capacity: {
          ...cfg.capacity,
          maxConnections: conn.demandedConnections + 100,
        },
      }));
      break;
    }
    case "redis-memory":
      if (cfg.redis) {
        mergeNodeConfig(node.id, databaseConfigToStorage({
          ...cfg,
          redis: { ...cfg.redis, maxMemoryMb: cfg.redis.maxMemoryMb * 2 },
        }));
      }
      break;
    case "dynamo-capacity":
      if (cfg.dynamo) {
        mergeNodeConfig(node.id, databaseConfigToStorage({
          ...cfg,
          dynamo: {
            ...cfg.dynamo,
            readCapacityUnits: cfg.dynamo.readCapacityUnits * 2,
            writeCapacityUnits: cfg.dynamo.writeCapacityUnits * 2,
          },
        }));
      }
      break;
  }
}

export function getAppServerBasics(
  node: SimNode,
  metrics: RuntimeMetrics | undefined,
): ComponentBasicsSnapshot {
  const cfg = parseAppServerConfig(node.config);
  const fixes: BasicFixAction[] = [];
  const tips: string[] = [];

  if (cfg.instanceCount < 5) {
    fixes.push({
      id: "add-instance",
      label: "Add another instance",
      description: "Spread incoming traffic across more app servers.",
      applyLabel: `Add instance (${cfg.instanceCount} → ${cfg.instanceCount + 1})`,
    });
  }

  if (cfg.maxConcurrentRequestsPerInstance < 200) {
    fixes.push({
      id: "raise-slots",
      label: "Allow more concurrent requests",
      description: "Each instance can handle more in-flight work at once.",
      applyLabel: `Raise slots (${cfg.maxConcurrentRequestsPerInstance} → ${cfg.maxConcurrentRequestsPerInstance + 50})`,
    });
  }

  if (metrics?.derivedCapacityBreakdown) {
    const eff = metrics.derivedCapacityBreakdown.effectiveRequestTimeMs;
    if (eff > cfg.applicationComputeTimeMs * 2) {
      fixes.push({
        id: "hint-db-bottleneck",
        label: "Database may be the bottleneck",
        description: "App servers are waiting on downstream dependencies. Scale or cache the database first.",
        applyLabel: "Learn more (see Advanced → Dependencies)",
        hidden: true,
      });
    }
  }

  if (!overloaded(metrics) && metrics && metrics.currentRps > 0) {
    tips.push("Add instances behind a load balancer — not as a lone server.");
    tips.push("If latency is high but CPU is low, the database or cache is likely slow.");
  }

  return {
    statusLabel: !metrics ? "idle" : overloaded(metrics) ? "problem" : "healthy",
    headline: problemHeadline(metrics, "Web app pool status"),
    detail: metrics?.diagnosisReason || problemDetail(metrics),
    fixes: fixes.filter((f) => !f.hidden),
    tips,
  };
}

export function applyAppServerFix(fixId: string, node: SimNode, mergeNodeConfig: PatchFn): void {
  const cfg = parseAppServerConfig(node.config);
  switch (fixId) {
    case "add-instance":
      mergeNodeConfig(node.id, appServerConfigToStorage({
        ...cfg,
        instanceCount: cfg.instanceCount + 1,
      }));
      break;
    case "raise-slots":
      mergeNodeConfig(node.id, appServerConfigToStorage({
        ...cfg,
        maxConcurrentRequestsPerInstance: cfg.maxConcurrentRequestsPerInstance + 50,
      }));
      break;
  }
}

export function getLoadBalancerBasics(metrics: RuntimeMetrics | undefined): ComponentBasicsSnapshot {
  const fixes: BasicFixAction[] = [];
  const tips: string[] = [];
  const dist = metrics?.loadBalancerDistribution;

  fixes.push({
    id: "raise-routing-cap",
    label: "Raise routing throughput",
    description: "If the LB itself is the bottleneck, increase max routing RPS.",
    applyLabel: "Increase routing capacity +50%",
  });

  if (dist?.routingStatus === "no_healthy_targets") {
    return {
      statusLabel: "problem",
      headline: "No healthy backends",
      detail: dist.statusMessage || "Fix unhealthy app servers — the load balancer cannot forward traffic.",
      fixes: [],
      tips: ["A load balancer should not send traffic to failed servers.", "Check the Web App health first."],
    };
  }

  if (!overloaded(metrics) && metrics?.currentRps) {
    tips.push("Use at least 2 app server instances for real redundancy.");
  }

  return {
    statusLabel: !metrics?.currentRps ? "idle" : overloaded(metrics) ? "problem" : "healthy",
    headline: dist?.statusTitle || problemHeadline(metrics, "Load balancer status"),
    detail: dist?.statusMessage || problemDetail(metrics),
    fixes,
    tips,
  };
}

export function applyLoadBalancerFix(
  fixId: string,
  node: SimNode,
  updateNodeConfig: (id: string, key: string, value: string | number | boolean) => void,
): void {
  const cfg = parseLoadBalancerConfig(node.config);
  switch (fixId) {
    case "raise-routing-cap":
      updateNodeConfig(
        node.id,
        "maxRoutingThroughputRps",
        Math.round(cfg.maxRoutingThroughputRps * 1.5),
      );
      break;
  }
}

export function getClientBasics(metrics: RuntimeMetrics | undefined): ComponentBasicsSnapshot {
  const fixes: BasicFixAction[] = [];
  const tips: string[] = [];

  fixes.push({
    id: "reduce-traffic",
    label: "Reduce shopper traffic",
    description: "Lower active users to give the system room to recover.",
    applyLabel: "Cut active users in half",
  });

  fixes.push({
    id: "calmer-retries",
    label: "Use calmer retry behavior",
    description: "Aggressive retries can amplify overload during outages.",
    applyLabel: "Switch to conservative retries",
  });

  if (metrics && metrics.errorRate > 0.05) {
    return {
      statusLabel: "problem",
      headline: "Shoppers are seeing errors",
      detail: `About ${(metrics.errorRate * 100).toFixed(0)}% of requests fail end-to-end. Fix downstream components first.`,
      fixes,
      tips: ["Client-side retries make overload worse — fix the server first."],
    };
  }

  return {
    statusLabel: !metrics?.currentRps ? "idle" : "healthy",
    headline: problemHeadline(metrics, "Shopper traffic"),
    detail: problemDetail(metrics),
    fixes: metrics && metrics.errorRate > 0.02 ? fixes : [],
    tips: tips.length ? tips : ["Start with low traffic, then ramp up using traffic patterns in Advanced."],
  };
}

export function applyClientFix(fixId: string, node: SimNode, mergeNodeConfig: PatchFn): void {
  const cfg = parseClientConfig(node.config);
  switch (fixId) {
    case "reduce-traffic":
      mergeNodeConfig(node.id, clientConfigToStorage({
        ...cfg,
        activeUsers: Math.max(1, Math.floor(cfg.activeUsers / 2)),
      }));
      break;
    case "calmer-retries":
      mergeNodeConfig(node.id, clientConfigToStorage({
        ...cfg,
        retryStrategy: "conservative",
      }));
      break;
  }
}

export function getGenericBasics(
  node: SimNode,
  metrics: RuntimeMetrics | undefined,
): ComponentBasicsSnapshot {
  const fixes: BasicFixAction[] = [];
  if (overloaded(metrics)) {
    fixes.push({
      id: "generic-scale",
      label: "Open detailed settings",
      description: "Use the Advanced tab to raise throughput, memory, or replica counts.",
      applyLabel: "Switch to Advanced tab",
    });
  }

  return {
    statusLabel: !metrics ? "idle" : overloaded(metrics) ? "problem" : "healthy",
    headline: problemHeadline(metrics),
    detail: metrics?.diagnosisReason || metrics?.diagnosisSuggestion || problemDetail(metrics),
    fixes: fixes.filter((f) => !f.hidden),
    tips: metrics?.diagnosisSuggestion
      ? [metrics.diagnosisSuggestion]
      : ["Use Advanced for detailed tuning."],
  };
}

export function getComponentBasics(
  node: SimNode,
  design: SimDesign,
  metrics: RuntimeMetrics | undefined,
): ComponentBasicsSnapshot {
  switch (node.type) {
    case "sql_database":
    case "nosql_database":
    case "search_index":
    case "redis_cache":
      return getDatabaseBasics(node, design, metrics, () => {});
    case "app_server":
      return getAppServerBasics(node, metrics);
    case "load_balancer":
      return getLoadBalancerBasics(metrics);
    case "client":
      return getClientBasics(metrics);
    default:
      return getGenericBasics(node, metrics);
  }
}

export function applyComponentFix(
  fixId: string,
  node: SimNode,
  design: SimDesign,
  handlers: {
    mergeNodeConfig: PatchFn;
    updateNodeConfig: (id: string, key: string, value: string | number | boolean) => void;
  },
): void {
  switch (node.type) {
    case "sql_database":
    case "nosql_database":
    case "search_index":
    case "redis_cache":
      applyDatabaseFix(fixId, node, design, handlers.mergeNodeConfig);
      break;
    case "app_server":
      applyAppServerFix(fixId, node, handlers.mergeNodeConfig);
      break;
    case "load_balancer":
      applyLoadBalancerFix(fixId, node, handlers.updateNodeConfig);
      break;
    case "client":
      applyClientFix(fixId, node, handlers.mergeNodeConfig);
      break;
  }
}

export function isDatabaseType(type: SimComponentType): boolean {
  return type === "sql_database" || type === "nosql_database"
    || type === "search_index" || type === "redis_cache";
}
