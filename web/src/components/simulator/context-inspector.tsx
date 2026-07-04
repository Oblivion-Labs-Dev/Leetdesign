"use client";

import { useEffect, useMemo } from "react";
import {
  Activity,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  Circle,
  Flame,
  Layers,
  Lightbulb,
  PanelRightOpen,
  Plus,
  RotateCcw,
  Route,
  ShieldAlert,
  Target,
  X,
  Zap,
} from "lucide-react";
import { useDesignStore } from "@/lib/simulator/store";
import { useSimulationStore } from "@/lib/simulator/store";
import { useTeachingStore } from "@/lib/simulator/teaching-store";
import { useWorkspaceStore } from "@/lib/simulator/workspace-store";
import { COMPONENT_REGISTRY } from "@/lib/simulator/component-registry";
import { getScenarioForDesign } from "@/lib/simulator/scenarios";
import { validateChallenge, challengeScore, getChallengeById } from "@/lib/simulator/project-catalog";
import { getCourseById } from "@/lib/simulator/courses";
import { useCourseStore } from "@/lib/simulator/course-store";
import { computeBlastRadius } from "@/lib/simulator/topology";
import type { EdgeProtocol, SimHealth } from "@/lib/simulator/types";
import { ConfigInspector } from "./config-inspector";
import { cn } from "@/lib/utils";

const LAYER_HINTS = [
  { layer: "Client", hint: "Traffic enters here — scale sources to simulate load." },
  { layer: "Gateway", hint: "Rate limiting and routing protect downstream services." },
  { layer: "Service", hint: "Business logic — watch latency under spike." },
  { layer: "Data", hint: "Often the bottleneck — cache hot reads first." },
];

const PROTOCOL_INFO: Record<EdgeProtocol, { label: string; sync: boolean; pitfalls: string[] }> = {
  http: { label: "HTTP (sync)", sync: true, pitfalls: ["Timeouts cascade upstream", "Retry storms amplify load"] },
  grpc: { label: "gRPC (sync)", sync: true, pitfalls: ["Tight coupling between services", "Connection pool exhaustion"] },
  tcp: { label: "TCP (sync)", sync: true, pitfalls: ["Head-of-line blocking", "Keep-alive tuning under load"] },
  websocket: { label: "WebSocket", sync: true, pitfalls: ["Sticky sessions complicate scaling", "Long-lived connections tie up resources"] },
  async: { label: "Async event", sync: false, pitfalls: ["Consumer lag grows under spike", "Duplicate messages need idempotency"] },
};

