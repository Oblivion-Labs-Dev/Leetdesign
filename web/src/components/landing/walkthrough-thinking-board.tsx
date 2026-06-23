"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, BrainCircuit, Gauge, Layers3, ShieldCheck, Target } from "lucide-react";

const PRINCIPLES = [
  { icon: ShieldCheck, label: "Reliability", note: "fallback paths + retries", tone: "#7BA892" },
  { icon: Gauge, label: "Performance", note: "latency budget by hop", tone: "#6B8CAE" },
  { icon: AlertTriangle, label: "Failures", note: "blast radius awareness", tone: "#D4893A" },
];

export function WalkthroughThinkingBoard() {
  const reducedMotion = useReducedMotion();

  return (
    <div className="clay-card relative overflow-hidden p-4 sm:p-5">
      <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-[var(--clay-lilac)]/18 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-8 h-40 w-40 rounded-full bg-[var(--clay-accent)]/15 blur-3xl" />

      <div className="relative z-10 mb-3 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--clay-text-subtle)]">
          Decision board
        </p>
        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--clay-border)] bg-[var(--clay-surface)]/90 px-2 py-1 text-[10px] text-[var(--clay-text-muted)]">
          <BrainCircuit className="h-3 w-3 text-[var(--clay-primary)]" />
          Think like staff engineer
        </span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-[var(--clay-border)] bg-[var(--clay-canvas-a)] p-3 sm:p-4">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, color-mix(in srgb, var(--clay-primary) 22%, transparent) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        />

        <div className="relative z-10 grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-xl border border-[var(--clay-border)] bg-[var(--clay-surface)]/95 p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--clay-text-subtle)]">
              Scenario stack
            </p>
            <div className="space-y-2">
              <ScenarioCard
                title="High read traffic spike"
                subtitle="Choose cache strategy + ttl"
                tone="#6B8CAE"
                delay={0}
                reducedMotion={Boolean(reducedMotion)}
              />
              <ScenarioCard
                title="Partial region outage"
                subtitle="Design graceful degradation"
                tone="#9B8DC4"
                delay={0.2}
                reducedMotion={Boolean(reducedMotion)}
              />
              <ScenarioCard
                title="Write burst & queue lag"
                subtitle="Control backpressure policy"
                tone="#7BA892"
                delay={0.4}
                reducedMotion={Boolean(reducedMotion)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-[var(--clay-border)] bg-[var(--clay-surface)]/95 p-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--clay-text-subtle)]">
                Evaluation rubric
              </p>
              <div className="space-y-1.5">
                {PRINCIPLES.map((item) => (
                  <div key={item.label} className="rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface)] px-2 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <item.icon className="h-3 w-3" style={{ color: item.tone }} />
                      <p className="text-[10px] font-semibold text-[var(--clay-text)]">{item.label}</p>
                    </div>
                    <p className="mt-0.5 text-[9px] text-[var(--clay-text-muted)]">{item.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--clay-border)] bg-[var(--clay-surface)]/95 p-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--clay-text-subtle)]">
                Progress
              </p>
              <div className="grid grid-cols-2 gap-2">
                <StatChip icon={Layers3} label="scenarios" value="12 practiced" />
                <StatChip icon={Target} label="readiness" value="84%" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScenarioCard({
  title,
  subtitle,
  tone,
  delay,
  reducedMotion,
}: {
  title: string;
  subtitle: string;
  tone: string;
  delay: number;
  reducedMotion: boolean;
}) {
  return (
    <motion.div
      className="rounded-lg border px-2.5 py-2"
      style={{
        borderColor: "color-mix(in srgb, var(--clay-border) 70%, transparent)",
        background: `linear-gradient(165deg, color-mix(in srgb, ${tone} 12%, var(--clay-surface)) 0%, var(--clay-surface) 100%)`,
      }}
      animate={reducedMotion ? {} : { y: [0, -2, 0] }}
      transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <p className="text-[10px] font-semibold text-[var(--clay-text)]">{title}</p>
      <p className="mt-0.5 text-[9px] text-[var(--clay-text-muted)]">{subtitle}</p>
    </motion.div>
  );
}

function StatChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Layers3;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface)] px-2 py-1.5">
      <div className="flex items-center gap-1">
        <Icon className="h-3 w-3 text-[var(--clay-primary)]" />
        <p className="text-[8px] uppercase tracking-wide text-[var(--clay-text-subtle)]">{label}</p>
      </div>
      <p className="mt-0.5 text-[10px] font-semibold text-[var(--clay-text)]">{value}</p>
    </div>
  );
}
