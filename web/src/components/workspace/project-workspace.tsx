"use client";

import { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw, Trophy, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ScenarioDefinition } from "@/types";
import { useWorkspace } from "@/store/workspace";
import { PipelineCanvas } from "@/components/pipeline/pipeline-canvas";
import { ComponentInventory } from "@/components/pipeline/inventory";
import { DeliveryTimeline } from "@/components/delivery/delivery-timeline";
import { LeetdesignBot } from "@/components/bot/bot";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { COMPONENT_LIBRARY } from "@/lib/content/components";

export function ProjectWorkspace({ scenario }: { scenario: ScenarioDefinition }) {
  const {
    graph,
    delivery,
    feedback,
    passed,
    isRunning,
    loadScenario,
    placeComponent,
    runSimulation,
  } = useWorkspace();

  useEffect(() => {
    loadScenario(scenario);
  }, [scenario, loadScenario]);

  const slotsRemaining = useMemo(() => {
    if (!graph) return 0;
    return graph.nodes.filter((n) => n.isMissingSlot).length;
  }, [graph]);

  const botMood =
    passed === true
      ? "happy"
      : passed === false
        ? "alert"
        : isRunning
          ? "thinking"
          : graph?.health === "failing"
            ? "critical"
            : "alert";

  const botMessage =
    passed === true
      ? "Boom. p95 latency back under 100ms. Database is breathing again. Logging the win to your record."
      : passed === false
        ? "Pipeline still on fire. Re-read the symptoms — what absorbs hot read traffic before it hits the DB?"
        : isRunning
          ? "Watching CI… branch is up, build is green, holding for canary."
          : scenario.incident.botMessage;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="surface p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-rose-300/80">
                Active incident
              </div>
              <h2 className="mt-1 text-xl font-semibold">{scenario.title}</h2>
              <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                {scenario.objective}
              </p>
            </div>
            <Pill tone="danger">
              <AlertTriangle className="h-3 w-3" /> {scenario.incident.severity}
            </Pill>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {scenario.incident.symptoms.map((s) => (
              <div
                key={s}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/60 px-3 py-2 text-xs text-[var(--foreground-muted)]"
              >
                {s}
              </div>
            ))}
          </div>
        </div>

        <LeetdesignBot mood={botMood} message={botMessage} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[260px_1fr_300px]">
        <ComponentInventory available={scenario.inventory} />

        <div className="space-y-4">
          {graph ? (
            <PipelineCanvas
              graph={graph}
              onDropToSlot={(slotId, type) => {
                const c = COMPONENT_LIBRARY[type];
                if (!c) return;
                placeComponent(slotId, type, c.label);
              }}
            />
          ) : null}

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
            <div className="flex items-center gap-3 text-xs text-[var(--foreground-muted)]">
              <Pill tone={slotsRemaining > 0 ? "warning" : "success"}>
                {slotsRemaining > 0
                  ? `${slotsRemaining} slot${slotsRemaining > 1 ? "s" : ""} to fill`
                  : "Ready to ship"}
              </Pill>
              {passed === true && (
                <span className="inline-flex items-center gap-1 text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Merged to main
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadScenario(scenario)}
                disabled={isRunning}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </Button>
              <Button
                size="sm"
                disabled={isRunning || slotsRemaining > 0}
                onClick={() => runSimulation()}
              >
                <Play className="h-3.5 w-3.5" />
                {isRunning ? "Running CI…" : "Submit & run pipeline"}
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {feedback ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`surface flex items-start gap-3 p-4 ${
                  passed
                    ? "border-emerald-500/40"
                    : "border-rose-500/40"
                }`}
              >
                {passed ? (
                  <Trophy className="mt-0.5 h-5 w-5 text-emerald-300" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-rose-300" />
                )}
                <div>
                  <div className="text-sm font-semibold">
                    {passed ? "Incident resolved" : "Fix did not stabilize the system"}
                  </div>
                  <div className="text-sm text-[var(--foreground-muted)]">
                    {feedback}
                  </div>
                  {passed ? (
                    <div className="mt-2 text-xs text-emerald-300">
                      +{scenario.rewardXp} XP · +{scenario.rewardCurrency} rewards
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <DeliveryTimeline events={delivery} />
      </div>
    </div>
  );
}
