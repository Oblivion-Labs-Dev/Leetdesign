/**
 * Application Server pool semantics — healthy replicas, per-instance load, utilization.
 */

import type { SimHealth } from "./types";

export const INSTANCE_POOL_TOOLTIP =
  "Instances are replicas of this service. Incoming traffic is divided across healthy instances in the pool.";

/**
 * Target healthy replica count under stress.
 * Only sheds instances when the pool is genuinely over capacity — not on mere "degraded" status.
 */
export function computeHealthyInstanceCount(
  configuredCount: number,
  smoothedLoad: number,
  health: SimHealth,
  errorRate: number,
): number {
  const configured = Math.max(1, Math.round(configuredCount));
  if (configured <= 1) return configured;

  if (smoothedLoad < 1.0 && errorRate < 0.1 && health !== "down" && health !== "failing") {
    return configured;
  }

  let healthyRatio = 1;

  if (smoothedLoad > 1.0) {
    healthyRatio -= Math.min(0.3, (smoothedLoad - 1.0) * 0.2);
  }
  if (smoothedLoad > 1.5) {
    healthyRatio -= Math.min(0.25, (smoothedLoad - 1.5) * 0.25);
  }
  if (errorRate > 0.12) {
    healthyRatio -= Math.min(0.25, (errorRate - 0.12) * 1.2);
  }

  if (health === "down") healthyRatio = Math.min(healthyRatio, 0.3);
  else if (health === "failing") healthyRatio = Math.min(healthyRatio, 0.75);

  return Math.max(1, Math.round(configured * Math.max(0.3, healthyRatio)));
}

/** EMA when shedding replicas; snap up immediately when the pool scales out. */
export function smoothHealthyInstanceCount(
  previous: number,
  target: number,
  configuredCount: number,
): number {
  const configured = Math.max(1, Math.round(configuredCount));
  const clampedTarget = Math.max(1, Math.min(configured, Math.round(target)));
  if (previous <= 0) return clampedTarget;
  if (clampedTarget >= previous) return clampedTarget;
  const smoothed = previous * 0.92 + clampedTarget * 0.08;
  return Math.max(1, Math.min(configured, Math.round(smoothed)));
}

export interface PoolMetrics {
  poolIncomingRps: number;
  configuredInstanceCount: number;
  healthyInstanceCount: number;
  perInstanceRps: number;
  derivedCapacityPerInstanceRps: number;
  poolCapacityRps: number;
  poolUtilizationPercent: number;
}

export function computePoolMetrics(
  poolIncomingRps: number,
  configuredInstanceCount: number,
  healthyInstanceCount: number,
  derivedCapacityPerInstanceRps: number,
): PoolMetrics {
  const healthy = Math.max(1, healthyInstanceCount);
  const capPerInstance = Math.max(0, derivedCapacityPerInstanceRps);
  const poolCapacityRps = capPerInstance * configuredInstanceCount;

  return {
    poolIncomingRps,
    configuredInstanceCount: Math.max(1, configuredInstanceCount),
    healthyInstanceCount: healthy,
    perInstanceRps: poolIncomingRps / healthy,
    derivedCapacityPerInstanceRps: capPerInstance,
    poolCapacityRps,
    poolUtilizationPercent:
      poolCapacityRps > 0
        ? Math.min(100, Math.round((poolIncomingRps / poolCapacityRps) * 100))
        : poolIncomingRps > 0
          ? 100
          : 0,
  };
}

export function formatRps(n: number, decimals = 0): string {
  if (decimals <= 0) return Math.round(n).toLocaleString("en-US");
  const fixed = n.toFixed(decimals);
  const [whole, frac] = fixed.split(".");
  return `${Number(whole).toLocaleString("en-US")}.${frac}`;
}

/** Plain-language pool status for the inspector. */
export function poolStatusLabel(health: SimHealth): string {
  switch (health) {
    case "healthy": return "Running normally";
    case "degraded": return "Under pressure";
    case "failing": return "Struggling to keep up";
    case "down": return "Not serving traffic";
  }
}

/** Health derived from pool capacity utilization — not internal slot-model noise. */
export function healthFromPoolUtilization(
  utilizationPercent: number,
  errorRate: number,
  latchedDown: boolean,
): SimHealth {
  if (latchedDown) return "down";
  if (errorRate > 0.25 || utilizationPercent >= 98) return "failing";
  if (errorRate > 0.06 || utilizationPercent >= 80) return "degraded";
  return "healthy";
}

export interface InstanceSnapshot {
  index: number;
  rps: number;
  cpuPercent: number;
  activeRequests: number;
  maxSlots: number;
}

/** Even-split view of what each replica is doing (representative average). */
export function deriveInstanceSnapshots(
  healthyCount: number,
  perInstanceRps: number,
  poolCpuPercent: number,
  totalActiveRequests: number,
  maxConcurrentPerInstance: number,
): InstanceSnapshot[] {
  const n = Math.max(1, Math.round(healthyCount));
  const perActive = totalActiveRequests / n;
  return Array.from({ length: n }, (_, i) => ({
    index: i + 1,
    rps: perInstanceRps,
    cpuPercent: poolCpuPercent,
    activeRequests: Math.round(perActive * 10) / 10,
    maxSlots: maxConcurrentPerInstance,
  }));
}
