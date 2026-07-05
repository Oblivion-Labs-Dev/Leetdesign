/**
 * Simulation engine — traffic generation, BFS propagation, capacity/load metrics.
 * @see docs/SIMULATOR.md
 */
import type { SimDesign, SimNode, SimHealth, RuntimeMetrics } from "./types";
import { COMPONENT_REGISTRY } from "./component-registry";
import {
  parseClientConfig,
  effectiveRpsAtTick,
  computeClientExperience,
} from "./client-traffic";
import {
  parseAppServerConfig,
  computeEffectiveRequestTime,
  deriveCapacityBreakdown,
  deriveCapacityPerInstanceRps,
  simulateAppServerTick,
  hasUpstreamTrafficRouter,
} from "./app-server-model";
import {
  computeHealthyInstanceCount,
  computePoolMetrics,
  healthFromPoolUtilization,
  smoothHealthyInstanceCount,
} from "./app-server-pool";
import {
  parseDependencyConfig,
  edgeDownstreamMultiplier,
} from "./dependency-edge-config";
import { validateHop, validateDesign } from "./traffic-contracts";
import { useDesignStore, useSimulationStore } from "./store";

const HISTORY_LEN = 60;
const LOAD_EMA = 0.12;
const ERROR_EMA = 0.15;
const WORSE_HEALTH_TICKS = 4;
const BETTER_HEALTH_TICKS = 15;
const DOWN_ENTER_LOAD = 2.6;
const DOWN_EXIT_LOAD = 1.6;
const DOWN_LATCH_RELEASE = 12;

const HEALTH_RANK: Record<SimHealth, number> = {
  healthy: 0,
  degraded: 1,
  failing: 2,
  down: 3,
};

function push(arr: number[], val: number): number[] {
  const next = [...arr, val];
  if (next.length > HISTORY_LEN) next.shift();
  return next;
}

function healthFromLoad(load: number, errorRate: number): SimHealth {
  if (errorRate > 0.45 || load > 2.8) return "down";
  if (errorRate > 0.15 || load > 1.8) return "failing";
  if (errorRate > 0.04 || load > 0.85) return "degraded";
  return "healthy";
}

// ── Capacity derivation ─────────────────────────────────────────────
// Throughput is an OUTCOME, not a knob. We derive capacity from physical specs.

function deriveCapacity(node: SimNode): number {
  const c = node.config;
  const replicas = (c.replicas as number) ?? 1;

  switch (node.type) {
    case "app_server":
      // Capacity is derived per tick from slots × effective request time — not a config knob
      return 0;

    case "web_server": {
      const workers = (c.workerProcesses as number) ?? 4;
      const staticLatency = (c.avgStaticLatencyMs as number) ?? 2;
      // Web servers handle many concurrent connections with event-driven I/O
      return (workers * 1000 / staticLatency) * replicas;
    }

    case "sql_database": {
      const poolSize = (c.connectionPoolSize as number) ?? 100;
      const queryTime = (c.avgQueryTimeMs as number) ?? 5;
      const readReplicas = (c.readReplicas as number) ?? 0;
      const shards = (c.shards as number) ?? 1;
      return (poolSize / queryTime) * 1000 * shards * (1 + readReplicas);
    }

    case "nosql_database": {
      const poolSize = (c.connectionPoolSize as number) ?? 200;
      const queryTime = (c.avgQueryTimeMs as number) ?? 3;
      const shards = (c.shards as number) ?? 3;
      return (poolSize / queryTime) * 1000 * shards * replicas;
    }

    case "search_index": {
      const poolSize = (c.connectionPoolSize as number) ?? 50;
      const queryTime = (c.avgQueryTimeMs as number) ?? 15;
      return (poolSize / queryTime) * 1000 * replicas;
    }

    case "graph_database": {
      const poolSize = (c.connectionPoolSize as number) ?? 50;
      const queryTime = (c.avgQueryTimeMs as number) ?? 10;
      return (poolSize / queryTime) * 1000 * replicas;
    }

    case "time_series_db": {
      const maxWrites = (c.maxConcurrentWrites as number) ?? 5000;
      const writeTime = (c.avgWriteTimeMs as number) ?? 2;
      return (maxWrites / writeTime) * 1000 * replicas;
    }

    case "data_warehouse": {
      const maxQueries = (c.maxConcurrentQueries as number) ?? 20;
      const queryTime = (c.avgQueryTimeMs as number) ?? 2000;
      const nodes = (c.nodes as number) ?? 4;
      return (maxQueries / queryTime) * 1000 * nodes;
    }

    case "object_storage": {
      const latency = (c.avgLatencyMs as number) ?? 50;
      return (1000 / latency) * 1000 * replicas;
    }

    case "load_balancer":
    case "firewall": {
      const maxConn = (c.maxConnections as number) ?? 10_000;
      return maxConn * replicas;
    }

    case "api_gateway": {
      const maxConn = (c.maxConnections as number) ?? 10_000;
      const rateLimit = (c.rateLimitRps as number) ?? 5000;
      return Math.min(rateLimit, maxConn) * replicas;
    }

    case "reverse_proxy": {
      const maxConn = (c.maxConnections as number) ?? 10_000;
      return maxConn * replicas;
    }

    case "rate_limiter": {
      return (c.maxRps as number) ?? 1000;
    }

    case "redis_cache":
    case "local_cache":
    case "distributed_cache": {
      // Caches are extremely fast — sub-millisecond. Rarely the bottleneck.
      const nodes = (c.nodes as number) ?? replicas;
      return 100_000 * nodes;
    }

    case "cdn": {
      // CDN has virtually unlimited edge capacity
      return 1_000_000;
    }

    case "message_queue":
    case "event_bus":
    case "pub_sub": {
      // Buffer intake capacity is very high; drain rate is what matters
      return 500_000;
    }

    case "stream_processor": {
      const parallelism = (c.parallelism as number) ?? 4;
      const processingTime = (c.avgProcessingTimeMs as number) ?? 20;
      return (parallelism / processingTime) * 1000;
    }

    case "notification_service": {
      const maxSends = (c.maxConcurrentSends as number) ?? 100;
      const processingTime = (c.avgProcessingTimeMs as number) ?? 200;
      return (maxSends / processingTime) * 1000 * replicas;
    }

    case "websocket_server": {
      const maxConn = (c.maxConnections as number) ?? 50_000;
      return maxConn * replicas;
    }

    default:
      return 100_000;
  }
}

