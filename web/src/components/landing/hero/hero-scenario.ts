import {
  Database,
  HardDriveDownload,
  Network,
  Shield,
  Server,
  ShieldCheck,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type Phase =
  | "problem"
  | "drag"
  | "place"
  | "connect"
  | "simulate"
  | "insight"
  | "reset";

export type NodeStatus = "healthy" | "degraded";

export type HeroNodeDef = {
  id: string;
  x: number;
  y: number;
  label: string;
  type: string;
  icon: LucideIcon;
  status: NodeStatus;
  latency: number;
};

export type HeroInventoryItem = {
  id: string;
  label: string;
  type: string;
  icon: LucideIcon;
  recommended: boolean;
};

/** Shared coordinate system — nodes + SVG share these values */
export const VB = { w: 860, h: 320 };
export const NW = 84;

const TOP_Y = 96;
const BRANCH_Y = 228;

export const CLIENT: HeroNodeDef = {
  id: "client",
  x: 70,
  y: TOP_Y,
  label: "Client",
  type: "client",
  icon: Users,
  status: "healthy",
  latency: 12,
};

export const GATEWAY: HeroNodeDef = {
  id: "gateway",
  x: 210,
  y: TOP_Y,
  label: "API Gateway",
  type: "api_gateway",
  icon: ShieldCheck,
  status: "healthy",
  latency: 16,
};

export const AUTH: HeroNodeDef = {
  id: "auth",
  x: 350,
  y: TOP_Y,
  label: "Auth",
  type: "auth",
  icon: Shield,
  status: "healthy",
  latency: 18,
};

export const SERVICE: HeroNodeDef = {
  id: "service",
  x: 490,
  y: TOP_Y,
  label: "Service",
  type: "service",
  icon: Server,
  status: "healthy",
  latency: 21,
};

export const SLOT_POS = { x: 498, y: BRANCH_Y };

export const CACHE: HeroNodeDef = {
  id: "cache",
  x: SLOT_POS.x,
  y: SLOT_POS.y,
  label: "Cache",
  type: "cache",
  icon: Zap,
  status: "healthy",
  latency: 3,
};

export const DB: HeroNodeDef = {
  id: "db",
  x: 780,
  y: TOP_Y,
  label: "Database",
  type: "database",
  icon: Database,
  status: "degraded",
  latency: 52,
};

export const QUEUE: HeroNodeDef = {
  id: "queue",
  x: 640,
  y: BRANCH_Y,
  label: "Queue",
  type: "message_queue",
  icon: HardDriveDownload,
  status: "healthy",
  latency: 14,
};

export const WORKER: HeroNodeDef = {
  id: "worker",
  x: 780,
  y: BRANCH_Y,
  label: "Worker",
  type: "background_worker",
  icon: Server,
  status: "healthy",
  latency: 17,
};

export const BASE_NODES: HeroNodeDef[] = [CLIENT, GATEWAY, AUTH, SERVICE, QUEUE, WORKER, DB];

export const INVENTORY_ITEMS: HeroInventoryItem[] = [
  { id: "cache", label: "Cache", type: "cache", icon: Zap, recommended: true },
  { id: "ratelimiter", label: "Rate Limiter", type: "api_control", icon: ShieldCheck, recommended: false },
  { id: "queue", label: "Queue", type: "message_queue", icon: HardDriveDownload, recommended: false },
  { id: "gateway", label: "Gateway", type: "load_balancer", icon: Network, recommended: false },
];

/** Straight horizontal edge between same-Y nodes */
export function edgeH(ax: number, ay: number, bx: number, by: number) {
  return `M ${ax + NW / 2} ${ay} L ${bx - NW / 2} ${by}`;
}

/** Smoothstep cubic bezier for branch connections at different Y */
export function edgeSmooth(ax: number, ay: number, bx: number, by: number) {
  const x1 = ax + NW / 2;
  const x2 = bx - NW / 2;
  if (Math.abs(ay - by) < 2) return `M ${x1} ${ay} L ${x2} ${by}`;
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${ay} C ${mx} ${ay}, ${mx} ${by}, ${x2} ${by}`;
}

/** CSS percentage position for NodeAnchor */
export function nodePos(x: number, y: number) {
  return {
    left: `${(x / VB.w) * 100}%`,
    top: `${(y / VB.h) * 100}%`,
  };
}

/** Continuous flow path for slow (direct Service→DB) animateMotion */
export const SLOW_FLOW_PATH = `M ${CLIENT.x + NW / 2} ${TOP_Y} L ${DB.x - NW / 2} ${TOP_Y}`;

/** Continuous flow path for fast (through Cache branch) animateMotion */
export const FAST_FLOW_PATH = (() => {
  const svcR = SERVICE.x + NW / 2;
  const cacheL = CACHE.x - NW / 2;
  const cacheR = CACHE.x + NW / 2;
  const dbL = DB.x - NW / 2;
  const m1 = (svcR + cacheL) / 2;
  const m2 = (cacheR + dbL) / 2;
  return [
    `M ${CLIENT.x + NW / 2} ${TOP_Y}`,
    `L ${svcR} ${TOP_Y}`,
    `C ${m1} ${TOP_Y}, ${m1} ${BRANCH_Y}, ${cacheL} ${BRANCH_Y}`,
    `L ${cacheR} ${BRANCH_Y}`,
    `C ${m2} ${BRANCH_Y}, ${m2} ${TOP_Y}, ${dbL} ${TOP_Y}`,
  ].join(" ");
})();

export const ASYNC_FLOW_PATH = (() => {
  const svcR = SERVICE.x + NW / 2;
  const queueL = QUEUE.x - NW / 2;
  const queueR = QUEUE.x + NW / 2;
  const workerL = WORKER.x - NW / 2;
  return [
    `M ${svcR} ${TOP_Y}`,
    `C ${svcR + 40} ${TOP_Y}, ${queueL - 30} ${BRANCH_Y}, ${queueL} ${BRANCH_Y}`,
    `L ${queueR} ${BRANCH_Y}`,
    `L ${workerL} ${BRANCH_Y}`,
  ].join(" ");
})();

export const LOOP_MS = 11000;

export const SIM_LOGS = [
  "GET /feed \u2192 cache hit (3ms)",
  "GET /profile \u2192 auth + cache hit (5ms)",
  "POST /feed \u2192 enqueue job \u2192 worker ack",
  "GET /search \u2192 database miss fallback",
];
