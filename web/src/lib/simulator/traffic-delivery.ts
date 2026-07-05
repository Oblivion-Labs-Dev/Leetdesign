/**
 * Traffic Delivery Contract
 *
 * Every simulation component distinguishes:
 * - **incomingRps** — traffic that arrived at the boundary this tick (attempted)
 * - **deliveredRps** — traffic successfully processed internally this tick
 * - **propagateRps** — traffic that may flow to downstream nodes THIS tick
 *
 * Downstream nodes MUST only receive `propagateRps`, never raw incoming or
 * backlog drain from upstream that stopped feeding the pipeline.
 */

import type { SimHealth, SimNode } from "./types";
import { COMPONENT_REGISTRY } from "./component-registry";
import {
  computeLoadBalancerRoutingAmounts,
  type LoadBalancerConfig,
} from "./load-balancer-model";

export interface NodeRuntimeDelivery {
  stableHealth: SimHealth;
  latchedDown: boolean;
  propagateRpsLastTick: number;
}

/** Routers that are down/failing do not propagate — pipeline stops here. */
export function canNodePropagate(health: SimHealth, latchedDown: boolean): boolean {
  if (latchedDown) return false;
  if (health === "down" || health === "failing") return false;
  return true;
}

/** Generic processor: at most `capacityRps` can complete; errors reduce delivered output. */
export function computeGenericDeliveredRps(
  incomingRps: number,
  capacityRps: number,
  errorRate: number,
): number {
  if (incomingRps <= 0 || capacityRps <= 0) return 0;
  const processed = Math.min(incomingRps, capacityRps);
  return processed * Math.max(0, 1 - errorRate);
}

/** Load balancer delivers only what it successfully routes to healthy backends. */
export function computeLoadBalancerDeliveredRps(
  incomingRps: number,
  cfg: LoadBalancerConfig,
  healthyTargetCount: number,
  errorRate: number,
): number {
  if (incomingRps <= 0 || healthyTargetCount <= 0) return 0;
  const { outgoingRps } = computeLoadBalancerRoutingAmounts(incomingRps, cfg);
  return outgoingRps * Math.max(0, 1 - errorRate);
}

/**
 * App server may complete in-flight work when upstream stops, but those completions
 * must NOT trigger new downstream DB/cache traffic unless upstream fed this tick.
 */
export function computeAppServerPropagateRps(
  incomingRps: number,
  completedRps: number,
  upstreamFedThisTick: boolean,
): number {
  if (!upstreamFedThisTick || incomingRps <= 0) return 0;
  return Math.min(completedRps, incomingRps);
}

/**
 * True when at least one upstream router/source actually propagated traffic this tick.
 * Direct children of traffic sources use phase-1 injection (always fed if accepted).
 */
export function upstreamFedThisTick(
  nodeId: string,
  inEdgeSources: string[],
  nodeMap: Map<string, SimNode>,
  runtimes: Record<string, NodeRuntimeDelivery>,
): boolean {
  if (inEdgeSources.length === 0) return false;

  return inEdgeSources.some((srcId) => {
    const srcNode = nodeMap.get(srcId);
    if (!srcNode) return false;
    if (COMPONENT_REGISTRY[srcNode.type].isTrafficSource) return true;
    const srcRt = runtimes[srcId];
    return (srcRt?.propagateRpsLastTick ?? 0) > 1e-9;
  });
}

/** Phase-1: may the client inject traffic into this target right now? */
export function canAcceptClientInjection(
  health: SimHealth,
  latchedDown: boolean,
  downstreamErrorRate: number,
): boolean {
  if (!canNodePropagate(health, latchedDown)) return false;
  // End-to-end path is broken — stop injecting new work at the edge
  if (downstreamErrorRate > 0.5) return false;
  return true;
}

/**
 * Tick-volume eligible for downstream propagation.
 * `forwardRatio` applies to propagate output, not incoming.
 */
export function computeForwardTickVolume(
  propagateRps: number,
  tickRpsScale: number,
  forwardRatio: number,
): number {
  if (propagateRps <= 0 || forwardRatio <= 0 || tickRpsScale <= 0) return 0;
  return propagateRps * tickRpsScale * forwardRatio;
}

export function canPropagateTraffic(propagateRps: number): boolean {
  return propagateRps > 1e-9;
}
