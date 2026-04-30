"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type BotMood = "calm" | "thinking" | "alert" | "critical" | "happy";

const MOOD_COLOR: Record<BotMood, string> = {
  calm: "from-cyan-400 to-sky-500",
  thinking: "from-violet-400 to-fuchsia-500",
  alert: "from-amber-400 to-orange-500",
  critical: "from-rose-400 to-red-500",
  happy: "from-emerald-400 to-teal-500",
};

export function AstraBot({
  mood = "calm",
  message,
  speakerName = "Aster · On-call Bot",
  className,
  hideMoodLabel,
}: {
  mood?: BotMood;
  message: string;
  speakerName?: string;
  className?: string;
  hideMoodLabel?: boolean;
}) {
  return (
    <div
      className={cn(
        "surface relative flex items-start gap-4 p-4 sm:p-5",
        className,
      )}
    >
      <motion.div
        animate={{ y: mood === "critical" ? [0, -2, 0] : 0 }}
        transition={{
          repeat: mood === "critical" ? Infinity : 0,
          duration: 0.4,
        }}
        className={cn(
          "relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br",
          MOOD_COLOR[mood],
        )}
      >
        <BotFace mood={mood} />
        <span className="absolute inset-0 rounded-2xl ring-1 ring-white/15" />
      </motion.div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <div className="text-sm font-semibold">{speakerName}</div>
          {hideMoodLabel ? null : (
            <span className="text-[10px] uppercase tracking-wider text-[var(--foreground-subtle)]">
              {mood}
            </span>
          )}
        </div>
        <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--foreground-muted)]">
          {message}
        </p>
      </div>
    </div>
  );
}

function BotFace({ mood }: { mood: BotMood }) {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7 text-white">
      <rect
        x="6"
        y="9"
        width="20"
        height="14"
        rx="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      {mood === "critical" || mood === "alert" ? (
        <>
          <path
            d="M11 15l3 3M14 15l-3 3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M21 15l3 3M24 15l-3 3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <circle cx="12.5" cy="16" r="1.6" fill="currentColor" />
          <circle cx="22.5" cy="16" r="1.6" fill="currentColor" />
        </>
      )}
      {mood === "happy" ? (
        <path
          d="M12 19c1 1.5 3 1.5 4 0M16 19c1 1.5 3 1.5 4 0"
          stroke="currentColor"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M12 20h8"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      )}
      <path d="M16 5v3" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16" cy="4" r="1.4" fill="currentColor" />
    </svg>
  );
}
