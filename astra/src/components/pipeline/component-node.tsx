"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion, useAnimation } from "framer-motion";
import { ExternalLink, Info } from "lucide-react";
import { COMPONENT_ICONS } from "./icon-map";
import { COMPONENT_LIBRARY } from "@/lib/content/components";
import type { ComponentType, SystemHealth } from "@/types";
import { cn } from "@/lib/utils";

export interface ComponentNodeData extends Record<string, unknown> {
  label: string;
  componentType: ComponentType;
  status: SystemHealth;
  metrics?: { rps?: number; latencyMs?: number; errorRate?: number };
  isMissingSlot?: boolean;
  acceptedTypes?: ComponentType[];
  onDropAccept?: (slotId: string, type: ComponentType) => void;
  slotId?: string;
  /** When this changes, the node briefly shakes (signals a wrong drop). */
  shake?: number;
}

const STATUS_RING: Record<SystemHealth, string> = {
  healthy: "ring-emerald-500/40",
  degraded: "ring-amber-500/50",
  failing: "ring-rose-500/60",
  down: "ring-rose-500/80",
};

const STATUS_DOT: Record<SystemHealth, string> = {
  healthy: "bg-emerald-400",
  degraded: "bg-amber-400",
  failing: "bg-rose-400",
  down: "bg-rose-500",
};

export function ComponentNode({ data }: NodeProps) {
  const d = data as ComponentNodeData;
  const Icon = COMPONENT_ICONS[d.componentType];
  const [hover, setHover] = useState(false);
  const controls = useAnimation();
  const lastShakeRef = useRef<number | undefined>(undefined);

  // Shake on wrong drop — only when the parent bumps `shake`.
  useEffect(() => {
    if (d.shake === undefined) return;
    if (lastShakeRef.current === d.shake) return;
    lastShakeRef.current = d.shake;
    void controls.start({
      x: [-6, 6, -5, 5, -3, 3, 0],
      transition: { duration: 0.45, ease: "easeOut" },
    });
  }, [d.shake, controls]);

  if (d.isMissingSlot) {
    return (
      <motion.div
        animate={controls}
        initial={false}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDrop={(e) => {
          e.preventDefault();
          const type = e.dataTransfer.getData(
            "application/astra-component",
          ) as ComponentType;
          if (type && d.onDropAccept && d.slotId) {
            d.onDropAccept(d.slotId, type);
          }
        }}
      >
        <motion.div
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(167,139,250,0.0)",
              "0 0 28px 8px rgba(167,139,250,0.55)",
              "0 0 0 0 rgba(167,139,250,0.0)",
            ],
          }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className={cn(
            "relative grid h-[100px] w-[190px] place-items-center rounded-2xl border-2 border-dashed border-[var(--brand)] bg-[var(--tone-brand-bg)] px-3 text-center",
          )}
        >
          <Handle type="target" position={Position.Left} />
          <Handle type="source" position={Position.Right} />
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--tone-brand-text)]">
            Drop component here
          </div>
          <div className="mt-1 text-[11px] text-[var(--foreground-muted)]">
            {d.acceptedTypes?.length
              ? `Accepts: ${d.acceptedTypes.map((t) => t.replace("_", " ")).join(", ")}`
              : "Find the right fix in your inventory"}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  const meta = COMPONENT_LIBRARY[d.componentType];

  return (
    <motion.div
      animate={controls}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25 }}
        className={cn(
          "surface relative flex h-[92px] w-[180px] flex-col justify-between p-3 ring-1",
          STATUS_RING[d.status],
          hover ? "ring-[var(--brand)]" : "",
        )}
      >
        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />

        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-[var(--surface-2)] text-[var(--tone-brand-text)]">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold leading-tight">
              {d.label}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--foreground-subtle)]">
              {d.componentType.replace("_", " ")}
            </div>
          </div>
        </div>

        <div className="mt-1 flex items-center justify-between text-[10px] text-[var(--foreground-muted)]">
          <span className="flex items-center gap-1">
            <span
              className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[d.status])}
            />
            {d.status}
          </span>
          {d.metrics?.latencyMs ? (
            <span className="font-mono">{d.metrics.latencyMs}ms</span>
          ) : null}
          <Info className="h-3 w-3 text-[var(--foreground-subtle)] opacity-60" />
        </div>
      </motion.div>

      {/* Hover popover with the full component teaching card. */}
      {hover && meta ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute left-0 top-[100px] z-50 w-[300px] rounded-xl border border-[var(--tone-brand-border)] bg-[var(--surface)] p-3 shadow-2xl"
          style={{ pointerEvents: "auto" }}
        >
          <div className="mb-1 flex items-center gap-2">
            <Icon className="h-4 w-4 text-[var(--tone-brand-text)]" />
            <div className="text-sm font-semibold">{meta.label}</div>
          </div>
          <p className="text-xs text-[var(--foreground-muted)]">
            {meta.shortDescription}
          </p>
          <div className="mt-2 text-[10px] uppercase tracking-wider text-[var(--foreground-subtle)]">
            When to use
          </div>
          <p className="text-[11px] text-[var(--foreground-muted)]">
            {meta.whenToUse}
          </p>
          {meta.tradeoffs?.length ? (
            <>
              <div className="mt-2 text-[10px] uppercase tracking-wider text-[var(--foreground-subtle)]">
                Trade-offs
              </div>
              <ul className="space-y-0.5 text-[11px] text-[var(--foreground-muted)]">
                {meta.tradeoffs.map((t) => (
                  <li key={t}>• {t}</li>
                ))}
              </ul>
            </>
          ) : null}
          <div className="mt-2 flex items-center justify-end">
            <Link
              href={`/library/${d.componentType}`}
              target="_blank"
              className="inline-flex items-center gap-1 rounded-md border border-[var(--tone-brand-border)] bg-[var(--tone-brand-bg)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--tone-brand-text)] hover:bg-[var(--tone-brand-bg)]/70"
            >
              Library page <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </motion.div>
      ) : null}
    </motion.div>
  );
}