// How much latency this component adds per request at baseline (no load pressure)
function deriveBaseLatency(node: SimNode): number {
  const c = node.config;

  switch (node.type) {
    case "app_server":
      return parseAppServerConfig(c).applicationComputeTimeMs;
    case "web_server":
      return (c.avgStaticLatencyMs as number) ?? 2;
    case "sql_database":
      return (c.avgQueryTimeMs as number) ?? 5;
    case "nosql_database":
      return (c.avgQueryTimeMs as number) ?? 3;
    case "search_index":
      return (c.avgQueryTimeMs as number) ?? 15;
    case "graph_database":
      return (c.avgQueryTimeMs as number) ?? 10;
    case "time_series_db":
      return (c.avgWriteTimeMs as number) ?? 2;
    case "data_warehouse":
      return (c.avgQueryTimeMs as number) ?? 2000;
    case "object_storage":
      return (c.avgLatencyMs as number) ?? 50;
    case "load_balancer":
    case "firewall":
      return 0.5;
    case "api_gateway":
      return (c.authEnabled as boolean) ? ((c.authLatencyMs as number) ?? 5) : 1;
    case "reverse_proxy":
      return 1;
    case "rate_limiter":
      return 0.5;
    case "redis_cache":
    case "local_cache":
    case "distributed_cache":
      return 1;
    case "cdn":
      return 5;
    case "message_queue":
    case "event_bus":
    case "pub_sub":
      return 2;
    case "stream_processor":
      return (c.avgProcessingTimeMs as number) ?? 20;
    case "notification_service":
      return (c.avgProcessingTimeMs as number) ?? 200;
    case "websocket_server":
      return 1;
    default:
      return 5;
  }
}

// What fraction of traffic is forwarded downstream
function getForwardRatio(node: SimNode, _incomingRps: number): number {
  const c = node.config;
  const behavior = COMPONENT_REGISTRY[node.type].routingBehavior;

  switch (behavior) {
    case "filter": {
      if (node.type === "cdn") return 1 - ((c.cacheHitRate as number) ?? 0.9);
      if (node.type === "web_server") return 1 - ((c.staticCacheHitRate as number) ?? 0.8);
      if (node.type === "reverse_proxy") return 1 - ((c.cacheHitRate as number) ?? 0.3);
      // redis_cache, local_cache, distributed_cache
      return 1 - ((c.hitRate as number) ?? 0.85);
    }
    case "throttle": {
      const limit = (c.maxRps as number) ?? 1000;
      if (_incomingRps <= limit) return 1;
      return limit / _incomingRps;
    }
    case "buffer": {
      // Buffers accept all traffic; consumers drain at their own rate
      const consumerCount = (c.consumerCount as number) ?? 2;
      const processingMs = (c.consumerProcessingMs as number) ?? 100;
      const drainRate = (consumerCount / processingMs) * 1000;
      if (_incomingRps <= drainRate) return 1;
      return drainRate / _incomingRps;
    }
    case "split":
    case "passthrough":
      return 1;
    default:
      return 1;
  }
}

// How many errors the throttle/rate-limit generates
function getThrottleErrors(node: SimNode, incomingRps: number): number {
  const behavior = COMPONENT_REGISTRY[node.type].routingBehavior;

  if (behavior === "throttle") {
    const limit = (node.config.maxRps as number) ?? 1000;
    if (incomingRps > limit) return incomingRps - limit;
  }

  if (node.type === "api_gateway") {
    const rateLimit = (node.config.rateLimitRps as number) ?? 5000;
    if (incomingRps > rateLimit) return incomingRps - rateLimit;
  }

  return 0;
}

// ── Runtime state ──────────────────────────────────────────────────

interface NodeRuntime {
  queueDepth: number;
  totalReqs: number;
  latencyVals: number[];
  errors: number;
  rpsHistory: number[];
  latencyHistory: number[];
  errorHistory: number[];
  smoothedLoad: number;
  smoothedError: number;
  stableHealth: SimHealth;
  healthCandidate: SimHealth;
  healthCandidateTicks: number;
  latchedDown: boolean;
  downRecoveryTicks: number;
  /** In-flight requests (Little's Law) — used by least-connections routing */
  activeConnections: number;
  /** RPS rejected due to architecture contract violations on inbound edges */
  archRejectedRps: number;
  archViolationMessage: string;
  archViolationSuggestion: string;
  /** Last tick completed RPS (app server) */
  completedRpsLastTick: number;
  effectiveRequestTimeMs: number;
  effectiveInstanceCount: number;
  derivedCapacityRps: number;
  activeRequestsCount: number;
  /** Healthy replicas in an app-server pool (simulated instance health) */
  healthyInstanceCount: number;
  /** Smoothed display value for healthy replicas (avoids UI flicker) */
  displayHealthyInstanceCount: number;
  /** Last seen configured replica count — detects scale-out in live sim */
  trackedInstanceCount: number;
}

interface SplitTarget {
  id: string;
  edgeId: string;
  weight: number;
}

/** Routers (LB, API GW) measure load by open connections, not raw RPS. */
function isConnectionRouted(node: SimNode): boolean {
  return node.type === "load_balancer" || node.type === "api_gateway" ||
    node.type === "reverse_proxy" || node.type === "firewall";
}

function computeNodeLoad(
  node: SimNode,
  incomingRps: number,
  rt: NodeRuntime,
  latencyMs: number,
): { capacity: number; load: number } {
  const c = node.config;
  const replicas = (c.replicas as number) ?? 1;

  if (node.type === "app_server" && rt.derivedCapacityRps > 0) {
    const capacity = rt.derivedCapacityRps;
    rt.activeConnections = rt.activeRequestsCount;
    return { capacity, load: capacity > 0 ? incomingRps / capacity : 999 };
  }

  if (isConnectionRouted(node)) {
    const maxConn = (c.maxConnections as number) ?? 10_000;
    // Little's Law: connections = throughput × hold time
    const holdSec = Math.max(latencyMs, 0.5) / 1000;
    rt.activeConnections = incomingRps * holdSec;
    const capacity = maxConn * replicas;
    return { capacity, load: capacity > 0 ? rt.activeConnections / capacity : 999 };
  }

  const capacity = deriveCapacity(node);
  rt.activeConnections = Math.round(incomingRps * Math.max(latencyMs, 1) / 1000);
  return { capacity, load: capacity > 0 ? incomingRps / capacity : 999 };
}

