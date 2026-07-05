"use client";

import { useMemo, useState } from "react";
import {
  X,
  Trash2,
  ChevronDown,
  ChevronRight,
  Users,
  TrendingUp,
  Lightbulb,
  UtensilsCrossed,
} from "lucide-react";
import {
  InspectorViewModeTabs,
  InspectorBasicsPanel,
  useInspectorViewModeForNode,
} from "./inspector-basics-advanced";
import { useDesignStore, useSimulationStore } from "@/lib/simulator/store";
import { SIM_ICON_MAP } from "@/lib/simulator/component-registry";
import {
  parseClientConfig,
  clientConfigToStorage,
  calculateBaseRps,
  formatCount,
  formatRps,
  formatRate,
  getActivityLabel,
  USER_ACTIVITY_RATES,
  DEFAULT_CLIENT_TRAFFIC,
  type ClientTrafficConfig,
  type UserActivityPreset,
  type TrafficPattern,
  type RetryStrategy,
} from "@/lib/simulator/client-traffic";
import { computeClientInsight } from "@/lib/simulator/client-insights";
import type { SimHealth } from "@/lib/simulator/types";
import { cn } from "@/lib/utils";

const HEALTH_COLORS: Record<SimHealth, string> = {
  healthy: "text-emerald-600",
  degraded: "text-amber-600",
  failing: "text-rose-500",
  down: "text-rose-600",
};

const HEALTH_BG: Record<SimHealth, string> = {
  healthy: "bg-emerald-500/10 border-emerald-500/25 text-emerald-700",
  degraded: "bg-amber-500/10 border-amber-500/25 text-amber-700",
  failing: "bg-rose-500/10 border-rose-500/25 text-rose-600",
  down: "bg-rose-600/10 border-rose-600/25 text-rose-700",
};

const ACTIVITY_PRESETS: { id: UserActivityPreset; rate: number }[] = [
  { id: "browsing", rate: 0.2 },
  { id: "normal", rate: 0.5 },
  { id: "highly_active", rate: 1 },
  { id: "power", rate: 2 },
];

const PATTERN_OPTIONS: { value: TrafficPattern; label: string }[] = [
  { value: "constant", label: "Constant" },
  { value: "ramp", label: "Ramp up" },
  { value: "burst", label: "Burst" },
  { value: "dailyPeak", label: "Daily peak" },
  { value: "flashSale", label: "Flash sale" },
];

