import type { SimDesign, SimNode, SimEdge } from "./types";
import { uid } from "./types";
import { COMPONENT_REGISTRY } from "./component-registry";

function node(type: SimNode["type"], label: string, x: number, y: number, overrides?: Record<string, string | number | boolean>): SimNode {
  const def = COMPONENT_REGISTRY[type];
  return {
    id: `${type}_${uid()}`,
    type,
    label,
    position: { x, y },
    config: { ...def.defaultConfig, ...overrides },
  };
}

function edge(src: SimNode, tgt: SimNode, protocol: SimEdge["protocol"] = "http"): SimEdge {
  return {
    id: `e_${uid()}`,
    source: src.id,
    target: tgt.id,
    protocol,
    config: { bandwidthMbps: 1000, latencyMs: 1, encrypted: false, weight: 1 },
  };
}

function makeDesign(name: string, description: string, nodes: SimNode[], edges: SimEdge[], scenarioId?: string): SimDesign {
  return {
    id: crypto.randomUUID(),
    name,
    description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes,
    edges,
    simulation: { tickRateMs: 100, timeScale: 1 },
    scenarioId,
  };
}

function urlShortener(): SimDesign {
  const client = node("client", "Users", 0, 250, { requestsPerSecond: 500 });
  const cdn = node("cdn", "CDN", 460, 80);
  const gateway = node("api_gateway", "API Gateway", 460, 420, { rateLimitRps: 10000 });
  const lb = node("load_balancer", "Load Balancer", 920, 420);
  const writeService = node("app_server", "Write Service", 1400, 250, { replicas: 3 });
  const readService = node("app_server", "Read Service", 1400, 580, { replicas: 5 });
  const cache = node("redis_cache", "URL Cache", 1860, 80, { maxMemoryMB: 8192 });
  const db = node("sql_database", "URL DB", 1860, 420, { engine: "postgres", shards: 4 });
  const analytics = node("message_queue", "Click Events", 1860, 740, { maxQueueSize: 500000 });
  const worker = node("app_server", "Analytics Worker", 2320, 740, { replicas: 2 });
  const warehouse = node("data_warehouse", "Analytics Store", 2780, 740);

  const nodes = [client, cdn, gateway, lb, writeService, readService, cache, db, analytics, worker, warehouse];
  const edges = [
    edge(client, cdn), edge(client, gateway),
    edge(gateway, lb), edge(lb, writeService), edge(lb, readService),
    edge(readService, cache), edge(cache, db), edge(writeService, db),
    edge(readService, analytics, "async"), edge(analytics, worker, "async"),
    edge(worker, warehouse),
  ];

  return makeDesign(
    "URL Shortener (Tiny.link)",
    "Globally scaled URL shortener with caching, sharding, and async analytics.",
    nodes,
    edges,
  );
}

function chatSystem(): SimDesign {
  const client = node("client", "Chat Users", 0, 300, { requestsPerSecond: 1000, concurrentUsers: 50000 });
  const lb = node("load_balancer", "Load Balancer", 520, 300);
  const gateway = node("api_gateway", "API Gateway", 1040, 300, { rateLimitRps: 20000 });
  const wsServer = node("websocket_server", "WebSocket Server", 1040, 620, { maxConnections: 100000 });
  const authService = node("app_server", "Auth Service", 1560, 80, { replicas: 2 });
  const msgService = node("app_server", "Message Service", 1560, 300, { replicas: 5 });
  const presenceService = node("app_server", "Presence Service", 1560, 520, { replicas: 3 });
  const cache = node("redis_cache", "Session Cache", 2080, 80);
  const msgDb = node("nosql_database", "Message Store", 2080, 300, { engine: "cassandra", shards: 8 });
  const search = node("search_index", "Message Search", 2080, 520, { shards: 3 });
  const queue = node("message_queue", "Notification Queue", 2080, 740);
  const notif = node("notification_service", "Push Notifications", 2600, 740, { replicas: 2 });

  const nodes = [client, lb, gateway, authService, msgService, presenceService, wsServer, msgDb, cache, queue, notif, search];
  const edges = [
    edge(client, lb), edge(lb, gateway),
    edge(gateway, authService), edge(gateway, msgService), edge(gateway, presenceService),
    edge(client, wsServer, "websocket"), edge(wsServer, presenceService),
    edge(authService, cache), edge(msgService, msgDb), edge(msgService, search),
    edge(msgService, queue, "async"), edge(queue, notif, "async"),
  ];

  return makeDesign(
    "Real-Time Chat System",
    "WhatsApp-scale chat with WebSocket delivery, message persistence, and push notifications.",
    nodes,
    edges,
  );
}

