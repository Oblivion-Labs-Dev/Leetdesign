"use client";

import { useMemo, useState, useEffect } from "react";
import { Trash2, Network, TrendingUp, Settings2 } from "lucide-react";
import { useDesignStore, useSimulationStore } from "@/lib/simulator/store";
import { COMPONENT_REGISTRY } from "@/lib/simulator/component-registry";
import { formatRps } from "@/lib/simulator/app-server-pool";
import {
  algorithmDescription,
  algorithmDisplayLabel,
  deriveLoadBalancerReplicaRows,
  lbReplicaHealthLabel,
  parseLoadBalancerConfig,
} from "@/lib/simulator/load-balancer-model";
import type { ConfigFieldDef } from "@/lib/simulator/types";
import { cn } from "@/lib/utils";
import {
  InspectorPanel,
  InspectorHeader,
  InspectorScrollBody,
  InspectorSection,
  InspectorSubCard,
  InspectorEmptyState,
  InspectorCollapsible,
  InspectorMetricsScrollTable,
  InspectorNameField,
  InspectorRemoveFooter,
  METRICS_TABLE_MIN_WIDTH,
} from "./inspector-panel";
import {
  InspectorViewModeTabs,
  InspectorBasicsPanel,
  useInspectorViewModeForNode,
} from "./inspector-basics-advanced";

const FIELD_HELPERS: Record<string, string> = {
  replicas:
    "How many load balancer instances are deployed for availability and routing capacity.",
  maxConnections:
    "The maximum active client connections this load balancer can maintain.",
  maxRoutingThroughputRps:
    "The maximum request rate this load balancer can route before becoming a bottleneck.",
  baseRoutingLatencyMs:
    "Small overhead added while selecting and forwarding a backend target.",
};

const ROUTING_STATUS_STYLES = {
  idle: {
    border: "border-[var(--clay-border)]",
    bg: "bg-[var(--clay-surface)]/80",
    title: "text-[var(--clay-text-muted)]",
  },
  healthy: {
    border: "border-emerald-400/25",
    bg: "bg-emerald-500/6",
    title: "text-emerald-800",
  },
  reduced_targets: {
    border: "border-amber-400/25",
    bg: "bg-amber-500/6",
    title: "text-amber-800",
  },
  no_healthy_targets: {
    border: "border-rose-400/25",
    bg: "bg-rose-500/6",
    title: "text-rose-700",
  },
  throughput_limited: {
    border: "border-rose-400/25",
    bg: "bg-rose-500/6",
    title: "text-rose-700",
  },
} as const;

const REPLICA_TABLE_MIN_WIDTH = 520;

