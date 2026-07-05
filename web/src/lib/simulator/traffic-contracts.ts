/**
 * Architecture validation via traffic envelopes, roles, and protocols.
 * @see docs/TRAFFIC-CONTRACTS.md
 */
import type { EdgeProtocol, SimComponentType, SimDesign, SimNode } from "./types";
import { COMPONENT_REGISTRY } from "./component-registry";

/** What kind of work crosses a connection */
export type TrafficEnvelope =
  | "user_http"
  | "internal_rpc"
  | "db_query"
  | "cache_op"
  | "object_io"
  | "search_query"
  | "async_event";

export type NodeTrafficRole =
  | "origin"
  | "ingress"
  | "compute"
  | "persistence"
  | "cache"
  | "async"
  | "sidecar"
  | "infra";

export type ViolationSeverity = "error" | "warning";

export interface ArchitectureViolation {
  edgeId: string;
  sourceId: string;
  targetId: string;
  severity: ViolationSeverity;
  code: string;
  message: string;
  suggestion: string;
}

export interface HopValidation {
  valid: boolean;
  severity: ViolationSeverity;
  code: string;
  message: string;
  suggestion: string;
}

const OK: HopValidation = {
  valid: true,
  severity: "warning",
  code: "",
  message: "",
  suggestion: "",
};

function fail(
  code: string,
  message: string,
  suggestion: string,
  severity: ViolationSeverity = "error",
): HopValidation {
  return { valid: false, severity, code, message, suggestion };
}

const PERSISTENCE: ReadonlySet<SimComponentType> = new Set([
  "sql_database",
  "nosql_database",
  "graph_database",
  "time_series_db",
  "data_warehouse",
  "data_lake",
]);

const CACHE: ReadonlySet<SimComponentType> = new Set([
  "redis_cache",
  "local_cache",
  "distributed_cache",
]);

const ASYNC: ReadonlySet<SimComponentType> = new Set([
  "message_queue",
  "event_bus",
  "pub_sub",
]);

const INGRESS: ReadonlySet<SimComponentType> = new Set([
  "load_balancer",
  "api_gateway",
  "reverse_proxy",
  "rate_limiter",
  "firewall",
  "cdn",
]);

const COMPUTE: ReadonlySet<SimComponentType> = new Set([
  "app_server",
  "web_server",
  "stream_processor",
  "notification_service",
  "websocket_server",
]);

const SIDECAR: ReadonlySet<SimComponentType> = new Set([
  "metrics_collector",
  "log_aggregator",
  "distributed_tracing",
  "alerting",
  "health_check",
  "status_page",
]);

const INFRA: ReadonlySet<SimComponentType> = new Set([
  "dns",
  "service_mesh",
  "kubernetes",
  "secrets_manager",
  "service_registry",
]);

const ROLE: Record<SimComponentType, NodeTrafficRole> = {
  client: "origin",
  load_balancer: "ingress",
  api_gateway: "ingress",
  reverse_proxy: "ingress",
  rate_limiter: "ingress",
  firewall: "ingress",
  cdn: "ingress",
  web_server: "compute",
  app_server: "compute",
  stream_processor: "compute",
  notification_service: "compute",
  websocket_server: "compute",
  sql_database: "persistence",
  nosql_database: "persistence",
  graph_database: "persistence",
  time_series_db: "persistence",
  data_warehouse: "persistence",
  data_lake: "persistence",
  object_storage: "persistence",
  search_index: "persistence",
  redis_cache: "cache",
  local_cache: "cache",
  distributed_cache: "cache",
  message_queue: "async",
  event_bus: "async",
  pub_sub: "async",
  dns: "infra",
  service_mesh: "infra",
  kubernetes: "infra",
  secrets_manager: "infra",
  service_registry: "infra",
  metrics_collector: "sidecar",
  log_aggregator: "sidecar",
  distributed_tracing: "sidecar",
  alerting: "sidecar",
  health_check: "sidecar",
  status_page: "sidecar",
};

export function getTrafficRole(type: SimComponentType): NodeTrafficRole {
  return ROLE[type];
}

/** What the source emits toward this specific target */
export function resolveOutboundEnvelope(
  sourceType: SimComponentType,
  targetType: SimComponentType,
): TrafficEnvelope {
  if (sourceType === "client") return "user_http";

  if (CACHE.has(targetType)) return "cache_op";
  if (PERSISTENCE.has(targetType)) {
    if (targetType === "object_storage") return "object_io";
    if (targetType === "search_index") return "search_query";
    return "db_query";
  }
  if (ASYNC.has(targetType)) return "async_event";

  if (sourceType === "cdn" && targetType === "object_storage") return "object_io";
  if (ASYNC.has(sourceType) && COMPUTE.has(targetType)) return "async_event";

  if (INGRESS.has(sourceType)) return "user_http";
  if (COMPUTE.has(sourceType)) return "internal_rpc";

  return "internal_rpc";
}

