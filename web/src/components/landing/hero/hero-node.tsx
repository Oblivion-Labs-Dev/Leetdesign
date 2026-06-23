"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import type { HeroNodeDef, NodeStatus } from "./hero-scenario";
import { nodePos } from "./hero-scenario";

const STATUS_COLOR: Record<NodeStatus, string> = {
  healthy: "#65947C",
  degraded: "#D4893A",
};

/** Single positioning layer — all canvas elements use this */
export function NodeAnchor({
  x,
  y,
  children,
}: {
  x: number;
  y: number;
  children: ReactNode;
}) {
  return (
    <div
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={nodePos(x, y)}
    >
      {children}
    </div>
  );
}

function Port({ side }: { side: "left" | "right" }) {
  return (
    <span
      className={`absolute top-1/2 h-[6px] w-[6px] -translate-y-1/2 rounded-full border border-white/80 bg-[#9B8DC4] ${
        side === "left" ? "-left-[3px]" : "-right-[3px]"
      }`}
    />
  );
}

/** Product-faithful node card — icon tile, label, type subtitle, status + latency */
export function HeroNode({
  node,
  highlight,
  floating,
  pulse,
}: {
  node: HeroNodeDef;
  highlight?: boolean;
  floating?: boolean;
  pulse?: boolean;
}) {
  const Icon = node.icon;

  return (
    <motion.div
      className="relative flex h-[56px] w-[84px] flex-col justify-between rounded-xl border px-2 py-1.5"
      style={{
        background: "linear-gradient(165deg, var(--clay-surface), var(--clay-surface-2))",
        borderColor: highlight
          ? "#9B8DC4"
          : node.status === "degraded"
            ? "#D4893A"
            : "var(--clay-border)",
        boxShadow: floating
          ? "0 10px 28px -6px rgba(42,49,66,0.35)"
          : "var(--clay-shadow-in)",
      }}
      initial={floating ? { scale: 0.85, opacity: 0 } : false}
      animate={
        floating
          ? { scale: 1, opacity: 1 }
          : pulse
            ? { scale: [1, 1.03, 1] }
            : highlight
              ? { scale: [1, 1.03, 1] }
              : {}
      }
      transition={
        floating
          ? { type: "spring", stiffness: 400, damping: 18 }
          : pulse || highlight
            ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
            : {}
      }
    >
      <Port side="left" />
      <Port side="right" />

      {/* Row 1: icon tile + label + type */}
      <div className="flex items-center gap-1.5">
        <div className="grid h-4 w-4 shrink-0 place-items-center rounded bg-[var(--clay-surface-2)]">
          <Icon
            className="h-[10px] w-[10px] text-[var(--clay-primary)]"
            strokeWidth={2.4}
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[8px] font-semibold leading-tight text-[var(--clay-text)]">
            {node.label}
          </p>
          <p className="text-[6px] uppercase tracking-wider text-[var(--clay-text-subtle)]">
            {node.type.replace(/_/g, " ")}
          </p>
        </div>
      </div>

      {/* Row 2: status dot + status text + mono latency */}
      <div className="flex items-center justify-between text-[7px]">
        <span className="flex items-center gap-0.5 text-[var(--clay-text-subtle)]">
          <span
            className="h-[5px] w-[5px] rounded-full"
            style={{ backgroundColor: STATUS_COLOR[node.status] }}
          />
          {node.status}
        </span>
        <span className="font-mono text-[var(--clay-text-muted)]">
          {node.latency}ms
        </span>
      </div>
    </motion.div>
  );
}

/** Drop slot — dashed border with glow, mirrors real missing-slot card */
export function HeroSlot() {
  return (
    <motion.div
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative flex h-[56px] w-[84px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#9B8DC4]"
      style={{
        background: "color-mix(in srgb, var(--clay-lilac) 24%, var(--clay-surface))",
      }}
      animate={{
        boxShadow: [
          "0 0 0 0 rgba(155,141,196,0)",
          "0 0 16px 3px rgba(155,141,196,0.25)",
          "0 0 0 0 rgba(155,141,196,0)",
        ],
      }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <p className="text-[7px] font-bold uppercase tracking-[0.12em] text-[#7B6FA8]">
        Drop here
      </p>
      <p className="mt-0.5 text-[6px] text-[#9B8DC4]/70">cache</p>
      <Port side="left" />
      <Port side="right" />
    </motion.div>
  );
}
