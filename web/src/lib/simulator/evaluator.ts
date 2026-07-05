import type { SimHealth, RuntimeMetrics } from "./types";
import { useSimulationStore } from "./store";
import { COMPONENT_REGISTRY } from "./component-registry";
import { useDesignStore } from "./store";

/**
 * Acceptance criteria for a milestone — the simulation must sustain these
 * metrics for the required duration to pass. Components used don't matter;
 * only outcomes do.
 */
export interface AcceptanceCriteria {
  maxP95LatencyMs: number;
  maxErrorRate: number;
  minHandledRps: number;
  /** Consecutive render cycles (500ms each) the criteria must hold */
  sustainForCycles: number;
}

export type EvalResult = "pending" | "passing" | "failing";

interface EvalState {
  passingCycles: number;
  totalCycles: number;
  result: EvalResult;
  lastP95: number;
  lastErrorRate: number;
  lastRps: number;
}

const evalStates = new Map<string, EvalState>();

function freshState(): EvalState {
  return {
    passingCycles: 0,
    totalCycles: 0,
    result: "pending",
    lastP95: 0,
    lastErrorRate: 0,
    lastRps: 0,
  };
}

/**
 * Evaluate whether the current simulation meets the acceptance criteria.
 * Called after each render cycle (every 500ms of simulation time).
 * Returns the evaluation result.
 */
export function evaluateAcceptance(
  criteriaId: string,
  criteria: AcceptanceCriteria,
): EvalResult {
  const simStore = useSimulationStore.getState();
  const designStore = useDesignStore.getState();
  const { metrics } = simStore;
  const design = designStore.design;

  if (!design || Object.keys(metrics).length === 0) return "pending";

  let state = evalStates.get(criteriaId);
  if (!state) {
    state = freshState();
    evalStates.set(criteriaId, state);
  }

  // Compute system-wide metrics from non-source, non-infra nodes
  let totalLatencySum = 0;
  let latencyCount = 0;
  let maxP95 = 0;
  let totalErrors = 0;
  let totalRps = 0;
  let nodeCount = 0;

  for (const node of design.nodes) {
    const def = COMPONENT_REGISTRY[node.type];
    if (def.isTrafficSource || def.routingBehavior === "none") continue;

    const m = metrics[node.id];
    if (!m) continue;

    nodeCount++;
    totalRps += m.currentRps;
    totalLatencySum += m.avgLatencyMs;
    latencyCount++;
    if (m.p95LatencyMs > maxP95) maxP95 = m.p95LatencyMs;
    totalErrors += m.errorRate;
  }

  const avgErrorRate = nodeCount > 0 ? totalErrors / nodeCount : 0;

  // Get traffic source RPS for "handled" comparison
  let sourceRps = 0;
  for (const node of design.nodes) {
    const def = COMPONENT_REGISTRY[node.type];
    if (def.isTrafficSource) {
      const m = metrics[node.id];
      if (m) sourceRps += m.currentRps;
    }
  }

  state.lastP95 = maxP95;
  state.lastErrorRate = avgErrorRate;
  state.lastRps = sourceRps;
  state.totalCycles++;

  const passes =
    maxP95 <= criteria.maxP95LatencyMs &&
    avgErrorRate <= criteria.maxErrorRate &&
    sourceRps >= criteria.minHandledRps;

  if (passes) {
    state.passingCycles++;
  } else {
    state.passingCycles = 0;
  }

  if (state.passingCycles >= criteria.sustainForCycles) {
    state.result = "passing";
  } else if (state.totalCycles > criteria.sustainForCycles * 2 && state.passingCycles === 0) {
    state.result = "failing";
  } else {
    state.result = passes ? "passing" : "failing";
  }

  return state.result;
}

/**
 * Get the current evaluation state for UI display
 */
export function getEvalState(criteriaId: string): EvalState | null {
  return evalStates.get(criteriaId) ?? null;
}

/**
 * Reset evaluation state (when design changes or simulation restarts)
 */
export function resetEvaluation(criteriaId?: string) {
  if (criteriaId) {
    evalStates.delete(criteriaId);
  } else {
    evalStates.clear();
  }
}

/**
 * Check if system health is in a failure state (for failure-expectation milestones)
 */
export function isSystemFailing(): boolean {
  const { systemHealth } = useSimulationStore.getState();
  return systemHealth === "failing" || systemHealth === "down";
}

/**
 * Check if system is healthy (for non-failure milestones)
 */
export function isSystemHealthy(): boolean {
  const { systemHealth } = useSimulationStore.getState();
  return systemHealth === "healthy";
}
