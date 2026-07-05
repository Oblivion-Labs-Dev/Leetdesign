"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw, ChevronRight } from "lucide-react";
import { useDesignStore, useSimulationStore } from "@/lib/simulator/store";
import { restartSimulationFlow } from "@/lib/simulator/engine";
import { detectFlowStall, type FlowStallInfo } from "@/lib/simulator/sim-flow-recovery";
import { COMPONENT_REGISTRY } from "@/lib/simulator/component-registry";
import type { SimComponentType } from "@/lib/simulator/types";
import { cn } from "@/lib/utils";

const SHOW_AFTER_MS = 2500;
const HIDE_AFTER_MS = 4000;

export function SimulationFlowBanner() {
  const design = useDesignStore((s) => s.design);
  const running = useSimulationStore((s) => s.running);
  const metrics = useSimulationStore((s) => s.metrics);
  const edgeFlowRps = useSimulationStore((s) => s.edgeFlowRps);
  const selectNode = useDesignStore((s) => s.selectNode);

  const [displayStall, setDisplayStall] = useState<FlowStallInfo | null>(null);
  const stallSinceRef = useRef<number | null>(null);
  const clearSinceRef = useRef<number | null>(null);

  const liveStall = design && running
    ? detectFlowStall(design, metrics, edgeFlowRps, running)
    : null;

  useEffect(() => {
    if (!running) {
      stallSinceRef.current = null;
      clearSinceRef.current = null;
      setDisplayStall(null);
      return;
    }

    const now = Date.now();

    if (liveStall?.stalled) {
      clearSinceRef.current = null;
      if (stallSinceRef.current === null) {
        stallSinceRef.current = now;
      }
      if (now - stallSinceRef.current >= SHOW_AFTER_MS) {
        setDisplayStall(liveStall);
      }
    } else {
      stallSinceRef.current = null;
      if (displayStall) {
        if (clearSinceRef.current === null) {
          clearSinceRef.current = now;
        }
        if (now - clearSinceRef.current >= HIDE_AFTER_MS) {
          setDisplayStall(null);
        }
      } else {
        clearSinceRef.current = null;
      }
    }
  }, [liveStall, running, displayStall]);

  if (!running || !displayStall?.stalled) return null;

  const stall = displayStall;

  return (
    <div className="pointer-events-auto absolute bottom-4 right-4 z-20 w-[22rem] max-h-[70vh] overflow-y-auto rounded-xl border border-amber-400/35 bg-[color-mix(in_srgb,var(--clay-surface)_96%,transparent)] p-3 shadow-[var(--clay-shadow-out)] backdrop-blur-sm">
      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
        Traffic stalled
      </div>

      <p className="mt-1.5 text-xs font-semibold text-[var(--clay-text)]">
        {stall.headline}
      </p>

      <p className="mt-1 text-[11px] leading-relaxed text-[var(--clay-text-muted)]">
        {stall.symptom}
      </p>

      {stall.rootCause && (
        <div className="mt-2.5 rounded-lg border border-rose-400/25 bg-rose-500/6 px-2.5 py-2">
          <div className="text-[9px] font-bold uppercase tracking-wider text-rose-600">
            Likely bottleneck
          </div>
          <button
            type="button"
            onClick={() => selectNode(stall.rootCause!.nodeId)}
            className="mt-1 flex w-full items-start gap-1.5 text-left transition hover:opacity-80"
          >
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-[var(--clay-text)]">
                {stall.rootCause.label}
                <span className="ml-1.5 text-[10px] font-normal text-[var(--clay-text-subtle)]">
                  {COMPONENT_REGISTRY[stall.rootCause.type as SimComponentType]?.label}
                </span>
              </div>
              <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--clay-text-muted)]">
                {stall.rootCause.detail}
              </p>
            </div>
            <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--clay-text-subtle)]" />
          </button>
        </div>
      )}

      {stall.immediateCauses.length > 0 && (
        <div className="mt-2">
          <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
            Unhealthy components
          </div>
          <ul className="mt-1 space-y-1">
            {stall.immediateCauses.map((c) => (
              <li key={c.nodeId}>
                <button
                  type="button"
                  onClick={() => selectNode(c.nodeId)}
                  className="w-full rounded-md border border-[var(--clay-border)] bg-[var(--clay-surface)] px-2 py-1.5 text-left text-[10px] hover:bg-[var(--clay-surface-2)]"
                >
                  <span className={cn(
                    "font-semibold",
                    c.health === "down" ? "text-rose-600" : "text-amber-600",
                  )}>
                    {c.label}
                  </span>
                  <span className="text-[var(--clay-text-muted)]"> — {c.detail}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-2.5 rounded-lg border border-[var(--clay-border)] bg-[var(--clay-bg-soft)] px-2.5 py-2">
        <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
          What to try
        </div>
        <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--clay-text-muted)]">
          {stall.suggestion}
        </p>
      </div>

      <button
        type="button"
        onClick={() => restartSimulationFlow()}
        className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--clay-primary)]/30 bg-[var(--clay-primary)]/10 px-3 py-2 text-xs font-semibold text-[var(--clay-primary)] transition hover:bg-[var(--clay-primary)]/18"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Restart flow
      </button>
    </div>
  );
}