const ENVELOPE_LABEL: Record<TrafficEnvelope, string> = {
  user_http: "HTTP user requests",
  internal_rpc: "internal service calls",
  cache_op: "cache commands",
  db_query: "database queries",
  object_io: "object storage I/O",
  search_query: "search queries",
  async_event: "async messages",
};

function acceptsProtocol(
  envelope: TrafficEnvelope,
  protocol: EdgeProtocol,
  targetType: SimComponentType,
): string | null {
  if (PERSISTENCE.has(targetType) && targetType !== "object_storage") {
    if (protocol !== "tcp") {
      return `Use TCP (driver protocol) for ${COMPONENT_REGISTRY[targetType].label}, not ${protocol.toUpperCase()}`;
    }
  }
  if (CACHE.has(targetType) && protocol !== "tcp") {
    return `Cache nodes expect TCP (Redis/Memcached protocol), not ${protocol.toUpperCase()}`;
  }
  if (ASYNC.has(targetType) && protocol !== "async") {
    return `Message brokers expect async/event protocol, not ${protocol.toUpperCase()}`;
  }
  if (envelope === "user_http" && protocol === "tcp") {
    return "User-facing traffic typically uses HTTP, gRPC, or WebSocket — not raw TCP";
  }
  if (targetType === "websocket_server" && protocol !== "websocket" && protocol !== "http") {
    return "WebSocket servers expect WebSocket or HTTP upgrade, not " + protocol.toUpperCase();
  }
  return null;
}

export function validateHop(
  source: SimNode,
  target: SimNode,
  protocol: EdgeProtocol,
): HopValidation {
  const sourceRole = getTrafficRole(source.type);
  const targetRole = getTrafficRole(target.type);
  const envelope = resolveOutboundEnvelope(source.type, target.type);
  const envLabel = ENVELOPE_LABEL[envelope];

  if (targetRole === "origin") {
    return fail(
      "reverse_flow",
      "Clients don't receive inbound request connections.",
      "Wire outbound from Client toward your entry point (Load Balancer, API Gateway, or App Server).",
    );
  }

  const protocolIssue = acceptsProtocol(envelope, protocol, target.type);
  if (protocolIssue) {
    return fail("protocol_mismatch", protocolIssue, "Change the connection protocol or insert the correct middle tier.");
  }

  if (SIDECAR.has(target.type) || INFRA.has(target.type)) {
    return fail(
      "not_in_request_path",
      `${COMPONENT_REGISTRY[target.type].label} is ${targetRole === "sidecar" ? "observability" : "infrastructure"} — it doesn't serve user requests on this path.`,
      "Keep observability and infra off the main request chain, or connect them as side channels later.",
    );
  }

  // ── Origin (Client) ──────────────────────────────────────────────
  if (sourceRole === "origin") {
    if (PERSISTENCE.has(target.type) || CACHE.has(target.type)) {
      return fail(
        "client_to_data",
        `Clients send ${envLabel}; ${COMPONENT_REGISTRY[target.type].label} expects backend calls from an application server.`,
        "Route Client → App Server (or API Gateway) → data tier.",
      );
    }
    if (ASYNC.has(target.type)) {
      return fail(
        "client_to_async",
        "Clients don't publish directly to message brokers.",
        "Use App Server → Message Queue for async work.",
      );
    }
    if (COMPUTE.has(target.type) || INGRESS.has(target.type) || target.type === "websocket_server") {
      if (source.type === "client" && COMPUTE.has(target.type) && !INGRESS.has(target.type)) {
        return {
          valid: true,
          severity: "warning",
          code: "direct_to_compute",
          message: "Client connects directly to compute — valid for monoliths/APIs, but no edge load balancing.",
          suggestion: "Consider Load Balancer or API Gateway in front as traffic grows.",
        };
      }
      return OK;
    }
    return fail(
      "unsupported_target",
      `Client cannot send ${envLabel} to ${COMPONENT_REGISTRY[target.type].label}.`,
      "Connect Client to an entry point: Load Balancer, API Gateway, CDN, Web/App Server.",
    );
  }

  // ── Ingress ────────────────────────────────────────────────────
  if (sourceRole === "ingress") {
    if (PERSISTENCE.has(target.type) || CACHE.has(target.type) || ASYNC.has(target.type)) {
      return fail(
        "ingress_to_data",
        `${COMPONENT_REGISTRY[source.type].label} forwards user traffic — it shouldn't connect directly to ${COMPONENT_REGISTRY[target.type].label}.`,
        "Insert an App Server between the edge and data/async tiers.",
      );
    }
    if (COMPUTE.has(target.type) || INGRESS.has(target.type)) {
      return OK;
    }
    return fail(
      "ingress_target",
      `${COMPONENT_REGISTRY[source.type].label} should forward to compute or another ingress node.`,
      "Wire to Web Server, App Server, or another edge component.",
    );
  }

  // ── Compute ────────────────────────────────────────────────────
  if (sourceRole === "compute") {
    if (PERSISTENCE.has(target.type) || CACHE.has(target.type) || ASYNC.has(target.type)) {
      return OK;
    }
    if (COMPUTE.has(target.type) || INGRESS.has(target.type)) {
      return OK;
    }
    return fail(
      "compute_target",
      `${COMPONENT_REGISTRY[source.type].label} can't reach ${COMPONENT_REGISTRY[target.type].label} with ${envLabel}.`,
      "Wire compute to other services, databases, caches, or queues.",
    );
  }

  // ── Async broker → consumer ────────────────────────────────────
  if (sourceRole === "async") {
    if (COMPUTE.has(target.type)) return OK;
    if (PERSISTENCE.has(target.type)) {
      return fail(
        "async_to_db",
        "Message brokers don't query databases directly — a consumer service should read and write data.",
        "Wire Queue → App Server → Database.",
      );
    }
    return fail(
      "async_consumer",
      `${COMPONENT_REGISTRY[source.type].label} should deliver to a consumer (App Server, Stream Processor).`,
      "Add a compute node that processes messages from the broker.",
    );
  }

  // ── Persistence / cache shouldn't forward user traffic ─────────
  if (sourceRole === "persistence" || sourceRole === "cache") {
    if (target.type === "client" || INGRESS.has(target.type)) {
      return fail(
        "data_to_edge",
        "Data stores don't initiate user-facing connections upstream.",
        "Wire App Server → Database, not the reverse.",
      );
    }
    if (COMPUTE.has(target.type)) return OK;
    return fail(
      "data_downstream",
      `${COMPONENT_REGISTRY[source.type].label} is a terminal data tier for most request paths.`,
      "Connect application servers to this store, not the other way around.",
    );
  }

  return OK;
}

