"use client";

import { useState } from "react";
import { X, Trash2, BookOpen, TrendingUp, ChevronDown, ChevronRight, Lightbulb, Wrench, ShieldAlert } from "lucide-react";
import { useDesignStore } from "@/lib/simulator/store";
import { useSimulationStore } from "@/lib/simulator/store";
import { COMPONENT_REGISTRY, SIM_ICON_MAP } from "@/lib/simulator/component-registry";
import type { ConfigFieldDef, SimHealth, ArchLayer } from "@/lib/simulator/types";
import { cn } from "@/lib/utils";

const HEALTH_COLORS: Record<SimHealth, string> = {
  healthy: "text-emerald-400",
  degraded: "text-amber-400",
  failing: "text-rose-400",
  down: "text-rose-500",
};

const HEALTH_BG: Record<SimHealth, string> = {
  healthy: "bg-emerald-500/10 border-emerald-500/20",
  degraded: "bg-amber-500/10 border-amber-500/20",
  failing: "bg-rose-400/10 border-rose-400/20",
  down: "bg-rose-600/10 border-rose-600/20",
};

const LAYER_BADGE: Record<ArchLayer, string> = {
  client_layer:        "bg-blue-500/20 text-blue-300",
  edge_layer:          "bg-teal-500/20 text-teal-300",
  gateway_layer:       "bg-violet-500/20 text-violet-300",
  service_layer:       "bg-indigo-500/20 text-indigo-300",
  data_layer:          "bg-amber-500/20 text-amber-300",
  async_layer:         "bg-emerald-500/20 text-emerald-300",
  infra_layer:         "bg-slate-500/20 text-slate-300",
  observability_layer: "bg-pink-500/20 text-pink-300",
};

const LAYER_NAMES: Record<ArchLayer, string> = {
  client_layer: "Client Layer",
  edge_layer: "Edge / CDN Layer",
  gateway_layer: "Gateway Layer",
  service_layer: "Service Layer",
  data_layer: "Data Layer",
  async_layer: "Async / Messaging Layer",
  infra_layer: "Infrastructure Layer",
  observability_layer: "Observability Layer",
};

