import type { SimDesign, SimComponentType } from "./types";
import { createDesign } from "./types";
import { TEMPLATES } from "./templates";
import { COMPONENT_REGISTRY } from "./component-registry";
import { createCourseDesign } from "./course-store";

export type ProjectKind = "guided" | "challenge" | "free";

export interface GuidedCourse {
  id: string;
  templateId: string;
  title: string;
  description: string;
  steps: number;
  duration: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
}

export interface ChallengeCheck {
  id: string;
  label: string;
  hint: string;
  check: (design: SimDesign) => boolean;
}

export interface DesignChallenge {
  id: string;
  title: string;
  description: string;
  brief: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  checks: ChallengeCheck[];
  /** Optional starter components (type + label) */
  starters?: { type: SimComponentType; label: string; x: number; y: number }[];
}

export const GUIDED_COURSES: GuidedCourse[] = [
  {
    id: "store-growth",
    templateId: "store-growth",
    title: "Build a Store That Survives Growth",
    description:
      "Start with a simple monolith and evolve the architecture as traffic, features, and incidents demand — one component at a time.",
    steps: 8,
    duration: "~90 min",
    difficulty: "Beginner",
  },
];

export const DESIGN_CHALLENGES: DesignChallenge[] = [
  {
    id: "url-shortener",
    title: "Design a URL Shortener",
    description: "Build Tiny.link — redirect billions of URLs with low latency reads.",
    brief: "100M daily users, reads >> writes, analytics on click events.",
    difficulty: "Intermediate",
    starters: [{ type: "client", label: "Users", x: 80, y: 280 }],
    checks: [
      {
        id: "has-gateway",
        label: "Traffic enters through a gateway or load balancer",
        hint: "Add a Load Balancer or API Gateway between clients and services.",
        check: (d) => d.nodes.some((n) => n.type === "load_balancer" || n.type === "api_gateway"),
      },
      {
        id: "has-cache",
        label: "Hot URLs are cached",
        hint: "Add Redis or CDN in front of the database for read-heavy traffic.",
        check: (d) => d.nodes.some((n) => n.type === "redis_cache" || n.type === "cdn"),
      },
      {
        id: "has-db",
        label: "Persistent storage for URL mappings",
        hint: "Add a SQL or NoSQL database for durable storage.",
        check: (d) => d.nodes.some((n) => n.type === "sql_database" || n.type === "nosql_database"),
      },
      {
        id: "connected-path",
        label: "Client connects to at least 3 downstream components",
        hint: "Wire the request path: client → edge → service → storage.",
        check: (d) => {
          const client = d.nodes.find((n) => n.type === "client");
          if (!client) return false;
          const visited = new Set<string>();
          const queue = [client.id];
          while (queue.length) {
            const id = queue.shift()!;
            if (visited.has(id)) continue;
            visited.add(id);
            for (const e of d.edges) {
              if (e.source === id) queue.push(e.target);
            }
          }
          return visited.size >= 4;
        },
      },
      {
        id: "min-components",
        label: "At least 6 components on the canvas",
        hint: "A production URL shortener needs edge, compute, cache, DB, and async analytics.",
        check: (d) => d.nodes.length >= 6,
      },
    ],
  },
  {
    id: "realtime-chat",
    title: "Design Real-Time Chat",
    description: "WhatsApp-scale messaging with delivery, presence, and push notifications.",
    brief: "50M concurrent connections, sub-100ms message delivery, offline push.",
    difficulty: "Advanced",
    starters: [{ type: "client", label: "Chat Users", x: 80, y: 280 }],
    checks: [
      {
        id: "has-websocket",
        label: "Real-time delivery channel",
        hint: "Add a WebSocket Server for live message push.",
        check: (d) => d.nodes.some((n) => n.type === "websocket_server"),
      },
      {
        id: "has-message-store",
        label: "Message persistence",
        hint: "Add a NoSQL or SQL database for message history.",
        check: (d) => d.nodes.some((n) => n.type === "nosql_database" || n.type === "sql_database"),
      },
      {
        id: "has-async",
        label: "Async path for notifications",
        hint: "Use a message queue or event bus for push notifications.",
        check: (d) =>
          d.nodes.some((n) =>
            ["message_queue", "event_bus", "pub_sub", "notification_service"].includes(n.type),
          ),
      },
      {
        id: "has-services",
        label: "At least 2 application services",
        hint: "Split auth, messaging, and presence into separate services.",
        check: (d) => d.nodes.filter((n) => n.type === "app_server").length >= 2,
      },
      {
        id: "min-edges",
        label: "At least 8 connections wired",
        hint: "Connect client → gateway → services → storage → async pipeline.",
        check: (d) => d.edges.length >= 8,
      },
    ],
  },
  {
    id: "rate-limiter",
    title: "Design a Rate Limiter",
    description: "Protect APIs from abuse with token bucket or sliding window limiting.",
    brief: "10k RPS per tenant, burst allowance, distributed enforcement.",
    difficulty: "Beginner",
    starters: [
      { type: "client", label: "API Clients", x: 80, y: 280 },
      { type: "api_gateway", label: "API Gateway", x: 420, y: 280 },
    ],
    checks: [
      {
        id: "has-rate-limiter",
        label: "Dedicated rate limiting component",
        hint: "Add a Rate Limiter or configure limits on the API Gateway.",
        check: (d) => d.nodes.some((n) => n.type === "rate_limiter" || n.type === "api_gateway"),
      },
      {
        id: "has-cache",
        label: "Shared counter store",
        hint: "Distributed rate limits need Redis or similar for token counts.",
        check: (d) => d.nodes.some((n) => n.type === "redis_cache" || n.type === "distributed_cache"),
      },
      {
        id: "has-backend",
        label: "Protected backend service",
        hint: "Add an app server behind the limiter.",
        check: (d) => d.nodes.some((n) => n.type === "app_server"),
      },
      {
        id: "wired-path",
        label: "Client → limiter → service path exists",
        hint: "Wire connections so traffic flows through the limiter.",
        check: (d) => d.edges.length >= 3,
      },
    ],
  },
];