export function validateDesign(design: SimDesign): ArchitectureViolation[] {
  const nodeMap = new Map(design.nodes.map((n) => [n.id, n]));
  const violations: ArchitectureViolation[] = [];

  for (const edge of design.edges) {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (!source || !target) continue;

    const result = validateHop(source, target, edge.protocol);
    if (!result.valid || result.code === "direct_to_compute") {
      violations.push({
        edgeId: edge.id,
        sourceId: edge.source,
        targetId: edge.target,
        severity: result.valid ? "warning" : result.severity,
        code: result.code,
        message: result.message,
        suggestion: result.suggestion,
      });
    }
  }

  const clients = design.nodes.filter((n) => COMPONENT_REGISTRY[n.type].isTrafficSource);
  for (const client of clients) {
    const outbound = design.edges.filter((e) => e.source === client.id);
    if (outbound.length === 0) {
      violations.push({
        edgeId: `orphan-${client.id}`,
        sourceId: client.id,
        targetId: "",
        severity: "error",
        code: "client_orphan",
        message: `${client.label} has no outbound connections — traffic has nowhere to go.`,
        suggestion: "Connect Client to a Load Balancer, API Gateway, or App Server.",
      });
    }
  }

  return violations;
}

/** Best protocol for a new edge — aligns with traffic contracts */
export function suggestEdgeProtocol(
  sourceType: SimComponentType,
  targetType: SimComponentType,
): EdgeProtocol {
  if (ASYNC.has(targetType) || ASYNC.has(sourceType)) return "async";
  if (targetType === "websocket_server") return "websocket";
  if (PERSISTENCE.has(targetType) && targetType !== "object_storage") return "tcp";
  if (CACHE.has(targetType)) return "tcp";
  if (targetType === "object_storage") return "http";
  return "http";
}

export function violationForEdge(
  violations: ArchitectureViolation[],
  edgeId: string,
): ArchitectureViolation | undefined {
  return violations.find((v) => v.edgeId === edgeId);
}

export function violationsForNode(
  violations: ArchitectureViolation[],
  nodeId: string,
): ArchitectureViolation[] {
  return violations.filter((v) => v.targetId === nodeId || v.sourceId === nodeId);
}
