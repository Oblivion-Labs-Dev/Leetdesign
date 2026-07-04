import type { SimDesign, SimHealth, RuntimeMetrics } from "./types";
import { COMPONENT_REGISTRY } from "./component-registry";
import { useDesignStore } from "./store";
import { useSimulationStore } from "./store";

const HISTORY_LEN = 60;
const LOAD_EMA = 0.12;
const ERROR_EMA = 0.15;
/** Ticks (100ms each) a worse health state must persist before we show it */
const WORSE_HEALTH_TICKS = 4;
/** Ticks a better health state must persist before we recover */
const BETTER_HEALTH_TICKS = 15;
/** Smoothed load above this → node stops forwarding (latched) */
const DOWN_ENTER_LOAD = 2.6;
/** Smoothed load below this for DOWN_LATCH_RELEASE ticks → node recovers */
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

function healthFromLoad(load: number, errorRate: number, capacity = 1): SimHealth {
  if (capacity === 0) return "down";
  if (errorRate > 0.45 || load > 2.8) return "down";
  if (errorRate > 0.15 || load > 1.8) return "failing";
  if (errorRate > 0.04 || load > 0.85) return "degraded";
  return "healthy";
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

interface NodeRuntime {
  queueDepth: number;
  totalReqs: number;
  latencySum: number;
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
}

let runtimes: Record<string, NodeRuntime> = {};
let tickTimer: ReturnType<typeof setInterval> | null = null;
let tickCount = 0;
let nextBurstTick = randomBetween(200, 600);
let burstDuration = 0;
let burstMultiplier = 1;

let systemStableHealth: SimHealth = "healthy";
let systemHealthCandidate: SimHealth = "healthy";
let systemHealthCandidateTicks = 0;

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
      latencySum: 0,
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
    };
  }
  return runtimes[id];
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(Math.floor(sorted.length * p), sorted.length - 1);
  return sorted[idx];
}

function computeNaturalTrafficMultiplier(
  pattern: string,
  baseTick: number,
): number {
  const t = baseTick;

  switch (pattern) {
    case "sine_wave": {
      const period = 300;
      return 0.5 + 0.5 * Math.sin((2 * Math.PI * t) / period);
    }
    case "burst": {
      if (burstDuration > 0) {
        burstDuration--;
        return burstMultiplier;
      }
      if (t >= nextBurstTick) {
        burstDuration = randomBetween(15, 50);
        burstMultiplier = 2 + Math.random() * 4;
        nextBurstTick = t + randomBetween(200, 600);
        return burstMultiplier;
      }
      return 1;
    }
    case "ramp": {
      const rampPeriod = 600;
      const phase = t % rampPeriod;
      if (phase < rampPeriod * 0.6) {
        return 0.3 + (phase / (rampPeriod * 0.6)) * 0.7;
      }
      return 1 + (phase - rampPeriod * 0.6) / (rampPeriod * 0.4) * 2;
    }
    default: {
      const jitter = 0.97 + Math.random() * 0.06;
      const drift = 1 + 0.12 * Math.sin(t / 180) + 0.04 * Math.sin(t / 47);
      const miniSpike = Math.random() < 0.004 ? 1.3 + Math.random() * 0.8 : 1;
      return jitter * drift * miniSpike;
    }
  }
}

