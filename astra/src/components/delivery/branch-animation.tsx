"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, GitBranch, GitMerge, Loader2, XCircle } from "lucide-react";

export interface BranchCheck {
  id: string;
  label: string;
  durationMs: number;
}

export type BranchPhase =
  | "idle"
  | "branched"
  | "running"
  | "passed"
  | "merged"
  | "failed";

export function BranchAnimation({
  branchName,
  checks,
  phase,
  failedAt,
}: {
  branchName: string;
  checks: BranchCheck[];
  phase: BranchPhase;
  failedAt?: string;
}) {
  const [activeCheck, setActiveCheck] = useState<string | null>(null);
  const [completedChecks, setCompletedChecks] = useState<string[]>([]);

  useEffect(() => {
    if (phase !== "running") {
      if (phase === "idle" || phase === "branched") {
        setActiveCheck(null);
        setCompletedChecks([]);
      }
      return;
    }
    let cancelled = false;
    let acc = 0;
    setCompletedChecks([]);
    setActiveCheck(checks[0]?.id ?? null);

    checks.forEach((c, idx) => {
      acc += c.durationMs;
      setTimeout(() => {
        if (cancelled) return;
        if (failedAt && c.id === failedAt) {
          setActiveCheck(null);
          return;
        }
        setCompletedChecks((prev) => [...prev, c.id]);
        const next = checks[idx + 1];
        setActiveCheck(next ? next.id : null);
      }, acc);
    });
    return () => {
      cancelled = true;
    };
  }, [phase, checks, failedAt]);

  return (
    <div className="relative overflow-hidden p-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-[var(--tone-brand-text)]" />
          <div className="text-base font-semibold">Delivery pipeline</div>
        </div>
        <div className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-[var(--foreground-muted)]">
          {phase}
        </div>
      </div>

      <div className="relative h-40 w-full">
        {/* main line */}
        <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-gradient-to-r from-emerald-500/60 via-emerald-400/70 to-emerald-500/60" />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wider text-emerald-300">
          main
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wider text-emerald-300">
          main
        </div>

        {/* branch line */}
        <AnimatePresence>
          {phase !== "idle" ? (
            <motion.svg
              key="branch"
              viewBox="0 0 600 120"
              className="absolute inset-0 h-full w-full"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <motion.path
                d="M 80 60 C 140 60, 160 20, 220 20 L 380 20"
                stroke={
                  phase === "failed" ? "rgba(244,63,94,0.85)" : "rgba(167,139,250,0.85)"
                }
                strokeWidth="2"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6 }}
              />
              {phase === "merged" ? (
                <motion.path
                  d="M 380 20 C 440 20, 460 60, 520 60"
                  stroke="rgba(52,211,153,0.85)"
                  strokeWidth="2"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6 }}
                />
              ) : null}
            </motion.svg>
          ) : null}
        </AnimatePresence>

        {/* branch label */}
        {phase !== "idle" ? (
          <div className="absolute left-1/2 top-2 -translate-x-1/2 rounded-md border border-[var(--tone-brand-border)] bg-[var(--tone-brand-bg)] px-2 py-0.5 text-[10px] font-mono text-[var(--tone-brand-text)]">
            {branchName}
          </div>
        ) : null}

        {/* commit dot */}
        {phase !== "idle" ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute"
            style={{ left: "calc(50% - 6px)", top: 14 }}
          >
            <div className="h-3 w-3 rounded-full bg-violet-400 ring-2 ring-violet-400/40" />
          </motion.div>
        ) : null}

        {/* merge icon */}
        {phase === "merged" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-12 top-1/2 -translate-y-1/2 text-emerald-300"
          >
            <GitMerge className="h-5 w-5" />
          </motion.div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-2">
        {checks.map((c) => {
          const done = completedChecks.includes(c.id);
          const failed = phase === "failed" && failedAt === c.id;
          const running = activeCheck === c.id && !failed;
          return (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/60 px-3 py-2 text-xs"
            >
              <span className="flex items-center gap-2">
                {failed ? (
                  <XCircle className="h-3.5 w-3.5 text-rose-400" />
                ) : done ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                ) : running ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-300" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-[var(--border-strong)]" />
                )}
                {c.label}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[var(--foreground-subtle)]">
                {failed ? "failed" : done ? "passed" : running ? "running" : "queued"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
