"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, Star, Trophy } from "lucide-react";

export interface RewardEvent {
  id: string;
  xp?: number;
  stardust?: number;
  title: string;
  detail?: string;
  /**
   * toast      — small inline toast at the top of the page.
   * burst      — toast + a confetti-dot explosion around it.
   * fullscreen — full-page confetti sheet for project completion.
   */
  size?: "toast" | "burst" | "fullscreen";
}

export function RewardOverlay({
  events,
  onDismiss,
}: {
  events: RewardEvent[];
  onDismiss: (id: string) => void;
}) {
  const fullscreenEvents = events.filter((e) => e.size === "fullscreen");
  const inlineEvents = events.filter((e) => e.size !== "fullscreen");
  return (
    <>
      {/* Inline toast stack at the top of the screen. */}
      <div className="pointer-events-none fixed left-1/2 top-24 z-[60] -translate-x-1/2">
        <AnimatePresence>
          {inlineEvents.map((e, i) => (
            <RewardCard
              key={e.id}
              event={e}
              index={i}
              onDone={() => onDismiss(e.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Fullscreen "project complete" celebration. */}
      <AnimatePresence>
        {fullscreenEvents.map((e) => (
          <FullscreenConfetti
            key={e.id}
            event={e}
            onDone={() => onDismiss(e.id)}
          />
        ))}
      </AnimatePresence>
    </>
  );
}

function RewardCard({
  event,
  index,
  onDone,
}: {
  event: RewardEvent;
  index: number;
  onDone: () => void;
}) {
  useEffect(() => {
    const t = window.setTimeout(onDone, event.size === "burst" ? 3200 : 2200);
    return () => window.clearTimeout(t);
  }, [onDone, event.size]);

  const isBurst = event.size === "burst";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{
        opacity: 1,
        y: -index * 70,
        scale: 1,
      }}
      exit={{ opacity: 0, y: -120, scale: 0.95 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="pointer-events-auto absolute left-1/2 -translate-x-1/2"
    >
      <div
        className={`relative flex items-center gap-3 rounded-2xl border px-4 py-2.5 shadow-2xl backdrop-blur-md ${
          isBurst
            ? "border-[var(--tone-success-border)] bg-[var(--tone-success-bg)]"
            : "border-[var(--tone-brand-border)] bg-[var(--surface)]/95"
        }`}
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -6, 0] }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[var(--brand)] to-[var(--accent)] text-white"
        >
          <Sparkles className="h-4 w-4" />
        </motion.div>
        <div className="min-w-[180px]">
          <div className="text-sm font-semibold">{event.title}</div>
          <div className="flex items-center gap-2 text-[11px]">
            {event.xp ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--tone-brand-border)] bg-[var(--tone-brand-bg)] px-2 py-0.5 text-[var(--tone-brand-text)]">
                <Zap className="h-3 w-3" /> +{event.xp} XP
              </span>
            ) : null}
            {event.stardust ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--tone-warning-border)] bg-[var(--tone-warning-bg)] px-2 py-0.5 text-[var(--tone-warning-text)]">
                <Star className="h-3 w-3" /> +{event.stardust} ✦
              </span>
            ) : null}
          </div>
          {event.detail ? (
            <div className="mt-0.5 text-[11px] text-[var(--foreground-muted)]">
              {event.detail}
            </div>
          ) : null}
        </div>
      </div>

      {isBurst ? <ConfettiDots /> : null}
    </motion.div>
  );
}

const COLORS = [
  "var(--brand)",
  "var(--accent)",
  "var(--tone-success-text)",
  "var(--tone-warning-text)",
];

