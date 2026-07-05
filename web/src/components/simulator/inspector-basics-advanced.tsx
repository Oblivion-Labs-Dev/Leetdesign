"use client";

import { useState, useEffect } from "react";
import { Wrench, Sparkles, CheckCircle2, AlertTriangle, Lightbulb } from "lucide-react";
import type { SimNode, SimDesign, RuntimeMetrics } from "@/lib/simulator/types";
import {
  type InspectorViewMode,
  type ComponentBasicsSnapshot,
  getComponentBasics,
  applyComponentFix,
  getDatabaseBasics,
  applyDatabaseFix,
  getAppServerBasics,
  applyAppServerFix,
  getLoadBalancerBasics,
  applyLoadBalancerFix,
  getClientBasics,
  applyClientFix,
  getGenericBasics,
} from "@/lib/simulator/component-basics";
import { cn } from "@/lib/utils";
import { InspectorSection, InspectorSubCard } from "./inspector-panel";

export function useInspectorViewMode(defaultMode: InspectorViewMode = "basics") {
  const [mode, setMode] = useState<InspectorViewMode>(defaultMode);
  return { mode, setMode };
}

export function InspectorViewModeTabs({
  mode,
  onChange,
}: {
  mode: InspectorViewMode;
  onChange: (mode: InspectorViewMode) => void;
}) {
  return (
    <div className="flex rounded-xl border border-[var(--clay-border)] bg-[var(--clay-surface-2)]/60 p-0.5">
      <button
        type="button"
        onClick={() => onChange("basics")}
        className={cn(
          "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-semibold transition-colors",
          mode === "basics"
            ? "bg-[var(--clay-surface)] text-[var(--clay-text)] shadow-sm"
            : "text-[var(--clay-text-subtle)] hover:text-[var(--clay-text-muted)]",
        )}
      >
        <Wrench className="h-3.5 w-3.5" />
        Basics
      </button>
      <button
        type="button"
        onClick={() => onChange("advanced")}
        className={cn(
          "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-semibold transition-colors",
          mode === "advanced"
            ? "bg-[var(--clay-surface)] text-[var(--clay-text)] shadow-sm"
            : "text-[var(--clay-text-subtle)] hover:text-[var(--clay-text-muted)]",
        )}
      >
        <Sparkles className="h-3.5 w-3.5" />
        Advanced
      </button>
    </div>
  );
}

const STATUS_STYLES = {
  healthy: {
    border: "border-emerald-400/30",
    bg: "bg-emerald-500/8",
    icon: CheckCircle2,
    iconClass: "text-emerald-600",
    title: "text-emerald-800",
  },
  watch: {
    border: "border-amber-400/30",
    bg: "bg-amber-500/8",
    icon: AlertTriangle,
    iconClass: "text-amber-600",
    title: "text-amber-800",
  },
  problem: {
    border: "border-rose-400/30",
    bg: "bg-rose-500/8",
    icon: AlertTriangle,
    iconClass: "text-rose-600",
    title: "text-rose-700",
  },
  idle: {
    border: "border-[var(--clay-border)]",
    bg: "bg-[var(--clay-surface)]/80",
    icon: Lightbulb,
    iconClass: "text-[var(--clay-text-subtle)]",
    title: "text-[var(--clay-text-muted)]",
  },
} as const;

function resolveBasics(
  node: SimNode,
  design: SimDesign,
  metrics: RuntimeMetrics | undefined,
): ComponentBasicsSnapshot {
  switch (node.type) {
    case "sql_database":
    case "nosql_database":
    case "search_index":
    case "redis_cache":
      return getDatabaseBasics(node, design, metrics, () => {});
    case "app_server":
      return getAppServerBasics(node, metrics);
    case "load_balancer":
      return getLoadBalancerBasics(metrics);
    case "client":
      return getClientBasics(metrics);
    default:
      return getGenericBasics(node, metrics);
  }
}