export function ClientConfigInspector({ embedded = false }: { embedded?: boolean }) {
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
  const allMetrics = useSimulationStore((s) => s.metrics);

  const [showAnalogy, setShowAnalogy] = useState(false);
  const { mode, setMode } = useInspectorViewModeForNode(selectedNodeId);

  if (!selectedNodeId || !design) return null;
  const node = design.nodes.find((n) => n.id === selectedNodeId);
  if (!node || node.type !== "client") return null;

  const cfg = useMemo(() => parseClientConfig(node.config), [node.config]);
  const baseRps = calculateBaseRps(cfg);
  const Icon = SIM_ICON_MAP.client;

  const experienceHealth: SimHealth =
    metrics && metrics.errorRate > 0.1 ? "failing" :
    metrics && metrics.errorRate > 0.02 ? "degraded" :
    metrics && metrics.p95LatencyMs > 500 ? "degraded" :
    "healthy";

  const insight = design && Object.keys(allMetrics).length > 0
    ? computeClientInsight(design, node.id, allMetrics)
    : null;

  const patchConfig = (partial: Partial<ClientTrafficConfig>) => {
    const next = { ...cfg, ...partial };
    if (partial.requestMix) next.requestMix = { ...cfg.requestMix, ...partial.requestMix };
    const stored = clientConfigToStorage(next);
    mergeNodeConfig(node.id, stored);
  };

  const setActivity = (preset: UserActivityPreset) => {
    if (preset === "custom") {
      patchConfig({ userActivityPreset: "custom" });
      return;
    }
    patchConfig({
      userActivityPreset: preset,
      requestsPerUserPerSecond: USER_ACTIVITY_RATES[preset],
    });
  };

  return (
    <div className={cn(
      "flex h-full flex-col",
      !embedded && "w-[300px] shrink-0 border-l border-[var(--clay-border)] bg-[var(--clay-surface)]/95 backdrop-blur-md lg:w-[320px]",
    )}>
      <div className="flex items-center justify-between border-b border-[var(--clay-border)] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-500/10">
            <Icon className="h-4.5 w-4.5 text-blue-500" />
          </div>
          <div>
            <div className="text-sm font-bold text-[var(--clay-text)]">Client</div>
            <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-blue-600">
              Traffic source
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={clearSelection}
          className="grid h-7 w-7 place-items-center rounded-lg text-[var(--clay-text-subtle)] hover:bg-[var(--clay-surface-2)]"
        >
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
            className="mt-1 w-full rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface-2)] px-3 py-1.5 text-sm text-[var(--clay-text)] focus:border-[var(--clay-primary)] focus:outline-none"
          />
          <div className="mt-3">
            <InspectorViewModeTabs mode={mode} onChange={setMode} />
          </div>
        </div>

        {mode === "basics" ? (
          <>
        {metrics && (
          <div className="border-b border-[var(--clay-border)] px-4 py-3">
            <div className="mb-0.5 flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-[var(--clay-text-muted)]" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--clay-text-subtle)]">
                Live Experience
              </span>
              <span className={cn(
                "ml-auto rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase",
                HEALTH_BG[experienceHealth],
              )}>
                {experienceHealth === "healthy" ? "healthy" : experienceHealth}
              </span>
            </div>
            <p className="mb-2 text-[10px] text-[var(--clay-text-subtle)]">
              What users are experiencing right now.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <MetricTile label="Outgoing Requests" value={`${formatRps(metrics.currentRps)}/sec`} />
              <MetricTile label="Avg Response Time" value={`${metrics.avgLatencyMs} ms`} />
              <MetricTile label="P95 Response Time" value={`${metrics.p95LatencyMs} ms`} warn={metrics.p95LatencyMs > 200} />
              <MetricTile
                label="Failed Requests"
                value={`${(metrics.errorRate * 100).toFixed(1)}%`}
                warn={metrics.errorRate > 0.02}
              />
            </div>
          </div>
        )}

        {insight && (
          <div className={cn(
            "border-b px-4 py-3",
            insight.severity === "critical" ? "border-rose-200/40 bg-rose-500/5" :
            insight.severity === "warning" ? "border-amber-200/40 bg-amber-500/5" :
            "border-blue-200/40 bg-blue-500/5",
          )}>
            <p className="text-[11px] leading-relaxed text-[var(--clay-text-muted)]">{insight.message}</p>
            <p className="mt-1.5 text-[11px] font-medium text-[var(--clay-text)]">{insight.suggestion}</p>
          </div>
        )}

        <div className="border-b border-[var(--clay-border)] px-4 py-3">
          <InspectorBasicsPanel
            node={node}
            design={design}
            metrics={metrics}
            mergeNodeConfig={mergeNodeConfig}
            updateNodeConfig={updateNodeConfig}
            onSwitchAdvanced={() => setMode("advanced")}
          />
        </div>

        <div className="border-b border-[var(--clay-border)] px-4 py-3">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-[var(--clay-primary)]" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--clay-text-subtle)]">
              Traffic Generator
            </span>
          </div>

          <Field label="Active Users" hint="Users actively using the product right now. This is not total registered users.">
            <input
              type="number"
              min={0}
              value={cfg.activeUsers}
              disabled={cfg.rpsOverrideEnabled}
              onChange={(e) => patchConfig({ activeUsers: Math.max(0, Number(e.target.value)) })}
              className="w-full rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface-2)] px-2.5 py-1.5 text-xs tabular-nums focus:border-[var(--clay-primary)] focus:outline-none disabled:opacity-50"
            />
          </Field>

          <Field label="User Activity" hint="How often each active user sends requests on average." className="mt-3">
            <div className="space-y-1">
              {ACTIVITY_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={cfg.rpsOverrideEnabled}
                  onClick={() => setActivity(p.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border px-2.5 py-1.5 text-left text-[11px] transition-colors",
                    cfg.userActivityPreset === p.id
                      ? "border-[var(--clay-primary)]/40 bg-[var(--clay-primary)]/8"
                      : "border-[var(--clay-border)] hover:bg-[var(--clay-surface-2)]",
                    cfg.rpsOverrideEnabled && "opacity-50",
                  )}
                >
                  <span className="text-[var(--clay-text)]">{getActivityLabel(p.id)}</span>
                  <span className="text-[10px] text-[var(--clay-text-subtle)]">≈ {formatRate(p.rate)}</span>
                </button>
              ))}
              <button
                type="button"
                disabled={cfg.rpsOverrideEnabled}
                onClick={() => setActivity("custom")}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border px-2.5 py-1.5 text-left text-[11px]",
                  cfg.userActivityPreset === "custom"
                    ? "border-[var(--clay-primary)]/40 bg-[var(--clay-primary)]/8"
                    : "border-[var(--clay-border)]",
                )}
              >
                <span>Custom</span>
              </button>
              {cfg.userActivityPreset === "custom" && (
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={cfg.requestsPerUserPerSecond}
                  disabled={cfg.rpsOverrideEnabled}
                  onChange={(e) => patchConfig({
                    requestsPerUserPerSecond: Math.max(0, Number(e.target.value)),
                    userActivityPreset: "custom",
                  })}
                  className="mt-1 w-full rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface-2)] px-2.5 py-1.5 text-xs tabular-nums"
                />
              )}
            </div>
          </Field>

          <div className="mt-4 rounded-xl border border-[var(--clay-primary)]/25 bg-[color-mix(in_srgb,var(--clay-primary)_6%,var(--clay-surface))] p-3">
            <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--clay-primary)]">
              Resulting Traffic
            </div>
            {!cfg.rpsOverrideEnabled ? (
              <div className="mt-2 space-y-1 text-[12px] tabular-nums text-[var(--clay-text)]">
                <div>{formatCount(cfg.activeUsers)} active users</div>
                <div className="text-[var(--clay-text-muted)]">× {formatRate(cfg.requestsPerUserPerSecond)}</div>
                <div className="border-t border-[var(--clay-border)] pt-1.5 text-base font-semibold">
                  {formatRps(baseRps)} requests/sec
                </div>
              </div>
            ) : (
              <div className="mt-2 text-base font-semibold tabular-nums">
                {formatRps(cfg.manualRpsOverride)} requests/sec
                <span className="mt-1 block text-[10px] font-normal text-[var(--clay-text-subtle)]">
                  Manual override active — see Advanced tab
                </span>
              </div>
            )}
          </div>
        </div>
          </>
        ) : (
          <>
        <div className="border-b border-[var(--clay-border)] px-4 py-3">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-[var(--clay-primary)]" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--clay-text-subtle)]">
              Traffic Patterns & Behavior
            </span>
          </div>

          <Field label="Active Users" hint="Same as Basics — adjust load volume here too.">
            <input
              type="number"
              min={0}
              value={cfg.activeUsers}
              disabled={cfg.rpsOverrideEnabled}
              onChange={(e) => patchConfig({ activeUsers: Math.max(0, Number(e.target.value)) })}
              className="w-full rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface-2)] px-2.5 py-1.5 text-xs tabular-nums focus:border-[var(--clay-primary)] focus:outline-none disabled:opacity-50"
            />
          </Field>

          <Field label="Traffic Pattern" className="mt-3">
            <select
              value={cfg.trafficPattern}
              onChange={(e) => patchConfig({ trafficPattern: e.target.value as TrafficPattern })}
              className="w-full rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface-2)] px-2.5 py-1.5 text-xs focus:border-[var(--clay-primary)] focus:outline-none"
            >
              {PATTERN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <PatternFields cfg={cfg} patchConfig={patchConfig} baseRps={baseRps} />
          </Field>

          <div className="mt-4 space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-xs text-[var(--clay-text)]">Override calculated RPS</span>
              <Toggle checked={cfg.rpsOverrideEnabled} onChange={(v) => patchConfig({ rpsOverrideEnabled: v })} />
            </label>
            {cfg.rpsOverrideEnabled && (
              <>
                <input
                  type="number"
                  min={0}
                  value={cfg.manualRpsOverride}
                  onChange={(e) => patchConfig({ manualRpsOverride: Math.max(0, Number(e.target.value)) })}
                  className="w-full rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface-2)] px-2.5 py-1.5 text-xs tabular-nums"
                />
                <p className="text-[10px] text-[var(--clay-text-subtle)]">
                  Direct RPS override can represent bots, background workers, integrations, or retry storms.
                </p>
              </>
            )}

            <div>
              <div className="mb-1 text-xs text-[var(--clay-text)]">Request Mix</div>
              <MixRow label="Read" value={cfg.requestMix.reads} onChange={(v) => patchConfig({ requestMix: { ...cfg.requestMix, reads: v } })} />
              <MixRow label="Write" value={cfg.requestMix.writes} onChange={(v) => patchConfig({ requestMix: { ...cfg.requestMix, writes: v } })} />
              <MixRow label="Search" value={cfg.requestMix.searches} onChange={(v) => patchConfig({ requestMix: { ...cfg.requestMix, searches: v } })} />
            </div>

            <Field label="Retry behavior">
              <select
                value={cfg.retryStrategy}
                onChange={(e) => patchConfig({ retryStrategy: e.target.value as RetryStrategy })}
                className="w-full rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface-2)] px-2.5 py-1.5 text-xs"
              >
                <option value="none">None</option>
                <option value="conservative">Conservative retries</option>
                <option value="aggressive">Aggressive retries</option>
              </select>
              <p className="mt-1 text-[10px] text-[var(--clay-text-subtle)]">
                Retries can increase traffic during failures and make overload worse.
              </p>
            </Field>
          </div>
        </div>

        <div className="px-4 py-3">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--clay-text-subtle)]">
            What this represents
          </div>
          <p className="text-xs leading-relaxed text-[var(--clay-text-muted)]">
            Clients are the people and apps using your product. Their activity creates requests that flow into the system.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[var(--clay-text-muted)]">
            More active users do not automatically mean failure. Problems begin when request volume exceeds what downstream services can process.
          </p>
          <button
            type="button"
            onClick={() => setShowAnalogy(!showAnalogy)}
            className="mt-2 flex items-center gap-1 text-[10px] font-medium text-[var(--clay-primary)]"
          >
            <UtensilsCrossed className="h-3 w-3" />
            Restaurant analogy
            {showAnalogy ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
          {showAnalogy && (
            <div className="mt-2 rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface-2)] p-2.5 text-[11px] text-[var(--clay-text-muted)]">
              <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
                <Lightbulb className="h-3 w-3" /> Think of it like a restaurant
              </div>
              <ul className="mt-1.5 space-y-0.5">
                <li>Active users = diners currently seated</li>
                <li>Requests per user = how often diners place orders</li>
                <li>Requests per second = incoming orders</li>
                <li>Backend capacity = how many orders the kitchen can prepare</li>
              </ul>
            </div>
          )}
        </div>
          </>
        )}
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