export function ContextInspector() {
  const selectedNodeId = useDesignStore((s) => s.selectedNodeId);
  const selectedEdgeId = useDesignStore((s) => s.selectedEdgeId);
  const inspectorOpen = useWorkspaceStore((s) => s.inspectorOpen);
  const setInspectorOpen = useWorkspaceStore((s) => s.setInspectorOpen);

  useEffect(() => {
    if (selectedNodeId || selectedEdgeId) setInspectorOpen(true);
  }, [selectedNodeId, selectedEdgeId, setInspectorOpen]);

  if (!inspectorOpen) {
    return (
      <div className="ws-inspector-rail shrink-0">
        <button
          type="button"
          onClick={() => setInspectorOpen(true)}
          className="ws-inspector-rail-btn"
          title="Open inspector"
        >
          <PanelRightOpen className="h-4 w-4" />
        </button>
        <span
          className="text-[9px] font-semibold uppercase tracking-wider text-[var(--clay-text-subtle)]"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          Inspector
        </span>
      </div>
    );
  }

  return (
    <aside className="ws-inspector flex h-full shrink-0 flex-col">
      <div className="flex items-center justify-between border-b border-[var(--clay-border)] px-4 py-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
            Inspector
          </div>
          <div className="text-sm font-semibold text-[var(--clay-text)]">
            {selectedNodeId ? "Component" : selectedEdgeId ? "Connection" : "Architecture"}
          </div>
        </div>
        {!selectedNodeId && !selectedEdgeId && (
          <button
            type="button"
            onClick={() => setInspectorOpen(false)}
            className="grid h-7 w-7 place-items-center rounded-lg text-[var(--clay-text-subtle)] hover:bg-[var(--clay-surface-2)]"
            title="Collapse inspector"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {selectedNodeId ? (
          <ConfigInspector embedded />
        ) : selectedEdgeId ? (
          <EdgeInspector />
        ) : (
          <InspectorHome />
        )}
      </div>
    </aside>
  );
}

/** Shown beside the course guide when a component or connection is selected */
export function SelectionInspector() {
  const selectedNodeId = useDesignStore((s) => s.selectedNodeId);
  const selectedEdgeId = useDesignStore((s) => s.selectedEdgeId);
  const clearSelection = useDesignStore((s) => s.clearSelection);

  if (!selectedNodeId && !selectedEdgeId) return null;

  if (selectedNodeId) {
    return (
      <aside className="ws-inspector flex h-full shrink-0 flex-col border-l border-[var(--clay-border)]">
        <ConfigInspector embedded />
      </aside>
    );
  }

  return (
    <aside className="ws-inspector flex h-full shrink-0 flex-col border-l border-[var(--clay-border)]">
      <div className="flex items-center justify-between border-b border-[var(--clay-border)] px-4 py-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
            Configuration
          </div>
          <div className="text-sm font-semibold text-[var(--clay-text)]">Connection</div>
        </div>
        <button
          type="button"
          onClick={clearSelection}
          className="grid h-7 w-7 place-items-center rounded-lg text-[var(--clay-text-subtle)] hover:bg-[var(--clay-surface-2)]"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <EdgeInspector />
      </div>
    </aside>
  );
}

function InspectorHome() {
  const design = useDesignStore((s) => s.design);
  const running = useSimulationStore((s) => s.running);
  const mode = useWorkspaceStore((s) => s.mode);
  const openBrowseShelf = useWorkspaceStore((s) => s.openBrowseShelf);
  const setMode = useWorkspaceStore((s) => s.setMode);

  const scenarioDef = design ? getScenarioForDesign(design) : null;
  const courseDef = design?.courseId ? getCourseById(design.courseId) : null;
  const courseMilestone = useCourseStore((s) => s.getCurrentMilestone());
  const coursePhase = useCourseStore((s) => s.progress?.phase);
  const nodeCount = design?.nodes.length ?? 0;
  const edgeCount = design?.edges.length ?? 0;

  return (
    <div className="space-y-4 p-4">
      {courseDef && courseMilestone && (
        <section>
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
            <BookOpen className="h-3 w-3" />
            Course context
          </div>
          <div className="rounded-xl border border-[var(--clay-border)] bg-[var(--clay-bg-soft)] p-3">
            <div className="text-sm font-semibold text-[var(--clay-text)]">{courseMilestone.userProblem}</div>
            <p className="mt-1 text-xs text-[var(--clay-text-muted)]">{courseMilestone.goal}</p>
            {courseMilestone.bottleneckNodeLabel && (coursePhase === "failure" || coursePhase === "reflection") && (
              <p className="mt-2 text-[11px] font-medium text-amber-600">
                Likely bottleneck: {courseMilestone.bottleneckNodeLabel}
              </p>
            )}
          </div>
        </section>
      )}

      {scenarioDef && !courseDef && (
        <section>
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
            <BookOpen className="h-3 w-3" />
            Scenario
          </div>
          <div className="rounded-xl border border-[var(--clay-border)] bg-[var(--clay-bg-soft)] p-3">
            <div className="text-sm font-semibold text-[var(--clay-text)]">{scenarioDef.title}</div>
            <p className="mt-1 text-xs text-[var(--clay-text-muted)]">{scenarioDef.subtitle}</p>
            {scenarioDef.brief && (
              <div className="mt-2 space-y-1 text-[11px] text-[var(--clay-text-muted)]">
                <p><span className="font-medium text-[var(--clay-text)]">Use case:</span> {scenarioDef.brief.useCase}</p>
                {scenarioDef.brief.scale && <p><span className="font-medium text-[var(--clay-text)]">Scale:</span> {scenarioDef.brief.scale}</p>}
                <p><span className="font-medium text-[var(--clay-text)]">Goal:</span> {scenarioDef.brief.goal}</p>
              </div>
            )}
          </div>
        </section>
      )}

      <section>
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
          <Layers className="h-3 w-3" />
          Architecture summary
        </div>
        <div className="grid grid-cols-2 gap-2">
          <SummaryTile label="Components" value={String(nodeCount)} />
          <SummaryTile label="Connections" value={String(edgeCount)} />
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
          <Lightbulb className="h-3 w-3" />
          {mode === "compose" ? "Compose hints" : mode === "connect" ? "Connect hints" : "Run hints"}
        </div>
        <ul className="space-y-2">
          {(mode === "compose"
            ? ["Open the component shelf from the left rail", "Drag blocks onto the canvas", ...LAYER_HINTS.slice(0, 2).map((h) => h.hint)]
            : mode === "connect"
              ? ["Drag from right handle to left handle", "Solid lines = sync calls, dashed = async", "Wire the shopper → gateway → service path"]
              : ["Press Run simulation to see traffic flow", "Use Trace request to follow one shopper", "Watch for amber nodes — bottlenecks appear there first"]
          ).map((hint, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] text-[var(--clay-text-muted)]">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[var(--clay-primary)]" />
              {hint}
            </li>
          ))}
        </ul>
        {mode === "compose" && (
          <button
            type="button"
            onClick={() => openBrowseShelf()}
            className="mt-3 w-full rounded-xl bg-[var(--clay-primary)]/12 py-2 text-xs font-semibold text-[var(--clay-primary)] hover:bg-[var(--clay-primary)]/18"
          >
            Open component shelf
          </button>
        )}
        {mode === "connect" && (
          <button
            type="button"
            onClick={() => setMode("connect")}
            className="mt-3 w-full rounded-xl border border-[var(--clay-border)] py-2 text-xs font-semibold text-[var(--clay-text)] hover:bg-[var(--clay-surface-2)]"
          >
            Highlight connection handles
          </button>
        )}
      </section>

      {running && <RunInspectorPanel />}
      <TraceInspectorSection />
      {design?.challengeId && <ChallengeChecksPanel design={design} />}
    </div>
  );
}

function ChallengeChecksPanel({ design }: { design: NonNullable<ReturnType<typeof useDesignStore.getState>["design"]> }) {
  const challenge = getChallengeById(design.challengeId!);
  const nodeSig = design.nodes.map((n) => n.type).join(",");
  const edgeCount = design.edges.length;
  const results = useMemo(() => validateChallenge(design), [design, nodeSig, edgeCount]);
  const score = challengeScore(results);

  if (!challenge) return null;

  return (
    <section className="rounded-xl border border-[var(--clay-border)] bg-[var(--clay-surface-2)]/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
          <Target className="h-3 w-3" />
          Challenge checks
        </div>
        <span className={cn(
          "rounded-full px-2 py-0.5 text-[10px] font-semibold",
          score.complete ? "bg-emerald-500/12 text-emerald-600" : "bg-[var(--clay-primary)]/12 text-[var(--clay-primary)]",
        )}>
          {score.passed}/{score.total}
        </span>
      </div>
      <p className="mb-2 text-[11px] text-[var(--clay-text-muted)]">{challenge.brief}</p>
      <ul className="space-y-1.5">
        {results.map((r) => (
          <li key={r.id} className="flex items-start gap-2 text-[11px]">
            {r.passed ? (
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
            ) : (
              <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--clay-border)]" />
            )}
            <div>
              <span className={cn(r.passed ? "text-[var(--clay-text-muted)] line-through" : "text-[var(--clay-text)]")}>
                {r.label}
              </span>
              {!r.passed && r.hint && (
                <p className="mt-0.5 text-[10px] text-[var(--clay-text-subtle)]">{r.hint}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
      {score.complete && (
        <div className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-600">
          All checks passed — great design!
        </div>
      )}
    </section>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--clay-border)] bg-[var(--clay-surface-2)] px-3 py-2">
      <div className="text-[9px] font-medium uppercase tracking-wider text-[var(--clay-text-subtle)]">{label}</div>
      <div className="text-lg font-semibold tabular-nums text-[var(--clay-text)]">{value}</div>
    </div>
  );
}

function EdgeInspector() {
  const design = useDesignStore((s) => s.design);
  const selectedEdgeId = useDesignStore((s) => s.selectedEdgeId);
  const updateEdgeProtocol = useDesignStore((s) => s.updateEdgeProtocol);
  const metrics = useSimulationStore((s) => s.metrics);
  const running = useSimulationStore((s) => s.running);

  if (!design || !selectedEdgeId) return null;
  const edge = design.edges.find((e) => e.id === selectedEdgeId);
  if (!edge) return null;

  const source = design.nodes.find((n) => n.id === edge.source);
  const target = design.nodes.find((n) => n.id === edge.target);
  const info = PROTOCOL_INFO[edge.protocol];
  const srcMetrics = metrics[edge.source];
  const tgtMetrics = metrics[edge.target];

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2 text-xs text-[var(--clay-text-muted)]">
        <span className="font-medium text-[var(--clay-text)]">{source?.label ?? "Source"}</span>
        <ArrowRight className="h-3 w-3" />
        <span className="font-medium text-[var(--clay-text)]">{target?.label ?? "Target"}</span>
      </div>

      <div className="rounded-xl border border-[var(--clay-border)] bg-[var(--clay-bg-soft)] p-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
          Flow type
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
            info.sync ? "bg-[var(--clay-primary)]/12 text-[var(--clay-primary)]" : "bg-emerald-500/12 text-emerald-600",
          )}>
            {info.sync ? "Synchronous" : "Asynchronous"}
          </span>
          <span className="text-xs text-[var(--clay-text-muted)]">{info.label}</span>
        </div>
      </div>

      <div>
        <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
          Protocol
        </div>
        <select
          value={edge.protocol}
          onChange={(e) => updateEdgeProtocol(edge.id, e.target.value as EdgeProtocol)}
          className="w-full rounded-xl border border-[var(--clay-border)] bg-[var(--clay-surface-2)] px-3 py-2 text-xs text-[var(--clay-text)] focus:border-[var(--clay-primary)] focus:outline-none"
        >
          {(Object.keys(PROTOCOL_INFO) as EdgeProtocol[]).map((p) => (
            <option key={p} value={p}>{PROTOCOL_INFO[p].label}</option>
          ))}
        </select>
      </div>

      <div>
        <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
          Common pitfalls
        </div>
        <ul className="space-y-1">
          {info.pitfalls.map((p, i) => (
            <li key={i} className="text-[11px] text-[var(--clay-text-muted)]">• {p}</li>
          ))}
        </ul>
      </div>

      {running && srcMetrics && tgtMetrics && (
        <div>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
            Live flow
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <SummaryTile label="Source RPS" value={String(srcMetrics.currentRps)} />
            <SummaryTile label="Target RPS" value={String(tgtMetrics.currentRps)} />
          </div>
        </div>
      )}
    </div>
  );
}