function runFix(
  fixId: string,
  node: SimNode,
  design: SimDesign,
  mergeNodeConfig: (id: string, patch: Record<string, string | number | boolean>) => void,
  updateNodeConfig: (id: string, key: string, value: string | number | boolean) => void,
  onSwitchAdvanced?: () => void,
): void {
  if (fixId === "generic-scale" || fixId === "hint-db-bottleneck") {
    onSwitchAdvanced?.();
    return;
  }

  switch (node.type) {
    case "sql_database":
    case "nosql_database":
    case "search_index":
    case "redis_cache":
      applyDatabaseFix(fixId, node, design, mergeNodeConfig);
      break;
    case "app_server":
      applyAppServerFix(fixId, node, mergeNodeConfig);
      break;
    case "load_balancer":
      applyLoadBalancerFix(fixId, node, updateNodeConfig);
      break;
    case "client":
      applyClientFix(fixId, node, mergeNodeConfig);
      break;
    default:
      applyComponentFix(fixId, node, design, { mergeNodeConfig, updateNodeConfig });
  }
}

export function InspectorBasicsPanel({
  node,
  design,
  metrics,
  mergeNodeConfig,
  updateNodeConfig,
  onSwitchAdvanced,
  children,
}: {
  node: SimNode;
  design: SimDesign;
  metrics?: RuntimeMetrics;
  mergeNodeConfig: (id: string, patch: Record<string, string | number | boolean>) => void;
  updateNodeConfig: (id: string, key: string, value: string | number | boolean) => void;
  onSwitchAdvanced?: () => void;
  /** Component-specific simplified controls (sliders, etc.) */
  children?: React.ReactNode;
}) {
  const basics = resolveBasics(node, design, metrics);
  const style = STATUS_STYLES[basics.statusLabel];
  const StatusIcon = style.icon;

  return (
    <div className="space-y-3">
      <div className={cn("rounded-xl border px-3 py-2.5", style.border, style.bg)}>
        <div className="flex items-start gap-2">
          <StatusIcon className={cn("mt-0.5 h-4 w-4 shrink-0", style.iconClass)} />
          <div className="min-w-0">
            <div className={cn("text-xs font-semibold", style.title)}>{basics.headline}</div>
            <p className="mt-1 text-[10px] leading-relaxed text-[var(--clay-text-muted)]">{basics.detail}</p>
          </div>
        </div>
      </div>

      {children}

      {basics.fixes.length > 0 && (
        <InspectorSection title="Quick fixes" subtitle="One-click changes for common overload problems.">
          <div className="space-y-2">
            {basics.fixes.map((fix) => (
              <div
                key={fix.id}
                className="rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface)]/80 px-2.5 py-2"
              >
                <div className="text-[11px] font-medium text-[var(--clay-text)]">{fix.label}</div>
                <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--clay-text-muted)]">
                  {fix.description}
                </p>
                <button
                  type="button"
                  onClick={() => runFix(fix.id, node, design, mergeNodeConfig, updateNodeConfig, onSwitchAdvanced)}
                  className="mt-2 w-full rounded-lg border border-[var(--clay-primary)]/30 bg-[color-mix(in_srgb,var(--clay-primary)_12%,transparent)] px-2 py-1.5 text-[10px] font-semibold text-[var(--clay-primary)] hover:bg-[color-mix(in_srgb,var(--clay-primary)_18%,transparent)]"
                >
                  {fix.applyLabel}
                </button>
              </div>
            ))}
          </div>
        </InspectorSection>
      )}

      {basics.fixes.length === 0 && basics.statusLabel === "problem" && (
        <InspectorSubCard title="What to try">
          <p className="text-[10px] leading-relaxed text-[var(--clay-text-muted)]">
            Fix unhealthy components upstream first, then return here. Open{" "}
            <button type="button" onClick={onSwitchAdvanced} className="font-medium text-[var(--clay-primary)] underline">
              Advanced
            </button>{" "}
            for detailed tuning.
          </p>
        </InspectorSubCard>
      )}

      {basics.tips.length > 0 && (
        <InspectorSubCard title={basics.statusLabel === "problem" ? "Also consider" : "Tips"}>
          <ul className="space-y-1">
            {basics.tips.map((tip, i) => (
              <li key={i} className="flex gap-1.5 text-[10px] leading-relaxed text-[var(--clay-text-muted)]">
                <span className="text-amber-500">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </InspectorSubCard>
      )}
    </div>
  );
}

/** Reset to Basics tab when selecting a different node */
export function useInspectorViewModeForNode(
  selectedNodeId: string | null,
  defaultMode: InspectorViewMode = "basics",
) {
  const { mode, setMode } = useInspectorViewMode(defaultMode);
  useEffect(() => {
    setMode(defaultMode);
  }, [selectedNodeId, defaultMode, setMode]);
  return { mode, setMode };
}
