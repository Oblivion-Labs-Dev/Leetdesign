"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ShieldAlert,
  Wrench,
  Plus,
  RotateCcw,
  Eye,
  ChevronRight,
  X,
} from "lucide-react";
import { useDesignStore } from "@/lib/simulator/store";
import { useSimulationStore } from "@/lib/simulator/store";
import { useTeachingStore } from "@/lib/simulator/teaching-store";
import { COMPONENT_REGISTRY, SIM_ICON_MAP } from "@/lib/simulator/component-registry";
import { computeBlastRadius } from "@/lib/simulator/topology";
import type { SimHealth, SimNode, RuntimeMetrics } from "@/lib/simulator/types";

const HEALTH_ORDER: SimHealth[] = ["healthy", "degraded", "failing", "down"];
const PIN_RELEASE_MS = 5000;

function buildIncident(
  design: NonNullable<ReturnType<typeof useDesignStore.getState>["design"]>,
  metrics: Record<string, RuntimeMetrics>,
  primary: SimNode,
) {
  const pm = metrics[primary.id]!;
  const blast = computeBlastRadius(design, [primary.id]);
  const starvedCount = blast.nodeIds.filter((id) => metrics[id]?.currentRps === 0).length;
  return { primary, pm, blast, starvedCount };
}

export function IncidentCoach() {
  const design = useDesignStore((s) => s.design);
  const metrics = useSimulationStore((s) => s.metrics);
  const running = useSimulationStore((s) => s.running);
  const systemHealth = useSimulationStore((s) => s.systemHealth);
  const updateNodeConfig = useDesignStore((s) => s.updateNodeConfig);
  const selectNode = useDesignStore((s) => s.selectNode);
  const setHighlights = useTeachingStore((s) => s.setHighlights);
  const clearHighlights = useTeachingStore((s) => s.clearHighlights);
  const trace = useTeachingStore((s) => s.trace);
  const markUnhealthy = useTeachingStore((s) => s.markUnhealthy);
  const markIncidentRecovered = useTeachingStore((s) => s.markIncidentRecovered);
  const scenario = useTeachingStore((s) => s.scenario);

  const [pinnedNodeId, setPinnedNodeId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const healthySinceRef = useRef<number | null>(null);

  const liveIncident = useMemo(() => {
    if (!design) return null;
    const unhealthy = design.nodes
      .filter((n) => {
        const m = metrics[n.id];
        return m && m.health !== "healthy" && !COMPONENT_REGISTRY[n.type].isTrafficSource;
      })
      .sort((a, b) => HEALTH_ORDER.indexOf(metrics[b.id]!.health) - HEALTH_ORDER.indexOf(metrics[a.id]!.health));

    if (unhealthy.length === 0) return null;
    return buildIncident(design, metrics, unhealthy[0]!);
  }, [design, metrics]);

  // Pin incident when one appears — stays visible even if health briefly flickers
  useEffect(() => {
    if (!running) {
      setPinnedNodeId(null);
      setDismissed(false);
      healthySinceRef.current = null;
      return;
    }

    if (liveIncident && !dismissed) {
      setPinnedNodeId(liveIncident.primary.id);
      healthySinceRef.current = null;
    }
  }, [liveIncident?.primary.id, running, dismissed]);

  useEffect(() => {
    if (systemHealth !== "healthy") markUnhealthy();
    if (scenario?.wasEverUnhealthy && systemHealth === "healthy" && running) {
      markIncidentRecovered();
    }
  }, [systemHealth, running, scenario?.wasEverUnhealthy, markUnhealthy, markIncidentRecovered]);

  // Auto-dismiss only after sustained recovery
  useEffect(() => {
    if (!pinnedNodeId || !running || dismissed) return;

    if (systemHealth !== "healthy") {
      healthySinceRef.current = null;
      return;
    }

    if (!healthySinceRef.current) {
      healthySinceRef.current = Date.now();
    }

    const remaining = PIN_RELEASE_MS - (Date.now() - healthySinceRef.current);
    const timer = setTimeout(() => {
      if (healthySinceRef.current && Date.now() - healthySinceRef.current >= PIN_RELEASE_MS) {
        setPinnedNodeId(null);
        setDismissed(false);
        healthySinceRef.current = null;
      }
    }, Math.max(remaining, 0));

    return () => clearTimeout(timer);
  }, [pinnedNodeId, running, dismissed, systemHealth]);

  const incident = useMemo(() => {
    if (!design || !pinnedNodeId) return null;
    const node = design.nodes.find((n) => n.id === pinnedNodeId);
    if (!node) return null;
    return buildIncident(design, metrics, node);
  }, [design, metrics, pinnedNodeId]);

  useEffect(() => {
    if (trace?.playing) return;
    if (incident && running) {
      setHighlights(
        [incident.primary.id, ...incident.blast.nodeIds],
        incident.blast.edgeIds,
        true,
      );
    } else if (!trace && !pinnedNodeId) {
      clearHighlights();
    }
  }, [incident, running, trace, pinnedNodeId, setHighlights, clearHighlights]);

  if (!running || !incident || !design || dismissed) return null;

  const Icon = SIM_ICON_MAP[incident.primary.type];
  const capacity = ((incident.primary.config.maxRps as number) ?? 1000) * ((incident.primary.config.replicas as number) ?? 1);
  const isKilled = capacity === 0;

  const addReplica = () => {
    const replicas = (incident.primary.config.replicas as number) ?? 1;
    updateNodeConfig(incident.primary.id, "replicas", replicas + 1);
    selectNode(incident.primary.id);
  };

  const restoreNode = () => {
    updateNodeConfig(incident.primary.id, "maxRps", 1000);
    selectNode(incident.primary.id);
  };

  const showBlastRadius = () => {
    setHighlights(
      [incident.primary.id, ...incident.blast.nodeIds],
      incident.blast.edgeIds,
      true,
    );
  };

  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-20 max-w-sm">
      <div className="pointer-events-auto clay-card border-rose-300/40 p-4 shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-rose-500/10">
              <ShieldAlert className="h-4 w-4 text-rose-500" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
                Incident Coach
              </div>
              <div className="text-sm font-semibold text-[var(--clay-text)]">
                {incident.primary.label} is {incident.pm.health}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setDismissed(true);
              setPinnedNodeId(null);
              clearHighlights();
            }}
            className="grid h-6 w-6 shrink-0 place-items-center rounded text-[var(--clay-text-subtle)] hover:bg-[var(--clay-surface-2)]"
            title="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-[var(--clay-text-muted)]">
          {incident.pm.diagnosisReason || "This component is unhealthy and affecting the system."}
        </p>

        {incident.blast.nodeIds.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-[var(--clay-surface-2)] px-2.5 py-1.5 text-[10px] text-[var(--clay-text-muted)]">
            <Eye className="h-3 w-3 shrink-0 text-[var(--clay-primary)]" />
            <span>
              Blast radius: <strong className="text-[var(--clay-text)]">{incident.blast.nodeIds.length}</strong> downstream
              {incident.starvedCount > 0 && (
                <> · <strong className="text-rose-500">{incident.starvedCount}</strong> starved</>
              )}
            </span>
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={showBlastRadius}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface)] px-2.5 py-1 text-[10px] font-semibold text-[var(--clay-text)] hover:bg-[var(--clay-surface-2)]"
          >
            <Eye className="h-3 w-3" /> Highlight impact
          </button>
          {!isKilled && (
            <button
              type="button"
              onClick={addReplica}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--clay-primary)]/30 bg-[var(--clay-primary)]/10 px-2.5 py-1 text-[10px] font-semibold text-[var(--clay-primary)] hover:bg-[var(--clay-primary)]/15"
            >
              <Plus className="h-3 w-3" /> Add replica
            </button>
          )}
          {isKilled && (
            <button
              type="button"
              onClick={restoreNode}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-600 hover:bg-emerald-500/15"
            >
              <RotateCcw className="h-3 w-3" /> Restore node
            </button>
          )}
          <button
            type="button"
            onClick={() => selectNode(incident.primary.id)}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--clay-border)] px-2.5 py-1 text-[10px] font-semibold text-[var(--clay-text-muted)] hover:bg-[var(--clay-surface-2)]"
          >
            <Icon className="h-3 w-3" /> Inspect
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        {incident.pm.diagnosisSuggestion && (
          <div className="mt-2.5 flex items-start gap-1.5 rounded-lg border border-[var(--clay-border)] bg-[var(--clay-bg-soft)] p-2">
            <Wrench className="mt-0.5 h-3 w-3 shrink-0 text-[var(--clay-primary)]" />
            <p className="text-[10px] leading-relaxed text-[var(--clay-text-muted)]">
              {incident.pm.diagnosisSuggestion}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
