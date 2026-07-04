"use client";

import type { SimulationMetricsSnapshot } from "@/lib/simulator/courses/types";
import { cn } from "@/lib/utils";

export function MetricsCompare({
  before,
  after,
  showAfter = false,
  liveHealthy = false,
}: {
  before: SimulationMetricsSnapshot;
  after?: SimulationMetricsSnapshot;
  showAfter?: boolean;
  liveHealthy?: boolean;
}) {
  return (
    <div className="mb-3 grid gap-2 sm:grid-cols-2">
      <MetricCard
        title={before.label ?? "Before"}
        metrics={before}
        highlight={!showAfter && !liveHealthy}
      />
      {showAfter && after ? (
        <MetricCard title={after.label ?? "After"} metrics={after} highlight positive />
      ) : liveHealthy ? (
        <MetricCard
          title="Live (healthy)"
          metrics={before}
          highlight
          positive
          caption="System is handling traffic well at this scale."
        />
      ) : (
        <MetricCard
          title="Target after fix"
          metrics={after ?? before}
          muted
          caption={after ? "Run again after adding components to reach these numbers." : undefined}
        />
      )}
    </div>
  );
}

function MetricCard({
  title,
  metrics,
  highlight,
  positive,
  muted,
  caption,
}: {
  title: string;
  metrics: SimulationMetricsSnapshot;
  highlight?: boolean;
  positive?: boolean;
  muted?: boolean;
  caption?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        highlight && positive && "border-emerald-400/30 bg-emerald-500/8",
        highlight && !positive && "border-[var(--clay-primary)]/30 bg-[var(--clay-primary)]/5",
        muted && "border-dashed border-[var(--clay-border)] opacity-70",
        !highlight && !muted && "border-[var(--clay-border)] bg-[var(--clay-surface-2)]",
      )}
    >
      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">{title}</div>
      {metrics.description && (
        <p className="mt-1 text-[10px] text-[var(--clay-text-muted)]">{metrics.description}</p>
      )}
      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
        <Stat label="p95 latency" value={`${metrics.p95LatencyMs}ms`} warn={metrics.p95LatencyMs > 500} />
        <Stat label="Error rate" value={`${(metrics.errorRate * 100).toFixed(1)}%`} warn={metrics.errorRate > 0.05} />
        {metrics.dbCpuPercent != null && (
          <Stat label="DB CPU" value={`${metrics.dbCpuPercent}%`} warn={metrics.dbCpuPercent > 80} />
        )}
        {metrics.totalRps != null && (
          <Stat label="Traffic" value={`${metrics.totalRps} rps`} />
        )}
        {metrics.cacheHitRate != null && (
          <Stat label="Cache hit" value={`${metrics.cacheHitRate}%`} positive={metrics.cacheHitRate > 50} />
        )}
      </div>
      {caption && <p className="mt-2 text-[10px] text-[var(--clay-text-subtle)]">{caption}</p>}
    </div>
  );
}

function Stat({
  label,
  value,
  warn,
  positive,
}: {
  label: string;
  value: string;
  warn?: boolean;
  positive?: boolean;
}) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider text-[var(--clay-text-subtle)]">{label}</div>
      <div
        className={cn(
          "font-mono font-semibold",
          warn && "text-amber-600",
          positive && "text-emerald-600",
          !warn && !positive && "text-[var(--clay-text)]",
        )}
      >
        {value}
      </div>
    </div>
  );
}
