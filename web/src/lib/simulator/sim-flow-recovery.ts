/**
 * Detect stalled simulation flow and trace root cause.
 */

import type { SimDesign, SimNode, RuntimeMetrics, SimHealth } from "./types";
import { COMPONENT_REGISTRY } from "./component-registry";
import { parseAppServerConfig } from "./app-server-model";

export interface FlowStallCause {
  nodeId: string;
  label: string;
  type: string;
  health: SimHealth;
  detail: string;
}

export interface FlowStallInfo {
  stalled: boolean;
  reason: "backends_down" | "lb_no_healthy_targets" | "none";
  /** Short headline */
  headline: string;
  /** Why traffic stopped (symptom) */
  symptom: string;
  /** Directly broken components */
  immediateCauses: FlowStallCause[];
  /** Deepest likely bottleneck */
  rootCause: FlowStallCause | null;
  /** Actionable fix */
  suggestion: string;
  loadBalancerId?: string;
}

const DATA_LAYER_TYPES = new Set([
  "sql_database",
  "nosql_database",
  "graph_database",
  "time_series_db",
  "data_warehouse",
  "search_index",
]);

const COMPUTE_TYPES = new Set(["app_server", "web_server"]);

function isDataLayer(type: string): boolean {
  return DATA_LAYER_TYPES.has(type);
}

function isComputeLayer(type: string): boolean {
  return COMPUTE_TYPES.has(type);
}

function nodeDetail(node: SimNode, m: RuntimeMetrics): string {
  if (m.diagnosisReason) return m.diagnosisReason;

  const parts: string[] = [];
  if (m.utilizationPercent > 0) parts.push(`${m.utilizationPercent}% utilized`);
  if (m.currentRps > 0) parts.push(`${Math.round(m.currentRps)} rps`);
  if (m.errorRate > 0.02) parts.push(`${(m.errorRate * 100).toFixed(0)}% errors`);
  if (m.queueDepth > 10) parts.push(`queue ${Math.round(m.queueDepth)}`);
  if (node.type === "app_server" && m.derivedCapacityBreakdown) {
    const b = m.derivedCapacityBreakdown;
    const cfg = parseAppServerConfig(node.config);
    if (b.effectiveRequestTimeMs > cfg.applicationComputeTimeMs * 2) {
      parts.push(`${b.effectiveRequestTimeMs} ms effective time (waiting on dependencies)`);
    }
  }
  return parts.length > 0 ? parts.join(" · ") : `Status: ${m.health}`;
}

function suggestionForNode(node: SimNode, m: RuntimeMetrics): string {
  if (m.diagnosisSuggestion) return m.diagnosisSuggestion;

  switch (node.type) {
    case "sql_database":
    case "nosql_database":
      return "Increase connection pool size, add read replicas, or put a cache in front of the database to reduce query load.";
    case "redis_cache":
    case "local_cache":
    case "distributed_cache":
      return "Increase cache memory or hit rate so fewer requests reach the database.";
    case "app_server":
      if (m.derivedCapacityBreakdown) {
        const cfg = parseAppServerConfig(node.config);
        if (m.derivedCapacityBreakdown.effectiveRequestTimeMs > cfg.applicationComputeTimeMs * 2) {
          return "App servers are waiting on a slow downstream dependency — scale or cache the database before adding more app servers.";
        }
      }
      return "Reduce incoming traffic, increase max concurrent slots, or add instances behind the load balancer.";
    case "load_balancer":
      return "Restore healthy backends — the load balancer is working correctly by refusing to send traffic to failed servers.";
    default:
      return "Scale this component or reduce traffic reaching it.";
  }
}