function ecommerce(): SimDesign {
  const client = node("client", "Shoppers", 0, 350, { requestsPerSecond: 2000 });
  const cdnNode = node("cdn", "CDN", 460, 80);
  const lb = node("load_balancer", "Load Balancer", 460, 350);
  const gateway = node("api_gateway", "API Gateway", 920, 350, { rateLimitRps: 50000 });
  const productSvc = node("app_server", "Product Service", 1400, 80, { replicas: 4 });
  const cartSvc = node("app_server", "Cart Service", 1400, 320, { replicas: 3 });
  const orderSvc = node("app_server", "Order Service", 1400, 560, { replicas: 3 });
  const paymentSvc = node("app_server", "Payment Service", 1400, 780, { replicas: 2 });
  const productDb = node("sql_database", "Product DB", 1860, 80, { engine: "postgres" });
  const productCache = node("redis_cache", "Product Cache", 1860, -100);
  const cartCache = node("redis_cache", "Cart Cache", 1860, 320);
  const orderDb = node("sql_database", "Order DB", 1860, 560, { engine: "postgres", shards: 4 });
  const eventBus = node("event_bus", "Order Events", 1860, 780, { partitions: 12 });
  const searchIdx = node("search_index", "Product Search", 2320, 80, { shards: 5 });
  const warehouse = node("data_warehouse", "Analytics", 2320, 780);
  const notifSvc = node("notification_service", "Notifications", 2320, 560);

  const nodes = [client, cdnNode, lb, gateway, productSvc, cartSvc, orderSvc, paymentSvc, productDb, productCache, cartCache, orderDb, eventBus, searchIdx, warehouse, notifSvc];
  const edges = [
    edge(client, cdnNode), edge(client, lb),
    edge(lb, gateway),
    edge(gateway, productSvc), edge(gateway, cartSvc), edge(gateway, orderSvc),
    edge(orderSvc, paymentSvc),
    edge(productSvc, productCache), edge(productCache, productDb),
    edge(productSvc, searchIdx),
    edge(cartSvc, cartCache),
    edge(orderSvc, orderDb),
    edge(orderSvc, eventBus, "async"),
    edge(eventBus, warehouse, "async"), edge(eventBus, notifSvc, "async"),
  ];

  return makeDesign(
    "E-Commerce Platform",
    "Microservices-based store with product catalog, cart, orders, payments, and event-driven analytics.",
    nodes,
    edges,
    "ecommerce-flash-sale",
  );
}

export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  nodeCount: number;
  create: () => SimDesign;
}

export const TEMPLATES: TemplateInfo[] = [
  {
    id: "url-shortener",
    name: "URL Shortener",
    description: "Globally scaled redirect service with caching, sharding, and analytics pipeline.",
    nodeCount: 11,
    create: urlShortener,
  },
  {
    id: "chat-system",
    name: "Real-Time Chat",
    description: "WebSocket-based messaging with presence tracking, search, and push notifications.",
    nodeCount: 12,
    create: chatSystem,
  },
  {
    id: "ecommerce",
    name: "E-Commerce Platform",
    description: "Product catalog, cart, orders, payments, and event-driven microservices.",
    nodeCount: 16,
    create: ecommerce,
  },
];
