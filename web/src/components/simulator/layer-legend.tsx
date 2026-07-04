"use client";

import { Layers } from "lucide-react";
import { useTeachingStore } from "@/lib/simulator/teaching-store";
import type { ArchLayer } from "@/lib/simulator/types";

const LAYERS: { id: ArchLayer; label: string; color: string }[] = [
  { id: "client_layer", label: "Client", color: "#3b82f6" },
  { id: "edge_layer", label: "Edge / CDN", color: "#14b8a6" },
  { id: "gateway_layer", label: "Gateway", color: "#a78bfa" },
  { id: "service_layer", label: "Service", color: "#818cf8" },
  { id: "data_layer", label: "Data", color: "#f59e0b" },
  { id: "async_layer", label: "Async", color: "#10b981" },
];

export function LayerLegend() {
  const show = useTeachingStore((s) => s.showLayerLegend);
  const toggle = useTeachingStore((s) => s.toggleLayerLegend);

  if (!show) {
    return (
      <button
        type="button"
        onClick={toggle}
        className="absolute right-4 top-4 z-10 inline-flex items-center gap-1 rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface)]/90 px-2.5 py-1 text-[10px] font-semibold text-[var(--clay-text-muted)] shadow-sm backdrop-blur-sm hover:bg-[var(--clay-surface-2)]"
      >
        <Layers className="h-3 w-3" /> Layers
      </button>
    );
  }

  return (
    <div className="absolute right-4 top-4 z-10 rounded-xl border border-[var(--clay-border)] bg-[var(--clay-surface)]/95 p-3 shadow-lg backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--clay-text-muted)]">
          <Layers className="h-3 w-3" /> Architecture Layers
        </div>
        <button
          type="button"
          onClick={toggle}
          className="text-[9px] text-[var(--clay-text-subtle)] hover:text-[var(--clay-text)]"
        >
          Hide
        </button>
      </div>
      <div className="space-y-1">
        {LAYERS.map((l) => (
          <div key={l.id} className="flex items-center gap-2 text-[10px]">
            <div className="h-2 w-2 rounded-full" style={{ background: l.color }} />
            <span className="text-[var(--clay-text-muted)]">{l.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 border-t border-[var(--clay-border)] pt-2 text-[9px] text-[var(--clay-text-subtle)]">
        <span className="mr-2">━━ sync</span>
        <span>- - async</span>
      </div>
    </div>
  );
}
