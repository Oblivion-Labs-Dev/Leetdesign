import type { SimDesign } from "./types";
import type { RuntimeMetrics } from "./types";
import { COMPONENT_REGISTRY } from "./component-registry";
import { buildAdjacency } from "./topology";

export interface ClientInsight {
  severity: "info" | "warning" | "critical";
  message: string;
  suggestion: string;
}

/** Pressure → symptom → why → suggested action */
export function computeClientInsight(
  design: SimDesign,
  clientId: string,
  metrics: Record<string, RuntimeMetrics>,
): ClientInsight | null {
  const { outEdges } = buildAdjacency(design);
  const queue = [...(outEdges.get(clientId) ?? [])];
  const visited = new Set<string>();
  let maxUtil = 0;
  let bottleneckLabel = "";
  let maxError = 0;
  let hasArchError = false;

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const node = design.nodes.find((n) => n.id === id);
    const m = metrics[id];
    if (!node || !m) continue;

    const def = COMPONENT_REGISTRY[node.type];
    if (def.routingBehavior === "none") continue;

    if (m.errorRate >= 0.99 && m.diagnosisReason?.includes("Architecture")) {
      hasArchError = true;
    }

    if (!def.isTrafficSource) {
      if (m.utilizationPercent > maxUtil) {
        maxUtil = m.utilizationPercent;
        bottleneckLabel = node.label;
      }
      if (m.errorRate > maxError) maxError = m.errorRate;
    }

    for (const next of outEdges.get(id) ?? []) {
      if (!visited.has(next)) queue.push(next);
    }
  }

  if (hasArchError) return null;

  if (maxError > 0.05) {
    return {
      severity: "critical",
      message: "Some users are timing out because the system is overloaded.",
      suggestion: bottleneckLabel
        ? `Scale ${bottleneckLabel} or add a Load Balancer with more instances to distribute traffic.`
        : "Add a Load Balancer and more app instances to handle the incoming request volume.",
    };
  }

  if (maxUtil >= 100) {
    return {
      severity: "critical",
      message: `${bottleneckLabel || "A downstream service"} cannot process requests as quickly as they arrive. Requests are waiting, which increases user-visible latency.`,
      suggestion: "Add a Load Balancer and another Web App instance to distribute traffic.",
    };
  }

  if (maxUtil >= 90) {
    return {
      severity: "warning",
      message: `${bottleneckLabel || "Your app tier"} is approaching capacity. Response times may become unstable during spikes.`,
      suggestion: "Plan to scale horizontally before traffic grows further.",
    };
  }

  if (maxUtil >= 70) {
    return {
      severity: "info",
      message: "Traffic is increasing. Your system is still handling requests, but headroom is shrinking.",
      suggestion: "Watch P95 response time — consider caching or scaling if it keeps rising.",
    };
  }

  return null;
}