function isBackendHealthy(targetId: string): boolean {
  const rt = runtimes[targetId];
  if (!rt) return true;
  return !rt.latchedDown && rt.stableHealth !== "down";
}

function computeSplitFractions(
  node: SimNode,
  targets: SplitTarget[],
): number[] {
  const n = targets.length;
  if (n === 0) return [];
  if (n === 1) return [1];

  const algorithm = (node.config.algorithm as string) ?? "round_robin";

  switch (algorithm) {
    case "least_connections": {
      const invConn = targets.map((t) => {
        const rt = runtimes[t.id];
        const conn = rt?.activeConnections ?? 1;
        return 1 / Math.max(conn, 0.1);
      });
      const total = invConn.reduce((a, b) => a + b, 0);
      return invConn.map((v) => v / total);
    }
    case "ip_hash": {
      // Sticky hash — deterministic skew mimics real uneven key distribution
      const hashes = targets.map((t) => {
        let h = 0;
        for (let i = 0; i < t.id.length; i++) {
          h = ((h << 5) - h + t.id.charCodeAt(i)) | 0;
        }
        return (Math.abs(h) % 80) + 20;
      });
      const total = hashes.reduce((a, b) => a + b, 0);
      return hashes.map((h) => h / total);
    }
    case "weighted":
    case "weighted_round_robin": {
      const weights = targets.map((t) => Math.max(1, t.weight));
      const total = weights.reduce((a, b) => a + b, 0);
      return weights.map((w) => w / total);
    }
    case "least_response_time": {
      const invLat = targets.map((t) => {
        const rt = runtimes[t.id];
        const lat = rt?.latencyHistory[rt.latencyHistory.length - 1]
          ?? rt?.latencyVals[rt.latencyVals.length - 1]
          ?? 50;
        return 1 / Math.max(lat, 1);
      });
      const total = invLat.reduce((a, b) => a + b, 0);
      return invLat.map((v) => v / total);
    }
    case "path_based": {
      const weights = targets.map((t, idx) => {
        let h = idx * 17;
        for (let i = 0; i < t.id.length; i++) {
          h = ((h << 5) - h + t.id.charCodeAt(i)) | 0;
        }
        return (Math.abs(h) % 60) + 40;
      });
      const total = weights.reduce((a, b) => a + b, 0);
      return weights.map((w) => w / total);
    }
    case "header_based": {
      const weights = targets.map((t) => {
        let h = 7;
        for (let i = t.id.length - 1; i >= 0; i--) {
          h = ((h << 3) - h + t.id.charCodeAt(i)) | 0;
        }
        return (Math.abs(h) % 70) + 30;
      });
      const total = weights.reduce((a, b) => a + b, 0);
      return weights.map((w) => w / total);
    }
    case "round_robin":
    default: {
      return targets.map(() => 1 / n);
    }
  }
}

function routeToTargets(
  node: SimNode,
  sourceId: string,
  targets: string[],
  forwardAmount: number,
  edges: SimDesign["edges"],
  incoming: Record<string, number>,
  queue: string[],
  edgeFlows: Record<string, number>,
  tickRpsScale: number,
  nodeMap: Map<string, SimNode>,
  archRejected: Record<string, number>,
): void {
  if (targets.length === 0 || forwardAmount <= 0) return;

  const def = COMPONENT_REGISTRY[node.type];
  const splitTargets: SplitTarget[] = [];

  for (const targetId of targets) {
    if (!isBackendHealthy(targetId)) continue;
    const edge = edges.find((e) => e.source === sourceId && e.target === targetId);
    splitTargets.push({
      id: targetId,
      edgeId: edge?.id ?? "",
      weight: (edge?.config.weight as number) ?? 1,
    });
  }

  if (splitTargets.length === 0) return;

  const fractions = def.routingBehavior === "split"
    ? computeSplitFractions(node, splitTargets)
    : splitTargets.map(() => 1 / splitTargets.length);

  splitTargets.forEach((t, i) => {
    const targetNode = nodeMap.get(t.id);
    const edge = edges.find((e) => e.source === sourceId && e.target === t.id);
    let multiplier = 1;
    if (node.type === "app_server" && targetNode && edge) {
      const dep = parseDependencyConfig(edge, targetNode.type);
      if (dep) {
        const rt = runtimes[node.id];
        const useCompleted = dep.kind === "queue";
        multiplier = edgeDownstreamMultiplier(dep, useCompleted);
        if (useCompleted && rt) {
          const completedFraction = rt.completedRpsLastTick / Math.max(1, rt.rpsHistory[rt.rpsHistory.length - 1] ?? 1);
          multiplier *= Math.min(1, completedFraction);
        }
      }
    }
    const baseFraction = forwardAmount * fractions[i];
    const amount = baseFraction * multiplier;
    const hop = targetNode && edge
      ? validateHop(node, targetNode, edge.protocol)
      : { valid: true, severity: "warning" as const, code: "", message: "", suggestion: "" };

    if (!hop.valid) {
      archRejected[t.id] = (archRejected[t.id] ?? 0) + amount;
      const rt = runtimes[t.id];
      if (rt) {
        rt.archRejectedRps += amount / tickRpsScale;
        rt.archViolationMessage = hop.message;
        rt.archViolationSuggestion = hop.suggestion;
      }
      if (t.edgeId) edgeFlows[t.edgeId] = 0;
      return;
    }

    incoming[t.id] = (incoming[t.id] ?? 0) + amount;
    if (t.edgeId) {
      edgeFlows[t.edgeId] = amount / tickRpsScale;
    }
    queue.push(t.id);
  });
}

function updateStableHealth(rt: NodeRuntime, raw: SimHealth): SimHealth {
  if (raw === rt.stableHealth) {
    rt.healthCandidate = raw;
    rt.healthCandidateTicks = 0;
    return rt.stableHealth;
  }

  const worsening = HEALTH_RANK[raw] > HEALTH_RANK[rt.stableHealth];
  const required = worsening ? WORSE_HEALTH_TICKS : BETTER_HEALTH_TICKS;

  if (raw === rt.healthCandidate) {
    rt.healthCandidateTicks += 1;
  } else {
    rt.healthCandidate = raw;
    rt.healthCandidateTicks = 1;
  }

  if (rt.healthCandidateTicks >= required) {
    rt.stableHealth = raw;
    rt.healthCandidate = raw;
    rt.healthCandidateTicks = 0;
  }

  return rt.stableHealth;
}

