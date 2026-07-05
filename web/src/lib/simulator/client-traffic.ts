/**
 * Client traffic model — demand source, not a backend service.
 * @see docs/COMPONENT-MODEL.md
 */

import type { SimDesign, RuntimeMetrics } from "./types";
import { COMPONENT_REGISTRY } from "./component-registry";
import { buildAdjacency } from "./topology";

export type TrafficPattern =
  | "constant"
  | "ramp"
  | "burst"
  | "dailyPeak"
  | "flashSale";

export type UserActivityPreset =
  | "browsing"
  | "normal"
  | "highly_active"
  | "power"
  | "custom";

export type RetryStrategy = "none" | "conservative" | "aggressive";

export interface ClientRequestMix {
  reads: number;
  writes: number;
  searches: number;
}

export interface ClientTrafficConfig {
  activeUsers: number;
  requestsPerUserPerSecond: number;
  userActivityPreset: UserActivityPreset;
  trafficPattern: TrafficPattern;
  rpsOverrideEnabled: boolean;
  manualRpsOverride: number;
  requestMix: ClientRequestMix;
  retryStrategy: RetryStrategy;
  /** Pattern-specific (RPS values; engine applies as multipliers vs base) */
  rampStartRps: number;
  rampEndRps: number;
  rampDurationSec: number;
  burstBaselineRps: number;
  burstPeakRps: number;
  burstDurationSec: number;
  dailyPeakBaselineRps: number;
  dailyPeakRps: number;
  flashSaleBaselineRps: number;
  flashSaleSpikeRps: number;
  flashSaleDurationSec: number;
  flashSaleRetrySurge: boolean;
}

export const USER_ACTIVITY_RATES: Record<Exclude<UserActivityPreset, "custom">, number> = {
  browsing: 0.2,
  normal: 0.5,
  highly_active: 1,
  power: 2,
};

export const DEFAULT_CLIENT_TRAFFIC: ClientTrafficConfig = {
  activeUsers: 1000,
  requestsPerUserPerSecond: 0.2,
  userActivityPreset: "browsing",
  trafficPattern: "constant",
  rpsOverrideEnabled: false,
  manualRpsOverride: 200,
  requestMix: { reads: 70, writes: 20, searches: 10 },
  retryStrategy: "none",
  rampStartRps: 200,
  rampEndRps: 2000,
  rampDurationSec: 60,
  burstBaselineRps: 200,
  burstPeakRps: 5000,
  burstDurationSec: 10,
  dailyPeakBaselineRps: 200,
  dailyPeakRps: 800,
  flashSaleBaselineRps: 200,
  flashSaleSpikeRps: 4000,
  flashSaleDurationSec: 15,
  flashSaleRetrySurge: false,
};

const ACTIVITY_LABELS: Record<UserActivityPreset, string> = {
  browsing: "Browsing casually",
  normal: "Normal usage",
  highly_active: "Highly active",
  power: "Power users",
  custom: "Custom",
};

export function getActivityLabel(preset: UserActivityPreset): string {
  return ACTIVITY_LABELS[preset];
}

