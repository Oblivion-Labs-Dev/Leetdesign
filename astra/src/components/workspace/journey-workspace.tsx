"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  RotateCcw,
  Trophy,
  AlertTriangle,
  GitBranch,
  Sparkles,
  Code2,
  ChevronDown,
  ChevronUp,
  Info,
  Zap,
  XCircle,
  BookOpen,
  Clock,
  PartyPopper,
} from "lucide-react";
import type {
  PipelineGraph,
  PipelineMutation,
  PipelineNode,
  ProjectJourney,
  JourneyStage,
  ComponentType,
  ProjectBriefing,
} from "@/types";
import { PipelineCanvas } from "@/components/pipeline/pipeline-canvas";
import { ComponentInventory } from "@/components/pipeline/inventory";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { COMPONENT_LIBRARY } from "@/lib/content/components";
import { COMPONENT_ICONS } from "@/components/pipeline/icon-map";
import { FloatingBot } from "@/components/bot/floating-bot";
import {
  BranchAnimation,
  type BranchPhase,
} from "@/components/delivery/branch-animation";
import { CenterModal } from "./center-modal";
import {
  RewardOverlay,
  useRewardQueue,
} from "./reward-overlay";
import { ProjectBriefingPanel } from "@/components/projects/briefing-panel";

// ----------------------------------------------------------------------
// Pipeline mutation engine
// ----------------------------------------------------------------------

function applyMutations(
  graph: PipelineGraph,
  mutations: PipelineMutation[],
): PipelineGraph {
  let nodes = [...graph.nodes];
  let edges = [...graph.edges];
  let health = graph.health;

  for (const m of mutations) {
    if (m.kind === "add_node") {
      if (!nodes.find((n) => n.id === m.node.id)) nodes.push(m.node);
    } else if (m.kind === "add_missing_slot") {
      if (!nodes.find((n) => n.id === m.slot.id)) nodes.push(m.slot);
    } else if (m.kind === "add_edge") {
      if (!edges.find((e) => e.id === m.edge.id)) edges.push(m.edge);
    } else if (m.kind === "fill_slot") {
      nodes = nodes.map((n) => (n.id === m.slotId ? m.withNode : n));
      edges = edges.map((e) => ({
        ...e,
        source: e.source === m.slotId ? m.withNode.id : e.source,
        target: e.target === m.slotId ? m.withNode.id : e.target,
      }));
    } else if (m.kind === "set_health") {
      health = m.health;
    } else if (m.kind === "remove_node") {
      nodes = nodes.filter((n) => n.id !== m.nodeId);
      edges = edges.filter((e) => e.source !== m.nodeId && e.target !== m.nodeId);
    } else if (m.kind === "remove_edge") {
      edges = edges.filter((e) => e.id !== m.edgeId);
    }
  }
  return { nodes, edges, health };
}

/**
 * Convert a teach_component stage into "place a slot now, fill it on drop"
 * mutations. The user now drags every component (teach + incident) from the
 * inventory — there is no "Add to system" button anywhere.
 */
function teachStageSlotMutations(
  stage: JourneyStage,
): { setupMutations: PipelineMutation[]; fillNode?: PipelineNode } {
  if (stage.kind !== "teach_component") return { setupMutations: [] };

  const addNode = stage.addMutations.find((m) => m.kind === "add_node");
  const otherMutations = stage.addMutations.filter((m) => m.kind !== "add_node");
  if (!addNode || addNode.kind !== "add_node") {
    return { setupMutations: stage.addMutations };
  }
  const slot: PipelineMutation = {
    kind: "add_missing_slot",
    slot: {
      ...addNode.node,
      label: "Drop here",
      status: "down",
      isMissingSlot: true,
      acceptedTypes: [addNode.node.type],
    },
  };
  return { setupMutations: [slot, ...otherMutations], fillNode: addNode.node };
}

/**
 * Hydrate the pipeline up to the given stage index — used on resume so the
 * canvas matches "where the user left off". Teach stages are hydrated as
 * fully filled nodes (we assume they completed every prior stage to get
 * here), not as slots.
 */
function hydrateGraph(journey: ProjectJourney, upToIndex: number): PipelineGraph {
  let g: PipelineGraph = journey.startGraph;
  for (let i = 0; i <= upToIndex && i < journey.stages.length; i++) {
    const s = journey.stages[i];
    if (s.pipelineMutations?.length) g = applyMutations(g, s.pipelineMutations);
    if (s.kind === "teach_component") g = applyMutations(g, s.addMutations);
    if (s.kind === "code_edit") g = applyMutations(g, s.successMutations);
  }
  return g;
}