function RunInspectorPanel() {
  const design = useDesignStore((s) => s.design);
  const metrics = useSimulationStore((s) => s.metrics);
  const running = useSimulationStore((s) => s.running);
  const systemHealth = useSimulationStore((s) => s.systemHealth);
  const totalRps = useSimulationStore((s) => s.totalSystemRps);
  const avgLatency = useSimulationStore((s) => s.avgSystemLatency);
  const updateNodeConfig = useDesignStore((s) => s.updateNodeConfig);
  const markSpikeTriggered = useTeachingStore((s) => s.markSpikeTriggered);

  const degraded = useMemo(() => {
    if (!design) return [];
    return design.nodes
      .filter((n) => {
        const m = metrics[n.id];
        return m && m.health !== "healthy" && !COMPONENT_REGISTRY[n.type].isTrafficSource;
      })
      .map((n) => ({ node: n, m: metrics[n.id]! }));
  }, [design, metrics]);

  if (!running || !design) return null;

  const spikeTraffic = () => {
    markSpikeTriggered();
    for (const n of design.nodes) {
      if (COMPONENT_REGISTRY[n.type].isTrafficSource) {
        const current = (n.config.requestsPerSecond as number) ?? 100;
        updateNodeConfig(n.id, "requestsPerSecond", current * 5);
      }
    }
  };

  const primary = degraded.sort((a, b) => {
    const order: SimHealth[] = ["healthy", "degraded", "failing", "down"];
    return order.indexOf(b.m.health) - order.indexOf(a.m.health);
  })[0];

  return (
    <section className="rounded-xl border border-[var(--clay-border)] bg-[var(--clay-surface-2)]/50 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
        <Activity className="h-3 w-3" />
        Simulation
      </div>
      <div className="flex flex-wrap gap-2 text-[11px]">
        <span className="rounded-full bg-[var(--clay-bg-soft)] px-2 py-0.5">
          <span className="font-mono font-semibold">{totalRps}</span> rps
        </span>
        <span className="rounded-full bg-[var(--clay-bg-soft)] px-2 py-0.5">
          <span className="font-mono font-semibold">{avgLatency}</span> ms avg
        </span>
        <span className={cn(
          "rounded-full px-2 py-0.5 font-semibold capitalize",
          systemHealth === "healthy" ? "bg-emerald-500/12 text-emerald-600" : "bg-amber-500/12 text-amber-600",
        )}>
          {systemHealth}
        </span>
      </div>

      <button
        type="button"
        onClick={spikeTraffic}
        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-400/30 bg-amber-500/8 py-2 text-xs font-semibold text-amber-600 hover:bg-amber-500/12"
      >
        <Zap className="h-3.5 w-3.5" />
        Trigger flash sale spike
      </button>

      {primary && (
        <IncidentActions nodeId={primary.node.id} health={primary.m.health} reason={primary.m.diagnosisReason} suggestion={primary.m.diagnosisSuggestion} />
      )}
    </section>
  );
}

