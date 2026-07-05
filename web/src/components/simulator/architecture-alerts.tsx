"use client";

import { AlertTriangle, Info } from "lucide-react";
import { useDesignStore, useSimulationStore } from "@/lib/simulator/store";
import type { ArchitectureViolation } from "@/lib/simulator/traffic-contracts";

function ViolationRow({ v }: { v: ArchitectureViolation }) {
  const selectEdge = useDesignStore((s) => s.selectEdge);
  const isError = v.severity === "error";

  return (
    <button
      type="button"
      onClick={() => v.edgeId && !v.edgeId.startsWith("orphan-") && selectEdge(v.edgeId)}
      className="w-full rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface)] px-3 py-2 text-left transition hover:bg-[var(--clay-surface-2)]"
    >
      <div className="flex items-start gap-2">
        {isError ? (
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
        ) : (
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
        )}
        <div className="min-w-0">
          <p className="text-[11px] font-medium leading-snug text-[var(--clay-text)]">{v.message}</p>
          <p className="mt-0.5 text-[10px] leading-snug text-[var(--clay-text-muted)]">{v.suggestion}</p>
        </div>
      </div>
    </button>
  );
}

export function ArchitectureAlerts() {
  const violations = useSimulationStore((s) => s.architectureViolations);
  const errors = violations.filter((v) => v.severity === "error");
  const warnings = violations.filter((v) => v.severity === "warning");

  if (violations.length === 0) return null;

  return (
    <div className="pointer-events-auto absolute bottom-4 left-4 z-20 w-72 max-h-48 overflow-y-auto rounded-xl border border-[var(--clay-border)] bg-[color-mix(in_srgb,var(--clay-surface)_95%,transparent)] p-3 shadow-[var(--clay-shadow-out)] backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
          Architecture
        </span>
        <span className="text-[10px] tabular-nums text-[var(--clay-text-muted)]">
          {errors.length > 0 && <span className="text-red-500">{errors.length} error{errors.length !== 1 ? "s" : ""}</span>}
          {errors.length > 0 && warnings.length > 0 && " · "}
          {warnings.length > 0 && <span className="text-amber-600">{warnings.length} warning{warnings.length !== 1 ? "s" : ""}</span>}
        </span>
      </div>
      <div className="space-y-1.5">
        {[...errors, ...warnings].slice(0, 4).map((v) => (
          <ViolationRow key={v.edgeId + v.code} v={v} />
        ))}
        {violations.length > 4 && (
          <p className="px-1 text-[10px] text-[var(--clay-text-subtle)]">
            +{violations.length - 4} more — fix wiring to run a healthy simulation
          </p>
        )}
      </div>
    </div>
  );
}
