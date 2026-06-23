"use client";

import { motion } from "framer-motion";
import { Activity, Play } from "lucide-react";
import type { Phase } from "./hero-scenario";

export function HeroSimBar({
  phase,
  log,
  rps,
  p99,
}: {
  phase: Phase;
  log: string;
  rps: number;
  p99: number;
}) {
  const simActive = phase === "simulate" || phase === "insight";

  return (
    <div className="flex items-center justify-between border-t border-[var(--clay-border)] bg-[var(--clay-surface)]/95 px-2.5 py-1.5">
      <div className="flex items-center gap-1.5">
        <motion.div
          className="grid h-6 w-6 place-items-center rounded-md border"
          style={{
            borderColor: simActive
              ? "rgba(101,148,124,0.3)"
              : "var(--clay-border)",
            background: simActive
              ? "color-mix(in srgb, var(--clay-accent) 20%, var(--clay-surface))"
              : "transparent",
          }}
          animate={simActive ? { scale: [1, 1.06, 1] } : {}}
          transition={
            simActive
              ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
              : {}
          }
        >
          <Play
            className="h-2.5 w-2.5"
            style={{
              color: simActive ? "#65947C" : "var(--clay-primary)",
              fill: simActive ? "currentColor" : "none",
            }}
          />
        </motion.div>
        <p
          className="text-[8px] text-[var(--clay-text-muted)]"
          aria-live="polite"
        >
          {log}
        </p>
      </div>

      {simActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-[8px] font-semibold tabular-nums text-[var(--clay-text-muted)]"
        >
          <Activity className="h-2.5 w-2.5" />
          {rps} rps ·{" "}
          <span className="text-[#65947C]">p99 {p99}ms</span>
        </motion.div>
      )}
    </div>
  );
}