function tick(design: SimDesign, timeScale: number) {
  tickCount++;

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

  // Phase 1: traffic generation from client nodes with natural patterns
  for (const node of nodes) {
    const def = COMPONENT_REGISTRY[node.type];
    if (def.isTrafficSource) {
      const baseRps = (node.config.requestsPerSecond as number) ?? 100;
      const pattern = (node.config.requestPattern as string) ?? "constant";
      const naturalMult = computeNaturalTrafficMultiplier(pattern, tickCount);
      const effectiveRps = baseRps * naturalMult;
      const tickRps = (effectiveRps * timeScale * design.simulation.tickRateMs) / 1000;
      const targets = outEdges.get(node.id) ?? [];
      const perTarget = targets.length > 0 ? tickRps / targets.length : 0;
      for (const t of targets) {
        incoming[t] = (incoming[t] ?? 0) + perTarget;
      }
      const rt = ensureRuntime(node.id);
      rt.totalReqs += tickRps;
      rt.rpsHistory = push(rt.rpsHistory, effectiveRps);
      rt.latencyHistory = push(rt.latencyHistory, 0);
      rt.errorHistory = push(rt.errorHistory, 0);
    }
  }

  // Phase 2: process traffic through non-source nodes (BFS order)
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

    const rt = ensureRuntime(id);
    const incomingRps = incoming[id] ?? 0;
    const capacity = ((node.config.maxRps as number) ?? 1000) * ((node.config.replicas as number) ?? 1);
    const latency = (node.config.latencyMs as number) ?? 10;

    const load = capacity > 0 ? incomingRps / capacity : 999;

    rt.smoothedLoad = rt.smoothedLoad === 0
      ? load
      : rt.smoothedLoad * (1 - LOAD_EMA) + load * LOAD_EMA;

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
    } else if (rt.smoothedLoad > DOWN_ENTER_LOAD) {
      rt.latchedDown = true;
      rt.downRecoveryTicks = 0;
    }

    // DOWN node: absorb all traffic, forward nothing, high error rate
    if (rt.latchedDown || capacity === 0) {
      rt.totalReqs += incomingRps;
      rt.errors += incomingRps;
      rt.rpsHistory = push(rt.rpsHistory, incomingRps / ((design.simulation.tickRateMs * timeScale) / 1000));
      rt.latencyHistory = push(rt.latencyHistory, 99999);
      rt.errorHistory = push(rt.errorHistory, 1);
      rt.queueDepth += incomingRps * 0.2;
      // Dead node — do NOT forward traffic downstream
      continue;
    }

    const latencyMultiplier = load > 0.8
      ? 1 + Math.pow(Math.max(0, load - 0.7), 2) * 8
      : 1 + Math.max(0, load - 0.5) * 0.5;
    const actualLatency = latency * latencyMultiplier * (0.9 + Math.random() * 0.2);
    const errorRate = load > 1 ? Math.min((load - 1) * 0.3, 1) : 0;

    let forwardRatio = 1;
    if (node.type === "redis_cache" || node.type === "local_cache" || node.type === "distributed_cache" || node.type === "cdn") {
      const hitRate = (node.config.hitRate as number) ?? 0.85;
      forwardRatio = 1 - hitRate;
    }

    if (node.type === "rate_limiter") {
      const limit = (node.config.maxRps as number) ?? 1000;
      if (incomingRps > limit) {
        const dropped = incomingRps - limit;
        rt.errors += dropped;
        forwardRatio = limit / incomingRps;
      }
    }

    if (load > 1) {
      rt.queueDepth += (incomingRps - capacity) * 0.15;
    } else {
      rt.queueDepth = Math.max(0, rt.queueDepth * 0.92 - capacity * 0.02);
    }

    rt.totalReqs += incomingRps;
    rt.latencyVals.push(actualLatency);
    if (rt.latencyVals.length > 100) rt.latencyVals = rt.latencyVals.slice(-100);

    rt.smoothedError = rt.smoothedError * (1 - ERROR_EMA) + errorRate * ERROR_EMA;

    const currentRps = incomingRps / ((design.simulation.tickRateMs * timeScale) / 1000);
    rt.rpsHistory = push(rt.rpsHistory, currentRps);
    rt.latencyHistory = push(rt.latencyHistory, actualLatency);
    rt.errorHistory = push(rt.errorHistory, errorRate);

    const targets = outEdges.get(id) ?? [];
    if (targets.length > 0) {
      const forwardPerTarget = (incomingRps * forwardRatio) / targets.length;
      for (const t of targets) {
        incoming[t] = (incoming[t] ?? 0) + forwardPerTarget;
        queue.push(t);
      }
    }
  }

  // Phase 2b: starve nodes that were never reached (cascade effect)
  for (const node of nodes) {
    if (COMPONENT_REGISTRY[node.type].isTrafficSource) continue;
    if (visited.has(node.id)) continue;
    const rt = ensureRuntime(node.id);
    rt.rpsHistory = push(rt.rpsHistory, 0);
    rt.latencyHistory = push(rt.latencyHistory, 0);
    rt.errorHistory = push(rt.errorHistory, 0);
    rt.queueDepth = Math.max(0, rt.queueDepth * 0.85 - 1);
  }

  // Phase 3: compute metrics and update store
  let totalRps = 0;
  let latencySum = 0;
  let latencyCount = 0;
  let worstHealth: SimHealth = "healthy";

  for (const node of nodes) {
    const rt = ensureRuntime(node.id);
    const sorted = [...rt.latencyVals].sort((a, b) => a - b);
    const lastRps = rt.rpsHistory[rt.rpsHistory.length - 1] ?? 0;
    const lastLatency = rt.latencyHistory[rt.latencyHistory.length - 1] ?? 0;
    const lastError = rt.errorHistory[rt.errorHistory.length - 1] ?? 0;

    const capacity = ((node.config.maxRps as number) ?? 1000) * ((node.config.replicas as number) ?? 1);
    const displayLoad = capacity > 0 ? lastRps / capacity : 0;
    const isSource = COMPONENT_REGISTRY[node.type].isTrafficSource;

    let rawHealth: SimHealth = "healthy";
    if (!isSource) {
      if (capacity === 0 || rt.latchedDown) {
        rawHealth = "down";
      } else if (!visited.has(node.id) && (inEdges.get(node.id) ?? []).length > 0) {
        rawHealth = "degraded";
      } else {
        rawHealth = healthFromLoad(rt.smoothedLoad, rt.smoothedError, capacity);
      }
    }

    const health = isSource ? "healthy" : updateStableHealth(rt, rawHealth);

    // Determine WHY a node is unhealthy for diagnostics
    let diagnosisReason = "";
    let diagnosisSuggestion = "";
    if (!isSource && health !== "healthy") {
      if (capacity === 0) {
        diagnosisReason = "Component has been killed (maxRps = 0)";
        diagnosisSuggestion = "Restore maxRps in config to resume processing";
      } else if (!visited.has(node.id)) {
        const upstreamNames = (inEdges.get(node.id) ?? [])
          .map((srcId) => nodeMap.get(srcId)?.label ?? srcId)
          .join(", ");
        diagnosisReason = `No traffic reaching this component — upstream (${upstreamNames || "none"}) is down or unreachable`;
        diagnosisSuggestion = "Fix upstream components first, or add an alternative route";
      } else if (rt.smoothedLoad > 1.8) {
        diagnosisReason = `Overloaded: receiving ~${Math.round(lastRps)} rps but capacity is ${capacity} rps (${Math.round(rt.smoothedLoad * 100)}% sustained load)`;
        diagnosisSuggestion = "Increase replicas or raise maxRps; consider adding a cache or load balancer upstream";
      } else if (rt.smoothedError > 0.15) {
        diagnosisReason = `High error rate (${(rt.smoothedError * 100).toFixed(0)}%) — likely cascading from upstream failures`;
        diagnosisSuggestion = "Check upstream components; add circuit breakers or retry logic";
      } else if (rt.smoothedError > 0.04) {
        diagnosisReason = `Elevated error rate (${(rt.smoothedError * 100).toFixed(0)}%) under current load`;
        diagnosisSuggestion = "Consider scaling up or reducing traffic at the source";
      } else {
        diagnosisReason = `Load at ${Math.round(rt.smoothedLoad * 100)}% of capacity — approaching limits`;
        diagnosisSuggestion = "Scale horizontally (add replicas) before traffic grows further";
      }
    }

    const metrics: RuntimeMetrics = {
      currentRps: Math.round(lastRps),
      totalRequests: Math.round(rt.totalReqs),
      avgLatencyMs: Math.round(lastLatency * 10) / 10,
      p95LatencyMs: Math.round(percentile(sorted, 0.95) * 10) / 10,
      p99LatencyMs: Math.round(percentile(sorted, 0.99) * 10) / 10,
      health,
      errorRate: Math.round(rt.smoothedError * 1000) / 1000,
      cpuPercent: Math.min(100, Math.round(displayLoad * 60 + rt.smoothedLoad * 5)),
      memoryPercent: Math.min(100, Math.round(30 + displayLoad * 40 + rt.smoothedLoad * 3)),
      queueDepth: Math.round(rt.queueDepth),
      activeConnections: Math.round(lastRps * 0.8),
      rpsHistory: rt.rpsHistory,
      latencyHistory: rt.latencyHistory,
      errorHistory: rt.errorHistory,
      diagnosisReason,
      diagnosisSuggestion,
    };

    useSimulationStore.getState().updateNodeMetrics(node.id, metrics);

    if (!isSource) {
      totalRps += lastRps;
      latencySum += lastLatency;
      latencyCount++;
      if (HEALTH_RANK[health] > HEALTH_RANK[worstHealth]) {
        worstHealth = health;
      }
    }
  }

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
  burstDuration = 0;
  burstMultiplier = 1;
  nextBurstTick = randomBetween(200, 600);
  systemStableHealth = "healthy";
  systemHealthCandidate = "healthy";
  systemHealthCandidateTicks = 0;
  useSimulationStore.getState().resetMetrics();
}

export function resetEngine() {
  runtimes = {};
  tickCount = 0;
  burstDuration = 0;
  burstMultiplier = 1;
  nextBurstTick = randomBetween(200, 600);
  systemStableHealth = "healthy";
  systemHealthCandidate = "healthy";
  systemHealthCandidateTicks = 0;
  useSimulationStore.getState().resetMetrics();
}
