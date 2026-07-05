"use client";

import { useMemo } from "react";
import { X, Trash2, Network, TrendingUp, Settings2 } from "lucide-react";
import { useDesignStore, useSimulationStore } from "@/lib/simulator/store";
import { COMPONENT_REGISTRY } from "@/lib/simulator/component-registry";
import { formatRps } from "@/lib/simulator/app-server-pool";
import type { ConfigFieldDef } from "@/lib/simulator/types";
import { cn } from "@/lib/utils";

const ALGORITHM_HINTS: Record<string, string> = {
  round_robin:
    "Distributes traffic evenly across healthy target pools in rotation.",
  weighted:
    "Split traffic by edge weight (select a wire from the LB to set weight). Higher weight = more traffic.",
  weighted_round_robin:
    "Split traffic by edge weight (select a wire from the LB to set weight). Higher weight = more traffic.",
  least_connections:
    "Routes new requests to the pool with the fewest active connections. Under load, slow pools receive less traffic.",
  least_response_time:
    "Prefers pools with lower response times. Faster backends receive a larger share over time.",
  path_based:
    "Simulated path-based rules — request paths map to specific pools with uneven but stable distribution.",
  header_based:
    "Simulated header-based rules — routing keys in headers steer traffic to target pools.",
  ip_hash:
    "Sticky routing — clients map to a fixed pool. Traffic split is uneven but consistent.",
};

function algorithmLabel(value: string): string {
  const field = COMPONENT_REGISTRY.load_balancer.configFields.find((f) => f.key === "algorithm");
  if (field?.type === "select" && field.options) {
    const opt = field.options.find((o) => o.value === value);
    if (opt) return opt.label;
  }
  return value.replace(/_/g, " ");
}

