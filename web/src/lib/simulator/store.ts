import { create } from "zustand";
import type {
  SimDesign,
  SimNode,
  SimEdge,
  SimComponentType,
  SimHealth,
  RuntimeMetrics,
  EdgeProtocol,
} from "./types";
import { uid, DEFAULT_EDGE_CONFIG } from "./types";
import { COMPONENT_REGISTRY } from "./component-registry";
import { suggestEdgeProtocol } from "./traffic-contracts";
import { defaultDependencyConfig, isAppServerDependencyEdge } from "./dependency-edge-config";
import { saveDesign } from "./persistence";

// ── Design store (topology + config) ───────────────────────────────

interface DesignState {
  design: SimDesign | null;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  dirty: boolean;

  loadDesign: (d: SimDesign) => void;
  setName: (name: string) => void;
  setDescription: (desc: string) => void;

  addNode: (type: SimComponentType, position: { x: number; y: number }, label?: string) => string;
  removeNode: (id: string) => void;
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;
  updateNodeConfig: (id: string, key: string, value: string | number | boolean) => void;
  mergeNodeConfig: (id: string, patch: Record<string, string | number | boolean>) => void;
  updateNodeLabel: (id: string, label: string) => void;

  addEdge: (source: string, target: string, protocol?: EdgeProtocol) => string | null;
  removeEdge: (id: string) => void;
  updateEdgeProtocol: (id: string, protocol: EdgeProtocol) => void;
  mergeEdgeConfig: (id: string, patch: Record<string, string | number | boolean>) => void;

  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  clearSelection: () => void;
  clearCanvas: () => void;

  updateCourseProgress: (progress: import("./courses/types").CourseProgress) => void;
  save: () => void;
}

export const useDesignStore = create<DesignState>((set, get) => ({
  design: null,
  selectedNodeId: null,
  selectedEdgeId: null,
  dirty: false,

  loadDesign: (d) => set({ design: d, selectedNodeId: null, selectedEdgeId: null, dirty: false }),

  setName: (name) =>
    set((s) => {
      if (!s.design) return s;
      return { design: { ...s.design, name }, dirty: true };
    }),

  setDescription: (desc) =>
    set((s) => {
      if (!s.design) return s;
      return { design: { ...s.design, description: desc }, dirty: true };
    }),

  addNode: (type, position, label) => {
    const def = COMPONENT_REGISTRY[type];
    const id = `${type}_${uid()}`;
    const node: SimNode = {
      id,
      type,
      label: label ?? def.label,
      position,
      config: { ...def.defaultConfig },
    };
    set((s) => {
      if (!s.design) return s;
      return {
        design: {
          ...s.design,
          nodes: [...s.design.nodes, node],
          updatedAt: new Date().toISOString(),
        },
        selectedNodeId: id,
        selectedEdgeId: null,
        dirty: true,
      };
    });
    return id;
  },

  removeNode: (id) =>
    set((s) => {
      if (!s.design) return s;
      return {
        design: {
          ...s.design,
          nodes: s.design.nodes.filter((n) => n.id !== id),
          edges: s.design.edges.filter((e) => e.source !== id && e.target !== id),
          updatedAt: new Date().toISOString(),
        },
        selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
        dirty: true,
      };
    }),

  updateNodePosition: (id, position) =>
    set((s) => {
      if (!s.design) return s;
      return {
        design: {
          ...s.design,
          nodes: s.design.nodes.map((n) => (n.id === id ? { ...n, position } : n)),
        },
        dirty: true,
      };
    }),

  updateNodeConfig: (id, key, value) =>
    set((s) => {
      if (!s.design) return s;
      return {
        design: {
          ...s.design,
          nodes: s.design.nodes.map((n) =>
            n.id === id ? { ...n, config: { ...n.config, [key]: value } } : n,
          ),
          updatedAt: new Date().toISOString(),
        },
        dirty: true,
      };
    }),

  mergeNodeConfig: (id, patch) =>
    set((s) => {
      if (!s.design) return s;
      return {
        design: {
          ...s.design,
          nodes: s.design.nodes.map((n) =>
            n.id === id ? { ...n, config: { ...n.config, ...patch } } : n,
          ),
          updatedAt: new Date().toISOString(),
        },
        dirty: true,
      };
    }),

  updateNodeLabel: (id, label) =>
    set((s) => {
      if (!s.design) return s;
      return {
        design: {
          ...s.design,
          nodes: s.design.nodes.map((n) => (n.id === id ? { ...n, label } : n)),
          updatedAt: new Date().toISOString(),
        },
        dirty: true,
      };
    }),

  addEdge: (source, target, protocol) => {
    const s = get();
    if (!s.design) return null;
    const exists = s.design.edges.some(
      (e) => e.source === source && e.target === target,
    );
    if (exists) return null;

    // Auto-detect protocol from traffic contract between source and target
    let detectedProtocol: EdgeProtocol = protocol ?? "http";
    if (!protocol) {
      const sourceNode = s.design.nodes.find((n) => n.id === source);
      const targetNode = s.design.nodes.find((n) => n.id === target);
      if (sourceNode && targetNode) {
        detectedProtocol = suggestEdgeProtocol(sourceNode.type, targetNode.type);
      }
    }

    const id = `e_${uid()}`;
    const sourceNode = s.design.nodes.find((n) => n.id === source);
    const targetNode = s.design.nodes.find((n) => n.id === target);
    const depDefaults =
      sourceNode && targetNode && isAppServerDependencyEdge(sourceNode.type, targetNode.type)
        ? defaultDependencyConfig(targetNode.type)
        : {};

    const edge: SimEdge = {
      id,
      source,
      target,
      protocol: detectedProtocol,
      config: { ...DEFAULT_EDGE_CONFIG, ...depDefaults } as SimEdge["config"],
    };
    set({
      design: {
        ...s.design,
        edges: [...s.design.edges, edge],
        updatedAt: new Date().toISOString(),
      },
      dirty: true,
    });
    return id;
  },

  removeEdge: (id) =>
    set((s) => {
      if (!s.design) return s;
      return {
        design: {
          ...s.design,
          edges: s.design.edges.filter((e) => e.id !== id),
          updatedAt: new Date().toISOString(),
        },
        selectedEdgeId: s.selectedEdgeId === id ? null : s.selectedEdgeId,
        dirty: true,
      };
    }),

  updateEdgeProtocol: (id, protocol) =>
    set((s) => {
      if (!s.design) return s;
      return {
        design: {
          ...s.design,
          edges: s.design.edges.map((e) => (e.id === id ? { ...e, protocol } : e)),
          updatedAt: new Date().toISOString(),
        },
        dirty: true,
      };
    }),

  mergeEdgeConfig: (id, patch) =>
    set((s) => {
      if (!s.design) return s;
      return {
        design: {
          ...s.design,
          edges: s.design.edges.map((e) =>
            e.id === id ? { ...e, config: { ...e.config, ...patch } } : e,
          ),
          updatedAt: new Date().toISOString(),
        },
        dirty: true,
      };
    }),

  selectNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  selectEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),
  clearSelection: () => set({ selectedNodeId: null, selectedEdgeId: null }),

  clearCanvas: () =>
    set((s) => {
      if (!s.design) return s;
      return {
        design: { ...s.design, nodes: [], edges: [], updatedAt: new Date().toISOString() },
        selectedNodeId: null,
        selectedEdgeId: null,
        dirty: true,
      };
    }),

  updateCourseProgress: (progress) =>
    set((s) => {
      if (!s.design) return s;
      return {
        design: {
          ...s.design,
          courseId: progress.courseId,
          courseMilestoneId: progress.milestoneId,
          courseProgress: progress,
          updatedAt: new Date().toISOString(),
        },
        dirty: true,
      };
    }),

  save: () => {
    const { design } = get();
    if (!design) return;
    saveDesign(design);
    set({ dirty: false });
  },
}));

