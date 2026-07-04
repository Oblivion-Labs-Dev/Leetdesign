"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Save,
  Download,
  Trash2,
  Gauge,
  Zap,
  Route,
} from "lucide-react";
import { useDesignStore } from "@/lib/simulator/store";
import { useSimulationStore } from "@/lib/simulator/store";
import { useTeachingStore } from "@/lib/simulator/teaching-store";
import { findPrimaryTracePath } from "@/lib/simulator/topology";
import { startEngine, stopEngine, resetEngine } from "@/lib/simulator/engine";
import { cn } from "@/lib/utils";

const SPEEDS = [1, 2, 5, 10];

export function SimulatorToolbar() {
  const router = useRouter();
  const design = useDesignStore((s) => s.design);
  const dirty = useDesignStore((s) => s.dirty);
  const setName = useDesignStore((s) => s.setName);
  const save = useDesignStore((s) => s.save);
  const clearCanvas = useDesignStore((s) => s.clearCanvas);

  const running = useSimulationStore((s) => s.running);
  const timeScale = useSimulationStore((s) => s.timeScale);
  const toggle = useSimulationStore((s) => s.toggle);
  const setTimeScale = useSimulationStore((s) => s.setTimeScale);
  const totalSystemRps = useSimulationStore((s) => s.totalSystemRps);
  const avgSystemLatency = useSimulationStore((s) => s.avgSystemLatency);
  const trace = useTeachingStore((s) => s.trace);
  const startTrace = useTeachingStore((s) => s.startTrace);
  const stopTrace = useTeachingStore((s) => s.stopTrace);

  const engineStarted = useRef(false);

  useEffect(() => {
    if (!engineStarted.current) {
      startEngine();
      engineStarted.current = true;
    }
    return () => {
      stopEngine();
      engineStarted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => save(), 5000);
    return () => clearTimeout(t);
  }, [dirty, save]);

  const handleExport = () => {
    if (!design) return;
    const blob = new Blob([JSON.stringify(design, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${design.name.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTrace = () => {
    if (trace) {
      stopTrace();
      return;
    }
    if (!design) return;
    const { nodeIds, edgeIds } = findPrimaryTracePath(design);
    if (nodeIds.length < 2) return;
    startTrace(nodeIds, edgeIds);
  };

  if (!design) return null;

  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--clay-border)] bg-[var(--clay-surface)]/95 px-3 backdrop-blur-md">
      {/* Left */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => { save(); router.push("/projects"); }}
          className="grid h-8 w-8 place-items-center rounded-lg text-[var(--clay-text-subtle)] transition-colors hover:bg-[var(--clay-surface-2)] hover:text-[var(--clay-text)]"
          title="Back to designs"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <input
          value={design.name}
          onChange={(e) => setName(e.target.value)}
          className="w-48 rounded-lg bg-transparent px-2 py-1 text-sm font-semibold text-[var(--clay-text)] focus:bg-[var(--clay-surface-2)] focus:outline-none lg:w-64"
          spellCheck={false}
        />
        <span className={cn(
          "text-[10px] font-medium",
          dirty ? "text-amber-500" : "text-[var(--clay-text-subtle)]",
        )}>
          {dirty ? "unsaved" : "saved"}
        </span>
      </div>

      {/* Center */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => toggle()}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-full px-4 text-xs font-semibold transition-all",
            running
              ? "bg-rose-500/15 text-rose-500 hover:bg-rose-500/25"
              : "bg-gradient-to-b from-[var(--clay-primary)] to-[var(--clay-primary-dark)] text-white shadow-[0_4px_16px_-4px_rgba(107,140,174,0.5)] hover:-translate-y-0.5",
          )}
        >
          {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {running ? "Pause" : "Simulate"}
        </button>

        {running && (
          <button
            type="button"
            onClick={() => { useSimulationStore.getState().stop(); resetEngine(); }}
            className="grid h-8 w-8 place-items-center rounded-lg text-[var(--clay-text-subtle)] hover:bg-[var(--clay-surface-2)] hover:text-[var(--clay-text)]"
            title="Reset simulation"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={handleTrace}
          disabled={design.nodes.length < 2}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-all",
            trace
              ? "border-[var(--clay-primary)] bg-[var(--clay-primary)]/15 text-[var(--clay-primary)]"
              : "border-[var(--clay-border)] bg-[var(--clay-surface-2)] text-[var(--clay-text-muted)] hover:border-[var(--clay-primary)]/40 hover:text-[var(--clay-text)]",
            design.nodes.length < 2 && "opacity-40",
          )}
          title="Trace one request through the system"
        >
          <Route className="h-3.5 w-3.5" />
          {trace ? "Stop Trace" : "Trace Request"}
        </button>

        <div className="ml-1 flex items-center gap-0.5 rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface-2)] p-0.5">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setTimeScale(s)}
              className={cn(
                "rounded-md px-2 py-1 text-[10px] font-semibold transition-colors",
                timeScale === s
                  ? "bg-[var(--clay-primary)] text-white"
                  : "text-[var(--clay-text-subtle)] hover:text-[var(--clay-text)]",
              )}
            >
              {s}x
            </button>
          ))}
        </div>

        {running && (
          <div className="ml-2 flex items-center gap-3 text-[10px] text-[var(--clay-text-subtle)]">
            <span className="flex items-center gap-1">
              <Gauge className="h-3 w-3" />
              <span className="font-mono font-semibold text-[var(--clay-text)]">{totalSystemRps}</span> rps
            </span>
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              <span className="font-mono font-semibold text-[var(--clay-text)]">{avgSystemLatency}</span> ms
            </span>
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => save()}
          className="grid h-8 w-8 place-items-center rounded-lg text-[var(--clay-text-subtle)] hover:bg-[var(--clay-surface-2)] hover:text-[var(--clay-text)]"
          title="Save"
        >
          <Save className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleExport}
          className="grid h-8 w-8 place-items-center rounded-lg text-[var(--clay-text-subtle)] hover:bg-[var(--clay-surface-2)] hover:text-[var(--clay-text)]"
          title="Export JSON"
        >
          <Download className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={clearCanvas}
          className="grid h-8 w-8 place-items-center rounded-lg text-[var(--clay-text-subtle)] hover:bg-[var(--clay-surface-2)] hover:text-rose-500"
          title="Clear canvas"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
