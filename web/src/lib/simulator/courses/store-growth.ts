import type { CourseDef, ArchitectureSnapshot } from "./types";
import { getAllMilestones } from "./types";

/**
 * Chapter 1: Shoppers → Web App → Store Database — smallest real store.
 * App server: 4 cores, 50ms processing, 200 concurrent = 4000 rps capacity.
 * At 2 rps this is totally fine — the point is to show a working system.
 */
const CH1_ARCH: ArchitectureSnapshot = {
  nodes: [
    { type: "client", label: "Shoppers", x: 80, y: 280, config: { activeUsers: 10, userActivityPreset: "browsing" } },
    { type: "app_server", label: "Web App", x: 480, y: 280, config: { instanceCount: 1, replicas: 1, maxConcurrentRequestsPerInstance: 100, applicationComputeTimeMs: 20, responseDeadlineMs: 3000, maxWaitingQueue: 500 } },
    { type: "sql_database", label: "Store Database", x: 880, y: 280, config: { engine: "postgres", connectionPoolSize: 20, avgQueryTimeMs: 5 } },
  ],
  edges: [
    { sourceLabel: "Shoppers", targetLabel: "Web App" },
    { sourceLabel: "Web App", targetLabel: "Store Database" },
  ],
  trafficRps: 2,
} as ArchitectureSnapshot;

/**
 * Chapter 2: Same architecture, viral traffic — Web App becomes the bottleneck.
 * App server: 2 cores, 80ms processing, 30 concurrent = 375 rps capacity per instance.
 * BUT with maxConcurrentReqs: 30 and avgProcessingTimeMs: 80, capacity = (30/80)*1000 = 375 rps.
 * We reduce to maxConcurrentReqs: 8, avgProcessingTimeMs: 200 → capacity = (8/200)*1000 = 40 rps.
 * At 50 rps incoming, load = 50/40 = 1.25 → overload, errors, latency spike.
 */
const CH2_ARCH: ArchitectureSnapshot = {
  nodes: [
    { type: "client", label: "Shoppers", x: 80, y: 280, config: { activeUsers: 250, userActivityPreset: "browsing" } },
    { type: "app_server", label: "Web App", x: 480, y: 280, config: { instanceCount: 1, replicas: 1, maxConcurrentRequestsPerInstance: 8, applicationComputeTimeMs: 20, responseDeadlineMs: 3000, maxWaitingQueue: 200 } },
    { type: "sql_database", label: "Store Database", x: 880, y: 280, config: { engine: "postgres", connectionPoolSize: 20, avgQueryTimeMs: 5 } },
  ],
  edges: [
    { sourceLabel: "Shoppers", targetLabel: "Web App" },
    { sourceLabel: "Web App", targetLabel: "Store Database" },
  ],
  trafficRps: 50,
} as ArchitectureSnapshot;

