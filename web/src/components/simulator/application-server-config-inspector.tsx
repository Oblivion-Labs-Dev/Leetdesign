"use client";

import { useMemo, useState } from "react";
import {
  X,
  Trash2,
  Server,
  TrendingUp,
  Cpu,
  Link2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useDesignStore, useSimulationStore } from "@/lib/simulator/store";
import {
  parseAppServerConfig,
  appServerConfigToStorage,
  listConnectedDependencies,
  formatCount,
  hasUpstreamTrafficRouter,
  deriveCapacityBreakdown,
  computeEffectiveRequestTime,
  type AppServerConfig,
  type QueueFullBehavior,
} from "@/lib/simulator/app-server-model";
import { formatRps, INSTANCE_POOL_TOOLTIP } from "@/lib/simulator/app-server-pool";
import {
  analyzePoolOverview,
  derivePoolInstanceRows,
  formatDurationMs,
  instanceHealthLabel,
  operationalStatusStyles,
  bottleneckDisplayLabel,
} from "@/lib/simulator/app-server-pool-overview";
import type { RuntimeMetrics } from "@/lib/simulator/types";
import { cn } from "@/lib/utils";

const QUEUE_BEHAVIOR_OPTIONS: { value: QueueFullBehavior; label: string }[] = [
  { value: "reject", label: "Reject new requests" },
  { value: "drop_oldest", label: "Drop oldest request" },
  { value: "drop_newest", label: "Drop newest request" },
];

