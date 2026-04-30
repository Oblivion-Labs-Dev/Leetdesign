"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import { PanelRightOpen, PanelRightClose } from "lucide-react";
import { ComponentNode, type ComponentNodeData } from "./component-node";
import type { PipelineGraph, ComponentType } from "@/types";

const NODE_TYPES = { component: ComponentNode };

export interface PipelineCanvasProps {
  graph: PipelineGraph;
  onDropToSlot: (slotId: string, type: ComponentType) => void;
  /** Bumping this re-fits the camera to all nodes (e.g. Restart project). */
  fitSignal?: number;
  /** Inventory toggle button rendered top-right of the canvas. */
  inventoryOpen?: boolean;
  onToggleInventory?: () => void;
  /**
   * Optional id of the slot the user is supposed to fill in this incident —
   * used to focus the camera on that slot the instant it appears.
   */
  focusSlotId?: string;
  /**
   * If true the slot will shake briefly to indicate the most recent drop
   * was wrong. Bump a counter to retrigger.
   */
  shakeSignal?: number;
}

export function PipelineCanvas(props: PipelineCanvasProps) {
  return (
    <ReactFlowProvider>
      <PipelineCanvasInner {...props} />
    </ReactFlowProvider>
  );
}

/**
 * Internal canvas — wrapped in ReactFlowProvider so we can use the imperative
 * `fitView` and `setCenter` to re-center the camera after big graph changes.
 *
 * Position strategy:
 *   • The base layered DAG is recomputed every render — the algorithm is
 *     fully deterministic (depth from longest path; siblings stack vertically
 *     in declaration order) so existing nodes never appear to "shuffle"
 *     unless the topology itself changes (e.g. an LB is inserted between
 *     gateway and service, which actually does deepen the right side).
 *   • If the user drags a node, that nudge is preserved in `userMovedRef`
 *     and overrides the layered position for that specific id.
 *   • We never auto-fitView on every change. We fit:
 *       - on initial mount (when the first node arrives)
 *       - on `fitSignal` change (Restart project)
 *     For everyday "added a node" we softly `setCenter` toward the new node
 *     so the user sees it without the camera yanking around.
 */
function PipelineCanvasInner({
  graph,
  onDropToSlot,
  fitSignal,
  inventoryOpen,
  onToggleInventory,
  focusSlotId,
  shakeSignal,
}: PipelineCanvasProps) {
  const userMovedRef = useRef<Record<string, { x: number; y: number }>>({});
  const flow = useReactFlow();

  const positions = useMemo(() => {
    const fresh = layoutLayered(graph);
    const merged: Record<string, { x: number; y: number }> = { ...fresh };
    // User drags win over the auto layout.
    for (const [id, p] of Object.entries(userMovedRef.current)) {
      if (graph.nodes.find((n) => n.id === id)) merged[id] = p;
    }
    return merged;
  }, [graph]);

  const nodes = useMemo<Node<ComponentNodeData>[]>(() => {
    return graph.nodes.map((n) => {
      const { x, y } = positions[n.id] ?? { x: 0, y: 0 };
      return {
        id: n.id,
        type: "component",
        position: { x, y },
        data: {
          label: n.label,
          componentType: n.type,
          status: n.status,
          metrics: n.metrics,
          isMissingSlot: n.isMissingSlot,
          acceptedTypes: n.acceptedTypes,
          slotId: n.id,
          onDropAccept: onDropToSlot,
          shake: focusSlotId === n.id ? shakeSignal : undefined,
        },
        draggable: true,
      } satisfies Node<ComponentNodeData>;
    });
  }, [graph.nodes, positions, onDropToSlot, focusSlotId, shakeSignal]);

  const edges = useMemo<Edge[]>(() => {
    const ids = new Set(graph.nodes.map((n) => n.id));
    return graph.edges
      .filter((e) => ids.has(e.source) && ids.has(e.target))
      .map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        animated: graph.health !== "down",
        type: "smoothstep",
      }));
  }, [graph]);

  const onNodesChange = (changes: NodeChange[]) => {
    for (const c of changes) {
      if (c.type === "position" && c.position) {
        userMovedRef.current[c.id] = c.position;
      }
    }
  };

  // Fit on initial render once we have nodes; refit when fitSignal changes.
  const lastFitRef = useRef(-2);
  useEffect(() => {
    if (graph.nodes.length === 0) return;
    const sig = fitSignal ?? -1;
    if (lastFitRef.current === sig) return;
    lastFitRef.current = sig;
    const t = window.setTimeout(() => {
      flow.fitView({ padding: 0.2, duration: 500 });
    }, 80);
    return () => window.clearTimeout(t);
  }, [fitSignal, flow, graph.nodes.length]);

  // First-mount fit (separate from fitSignal so it works without the parent
  // having to bump the signal on first render).
  const didFirstFitRef = useRef(false);
  useEffect(() => {
    if (didFirstFitRef.current || graph.nodes.length === 0) return;
    didFirstFitRef.current = true;
    const t = window.setTimeout(() => {
      flow.fitView({ padding: 0.2, duration: 0 });
    }, 60);
    return () => window.clearTimeout(t);
  }, [flow, graph.nodes.length]);

  // Soft pan toward the focus slot the instant it appears so the player
  // can see "what they need to fix" without scrolling.
  useEffect(() => {
    if (!focusSlotId) return;
    const pos = positions[focusSlotId];
    if (!pos) return;
    const t = window.setTimeout(() => {
      flow.setCenter(pos.x + 90, pos.y + 50, { duration: 700, zoom: 1.0 });
    }, 80);
    return () => window.clearTimeout(t);
  }, [focusSlotId, flow, positions]);

  // Pan toward newly-added non-slot nodes so the user sees the addition.
  const knownIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const next = new Set(graph.nodes.map((n) => n.id));
    const added: string[] = [];
    for (const id of next) if (!knownIdsRef.current.has(id)) added.push(id);
    knownIdsRef.current = next;
    if (added.length === 0) return;
    const target = added.find((id) => !graph.nodes.find((n) => n.id === id)?.isMissingSlot)
      ?? added[added.length - 1];
    const pos = positions[target];
    if (!pos) return;
    const t = window.setTimeout(() => {
      flow.setCenter(pos.x + 90, pos.y + 50, { duration: 600, zoom: 1.0 });
    }, 100);
    return () => window.clearTimeout(t);
  }, [graph.nodes, flow, positions]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background-soft)]/40">
      {/* Inventory toggle — pinned top-right of the canvas where the user
       *  can always find it. */}
      {onToggleInventory ? (
        <button
          type="button"
          onClick={onToggleInventory}
          className="absolute right-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-lg border border-[var(--tone-brand-border)] bg-[var(--background)]/85 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--tone-brand-text)] backdrop-blur transition-colors hover:bg-[var(--tone-brand-bg)]"
          title={inventoryOpen ? "Hide inventory" : "Show inventory"}
        >
          {inventoryOpen ? (
            <PanelRightClose className="h-3.5 w-3.5" />
          ) : (
            <PanelRightOpen className="h-3.5 w-3.5" />
          )}
          {inventoryOpen ? "Hide inventory" : "Show inventory"}
        </button>
      ) : null}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        defaultEdgeOptions={{ type: "smoothstep" }}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
        zoomOnScroll
        panOnScroll={false}
        panOnDrag
        minZoom={0.4}
        maxZoom={1.4}
        onNodesChange={onNodesChange}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1.4}
          color="rgba(99,102,241,0.18)"
        />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