export function LoadBalancerConfigInspector({ embedded = false }: { embedded?: boolean }) {
  const selectedNodeId = useDesignStore((s) => s.selectedNodeId);
  const design = useDesignStore((s) => s.design);
  const clearSelection = useDesignStore((s) => s.clearSelection);
  const mergeNodeConfig = useDesignStore((s) => s.mergeNodeConfig);
  const updateNodeConfig = useDesignStore((s) => s.updateNodeConfig);
  const updateNodeLabel = useDesignStore((s) => s.updateNodeLabel);
  const removeNode = useDesignStore((s) => s.removeNode);
  const running = useSimulationStore((s) => s.running);
  const metrics = useSimulationStore((s) =>
    selectedNodeId ? s.metrics[selectedNodeId] : undefined,
  );
  const [showReplicas, setShowReplicas] = useState(true);
  const { mode, setMode } = useInspectorViewModeForNode(selectedNodeId);

  useEffect(() => {
    setShowReplicas(true);
  }, [selectedNodeId]);

  const node = design?.nodes.find(
    (n) => n.id === selectedNodeId && n.type === "load_balancer",
  );
  const cfg = useMemo(
    () => parseLoadBalancerConfig(node?.config ?? {}),
    [node?.config],
  );
  const dist = metrics?.loadBalancerDistribution;
  const replicaRows = useMemo(() => {
    if (!metrics) {
      return Array.from({ length: cfg.replicas }, (_, i) => ({
        index: i + 1,
        incomingRps: 0,
        outgoingRps: 0,
        activeConnections: 0,
        maxConnections: cfg.maxConnections,
        utilizationPercent: 0,
        routingThroughputCapRps: cfg.maxRoutingThroughputRps,
        p95LatencyMs: 0,
        health: "healthy" as const,
      }));
    }
    return deriveLoadBalancerReplicaRows(
      cfg,
      {
        currentRps: metrics.currentRps,
        activeConnections: metrics.activeConnections,
        p95LatencyMs: metrics.p95LatencyMs,
        health: metrics.health,
      },
      dist,
    );
  }, [cfg, metrics, dist]);

  if (!selectedNodeId || !design || !node) return null;

  const def = COMPONENT_REGISTRY.load_balancer;
  const algo = cfg.algorithm;
  const isIdle = !dist || dist.routingStatus === "idle" || dist.incomingRps <= 0;
  const statusStyle = ROUTING_STATUS_STYLES[dist?.routingStatus ?? "idle"];
  const showLive = running && metrics;

  return (
    <InspectorPanel
      embedded={embedded}
      footer={
        <InspectorRemoveFooter
          onRemove={() => { removeNode(node.id); clearSelection(); }}
        />
      }
    >
      <InspectorHeader
        icon={Network}
        iconClassName="bg-violet-500/10 text-violet-500"
        title="Load Balancer"
        badge="Gateway"
        badgeClassName="border-violet-500/20 bg-violet-500/10 text-violet-600"
        onClose={clearSelection}
      />

      <InspectorScrollBody>
        <InspectorNameField value={node.label} onChange={(v) => updateNodeLabel(node.id, v)} />
        <InspectorViewModeTabs mode={mode} onChange={setMode} />

        {mode === "basics" ? (
          <>
            <InspectorSection
              icon={TrendingUp}
              title="Live status"
              subtitle={showLive ? "Routing health at a glance." : "Start simulation to see metrics."}
            >
              {!showLive || !dist ? (
                <InspectorEmptyState>Idle — no traffic routed yet.</InspectorEmptyState>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <MetricTile label="Incoming Traffic" value={`${formatRps(dist.incomingRps)} RPS`} />
                  <MetricTile
                    label="Healthy Backends"
                    value={
                      dist.totalTargetPools > 0
                        ? `${dist.healthyTargetPools} / ${dist.totalTargetPools}`
                        : String(dist.healthyTargetPools)
                    }
                  />
                  <MetricTile label="Status" value={dist.statusTitle} />
                  <MetricTile label="Load" value={`${metrics?.utilizationPercent ?? 0}%`} />
                </div>
              )}
            </InspectorSection>

            <InspectorBasicsPanel
              node={node}
              design={design!}
              metrics={metrics}
              mergeNodeConfig={mergeNodeConfig}
              updateNodeConfig={updateNodeConfig}
              onSwitchAdvanced={() => setMode("advanced")}
            >
              <InspectorSection title="Simple scaling" subtitle="Raise capacity when the load balancer itself is the bottleneck.">
                <ConfigField
                  field={{ key: "maxRoutingThroughputRps", label: "Max routing throughput", type: "number", default: cfg.maxRoutingThroughputRps, min: 100, max: 1_000_000 }}
                  value={node.config.maxRoutingThroughputRps ?? cfg.maxRoutingThroughputRps}
                  helper={FIELD_HELPERS.maxRoutingThroughputRps}
                  onChange={(v) => updateNodeConfig(node.id, "maxRoutingThroughputRps", v as number)}
                />
                <ConfigField
                  field={{ key: "replicas", label: "Load balancer replicas", type: "number", default: cfg.replicas, min: 1, max: 10 }}
                  value={node.config.replicas ?? cfg.replicas}
                  helper={FIELD_HELPERS.replicas}
                  onChange={(v) => updateNodeConfig(node.id, "replicas", v as number)}
                />
              </InspectorSection>
            </InspectorBasicsPanel>
          </>
        ) : (
          <>
        <InspectorSection
          icon={TrendingUp}
          title="Traffic Distribution"
          subtitle="How incoming requests are split across backend target pools."
        >
          {!showLive || !dist ? (
            <InspectorEmptyState>
              Run the simulation to see incoming RPS and per-pool distribution.
            </InspectorEmptyState>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <MetricTile label="Incoming Traffic" value={`${formatRps(dist.incomingRps)} RPS`} />
                <MetricTile
                  label="Healthy Target Pools"
                  value={
                    dist.totalTargetPools > 0
                      ? `${dist.healthyTargetPools} / ${dist.totalTargetPools}`
                      : String(dist.healthyTargetPools)
                  }
                />
              </div>

              <InspectorSubCard title="Routing Status">
                <div className={cn("rounded-md border px-2.5 py-2", statusStyle.border, statusStyle.bg)}>
                  <div className={cn("text-sm font-semibold", statusStyle.title)}>
                    {dist.statusTitle}
                  </div>
                  <p className="mt-1 text-[10px] leading-relaxed text-[var(--clay-text-muted)]">
                    {dist.statusMessage}
                  </p>
                </div>
              </InspectorSubCard>

              <MetricTile label="Distribution" value={dist.distributionLabel} muted={isIdle} />

              <InspectorSubCard title="Outgoing Distribution">
                {isIdle ? (
                  <>
                    <p className="text-[11px] text-[var(--clay-text-muted)]">
                      No traffic to distribute yet.
                    </p>
                    <p className="mt-1.5 text-[10px] leading-relaxed text-[var(--clay-text-subtle)]">
                      Connect an upstream component or generate client traffic to begin routing.
                    </p>
                  </>
                ) : dist.distributions.length > 0 ? (
                  <ul className="space-y-2">
                    {dist.distributions.map((d) => (
                      <li
                        key={d.targetId}
                        className={cn(
                          "rounded-md border border-[var(--clay-border)] bg-[var(--clay-bg-soft)] px-2 py-1.5",
                          !d.healthy && "opacity-60",
                        )}
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-[11px] font-medium text-[var(--clay-text)]">
                            {d.label}
                          </span>
                          {!isIdle && d.healthy && d.rps > 0 && (
                            <span className="shrink-0 font-mono text-[11px] font-semibold tabular-nums">
                              {formatRps(d.rps)} RPS
                            </span>
                          )}
                        </div>
                        <div className="mt-1 grid grid-cols-3 gap-1 text-[9px]">
                          <div>
                            <div className="text-[var(--clay-text-subtle)]">Health</div>
                            <div className={cn(
                              "font-medium",
                              d.healthLabel === "Healthy" ? "text-emerald-700" :
                              d.healthLabel === "Degraded" ? "text-amber-700" :
                              "text-[var(--clay-text-muted)]",
                            )}>
                              {d.healthLabel}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[var(--clay-text-subtle)]">Traffic</div>
                            <div className="font-mono tabular-nums text-[var(--clay-text-muted)]">
                              {!isIdle && d.healthy && d.rps > 0 ? `${formatRps(d.rps)} RPS` : "—"}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[var(--clay-text-subtle)]">Share</div>
                            <div className="font-mono tabular-nums text-[var(--clay-text-muted)]">
                              {!isIdle && d.healthy && d.rps > 0
                                ? `${d.percent % 1 === 0 ? d.percent.toFixed(0) : d.percent.toFixed(1)}%`
                                : "—"}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </InspectorSubCard>

              <p className="text-[10px] leading-relaxed text-[var(--clay-text-muted)]">
                {algorithmDescription(algo, isIdle)}
              </p>
            </>
          )}
        </InspectorSection>

        <InspectorCollapsible
          title={`Load Balancer Replicas (${cfg.replicas})`}
          meta={showLive ? `${cfg.replicas} active` : `${cfg.replicas} configured`}
          open={showReplicas}
          onToggle={() => setShowReplicas(!showReplicas)}
          hint={
            showLive && !isIdle
              ? `Incoming traffic is split evenly across ${cfg.replicas} replica${cfg.replicas === 1 ? "" : "s"}.`
              : `All ${cfg.replicas} configured replica${cfg.replicas === 1 ? "" : "s"} are listed below.${showLive ? " Metrics appear when traffic reaches this component." : " Start the simulation for live metrics."}`
          }
        >
          <InspectorMetricsScrollTable
            minWidth={REPLICA_TABLE_MIN_WIDTH}
            columns={[
              { key: "replica", label: "Replica", align: "left" },
              { key: "incoming", label: "Incoming RPS", align: "right" },
              { key: "outgoing", label: "Outgoing RPS", align: "right" },
              { key: "connections", label: "Connections", align: "right" },
              { key: "util", label: "Utilization", align: "right" },
              { key: "cap", label: "Routing Cap", align: "right" },
              { key: "p95", label: "P95 Latency", align: "right" },
              { key: "health", label: "Health", align: "right" },
            ]}
            rows={replicaRows.map((rep) => ({
              key: String(rep.index),
              cells: {
                replica: `#${rep.index}`,
                incoming: showLive && !isIdle ? formatRps(rep.incomingRps, 1) : "—",
                outgoing: showLive && !isIdle ? formatRps(rep.outgoingRps, 1) : "—",
                connections: showLive && !isIdle
                  ? `${rep.activeConnections} / ${rep.maxConnections.toLocaleString("en-US")}`
                  : "—",
                util: showLive && !isIdle ? `${rep.utilizationPercent}%` : "—",
                cap: `${formatRps(rep.routingThroughputCapRps)} RPS`,
                p95: showLive && !isIdle ? `${rep.p95LatencyMs} ms` : "—",
                health: showLive ? lbReplicaHealthLabel(rep.health) : "—",
              },
            }))}
          />
        </InspectorCollapsible>

        <InspectorSection
          icon={Settings2}
          title="Routing Configuration"
          subtitle="Algorithm, capacity limits, and routing behavior."
        >
          {def.configFields.map((field) => (
            <ConfigField
              key={field.key}
              field={field}
              value={node.config[field.key] ?? field.default}
              helper={FIELD_HELPERS[field.key]}
              onChange={(v) => updateNodeConfig(node.id, field.key, v)}
            />
          ))}
          <p className="text-[10px] leading-relaxed text-[var(--clay-text-muted)]">
            <span className="font-medium text-[var(--clay-text)]">{algorithmDisplayLabel(algo)}:</span>
            {" "}{algorithmDescription(algo, false)}
          </p>
          {algo === "weighted" || algo === "weighted_round_robin" ? (
            <p className="text-[10px] text-[var(--clay-text-subtle)]">
              Select a wire from this load balancer to a target pool and set edge weight in the connection inspector.
            </p>
          ) : null}
        </InspectorSection>

        <InspectorSection title="What This Represents">
          <p className="text-xs leading-relaxed text-[var(--clay-text-muted)]">{def.description}</p>
        </InspectorSection>
          </>
        )}
      </InspectorScrollBody>
    </InspectorPanel>
  );
}

function MetricTile({
  label,
  value,
  className,
  muted = false,
}: {
  label: string;
  value: string;
  className?: string;
  muted?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface)] px-2.5 py-1.5",
      muted && "opacity-80",
      className,
    )}>
      <div className="text-[9px] font-medium uppercase tracking-wider text-[var(--clay-text-subtle)]">{label}</div>
      <div className={cn(
        "text-sm font-semibold tabular-nums",
        muted ? "text-[var(--clay-text-muted)]" : "text-[var(--clay-text)]",
      )}>
        {value}
      </div>
    </div>
  );
}

function ConfigField({
  field,
  value,
  helper,
  onChange,
}: {
  field: ConfigFieldDef;
  value: string | number | boolean;
  helper?: string;
  onChange: (v: string | number | boolean) => void;
}) {
  const label = field.key === "replicas" ? "Load Balancer Replicas" : field.label;
  const id = field.key;

  if (field.type === "select") {
    return (
      <div>
        <label htmlFor={id} className="text-[10px] font-medium text-[var(--clay-text-muted)]">{label}</label>
        <select
          id={id}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface)] px-2.5 py-1.5 text-xs focus:border-[var(--clay-primary)] focus:outline-none"
        >
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {helper && (
          <p className="mt-1 text-[10px] leading-relaxed text-[var(--clay-text-subtle)]">{helper}</p>
        )}
      </div>
    );
  }

  if (field.type === "boolean") {
    return (
      <label className="flex items-center justify-between gap-2 text-[11px] text-[var(--clay-text-muted)]">
        <span>{label}</span>
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="rounded border-[var(--clay-border)]"
        />
      </label>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="text-[10px] font-medium text-[var(--clay-text-muted)]">
        {label}{field.unit ? ` (${field.unit})` : ""}
      </label>
      <input
        id={id}
        type="number"
        value={Number(value)}
        min={field.min}
        max={field.max}
        step={field.step ?? 1}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface)] px-2.5 py-1.5 text-xs focus:border-[var(--clay-primary)] focus:outline-none"
      />
      {helper && (
        <p className="mt-1 text-[10px] leading-relaxed text-[var(--clay-text-subtle)]">{helper}</p>
      )}
    </div>
  );
}