/** Migrate legacy node.config into ClientTrafficConfig */
export function parseClientConfig(
  raw: Record<string, string | number | boolean>,
): ClientTrafficConfig {
  const cfg = { ...DEFAULT_CLIENT_TRAFFIC };

  if (typeof raw.activeUsers === "number") cfg.activeUsers = raw.activeUsers;
  if (typeof raw.requestsPerUserPerSecond === "number") {
    cfg.requestsPerUserPerSecond = raw.requestsPerUserPerSecond;
    cfg.userActivityPreset = "custom";
  }
  if (typeof raw.userActivityPreset === "string") {
    cfg.userActivityPreset = raw.userActivityPreset as UserActivityPreset;
  }
  if (cfg.userActivityPreset !== "custom") {
    cfg.requestsPerUserPerSecond = USER_ACTIVITY_RATES[cfg.userActivityPreset];
  }

  // Legacy: requestsPerSecond + concurrentUsers
  if (raw.activeUsers == null && typeof raw.requestsPerSecond === "number") {
    const legacyRps = raw.requestsPerSecond as number;
    const users = typeof raw.concurrentUsers === "number"
      ? (raw.concurrentUsers as number)
      : 1000;
    cfg.activeUsers = Math.max(1, users);
    cfg.requestsPerUserPerSecond = legacyRps / cfg.activeUsers;
    cfg.userActivityPreset = "custom";
  }

  if (typeof raw.trafficPattern === "string") {
    cfg.trafficPattern = mapLegacyPattern(raw.trafficPattern as string);
  } else if (typeof raw.requestPattern === "string") {
    cfg.trafficPattern = mapLegacyPattern(raw.requestPattern as string);
  }

  if (typeof raw.rpsOverrideEnabled === "boolean") cfg.rpsOverrideEnabled = raw.rpsOverrideEnabled;
  if (typeof raw.manualRpsOverride === "number") cfg.manualRpsOverride = raw.manualRpsOverride;

  if (typeof raw.requestMixReads === "number") cfg.requestMix.reads = raw.requestMixReads;
  if (typeof raw.requestMixWrites === "number") cfg.requestMix.writes = raw.requestMixWrites;
  if (typeof raw.requestMixSearches === "number") cfg.requestMix.searches = raw.requestMixSearches;

  if (typeof raw.retryStrategy === "string") cfg.retryStrategy = raw.retryStrategy as RetryStrategy;

  if (typeof raw.rampStartRps === "number") cfg.rampStartRps = raw.rampStartRps;
  if (typeof raw.rampEndRps === "number") cfg.rampEndRps = raw.rampEndRps;
  if (typeof raw.rampDurationSec === "number") cfg.rampDurationSec = raw.rampDurationSec;
  if (typeof raw.burstBaselineRps === "number") cfg.burstBaselineRps = raw.burstBaselineRps;
  if (typeof raw.burstPeakRps === "number") cfg.burstPeakRps = raw.burstPeakRps;
  if (typeof raw.burstDurationSec === "number") cfg.burstDurationSec = raw.burstDurationSec;
  if (typeof raw.dailyPeakBaselineRps === "number") cfg.dailyPeakBaselineRps = raw.dailyPeakBaselineRps;
  if (typeof raw.dailyPeakRps === "number") cfg.dailyPeakRps = raw.dailyPeakRps;
  if (typeof raw.flashSaleBaselineRps === "number") cfg.flashSaleBaselineRps = raw.flashSaleBaselineRps;
  if (typeof raw.flashSaleSpikeRps === "number") cfg.flashSaleSpikeRps = raw.flashSaleSpikeRps;
  if (typeof raw.flashSaleDurationSec === "number") cfg.flashSaleDurationSec = raw.flashSaleDurationSec;
  if (typeof raw.flashSaleRetrySurge === "boolean") cfg.flashSaleRetrySurge = raw.flashSaleRetrySurge;

  return normalizeClientConfig(cfg);
}

function mapLegacyPattern(p: string): TrafficPattern {
  switch (p) {
    case "ramp":
    case "ramp_up":
      return "ramp";
    case "burst":
      return "burst";
    case "sine_wave":
      return "dailyPeak";
    default:
      return "constant";
  }
}

export function normalizeClientConfig(cfg: ClientTrafficConfig): ClientTrafficConfig {
  const next = { ...cfg, requestMix: { ...cfg.requestMix } };
  next.activeUsers = Math.max(0, next.activeUsers);
  next.requestsPerUserPerSecond = Math.max(0, next.requestsPerUserPerSecond);

  const mixSum = next.requestMix.reads + next.requestMix.writes + next.requestMix.searches;
  if (mixSum !== 100 && mixSum > 0) {
    const scale = 100 / mixSum;
    next.requestMix.reads = Math.round(next.requestMix.reads * scale);
    next.requestMix.writes = Math.round(next.requestMix.writes * scale);
    next.requestMix.searches = 100 - next.requestMix.reads - next.requestMix.writes;
  }

  if (next.burstPeakRps < next.burstBaselineRps) {
    next.burstPeakRps = next.burstBaselineRps;
  }
  if (next.flashSaleSpikeRps < next.flashSaleBaselineRps) {
    next.flashSaleSpikeRps = next.flashSaleBaselineRps;
  }

  return next;
}

