import type { ScenarioDefinition } from "@/types";

export const SCENARIOS: Record<string, ScenarioDefinition> = {
  "url-shortener-traffic-spike": {
    id: "url-shortener-traffic-spike",
    projectId: "url-shortener",
    title: "Incident: shortlinks slowing the world",
    objective:
      "Stabilize the redirect path so latency stays under 120ms during a 10x traffic spike.",
    storyline:
      "Tiny.link just got featured by a creator with 12M followers. Redirect latency jumped from 80ms to 1.2s and our database is melting under read load. Your team needs you to ship a fix before the on-call rotation rotates again.",
    incident: {
      title: "Redirect path is saturated",
      botMessage:
        "We are getting 10x normal traffic on /r/* and the database read CPU is at 96%. The redirect path has no caching layer and one of our regions is dropping requests. We need a fix before the next CDN refresh.",
      severity: "high",
      symptoms: [
        "p95 latency jumped from 80ms to 1.2s",
        "Database CPU pegged at 96%",
        "5xx error rate climbing past 4%",
      ],
    },
    startingGraph: {
      health: "failing",
      nodes: [
        {
          id: "client",
          type: "client",
          label: "User Browser",
          status: "healthy",
        },
        {
          id: "gateway",
          type: "api_gateway",
          label: "Edge Gateway",
          status: "degraded",
          metrics: { rps: 18000, latencyMs: 1200, errorRate: 0.04 },
        },
        {
          id: "missing-cache",
          type: "cache",
          label: "Missing component",
          status: "down",
          isMissingSlot: true,
          acceptedTypes: ["cache"],
        },
        {
          id: "redirect-svc",
          type: "service",
          label: "Redirect Service",
          status: "degraded",
          metrics: { rps: 18000, latencyMs: 980, errorRate: 0.03 },
        },
        {
          id: "db",
          type: "database",
          label: "Primary DB",
          status: "failing",
          metrics: { rps: 17500, latencyMs: 760, errorRate: 0.06 },
        },
      ],
      edges: [
        { id: "e1", source: "client", target: "gateway", protocol: "http" },
        {
          id: "e2",
          source: "gateway",
          target: "missing-cache",
          protocol: "http",
        },
        {
          id: "e3",
          source: "missing-cache",
          target: "redirect-svc",
          protocol: "http",
        },
        { id: "e4", source: "redirect-svc", target: "db", protocol: "tcp" },
      ],
    },
    inventory: [
      "cache",
      "load_balancer",
      "message_queue",
      "cdn",
      "search",
      "object_store",
    ],
    acceptableSolutions: [
      {
        id: "cache-in-front",
        description:
          "Place a read-through cache between the gateway and the redirect service to absorb hot keys.",
        placements: { "missing-cache": "cache" },
      },
    ],
    rewardXp: 120,
    rewardCurrency: 50,
  },
};

export function getScenario(id: string): ScenarioDefinition | undefined {
  return SCENARIOS[id];
}