function PatternFields({
  cfg,
  patchConfig,
  baseRps,
}: {
  cfg: ClientTrafficConfig;
  patchConfig: (p: Partial<ClientTrafficConfig>) => void;
  baseRps: number;
}) {
  const syncBaseline = baseRps > 0 ? baseRps : DEFAULT_CLIENT_TRAFFIC.rampStartRps;

  switch (cfg.trafficPattern) {
    case "constant":
      return (
        <p className="mt-1.5 text-[10px] text-[var(--clay-text-subtle)]">
          Maintains {formatRps(syncBaseline)} RPS continuously (with subtle natural variation).
        </p>
      );
    case "ramp":
      return (
        <div className="mt-2 grid grid-cols-3 gap-2">
          <SmallNum label="Start RPS" value={cfg.rampStartRps} onChange={(v) => patchConfig({ rampStartRps: v })} />
          <SmallNum label="End RPS" value={cfg.rampEndRps} onChange={(v) => patchConfig({ rampEndRps: v })} />
          <SmallNum label="Duration (s)" value={cfg.rampDurationSec} onChange={(v) => patchConfig({ rampDurationSec: v })} />
        </div>
      );
    case "burst":
      return (
        <div className="mt-2 grid grid-cols-3 gap-2">
          <SmallNum label="Baseline" value={cfg.burstBaselineRps} onChange={(v) => patchConfig({ burstBaselineRps: v })} />
          <SmallNum label="Burst RPS" value={cfg.burstPeakRps} onChange={(v) => patchConfig({ burstPeakRps: v })} />
          <SmallNum label="Duration (s)" value={cfg.burstDurationSec} onChange={(v) => patchConfig({ burstDurationSec: v })} />
        </div>
      );
    case "dailyPeak":
      return (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <SmallNum label="Baseline RPS" value={cfg.dailyPeakBaselineRps} onChange={(v) => patchConfig({ dailyPeakBaselineRps: v })} />
          <SmallNum label="Peak RPS" value={cfg.dailyPeakRps} onChange={(v) => patchConfig({ dailyPeakRps: v })} />
        </div>
      );
    case "flashSale":
      return (
        <div className="mt-2 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <SmallNum label="Baseline" value={cfg.flashSaleBaselineRps} onChange={(v) => patchConfig({ flashSaleBaselineRps: v })} />
            <SmallNum label="Spike RPS" value={cfg.flashSaleSpikeRps} onChange={(v) => patchConfig({ flashSaleSpikeRps: v })} />
            <SmallNum label="Duration (s)" value={cfg.flashSaleDurationSec} onChange={(v) => patchConfig({ flashSaleDurationSec: v })} />
          </div>
          <label className="flex items-center gap-2 text-[10px] text-[var(--clay-text-muted)]">
            <input
              type="checkbox"
              checked={cfg.flashSaleRetrySurge}
              onChange={(e) => patchConfig({ flashSaleRetrySurge: e.target.checked })}
            />
            Retry surge during spike
          </label>
        </div>
      );
    default:
      return null;
  }
}