/** Base RPS before traffic pattern multiplier */
export function calculateBaseRps(cfg: ClientTrafficConfig): number {
  if (cfg.rpsOverrideEnabled) {
    return Math.max(0, cfg.manualRpsOverride);
  }
  return cfg.activeUsers * cfg.requestsPerUserPerSecond;
}

/** Retry traffic amplification during failures */
export function retryMultiplier(strategy: RetryStrategy, downstreamErrorRate: number): number {
  if (strategy === "none" || downstreamErrorRate <= 0.01) return 1;
  if (strategy === "conservative") return 1 + downstreamErrorRate * 0.25;
  return 1 + downstreamErrorRate * 0.6;
}

/**
 * Pattern multiplier at simulation tick.
 * tickCount: engine tick index; tickRateMs typically 100ms.
 */
export function computePatternMultiplier(
  cfg: ClientTrafficConfig,
  tickCount: number,
  tickRateMs: number,
): number {
  const base = calculateBaseRps(cfg);
  if (base <= 0) return 0;

  const simSec = (tickCount * tickRateMs) / 1000;

  switch (cfg.trafficPattern) {
    case "constant":
      return 1 + 0.03 * Math.sin(simSec / 30);

    case "ramp": {
      const dur = Math.max(1, cfg.rampDurationSec);
      const progress = Math.min(1, (simSec % (dur + 30)) / dur);
      const target = cfg.rampStartRps + (cfg.rampEndRps - cfg.rampStartRps) * progress;
      return target / base;
    }

    case "burst": {
      const cycle = 120;
      const phase = simSec % cycle;
      const burstStart = 40;
      const burstEnd = burstStart + cfg.burstDurationSec;
      if (phase >= burstStart && phase < burstEnd) {
        return cfg.burstPeakRps / Math.max(1, cfg.burstBaselineRps);
      }
      return cfg.burstBaselineRps / base;
    }

    case "dailyPeak": {
      const period = 300;
      const phase = simSec % period;
      const peakStart = period * 0.35;
      const peakEnd = period * 0.55;
      if (phase >= peakStart && phase < peakEnd) {
        const t = (phase - peakStart) / (peakEnd - peakStart);
        const peak = cfg.dailyPeakBaselineRps + (cfg.dailyPeakRps - cfg.dailyPeakBaselineRps) * Math.sin(t * Math.PI);
        return peak / base;
      }
      return cfg.dailyPeakBaselineRps / base;
    }

    case "flashSale": {
      const cycle = 180;
      const phase = simSec % cycle;
      const spikeStart = 60;
      const spikeEnd = spikeStart + cfg.flashSaleDurationSec;
      if (phase >= spikeStart && phase < spikeEnd) {
        let mult = cfg.flashSaleSpikeRps / Math.max(1, cfg.flashSaleBaselineRps);
        if (cfg.flashSaleRetrySurge) mult *= 1.15;
        return mult * (cfg.flashSaleBaselineRps / base);
      }
      return cfg.flashSaleBaselineRps / base;
    }

    default:
      return 1;
  }
}

export function effectiveRpsAtTick(
  cfg: ClientTrafficConfig,
  tickCount: number,
  tickRateMs: number,
  downstreamErrorRate = 0,
): number {
  const base = calculateBaseRps(cfg);
  const patternMult = computePatternMultiplier(cfg, tickCount, tickRateMs);
  const retryMult = retryMultiplier(cfg.retryStrategy, downstreamErrorRate);
  return Math.max(0, base * patternMult * retryMult);
}

