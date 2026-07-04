"use client";

import { useEffect } from "react";
import { GraduationCap, CheckCircle2, Circle, X, Lightbulb } from "lucide-react";
import { useDesignStore } from "@/lib/simulator/store";
import { useSimulationStore } from "@/lib/simulator/store";
import { useTeachingStore } from "@/lib/simulator/teaching-store";
import { getScenarioForDesign, type ScenarioCheckContext } from "@/lib/simulator/scenarios";
import { cn } from "@/lib/utils";

export function ScenarioGuide() {
  const design = useDesignStore((s) => s.design);
  const running = useSimulationStore((s) => s.running);
  const totalRps = useSimulationStore((s) => s.totalSystemRps);
  const systemHealth = useSimulationStore((s) => s.systemHealth);
  const scenario = useTeachingStore((s) => s.scenario);
  const startScenario = useTeachingStore((s) => s.startScenario);
  const dismissScenario = useTeachingStore((s) => s.dismissScenario);
  const completeScenarioStep = useTeachingStore((s) => s.completeScenarioStep);

  const scenarioDef = design ? getScenarioForDesign(design) : null;

  useEffect(() => {
    if (!design || !scenarioDef || scenario) return;
    startScenario(scenarioDef.id, scenarioDef.steps.length);
  }, [design, scenarioDef, scenario, startScenario]);

  useEffect(() => {
    if (!scenario || !scenarioDef) return;

    const ctx: ScenarioCheckContext = {
      running,
      totalRps,
      systemHealth,
      traceCompleted: scenario.traceCompleted,
      spikeTriggered: scenario.spikeTriggered,
      wasEverUnhealthy: scenario.wasEverUnhealthy,
      incidentRecovered: scenario.incidentRecovered,
    };

    scenarioDef.steps.forEach((step, i) => {
      if (!scenario.completedSteps[i] && step.check(ctx)) {
        completeScenarioStep(i);
      }
    });
  }, [scenario, scenarioDef, running, totalRps, systemHealth, completeScenarioStep]);

  if (!scenarioDef || !scenario?.active) return null;

  const stepIndex = scenario.stepIndex;
  const step = scenarioDef.steps[stepIndex];
  const allDone = scenario.completedSteps.every(Boolean);

  if (allDone) {
    return (
      <div className="pointer-events-none absolute left-4 top-4 z-20 max-w-xs">
        <div className="pointer-events-auto clay-card border-emerald-300/40 p-4 shadow-xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <div className="text-sm font-semibold text-[var(--clay-text)]">Scenario complete!</div>
          </div>
          <p className="mt-1 text-xs text-[var(--clay-text-muted)]">
            You traced traffic, survived a spike, and fixed an incident. Try breaking things on your own.
          </p>
          <button
            type="button"
            onClick={dismissScenario}
            className="mt-3 w-full rounded-lg bg-[var(--clay-primary)]/10 py-1.5 text-xs font-semibold text-[var(--clay-primary)] hover:bg-[var(--clay-primary)]/15"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  if (!step) return null;

  return (
    <div className="pointer-events-none absolute left-4 top-4 z-20 max-w-xs">
      <div className="pointer-events-auto clay-card p-4 shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--clay-lilac)]/15">
              <GraduationCap className="h-4 w-4 text-[var(--clay-lilac)]" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--clay-lilac)]">
                {scenarioDef.title}
              </div>
              <div className="text-xs text-[var(--clay-text-subtle)]">
                Step {stepIndex + 1} of {scenarioDef.steps.length}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissScenario}
            className="grid h-6 w-6 place-items-center rounded text-[var(--clay-text-subtle)] hover:bg-[var(--clay-surface-2)]"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        <div className="mt-3 flex gap-1">
          {scenarioDef.steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full",
                scenario.completedSteps[i] ? "bg-emerald-500" :
                i === stepIndex ? "bg-[var(--clay-primary)]" :
                "bg-[var(--clay-border)]",
              )}
            />
          ))}
        </div>

        <div className="mt-3 text-sm font-semibold text-[var(--clay-text)]">{step.title}</div>
        <p className="mt-1 text-xs leading-relaxed text-[var(--clay-text-muted)]">
          {step.instruction}
        </p>

        {step.hint && (
          <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-[var(--clay-bg-soft)] p-2">
            <Lightbulb className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
            <p className="text-[10px] text-[var(--clay-text-muted)]">{step.hint}</p>
          </div>
        )}

        <div className="mt-3 space-y-1">
          {scenarioDef.steps.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px]">
              {scenario.completedSteps[i] ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              ) : (
                <Circle className={cn("h-3 w-3", i === stepIndex ? "text-[var(--clay-primary)]" : "text-[var(--clay-border)]")} />
              )}
              <span className={cn(
                scenario.completedSteps[i] ? "text-[var(--clay-text-subtle)] line-through" :
                i === stepIndex ? "font-semibold text-[var(--clay-text)]" :
                "text-[var(--clay-text-subtle)]",
              )}>
                {s.title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
