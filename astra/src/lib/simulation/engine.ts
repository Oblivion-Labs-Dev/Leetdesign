import type {
  ComponentType,
  PipelineGraph,
  ScenarioDefinition,
  SystemHealth,
} from "@/types";

export interface SimulationResult {
  passed: boolean;
  newHealth: SystemHealth;
  matchedSolutionId?: string;
  feedback: string;
  metricsDelta: {
    latencyMs: number;
    errorRate: number;
  };
}

/**
 * Deterministic evaluation: given a scenario and a current pipeline graph
 * (with the user's component placements), decide whether the system stabilizes.
 *
 * This is intentionally simple in MVP — it matches the user's placements
 * against the scenario's acceptable solutions.
 */
export function evaluateScenario(
  scenario: ScenarioDefinition,
  graph: PipelineGraph,
): SimulationResult {
  const placedTypeBySlot: Record<string, ComponentType> = {};
  for (const node of graph.nodes) {
    const startingNode = scenario.startingGraph.nodes.find(
      (n) => n.id === node.id,
    );
    if (startingNode?.isMissingSlot && !node.isMissingSlot) {
      placedTypeBySlot[node.id] = node.type;
    }
  }

  for (const sol of scenario.acceptableSolutions) {
    const allMatched = Object.entries(sol.placements).every(
      ([slotId, requiredType]) => placedTypeBySlot[slotId] === requiredType,
    );
    if (allMatched) {
      return {
        passed: true,
        newHealth: "healthy",
        matchedSolutionId: sol.id,
        feedback:
          "Pipeline stabilized. Cache absorbs hot keys, DB load drops, p95 latency back under target.",
        metricsDelta: { latencyMs: -1080, errorRate: -0.04 },
      };
    }
  }

  return {
    passed: false,
    newHealth: "degraded",
    feedback:
      "The selected components do not stabilize the system. Re-read the symptoms and try a component that absorbs read load.",
    metricsDelta: { latencyMs: 0, errorRate: 0 },
  };
}