function IncidentActions({
  nodeId,
  health,
  reason,
  suggestion,
}: {
  nodeId: string;
  health: SimHealth;
  reason?: string;
  suggestion?: string;
}) {
  const design = useDesignStore((s) => s.design);
  const updateNodeConfig = useDesignStore((s) => s.updateNodeConfig);
  const selectNode = useDesignStore((s) => s.selectNode);
  const setHighlights = useTeachingStore((s) => s.setHighlights);
  const markIncidentRecovered = useTeachingStore((s) => s.markIncidentRecovered);

  if (!design) return null;
  const node = design.nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const blast = computeBlastRadius(design, [nodeId]);
  const replicas = (node.config.replicas as number) ?? 1;

  return (
    <div className="mt-3 rounded-xl border border-rose-300/30 bg-rose-500/5 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-500">
        <ShieldAlert className="h-3 w-3" />
        Bottleneck
      </div>
      <p className="mt-1 text-xs font-medium text-[var(--clay-text)]">{node.label}</p>
      {reason && <p className="mt-1 text-[11px] text-[var(--clay-text-muted)]">{reason}</p>}
      {suggestion && <p className="mt-1 text-[11px] text-[var(--clay-text)]">{suggestion}</p>}

      <div className="mt-2 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => {
            updateNodeConfig(nodeId, "replicas", replicas + 1);
            markIncidentRecovered();
          }}
          className="inline-flex items-center gap-1 rounded-lg bg-[var(--clay-primary)]/12 px-2 py-1 text-[10px] font-semibold text-[var(--clay-primary)]"
        >
          <Plus className="h-3 w-3" /> Add replica
        </button>
        {health === "down" && (
          <button
            type="button"
            onClick={() => {
              updateNodeConfig(nodeId, "maxRps", 500);
              markIncidentRecovered();
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--clay-border)] px-2 py-1 text-[10px] font-semibold"
          >
            <RotateCcw className="h-3 w-3" /> Restore
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            selectNode(nodeId);
            setHighlights(blast.nodeIds, blast.edgeIds, true);
          }}
          className="inline-flex items-center gap-1 rounded-lg border border-[var(--clay-border)] px-2 py-1 text-[10px] font-semibold"
        >
          <Flame className="h-3 w-3" /> Blast radius
        </button>
      </div>
    </div>
  );
}

