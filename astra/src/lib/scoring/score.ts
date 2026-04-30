import type {
  ArchitectureSnapshot,
  PracticeExercise,
  ReviewVerdict,
  ScoreBreakdown,
} from "@/types";

const WEIGHTS = {
  correctness: 0.4,
  reliability: 0.25,
  scalability: 0.2,
  cost: 0.1,
  clarity: 0.05,
} as const;

/**
 * Lightweight rubric-based scoring used as a fallback when the AI judge
 * is unavailable. Always returns a deterministic verdict so users get
 * fast feedback during development. Considers both the components placed
 * AND the connections drawn between them, so an unconnected pile of nodes
 * scores worse than a wired-up architecture.
 */
export function localFallbackScore(
  exercise: PracticeExercise,
  snapshot: ArchitectureSnapshot,
): ReviewVerdict {
  const types = new Set(snapshot.nodes.map((n) => n.type));
  const has = (t: string) => types.has(t as never);

  // Are the placed nodes actually wired together?
  const connectedIds = new Set<string>();
  for (const e of snapshot.edges) {
    connectedIds.add(e.source);
    connectedIds.add(e.target);
  }
  const totalNodes = snapshot.nodes.length;
  const wiredFraction =
    totalNodes === 0 ? 0 : connectedIds.size / totalNodes;
  const minWiringDensity =
    totalNodes <= 1 ? 0 : snapshot.edges.length / Math.max(1, totalNodes - 1);

  // Component coverage — same buckets as before but slightly rebalanced.
  const componentCoverage = clamp(
    (has("client") ? 0.18 : 0) +
      (has("api_gateway") ? 0.18 : 0) +
      (has("service") ? 0.18 : 0) +
      (has("database") ? 0.18 : 0) +
      (has("cache") ? 0.14 : 0) +
      (has("load_balancer") ? 0.14 : 0),
  );

  // Correctness penalises a disconnected design heavily — if you never drew
  // any arrows, even a perfect bag of components scores poorly.
  const correctness = clamp(
    componentCoverage * 0.6 +
      wiredFraction * 0.3 +
      Math.min(1, minWiringDensity) * 0.1,
  );

  const reliability = clamp(
    (has("load_balancer") ? 0.35 : 0) +
      (has("monitor") ? 0.3 : 0) +
      (has("message_queue") ? 0.25 : 0) +
      (has("auth") ? 0.1 : 0),
  );
  const scalability = clamp(
    (has("cdn") ? 0.35 : 0) +
      (has("cache") ? 0.25 : 0) +
      (has("stream") ? 0.25 : 0) +
      (has("worker") ? 0.15 : 0),
  );
  const cost = clamp(
    (totalNodes <= 10 ? 0.55 : 0.25) +
      (has("object_store") ? 0.2 : 0) +
      (has("cache") ? 0.15 : 0) +
      (has("cdn") ? 0.1 : 0),
  );
  const clarity = clamp(
    (snapshot.notes && snapshot.notes.length > 30 ? 0.6 : 0.25) +
      wiredFraction * 0.4,
  );

  const total =
    correctness * WEIGHTS.correctness +
    reliability * WEIGHTS.reliability +
    scalability * WEIGHTS.scalability +
    cost * WEIGHTS.cost +
    clarity * WEIGHTS.clarity;

  const score: ScoreBreakdown = {
    correctness: round(correctness * 100),
    reliability: round(reliability * 100),
    scalability: round(scalability * 100),
    cost: round(cost * 100),
    clarity: round(clarity * 100),
    total: round(total * 100),
  };

  const strengths: string[] = [];
  if (has("cache")) strengths.push("Good use of caching for hot reads.");
  if (has("load_balancer"))
    strengths.push("Load balancing in place for horizontal scale.");
  if (has("message_queue"))
    strengths.push("Async pipeline isolates spiky workloads.");
  if (snapshot.edges.length >= totalNodes - 1 && totalNodes >= 3)
    strengths.push("Components are wired into a coherent flow.");

  const gaps: string[] = [];
  if (!has("monitor")) gaps.push("No monitoring layer — observability gap.");
  if (!has("cdn"))
    gaps.push("Missing CDN for global low-latency static delivery.");
  if (!has("auth"))
    gaps.push("No auth boundary — required when users or partners are involved.");
  if (totalNodes >= 2 && snapshot.edges.length === 0)
    gaps.push(
      "No connections drawn — interviewers expect arrows between components.",
    );
  if (totalNodes >= 2 && wiredFraction < 0.6)
    gaps.push(
      "Several components are floating. Connect them so the request path is obvious.",
    );

  return {
    passed: score.total >= 65,
    score,
    strengths,
    gaps,
    recommendedNext: exercise.id,
  };
}

function clamp(n: number) {
  return Math.max(0, Math.min(1, n));
}
function round(n: number) {
  return Math.round(n);
}
