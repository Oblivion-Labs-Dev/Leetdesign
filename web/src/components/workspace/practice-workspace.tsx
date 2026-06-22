"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Target,
} from "lucide-react";
import type {
  ArchitectureSnapshot,
  PracticeExercise,
  ReviewVerdict,
} from "@/types";
import { PracticeCanvas } from "@/components/practice/practice-canvas";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { Progress } from "@/components/ui/progress";
import { localAIJudge } from "@/lib/ai/judge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const EMPTY_SNAPSHOT = (id: string): ArchitectureSnapshot => ({
  exerciseId: id,
  nodes: [],
  edges: [],
  submittedAt: new Date().toISOString(),
});

export function PracticeWorkspace({ exercise }: { exercise: PracticeExercise }) {
  const [snapshot, setSnapshot] = useState<ArchitectureSnapshot>(() =>
    EMPTY_SNAPSHOT(exercise.id),
  );
  const [notes, setNotes] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [verdict, setVerdict] = useState<ReviewVerdict | null>(null);

  const onSnapshotChange = useCallback((s: ArchitectureSnapshot) => {
    setSnapshot(s);
  }, []);

  const submitForReview = useCallback(async () => {
    setReviewing(true);
    setVerdict(null);
    const v = await localAIJudge.judgeArchitecture(exercise, {
      ...snapshot,
      notes,
      submittedAt: new Date().toISOString(),
    });
    setVerdict(v);
    setReviewing(false);
  }, [exercise, snapshot, notes]);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--tone-accent-text)]">
              Practice prompt · Interview rehearsal
            </div>
            <CardTitle className="mt-1 text-lg">{exercise.title}</CardTitle>
            <CardDescription className="mt-2 max-w-3xl text-sm">
              {exercise.prompt}
            </CardDescription>
          </div>
          <Pill tone="accent">+{exercise.rewardXp} XP</Pill>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {exercise.nfrs.map((n) => (
            <div
              key={n}
              className="flex items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/60 px-3 py-2 text-xs text-[var(--foreground-muted)]"
            >
              <Target className="mt-0.5 h-3 w-3 shrink-0 text-[var(--tone-accent-text)]" />
              {n}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <PracticeCanvas
            exerciseId={exercise.id}
            inventory={exercise.inventory}
            onSnapshotChange={onSnapshotChange}
          />

          <Card>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[var(--foreground-subtle)]">
              <Lightbulb className="h-3 w-3" />
              Design notes for the VP review
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Trade-offs, scaling assumptions, what you would build next, what you'd do differently."
              className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background-soft)]/60 px-3 py-2 text-sm outline-none placeholder:text-[var(--foreground-subtle)] focus:border-[var(--tone-accent-border)]"
            />
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">VP Review Meeting</CardTitle>
              <Pill tone="brand">
                <Sparkles className="h-3 w-3" /> AI graded
              </Pill>
            </div>
            <CardDescription className="mt-1">
              Submit your design and a panel of AI VPs grades it across
              correctness, reliability, scalability, cost, and clarity. Both
              the components AND the connections between them are scored.
            </CardDescription>
            <Button
              className="mt-3 w-full"
              disabled={reviewing || snapshot.nodes.length === 0}
              onClick={submitForReview}
            >
              <Send className="h-3.5 w-3.5" />
              {reviewing ? "Reviewing…" : "Submit to review"}
            </Button>
          </Card>

          <AnimatePresence>
            {verdict ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="surface p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-semibold">Verdict</div>
                  <Pill tone={verdict.passed ? "success" : "danger"}>
                    {verdict.passed ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" /> Approved
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3" /> Needs work
                      </>
                    )}
                  </Pill>
                </div>
                <div className="text-2xl font-semibold">
                  {verdict.score.total}
                  <span className="text-sm text-[var(--foreground-subtle)]">/100</span>
                </div>

                <div className="mt-3 space-y-2 text-xs">
                  <ScoreBar label="Correctness" v={verdict.score.correctness} />
                  <ScoreBar label="Reliability" v={verdict.score.reliability} />
                  <ScoreBar label="Scalability" v={verdict.score.scalability} />
                  <ScoreBar label="Cost" v={verdict.score.cost} />
                  <ScoreBar label="Clarity" v={verdict.score.clarity} />
                </div>

                {verdict.strengths.length > 0 && (
                  <div className="mt-3">
                    <div className="text-[11px] uppercase tracking-wider text-[var(--tone-success-text)]">
                      Strengths
                    </div>
                    <ul className="mt-1 space-y-1 text-xs text-[var(--foreground-muted)]">
                      {verdict.strengths.map((s) => (
                        <li key={s}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {verdict.gaps.length > 0 && (
                  <div className="mt-3">
                    <div className="text-[11px] uppercase tracking-wider text-[var(--tone-danger-text)]">
                      Gaps
                    </div>
                    <ul className="mt-1 space-y-1 text-xs text-[var(--foreground-muted)]">
                      {verdict.gaps.map((s) => (
                        <li key={s}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>

          <Card>
            <div className="text-[11px] uppercase tracking-wider text-[var(--foreground-subtle)]">
              Rubric hints
            </div>
            <ul className="mt-2 space-y-1.5 text-xs text-[var(--foreground-muted)]">
              {exercise.rubricHints.map((h) => (
                <li
                  key={h}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/60 px-2.5 py-1.5"
                >
                  {h}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, v }: { label: string; v: number }) {
  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between text-[11px] text-[var(--foreground-muted)]">
        <span>{label}</span>
        <span>{v}</span>
      </div>
      <Progress value={v / 100} />
    </div>
  );
}
