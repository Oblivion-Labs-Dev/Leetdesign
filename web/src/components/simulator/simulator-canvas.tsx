"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import { useDesignStore, useSimulationStore } from "@/lib/simulator/store";
import { useTeachingStore } from "@/lib/simulator/teaching-store";
import type { SimComponentType } from "@/lib/simulator/types";
import { SimNode, type SimNodeData } from "./sim-node";
import { SimEdge } from "./sim-edge";
import { CanvasContextMenu } from "./canvas-context-menu";
import { validateDesign } from "@/lib/simulator/traffic-contracts";

const NODE_TYPES = { sim: SimNode };
const EDGE_TYPES = { sim: SimEdge };

interface ContextMenuState {
  x: number;
  y: number;
  flowX: number;
  flowY: number;
}

function CanvasInner() {
  const design = useDesignStore((s) => s.design);
  const addNode = useDesignStore((s) => s.addNode);
  const addEdgeFn = useDesignStore((s) => s.addEdge);
  const removeNode = useDesignStore((s) => s.removeNode);
  const removeEdge = useDesignStore((s) => s.removeEdge);
  const updateNodePosition = useDesignStore((s) => s.updateNodePosition);
  const selectNode = useDesignStore((s) => s.selectNode);
  const selectEdge = useDesignStore((s) => s.selectEdge);
  const clearSelection = useDesignStore((s) => s.clearSelection);
  const selectedNodeId = useDesignStore((s) => s.selectedNodeId);
  const selectedEdgeId = useDesignStore((s) => s.selectedEdgeId);
  const highlightedNodeIds = useTeachingStore((s) => s.highlightedNodeIds);
  const highlightedEdgeIds = useTeachingStore((s) => s.highlightedEdgeIds);
  const dimOthers = useTeachingStore((s) => s.dimOthers);
  const trace = useTeachingStore((s) => s.trace);
  const running = useSimulationStore((s) => s.running);
  const setArchitectureViolations = useSimulationStore((s) => s.setArchitectureViolations);
  const { screenToFlowPosition } = useReactFlow();

  useEffect(() => {
    if (!design) {
      setArchitectureViolations([]);
      return;
    }
    setArchitectureViolations(validateDesign(design));
  }, [design, setArchitectureViolations]);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const connectMode = true;
  const runMode = running;

  const traceNodeId = trace ? trace.nodeIds[trace.hopIndex] : null;
  const traceEdgeId = trace && trace.hopIndex > 0 ? trace.edgeIds[trace.hopIndex - 1] : null;

  const hasHighlights = highlightedNodeIds.length > 0 || highlightedEdgeIds.length > 0;

  const visibleNodes = (design?.nodes ?? []).filter((n) => !n.hidden);

  const nodes: Node<SimNodeData>[] = visibleNodes.map((n) => ({
    id: n.id,
    type: "sim",
    position: n.position,
    selected: n.id === selectedNodeId,
    data: {
      label: n.label,
      componentType: n.type,
      nodeId: n.id,
      highlighted: highlightedNodeIds.includes(n.id),
      dimmed: dimOthers && hasHighlights && !highlightedNodeIds.includes(n.id),
      traceActive: n.id === traceNodeId,
      connectMode,
      runMode,
    },
    draggable: true,
  }));

  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));
  const edges: Edge[] = (design?.edges ?? [])
    .filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target))
    .map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: "sim",
      selected: e.id === selectedEdgeId,
      data: {
        protocol: e.protocol,
        highlighted: highlightedEdgeIds.includes(e.id),
        dimmed: dimOthers && hasHighlights && !highlightedEdgeIds.includes(e.id),
        traceActive: e.id === traceEdgeId,
        connectMode,
        runMode,
      },
    }));

  const onNodesChange = useCallback(
    (changes: NodeChange<Node<SimNodeData>>[]) => {
      for (const c of changes) {
        if (c.type === "position" && c.position) {
          updateNodePosition(c.id, c.position);
        }
        if (c.type === "remove") {
          removeNode(c.id);
        }
      }
    },
    [updateNodePosition, removeNode],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      for (const c of changes) {
        if (c.type === "remove") {
          removeEdge(c.id);
        }
      }
    },
    [removeEdge],
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        addEdgeFn(params.source, params.target);
      }
    },
    [addEdgeFn],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => { selectNode(node.id); },
    [selectNode],
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => { selectEdge(edge.id); },
    [selectEdge],
  );

  const onPaneClick = useCallback(() => {
    clearSelection();
    setContextMenu(null);
  }, [clearSelection]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData("application/sim-component-type") as SimComponentType;
      if (!type) return;
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      addNode(type, position);
    },
    [screenToFlowPosition, addNode],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setContextMenu({ x: e.clientX, y: e.clientY, flowX: flowPos.x, flowY: flowPos.y });
    },
    [screenToFlowPosition],
  );

  const handleContextSelect = useCallback(
    (type: SimComponentType) => {
      if (contextMenu) {
        addNode(type, { x: contextMenu.flowX, y: contextMenu.flowY });
      }
      setContextMenu(null);
    },
    [contextMenu, addNode],
  );

  const handleContextClose = useCallback(() => {
    setContextMenu(null);
  }, []);

  return (
    <div
      className="relative h-full w-full"
      onDragOver={onDragOver}
      onDrop={onDrop}
      onContextMenu={handleContextMenu}
    >
      {nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
          <div className="max-w-sm rounded-2xl border border-[var(--clay-border)] bg-[color-mix(in_srgb,var(--clay-surface)_92%,transparent)] px-8 py-6 text-center shadow-[var(--clay-shadow-out)] backdrop-blur-sm">
            <div className="text-base font-bold text-[var(--clay-text)]">
              Your architecture studio
            </div>
            <div className="mt-3 space-y-2 text-xs text-[var(--clay-text-muted)]">
              <p><span className="rounded bg-[var(--clay-surface-2)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--clay-text)]">Right-click</span> to add components anywhere</p>
              <p><span className="rounded bg-[var(--clay-surface-2)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--clay-text)]">Connect</span> Wire sync and async flows between handles</p>
              <p><span className="rounded bg-[var(--clay-surface-2)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--clay-text)]">Run</span> Simulate traffic and trace requests</p>
            </div>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        defaultEdgeOptions={{ type: "sim" }}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={["Backspace", "Delete"]}
        panOnDrag
        panOnScroll
        zoomOnScroll
        selectionOnDrag={false}
        minZoom={0.15}
        maxZoom={2}
        fitView
        fitViewOptions={{ padding: 0.35 }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1}
          color="var(--clay-border)"
        />
        <Controls
          showInteractive={false}
          className="!bottom-4 !left-4 !rounded-xl !border-[var(--clay-border)] !bg-[color-mix(in_srgb,var(--clay-surface)_94%,transparent)] !shadow-lg [&>button]:!border-[var(--clay-border)] [&>button]:!bg-transparent [&>button]:!text-[var(--clay-text-subtle)] [&>button:hover]:!bg-[var(--clay-surface-2)]"
        />
        <MiniMap
          pannable
          zoomable
          className="!bottom-4 !right-4"
          style={{
            background: "color-mix(in srgb, var(--clay-surface) 94%, transparent)",
            border: "1px solid var(--clay-border)",
            borderRadius: "12px",
          }}
          maskColor="color-mix(in srgb, var(--clay-bg-soft) 75%, transparent)"
        />
      </ReactFlow>

      {contextMenu && (
        <CanvasContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onSelect={handleContextSelect}
          onClose={handleContextClose}
        />
      )}

    </div>
  );
}

export function SimulatorCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
