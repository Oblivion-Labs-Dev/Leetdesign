"use client";

import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { X, HelpCircle, AlertTriangle, Flame } from "lucide-react";
import { SIM_ICON_MAP, COMPONENT_REGISTRY } from "@/lib/simulator/component-registry";
import { useDesignStore } from "@/lib/simulator/store";
import { useSimulationStore } from "@/lib/simulator/store";
import type { SimComponentType, SimHealth, ArchLayer } from "@/lib/simulator/types";
import { cn } from "@/lib/utils";
import { INSTANCE_POOL_TOOLTIP, formatRps } from "@/lib/simulator/app-server-pool";

export interface SimNodeData extends Record<string, unknown> {
  label: string;
  componentType: SimComponentType;
  nodeId: string;
  highlighted?: boolean;
  dimmed?: boolean;
  traceActive?: boolean;
  connectMode?: boolean;
  runMode?: boolean;
}

const LAYER_THEME: Record<ArchLayer, { accent: string; badge: string; badgeText: string; iconBg: string; glowColor: string; borderAccent: string; text: string }> = {
  client_layer:        { accent: "#3b82f6", badge: "bg-blue-500/20", badgeText: "text-blue-300", iconBg: "bg-blue-500/15", glowColor: "rgba(59,130,246,0.15)", borderAccent: "border-blue-500/30", text: "CLIENT" },
  edge_layer:          { accent: "#14b8a6", badge: "bg-teal-500/20", badgeText: "text-teal-300", iconBg: "bg-teal-500/15", glowColor: "rgba(20,184,166,0.15)", borderAccent: "border-teal-500/30", text: "EDGE" },
  gateway_layer:       { accent: "#a78bfa", badge: "bg-violet-500/20", badgeText: "text-violet-300", iconBg: "bg-violet-500/15", glowColor: "rgba(167,139,250,0.15)", borderAccent: "border-violet-500/30", text: "GATEWAY" },
  service_layer:       { accent: "#818cf8", badge: "bg-indigo-500/20", badgeText: "text-indigo-300", iconBg: "bg-indigo-500/15", glowColor: "rgba(129,140,248,0.15)", borderAccent: "border-indigo-500/30", text: "SERVICE" },
  data_layer:          { accent: "#f59e0b", badge: "bg-amber-500/20", badgeText: "text-amber-300", iconBg: "bg-amber-500/15", glowColor: "rgba(245,158,11,0.15)", borderAccent: "border-amber-500/30", text: "DATA" },
  async_layer:         { accent: "#10b981", badge: "bg-emerald-500/20", badgeText: "text-emerald-300", iconBg: "bg-emerald-500/15", glowColor: "rgba(16,185,129,0.15)", borderAccent: "border-emerald-500/30", text: "ASYNC" },
  infra_layer:         { accent: "#94a3b8", badge: "bg-slate-500/20", badgeText: "text-slate-300", iconBg: "bg-slate-500/15", glowColor: "rgba(148,163,184,0.15)", borderAccent: "border-slate-500/30", text: "INFRA" },
  observability_layer: { accent: "#ec4899", badge: "bg-pink-500/20", badgeText: "text-pink-300", iconBg: "bg-pink-500/15", glowColor: "rgba(236,72,153,0.15)", borderAccent: "border-pink-500/30", text: "OBSERVE" },
};

const HEALTH_STYLES: Record<SimHealth, { dot: string; glow: string; borderColor: string }> = {
  healthy:  { dot: "bg-emerald-400", glow: "", borderColor: "" },
  degraded: { dot: "bg-amber-400 animate-pulse", glow: "shadow-[0_0_24px_-4px_rgba(251,191,36,0.5)]", borderColor: "!border-amber-500/50" },
  failing:  { dot: "bg-rose-400 animate-pulse", glow: "shadow-[0_0_30px_-4px_rgba(244,63,94,0.6)]", borderColor: "!border-rose-500/50" },
  down:     { dot: "bg-rose-600", glow: "shadow-[0_0_40px_-4px_rgba(220,38,38,0.7)]", borderColor: "!border-rose-600/60" },
};

