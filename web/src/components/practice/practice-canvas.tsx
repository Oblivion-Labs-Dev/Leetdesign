"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeProps,
} from "@xyflow/react";
import { motion } from "framer-motion";
import { Trash2, X } from "lucide-react";
import { COMPONENT_LIBRARY } from "@/lib/content/components";
import { COMPONENT_ICONS } from "@/components/pipeline/icon-map";
import type { ArchitectureSnapshot, ComponentType } from "@/types";
import { cn } from "@/lib/utils";

// --------------------------------------------------------------------------
// Editable node — what the user drops on the canvas. Renders an icon, an
// inline-editable label, source+target handles for connections, and a delete
// button. Same visual language as the project pipeline so users feel at home.
// --------------------------------------------------------------------------

export interface PracticeNodeData extends Record<string, unknown> {
  label: string;
  componentType: ComponentType;
  onLabelChange: (id: string, label: string) => void;
  onDelete: (id: string) => void;
}

function PracticeNode(props: NodeProps) {
  const d = props.data as PracticeNodeData;
  const Icon = COMPONENT_ICONS[d.componentType];
  return (
    <motion.div
      initial={{ scale: 0.92, opacity: 0.6 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "surface group relative flex w-[180px] flex-col gap-1 p-3 ring-1",
        props.selected
          ? "ring-[var(--brand)]"
          : "ring-[var(--border)] hover:ring-[var(--border-strong)]",
      )}
    >
      <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5" />
      <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5" />

      <button
        type="button"
        onClick={() => d.onDelete(props.id)}
        title="Remove"
        className="absolute -right-2 -top-2 z-10 hidden h-5 w-5 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-subtle)] transition-colors hover:text-[var(--danger)] group-hover:grid"
      >
        <X className="h-3 w-3" />
      </button>

      <div className="flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-[var(--surface-2)] text-[var(--tone-brand-text)]">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="text-[10px] uppercase tracking-wider text-[var(--foreground-subtle)]">
          {d.componentType.replace("_", " ")}
        </div>
      </div>

      <input
        value={d.label}
        onChange={(e) => d.onLabelChange(props.id, e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
        className="w-full rounded bg-transparent px-1 py-0.5 text-[13px] font-semibold leading-tight text-[var(--foreground)] outline-none focus:bg-[var(--background-soft)]"
      />
    </motion.div>
  );
}

const NODE_TYPES = { practice: PracticeNode };

// --------------------------------------------------------------------------
// Inventory rail — components users can drag onto the canvas.
// --------------------------------------------------------------------------

function InventoryRail({
  available,
  className,
}: {
  available: string[];
  className?: string;
}) {
  return (
    <div className={cn("surface flex h-full flex-col", className)}>
      <div className="border-b border-[var(--border)] px-3 py-2.5">
        <div className="text-sm font-semibold">Inventory</div>
        <div className="text-[11px] text-[var(--foreground-subtle)]">
          Drag onto the canvas. Connect with arrows.
        </div>
      </div>
      <div className="flex-1 space-y-1.5 overflow-y-auto p-2">
        {available.map((id) => {
          const c = COMPONENT_LIBRARY[id];
          if (!c) return null;
          const Icon = COMPONENT_ICONS[c.type as ComponentType];
          return (
            <div
              key={id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(
                  "application/leetdesign-component",
                  c.type,
                );
                e.dataTransfer.setData(
                  "application/leetdesign-component-label",
                  c.label,
                );
                e.dataTransfer.effectAllowed = "copy";
              }}
              className="group flex cursor-grab items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/70 px-2 py-1.5 transition-colors hover:border-[var(--tone-brand-border)] active:cursor-grabbing"
              title={c.shortDescription}
            >
              <div className="grid h-6 w-6 place-items-center rounded-md bg-[var(--surface)] text-[var(--tone-brand-text)]">
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12px] font-semibold leading-tight">
                  {c.label}
                </div>
                <div className="text-[9px] uppercase tracking-wider text-[var(--foreground-subtle)]">
                  {c.type.replace("_", " ")}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// PracticeCanvas (inner) — the actual React Flow board. Has to be wrapped
// in <ReactFlowProvider/> to use the projection helpers.
// --------------------------------------------------------------------------

interface PracticeCanvasProps {
  inventory: string[];
  exerciseId: string;
  onSnapshotChange?: (s: ArchitectureSnapshot) => void;
}

function PracticeCanvasInner({
  inventory,
  exerciseId,
  onSnapshotChange,
}: PracticeCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const { screenToFlowPosition } = useReactFlow();

  const [nodes, setNodes] = useState<Node<PracticeNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const updateLabel = useCallback((id: string, label: string) => {
    setNodes((arr) =>
      arr.map((n) =>
        n.id === id
          ? { ...n, data: { ...n.data, label } }
          : n,
      ),
    );
  }, []);

  const deleteNode = useCallback((id: string) => {
    setNodes((arr) => arr.filter((n) => n.id !== id));
    setEdges((arr) => arr.filter((e) => e.source !== id && e.target !== id));
  }, []);

  const onNodesChange = useCallback(
    (changes: NodeChange<Node<PracticeNodeData>>[]) =>
      setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            id: `e_${Math.random().toString(36).slice(2, 8)}`,
            type: "smoothstep",
            animated: true,
          },
          eds,
        ),
      ),
    [],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData(
        "application/leetdesign-component",
      ) as ComponentType;
      const label =
        e.dataTransfer.getData("application/leetdesign-component-label") ||
        type;
      if (!type) return;
      // Translate the drop's screen position into the flow coordinate space
      // so the node lands exactly under the cursor regardless of pan/zoom.
      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });
      const id = `${type}_${Math.random().toString(36).slice(2, 7)}`;
      const newNode: Node<PracticeNodeData> = {
        id,
        type: "practice",
        position,
        data: {
          label,
          componentType: type,
          onLabelChange: updateLabel,
          onDelete: deleteNode,
        },
      };
      setNodes((arr) => [...arr, newNode]);
    },
    [deleteNode, screenToFlowPosition, updateLabel],
  );

  // Re-bind the latest callbacks into existing nodes whenever they change so
  // older nodes don't end up calling stale closures (delete/update would be
  // no-ops). Cheap because the state shape is small.
  useEffect(() => {
    setNodes((arr) =>
      arr.map((n) => ({
        ...n,
        data: {
          ...n.data,
          onLabelChange: updateLabel,
          onDelete: deleteNode,
        },
      })),
    );
  }, [updateLabel, deleteNode]);

  // Notify the parent on every change so it always has a fresh snapshot to
  // submit for review.
  useEffect(() => {
    if (!onSnapshotChange) return;
    const snapshot: ArchitectureSnapshot = {
      exerciseId,
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.data.componentType,
        name: n.data.label,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
      })),
      submittedAt: new Date().toISOString(),
    };
    onSnapshotChange(snapshot);
  }, [nodes, edges, exerciseId, onSnapshotChange]);

  const clear = useCallback(() => {
    setNodes([]);
    setEdges([]);
  }, []);

  const counts = useMemo(
    () => ({ nodes: nodes.length, edges: edges.length }),
    [nodes.length, edges.length],
  );

  return (
    <div className="grid min-h-[420px] gap-3 lg:grid-cols-[220px_1fr] lg:h-[min(640px,75vh)]">
      <InventoryRail available={inventory} />

      <div
        ref={wrapperRef}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className="relative h-full w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background-soft)]/40"
      >
        {/* Top toolbar inside the canvas. */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 flex items-start justify-between p-3">
          <div className="pointer-events-auto rounded-lg border border-[var(--border)] bg-[var(--background)]/80 px-3 py-1.5 text-[11px] text-[var(--foreground-muted)] backdrop-blur">
            <span className="font-semibold text-[var(--foreground)]">
              {counts.nodes}
            </span>{" "}
            components ·{" "}
            <span className="font-semibold text-[var(--foreground)]">
              {counts.edges}
            </span>{" "}
            connections
          </div>
          <button
            type="button"
            onClick={clear}
            disabled={nodes.length === 0 && edges.length === 0}
            className="pointer-events-auto inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--background)]/80 px-2.5 py-1 text-[11px] text-[var(--foreground-muted)] backdrop-blur hover:text-[var(--danger)] disabled:opacity-40"
          >
            <Trash2 className="h-3 w-3" /> Clear board
          </button>
        </div>

        {nodes.length === 0 ? (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)]/40 px-5 py-4 text-center text-xs text-[var(--foreground-muted)]">
              Drag components from the inventory anywhere on the canvas.
              <br />
              Hover a node and drag from a side handle to draw an arrow.
            </div>
          </div>
        ) : null}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          fitViewOptions={{ padding: 0.4 }}
          proOptions={{ hideAttribution: true }}
          deleteKeyCode={["Backspace", "Delete"]}
          panOnDrag
          panOnScroll
          selectionOnDrag
          minZoom={0.2}
          maxZoom={1.5}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={22}
            size={1.4}
            color="rgba(99,102,241,0.18)"
          />
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            maskColor="rgba(7,8,13,0.6)"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}

export function PracticeCanvas(props: PracticeCanvasProps) {
  return (
    <ReactFlowProvider>
      <PracticeCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