let runtimes: Record<string, NodeRuntime> = {};
let clientDownstreamErrorByNode = new Map<string, number>();
let tickTimer: ReturnType<typeof setInterval> | null = null;
let tickCount = 0;

let systemStableHealth: SimHealth = "healthy";
let systemHealthCandidate: SimHealth = "healthy";
let systemHealthCandidateTicks = 0;

// Render throttling: only push to Zustand every N ticks
let renderAccumulator = 0;
const RENDER_EVERY_TICKS = 5; // 500ms at 100ms tick rate

function updateSystemStableHealth(raw: SimHealth): SimHealth {
  if (raw === systemStableHealth) {
    systemHealthCandidate = raw;
    systemHealthCandidateTicks = 0;
    return systemStableHealth;
  }

  const worsening = HEALTH_RANK[raw] > HEALTH_RANK[systemStableHealth];
  const required = worsening ? WORSE_HEALTH_TICKS : BETTER_HEALTH_TICKS;

  if (raw === systemHealthCandidate) {
    systemHealthCandidateTicks += 1;
  } else {
    systemHealthCandidate = raw;
    systemHealthCandidateTicks = 1;
  }

  if (systemHealthCandidateTicks >= required) {
    systemStableHealth = raw;
    systemHealthCandidate = raw;
    systemHealthCandidateTicks = 0;
  }

  return systemStableHealth;
}

function randomBetween(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min));
}

function ensureRuntime(id: string): NodeRuntime {
  if (!runtimes[id]) {
    runtimes[id] = {
      queueDepth: 0,
      totalReqs: 0,
      latencyVals: [],
      errors: 0,
      rpsHistory: [],
      latencyHistory: [],
      errorHistory: [],
      smoothedLoad: 0,
      smoothedError: 0,
      stableHealth: "healthy",
      healthCandidate: "healthy",
      healthCandidateTicks: 0,
      latchedDown: false,
      downRecoveryTicks: 0,
      activeConnections: 0,
      archRejectedRps: 0,
      archViolationMessage: "",
      archViolationSuggestion: "",
      completedRpsLastTick: 0,
      effectiveRequestTimeMs: 0,
      effectiveInstanceCount: 1,
      derivedCapacityRps: 0,
      activeRequestsCount: 0,
      healthyInstanceCount: 0,
      displayHealthyInstanceCount: 0,
      trackedInstanceCount: 0,
    };
  }
  return runtimes[id];
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(Math.floor(sorted.length * p), sorted.length - 1);
  return sorted[idx];
}

// ── Main simulation tick ───────────────────────────────────────────

