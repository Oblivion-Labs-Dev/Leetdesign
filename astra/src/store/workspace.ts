"use client";

import { create } from "zustand";
import type {
  ComponentType,
  DeliveryEvent,
  PipelineGraph,
  ScenarioDefinition,
} from "@/types";
import { evaluateScenario } from "@/lib/simulation/engine";
import { buildDeliveryTimeline } from "@/lib/simulation/delivery";

interface WorkspaceState {
  scenario?: ScenarioDefinition;
  graph?: PipelineGraph;
  delivery: DeliveryEvent[];
  feedback?: string;
  passed?: boolean;
  isRunning: boolean;
  loadScenario: (s: ScenarioDefinition) => void;
  placeComponent: (slotId: string, type: ComponentType, label: string) => void;
  resetSlot: (slotId: string) => void;
  runSimulation: () => Promise<void>;
}

export const useWorkspace = create<WorkspaceState>((set, get) => ({
  scenario: undefined,
  graph: undefined,
  delivery: [],
  isRunning: false,

  loadScenario(s) {
    set({
      scenario: s,
      graph: deepClone(s.startingGraph),
      delivery: [],
      feedback: undefined,
      passed: undefined,
      isRunning: false,
    });
  },

  placeComponent(slotId, type, label) {
    const graph = get().graph;
    if (!graph) return;
    set({
      graph: {
        ...graph,
        nodes: graph.nodes.map((n) =>
          n.id === slotId
            ? {
                ...n,
                type,
                label,
                status: "healthy",
                isMissingSlot: false,
              }
            : n,
        ),
      },
    });
  },

  resetSlot(slotId) {
    const { scenario, graph } = get();
    if (!scenario || !graph) return;
    const original = scenario.startingGraph.nodes.find((n) => n.id === slotId);
    if (!original) return;
    set({
      graph: {
        ...graph,
        nodes: graph.nodes.map((n) => (n.id === slotId ? { ...original } : n)),
      },
    });
  },

  async runSimulation() {
    const { scenario, graph } = get();
    if (!scenario || !graph) return;
    set({ isRunning: true, delivery: [], feedback: undefined, passed: undefined });
    const result = evaluateScenario(scenario, graph);
    const timeline = buildDeliveryTimeline(result.passed);

    for (let i = 0; i < timeline.length; i++) {
      await new Promise((r) => setTimeout(r, 700));
      set({
        delivery: timeline.slice(0, i + 1).map((e, idx) => ({
          ...e,
          status:
            idx < i
              ? e.status === "fail"
                ? "fail"
                : "success"
              : e.status,
        })),
      });
    }

    set({
      passed: result.passed,
      feedback: result.feedback,
      isRunning: false,
      graph: result.passed
        ? {
            ...graph,
            health: result.newHealth,
            nodes: graph.nodes.map((n) => ({ ...n, status: "healthy" })),
          }
        : graph,
    });
  },
}));

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}