export function ApplicationServerConfigInspector({ embedded = false }: { embedded?: boolean }) {
  const selectedNodeId = useDesignStore((s) => s.selectedNodeId);
  const design = useDesignStore((s) => s.design);
  const clearSelection = useDesignStore((s) => s.clearSelection);
  const mergeNodeConfig = useDesignStore((s) => s.mergeNodeConfig);
  const updateNodeLabel = useDesignStore((s) => s.updateNodeLabel);
  const removeNode = useDesignStore((s) => s.removeNode);
  const selectEdge = useDesignStore((s) => s.selectEdge);
  const selectNode = useDesignStore((s) => s.selectNode);
  const running = useSimulationStore((s) => s.running);
  const metrics = useSimulationStore((s) =>
    selectedNodeId ? s.metrics[selectedNodeId] : undefined,
  );
  const [showInstanceTable, setShowInstanceTable] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!selectedNodeId || !design) return null;
  const node = design.nodes.find((n) => n.id === selectedNodeId);
  if (!node || node.type !== "app_server") return null;

  const cfg = useMemo(() => parseAppServerConfig(node.config), [node.config]);
  const dependencies = useMemo(() => listConnectedDependencies(design, node.id), [design, node.id]);

  const inboundIds = design.edges.filter((e) => e.target === node.id).map((e) => e.source);
  const nodeMap = useMemo(() => new Map(design.nodes.map((n) => [n.id, n])), [design.nodes]);
  const hasRouter = hasUpstreamTrafficRouter(inboundIds, nodeMap);
  const showInstanceWarning = cfg.instanceCount > 1 && !hasRouter;

  const outboundEdges = design.edges.filter((e) => e.source === node.id);
  const allMetrics = useSimulationStore((s) => s.metrics);
  const metricSnapshot = useMemo(() => {
    const snap: Record<string, { avgLatencyMs: number }> = {};
    for (const n of design.nodes) {
      snap[n.id] = { avgLatencyMs: allMetrics[n.id]?.avgLatencyMs ?? 5 };
    }
    return snap;
  }, [design.nodes, allMetrics]);

  const eff = useMemo(
    () => computeEffectiveRequestTime(cfg, outboundEdges, nodeMap, metricSnapshot as never),
    [cfg, outboundEdges, nodeMap, metricSnapshot],
  );
  const capEstimate = useMemo(
    () => deriveCapacityBreakdown(cfg, eff.effectiveRequestTimeMs, hasRouter),
    [cfg, eff.effectiveRequestTimeMs, hasRouter],
  );

  const showLive = running && metrics;

  const configuredCount = cfg.instanceCount;
  const healthyCount = metrics?.healthyInstanceCount ?? configuredCount;
  const trafficHealthyCount =
    configuredCount > healthyCount && metrics?.health === "healthy"
      ? configuredCount
      : healthyCount;
  let perInstanceRps = 0;
  if (showLive && metrics) {
    if (configuredCount > (metrics.healthyInstanceCount ?? 0) && metrics.health === "healthy") {
      perInstanceRps = metrics.currentRps / configuredCount;
    } else {
      perInstanceRps =
        metrics.perInstanceRps ?? metrics.currentRps / Math.max(1, trafficHealthyCount);
    }
  }
  const poolUtil = metrics?.poolUtilizationPercent ?? metrics?.utilizationPercent ?? 0;
  const poolCapacityRps = metrics?.poolCapacityRps ?? metrics?.totalCapacityRps ?? capEstimate.totalCapacityRps;
  const capacityPerInstance = metrics?.derivedCapacityPerInstanceRps ?? capEstimate.capacityPerInstanceRps;

  const overview = useMemo(() => {
    if (!showLive || !metrics) return null;
    return analyzePoolOverview({
      appCfg: cfg,
      metrics,
      outboundEdges,
      nodeMap,
      allMetrics: allMetrics as Record<string, RuntimeMetrics>,
      configuredCount: cfg.instanceCount,
      healthyCount,
      poolCapacityRps,
      capacityPerInstanceRps: capacityPerInstance,
    });
  }, [
    showLive,
    metrics,
    cfg,
    outboundEdges,
    nodeMap,
    allMetrics,
    healthyCount,
    poolCapacityRps,
    capacityPerInstance,
  ]);

  const instanceRows = useMemo(() => {
    if (!showLive || !metrics) return [];
    return derivePoolInstanceRows(
      configuredCount,
      trafficHealthyCount,
      perInstanceRps,
      metrics.activeRequests ?? metrics.activeConnections,
      cfg.maxConcurrentRequestsPerInstance,
      metrics.p95LatencyMs,
      metrics.health,
    );
  }, [showLive, metrics, configuredCount, trafficHealthyCount, perInstanceRps, cfg.maxConcurrentRequestsPerInstance]);

  const tableVisible =
    showInstanceTable ||
    showAdvanced ||
    (overview?.showInstanceTableDefault ?? false);

  const maxSlotsTotal = cfg.maxConcurrentRequestsPerInstance * configuredCount;
  const activeRequests = metrics?.activeRequests ?? metrics?.activeConnections ?? 0;

  const patch = (partial: Partial<AppServerConfig>) => {
    mergeNodeConfig(node.id, appServerConfigToStorage({ ...cfg, ...partial }));
  };

  return (
    <div className={cn(
      "flex h-full flex-col",
      !embedded && "w-[300px] shrink-0 border-l border-[var(--clay-border)] bg-[var(--clay-surface)]/95 backdrop-blur-md lg:w-[320px]",
    )}>
      <div className="flex items-center justify-between border-b border-[var(--clay-border)] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500/10">
            <Server className="h-4.5 w-4.5 text-indigo-500" />
          </div>
          <div>
            <div className="text-sm font-bold text-[var(--clay-text)]">Application Server Pool</div>
            <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-indigo-600">
              Compute
            </span>
          </div>
        </div>
        <button type="button" onClick={clearSelection} className="grid h-7 w-7 place-items-center rounded-lg text-[var(--clay-text-subtle)] hover:bg-[var(--clay-surface-2)]">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-[var(--clay-border)] px-4 py-3">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--clay-text-subtle)]">
            Component Name
          </label>
          <input
            value={node.label}
            onChange={(e) => updateNodeLabel(node.id, e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface-2)] px-3 py-1.5 text-sm focus:border-[var(--clay-primary)] focus:outline-none"
          />
        </div>

        <div className="border-b border-[var(--clay-border)] px-4 py-3">
          <p className="text-[11px] leading-relaxed text-[var(--clay-text-muted)]">
            One box on the canvas = a <strong className="font-medium text-[var(--clay-text)]">group of {cfg.instanceCount} identical servers</strong>.
            The load balancer sends traffic to the whole pool; work is split evenly across instances inside.
          </p>
        </div>

        <div className="border-b border-[var(--clay-border)] px-4 py-3">
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-[var(--clay-text-muted)]" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--clay-text-subtle)]">
              Pool Overview
            </span>
          </div>
          {!showLive ? (
            <div className="rounded-lg border border-dashed border-[var(--clay-border)] bg-[var(--clay-surface-2)]/50 px-3 py-4 text-center text-[11px] text-[var(--clay-text-muted)]">
              Start the simulation to see how traffic is split across instances.
            </div>
          ) : overview && metrics ? (
            <>
              {(() => {
                const statusStyle = operationalStatusStyles(overview.operationalStatus);
                return (
                  <div className={cn("mb-3 rounded-lg border px-3 py-2.5", statusStyle.border, statusStyle.bg)}>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--clay-text-subtle)]">
                      Status
                    </div>
                    <div className={cn("mt-0.5 text-sm font-semibold", statusStyle.title)}>
                      {overview.statusTitle}
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--clay-text-muted)]">
                      {overview.statusExplanation}
                    </p>
                    {overview.slotsFullWaitingOnIo && (
                      <p className="mt-1.5 text-[10px] leading-relaxed text-[var(--clay-text-subtle)]">
                        Slots are full while CPU stays low — requests are blocked on downstream I/O, not compute.
                      </p>
                    )}
                    {(overview.inspectNextNodeId || overview.inspectNextEdgeId) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (overview.inspectNextEdgeId) selectEdge(overview.inspectNextEdgeId);
                          else if (overview.inspectNextNodeId) selectNode(overview.inspectNextNodeId);
                        }}
                        className="mt-2 text-[10px] font-medium text-[var(--clay-primary)] hover:underline"
                      >
                        → {overview.inspectNextLabel}
                      </button>
                    )}
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-2">
                <CoreMetric label="Traffic In" value={`${formatRps(metrics.currentRps)} RPS`} />
                <CoreMetric label="Healthy Instances" value={`${healthyCount} / ${cfg.instanceCount}`} title={INSTANCE_POOL_TOOLTIP} />
                <CoreMetric label="Traffic Per Instance" value={`${formatRps(perInstanceRps, 1)} RPS`} />
                <CoreMetric
                  label="Derived Capacity"
                  value={`${formatRps(Math.round(poolCapacityRps))} RPS total`}
                  sub={`${formatRps(Math.round(capacityPerInstance))} RPS / instance`}
                />
                <CoreMetric label="Utilization" value={`${poolUtil}%`} warn={poolUtil >= 85} />
                <CoreMetric label="Active Requests" value={`${Math.round(activeRequests)} / ${maxSlotsTotal}`} warn={activeRequests >= maxSlotsTotal * 0.9} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <SecondaryMetric label="Queue Depth" value={`${formatCount(metrics.queueDepth)} requests`} />
                <SecondaryMetric label="P95 Response Time" value={formatDurationMs(metrics.p95LatencyMs)} />
                <SecondaryMetric label="Error Rate" value={`${(metrics.errorRate * 100).toFixed(1)}%`} warn={metrics.errorRate > 0.02} />
                <SecondaryMetric
                  label="Primary Bottleneck"
                  value={bottleneckDisplayLabel(overview.primaryBottleneck.kind, overview.primaryBottleneck.label)}
                />
              </div>

              <div className="mt-3 rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface-2)] px-2.5 py-2">
                <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-[var(--clay-text-subtle)]">
                  Request Time Breakdown
                </div>
                <BreakdownRow label="Application Compute" value={formatDurationMs(overview.requestTime.applicationComputeMs)} />
                <BreakdownRow label="Database Wait" value={formatDurationMs(overview.requestTime.databaseWaitMs)} highlight={overview.primaryBottleneck.kind === "database"} />
                <BreakdownRow label="Cache Wait" value={formatDurationMs(overview.requestTime.cacheWaitMs)} highlight={overview.primaryBottleneck.kind === "cache"} />
                <BreakdownRow label="External API Wait" value={formatDurationMs(overview.requestTime.externalApiWaitMs)} highlight={overview.primaryBottleneck.kind === "external_api"} />
                <BreakdownRow label="Queue Wait" value={formatDurationMs(overview.requestTime.queueWaitMs)} highlight={overview.primaryBottleneck.kind === "queue"} />
                <div className="mt-1.5 flex items-baseline justify-between border-t border-[var(--clay-border)] pt-1.5 text-[10px]">
                  <span className="font-medium text-[var(--clay-text)]">Total Effective Request Time</span>
                  <span className="font-mono font-semibold tabular-nums text-[var(--clay-text)]">
                    {formatDurationMs(overview.requestTime.totalEffectiveMs)}
                  </span>
                </div>
              </div>

              {!tableVisible && (
                <p className="mt-3 rounded-lg border border-[var(--clay-border)] bg-[var(--clay-bg-soft)] px-2.5 py-2 text-[10px] leading-relaxed text-[var(--clay-text-muted)]">
                  {overview.evenDistributionMessage}
                </p>
              )}

              {!overview.showInstanceTableDefault && (
                <button
                  type="button"
                  onClick={() => setShowInstanceTable(!showInstanceTable)}
                  className="mt-2 flex w-full items-center gap-1 text-[10px] font-medium text-[var(--clay-primary)]"
                >
                  {showInstanceTable ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  Inspect individual instances
                </button>
              )}

              {tableVisible && instanceRows.length > 0 && (
                <div className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-[var(--clay-border)]">
                  <table className="w-full text-[10px]">
                    <thead className="sticky top-0 bg-[var(--clay-surface-2)] text-[var(--clay-text-subtle)]">
                      <tr>
                        <th className="px-2 py-1.5 text-left font-medium">Instance</th>
                        <th className="px-2 py-1.5 text-right font-medium">Incoming RPS</th>
                        <th className="px-2 py-1.5 text-right font-medium">Active Requests</th>
                        <th className="px-2 py-1.5 text-right font-medium">Utilization</th>
                        <th className="px-2 py-1.5 text-right font-medium">P95 Latency</th>
                        <th className="px-2 py-1.5 text-right font-medium">Health</th>
                      </tr>
                    </thead>
                    <tbody>
                      {instanceRows.map((inst) => (
                        <tr key={inst.index} className="border-t border-[var(--clay-border)]">
                          <td className="px-2 py-1 text-[var(--clay-text-muted)]">#{inst.index}</td>
                          <td className="px-2 py-1 text-right font-mono tabular-nums">{formatRps(inst.incomingRps, 1)}</td>
                          <td className="px-2 py-1 text-right font-mono tabular-nums">{inst.activeRequests} / {inst.maxSlots}</td>
                          <td className="px-2 py-1 text-right font-mono tabular-nums">{inst.utilizationPercent}%</td>
                          <td className="px-2 py-1 text-right font-mono tabular-nums">{formatDurationMs(inst.p95LatencyMs)}</td>
                          <td className="px-2 py-1 text-right text-[var(--clay-text-muted)]">{instanceHealthLabel(inst.health)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="mt-3 flex w-full items-center gap-1 text-[10px] font-medium text-[var(--clay-text-subtle)]"
              >
                {showAdvanced ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Advanced / debug metrics
              </button>
              {showAdvanced && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <OutcomeTile label="Completed RPS" value={formatCount(metrics.completedRps ?? 0)} />
                  <OutcomeTile label="Avg Response Time" value={formatDurationMs(metrics.avgLatencyMs)} />
                  <OutcomeTile label="Effective request time" value={formatDurationMs(overview.requestTime.totalEffectiveMs)} />
                  <OutcomeTile label="Max concurrent / instance" value={String(cfg.maxConcurrentRequestsPerInstance)} />
                </div>
              )}
            </>
          ) : null}
        </div>

        {showInstanceWarning && (
          <div className="mx-4 mt-3 flex gap-2 rounded-lg border border-amber-400/30 bg-amber-500/8 px-3 py-2 text-[11px] text-amber-700">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Multiple instances are deployed, but incoming traffic is not currently distributed across them.
            </span>
          </div>
        )}

        <Section icon={Cpu} title="Service Capacity" subtitle="What you configure — deployment limits and behavior">
          <Field
            label="Instance Count"
            helper="Replicas in this service pool. Traffic from the load balancer is divided across healthy instances."
            value={cfg.instanceCount}
            min={1}
            max={100}
            onChange={(v) => patch({ instanceCount: v })}
          />
          <Field
            label="Max Concurrent Requests (per instance)"
            helper="How many requests one instance processes at the same time — not requests per second. Throughput emerges from this limit and how long each request takes."
            value={cfg.maxConcurrentRequestsPerInstance}
            min={1}
            max={100_000}
            onChange={(v) => patch({ maxConcurrentRequestsPerInstance: v })}
          />
          <Field
            label="Application Compute Time"
            unit="ms"
            helper="CPU time for your business logic only. Waits for databases, caches, or APIs are added automatically from connected dependencies."
            value={cfg.applicationComputeTimeMs}
            min={1}
            max={30_000}
            onChange={(v) => patch({ applicationComputeTimeMs: v })}
          />
          <Field
            label="Response Deadline"
            unit="ms"
            helper="Requests still in flight after this duration count as timeouts."
            value={cfg.responseDeadlineMs}
            min={100}
            max={300_000}
            step={100}
            onChange={(v) => patch({ responseDeadlineMs: v })}
          />
          <Field
            label="Max Waiting Queue"
            helper="Requests that wait for a free processing slot when all slots are busy."
            value={cfg.maxWaitingQueue}
            min={0}
            max={100_000}
            onChange={(v) => patch({ maxWaitingQueue: v })}
          />
          <div>
            <FieldLabel label="Queue Full Behavior" helper="What happens when the waiting queue is full." />
            <select
              value={cfg.queueFullBehavior}
              onChange={(e) => patch({ queueFullBehavior: e.target.value as QueueFullBehavior })}
              className="mt-1 w-full rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface-2)] px-2.5 py-1.5 text-xs focus:border-[var(--clay-primary)] focus:outline-none"
            >
              {QUEUE_BEHAVIOR_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-[var(--clay-border)] bg-[var(--clay-bg-soft)] px-2.5 py-2 text-[10px] text-[var(--clay-text-muted)]">
            <div className="font-medium text-[var(--clay-text)]">Estimated max throughput (idle preview)</div>
            <p className="mt-1">
              ≈ {formatCount(Math.round(capEstimate.totalCapacityRps))} RPS at current dependency latency
            </p>
            <p className="mt-0.5 text-[var(--clay-text-subtle)]">
              {cfg.maxConcurrentRequestsPerInstance} slots × {capEstimate.effectiveInstanceCount} instance{capEstimate.effectiveInstanceCount === 1 ? "" : "s"} ÷ {Math.round(eff.effectiveRequestTimeMs)} ms per request
            </p>
          </div>
        </Section>

        <Section icon={Link2} title="Connected Dependencies" subtitle="Per-connection settings — click to edit">
          {dependencies.length === 0 ? (
            <p className="text-[11px] text-[var(--clay-text-subtle)]">
              Wire this server to a database, cache, queue, or external API. Call rates and sync behavior are configured on each connection, not here.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {dependencies.map((dep) => (
                <li key={dep.edgeId}>
                  <button
                    type="button"
                    onClick={() => selectEdge(dep.edgeId)}
                    className="w-full rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface-2)] px-2.5 py-2 text-left transition-colors hover:border-[var(--clay-primary)]/40 hover:bg-[var(--clay-surface)]"
                  >
                    <div className="text-xs font-medium text-[var(--clay-text)]">{dep.targetLabel}</div>
                    <div className="mt-0.5 text-[10px] text-[var(--clay-text-muted)]">{dep.summary}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <div className="px-4 py-3">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--clay-text-subtle)]">
            What This Represents
          </div>
          <p className="text-xs leading-relaxed text-[var(--clay-text-muted)]">
            Runs backend logic across a pool of service instances. Each canvas node represents a deployment group — not a single machine.
          </p>
        </div>
      </div>

      <div className="border-t border-[var(--clay-border)] px-4 py-3">
        <button
          type="button"
          onClick={() => { removeNode(node.id); clearSelection(); }}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-rose-300/30 bg-rose-500/8 px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-500/15"
        >
          <Trash2 className="h-3.5 w-3.5" /> Remove Component
        </button>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof Cpu;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-[var(--clay-border)] px-4 py-3">
      <div className="mb-1 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-[var(--clay-primary)]" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--clay-text-subtle)]">{title}</span>
      </div>
      {subtitle && <p className="mb-2 text-[10px] text-[var(--clay-text-subtle)]">{subtitle}</p>}
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function FieldLabel({ label, helper }: { label: string; helper?: string }) {
  return (
    <div>
      <label className="text-xs text-[var(--clay-text)]">{label}</label>
      {helper && <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--clay-text-subtle)]">{helper}</p>}
    </div>
  );
}

function Field({
  label,
  helper,
  unit,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  helper?: string;
  unit?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <FieldLabel label={label} helper={helper} />
        {unit && <span className="shrink-0 text-[9px] text-[var(--clay-text-subtle)]">{unit}</span>}
      </div>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface-2)] px-2.5 py-1.5 text-xs tabular-nums focus:border-[var(--clay-primary)] focus:outline-none"
      />
    </div>
  );
}

function CoreMetric({
  label,
  value,
  sub,
  title,
  warn,
}: {
  label: string;
  value: string;
  sub?: string;
  title?: string;
  warn?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-2.5 py-2",
        warn ? "border-amber-400/30 bg-amber-500/5" : "border-[var(--clay-border)] bg-[var(--clay-surface-2)]",
      )}
      title={title}
    >
      <div className="text-[9px] font-medium uppercase tracking-wider text-[var(--clay-text-subtle)]">{label}</div>
      <div className={cn("text-sm font-semibold tabular-nums leading-tight", warn ? "text-amber-700" : "text-[var(--clay-text)]")}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[9px] text-[var(--clay-text-subtle)]">{sub}</div>}
    </div>
  );
}

function SecondaryMetric({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-lg border px-2 py-1.5",
      warn ? "border-amber-400/25 bg-amber-500/4" : "border-[var(--clay-border)]/80 bg-[var(--clay-surface)]",
    )}>
      <div className="text-[8px] font-medium uppercase tracking-wider text-[var(--clay-text-subtle)]">{label}</div>
      <div className={cn("text-[11px] font-semibold tabular-nums", warn ? "text-amber-700" : "text-[var(--clay-text-muted)]")}>
        {value}
      </div>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn(
      "flex items-baseline justify-between py-0.5 text-[10px]",
      highlight && "rounded bg-[var(--clay-primary)]/8 px-1 -mx-1",
    )}>
      <span className={highlight ? "font-medium text-[var(--clay-text)]" : "text-[var(--clay-text-muted)]"}>{label}</span>
      <span className={cn("font-mono tabular-nums", highlight ? "font-semibold text-[var(--clay-primary)]" : "text-[var(--clay-text-subtle)]")}>
        {value}
      </span>
    </div>
  );
}

function OutcomeTile({
  label,
  value,
  subtitle,
  title,
  warn,
  expandable,
  expanded,
}: {
  label: string;
  value: string;
  subtitle?: string;
  title?: string;
  warn?: boolean;
  expandable?: boolean;
  expanded?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-2.5 py-1.5",
        warn ? "border-amber-400/30 bg-amber-500/5" : "border-[var(--clay-border)] bg-[var(--clay-surface-2)]",
      )}
      title={title}
    >
      <div className="flex items-center justify-between">
        <div className="text-[9px] font-medium uppercase tracking-wider text-[var(--clay-text-subtle)]">{label}</div>
        {expandable && (expanded ? <ChevronDown className="h-3 w-3 text-[var(--clay-text-subtle)]" /> : <ChevronRight className="h-3 w-3 text-[var(--clay-text-subtle)]" />)}
      </div>
      <div className={cn("text-sm font-semibold tabular-nums", warn ? "text-amber-600" : "text-[var(--clay-text)]")}>{value}</div>
      {subtitle && (
        <div className="mt-0.5 text-[9px] text-[var(--clay-text-subtle)]">{subtitle}</div>
      )}
    </div>
  );
}