export function ConfigInspector({ embedded = false }: { embedded?: boolean }) {
  const selectedNodeId = useDesignStore((s) => s.selectedNodeId);
  const design = useDesignStore((s) => s.design);
  const clearSelection = useDesignStore((s) => s.clearSelection);
  const updateNodeConfig = useDesignStore((s) => s.updateNodeConfig);
  const updateNodeLabel = useDesignStore((s) => s.updateNodeLabel);
  const removeNode = useDesignStore((s) => s.removeNode);
  const metrics = useSimulationStore((s) =>
    selectedNodeId ? s.metrics[selectedNodeId] : undefined,
  );
  const [showLearn, setShowLearn] = useState(true);
  const [showConfig, setShowConfig] = useState(true);

  if (!selectedNodeId || !design) return null;

  const node = design.nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  const def = COMPONENT_REGISTRY[node.type];
  const Icon = SIM_ICON_MAP[node.type];
  const health = metrics?.health ?? "healthy";

  return (
    <div className={cn(
      "flex h-full flex-col",
      !embedded && "w-[300px] shrink-0 border-l border-[var(--clay-border)] bg-[var(--clay-surface)]/95 backdrop-blur-md lg:w-[320px]",
    )}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--clay-border)] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[color-mix(in_srgb,var(--clay-primary)_25%,transparent)] to-[color-mix(in_srgb,var(--clay-sky)_25%,transparent)]">
            <Icon className="h-4.5 w-4.5 text-[var(--clay-primary)]" />
          </div>
          <div>
            <div className="text-sm font-bold text-[var(--clay-text)]">
              {def.label}
            </div>
            <span className={cn("rounded-full border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider", LAYER_BADGE[def.layer])}>
              {LAYER_NAMES[def.layer]}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={clearSelection}
          className="grid h-7 w-7 place-items-center rounded-lg text-[var(--clay-text-subtle)] hover:bg-[var(--clay-surface-2)] hover:text-[var(--clay-text)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Label */}
        <div className="border-b border-[var(--clay-border)] px-4 py-3">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--clay-text-subtle)]">
            Component Name
          </label>
          <input
            value={node.label}
            onChange={(e) => updateNodeLabel(node.id, e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface-2)] px-3 py-1.5 text-sm text-[var(--clay-text)] focus:border-[var(--clay-primary)] focus:outline-none"
          />
        </div>

        {/* Learn section — educational */}
        <div className="border-b border-[var(--clay-border)]">
          <button
            type="button"
            onClick={() => setShowLearn(!showLearn)}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-[var(--clay-surface-2)]/50"
          >
            <BookOpen className="h-3.5 w-3.5 text-[var(--clay-primary)]" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--clay-text-muted)]">
              What is this?
            </span>
            {showLearn ? <ChevronDown className="ml-auto h-3 w-3 text-[var(--clay-text-subtle)]" /> : <ChevronRight className="ml-auto h-3 w-3 text-[var(--clay-text-subtle)]" />}
          </button>
          {showLearn && (
            <div className="px-4 pb-3">
              <p className="text-xs leading-relaxed text-[var(--clay-text-muted)]">
                {def.explain}
              </p>

              <div className="mt-2.5 rounded-lg bg-[var(--clay-surface-2)] p-2.5">
                <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
                  <Lightbulb className="h-3 w-3" /> Think of it like...
                </div>
                <p className="mt-1 text-[11px] italic leading-relaxed text-[var(--clay-text-muted)]">
                  &quot;{def.analogy}&quot;
                </p>
              </div>

              <div className="mt-2">
                <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
                  When to use
                </div>
                <p className="mt-0.5 text-[11px] text-[var(--clay-text-muted)]">{def.whenToUse}</p>
              </div>

              {def.tradeoffs.length > 0 && (
                <div className="mt-2">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
                    Trade-offs to know
                  </div>
                  <ul className="mt-0.5 space-y-0.5">
                    {def.tradeoffs.map((t, i) => (
                      <li key={i} className="text-[11px] text-[var(--clay-text-muted)]">
                        <span className="mr-1 text-amber-500">⚡</span>{t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Diagnosis — shown when unhealthy */}
        {metrics && health !== "healthy" && metrics.diagnosisReason && (
          <div className={cn(
            "border-b px-4 py-3",
            health === "down" ? "border-rose-300/30 bg-rose-500/5" :
            health === "failing" ? "border-rose-200/30 bg-rose-500/3" :
            "border-amber-300/30 bg-amber-500/5",
          )}>
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className={cn("h-4 w-4", HEALTH_COLORS[health])} />
              <span className={cn("text-[10px] font-bold uppercase tracking-wider", HEALTH_COLORS[health])}>
                Diagnosis
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-[var(--clay-text-muted)]">
              {metrics.diagnosisReason}
            </p>
            <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-[var(--clay-surface-2)] p-2">
              <Wrench className="mt-0.5 h-3 w-3 shrink-0 text-[var(--clay-primary)]" />
              <p className="text-[11px] font-medium leading-relaxed text-[var(--clay-text)]">
                {metrics.diagnosisSuggestion}
              </p>
            </div>
          </div>
        )}

        {/* Live Metrics */}
        {metrics && (
          <div className="border-b border-[var(--clay-border)] px-4 py-3">
            <div className="mb-2 flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-[var(--clay-text-muted)]" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--clay-text-subtle)]">
                Live Metrics
              </span>
              <span className={cn(
                "ml-auto rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase",
                HEALTH_BG[health],
                HEALTH_COLORS[health],
              )}>
                {health}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <MetricTile label="RPS" value={`${metrics.currentRps}`} />
              <MetricTile label="Latency" value={`${metrics.avgLatencyMs}ms`} />
              <MetricTile label="P95" value={`${metrics.p95LatencyMs}ms`} />
              <MetricTile label="Error Rate" value={`${(metrics.errorRate * 100).toFixed(1)}%`} warn={metrics.errorRate > 0.05} />
              <MetricTile label="Queue" value={`${metrics.queueDepth}`} warn={metrics.queueDepth > 100} />
              <MetricTile label="CPU" value={`${metrics.cpuPercent}%`} warn={metrics.cpuPercent > 80} />
            </div>
          </div>
        )}

        {/* Config Fields */}
        <div className="border-b border-[var(--clay-border)]">
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-[var(--clay-surface-2)]/50"
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--clay-text-subtle)]">
              Configuration
            </span>
            {showConfig ? <ChevronDown className="ml-auto h-3 w-3 text-[var(--clay-text-subtle)]" /> : <ChevronRight className="ml-auto h-3 w-3 text-[var(--clay-text-subtle)]" />}
          </button>
          {showConfig && (
            <div className="px-4 pb-3 space-y-3">
              {def.configFields.map((field) => (
                <ConfigField
                  key={field.key}
                  field={field}
                  value={node.config[field.key] ?? field.default}
                  onChange={(v) => updateNodeConfig(node.id, field.key, v)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="px-4 py-3">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--clay-text-subtle)]">
            Technical Summary
          </div>
          <p className="text-xs text-[var(--clay-text-muted)]">{def.description}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--clay-border)] px-4 py-3">
        <button
          type="button"
          onClick={() => {
            removeNode(node.id);
            clearSelection();
          }}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-rose-300/30 bg-rose-500/8 px-3 py-2 text-xs font-medium text-rose-500 transition-colors hover:bg-rose-500/15"
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
  warn,
}: {
  label: string;
  value: string;
  className?: string;
  warn?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-lg border px-2.5 py-1.5",
      warn
        ? "border-amber-400/30 bg-amber-500/5"
        : "border-[var(--clay-border)] bg-[var(--clay-surface-2)]",
    )}>
      <div className="text-[9px] font-medium uppercase tracking-wider text-[var(--clay-text-subtle)]">
        {label}
      </div>
      <div className={cn(
        "text-sm font-semibold tabular-nums",
        warn ? "text-amber-500" : "text-[var(--clay-text)]",
        className,
      )}>
        {value}
      </div>
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
  if (field.type === "boolean") {
    return (
      <label className="flex items-center justify-between">
        <span className="text-xs text-[var(--clay-text)]">{field.label}</span>
        <button
          type="button"
          role="switch"
          aria-checked={value as boolean}
          onClick={() => onChange(!value)}
          className={cn(
            "relative h-5 w-9 rounded-full transition-colors",
            value ? "bg-[var(--clay-primary)]" : "bg-[var(--clay-border-strong)]",
          )}
        >
          <span
            className={cn(
              "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
              value ? "translate-x-4" : "translate-x-0",
            )}
          />
        </button>
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <div>
        <label className="text-xs text-[var(--clay-text)]">{field.label}</label>
        <select
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface-2)] px-2.5 py-1.5 text-xs text-[var(--clay-text)] focus:border-[var(--clay-primary)] focus:outline-none"
        >
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="text-xs text-[var(--clay-text)]">{field.label}</label>
        {field.unit && (
          <span className="text-[9px] text-[var(--clay-text-subtle)]">{field.unit}</span>
        )}
      </div>
      <input
        type="number"
        value={value as number}
        min={field.min}
        max={field.max}
        step={field.step ?? 1}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface-2)] px-2.5 py-1.5 text-xs tabular-nums text-[var(--clay-text)] focus:border-[var(--clay-primary)] focus:outline-none"
      />
    </div>
  );
}