function tick(design: SimDesign, timeScale: number) {
  tickCount++;
  renderAccumulator++;

  const { nodes, edges } = design;
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const outEdges = new Map<string, string[]>();
  const inEdges = new Map<string, string[]>();

  for (const e of edges) {
    if (!outEdges.has(e.source)) outEdges.set(e.source, []);
    outEdges.get(e.source)!.push(e.target);
    if (!inEdges.has(e.target)) inEdges.set(e.target, []);
    inEdges.get(e.target)!.push(e.source);
  }

  const incoming: Record<string, number> = {};
  const edgeFlows: Record<string, number> = {};
  const archRejected: Record<string, number> = {};
  const tickRpsScale = (design.simulation.tickRateMs * timeScale) / 1000;

  for (const rt of Object.values(runtimes)) {
    rt.archRejectedRps = 0;
    rt.archViolationMessage = "";
    rt.archViolationSuggestion = "";
  }

  // Phase 1: traffic generation from client nodes
  for (const node of nodes) {
    const def = COMPONENT_REGISTRY[node.type];
    if (def.isTrafficSource) {
      const clientCfg = parseClientConfig(node.config);
      const tickRateMs = design.simulation.tickRateMs;
      const downstreamErr = clientDownstreamErrorByNode.get(node.id) ?? 0;
      const effectiveRps = effectiveRpsAtTick(clientCfg, tickCount, tickRateMs, downstreamErr);
      const tickRps = (effectiveRps * timeScale * tickRateMs) / 1000;
      const targets = outEdges.get(node.id) ?? [];
      const perTarget = targets.length > 0 ? tickRps / targets.length : 0;
      for (const t of targets) {
        const targetNode = nodeMap.get(t);
        const edge = edges.find((e) => e.source === node.id && e.target === t);
        const hop = targetNode && edge
          ? validateHop(node, targetNode, edge.protocol)
          : { valid: true, severity: "warning" as const, code: "", message: "", suggestion: "" };

        if (!hop.valid) {
          archRejected[t] = (archRejected[t] ?? 0) + perTarget;
          const rt = ensureRuntime(t);
          rt.archRejectedRps += perTarget / tickRpsScale;
          rt.archViolationMessage = hop.message;
          rt.archViolationSuggestion = hop.suggestion;
          if (edge) edgeFlows[edge.id] = 0;
        } else {
          incoming[t] = (incoming[t] ?? 0) + perTarget;
          if (edge) edgeFlows[edge.id] = perTarget / tickRpsScale;
        }
      }
      const rt = ensureRuntime(node.id);
      rt.totalReqs += tickRps;
      rt.rpsHistory = push(rt.rpsHistory, effectiveRps);
      rt.latencyHistory = push(rt.latencyHistory, 0);
      rt.errorHistory = push(rt.errorHistory, 0);
    }
  }

  // Phase 2: process traffic through non-source nodes (BFS)
  const visited = new Set<string>();
  const queue = nodes
    .filter((n) => COMPONENT_REGISTRY[n.type].isTrafficSource)
    .flatMap((n) => outEdges.get(n.id) ?? []);

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const node = nodeMap.get(id);
    if (!node) continue;

    const def = COMPONENT_REGISTRY[node.type];
    if (def.routingBehavior === "none") continue;

    const rt = ensureRuntime(id);
    const incomingTick = incoming[id] ?? 0;
    const incomingPerSec = incomingTick / tickRpsScale;
    const baseLatency = deriveBaseLatency(node);

    let capacity = 0;
    let load = 0;
    let actualLatency = baseLatency;
    let errorRate = 0;
    let overloadError = 0;
    let throttleErrors = 0;

    if (node.type === "app_server") {
      const appCfg = parseAppServerConfig(node.config);
      if (appCfg.instanceCount !== rt.trackedInstanceCount) {
        if (appCfg.instanceCount > rt.trackedInstanceCount && rt.trackedInstanceCount > 0) {
          rt.displayHealthyInstanceCount = Math.max(
            rt.displayHealthyInstanceCount,
            appCfg.instanceCount,
          );
        }
        rt.trackedInstanceCount = appCfg.instanceCount;
      }
      const outbound = edges.filter((e) => e.source === id);
      const inbound = inEdges.get(id) ?? [];
      const hasRouter = hasUpstreamTrafficRouter(inbound, nodeMap);

      const metricSnapshot: Record<string, RuntimeMetrics> = {};
      for (const n of nodes) {
        const nrt = runtimes[n.id];
        const lastLat = nrt?.latencyHistory[nrt.latencyHistory.length - 1] ?? deriveBaseLatency(n);
        metricSnapshot[n.id] = { avgLatencyMs: lastLat } as RuntimeMetrics;
      }

      const eff = computeEffectiveRequestTime(appCfg, outbound, nodeMap, metricSnapshot);
      const capBreak = deriveCapacityBreakdown(appCfg, eff.effectiveRequestTimeMs, hasRouter);
      const poolReplicaCount = capBreak.effectiveInstanceCount;
      const maxSlots = appCfg.maxConcurrentRequestsPerInstance * poolReplicaCount;
      const capPerInstance = deriveCapacityPerInstanceRps(
        appCfg.maxConcurrentRequestsPerInstance,
        eff.effectiveRequestTimeMs,
      );

      rt.effectiveRequestTimeMs = eff.effectiveRequestTimeMs;
      rt.effectiveInstanceCount = capBreak.effectiveInstanceCount;
      rt.derivedCapacityRps = capPerInstance * poolReplicaCount;

      const sim = simulateAppServerTick({
        incomingRps: incomingPerSec,
        dtSec: tickRpsScale,
        cfg: appCfg,
        maxSlots,
        effectiveRequestTimeMs: eff.effectiveRequestTimeMs,
        state: {
          activeRequests: rt.activeRequestsCount,
          queueDepth: rt.queueDepth,
        },
      });

      rt.completedRpsLastTick = sim.completedRps;
      rt.activeRequestsCount = sim.nextState.activeRequests;
      rt.queueDepth = sim.nextState.queueDepth;
      rt.derivedCapacityRps = sim.maxCompletionRps;
      capacity = sim.maxCompletionRps;
      load = capacity > 0 ? incomingPerSec / capacity : incomingPerSec > 0 ? 999 : 0;
      actualLatency = sim.responseTimeMs * (0.97 + Math.random() * 0.06);
      throttleErrors = getThrottleErrors(node, incomingPerSec);
      errorRate = Math.min(1, sim.errorRate + (incomingPerSec > 0 ? throttleErrors / incomingPerSec : 0));
      overloadError = sim.errorRate;
      rt.activeConnections = sim.activeRequests;
    } else {
      const loadResult = computeNodeLoad(node, incomingPerSec, rt, baseLatency);
      capacity = loadResult.capacity;
      load = loadResult.load;

      const latencyMultiplier = load < 0.7
        ? 1 + Math.max(0, load - 0.5) * 0.5
        : load < 1.0
          ? 1 / (1 - load * 0.7)
          : 3 + Math.pow(load - 1, 1.5) * 10;
      actualLatency = baseLatency * latencyMultiplier * (0.9 + Math.random() * 0.2);

      if (!isConnectionRouted(node)) {
        rt.activeConnections = incomingPerSec * (actualLatency / 1000);
      }

      overloadError = load > 1 ? Math.min((load - 1) * 0.3, 1) : 0;
      throttleErrors = getThrottleErrors(node, incomingPerSec);
      const throttleErrorRate = incomingPerSec > 0 ? throttleErrors / incomingPerSec : 0;
      errorRate = Math.min(overloadError + throttleErrorRate, 1);

      if (load > 1) {
        rt.queueDepth += (incomingTick - capacity * tickRpsScale) * 0.15;
      } else {
        rt.queueDepth = Math.max(0, rt.queueDepth * 0.92 - capacity * 0.02);
      }
    }

    rt.smoothedLoad = rt.smoothedLoad === 0
      ? load
      : rt.smoothedLoad * (1 - LOAD_EMA) + load * LOAD_EMA;

    // Down latch logic
    if (capacity === 0) {
      rt.latchedDown = true;
      rt.downRecoveryTicks = 0;
    } else if (rt.latchedDown) {
      if (rt.smoothedLoad < DOWN_EXIT_LOAD) {
        rt.downRecoveryTicks += 1;
        if (rt.downRecoveryTicks >= DOWN_LATCH_RELEASE) {
          rt.latchedDown = false;
          rt.downRecoveryTicks = 0;
        }
      } else {
        rt.downRecoveryTicks = 0;
      }
    } else if (rt.smoothedLoad > DOWN_ENTER_LOAD && node.type !== "app_server") {
      rt.latchedDown = true;
      rt.downRecoveryTicks = 0;
    }

    // DOWN node: absorb traffic; drain in-flight work so components can recover
    if (rt.latchedDown) {
      if (node.type === "app_server") {
        rt.activeRequestsCount = Math.max(0, rt.activeRequestsCount * 0.55);
        rt.queueDepth = Math.max(0, rt.queueDepth * 0.55);
        rt.smoothedLoad = Math.max(0, rt.smoothedLoad * 0.88);
        rt.smoothedError = Math.max(0, rt.smoothedError * 0.92);
        if (rt.activeRequestsCount < 0.5 && rt.queueDepth < 0.5) {
          rt.latchedDown = false;
          rt.downRecoveryTicks = 0;
        }
      }

      const draining = incomingPerSec < 1;
      rt.totalReqs += incomingTick;
      if (draining || node.type === "app_server") {
        rt.rpsHistory = push(rt.rpsHistory, incomingPerSec);
        rt.latencyHistory = push(rt.latencyHistory, node.type === "app_server" ? 0 : 0);
        rt.errorHistory = push(rt.errorHistory, node.type === "app_server" && incomingPerSec > 0 ? 0.5 : 0);
      } else {
        rt.errors += incomingTick;
        rt.rpsHistory = push(rt.rpsHistory, incomingPerSec);
        rt.latencyHistory = push(rt.latencyHistory, 99999);
        rt.errorHistory = push(rt.errorHistory, 1);
        rt.queueDepth += incomingTick * 0.2;
      }
      continue;
    }

    const forwardRatio = getForwardRatio(node, incomingPerSec);

    rt.totalReqs += incomingTick;
    rt.latencyVals.push(actualLatency);
    if (rt.latencyVals.length > 100) rt.latencyVals = rt.latencyVals.slice(-100);

    rt.smoothedError = rt.smoothedError * (1 - ERROR_EMA) + errorRate * ERROR_EMA;
    rt.errors += throttleErrors * tickRpsScale;

    rt.rpsHistory = push(rt.rpsHistory, incomingPerSec);
    rt.latencyHistory = push(rt.latencyHistory, actualLatency);
    rt.errorHistory = push(rt.errorHistory, errorRate);

    const targets = outEdges.get(id) ?? [];
    if (targets.length > 0 && forwardRatio > 0) {
      let forwardAmount = incomingTick * forwardRatio * (1 - overloadError);
      if (node.type === "app_server") {
        forwardAmount = Math.min(
          forwardAmount,
          rt.completedRpsLastTick * tickRpsScale * forwardRatio,
        );
      }
      routeToTargets(node, id, targets, forwardAmount, edges, incoming, queue, edgeFlows, tickRpsScale, nodeMap, archRejected);
    }
  }

  // Phase 2b: starve unreachable nodes
  for (const node of nodes) {
    if (COMPONENT_REGISTRY[node.type].isTrafficSource) continue;
    if (visited.has(node.id)) continue;
    const rt = ensureRuntime(node.id);
    rt.rpsHistory = push(rt.rpsHistory, 0);
    rt.latencyHistory = push(rt.latencyHistory, 0);
    rt.errorHistory = push(rt.errorHistory, 0);
    rt.queueDepth = Math.max(0, rt.queueDepth * 0.85 - 1);
  }

  // Phase 3: compute metrics and update store (throttled for perf)
  if (renderAccumulator < RENDER_EVERY_TICKS) return;
  renderAccumulator = 0;

  useSimulationStore.getState().setArchitectureViolations(validateDesign(design));
  const staticViolations = useSimulationStore.getState().architectureViolations;

  let totalRps = 0;
  let latencySum = 0;
  let latencyCount = 0;
  let worstHealth: SimHealth = "healthy";

  const batchMetrics: Record<string, RuntimeMetrics> = {};

  for (const node of nodes) {
    const rt = ensureRuntime(node.id);
    const sorted = [...rt.latencyVals].sort((a, b) => a - b);
    const lastRps = rt.rpsHistory[rt.rpsHistory.length - 1] ?? 0;
    const rawLastLatency = rt.latencyHistory[rt.latencyHistory.length - 1] ?? 0;
    const lastLatency = rawLastLatency > 10_000 ? 0 : rawLastLatency;

    const capacity = node.type === "app_server" && rt.derivedCapacityRps > 0
      ? rt.derivedCapacityRps
      : deriveCapacity(node);
    const displayLoad = capacity > 0 ? lastRps / capacity : 0;
    const isSource = COMPONENT_REGISTRY[node.type].isTrafficSource;
    const behavior = COMPONENT_REGISTRY[node.type].routingBehavior;
    const nodeStaticErrors = staticViolations.filter(
      (v) => v.targetId === node.id && v.severity === "error",
    );
    const hasArchViolation = rt.archRejectedRps > 0.01 || nodeStaticErrors.length > 0;

    let poolUtilForHealth = 0;
    if (node.type === "app_server" && rt.effectiveInstanceCount > 0) {
      const appCfg = parseAppServerConfig(node.config);
      const capPer = deriveCapacityPerInstanceRps(
        appCfg.maxConcurrentRequestsPerInstance,
        rt.effectiveRequestTimeMs,
      );
      const poolCap = capPer * rt.effectiveInstanceCount;
      const maxSlots =
        appCfg.maxConcurrentRequestsPerInstance * rt.effectiveInstanceCount;
      const rpsUtil = poolCap > 0 ? Math.round((lastRps / poolCap) * 100) : 0;
      const slotUtil =
        maxSlots > 0
          ? Math.round((rt.activeRequestsCount / maxSlots) * 100)
          : 0;
      poolUtilForHealth = Math.max(rpsUtil, slotUtil);
    }

    let rawHealth: SimHealth = "healthy";
    if (!isSource && behavior !== "none") {
      if (hasArchViolation) {
        rawHealth = "failing";
      } else if (rt.latchedDown) {
        rawHealth = "down";
      } else if (!visited.has(node.id) && (inEdges.get(node.id) ?? []).length > 0) {
        rawHealth = "degraded";
      } else if (node.type === "app_server") {
        rawHealth = healthFromPoolUtilization(poolUtilForHealth, rt.smoothedError, false);
      } else {
        rawHealth = healthFromLoad(rt.smoothedLoad, rt.smoothedError);
      }
    }

    const health = (isSource || behavior === "none")
      ? "healthy"
      : updateStableHealth(rt, rawHealth);

    // Diagnostics
    let diagnosisReason = "";
    let diagnosisSuggestion = "";
    if (!isSource && behavior !== "none" && hasArchViolation) {
      if (rt.archViolationMessage) {
        diagnosisReason = `Architecture violation: ${rt.archViolationMessage}`;
        diagnosisSuggestion = rt.archViolationSuggestion;
      } else if (nodeStaticErrors[0]) {
        diagnosisReason = `Architecture violation: ${nodeStaticErrors[0].message}`;
        diagnosisSuggestion = nodeStaticErrors[0].suggestion;
      }
    } else if (!isSource && behavior !== "none" && health !== "healthy") {
      let diagnosedDownstream = false;
      if (node.type === "app_server") {
        for (const targetId of outEdges.get(node.id) ?? []) {
          const target = nodeMap.get(targetId);
          if (!target) continue;
          const isDb = target.type === "sql_database" || target.type === "nosql_database"
            || target.type === "graph_database" || target.type === "search_index";
          if (!isDb) continue;
          const trt = runtimes[targetId];
          const targetLastRps = trt?.rpsHistory[trt.rpsHistory.length - 1] ?? 0;
          const targetCap = deriveCapacity(target);
          if (targetCap > 0 && targetLastRps / targetCap >= 0.75) {
            const pct = Math.round((targetLastRps / targetCap) * 100);
            diagnosisReason = `Blocked waiting on ${target.label} (~${Math.round(targetLastRps)} queries/sec, ${pct}% of DB capacity)`;
            diagnosisSuggestion = `Scale ${target.label} (connection pool, read replicas) or add a cache — more app servers will not help`;
            diagnosedDownstream = true;
            break;
          }
        }
      }
      if (!diagnosedDownstream && rt.latchedDown && rt.smoothedLoad > 1.8) {
        diagnosisReason = `Overloaded: receiving ~${Math.round(lastRps)} rps but derived capacity is ~${Math.round(capacity)} rps (${Math.round(rt.smoothedLoad * 100)}% sustained load)`;
        diagnosisSuggestion = "Add replicas to distribute load, or add a cache upstream to reduce requests reaching this component";
      } else if (!diagnosedDownstream && !visited.has(node.id)) {
        const upstreamNames = (inEdges.get(node.id) ?? [])
          .map((srcId) => nodeMap.get(srcId)?.label ?? srcId)
          .join(", ");
        diagnosisReason = `No traffic reaching this component — upstream (${upstreamNames || "none"}) is down or unreachable`;
        diagnosisSuggestion = "Fix upstream components first, or add an alternative route";
      } else if (!diagnosedDownstream && rt.smoothedLoad > 1.8) {
        diagnosisReason = `Overloaded: receiving ~${Math.round(lastRps)} rps but derived capacity is ~${Math.round(capacity)} rps`;
        diagnosisSuggestion = "Scale horizontally (add replicas) or reduce traffic via caching/rate-limiting upstream";
      } else if (rt.smoothedError > 0.15) {
        diagnosisReason = `High error rate (${(rt.smoothedError * 100).toFixed(0)}%) — likely cascading from upstream failures or throttling`;
        diagnosisSuggestion = "Check upstream components for overload; add circuit breakers";
      } else if (rt.smoothedError > 0.04) {
        diagnosisReason = `Elevated error rate (${(rt.smoothedError * 100).toFixed(0)}%) under current load`;
        diagnosisSuggestion = "Consider scaling up or reducing traffic at the source";
      } else {
        diagnosisReason = `Load at ${Math.round(rt.smoothedLoad * 100)}% of capacity — approaching limits`;
        diagnosisSuggestion = "Scale horizontally (add replicas) before traffic grows further";
      }
    }

    const archErrorRate = hasArchViolation ? 1 : rt.smoothedError;
    let utilizationPercent = hasArchViolation
      ? 0
      : Math.min(100, Math.round(rt.smoothedLoad * 100));

    if (node.type === "app_server" && rt.effectiveInstanceCount > 0) {
      const appCfg = parseAppServerConfig(node.config);
      const capPerInstance = deriveCapacityPerInstanceRps(
        appCfg.maxConcurrentRequestsPerInstance,
        rt.effectiveRequestTimeMs,
      );
      const poolCap = capPerInstance * rt.effectiveInstanceCount;
      const maxSlots =
        appCfg.maxConcurrentRequestsPerInstance * rt.effectiveInstanceCount;
      const rpsUtil =
        poolCap > 0 ? Math.round((lastRps / poolCap) * 100) : 0;
      const slotUtil =
        maxSlots > 0
          ? Math.round((rt.activeRequestsCount / maxSlots) * 100)
          : 0;
      utilizationPercent = Math.max(rpsUtil, slotUtil);
    }

    const metrics: RuntimeMetrics = {
      currentRps: Math.round(lastRps),
      totalRequests: Math.round(rt.totalReqs),
      avgLatencyMs: Math.round(lastLatency * 10) / 10,
      p95LatencyMs: Math.round(percentile(sorted, 0.95) * 10) / 10,
      p99LatencyMs: Math.round(percentile(sorted, 0.99) * 10) / 10,
      health,
      errorRate: Math.round(archErrorRate * 1000) / 1000,
      utilizationPercent,
      cpuPercent: Math.min(100, Math.round(displayLoad * 60 + rt.smoothedLoad * 5)),
      memoryPercent: Math.min(100, Math.round(30 + displayLoad * 40 + rt.smoothedLoad * 3)),
      queueDepth: Math.round(rt.queueDepth),
      activeConnections: Math.round(rt.activeConnections),
      rpsHistory: rt.rpsHistory,
      latencyHistory: rt.latencyHistory,
      errorHistory: rt.errorHistory,
      diagnosisReason,
      diagnosisSuggestion,
      ...(node.type === "app_server"
        ? (() => {
            const appCfg = parseAppServerConfig(node.config);
            const inbound = inEdges.get(node.id) ?? [];
            const hasRouter = hasUpstreamTrafficRouter(inbound, nodeMap);
            const poolReplicaCount = hasRouter ? appCfg.instanceCount : 1;
            const targetHealthy = computeHealthyInstanceCount(
              poolReplicaCount,
              rt.smoothedLoad,
              health,
              rt.smoothedError,
            );
            rt.healthyInstanceCount = targetHealthy;
            rt.displayHealthyInstanceCount = smoothHealthyInstanceCount(
              rt.displayHealthyInstanceCount,
              targetHealthy,
              appCfg.instanceCount,
            );

            const capPerInstance = deriveCapacityPerInstanceRps(
              appCfg.maxConcurrentRequestsPerInstance,
              rt.effectiveRequestTimeMs,
            );
            const pool = computePoolMetrics(
              lastRps,
              appCfg.instanceCount,
              rt.displayHealthyInstanceCount,
              capPerInstance,
            );
            const maxSlots =
              appCfg.maxConcurrentRequestsPerInstance * rt.effectiveInstanceCount;
            const slotUtil =
              maxSlots > 0
                ? Math.min(100, Math.round((rt.activeRequestsCount / maxSlots) * 100))
                : 0;
            const poolUtilizationPercent = Math.max(pool.poolUtilizationPercent, slotUtil);

            return {
              completedRps: Math.round(rt.completedRpsLastTick),
              totalCapacityRps: Math.round(pool.poolCapacityRps),
              instanceCount: appCfg.instanceCount,
              effectiveInstanceCount: rt.effectiveInstanceCount,
              activeRequests: Math.round(rt.activeRequestsCount),
              healthyInstanceCount: rt.displayHealthyInstanceCount,
              perInstanceRps: Math.round(pool.perInstanceRps * 10) / 10,
              derivedCapacityPerInstanceRps: Math.round(pool.derivedCapacityPerInstanceRps),
              poolCapacityRps: Math.round(pool.poolCapacityRps),
              poolUtilizationPercent,
              derivedCapacityBreakdown: {
                maxConcurrentPerInstance: appCfg.maxConcurrentRequestsPerInstance,
                effectiveInstanceCount: rt.effectiveInstanceCount,
                effectiveRequestTimeMs: Math.round(rt.effectiveRequestTimeMs),
                capacityPerInstanceRps: Math.round(capPerInstance),
              },
            };
          })()
        : {}),
    };

    batchMetrics[node.id] = metrics;

    if (!isSource && behavior !== "none") {
      totalRps += lastRps;
      latencySum += lastLatency;
      latencyCount++;
      if (HEALTH_RANK[health] > HEALTH_RANK[worstHealth]) {
        worstHealth = health;
      }
    }
  }

  // Client nodes: user-facing experience from downstream path (not server telemetry)
  for (const node of nodes) {
    if (!COMPONENT_REGISTRY[node.type].isTrafficSource) continue;
    const rt = ensureRuntime(node.id);
    const lastRps = rt.rpsHistory[rt.rpsHistory.length - 1] ?? 0;
    const exp = computeClientExperience(design, node.id, batchMetrics);
    clientDownstreamErrorByNode.set(node.id, exp.errorRate);

    let clientHealth: SimHealth = "healthy";
    if (exp.errorRate > 0.1) clientHealth = "failing";
    else if (exp.errorRate > 0.02 || exp.p95LatencyMs > 400) clientHealth = "degraded";

    batchMetrics[node.id] = {
      currentRps: Math.round(lastRps),
      totalRequests: Math.round(rt.totalReqs),
      avgLatencyMs: exp.avgLatencyMs,
      p95LatencyMs: exp.p95LatencyMs,
      p99LatencyMs: exp.p95LatencyMs,
      health: clientHealth,
      errorRate: exp.errorRate,
      utilizationPercent: 0,
      cpuPercent: 0,
      memoryPercent: 0,
      queueDepth: 0,
      activeConnections: 0,
      rpsHistory: rt.rpsHistory,
      latencyHistory: rt.rpsHistory.map(() => exp.avgLatencyMs),
      errorHistory: rt.errorHistory,
      diagnosisReason: "",
      diagnosisSuggestion: "",
    };

    if (HEALTH_RANK[clientHealth] > HEALTH_RANK[worstHealth]) {
      worstHealth = clientHealth;
    }
  }

  // Load balancer distribution snapshot (live routing breakdown)
  for (const node of nodes) {
    if (node.type !== "load_balancer") continue;
    const base = batchMetrics[node.id];
    if (!base) continue;

    const incomingRps = base.currentRps;
    const allTargets = outEdges.get(node.id) ?? [];
    const splitTargets: SplitTarget[] = [];

    for (const targetId of allTargets) {
      const edge = edges.find((e) => e.source === node.id && e.target === targetId);
      if (!edge) continue;
      if (!isBackendHealthy(targetId)) continue;
      splitTargets.push({
        id: targetId,
        edgeId: edge.id,
        weight: (edge.config.weight as number) ?? 1,
      });
    }

    const fractions = splitTargets.length > 0
      ? computeSplitFractions(node, splitTargets)
      : [];

    const distributions = splitTargets.map((t, i) => ({
      targetId: t.id,
      label: nodeMap.get(t.id)?.label ?? t.id,
      rps: Math.round(incomingRps * fractions[i]),
      percent: Math.round(fractions[i] * 1000) / 10,
      healthy: true,
    }));

    for (const targetId of allTargets) {
      if (splitTargets.some((t) => t.id === targetId)) continue;
      distributions.push({
        targetId,
        label: nodeMap.get(targetId)?.label ?? targetId,
        rps: 0,
        percent: 0,
        healthy: false,
      });
    }

    batchMetrics[node.id] = {
      ...base,
      loadBalancerDistribution: {
        incomingRps,
        healthyTargetPools: splitTargets.length,
        algorithm: (node.config.algorithm as string) ?? "round_robin",
        distributions,
      },
    };
  }

  // Single batched Zustand update
  useSimulationStore.getState().batchUpdateMetrics(batchMetrics, edgeFlows);
  useSimulationStore.getState().updateSystemMetrics(
    updateSystemStableHealth(worstHealth),
    Math.round(totalRps),
    latencyCount > 0 ? Math.round((latencySum / latencyCount) * 10) / 10 : 0,
  );
}

export function startEngine() {
  if (tickTimer) return;

  const runTick = () => {
    const { running, timeScale } = useSimulationStore.getState();
    if (!running) return;
    const { design } = useDesignStore.getState();
    if (!design || design.nodes.length === 0) return;
    tick(design, timeScale);
  };

  tickTimer = setInterval(runTick, 100);
}

export function stopEngine() {
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
  runtimes = {};
  tickCount = 0;
  renderAccumulator = 0;
  systemStableHealth = "healthy";
  systemHealthCandidate = "healthy";
  systemHealthCandidateTicks = 0;
  clientDownstreamErrorByNode = new Map();
  useSimulationStore.getState().resetMetrics();
}

export function resetEngine() {
  runtimes = {};
  tickCount = 0;
  renderAccumulator = 0;
  systemStableHealth = "healthy";
  systemHealthCandidate = "healthy";
  systemHealthCandidateTicks = 0;
  clientDownstreamErrorByNode = new Map();
  useSimulationStore.getState().resetMetrics();
}

/** Clear runtime state and metrics; keeps simulation running if already active */
export function restartSimulationFlow() {
  resetEngine();
  if (!useSimulationStore.getState().running) {
    useSimulationStore.getState().start();
  }
}