/**
 * Set of inventory component ids the user is allowed to see right now.
 *
 * Rule: inventory shows everything the user has either already used or is
 * about to need. Specifically:
 *   • Every component already on the canvas (so they can place duplicates).
 *   • The component required by the current teach OR incident stage — this
 *     is what makes the new component magically appear in the inventory the
 *     instant the new lesson/incident starts.
 *   • Every component from prior stages they've cleared (already covered by
 *     "on canvas").
 *
 * The user no longer has to find an "Add to system" button — when a new
 * component is needed it just *appears* in the inventory glowing.
 */
function visibleInventoryIds(
  journey: ProjectJourney,
  graph: PipelineGraph,
  stage: JourneyStage | undefined,
): string[] {
  const onCanvas = new Set(graph.nodes.map((n) => n.type));
  const include = new Set<string>();

  for (const id of journey.inventory) {
    const meta = COMPONENT_LIBRARY[id];
    if (!meta) continue;
    if (onCanvas.has(meta.type as ComponentType)) include.add(id);
  }

  if (stage?.kind === "teach_component") include.add(stage.componentId);
  if (stage?.kind === "incident") include.add(stage.expectedComponentId);

  return journey.inventory.filter((id) => include.has(id));
}

/** ComponentType the current stage expects the user to drag, if any. */
function expectedComponentType(stage: JourneyStage | undefined): ComponentType | undefined {
  if (!stage) return undefined;
  if (stage.kind === "incident") return stage.acceptedTypes[0];
  if (stage.kind === "teach_component") {
    return COMPONENT_LIBRARY[stage.componentId]?.type as ComponentType | undefined;
  }
  return undefined;
}

// ----------------------------------------------------------------------
// Network helpers
// ----------------------------------------------------------------------