export function createGuidedDesign(courseId: string): SimDesign | null {
  if (courseId === "store-growth") {
    return createCourseDesign(courseId);
  }
  const course = GUIDED_COURSES.find((c) => c.id === courseId);
  if (!course) return null;
  const tmpl = TEMPLATES.find((t) => t.id === course.templateId);
  if (!tmpl) return null;
  const design = tmpl.create();
  return { ...design, projectKind: "guided", scenarioId: design.scenarioId };
}

export function createChallengeDesign(challengeId: string): SimDesign | null {
  const challenge = DESIGN_CHALLENGES.find((c) => c.id === challengeId);
  if (!challenge) return null;

  const design = createDesign(challenge.title, challenge.description);
  design.projectKind = "challenge";
  design.challengeId = challengeId;

  if (challenge.starters) {
    design.nodes = challenge.starters.map((s) => ({
      id: `${s.type}_${Math.random().toString(36).slice(2, 9)}`,
      type: s.type,
      label: s.label,
      position: { x: s.x, y: s.y },
      config: { ...COMPONENT_REGISTRY[s.type].defaultConfig },
    }));
  }

  return design;
}

export function getChallengeById(id: string): DesignChallenge | null {
  return DESIGN_CHALLENGES.find((c) => c.id === id) ?? null;
}

export interface CheckResult {
  id: string;
  label: string;
  hint: string;
  passed: boolean;
}

export function validateChallenge(design: SimDesign): CheckResult[] {
  if (!design.challengeId) return [];
  const challenge = getChallengeById(design.challengeId);
  if (!challenge) return [];
  return challenge.checks.map((c) => ({
    id: c.id,
    label: c.label,
    hint: c.hint,
    passed: c.check(design),
  }));
}

export function challengeScore(results: CheckResult[]): { passed: number; total: number; complete: boolean } {
  const passed = results.filter((r) => r.passed).length;
  return { passed, total: results.length, complete: passed === results.length && results.length > 0 };
}
