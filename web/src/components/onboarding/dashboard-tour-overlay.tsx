"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Step = {
  selector: string;
  title: string;
  description: string;
  /** Optional fallback if the element isn't on this page. */
  optional?: boolean;
};

const STEPS: Step[] = [
  {
    selector: '[data-tour="nav-dashboard"]',
    title: "This is your Dashboard",
    description:
      "Your home base on Leetdesign. Streaks, level, current tasks — all in one place. The sidebar lets you jump anywhere.",
  },
  {
    selector: '[data-tour="nav-projects"]',
    title: "Projects — guided incidents",
    description:
      "Each project is a multi-stage journey: learn a component, fix an incident, write a tiny snippet, ship it. Your badge unlocks more projects.",
  },
  {
    selector: '[data-tour="nav-practice"]',
    title: "Practice — open canvas like a real interview",
    description:
      "Drag components onto an open canvas, draw arrows between them, then submit your design for a VP review. This is your interview rehearsal.",
  },
  {
    selector: '[data-tour="activity-calendar"]',
    title: "Activity & streaks",
    description:
      "Your daily attendance heatmap. Show up consistently — streaks compound just like in real teams.",
  },
  {
    selector: '[data-tour="level-card"]',
    title: "Your rank progression",
    description:
      "Earn XP from projects and practice. Hit the threshold and you ladder up — Intern → SE I → SE II → Senior → Principal.",
  },
  {
    selector: '[data-tour="ongoing-tasks"]',
    title: "Pick up where you left off",
    description:
      "All your active and shipped projects live here. Click Resume on any in-flight project to jump back in.",
  },
  {
    selector: '[data-tour="identity-card"]',
    title: "Your employee badge",
    description:
      "Your Leetdesign identity: alias, work email, badge tier and Stardust balance. Everything we use to identify you in the org.",
    optional: true,
  },
];

interface Geom {
  rect: DOMRect;
  /** Where to anchor the tour card relative to the viewport. */
  cardPos: { top: number; left: number };
}

const CARD_W = 380;
const CARD_H = 220;
const PADDING = 12;

/**
 * True spotlight tour: dim everything OUTSIDE the highlighted element using a
 * giant box-shadow cutout, never apply any dimmer to the element itself, and
 * pulse a ring + glow on the target so it actually feels highlighted.
 */
export function DashboardTourOverlay({ enabled }: { enabled: boolean }) {
  const [open, setOpen] = useState(enabled);
  const [idx, setIdx] = useState(0);
  const [geom, setGeom] = useState<Geom | null>(null);
  const router = useRouter();
  const step = STEPS[idx];

  // Lock body scroll while tour is up.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Measure spotlight geometry when the step changes or the window resizes.
  useEffect(() => {
    if (!open) return;
    let raf = 0;
    let scrolled = false;

    const measure = () => {
      const el = document.querySelector(
        step.selector,
      ) as HTMLElement | null;
      if (!el) {
        setGeom(null);
        return;
      }
      if (!scrolled) {
        scrolled = true;
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      raf = window.requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        setGeom({ rect: r, cardPos: pickCardPosition(r) });
      });
    };

    measure();
    window.addEventListener("resize", measure);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, [open, step.selector]);

  const isLast = idx === STEPS.length - 1;

  if (!open) return null;

  async function finish() {
    try {
      await fetch("/api/user/complete-onboarding", { method: "POST" });
    } catch {
      // best effort — tour shouldn't block the user.
    }
    setOpen(false);
    if (window.location.search.includes("tour=1")) {
      router.replace("/dashboard");
    }
  }

  return (
    <div className="fixed inset-0 z-[90]">
      {/* When we have a target, a single div with a giant box-shadow paints the
       *  dim everywhere except inside its own bounds — a real spotlight cutout. */}
      {geom ? (
        <>
          <motion.div
            key={`spot-${step.selector}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-none absolute"
            style={{
              left: geom.rect.left - 8,
              top: geom.rect.top - 8,
              width: geom.rect.width + 16,
              height: geom.rect.height + 16,
              borderRadius: 16,
              boxShadow:
                "0 0 0 9999px rgba(4,6,12,0.72), 0 0 0 2px var(--brand) inset, 0 0 40px 4px rgba(139,92,246,0.55)",
            }}
          />
          {/* Pulsing ring around the spotlight to actually draw the eye. */}
          <motion.div
            key={`ring-${step.selector}`}
            className="pointer-events-none absolute rounded-2xl"
            style={{
              left: geom.rect.left - 8,
              top: geom.rect.top - 8,
              width: geom.rect.width + 16,
              height: geom.rect.height + 16,
            }}
            animate={{
              boxShadow: [
                "0 0 0 0 rgba(139,92,246,0.55)",
                "0 0 0 14px rgba(139,92,246,0)",
              ],
            }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        </>
      ) : (
        // No element on this page — show a plain dim with the card centered.
        <div className="absolute inset-0 bg-[rgba(4,6,12,0.78)]" />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={`card-${idx}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="surface fixed z-[91] w-[380px] border border-[var(--tone-brand-border)] p-5 shadow-2xl"
          style={
            geom
              ? { top: geom.cardPos.top, left: geom.cardPos.left }
              : {
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }
          }
        >
          <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[var(--tone-brand-text)]">
            <Compass className="h-3 w-3" /> Leetdesign tour ·{" "}
            <span className="text-[var(--foreground-subtle)]">
              {idx + 1} / {STEPS.length}
            </span>
          </div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--foreground)]">
            <Sparkles className="h-4 w-4 text-[var(--tone-brand-text)]" />
            {step.title}
          </h3>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            {step.description}
          </p>
          {!geom ? (
            <p className="mt-2 text-[11px] text-[var(--foreground-subtle)]">
              Hint: this element isn&apos;t visible right now — click Next to
              continue.
            </p>
          ) : null}
          <div className="mt-5 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={finish}>
              Skip tour
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIdx((s) => Math.max(0, s - 1))}
                disabled={idx === 0}
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
              {isLast ? (
                <Button size="sm" onClick={finish}>
                  Get to work
                </Button>
              ) : (
                <Button size="sm" onClick={() => setIdx((s) => s + 1)}>
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/**
 * Place the tour card in whichever quadrant has the most room around the
 * highlighted element so it never covers the spotlight.
 */
function pickCardPosition(r: DOMRect): { top: number; left: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const spaceRight = vw - r.right;
  const spaceLeft = r.left;
  const spaceBelow = vh - r.bottom;

  // Default: below the element, left-aligned to it.
  let top = r.bottom + PADDING;
  let left = Math.min(vw - CARD_W - PADDING, Math.max(PADDING, r.left));

  // If not enough room below, try to the side or above.
  if (spaceBelow < CARD_H + PADDING) {
    if (spaceRight > CARD_W + PADDING) {
      top = Math.max(PADDING, Math.min(vh - CARD_H - PADDING, r.top));
      left = r.right + PADDING;
    } else if (spaceLeft > CARD_W + PADDING) {
      top = Math.max(PADDING, Math.min(vh - CARD_H - PADDING, r.top));
      left = r.left - CARD_W - PADDING;
    } else {
      // Push above.
      top = Math.max(PADDING, r.top - CARD_H - PADDING);
      left = Math.min(vw - CARD_W - PADDING, Math.max(PADDING, r.left));
    }
  }

  return { top, left };
}
