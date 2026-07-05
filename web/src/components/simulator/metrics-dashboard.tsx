"use client";

import { Skull, ZapOff, Flame, AlertTriangle, Activity, ShieldAlert, Wrench } from "lucide-react";
import { useDesignStore } from "@/lib/simulator/store";
import { useSimulationStore } from "@/lib/simulator/store";
import { useTeachingStore } from "@/lib/simulator/teaching-store";
import { restartSimulationFlow } from "@/lib/simulator/engine";
import { COMPONENT_REGISTRY, SIM_ICON_MAP } from "@/lib/simulator/component-registry";
import type { SimHealth } from "@/lib/simulator/types";
import { cn } from "@/lib/utils";

const HEALTH_PILL: Record<SimHealth, string> = {
  healthy: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  degraded: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  failing: "bg-rose-400/15 text-rose-400 border-rose-400/20",
  down: "bg-rose-600/15 text-rose-400 border-rose-600/20",
};

const HEALTH_ICON: Record<SimHealth, typeof Activity> = {
  healthy: Activity,
  degraded: AlertTriangle,
  failing: Flame,
  down: ShieldAlert,
};

export function MetricsDashboard() {
  const design = useDesignStore((s) => s.design);
  const metrics = useSimulationStore((s) => s.metrics);
  const running = useSimulationStore((s) => s.running);
  const systemHealth = useSimulationStore((s) => s.systemHealth);
  const totalRps = useSimulationStore((s) => s.totalSystemRps);
  const avgLatency = useSimulationStore((s) => s.avgSystemLatency);
  const updateNodeConfig = useDesignStore((s) => s.updateNodeConfig);
  const markSpikeTriggered = useTeachingStore((s) => s.markSpikeTriggered);

  if (!design || !running) return null;

  const nodesWithMetrics = design.nodes
    .filter((n) => metrics[n.id])
    .map((n) => ({ node: n, metrics: metrics[n.id] }))
    .filter((x) => !COMPONENT_REGISTRY[x.node.type].isTrafficSource);

  const degraded = nodesWithMetrics.filter((x) => x.metrics.health !== "healthy");
  const HealthIcon = HEALTH_ICON[systemHealth];

  const killNode = (id: string) => updateNodeConfig(id, "maxConcurrentReqs", 0);

  const spikeTraffic = () => {
    markSpikeTriggered();
    for (const n of design.nodes) {
      if (COMPONENT_REGISTRY[n.type].isTrafficSource) {
        const current = (n.config.requestsPerSecond as number) ?? 100;
        updateNodeConfig(n.id, "requestsPerSecond", current * 5);
      }
    }
  };

  return (
    <div className="shrink-0 border-t border-[var(--clay-border)] bg-[var(--clay-surface)]/95 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-4">
          <div className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
            HEALTH_PILL[systemHealth],
          )}>
            <HealthIcon className="h-3 w-3" />
            {systemHealth === "healthy" ? "All Systems OK" :
             systemHealth === "degraded" ? "Degraded" :
             systemHealth === "failing" ? "Failing" : "Down"}
          </div>
          <div className="flex items-center gap-3 text-[10px] text-[var(--clay-text-subtle)]">
            <span>
              <span className="font-mono font-semibold text-[var(--clay-text)]">{totalRps}</span> rps
            </span>
            <span>
              <span className="font-mono font-semibold text-[var(--clay-text)]">{avgLatency}</span> ms
            </span>
            {degraded.length > 0 && (
              <span className="flex items-center gap-1 font-semibold text-amber-400">
                <AlertTriangle className="h-3 w-3" />
                {degraded.length} issue{degraded.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={spikeTraffic}
            className="inline-flex items-center gap-1 rounded-lg border border-amber-500/20 bg-amber-500/8 px-2.5 py-1 text-[10px] font-semibold text-amber-400 transition-colors hover:bg-amber-500/15"
          >
            <Flame className="h-3 w-3" /> Spike
          </button>
          <button
            type="button"
            onClick={() => restartSimulationFlow()}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--clay-border)] px-2.5 py-1 text-[10px] font-semibold text-[var(--clay-text-subtle)] transition-colors hover:bg-[var(--clay-surface-2)] hover:text-[var(--clay-text)]"
          >
            <ZapOff className="h-3 w-3" /> Restart flow
          </button>
        </div>
      </div>

      {degraded.length > 0 && (
        <div className="border-t border-[var(--clay-border)] px-4 py-2">
          <div className="flex flex-wrap gap-2">
            {degraded.map(({ node: n, metrics: m }) => {
              const CompIcon = SIM_ICON_MAP[n.type];
              return (
                <div
                  key={n.id}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] transition-all",
                    HEALTH_PILL[m.health],
                    m.health === "down" && "animate-pulse",
                  )}
                >
                  <CompIcon className="h-3 w-3" />
                  <span className="font-semibold">{n.label}</span>
                  <span className="uppercase">{m.health}</span>
                  <span className="font-mono">{m.currentRps}rps</span>
                  {m.diagnosisSuggestion && (
                    <span className="hidden items-center gap-0.5 sm:inline-flex" title={m.diagnosisSuggestion}>
                      <Wrench className="h-2.5 w-2.5 opacity-60" />
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => killNode(n.id)}
                    className="ml-0.5 rounded p-0.5 opacity-60 hover:opacity-100"
                    title="Kill node"
                  >
                    <Skull className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
