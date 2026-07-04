import { create } from "zustand";

interface TraceState {
  nodeIds: string[];
  edgeIds: string[];
  hopIndex: number;
  playing: boolean;
}

interface ScenarioState {
  id: string;
  stepIndex: number;
  completedSteps: boolean[];
  active: boolean;
  traceCompleted: boolean;
  spikeTriggered: boolean;
  wasEverUnhealthy: boolean;
  incidentRecovered: boolean;
}

interface TeachingState {
  highlightedNodeIds: string[];
  highlightedEdgeIds: string[];
  dimOthers: boolean;

  trace: TraceState | null;
  scenario: ScenarioState | null;
  showLayerLegend: boolean;

  setHighlights: (nodeIds: string[], edgeIds: string[], dimOthers?: boolean) => void;
  clearHighlights: () => void;

  startTrace: (nodeIds: string[], edgeIds: string[]) => void;
  setTraceHop: (index: number) => void;
  advanceTraceHop: () => void;
  stopTrace: () => void;

  startScenario: (id: string, stepCount: number) => void;
  dismissScenario: () => void;
  completeScenarioStep: (index: number) => void;
  setScenarioStep: (index: number) => void;
  markTraceCompleted: () => void;
  markSpikeTriggered: () => void;
  markUnhealthy: () => void;
  markIncidentRecovered: () => void;

  toggleLayerLegend: () => void;
  resetTeaching: () => void;
}

export const useTeachingStore = create<TeachingState>((set, get) => ({
  highlightedNodeIds: [],
  highlightedEdgeIds: [],
  dimOthers: false,
  trace: null,
  scenario: null,
  showLayerLegend: false,

  setHighlights: (nodeIds, edgeIds, dimOthers = false) =>
    set({ highlightedNodeIds: nodeIds, highlightedEdgeIds: edgeIds, dimOthers }),

  clearHighlights: () =>
    set({ highlightedNodeIds: [], highlightedEdgeIds: [], dimOthers: false }),

  startTrace: (nodeIds, edgeIds) => {
    set({
      trace: { nodeIds, edgeIds, hopIndex: 0, playing: true },
      highlightedNodeIds: nodeIds.length > 0 ? [nodeIds[0]!] : [],
      highlightedEdgeIds: [],
      dimOthers: true,
    });
  },

  setTraceHop: (index) => {
    const trace = get().trace;
    if (!trace) return;
    const hopIndex = Math.max(0, Math.min(index, trace.nodeIds.length - 1));
    const nodeId = trace.nodeIds[hopIndex]!;
    const edgeId = hopIndex > 0 ? trace.edgeIds[hopIndex - 1] : undefined;
    set({
      trace: { ...trace, hopIndex },
      highlightedNodeIds: [nodeId],
      highlightedEdgeIds: edgeId ? [edgeId] : [],
      dimOthers: true,
    });
  },

  advanceTraceHop: () => {
    const trace = get().trace;
    if (!trace) return;
    if (trace.hopIndex >= trace.nodeIds.length - 1) {
      get().markTraceCompleted();
      get().stopTrace();
      return;
    }
    get().setTraceHop(trace.hopIndex + 1);
  },

  stopTrace: () => {
    set({ trace: null });
    get().clearHighlights();
  },

  startScenario: (id, stepCount) =>
    set({
      scenario: {
        id,
        stepIndex: 0,
        completedSteps: Array(stepCount).fill(false),
        active: true,
        traceCompleted: false,
        spikeTriggered: false,
        wasEverUnhealthy: false,
        incidentRecovered: false,
      },
      showLayerLegend: true,
    }),

  dismissScenario: () => set({ scenario: null, showLayerLegend: false }),

  completeScenarioStep: (index) =>
    set((s) => {
      if (!s.scenario) return s;
      const completedSteps = [...s.scenario.completedSteps];
      completedSteps[index] = true;
      const nextIndex = Math.min(index + 1, s.scenario.completedSteps.length - 1);
      return {
        scenario: {
          ...s.scenario,
          completedSteps,
          stepIndex: index + 1 <= s.scenario.completedSteps.length - 1 ? index + 1 : index,
        },
      };
    }),

  setScenarioStep: (index) =>
    set((s) => {
      if (!s.scenario) return s;
      return { scenario: { ...s.scenario, stepIndex: index } };
    }),

  markTraceCompleted: () =>
    set((s) => (s.scenario ? { scenario: { ...s.scenario, traceCompleted: true } } : s)),

  markSpikeTriggered: () =>
    set((s) => (s.scenario ? { scenario: { ...s.scenario, spikeTriggered: true } } : s)),

  markUnhealthy: () =>
    set((s) => (s.scenario ? { scenario: { ...s.scenario, wasEverUnhealthy: true } } : s)),

  markIncidentRecovered: () =>
    set((s) => (s.scenario ? { scenario: { ...s.scenario, incidentRecovered: true } } : s)),

  toggleLayerLegend: () => set((s) => ({ showLayerLegend: !s.showLayerLegend })),

  resetTeaching: () =>
    set({
      highlightedNodeIds: [],
      highlightedEdgeIds: [],
      dimOthers: false,
      trace: null,
      scenario: null,
      showLayerLegend: false,
    }),
}));