export const STORE_GROWTH_COURSE: CourseDef = {
  id: "store-growth",
  title: "Build a Store That Survives Growth",
  subtitle: "Watch a sneaker shop evolve from a simple monolith into a production platform — one problem at a time.",
  chapters: [
    {
      id: "ch1",
      number: 1,
      title: "First working store",
      summary: "Launch with the smallest useful architecture. A monolith is valid when traffic is low.",
      milestones: [
        {
          id: "ch1-m1",
          chapterId: "ch1",
          chapterNumber: 1,
          chapterTitle: "First working store",
          milestoneIndex: 1,
          milestoneCount: 1,
          title: "Launch day",
          productUpdate:
            "You just launched SneakerDrop — a simple online store. Three pieces make it work: Shoppers send requests from their browsers, the Web App runs your code (product pages, checkout, orders), and the Store Database saves products and orders permanently.",
          userProblem: "Prove the store works end-to-end before worrying about scale.",
          goal: "Watch requests flow from shoppers → web app → database and confirm everything stays healthy.",
          task: "Run the simulation and confirm the system stays healthy at low traffic (2 rps).",
          architecture: CH1_ARCH,
          expectsFailure: false,
          beforeMetrics: {
            label: "Low traffic (launch day)",
            p95LatencyMs: 95,
            errorRate: 0.002,
            dbCpuPercent: 18,
            totalRps: 2,
            description: "Everything responds quickly. The database barely breaks a sweat.",
          },
          tradeoffs: {
            improved: [
              "Shipped in days, not months",
              "One codebase — easy to debug and deploy",
              "No operational overhead from distributed systems",
            ],
            harder: [
              "All features share one deployment cycle",
              "Scaling means scaling everything together",
            ],
            doesNotSolve: [
              "Global low-latency delivery",
              "Handling viral traffic spikes",
              "Independent team ownership",
            ],
          },
          evolutionLabel: "Monolith launch",
          checklist: ["Run simulation", "Confirm healthy metrics", "Review trade-offs"],
        },
      ],
    },
    {
      id: "ch2",
      number: 2,
      title: "More users arrive",
      summary: "Traffic rises. The single web server becomes the bottleneck.",
      milestones: [
        {
          id: "ch2-m1",
          chapterId: "ch2",
          chapterNumber: 2,
          chapterTitle: "More users arrive",
          milestoneIndex: 1,
          milestoneCount: 1,
          title: "Viral post",
          productUpdate:
            "Your sneaker store goes viral after a social media post. Traffic jumps from 2 rps to 50 rps (3,000 requests per minute). Your single Web App can only handle about 40 rps with its current resources.",
          userProblem: "Product pages are slow. Some requests time out. Shoppers are bouncing.",
          goal: "Identify the bottleneck and scale the web tier so it can handle the load.",
          task: "Find what's failing, then scale the system to handle 50 rps without errors.",
          architecture: CH2_ARCH,
          expectsFailure: true,
          failureDescription:
            "The single Web App is saturated — it can only process 8 concurrent requests at 200ms each (40 rps capacity). CPU is pegged, requests queue up, latency spikes, and errors appear.",
          bottleneckNodeLabel: "Web App",
          reflectionQuestion: {
            question: "What is the current bottleneck?",
            options: ["Shoppers (client)", "Web App", "Store Database", "Network"],
            correctAnswer: "Web App",
            explanation:
              "The Web App can only handle ~40 rps (8 concurrent × 200ms processing) but is receiving 50 rps. It saturates and starts dropping requests.",
          },
          suggestedComponent: "load_balancer",
          suggestedComponentHint:
            "Spread traffic across multiple stateless app servers using a Load Balancer. Add a second Web App behind it.",
          expectedConnections: ["Shoppers → Load Balancer", "Load Balancer → Web App"],
          beforeMetrics: {
            label: "Before scaling",
            p95LatencyMs: 1800,
            errorRate: 0.07,
            dbCpuPercent: 35,
            totalRps: 50,
            description: "Web App overloaded. Latency and errors rising.",
          },
          afterMetrics: {
            label: "After load balancer + 2 app servers",
            p95LatencyMs: 220,
            errorRate: 0.004,
            dbCpuPercent: 42,
            totalRps: 50,
            description: "Traffic spread across two app servers. Errors drop sharply.",
          },
          tradeoffs: {
            improved: [
              "Horizontal scaling of stateless web tier",
              "Better fault tolerance if one app server dies",
              "Lower p95 latency under load",
            ],
            harder: [
              "Sessions cannot live only in server memory",
              "Need sticky sessions or shared session store",
              "More moving parts to deploy and monitor",
            ],
            doesNotSolve: [
              "Database read overload",
              "Global image delivery",
              "Slow search queries",
            ],
          },
          evolutionLabel: "Added load balancer",
          checklist: [
            "Run simulation and observe failure",
            "Identify bottleneck",
            "Add load balancer + second app server",
            "Re-run and confirm system handles 50 rps",
          ],
          acceptanceCriteria: {
            maxP95LatencyMs: 500,
            maxErrorRate: 0.02,
            minHandledRps: 45,
            sustainForCycles: 6,
          },
        },
      ],
    },
    {
      id: "ch3",
      number: 3,
      title: "Images are slow globally",
      summary: "Product images hurt distant users. CDN + object storage coming next.",
      milestones: [],
    },
    {
      id: "ch4",
      number: 4,
      title: "Database read overload",
      summary: "Repeated product page reads hammer the database. Cache-aside with Redis.",
      milestones: [],
    },
    {
      id: "ch5",
      number: 5,
      title: "Search becomes slow",
      summary: "SQL isn't built for full-text search at scale.",
      milestones: [],
    },
    {
      id: "ch6",
      number: 6,
      title: "Checkout becomes unreliable",
      summary: "Synchronous checkout chains fail when email or warehouse slows down.",
      milestones: [],
    },
    {
      id: "ch7",
      number: 7,
      title: "Flash sale survival",
      summary: "Incidents arrive one at a time — rate limits, cache stampede, circuit breakers.",
      milestones: [],
    },
    {
      id: "ch8",
      number: 8,
      title: "Observability",
      summary: "Measure before optimizing — traces reveal the real bottleneck.",
      milestones: [],
    },
  ],
};

export const COURSES: CourseDef[] = [STORE_GROWTH_COURSE];

export function getCourseById(id: string): CourseDef | null {
  return COURSES.find((c) => c.id === id) ?? null;
}

/** Milestones that have playable content */
export function getPlayableMilestones(course: CourseDef) {
  return getAllMilestones(course).filter((m) => m.architecture.nodes.length > 0);
}

export function getEvolutionSteps(course: CourseDef) {
  return getPlayableMilestones(course).map((m) => ({
    milestoneId: m.id,
    label: m.evolutionLabel,
    chapterNumber: m.chapterNumber,
  }));
}
