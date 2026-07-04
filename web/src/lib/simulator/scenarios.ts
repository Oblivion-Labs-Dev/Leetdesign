import type { SimDesign, SimHealth } from "./types";
import { matchesScenarioDesign } from "./topology";

export interface ScenarioCheckContext {
  running: boolean;
  totalRps: number;
  systemHealth: SimHealth;
  traceCompleted: boolean;
  spikeTriggered: boolean;
  wasEverUnhealthy: boolean;
  incidentRecovered: boolean;
}

export interface ScenarioStep {
  title: string;
  instruction: string;
  hint?: string;
  check: (ctx: ScenarioCheckContext) => boolean;
}

export interface ScenarioDef {
  id: string;
  templateIds: string[];
  title: string;
  subtitle: string;
  brief?: {
    useCase: string;
    scale?: string;
    constraint?: string;
    goal: string;
  };
  steps: ScenarioStep[];
}

export const ECOMMERCE_FLASH_SALE: ScenarioDef = {
  id: "ecommerce-flash-sale",
  templateIds: ["ecommerce"],
  title: "Flash Sale Survival",
  subtitle: "Learn how traffic flows, what breaks under load, and how to fix it.",
  brief: {
    useCase: "Flash sale: 300k shoppers arrive in 3 minutes",
    scale: "Peak 50k requests per second at the gateway",
    constraint: "Product browsing must stay under 200ms p95",
    goal: "Keep checkout flowing while protecting the database",
  },
  steps: [
    {
      title: "Start the simulation",
      instruction:
        "Press Simulate and watch dots move along connections. Solid lines are synchronous calls; dashed lines are async events.",
      hint: "Use the Simulate button in the toolbar.",
      check: (ctx) => ctx.running && ctx.totalRps > 0,
    },
    {
      title: "Trace a shopper request",
      instruction:
        'Click "Trace Request" to follow one request hop-by-hop — from Shoppers through the gateway to Product Service.',
      hint: "Trace Request is in the toolbar next to Simulate.",
      check: (ctx) => ctx.traceCompleted,
    },
    {
      title: "Survive a traffic spike",
      instruction:
        "Click Spike to simulate a flash sale. Watch latency rise and see which component struggles first.",
      hint: "The Spike button appears in the bottom metrics bar while simulating.",
      check: (ctx) => ctx.spikeTriggered,
    },
    {
      title: "Fix the incident",
      instruction:
        "When something breaks, open the Incident Coach. Highlight blast radius, then scale replicas or restore a killed node.",
      hint: 'Try "Add replica" on an overloaded service, or restore maxRps if a node was killed.',
      check: (ctx) => ctx.incidentRecovered,
    },
  ],
};

export const SCENARIOS: ScenarioDef[] = [ECOMMERCE_FLASH_SALE];

export function getScenarioForDesign(design: SimDesign): ScenarioDef | null {
  if (design.scenarioId) {
    return SCENARIOS.find((s) => s.id === design.scenarioId) ?? null;
  }
  return SCENARIOS.find((s) => matchesScenarioDesign(design, s.templateIds)) ?? null;
}