function TraceInspectorSection() {
  const design = useDesignStore((s) => s.design);
  const metrics = useSimulationStore((s) => s.metrics);
  const trace = useTeachingStore((s) => s.trace);
  const advanceTraceHop = useTeachingStore((s) => s.advanceTraceHop);
  const setTraceHop = useTeachingStore((s) => s.setTraceHop);
  const stopTrace = useTeachingStore((s) => s.stopTrace);

  useEffect(() => {
    if (!trace?.playing) return;
    const timer = setInterval(() => advanceTraceHop(), 1800);
    return () => clearInterval(timer);
  }, [trace?.playing, trace?.hopIndex, advanceTraceHop]);

  if (!trace || !design) return null;

  const nodeId = trace.nodeIds[trace.hopIndex];
  const node = design.nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const def = COMPONENT_REGISTRY[node.type];
  const m = metrics[nodeId];

  return (
    <section className="rounded-xl border border-[var(--clay-primary)]/25 bg-[var(--clay-primary)]/5 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--clay-primary)]">
          <Route className="h-3 w-3" />
          Request trace
        </div>
        <button type="button" onClick={stopTrace} className="text-[10px] text-[var(--clay-text-subtle)] hover:text-[var(--clay-text)]">
          Stop
        </button>
      </div>
      <p className="mt-2 text-xs font-semibold text-[var(--clay-text)]">
        Hop {trace.hopIndex + 1} of {trace.nodeIds.length}: {node.label}
      </p>
      <p className="mt-1 text-[11px] text-[var(--clay-text-muted)]">{def.explain.slice(0, 120)}…</p>
      {m && (
        <div className="mt-2 flex gap-2 text-[10px] text-[var(--clay-text-subtle)]">
          <span>{m.avgLatencyMs}ms</span>
          <span>{m.currentRps} rps</span>
          {m.errorRate > 0 && <span className="text-rose-500">{(m.errorRate * 100).toFixed(0)}% err</span>}
        </div>
      )}
      <div className="mt-2 flex gap-1">
        <button
          type="button"
          disabled={trace.hopIndex <= 0}
          onClick={() => setTraceHop(trace.hopIndex - 1)}
          className="rounded-lg border border-[var(--clay-border)] px-2 py-1 text-[10px] disabled:opacity-40"
        >
          Prev
        </button>
        <button
          type="button"
          disabled={trace.hopIndex >= trace.nodeIds.length - 1}
          onClick={() => setTraceHop(trace.hopIndex + 1)}
          className="rounded-lg border border-[var(--clay-border)] px-2 py-1 text-[10px] disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </section>
  );
}