// ---------------------------------------------------------------------
// Layered DAG layout
// ---------------------------------------------------------------------

// Wider columns (260) and taller rows (160) so node cards (180×92) never
// touch each other after the layered DAG layout. With 80px between cards in
// X and 68px between cards in Y the user has plenty of breathing room.
const COL_W = 260;
const ROW_H = 160;
const X_PAD = 60;
const Y_PAD = 60;

/**
 * Layered DAG layout (longest-path):
 *   • Each node's depth = max(depth(sources)) + 1.
 *   • Within a depth column, nodes stack vertically in declaration order.
 *   • The whole graph is recomputed every render — the algorithm is fully
 *     deterministic so existing nodes don't appear to "shuffle" unless the
 *     underlying topology genuinely changed (e.g. a new component was
 *     inserted between two existing ones, which legitimately deepens the
 *     downstream column).
 */
function layoutLayered(graph: PipelineGraph): Record<
  string,
  { x: number; y: number }
> {
  const nodeIds = new Set(graph.nodes.map((n) => n.id));
  const sourcesOf = new Map<string, string[]>();
  for (const n of graph.nodes) sourcesOf.set(n.id, []);
  for (const e of graph.edges) {
    if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) continue;
    sourcesOf.get(e.target)!.push(e.source);
  }

  const depth = new Map<string, number>();
  const compute = (id: string, stack: Set<string>): number => {
    if (depth.has(id)) return depth.get(id)!;
    if (stack.has(id)) return 0;
    stack.add(id);
    const srcs = sourcesOf.get(id) ?? [];
    let d = 0;
    if (srcs.length === 0) d = 0;
    else d = Math.max(...srcs.map((s) => compute(s, stack))) + 1;
    stack.delete(id);
    depth.set(id, d);
    return d;
  };
  for (const n of graph.nodes) compute(n.id, new Set());

  // Group ids by depth, preserving graph.nodes declaration order for stable
  // vertical ordering within a column.
  const layers: Record<number, string[]> = {};
  for (const n of graph.nodes) {
    const d = depth.get(n.id) ?? 0;
    (layers[d] ??= []).push(n.id);
  }

  const positions: Record<string, { x: number; y: number }> = {};
  const depths = Object.keys(layers)
    .map(Number)
    .sort((a, b) => a - b);
  for (const d of depths) {
    const ids = layers[d];
    let y = Y_PAD;
    for (const id of ids) {
      positions[id] = { x: X_PAD + d * COL_W, y };
      y += ROW_H;
    }
  }
  return positions;
}