/** Flatten config for persistence on SimNode.config */
export function clientConfigToStorage(cfg: ClientTrafficConfig): Record<string, string | number | boolean> {
  return {
    activeUsers: cfg.activeUsers,
    requestsPerUserPerSecond: cfg.requestsPerUserPerSecond,
    userActivityPreset: cfg.userActivityPreset,
    trafficPattern: cfg.trafficPattern,
    rpsOverrideEnabled: cfg.rpsOverrideEnabled,
    manualRpsOverride: cfg.manualRpsOverride,
    requestMixReads: cfg.requestMix.reads,
    requestMixWrites: cfg.requestMix.writes,
    requestMixSearches: cfg.requestMix.searches,
    retryStrategy: cfg.retryStrategy,
    rampStartRps: cfg.rampStartRps,
    rampEndRps: cfg.rampEndRps,
    rampDurationSec: cfg.rampDurationSec,
    burstBaselineRps: cfg.burstBaselineRps,
    burstPeakRps: cfg.burstPeakRps,
    burstDurationSec: cfg.burstDurationSec,
    dailyPeakBaselineRps: cfg.dailyPeakBaselineRps,
    dailyPeakRps: cfg.dailyPeakRps,
    flashSaleBaselineRps: cfg.flashSaleBaselineRps,
    flashSaleSpikeRps: cfg.flashSaleSpikeRps,
    flashSaleDurationSec: cfg.flashSaleDurationSec,
    flashSaleRetrySurge: cfg.flashSaleRetrySurge,
    // Legacy sync for anything still reading requestsPerSecond
    requestsPerSecond: Math.round(calculateBaseRps(cfg)),
  };
}

export function formatCount(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

export function formatRps(n: number, advanced = false): string {
  if (advanced) return n.toFixed(1);
  return formatCount(n);
}

export function formatRate(n: number): string {
  const s = n % 1 === 0 ? n.toFixed(0) : n.toFixed(1);
  return `${s} req/user/sec`;
}

/** End-to-end user experience derived from downstream path (not client-internal). */
export function computeClientExperience(
  design: SimDesign,
  clientId: string,
  metrics: Record<string, RuntimeMetrics>,
): { avgLatencyMs: number; p95LatencyMs: number; errorRate: number } {
  const { outEdges } = buildAdjacency(design);
  let current = clientId;
  let avgSum = 0;
  let p95Sum = 0;
  let combinedSuccess = 1;
  const visited = new Set<string>();

  for (let hop = 0; hop < 12; hop++) {
    const targets = (outEdges.get(current) ?? []).filter((t) => !visited.has(t));
    if (targets.length === 0) break;

    let next = targets[0]!;
    let bestLoad = -1;
    for (const t of targets) {
      const m = metrics[t];
      const node = design.nodes.find((n) => n.id === t);
      if (!node) continue;
      const def = COMPONENT_REGISTRY[node.type];
      if (def.isTrafficSource || def.routingBehavior === "none") continue;
      const load = m?.utilizationPercent ?? 0;
      if (load > bestLoad) {
        bestLoad = load;
        next = t;
      }
    }

    visited.add(next);
    const node = design.nodes.find((n) => n.id === next);
    const m = metrics[next];
    if (!node || !m) break;

    const def = COMPONENT_REGISTRY[node.type];
    if (def.isTrafficSource || def.routingBehavior === "none") break;

    avgSum += m.avgLatencyMs;
    p95Sum += m.p95LatencyMs;
    combinedSuccess *= 1 - Math.min(0.99, m.errorRate);
    current = next;
  }

  return {
    avgLatencyMs: Math.round(avgSum * 10) / 10,
    p95LatencyMs: Math.round(p95Sum * 10) / 10,
    errorRate: Math.round((1 - combinedSuccess) * 1000) / 1000,
  };
}
