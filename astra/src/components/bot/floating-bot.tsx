"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, BookOpen, FileText } from "lucide-react";
import { AstraBot, type BotMood } from "@/components/bot/bot";

/**
 * Lightweight concierge bubble — opens with a friendly greeting only.
 *
 * Requirements, trade-offs, napkin math, stage narration, and code snippets
 * live exclusively in Brief (toolbar) and Transcript (full chaptered read),
 * not in chat. This avoids duplicating educational content inside a scroll.
 */
export function FloatingBot({
  mood = "calm",
  hasBriefLink,
  onOpenBrief,
  projectId,
}: {
  mood?: BotMood;
  /** Brief button only when briefing content exists */
  hasBriefLink?: boolean;
  onOpenBrief?: () => void;
  /** `projects/[projectId]/transcript` — optional */
  projectId?: string;
}) {
  const [open, setOpen] = useState(false);

  const message =
    "Hi — I'm Aster.\nHow can I help you today?\n\n" +
    "Everything we teach for this stage — requirements, trade-offs, napkin math, " +
    "and stage narration — lives in Brief and Transcript.";

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      <AnimatePresence>
        {open ? (
          <motion.div
            key="msg"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto w-[min(360px,calc(100vw-48px))]"
          >
            <div className="relative">
              <AstraBot
                mood={mood}
                message={message}
                speakerName="Aster · On-call Bot"
                hideMoodLabel
              />
              <button
                type="button"
                aria-label="Hide Aster"
                onClick={() => setOpen(false)}
                className="absolute right-2 top-2 rounded-full p-1 text-[var(--foreground-subtle)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {(hasBriefLink && onOpenBrief) || projectId ? (
              <div className="mt-2 flex flex-wrap gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2">
                {hasBriefLink && onOpenBrief ? (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenBrief();
                      setOpen(false);
                    }}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--tone-brand-border)] bg-[var(--tone-brand-bg)] px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--tone-brand-text)] hover:bg-[var(--tone-brand-bg)]/80 min-w-[140px]"
                  >
                    <BookOpen className="h-3.5 w-3.5" /> Brief
                  </button>
                ) : null}
                {projectId ? (
                  <Link
                    href={`/projects/${projectId}/transcript`}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)] hover:border-[var(--tone-brand-border)] hover:text-[var(--foreground)] min-w-[140px]"
                    onClick={() => setOpen(false)}
                  >
                    <FileText className="h-3.5 w-3.5" /> Transcript
                  </Link>
                ) : null}
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={open ? "Close Aster" : "Open Aster — chat help"}
        className="pointer-events-auto grid h-12 w-12 place-items-center rounded-full border border-[var(--tone-brand-border)] bg-gradient-to-br from-[var(--brand)] to-fuchsia-500 text-white shadow-[0_18px_50px_-15px_rgba(167,139,250,0.7)]"
      >
        <MessageCircle className="h-5 w-5" />
      </button>
    </div>
  );
}