async function markComponentSeen(payload: {
  componentId: string;
  projectId: string;
}) {
  try {
    await fetch("/api/user/components/seen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // best effort
  }
}

async function persistProgress(
  projectId: string,
  stageIndex: number,
  status: "in_progress" | "completed",
) {
  try {
    await fetch(`/api/user/progress/${encodeURIComponent(projectId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageIndex, status }),
    });
  } catch {
    // best effort
  }
}

// ----------------------------------------------------------------------
// Main workspace
// ----------------------------------------------------------------------

export function JourneyWorkspace({
  journey,
  initialStageIndex,
  briefing,
  projectId,
}: {
  journey: ProjectJourney;
  initialStageIndex: number;
  briefing?: ProjectBriefing;
  projectId?: string;
}) {
  const [stageIndex, setStageIndex] = useState(initialStageIndex);
  const [graph, setGraph] = useState<PipelineGraph>(() =>
    hydrateGraph(journey, initialStageIndex - 1),
  );
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<BranchPhase>("idle");
  const [inventoryOpen, setInventoryOpen] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [codeOpen, setCodeOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [fitSignal, setFitSignal] = useState(0);
  const [shakeSignal, setShakeSignal] = useState(0);
  const [wrongTries, setWrongTries] = useState(0);
  const rewards = useRewardQueue();

  const stage: JourneyStage | undefined = journey.stages[stageIndex];
  const isLast = stageIndex >= journey.stages.length - 1;
  const slotsRemaining = useMemo(
    () => graph.nodes.filter((n) => n.isMissingSlot).length,
    [graph],
  );

  // Keep a per-stage cache of "what node should fill this slot" for teach
  // stages — used when the user successfully drops the right component.
  const teachFillRef = useRef<Record<string, PipelineNode | undefined>>({});

  // Inventory defaults: open during incidents and teach stages (you need to
  // drag), collapsed for code/ship/intro/summary so the canvas gets the
  // full width. The user override sticks.
  const userToggledInvRef = useRef(false);
  useEffect(() => {
    if (!stage || userToggledInvRef.current) return;
    setInventoryOpen(stage.kind === "incident" || stage.kind === "teach_component");
  }, [stage]);

  // Mutations apply when the user enters a NEW stage. Teach stages now
  // create a slot instead of immediately materialising the node.
  const [lastAppliedStageIdx, setLastApplied] = useState(initialStageIndex - 1);
  useEffect(() => {
    if (!stage) return;
    setError(null);
    setWrongTries(0);
    if (stageIndex !== lastAppliedStageIdx) {
      if (stage.pipelineMutations?.length) {
        setGraph((g) => applyMutations(g, stage.pipelineMutations!));
      }
      if (stage.kind === "teach_component") {
        const { setupMutations, fillNode } = teachStageSlotMutations(stage);
        teachFillRef.current[stage.id] = fillNode;
        setGraph((g) => applyMutations(g, setupMutations));
      }
      setLastApplied(stageIndex);
    }
  }, [stage, stageIndex, lastAppliedStageIdx]);

  useEffect(() => {
    persistProgress(
      journey.projectId,
      stageIndex,
      isLast ? "completed" : "in_progress",
    );
  }, [journey.projectId, stageIndex, isLast]);

  const advance = useCallback(() => {
    setStageIndex((s) => Math.min(s + 1, journey.stages.length - 1));
    setPhase("idle");
  }, [journey.stages.length]);

  const onDropToSlot = useCallback(
    (slotId: string, droppedType: ComponentType) => {
      if (!stage) return;

      // ---- Teach stage: drag the *new* component onto its slot. ----
      if (stage.kind === "teach_component") {
        const fillNode = teachFillRef.current[stage.id];
        if (!fillNode) return;
        const expectedType = COMPONENT_LIBRARY[stage.componentId]?.type as ComponentType;
        if (slotId !== fillNode.id || droppedType !== expectedType) {
          const reason = `Drop the ${COMPONENT_LIBRARY[stage.componentId]?.label} into the glowing slot.`;
          setError(reason);
          setWrongTries((n) => n + 1);
          setShakeSignal((n) => n + 1);
          rewards.push({
            title: "Wrong drop",
            detail: reason,
            size: "toast",
          });
          return;
        }
        setGraph((g) =>
          applyMutations(g, [
            { kind: "fill_slot", slotId: fillNode.id, withNode: fillNode },
          ]),
        );
        markComponentSeen({
          componentId: stage.componentId,
          projectId: journey.projectId,
        });
        rewards.push({
          title: "Component placed",
          detail: COMPONENT_LIBRARY[stage.componentId]?.label,
          xp: 25,
          stardust: 10,
          size: "toast",
        });
        advance();
        return;
      }

      // ---- Incident stage: drag the right fix into the missing slot. ----
      if (stage.kind === "incident") {
        const expectedSlot = slotId === stage.expectedSlotId;
        const expectedType = stage.acceptedTypes.includes(droppedType);
        if (!expectedSlot || !expectedType) {
          const reason = !expectedSlot
            ? "That slot is not the source of this incident."
            : `This slot does not accept ${droppedType.replace("_", " ")}.`;
          setError(reason);
          setWrongTries((n) => n + 1);
          setShakeSignal((n) => n + 1);
          rewards.push({
            title: "Wrong move — try again",
            detail: reason,
            size: "toast",
          });
          return;
        }
        markComponentSeen({
          componentId: stage.expectedComponentId,
          projectId: journey.projectId,
        });
        const firstTry = wrongTries === 0;
        rewards.push({
          title: firstTry ? "Nailed it — first try!" : "Got it",
          detail: COMPONENT_LIBRARY[stage.expectedComponentId]?.label,
          xp: firstTry ? 60 : 30,
          stardust: firstTry ? 25 : 10,
          size: firstTry ? "burst" : "toast",
        });
        advance();
      }
    },
    [stage, journey.projectId, advance, wrongTries, rewards],
  );

  const runCheckSequence = useCallback(
    (totalMs: number, onMerged: () => void) => {
      setPhase("branched");
      setTimeout(() => setPhase("running"), 350);
      setTimeout(() => {
        setPhase("merged");
        setTimeout(onMerged, 900);
      }, totalMs + 600);
    },
    [],
  );

  const onCommitCodeEdit = useCallback(() => {
    if (!stage || stage.kind !== "code_edit") return;
    setCodeOpen(false);
    setBranchOpen(true);
    const total = stage.checks.reduce((acc, c) => acc + c.durationMs, 0);
    runCheckSequence(total, () => {
      setGraph((g) => applyMutations(g, stage.successMutations));
      setBranchOpen(false);
      rewards.push({
        title: "Merged to main",
        detail: stage.branchName,
        xp: stage.rewardXp ?? 60,
        stardust: stage.rewardCurrency ?? 30,
        size: "burst",
      });
      advance();
    });
  }, [stage, runCheckSequence, advance, rewards]);

  const onShip = useCallback(() => {
    if (!stage || stage.kind !== "ship") return;
    setBranchOpen(true);
    const total = stage.checks.reduce((acc, c) => acc + c.durationMs, 0);
    runCheckSequence(total, () => {
      setBranchOpen(false);
      rewards.push({
        title: "Release shipped",
        detail: stage.branchName,
        xp: 100,
        stardust: 50,
        size: "burst",
      });
      advance();
    });
  }, [stage, runCheckSequence, advance, rewards]);

  // Auto-open the editor when entering a code_edit stage; close on leaving.
  useEffect(() => {
    if (stage?.kind === "code_edit") setCodeOpen(true);
    else setCodeOpen(false);
  }, [stage]);

  // Summary stage gets a fullscreen confetti once.
  const celebratedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!stage || stage.kind !== "summary") return;
    if (celebratedRef.current === stage.id) return;
    celebratedRef.current = stage.id;
    rewards.push({
      title: "Project complete",
      detail: journey.projectId,
      xp: stage.rewardXp,
      stardust: stage.rewardCurrency,
      size: "fullscreen",
    });
  }, [stage, journey.projectId, rewards]);

  const restart = useCallback(() => {
    setGraph(journey.startGraph);
    setStageIndex(0);
    setLastApplied(-1);
    setPhase("idle");
    setError(null);
    setWrongTries(0);
    setBranchOpen(false);
    setCodeOpen(false);
    setFitSignal((n) => n + 1);
    teachFillRef.current = {};
    persistProgress(journey.projectId, 0, "in_progress");
  }, [journey.startGraph, journey.projectId]);

  const visibleInventory = useMemo(
    () => visibleInventoryIds(journey, graph, stage),
    [journey, graph, stage],
  );

  const expectedType = expectedComponentType(stage);
  const highlightTypes = expectedType ? [expectedType] : [];

  if (!stage) return null;

  // ---------- INTRO renders the briefing + a CTA. ----------
  if (stage.kind === "intro") {
    return (
      <div className="space-y-5">
        <CompactStageBar
          stage={stage}
          index={stageIndex}
          total={journey.stages.length}
          slotsRemaining={slotsRemaining}
          detailsOpen={detailsOpen}
          onToggleDetails={() => setDetailsOpen((v) => !v)}
          journey={journey}
          projectId={projectId}
          onOpenBriefing={briefing ? () => setBriefingOpen(true) : undefined}
        />
        {briefing ? (
          <ProjectBriefingPanel briefing={briefing} />
        ) : null}
        <div className="surface space-y-5 p-6 lg:p-8">
          <IntroBrief stage={stage} onAdvance={advance} hasBriefing={!!briefing} />
        </div>
        <FloatingBot
          hasBriefLink={!!briefing}
          onOpenBrief={briefing ? () => setBriefingOpen(true) : undefined}
          projectId={projectId}
        />
        <RewardOverlay events={rewards.events} onDismiss={rewards.dismiss} />
      </div>
    );
  }

  // For both teach and incident stages the focus slot is whichever missing
  // slot is currently on the canvas — the user only ever has ONE slot to
  // fill at a time, so we can derive it.
  const focusSlot = graph.nodes.find((n) => n.isMissingSlot);
  const focusSlotId = focusSlot?.id;

  // ---------- All other stages: full-width pipeline. ----------
  return (
    <div className="space-y-3">
      <CompactStageBar
        stage={stage}
        index={stageIndex}
        total={journey.stages.length}
        slotsRemaining={slotsRemaining}
        detailsOpen={detailsOpen}
        onToggleDetails={() => setDetailsOpen((v) => !v)}
        journey={journey}
        projectId={projectId}
        onOpenBriefing={briefing ? () => setBriefingOpen(true) : undefined}
        primaryAction={
          stage.kind === "code_edit" ? (
            <Button onClick={() => setCodeOpen(true)} variant={codeOpen ? "outline" : "primary"}>
              <Code2 className="h-4 w-4" /> {codeOpen ? "Editor open" : "Reopen editor"}
            </Button>
          ) : stage.kind === "ship" ? (
            <Button onClick={onShip}>
              <GitBranch className="h-4 w-4" /> Open PR & run checks
            </Button>
          ) : stage.kind === "summary" ? (
            <Button onClick={restart} variant="outline">
              <RotateCcw className="h-4 w-4" /> Replay project
            </Button>
          ) : null
        }
      />

      {/* Code-editor reopen banner if the user closed it without merging */}
      {stage.kind === "code_edit" && !codeOpen ? (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface flex flex-wrap items-center justify-between gap-3 border border-[var(--tone-warning-border)] bg-[var(--tone-warning-bg)] p-3 text-sm"
        >
          <div className="flex items-center gap-2 text-[var(--tone-warning-text)]">
            <Code2 className="h-4 w-4" />
            <span>
              You closed the code editor without merging — the pipeline
              won&apos;t advance until you commit & merge this code change.
            </span>
          </div>
          <Button onClick={() => setCodeOpen(true)} size="sm">
            <Code2 className="h-3.5 w-3.5" /> Reopen editor
          </Button>
        </motion.div>
      ) : null}

      <AnimatePresence initial={false}>
        {detailsOpen ? (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <StageDetail stage={stage} error={error} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* MAIN ROW — pipeline left, inventory rail right (same line). */}
      <div
        className="grid items-stretch gap-3"
        style={{
          gridTemplateColumns: inventoryOpen ? "1fr 250px" : "1fr",
          minHeight: "calc(100vh - 320px)",
        }}
      >
        <div className="surface relative overflow-hidden p-2">
          <PipelineCanvas
            graph={graph}
            onDropToSlot={onDropToSlot}
            fitSignal={fitSignal}
            inventoryOpen={inventoryOpen}
            onToggleInventory={() => {
              userToggledInvRef.current = true;
              setInventoryOpen((v) => !v);
            }}
            focusSlotId={focusSlotId}
            shakeSignal={shakeSignal}
          />
        </div>

        {inventoryOpen ? (
          <ComponentInventory
            available={visibleInventory}
            highlightTypes={highlightTypes}
            disabled={!focusSlot}
            disabledHint="Nothing to drop right now — keep going."
            className="max-h-[calc(100vh-260px)] overflow-hidden"
          />
        ) : null}
      </div>

      <div className="flex items-center justify-between text-[11px] text-[var(--foreground-subtle)]">
        <Button size="sm" variant="outline" onClick={restart}>
          <RotateCcw className="h-3.5 w-3.5" /> Restart project
        </Button>
        <span>
          Stage {stageIndex + 1} / {journey.stages.length}
        </span>
      </div>

      <FloatingBot
        hasBriefLink={!!briefing}
        onOpenBrief={briefing ? () => setBriefingOpen(true) : undefined}
        projectId={projectId}
      />

      {/* Centered code editor overlay. */}
      <CenterModal
        open={codeOpen && stage.kind === "code_edit"}
        onClose={() => setCodeOpen(false)}
        size="xl"
      >
        {stage.kind === "code_edit" ? (
          <CodeEditPanel
            stage={stage}
            phase={phase}
            onCommit={onCommitCodeEdit}
            onClose={() => setCodeOpen(false)}
          />
        ) : null}
      </CenterModal>

      {/* Centered CI / branch animation overlay. */}
      <CenterModal
        open={branchOpen && phase !== "idle"}
        onClose={() => setBranchOpen(false)}
        dismissable={phase === "merged"}
        size="lg"
      >
        {stage.kind === "code_edit" || stage.kind === "ship" ? (
          <div className="space-y-2">
            <div className="border-b border-[var(--border)] px-6 py-3">
              <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--tone-brand-text)]">
                {stage.kind === "ship"
                  ? "Release pipeline"
                  : "Continuous Integration"}
              </div>
              <div className="text-base font-semibold">
                {phase === "merged"
                  ? "All checks green — merged to main"
                  : phase === "running"
                    ? "Checks running on the feature branch…"
                    : "Branch created. Cutting commit…"}
              </div>
            </div>
            <BranchAnimation
              branchName={stage.branchName}
              checks={stage.checks}
              phase={phase}
            />
          </div>
        ) : null}
      </CenterModal>

      {/* On-demand briefing modal */}
      {briefing ? (
        <CenterModal
          open={briefingOpen}
          onClose={() => setBriefingOpen(false)}
          size="xl"
        >
          <div className="max-h-[calc(100vh-32px)] overflow-y-auto p-6">
            <div className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[var(--tone-brand-text)]">
              <BookOpen className="h-3 w-3" /> Project briefing
            </div>
            <ProjectBriefingPanel briefing={briefing} variant="compact" />
          </div>
        </CenterModal>
      ) : null}

      <RewardOverlay events={rewards.events} onDismiss={rewards.dismiss} />
    </div>
  );
}

// ----------------------------------------------------------------------
// Compact stage bar
// ----------------------------------------------------------------------

function CompactStageBar({
  stage,
  index,
  total,
  slotsRemaining,
  detailsOpen,
  onToggleDetails,
  primaryAction,
  journey,
  projectId,
  onOpenBriefing,
}: {
  stage: JourneyStage;
  index: number;
  total: number;
  slotsRemaining: number;
  detailsOpen: boolean;
  onToggleDetails: () => void;
  primaryAction?: React.ReactNode;
  journey: ProjectJourney;
  projectId?: string;
  onOpenBriefing?: () => void;
}) {
  const tone =
    stage.kind === "incident"
      ? "danger"
      : stage.kind === "summary"
        ? "success"
        : stage.kind === "ship" || stage.kind === "code_edit"
          ? "accent"
          : "brand";
  const label =
    stage.kind === "incident"
      ? "Incident"
      : stage.kind === "teach_component"
        ? "Lesson"
        : stage.kind === "code_edit"
          ? "Code & Merge"
          : stage.kind === "ship"
            ? "Ship"
            : stage.kind === "summary"
              ? "Recap"
              : "Project intro";
  const pct = Math.round(((index + 1) / total) * 100);
  const stagesLeft = Math.max(0, total - (index + 1));
  // Each stage averages ~3.5 minutes (90min total / 26 stages-ish).
  const minPerStage = 3.5;
  const minLeft = Math.max(0, Math.round(stagesLeft * minPerStage));
  const phaseName = stage.phase ?? "Untitled phase";

  // Build per-phase progress segments so the user can SEE the project's
  // shape on the bar — distinct phases, where they are, what's ahead.
  const phaseSegments = useMemo(() => {
    const segs: { phase: string; count: number; isCurrent: boolean; isDone: boolean }[] = [];
    journey.stages.forEach((s, i) => {
      const p = s.phase ?? "Untitled";
      const last = segs[segs.length - 1];
      if (!last || last.phase !== p) {
        segs.push({ phase: p, count: 1, isCurrent: i === index, isDone: i < index });
      } else {
        last.count += 1;
        if (i === index) last.isCurrent = true;
        if (i < index) last.isDone = last.isDone || true;
      }
    });
    return segs;
  }, [journey, index]);

  return (
    <div className="surface relative overflow-hidden p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Pill tone={tone}>{label}</Pill>
        <div className="text-[11px] text-[var(--foreground-subtle)]">
          {phaseName}
        </div>
        <div className="flex-1" />
        {stage.kind === "incident" && slotsRemaining > 0 ? (
          <Pill tone="warning">
            <Zap className="h-3 w-3" /> {slotsRemaining} slot to fill
          </Pill>
        ) : null}
        {projectId ? (
          <Link
            href={`/projects/${projectId}/transcript`}
            target="_blank"
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--tone-brand-border)] bg-[var(--tone-brand-bg)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--tone-brand-text)] hover:bg-[var(--tone-brand-bg)]/70"
            title="Read the entire project as a transcript"
          >
            <BookOpen className="h-3.5 w-3.5" /> Transcript
          </Link>
        ) : null}
        {onOpenBriefing ? (
          <button
            onClick={onOpenBriefing}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] uppercase tracking-wider text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            title="Re-read the project briefing"
          >
            <Info className="h-3.5 w-3.5" /> Brief
          </button>
        ) : null}
        <button
          onClick={onToggleDetails}
          className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] uppercase tracking-wider text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          title={detailsOpen ? "Collapse stage detail" : "Expand stage detail"}
        >
          {detailsOpen ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
          Details
        </button>
        {primaryAction}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <h2 className="truncate text-base font-semibold tracking-tight">
          {stage.title}
        </h2>
        {stage.subtitle ? (
          <p className="truncate text-xs text-[var(--foreground-muted)]">
            · {stage.subtitle}
          </p>
        ) : null}
      </div>

      {/* Glorified progress: % + ETA + segmented phase bar. */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-[var(--foreground-muted)]">
        <span className="text-base font-bold text-[var(--foreground)] tabular-nums">
          {pct}%
        </span>
        <span>
          Stage {index + 1} / {total}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3 text-[var(--tone-accent-text)]" />
          ~{minLeft} min remaining
        </span>
      </div>
      <div
        className="mt-2 flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--background-soft)]"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {phaseSegments.map((seg, i) => {
          const widthPct = (seg.count / total) * 100;
          return (
            <div
              key={i}
              className={`h-2.5 border-r border-[var(--background)] ${
                seg.isCurrent
                  ? "bg-gradient-to-r from-[var(--brand)] to-[var(--accent)]"
                  : seg.isDone
                    ? "bg-[var(--tone-success-text)]/70"
                    : "bg-[var(--surface-2)]"
              }`}
              style={{ width: `${widthPct}%` }}
              title={`${seg.phase} (${seg.count} stage${seg.count > 1 ? "s" : ""})`}
            />
          );
        })}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Stage detail strip
// ----------------------------------------------------------------------

function StageDetail({
  stage,
  error,
}: {
  stage: JourneyStage;
  error: string | null;
}) {
  if (stage.kind === "teach_component") {
    const c = COMPONENT_LIBRARY[stage.componentId];
    const Icon = c ? COMPONENT_ICONS[c.type as ComponentType] : null;
    return (
      <div className="surface grid gap-4 p-4 lg:grid-cols-3">
        <div className="flex items-center gap-3 lg:col-span-1">
          {Icon ? (
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--tone-brand-bg)] text-[var(--tone-brand-text)]">
              <Icon className="h-5 w-5" />
            </div>
          ) : null}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--foreground-subtle)]">
              <BookOpen className="mr-1 inline h-3 w-3" /> New component appeared in inventory
            </div>
            <div className="text-sm font-semibold">
              {c?.label ?? stage.componentId}
            </div>
            <div className="text-[11px] text-[var(--tone-brand-text)]">
              Drag it from the inventory into the glowing slot.
            </div>
          </div>
        </div>
        <DetailField title="The story" body={stage.story} />
        <DetailField title="What it does" body={stage.whatItDoes} />
        {error ? (
          <motion.div
            key={error}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-3 inline-flex items-center gap-2 rounded-lg border border-[var(--tone-danger-border)] bg-[var(--tone-danger-bg)] px-3 py-2 text-xs text-[var(--tone-danger-text)]"
          >
            <XCircle className="h-3.5 w-3.5" /> {error}
          </motion.div>
        ) : null}
      </div>
    );
  }

  if (stage.kind === "incident") {
    const expected = COMPONENT_LIBRARY[stage.expectedComponentId];
    return (
      <div className="surface grid gap-4 p-4 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[var(--tone-danger-text)]">
            <AlertTriangle className="h-3 w-3" /> Severity {stage.severity}
          </div>
          <p className="mt-1 text-sm text-[var(--foreground)]">
            {stage.storyline}
          </p>
          <p className="mt-2 text-xs text-[var(--foreground-subtle)]">
            Drag the right component from the inventory into the glowing slot.
            Hint: you need a{" "}
            <span className="text-[var(--tone-brand-text)]">
              {expected?.label ?? stage.expectedComponentId}
            </span>
            . See Brief or Transcript for trade-offs and napkin math for this phase.
          </p>
          {error ? (
            <motion.div
              key={error}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 inline-flex items-center gap-2 rounded-lg border border-[var(--tone-danger-border)] bg-[var(--tone-danger-bg)] px-3 py-2 text-xs text-[var(--tone-danger-text)]"
            >
              <XCircle className="h-3.5 w-3.5" /> {error}
            </motion.div>
          ) : null}
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-[var(--foreground-subtle)]">
            Symptoms
          </div>
          <ul className="mt-1 grid gap-1.5 text-xs text-[var(--foreground-muted)]">
            {stage.symptoms.map((s) => (
              <li
                key={s}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/60 px-2.5 py-1.5"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (stage.kind === "code_edit") {
    return (
      <div className="surface flex items-center gap-3 p-4">
        <Code2 className="h-4 w-4 text-[var(--tone-accent-text)]" />
        <div className="min-w-0">
          <div className="text-sm">
            Branch{" "}
            <code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-[12px]">
              {stage.branchName}
            </code>{" "}
            · file{" "}
            <code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-[12px]">
              {stage.fileName}
            </code>
          </div>
          <div className="text-xs text-[var(--foreground-muted)]">
            Open the editor, tweak the snippet, then commit & merge. CI runs
            in a centered overlay so you never miss the result.
          </div>
        </div>
      </div>
    );
  }

  if (stage.kind === "ship") {
    return (
      <div className="surface flex items-start gap-3 p-4">
        <GitBranch className="h-4 w-4 text-[var(--tone-accent-text)]" />
        <div>
          <div className="text-sm">
            Release branch{" "}
            <code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-[12px]">
              {stage.branchName}
            </code>
          </div>
          <p className="text-xs text-[var(--foreground-muted)]">
            Full release pipeline runs once. If green, we cut a tag and roll
            to all regions.
          </p>
        </div>
      </div>
    );
  }

  if (stage.kind === "summary") {
    return (
      <div className="surface space-y-3 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Trophy className="h-4 w-4 text-[var(--tone-success-text)]" />
          Project complete · +{stage.rewardXp} XP · +{stage.rewardCurrency}{" "}
          stardust
        </div>
        <ul className="grid gap-1.5 text-xs text-[var(--foreground-muted)] md:grid-cols-2">
          {stage.recap.map((r) => (
            <li
              key={r}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/60 px-2.5 py-1.5"
            >
              {r}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return null;
}

function DetailField({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-[var(--foreground-subtle)]">
        {title}
      </div>
      <p className="mt-1 text-sm text-[var(--foreground-muted)]">{body}</p>
    </div>
  );
}

// ----------------------------------------------------------------------
// Intro briefing
// ----------------------------------------------------------------------

function IntroBrief({
  stage,
  onAdvance,
  hasBriefing,
}: {
  stage: JourneyStage;
  onAdvance: () => void;
  hasBriefing: boolean;
}) {
  if (stage.kind !== "intro") return null;
  return (
    <div className="space-y-5">
      <div>
        <div className="mb-1 text-[10px] uppercase tracking-[0.22em] text-[var(--tone-brand-text)]">
          <Info className="mr-1 inline h-3 w-3" /> What we are building
        </div>
        <p className="text-base leading-relaxed text-[var(--foreground)]">
          {stage.what}
        </p>
      </div>
      <div>
        <div className="mb-1 text-[10px] uppercase tracking-[0.22em] text-[var(--tone-accent-text)]">
          What you will do
        </div>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          {stage.doing}
        </p>
      </div>
      <div className="rounded-xl border border-[var(--tone-brand-border)] bg-[var(--tone-brand-bg)] p-4 text-sm text-[var(--foreground-muted)]">
        <div className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--tone-brand-text)]">
          <Sparkles className="h-3.5 w-3.5" /> The simulated experience
        </div>
        <p>
          Every stage from here on works the same way:{" "}
          <strong className="text-[var(--foreground)]">
            a new component appears in the inventory
          </strong>{" "}
          and a glowing slot lights up on the canvas → you{" "}
          <strong className="text-[var(--foreground)]">
            drag the component into the slot
          </strong>{" "}
          → read trade-offs / napkin math in Brief & Transcript →{" "}
          <strong className="text-[var(--foreground)]">
            you write a tiny code change
          </strong>{" "}
          in a centered editor →{" "}
          <strong className="text-[var(--foreground)]">commit & merge</strong>{" "}
          with a CI animation → the pipeline updates with your new piece.
          {hasBriefing
            ? " Read the requirements + deep dives above first if you want the interview-style framing."
            : ""}
        </p>
      </div>
      <div className="pt-2">
        <Button onClick={onAdvance} size="lg">
          Start day 1 <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Code editor panel (rendered inside the centered modal)
// ----------------------------------------------------------------------

function CodeEditPanel({
  stage,
  phase,
  onCommit,
  onClose,
}: {
  stage: Extract<JourneyStage, { kind: "code_edit" }>;
  phase: BranchPhase;
  onCommit: () => void;
  onClose: () => void;
}) {
  const [code, setCode] = useState<string>(stage.placeholderCode);
  useEffect(() => {
    setCode(stage.placeholderCode);
  }, [stage.placeholderCode]);
  const running = phase !== "idle" && phase !== "merged";
  return (
    <div className="flex max-h-[calc(100vh-32px)] flex-col">
      <div className="border-b border-[var(--border)] px-6 py-4">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[var(--tone-brand-text)]">
          <Code2 className="h-3 w-3" /> Code & merge
        </div>
        <div className="mt-1 text-lg font-semibold">{stage.title}</div>
        {stage.subtitle ? (
          <div className="text-xs text-[var(--foreground-muted)]">
            {stage.subtitle}
          </div>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--foreground-muted)]">
          <span className="inline-flex items-center gap-1">
            <GitBranch className="h-3.5 w-3.5 text-[var(--tone-accent-text)]" />
            <code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 font-mono">
              {stage.branchName}
            </code>
          </span>
          <Pill tone="accent">{stage.language}</Pill>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background-soft)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-1.5 text-[11px] text-[var(--foreground-subtle)]">
            <span className="font-mono">{stage.fileName}</span>
            <span>{code.split("\n").length} lines</span>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            rows={Math.max(16, code.split("\n").length + 2)}
            className="block w-full resize-y bg-transparent p-4 font-mono text-[12.5px] leading-relaxed text-[var(--foreground)] outline-none"
          />
        </div>
        <p className="mt-3 text-xs text-[var(--foreground-subtle)]">
          The placeholder is the canonical answer. Tweak it if you want — when
          you commit we run lint, tests and a deploy. Closing this window does
          NOT discard the change; the editor will reopen from the banner above
          the canvas.
        </p>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] bg-[var(--surface-2)] px-6 py-3">
        <Button onClick={onClose} variant="outline" disabled={running}>
          Close (you can reopen anytime)
        </Button>
        <Button onClick={onCommit} disabled={running}>
          {phase === "idle"
            ? "Commit & merge"
            : phase === "merged"
              ? "Merged — landing…"
              : "Running checks…"}
        </Button>
      </div>
    </div>
  );
}

// Lint suppression for unused but reserved imports
void PartyPopper;