// ── Simulation store (runtime metrics + traffic) ────────────────────

interface SimulationState {
  running: boolean;
  timeScale: number;
  metrics: Record<string, RuntimeMetrics>;
  /** Per-edge flow in rps (actual traffic on that wire) */
  edgeFlowRps: Record<string, number>;
  /** Static + runtime architecture contract violations */
  architectureViolations: import("./traffic-contracts").ArchitectureViolation[];
  systemHealth: SimHealth;
  totalSystemRps: number;
  avgSystemLatency: number;

  start: () => void;
  stop: () => void;
  toggle: () => void;
  setTimeScale: (s: number) => void;
  updateNodeMetrics: (id: string, m: RuntimeMetrics) => void;
  batchUpdateMetrics: (batch: Record<string, RuntimeMetrics>, edgeFlows?: Record<string, number>) => void;
  setArchitectureViolations: (violations: import("./traffic-contracts").ArchitectureViolation[]) => void;
  updateSystemMetrics: (health: SimHealth, rps: number, latency: number) => void;
  resetMetrics: () => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  running: false,
  timeScale: 1,
  metrics: {},
  edgeFlowRps: {},
  architectureViolations: [],
  systemHealth: "healthy",
  totalSystemRps: 0,
  avgSystemLatency: 0,

  start: () => set({ running: true }),
  stop: () => set({ running: false }),
  toggle: () => set((s) => ({ running: !s.running })),
  setTimeScale: (timeScale) => set({ timeScale }),

  updateNodeMetrics: (id, m) =>
    set((s) => ({ metrics: { ...s.metrics, [id]: m } })),

  batchUpdateMetrics: (batch, edgeFlows) =>
    set({
      metrics: batch,
      ...(edgeFlows ? { edgeFlowRps: edgeFlows } : {}),
    }),

  setArchitectureViolations: (architectureViolations) => set({ architectureViolations }),

  updateSystemMetrics: (health, rps, latency) =>
    set({ systemHealth: health, totalSystemRps: rps, avgSystemLatency: latency }),

  resetMetrics: () =>
    set({
      metrics: {},
      edgeFlowRps: {},
      systemHealth: "healthy",
      totalSystemRps: 0,
      avgSystemLatency: 0,
    }),
}));