/** Find the most likely root bottleneck in the design */
function findRootBottleneck(
  design: SimDesign,
  metrics: Record<string, RuntimeMetrics>,
): FlowStallCause | null {
  const candidates: Array<{ node: SimNode; m: RuntimeMetrics; score: number }> = [];

  for (const node of design.nodes) {
    if (COMPONENT_REGISTRY[node.type].isTrafficSource) continue;
    const m = metrics[node.id];
    if (!m) continue;

    let score = m.utilizationPercent;
    if (m.health === "down") score += 50;
    else if (m.health === "failing") score += 30;
    else if (m.health === "degraded") score += 15;
    if (isDataLayer(node.type)) score += 20;
    if (m.errorRate > 0.1) score += 10;

    if (score >= 70 || m.health !== "healthy") {
      candidates.push({ node, m, score });
    }
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  return {
    nodeId: best.node.id,
    label: best.node.label,
    type: best.node.type,
    health: best.m.health,
    detail: nodeDetail(best.node, best.m),
  };
}

function downstreamDataNodes(
  design: SimDesign,
  fromNodeId: string,
): SimNode[] {
  const targets = design.edges
    .filter((e) => e.source === fromNodeId)
    .map((e) => design.nodes.find((n) => n.id === e.target))
    .filter((n): n is SimNode => !!n && isDataLayer(n.type));
  return targets;
}

/** Refine root cause: if compute is down but data layer is saturated, blame data layer */
function refineRootCause(
  design: SimDesign,
  metrics: Record<string, RuntimeMetrics>,
  immediate: FlowStallCause[],
  fallback: FlowStallCause | null,
): FlowStallCause | null {
  const downCompute = immediate.filter((c) => isComputeLayer(c.type));
  if (downCompute.length === 0) return fallback;

  for (const comp of downCompute) {
    for (const db of downstreamDataNodes(design, comp.nodeId)) {
      const dm = metrics[db.id];
      if (!dm) continue;
      if (dm.utilizationPercent >= 75 || (dm.health !== "healthy" && dm.currentRps > 10)) {
        return {
          nodeId: db.id,
          label: db.label,
          type: db.type,
          health: dm.health,
          detail: dm.currentRps < 5
            ? `${comp.label} cannot reach ${db.label} — dependency unreachable while compute is unhealthy`
            : `Database saturated at ~${Math.round(dm.currentRps)} rps (${dm.utilizationPercent}% capacity) — app servers stall waiting for queries`,
        };
      }
    }
  }

  if (fallback && isDataLayer(fallback.type)) return fallback;

  const anyDb = design.nodes.find((n) => isDataLayer(n.type) && metrics[n.id]?.utilizationPercent >= 70);
  if (anyDb) {
    const dm = metrics[anyDb.id]!;
    return {
      nodeId: anyDb.id,
      label: anyDb.label,
      type: anyDb.type,
      health: dm.health,
      detail: nodeDetail(anyDb, dm),
    };
  }

  return fallback ?? immediate[0] ?? null;
}

export function detectFlowStall(
  design: SimDesign,
  metrics: Record<string, RuntimeMetrics>,
  edgeFlowRps: Record<string, number>,
  running: boolean,
): FlowStallInfo {
  const empty: FlowStallInfo = {
    stalled: false,
    reason: "none",
    headline: "",
    symptom: "",
    immediateCauses: [],
    rootCause: null,
    suggestion: "",
  };

  if (!running) return empty;

  const unhealthyBackends = design.nodes.filter((n) => {
    if (COMPONENT_REGISTRY[n.type].isTrafficSource) return false;
    if (n.type === "load_balancer") return false;
    const m = metrics[n.id];
    if (!m) return false;
    if (m.health === "down") return true;
    if (m.health === "failing" && m.utilizationPercent >= 95) return true;
    return false;
  });

  let lbStalled = false;
  let lbId: string | undefined;

  for (const lb of design.nodes.filter((n) => n.type === "load_balancer")) {
    const outbound = design.edges.filter((e) => e.source === lb.id);
    if (outbound.length === 0) continue;
    const inboundRps = metrics[lb.id]?.currentRps ?? 0;
    if (inboundRps < 5) continue;
    const forwarding = outbound.some((e) => (edgeFlowRps[e.id] ?? 0) > 0);
    if (!forwarding) {
      lbStalled = true;
      lbId = lb.id;
      break;
    }
  }

  if (unhealthyBackends.length === 0 && !lbStalled) return empty;

  const immediateCauses: FlowStallCause[] = unhealthyBackends.map((n) => {
    const m = metrics[n.id]!;
    return {
      nodeId: n.id,
      label: n.label,
      type: n.type,
      health: m.health,
      detail: nodeDetail(n, m),
    };
  });

  const rawRoot = findRootBottleneck(design, metrics);
  const rootCause = refineRootCause(design, metrics, immediateCauses, rawRoot);

  const suggestion = rootCause
    ? suggestionForNode(
        design.nodes.find((n) => n.id === rootCause.nodeId)!,
        metrics[rootCause.nodeId]!,
      )
    : immediateCauses[0]
      ? suggestionForNode(
          design.nodes.find((n) => n.id === immediateCauses[0].nodeId)!,
          metrics[immediateCauses[0].nodeId]!,
        )
      : "Restart flow, then scale the bottleneck component or reduce client traffic.";

  if (lbStalled || unhealthyBackends.length > 0) {
    const backendLabels = immediateCauses.map((c) => c.label).join(", ");
    return {
      stalled: true,
      reason: lbStalled ? "lb_no_healthy_targets" : "backends_down",
      headline: rootCause
        ? `Root cause: ${rootCause.label}`
        : "Traffic stalled",
      symptom: lbStalled
        ? `Load Balancer is receiving traffic but cannot forward — ${backendLabels || "all backends"} ${unhealthyBackends.length === 1 ? "is" : "are"} unhealthy.`
        : `${backendLabels} ${unhealthyBackends.length === 1 ? "is" : "are"} down and cannot serve requests.`,
      immediateCauses,
      rootCause,
      suggestion,
      loadBalancerId: lbId,
    };
  }

  return empty;
}
