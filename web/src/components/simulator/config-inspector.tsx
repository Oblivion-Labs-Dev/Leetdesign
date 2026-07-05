"use client";

import { useState } from "react";
import { TrendingUp, Wrench, ShieldAlert } from "lucide-react";
import { useDesignStore } from "@/lib/simulator/store";
import { useSimulationStore } from "@/lib/simulator/store";
import { COMPONENT_REGISTRY, SIM_ICON_MAP } from "@/lib/simulator/component-registry";
import type { ConfigFieldDef, SimHealth, ArchLayer } from "@/lib/simulator/types";
import { cn } from "@/lib/utils";
import { ClientConfigInspector } from "./client-config-inspector";
import { ApplicationServerConfigInspector } from "./application-server-config-inspector";
import { LoadBalancerConfigInspector } from "./load-balancer-config-inspector";
import { DatabaseConfigInspector } from "./database-config-inspector";
import { isDatabaseSimNode } from "@/lib/simulator/database-model";
import {
  InspectorPanel,
  InspectorHeader,
  InspectorScrollBody,
  InspectorSection,
  InspectorSubCard,
  InspectorCollapsible,
  InspectorNameField,
  InspectorRemoveFooter,
} from "./inspector-panel";
import {
  InspectorViewModeTabs,
  InspectorBasicsPanel,
  useInspectorViewModeForNode,
} from "./inspector-basics-advanced";

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
  const mergeNodeConfig = useDesignStore((s) => s.mergeNodeConfig);
  const updateNodeConfig = useDesignStore((s) => s.updateNodeConfig);
  const updateNodeLabel = useDesignStore((s) => s.updateNodeLabel);
  const removeNode = useDesignStore((s) => s.removeNode);
  const metrics = useSimulationStore((s) =>
    selectedNodeId ? s.metrics[selectedNodeId] : undefined,
  );
  const [showLearn, setShowLearn] = useState(true);
  const [showConfig, setShowConfig] = useState(true);
  const { mode, setMode } = useInspectorViewModeForNode(selectedNodeId);

  if (!selectedNodeId || !design) return null;

  const node = design.nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  if (node.type === "client") {
    return <ClientConfigInspector embedded={embedded} />;
  }

  if (node.type === "app_server") {
    return <ApplicationServerConfigInspector embedded={embedded} />;
  }

  if (node.type === "load_balancer") {
    return <LoadBalancerConfigInspector embedded={embedded} />;
  }

  if (isDatabaseSimNode(node.type)) {
    return <DatabaseConfigInspector embedded={embedded} />;
  }

  const def = COMPONENT_REGISTRY[node.type];
  const Icon = SIM_ICON_MAP[node.type];
  const health = metrics?.health ?? "healthy";
  const basicsConfigFields = def.configFields.slice(0, 3);

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
        icon={Icon}
        iconClassName="bg-gradient-to-br from-[color-mix(in_srgb,var(--clay-primary)_25%,transparent)] to-[color-mix(in_srgb,var(--clay-sky)_25%,transparent)] text-[var(--clay-primary)]"
        title={def.label}
        badge={LAYER_NAMES[def.layer]}
        badgeClassName={cn("border-transparent", LAYER_BADGE[def.layer])}
        onClose={clearSelection}
      />

      <InspectorScrollBody>
        <InspectorNameField value={node.label} onChange={(v) => updateNodeLabel(node.id, v)} />
        <InspectorViewModeTabs mode={mode} onChange={setMode} />

        {mode === "basics" ? (
          <>
            {metrics && (
              <InspectorSection
                icon={TrendingUp}
                title="Live Metrics"
                subtitle="Real-time simulation output for this component."
                trailing={
                  <span className={cn(
                    "rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase",
                    HEALTH_BG[health],
                    HEALTH_COLORS[health],
                  )}>
                    {health}
                  </span>
                }
              >
                <div className="grid grid-cols-2 gap-2">
                  <MetricTile label="RPS" value={`${metrics.currentRps}`} />
                  <MetricTile label="Latency" value={`${metrics.avgLatencyMs}ms`} />
                  <MetricTile label="P95" value={`${metrics.p95LatencyMs}ms`} />
                  <MetricTile label="Error Rate" value={`${(metrics.errorRate * 100).toFixed(1)}%`} warn={metrics.errorRate > 0.05} />
                  <MetricTile label="Load" value={`${metrics.utilizationPercent}%`} warn={metrics.utilizationPercent > 80} />
                </div>
              </InspectorSection>
            )}

            <InspectorBasicsPanel
              node={node}
              design={design}
              metrics={metrics}
              mergeNodeConfig={mergeNodeConfig}
              updateNodeConfig={updateNodeConfig}
              onSwitchAdvanced={() => setMode("advanced")}
            />

            {basicsConfigFields.length > 0 && (
              <InspectorSection icon={Wrench} title="Quick settings" subtitle="Most common capacity knobs for this component.">
                <div className="space-y-3">
                  {basicsConfigFields.map((field) => (
                    <ConfigField
                      key={field.key}
                      field={field}
                      value={node.config[field.key] ?? field.default}
                      onChange={(v) => updateNodeConfig(node.id, field.key, v)}
                    />
                  ))}
                </div>
              </InspectorSection>
            )}
          </>
        ) : (
          <>
        <InspectorCollapsible
          title="What is this?"
          open={showLearn}
          onToggle={() => setShowLearn(!showLearn)}
        >
          <p className="text-xs leading-relaxed text-[var(--clay-text-muted)]">
            {def.explain}
          </p>
          <InspectorSubCard title="Think of it like...">
            <p className="text-[11px] italic leading-relaxed text-[var(--clay-text-muted)]">
              &quot;{def.analogy}&quot;
            </p>
          </InspectorSubCard>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
              When to use
            </div>
            <p className="mt-0.5 text-[11px] text-[var(--clay-text-muted)]">{def.whenToUse}</p>
          </div>
          {def.tradeoffs.length > 0 && (
            <div>
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
        </InspectorCollapsible>

        {metrics && (
          <InspectorSection
            icon={TrendingUp}
            title="Live Metrics"
            subtitle="Real-time simulation output for this component."
            trailing={
              <span className={cn(
                "rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase",
                HEALTH_BG[health],
                HEALTH_COLORS[health],
              )}>
                {health}
              </span>
            }
          >
            <div className="grid grid-cols-2 gap-2">
              <MetricTile label="RPS" value={`${metrics.currentRps}`} />
              <MetricTile label="Latency" value={`${metrics.avgLatencyMs}ms`} />
              <MetricTile label="P95" value={`${metrics.p95LatencyMs}ms`} />
              <MetricTile label="Error Rate" value={`${(metrics.errorRate * 100).toFixed(1)}%`} warn={metrics.errorRate > 0.05} />
              <MetricTile label="Queue" value={`${metrics.queueDepth}`} warn={metrics.queueDepth > 100} />
              <MetricTile label="Load" value={`${metrics.utilizationPercent}%`} warn={metrics.utilizationPercent > 80} />
              <MetricTile label="Connections" value={`${metrics.activeConnections}`} />
            </div>
          </InspectorSection>
        )}

        <InspectorCollapsible
          title="Configuration"
          open={showConfig}
          onToggle={() => setShowConfig(!showConfig)}
        >
          <div className="space-y-3">
            {def.configFields.map((field) => (
              <ConfigField
                key={field.key}
                field={field}
                value={node.config[field.key] ?? field.default}
                onChange={(v) => updateNodeConfig(node.id, field.key, v)}
              />
            ))}
          </div>
        </InspectorCollapsible>

        <InspectorSection title="Technical Summary">
          <p className="text-xs text-[var(--clay-text-muted)]">{def.description}</p>
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
