"use client";

import { useEffect } from "react";
import {
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Circle,
  X,
  Lightbulb,
  Play,
  Layers,
} from "lucide-react";
import { useDesignStore } from "@/lib/simulator/store";
import { useSimulationStore } from "@/lib/simulator/store";
import { useTeachingStore } from "@/lib/simulator/teaching-store";
import { useWorkspaceStore } from "@/lib/simulator/workspace-store";
import { getScenarioForDesign, type ScenarioCheckContext } from "@/lib/simulator/scenarios";
import { cn } from "@/lib/utils";

export function MissionDock() {
  const design = useDesignStore((s) => s.design);
  const running = useSimulationStore((s) => s.running);
  const totalRps = useSimulationStore((s) => s.totalSystemRps);
  const systemHealth = useSimulationStore((s) => s.systemHealth);
  const toggle = useSimulationStore((s) => s.toggle);

  const scenario = useTeachingStore((s) => s.scenario);
  const startScenario = useTeachingStore((s) => s.startScenario);
  const dismissScenario = useTeachingStore((s) => s.dismissScenario);
  const completeScenarioStep = useTeachingStore((s) => s.completeScenarioStep);

  const missionExpanded = useWorkspaceStore((s) => s.missionExpanded);
  const toggleMission = useWorkspaceStore((s) => s.toggleMission);
  const setMode = useWorkspaceStore((s) => s.setMode);

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

  const handlePrimary = () => {
    if (allDone) {
      dismissScenario();
      return;
    }
    if (!step) return;
    if (stepIndex === 0 && !running) {
      setMode("run");
      toggle();
    } else if (step.title.toLowerCase().includes("connect")) {
      setMode("connect");
    } else if (step.title.toLowerCase().includes("compose") || step.title.toLowerCase().includes("add")) {
      setMode("compose");
      useWorkspaceStore.getState().openBrowseShelf();
    } else {
      setMode("run");
    }
    if (!missionExpanded) toggleMission();
  };

  if (allDone) {
    return (
      <div className="ws-mission-dock pointer-events-none">
        <div className="ws-mission-dock-inner pointer-events-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[var(--clay-text)]">Scenario complete</div>
              <p className="text-xs text-[var(--clay-text-muted)]">You traced traffic, survived a spike, and fixed an incident.</p>
            </div>
            <button
              type="button"
              onClick={dismissScenario}
              className="shrink-0 rounded-full bg-[var(--clay-primary)]/12 px-3 py-1.5 text-xs font-semibold text-[var(--clay-primary)]"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!step) return null;

  return (
    <div className="ws-mission-dock pointer-events-none">
      <div className="ws-mission-dock-inner pointer-events-auto">
        {/* Compact bar */}
        <div className="flex items-center gap-3 px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--clay-lilac)]">
              {scenarioDef.title}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-[var(--clay-text)]">
                Step {stepIndex + 1} of {scenarioDef.steps.length}
              </span>
              <span className="truncate text-xs text-[var(--clay-text-muted)]">
                {step.title}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePrimary}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-b from-[var(--clay-primary)] to-[var(--clay-primary-dark)] px-3 py-1.5 text-xs font-semibold text-white shadow-[0_4px_12px_-4px_rgba(107,140,174,0.45)]"
          >
            {stepIndex === 0 && !running ? (
              <>
                <Play className="h-3 w-3" />
                Start simulation
              </>
            ) : (
              <>
                <Layers className="h-3 w-3" />
                Continue
              </>
            )}
          </button>

          <button
            type="button"
            onClick={toggleMission}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[var(--clay-text-subtle)] hover:bg-[var(--clay-surface-2)]"
            aria-expanded={missionExpanded}
          >
            {missionExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={dismissScenario}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[var(--clay-text-subtle)] hover:bg-[var(--clay-surface-2)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Progress strip */}
        <div className="flex gap-1 px-4 pb-2">
          {scenarioDef.steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                scenario.completedSteps[i] ? "bg-emerald-500" :
                i === stepIndex ? "bg-[var(--clay-primary)]" :
                "bg-[var(--clay-border)]",
              )}
            />
          ))}
        </div>

        {/* Expanded detail */}
        {missionExpanded && (
          <div className="border-t border-[var(--clay-border)] px-4 py-3">
            {scenarioDef.brief && (
              <div className="mb-3 rounded-xl bg-[var(--clay-bg-soft)] p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
                  Scenario brief
                </div>
                <p className="mt-1 text-xs font-medium text-[var(--clay-text)]">{scenarioDef.brief.useCase}</p>
                <p className="mt-1 text-[11px] text-[var(--clay-text-muted)]">{scenarioDef.brief.goal}</p>
                {scenarioDef.brief.constraint && (
                  <p className="mt-1 text-[10px] text-[var(--clay-text-subtle)]">{scenarioDef.brief.constraint}</p>
                )}
              </div>
            )}

            <p className="text-xs leading-relaxed text-[var(--clay-text-muted)]">{step.instruction}</p>

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
                    scenario.completedSteps[i] && "text-[var(--clay-text-subtle)] line-through",
                    i === stepIndex && !scenario.completedSteps[i] && "font-semibold text-[var(--clay-text)]",
                    i !== stepIndex && !scenario.completedSteps[i] && "text-[var(--clay-text-subtle)]",
                  )}>
                    {s.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