export function LoadBalancerConfigInspector({ embedded = false }: { embedded?: boolean }) {
  const selectedNodeId = useDesignStore((s) => s.selectedNodeId);
  const design = useDesignStore((s) => s.design);
  const clearSelection = useDesignStore((s) => s.clearSelection);
  const updateNodeConfig = useDesignStore((s) => s.updateNodeConfig);
  const updateNodeLabel = useDesignStore((s) => s.updateNodeLabel);
  const removeNode = useDesignStore((s) => s.removeNode);
  const running = useSimulationStore((s) => s.running);
  const metrics = useSimulationStore((s) =>
    selectedNodeId ? s.metrics[selectedNodeId] : undefined,
  );

  if (!selectedNodeId || !design) return null;
  const node = design.nodes.find((n) => n.id === selectedNodeId);
  if (!node || node.type !== "load_balancer") return null;

  const def = COMPONENT_REGISTRY.load_balancer;
  const algo = (node.config.algorithm as string) ?? "round_robin";
  const dist = metrics?.loadBalancerDistribution;
  const showLive = running && metrics;

  const healthyPercents = useMemo(
    () => dist?.distributions.filter((d) => d.healthy).map((d) => d.percent) ?? [],
    [dist],
  );

  return (
    <div className={cn(
      "flex h-full flex-col",
      !embedded && "w-[300px] shrink-0 border-l border-[var(--clay-border)] bg-[var(--clay-surface)]/95 backdrop-blur-md lg:w-[320px]",
    )}>
      <div className="flex items-center justify-between border-b border-[var(--clay-border)] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/10">
            <Network className="h-4.5 w-4.5 text-violet-500" />
          </div>
          <div>
            <div className="text-sm font-bold text-[var(--clay-text)]">Load Balancer</div>
            <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-violet-600">
              Gateway
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
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-[var(--clay-text-muted)]" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--clay-text-subtle)]">
              Traffic Distribution
            </span>
          </div>
          {!showLive ? (
            <div className="rounded-lg border border-dashed border-[var(--clay-border)] bg-[var(--clay-surface-2)]/50 px-3 py-4 text-center text-[11px] text-[var(--clay-text-muted)]">
              Run the simulation to see incoming RPS and per-pool distribution.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <MetricTile label="Incoming Traffic" value={`${formatRps(dist?.incomingRps ?? metrics.currentRps)} RPS`} />
                <MetricTile label="Healthy Target Pools" value={String(dist?.healthyTargetPools ?? 0)} />
              </div>
              {healthyPercents.length > 0 && (
                <MetricTile
                  label="Traffic Distribution"
                  value={healthyPercents
                    .map((p) => `${p % 1 === 0 ? p.toFixed(0) : p.toFixed(1)}%`)
                    .join(" / ")}
                  className="col-span-2"
                />
              )}
              {dist && dist.distributions.length > 0 && (
                <div className="rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface-2)] px-2.5 py-2">
                  <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-[var(--clay-text-subtle)]">
                    Outgoing Distribution
                  </div>
                  <ul className="space-y-1">
                    {dist.distributions.map((d) => (
                      <li
                        key={d.targetId}
                        className={cn(
                          "flex items-center justify-between text-[11px]",
                          !d.healthy && "opacity-50",
                        )}
                      >
                        <span className="truncate text-[var(--clay-text-muted)]">{d.label}</span>
                        <span className="shrink-0 font-mono tabular-nums text-[var(--clay-text)]">
                          {d.healthy ? `${formatRps(d.rps)} RPS` : "unhealthy"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-[10px] text-[var(--clay-text-subtle)]">
                Algorithm: <span className="font-medium text-[var(--clay-text-muted)]">{algorithmLabel(dist?.algorithm ?? algo)}</span>
                {" — "}updates live when routing settings change.
              </p>
            </div>
          )}
        </div>

        <div className="border-b border-[var(--clay-border)] px-4 py-3">
          <div className="mb-2 flex items-center gap-2">
            <Settings2 className="h-3.5 w-3.5 text-[var(--clay-text-muted)]" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--clay-text-subtle)]">
              Routing Configuration
            </span>
          </div>
          <div className="space-y-3">
            {def.configFields.map((field) => (
              <ConfigField
                key={field.key}
                field={field}
                value={node.config[field.key] ?? field.default}
                onChange={(v) => updateNodeConfig(node.id, field.key, v)}
              />
            ))}
            <p className="text-[10px] leading-relaxed text-[var(--clay-text-muted)]">
              {ALGORITHM_HINTS[algo] ?? ALGORITHM_HINTS.round_robin}
            </p>
            {algo === "weighted" || algo === "weighted_round_robin" ? (
              <p className="text-[10px] text-[var(--clay-text-subtle)]">
                Select a wire from this load balancer to a target pool and set edge weight in the connection inspector.
              </p>
            ) : null}
          </div>
        </div>

        <div className="px-4 py-3">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--clay-text-subtle)]">
            What This Represents
          </div>
          <p className="text-xs leading-relaxed text-[var(--clay-text-muted)]">{def.description}</p>
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

function MetricTile({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn(
      "rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface-2)] px-2.5 py-1.5",
      className,
    )}>
      <div className="text-[9px] font-medium uppercase tracking-wider text-[var(--clay-text-subtle)]">{label}</div>
      <div className="text-sm font-semibold tabular-nums text-[var(--clay-text)]">{value}</div>
    </div>
  );
}

function ConfigField({
  field,
  value,
  onChange,
}: {
  field: ConfigFieldDef;
  value: string | number | boolean;
  onChange: (v: string | number | boolean) => void;
}) {
  const label = field.label;
  const id = field.key;

  if (field.type === "select") {
    return (
      <div>
        <label htmlFor={id} className="text-[10px] font-medium text-[var(--clay-text-muted)]">{label}</label>
        <select
          id={id}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface-2)] px-2.5 py-1.5 text-xs focus:border-[var(--clay-primary)] focus:outline-none"
        >
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
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
        className="mt-1 w-full rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface-2)] px-2.5 py-1.5 text-xs focus:border-[var(--clay-primary)] focus:outline-none"
      />
    </div>
  );
}