function ConfettiDots() {
  // 18 little dots that explode outward from the toast.
  const dots = Array.from({ length: 18 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {dots.map((_, i) => {
        const angle = (i / dots.length) * Math.PI * 2;
        const dist = 60 + Math.random() * 70;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        return (
          <motion.span
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
            animate={{
              x: dx,
              y: dy,
              opacity: 0,
              scale: 1,
              rotate: Math.random() * 360,
            }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-sm"
            style={{ background: COLORS[i % COLORS.length] }}
          />
        );
      })}
    </div>
  );
}

// ----------------------------------------------------------------------
// Fullscreen confetti — fires once when the project is complete
// ----------------------------------------------------------------------

const FULLSCREEN_DOTS = 140;

function FullscreenConfetti({
  event,
  onDone,
}: {
  event: RewardEvent;
  onDone: () => void;
}) {
  const [showCard, setShowCard] = useState(true);
  useEffect(() => {
    const t1 = window.setTimeout(() => setShowCard(false), 4500);
    const t2 = window.setTimeout(onDone, 6000);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [onDone]);

  // Pre-compute particle positions so they don't re-randomise per render.
  const dots = Array.from({ length: FULLSCREEN_DOTS }, (_, i) => ({
    id: i,
    leftPct: Math.random() * 100,
    delay: Math.random() * 0.6,
    duration: 2.5 + Math.random() * 2.5,
    size: 6 + Math.random() * 8,
    color: COLORS[i % COLORS.length],
    rotate: Math.random() * 720 - 360,
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-none fixed inset-0 z-[70] overflow-hidden"
    >
      {/* Confetti rain */}
      {dots.map((d) => (
        <motion.span
          key={d.id}
          initial={{ y: -40, opacity: 0, rotate: 0 }}
          animate={{
            y: "110vh",
            opacity: [0, 1, 1, 0],
            rotate: d.rotate,
          }}
          transition={{ duration: d.duration, delay: d.delay, ease: "easeIn" }}
          className="absolute rounded-sm"
          style={{
            left: `${d.leftPct}%`,
            top: 0,
            width: d.size,
            height: d.size * 0.4,
            background: d.color,
          }}
        />
      ))}

      {/* Center hero card */}
      <AnimatePresence>
        {showCard ? (
          <motion.div
            key="card"
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute inset-0 grid place-items-center"
          >
            <div className="surface relative max-w-[440px] overflow-hidden border border-[var(--tone-success-border)] bg-[var(--tone-success-bg)] p-6 text-center shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
              <motion.div
                animate={{ rotate: [0, -8, 8, -5, 0] }}
                transition={{ duration: 0.9, repeat: Infinity, repeatType: "loop" }}
                className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 text-white shadow-lg"
              >
                <Trophy className="h-7 w-7" />
              </motion.div>
              <div className="mt-3 text-xs uppercase tracking-[0.22em] text-[var(--tone-success-text)]">
                Project complete
              </div>
              <div className="mt-1 text-2xl font-extrabold tracking-tight">
                {event.title}
              </div>
              {event.detail ? (
                <div className="mt-1 text-xs uppercase tracking-wider text-[var(--foreground-muted)]">
                  {event.detail}
                </div>
              ) : null}
              <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                {event.xp ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--tone-brand-border)] bg-[var(--surface)]/80 px-3 py-1 text-[var(--tone-brand-text)]">
                    <Zap className="h-3.5 w-3.5" /> +{event.xp} XP
                  </span>
                ) : null}
                {event.stardust ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--tone-warning-border)] bg-[var(--surface)]/80 px-3 py-1 text-[var(--tone-warning-text)]">
                    <Star className="h-3.5 w-3.5" /> +{event.stardust} stardust
                  </span>
                ) : null}
              </div>
              <div className="mt-4 text-[11px] text-[var(--foreground-muted)]">
                Open the transcript anytime to revisit every stage —
                you don&apos;t need to restart the project.
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

export function useRewardQueue() {
  const [events, setEvents] = useState<RewardEvent[]>([]);
  const push = (ev: Omit<RewardEvent, "id"> & { id?: string }) => {
    const id = ev.id ?? `rw_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setEvents((arr) => [...arr, { ...ev, id }]);
  };
  const dismiss = (id: string) =>
    setEvents((arr) => arr.filter((e) => e.id !== id));
  return { events, push, dismiss };
}
