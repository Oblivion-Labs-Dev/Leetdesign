import type { SimDesign } from "./types";
import { COMPONENT_REGISTRY } from "./component-registry";

export function buildAdjacency(design: SimDesign) {
  const outEdges = new Map<string, string[]>();
  const inEdges = new Map<string, string[]>();
  const edgeByPair = new Map<string, string>();

  for (const e of design.edges) {
    if (!outEdges.has(e.source)) outEdges.set(e.source, []);
    outEdges.get(e.source)!.push(e.target);
    if (!inEdges.has(e.target)) inEdges.set(e.target, []);
    inEdges.get(e.target)!.push(e.source);
    edgeByPair.set(`${e.source}->${e.target}`, e.id);
  }

  return { outEdges, inEdges, edgeByPair };
}

/** All nodes and edges downstream of a root (blast radius). */
export function computeBlastRadius(
  design: SimDesign,
  rootIds: string[],
): { nodeIds: string[]; edgeIds: string[] } {
  const { outEdges, edgeByPair } = buildAdjacency(design);
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  const queue = [...rootIds];

  while (queue.length > 0) {
    const id = queue.shift()!;
    for (const target of outEdges.get(id) ?? []) {
      const eid = edgeByPair.get(`${id}->${target}`);
      if (eid) edgeIds.add(eid);
      if (!nodeIds.has(target)) {
        nodeIds.add(target);
        queue.push(target);
      }
    }
  }

  return { nodeIds: [...nodeIds], edgeIds: [...edgeIds] };
}

const TRACE_PREFER_LABELS = [
  "Load Balancer",
  "API Gateway",
  "Product Service",
  "Product Cache",
  "Product DB",
];

/** Greedy walk from traffic source — good default path for teaching. */
export function findPrimaryTracePath(design: SimDesign): {
  nodeIds: string[];
  edgeIds: string[];
} {
  const source = design.nodes.find((n) => COMPONENT_REGISTRY[n.type].isTrafficSource);
  if (!source) return { nodeIds: [], edgeIds: [] };

  const { outEdges, edgeByPair } = buildAdjacency(design);
  const nodeIds: string[] = [source.id];
  const edgeIds: string[] = [];
  const visited = new Set<string>([source.id]);
  let current = source.id;

  while (true) {
    const neighbors = (outEdges.get(current) ?? []).filter((n) => !visited.has(n));
    if (neighbors.length === 0) break;

    let next = neighbors[0];
    for (const pref of TRACE_PREFER_LABELS) {
      const match = neighbors.find((nid) => {
        const node = design.nodes.find((n) => n.id === nid);
        return node?.label.includes(pref);
      });
      if (match) {
        next = match;
        break;
      }
    }

    const eid = edgeByPair.get(`${current}->${next}`);
    if (!eid) break;
    edgeIds.push(eid);
    visited.add(next);
    nodeIds.push(next);
    current = next;
  }

  return { nodeIds, edgeIds };
}

export function matchesScenarioDesign(design: SimDesign, templateIds: string[]): boolean {
  if (design.scenarioId) return templateIds.some((t) => design.scenarioId === t);
  const name = design.name.toLowerCase();
  return templateIds.some((t) => {
    if (t === "ecommerce") return name.includes("e-commerce") || name.includes("ecommerce");
    return false;
  });
}