function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="text-xs font-medium text-[var(--clay-text)]">{label}</label>
      {hint && <p className="mt-0.5 text-[10px] text-[var(--clay-text-subtle)]">{hint}</p>}
      <div className="mt-1">{children}</div>
    </div>
  );
}

function MetricTile({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={cn(
      "rounded-lg border px-2.5 py-1.5",
      warn ? "border-amber-400/30 bg-amber-500/5" : "border-[var(--clay-border)] bg-[var(--clay-surface-2)]",
    )}>
      <div className="text-[9px] font-medium uppercase tracking-wider text-[var(--clay-text-subtle)]">{label}</div>
      <div className={cn("text-sm font-semibold tabular-nums", warn ? "text-amber-600" : "text-[var(--clay-text)]")}>{value}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-5 w-9 rounded-full transition-colors",
        checked ? "bg-[var(--clay-primary)]" : "bg-[var(--clay-border-strong)]",
      )}
    >
      <span className={cn(
        "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
        checked ? "translate-x-4" : "translate-x-0",
      )} />
    </button>
  );
}

function SmallNum({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="text-[9px] text-[var(--clay-text-subtle)]">{label}</div>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
        className="mt-0.5 w-full rounded border border-[var(--clay-border)] bg-[var(--clay-surface-2)] px-1.5 py-1 text-[10px] tabular-nums"
      />
    </div>
  );
}

function MixRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-1 flex items-center gap-2">
      <span className="w-14 text-[10px] text-[var(--clay-text-muted)]">{label}</span>
      <input
        type="number"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 rounded border border-[var(--clay-border)] bg-[var(--clay-surface-2)] px-1.5 py-0.5 text-[10px] tabular-nums"
      />
      <span className="text-[10px] text-[var(--clay-text-subtle)]">%</span>
    </div>
  );
}