function SimNodeInner({ data, selected }: NodeProps) {
  const d = data as SimNodeData;
  const def = COMPONENT_REGISTRY[d.componentType];
  const Icon = SIM_ICON_MAP[d.componentType];
  const metrics = useSimulationStore((s) => s.metrics[d.nodeId]);
  const removeNode = useDesignStore((s) => s.removeNode);
  const selectNode = useDesignStore((s) => s.selectNode);
  const [showTooltip, setShowTooltip] = useState(false);

  const highlighted = d.highlighted ?? false;
  const dimmed = d.dimmed ?? false;
  const traceActive = d.traceActive ?? false;
  const connectMode = d.connectMode ?? false;

  const health = metrics?.health ?? "healthy";
  const hs = HEALTH_STYLES[health];
  const lt = LAYER_THEME[def.layer];
  const isClient = d.componentType === "client";
  const isAppServer = d.componentType === "app_server";
  const isLoadBalancer = d.componentType === "load_balancer";
  const loadPercent = metrics
    ? Math.min(
        100,
        isAppServer && metrics.poolUtilizationPercent != null
          ? metrics.poolUtilizationPercent
          : metrics.utilizationPercent,
      )
    : 0;
  const compactFooter = isClient || isAppServer || isLoadBalancer;
  const instanceCount = metrics?.instanceCount ?? 1;
  const healthyInstanceCount = metrics?.healthyInstanceCount ?? instanceCount;
  const perInstanceRps = metrics?.perInstanceRps ?? (
    metrics && healthyInstanceCount > 0 ? metrics.currentRps / healthyInstanceCount : 0
  );
  const lbDist = metrics?.loadBalancerDistribution;

  return (
    <div
      className="group relative"
      onDoubleClick={(e) => { e.stopPropagation(); selectNode(d.nodeId); }}
    >
      {/* Health glow */}
      {health !== "healthy" && (
        <div className={cn(
          "absolute -inset-2 rounded-[20px] blur-xl transition-all",
          health === "down" ? "bg-rose-600/20 animate-pulse" :
          health === "failing" ? "bg-rose-500/15" :
          "bg-amber-400/10",
        )} />
      )}

      <div
        className={cn(
          "relative flex w-[260px] flex-col rounded-[18px] border transition-all duration-200",
          "bg-[color-mix(in_srgb,var(--clay-surface)_96%,transparent)] backdrop-blur-md",
          "border-[var(--clay-border)]",
          "hover:-translate-y-0.5 hover:shadow-[var(--clay-shadow-out)]",
          selected && "!border-[var(--clay-primary)] shadow-[0_0_0_1px_var(--clay-primary),0_12px_32px_-12px_rgba(107,140,174,0.35)]",
          highlighted && !selected && "!border-[var(--clay-primary)]/60 ring-2 ring-[var(--clay-primary)]/20",
          traceActive && "ring-2 ring-[var(--clay-primary)] shadow-[0_0_24px_-4px_rgba(107,140,174,0.45)]",
          connectMode && "ring-1 ring-[var(--clay-primary)]/15",
          dimmed && "opacity-35 grayscale-[0.3]",
          hs.borderColor,
          hs.glow,
          health === "down" && !dimmed && "opacity-70",
        )}
        style={{
          boxShadow: selected
            ? `0 0 0 1px var(--clay-primary), 0 8px 32px -8px rgba(0,0,0,0.15)`
            : health === "healthy"
              ? `var(--clay-shadow-out), inset 0 1px 0 ${lt.glowColor}`
              : undefined,
        }}
      >
        {/* Connection handles */}
        <Handle
          type="target"
          position={Position.Left}
          className={cn(
            "!rounded-full !border-[1.5px] !border-[var(--clay-border-strong)] !bg-[var(--clay-surface)] !transition-all hover:!border-[var(--clay-primary)] hover:!bg-[var(--clay-primary)]/20",
            connectMode
              ? "!-left-[7px] !h-[14px] !w-[14px] !border-[var(--clay-primary)]/50 !shadow-[0_0_0_3px_color-mix(in_srgb,var(--clay-primary)_12%,transparent)]"
              : "!-left-[5px] !h-[10px] !w-[10px]",
          )}
        />
        <Handle
          type="source"
          position={Position.Right}
          className={cn(
            "!rounded-full !border-[1.5px] !border-[var(--clay-border-strong)] !bg-[var(--clay-surface)] !transition-all hover:!border-[var(--clay-primary)] hover:!bg-[var(--clay-primary)]/20",
            connectMode
              ? "!-right-[7px] !h-[14px] !w-[14px] !border-[var(--clay-primary)]/50 !shadow-[0_0_0_3px_color-mix(in_srgb,var(--clay-primary)_12%,transparent)]"
              : "!-right-[5px] !h-[10px] !w-[10px]",
          )}
        />

        {/* Top accent line */}
        <div
          className="absolute left-3 right-3 top-0 h-[2px] rounded-b-full opacity-60"
          style={{ background: lt.accent }}
        />

        {/* Delete button */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); removeNode(d.nodeId); }}
          className="absolute -right-2 -top-2 z-10 hidden h-5 w-5 place-items-center rounded-full bg-[var(--clay-surface)] border border-[var(--clay-border)] text-[var(--clay-text-subtle)] shadow-lg transition-all hover:text-rose-400 hover:border-rose-400/50 group-hover:grid"
        >
          <X className="h-2.5 w-2.5" />
        </button>

        <div className="p-3 pb-2.5">
          {/* Layer badge + help */}
          <div className="mb-2.5 flex items-center justify-between">
            <span className={cn("rounded px-1.5 py-[2px] text-[7px] font-bold uppercase tracking-[0.2em]", lt.badge, lt.badgeText)}>
              {isAppServer ? "COMPUTE" : lt.text}
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowTooltip(!showTooltip); }}
              className="grid h-4 w-4 place-items-center rounded text-[var(--clay-text-subtle)] transition-colors hover:text-[var(--clay-text)]"
            >
              <HelpCircle className="h-3 w-3" />
            </button>
          </div>

          {/* Icon + Label */}
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "relative grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                lt.iconBg,
                health === "down" && "grayscale opacity-50",
              )}
            >
              <Icon className="h-5 w-5" style={{ color: lt.accent }} />
              {health === "down" && (
                <div className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-rose-600 shadow-sm">
                  <X className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                </div>
              )}
              {health === "failing" && (
                <div className="absolute -right-1 -top-1 animate-bounce">
                  <Flame className="h-3.5 w-3.5 text-rose-400 drop-shadow-[0_0_4px_rgba(244,63,94,0.8)]" />
                </div>
              )}
              {health === "degraded" && (
                <div className="absolute -right-1 -top-1 animate-pulse">
                  <AlertTriangle className="h-3 w-3 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.8)]" />
                </div>
              )}
              {isAppServer && instanceCount > 1 && (
                <div
                  className="absolute -bottom-1.5 -right-1.5 rounded-md border border-[var(--clay-border)] bg-[var(--clay-surface)] px-1 py-px text-[7px] font-bold tabular-nums text-[var(--clay-text-muted)] shadow-sm"
                  title={INSTANCE_POOL_TOOLTIP}
                >
                  ×{instanceCount}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-semibold leading-tight text-[var(--clay-text)]">
                {d.label}
              </div>
              <div className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-[var(--clay-text-muted)]">
                {isClient
                  ? "Browsers, mobile apps, or integrations sending requests into your system."
                  : isAppServer
                    ? def.description
                    : def.explain}
              </div>
            </div>
          </div>
        </div>

        {/* Metrics footer */}
        <div className="border-t border-[var(--clay-border)] px-3 py-2">
          {metrics && (metrics.currentRps > 0 || isClient || isAppServer || isLoadBalancer) ? (
            <div className="space-y-1.5">
              {!compactFooter && (
                <div className="h-[3px] w-full overflow-hidden rounded-full bg-[var(--clay-surface-2)]">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      loadPercent < 60 ? "bg-emerald-500" :
                      loadPercent < 85 ? "bg-amber-500" : "bg-rose-500",
                    )}
                    style={{ width: `${loadPercent}%` }}
                  />
                </div>
              )}
              {isAppServer ? (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 text-[9px] text-[var(--clay-text-muted)]">
                    <span className={cn("h-[5px] w-[5px] rounded-full", hs.dot)} />
                    <span className="font-medium">{formatRps(metrics.currentRps)} RPS total</span>
                  </div>
                  <div className="text-[8px] font-mono leading-snug text-[var(--clay-text-subtle)]">
                    P95 {metrics.p95LatencyMs} ms ·{" "}
                    <span title={INSTANCE_POOL_TOOLTIP}>
                      {healthyInstanceCount}/{instanceCount} healthy
                    </span>
                    {" · "}
                    {formatRps(perInstanceRps, 1)} RPS/instance
                  </div>
                </div>
              ) : isLoadBalancer && lbDist ? (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 text-[9px] text-[var(--clay-text-muted)]">
                    <span className={cn("h-[5px] w-[5px] rounded-full", hs.dot)} />
                    <span className="font-medium">{formatRps(lbDist.incomingRps)} RPS incoming</span>
                  </div>
                  <div className="text-[8px] font-mono leading-snug text-[var(--clay-text-subtle)]">
                    {lbDist.healthyTargetPools} pool{lbDist.healthyTargetPools === 1 ? "" : "s"}
                    {lbDist.distributions.filter((d) => d.healthy).length > 0 && (
                      <>
                        {" · "}
                        {lbDist.distributions
                          .filter((d) => d.healthy)
                          .map((d) => `${d.percent % 1 === 0 ? d.percent.toFixed(0) : d.percent.toFixed(1)}%`)
                          .join(" / ")}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className={cn(
                  "flex items-center text-[9px]",
                  compactFooter ? "justify-between gap-2" : "justify-between",
                )}>
                  <span className="flex shrink-0 items-center gap-1 text-[var(--clay-text-muted)]">
                    <span className={cn("h-[5px] w-[5px] rounded-full", hs.dot)} />
                    {compactFooter
                      ? `${metrics.currentRps} rps`
                      : health === "down"
                        ? "DOWN"
                        : health === "failing"
                          ? "FAILING"
                          : `${metrics.currentRps} rps`}
                  </span>
                  <span className="shrink-0 font-mono text-[var(--clay-text-subtle)]">
                    {compactFooter ? `P95 ${metrics.p95LatencyMs}ms` : `${metrics.avgLatencyMs}ms`}
                  </span>
                  {!compactFooter && metrics.errorRate > 0 && (
                    <span className="font-mono font-semibold text-rose-500">
                      {(metrics.errorRate * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[9px] text-[var(--clay-text-subtle)]">
              <span className="h-[5px] w-[5px] rounded-full bg-[var(--clay-text-subtle)]/40" />
              {metrics && health !== "healthy" ? "starved" : "idle"}
            </div>
          )}
        </div>

        {/* On-card diagnosis removed — details live in the inspector panel */}
      </div>

      {/* Educational tooltip */}
      {showTooltip && (
        <div
          className="absolute left-0 top-[calc(100%+12px)] z-50 w-[280px] rounded-xl border border-[var(--clay-border)] bg-[var(--clay-surface)] p-4 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" style={{ color: lt.accent }} />
              <span className="text-sm font-bold text-[var(--clay-text)]">{def.label}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowTooltip(false)}
              className="text-[var(--clay-text-subtle)] hover:text-[var(--clay-text)]"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          <p className="text-xs leading-relaxed text-[var(--clay-text-muted)]">
            {def.explain}
          </p>

          <div className="mt-3 rounded-lg bg-[var(--clay-surface-2)] p-2.5 border border-[var(--clay-border)]">
            <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
              Real-world analogy
            </div>
            <p className="mt-1 text-[11px] italic leading-relaxed text-[var(--clay-text-muted)]">
              &quot;{def.analogy}&quot;
            </p>
          </div>

          <div className="mt-2">
            <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">When to use</div>
            <p className="mt-0.5 text-[11px] text-[var(--clay-text-muted)]">{def.whenToUse}</p>
          </div>

          {def.tradeoffs.length > 0 && (
            <div className="mt-2">
              <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">Trade-offs</div>
              <ul className="mt-0.5 space-y-0.5">
                {def.tradeoffs.map((t, i) => (
                  <li key={i} className="text-[11px] text-[var(--clay-text-muted)]">• {t}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const SimNode = memo(SimNodeInner);
