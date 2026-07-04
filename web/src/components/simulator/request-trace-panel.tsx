"use client";

import { useEffect } from "react";
import { Route, X, ChevronRight, ChevronLeft, Play, Pause } from "lucide-react";
import { useDesignStore } from "@/lib/simulator/store";
import { useSimulationStore } from "@/lib/simulator/store";
import { useTeachingStore } from "@/lib/simulator/teaching-store";
import { COMPONENT_REGISTRY } from "@/lib/simulator/component-registry";
import { cn } from "@/lib/utils";

const HOP_EXPLAIN: Record<string, string> = {
  client: "A shopper sends an HTTP request from their browser or app.",
  cdn: "Static assets may be served from the edge CDN — most product pages never hit origin.",
  load_balancer: "Traffic is spread across healthy gateway instances.",
  api_gateway: "The gateway authenticates, rate-limits, and routes to the right microservice.",
  app_server: "The service runs business logic — catalog lookup, cart updates, checkout, etc.",
  redis_cache: "Hot data is served from memory. A cache hit skips the database entirely.",
  sql_database: "Persistent storage — orders, products, and inventory live here.",
  search_index: "Full-text search runs on a dedicated index, separate from the primary DB.",
  event_bus: "Order events are published asynchronously — downstream systems react in the background.",
};

function hopCaption(type: string, label: string): string {
  return HOP_EXPLAIN[type] ?? `${label} processes this step of the request.`;
}

export function RequestTracePanel() {
  const design = useDesignStore((s) => s.design);
  const metrics = useSimulationStore((s) => s.metrics);
  const trace = useTeachingStore((s) => s.trace);
  const advanceTraceHop = useTeachingStore((s) => s.advanceTraceHop);
  const setTraceHop = useTeachingStore((s) => s.setTraceHop);
  const stopTrace = useTeachingStore((s) => s.stopTrace);

  useEffect(() => {
    if (!trace?.playing) return;
    const timer = setInterval(() => advanceTraceHop(), 1800);
    return () => clearInterval(timer);
  }, [trace?.playing, trace?.hopIndex, advanceTraceHop]);

  if (!trace || !design) return null;

  const nodeId = trace.nodeIds[trace.hopIndex];
  const node = design.nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const m = metrics[nodeId];
  const health = m?.health ?? "healthy";
  const isBlocked = health === "down" || (m?.currentRps === 0 && trace.hopIndex > 0 && !COMPONENT_REGISTRY[node.type].isTrafficSource);
  const totalHops = trace.nodeIds.length;

  return (
    <div className="pointer-events-none absolute bottom-4 right-4 z-20 max-w-xs">
      <div className="pointer-events-auto clay-card border-[var(--clay-primary)]/30 p-4 shadow-xl">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--clay-primary)]/10">
              <Route className="h-4 w-4 text-[var(--clay-primary)]" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--clay-primary)]">
                Request Journey
              </div>
              <div className="text-xs text-[var(--clay-text-subtle)]">
                Hop {trace.hopIndex + 1} of {totalHops}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={stopTrace}
            className="grid h-7 w-7 place-items-center rounded-lg text-[var(--clay-text-subtle)] hover:bg-[var(--clay-surface-2)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="mt-3 flex items-center gap-1">
          {trace.nodeIds.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all",
                i < trace.hopIndex ? "bg-[var(--clay-primary)]" :
                i === trace.hopIndex ? "bg-[var(--clay-primary)] animate-pulse" :
                "bg-[var(--clay-border)]",
              )}
            />
          ))}
        </div>

        <div className="mt-3">
          <div className="text-sm font-semibold text-[var(--clay-text)]">{node.label}</div>
          <p className="mt-1 text-[11px] leading-relaxed text-[var(--clay-text-muted)]">
            {hopCaption(node.type, node.label)}
          </p>
        </div>

        {m && (
          <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
            <span className={cn(
              "rounded-full px-2 py-0.5 font-semibold uppercase",
              health === "healthy" ? "bg-emerald-500/10 text-emerald-600" :
              health === "degraded" ? "bg-amber-500/10 text-amber-600" :
              "bg-rose-500/10 text-rose-600",
            )}>
              {health}
            </span>
            {m.currentRps > 0 && (
              <span className="text-[var(--clay-text-subtle)]">{m.currentRps} rps</span>
            )}
            {m.avgLatencyMs > 0 && m.avgLatencyMs < 9999 && (
              <span className="text-[var(--clay-text-subtle)]">{m.avgLatencyMs}ms</span>
            )}
          </div>
        )}

        {isBlocked && trace.hopIndex > 0 && (
          <div className="mt-2 rounded-lg border border-rose-300/40 bg-rose-500/5 px-2.5 py-2 text-[10px] text-rose-600">
            Request blocked here — downstream services will not receive traffic.
          </div>
        )}

        <div className="mt-3 flex items-center gap-1.5">
          <button
            type="button"
            disabled={trace.hopIndex === 0}
            onClick={() => setTraceHop(trace.hopIndex - 1)}
            className="grid h-7 w-7 place-items-center rounded-lg border border-[var(--clay-border)] text-[var(--clay-text-subtle)] hover:bg-[var(--clay-surface-2)] disabled:opacity-30"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => useTeachingStore.setState((s) => ({
              trace: s.trace ? { ...s.trace, playing: !s.trace.playing } : null,
            }))}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-[var(--clay-primary)]/10 px-3 py-1.5 text-[10px] font-semibold text-[var(--clay-primary)] hover:bg-[var(--clay-primary)]/15"
          >
            {trace.playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {trace.playing ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            disabled={trace.hopIndex >= totalHops - 1}
            onClick={() => advanceTraceHop()}
            className="grid h-7 w-7 place-items-center rounded-lg border border-[var(--clay-border)] text-[var(--clay-text-subtle)] hover:bg-[var(--clay-surface-2)] disabled:opacity-30"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
