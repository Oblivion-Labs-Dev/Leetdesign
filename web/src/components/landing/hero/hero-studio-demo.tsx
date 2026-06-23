"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import {
  type Phase,
  type HeroNodeDef,
  VB,
  CLIENT,
  GATEWAY,
  AUTH,
  SERVICE,
  QUEUE,
  WORKER,
  CACHE,
  SLOT_POS,
  BASE_NODES,
  INVENTORY_ITEMS,
  nodePos,
  SIM_LOGS,
  LOOP_MS,
  DB,
} from "./hero-scenario";
import { HeroNode, HeroSlot, NodeAnchor } from "./hero-node";
import { HeroInventory } from "./hero-inventory";
import { HeroEdges } from "./hero-edges";
import { HeroSimBar } from "./hero-sim-bar";

export function HeroStudioDemo() {
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [phase, setPhase] = useState<Phase>("problem");
  const [cachePlaced, setCachePlaced] = useState(false);
  const [rps, setRps] = useState(0);
  const [p99, setP99] = useState(52);
  const [log, setLog] = useState("GET /feed \u2192 auth + db read (52ms)");

  // Pause loop when hero scrolls off-screen
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Static optimized state for reduced-motion users
  useEffect(() => {
    if (!reducedMotion) return;
    setCachePlaced(true);
    setPhase("simulate");
    setRps(340);
    setP99(8);
    setLog("GET /feed \u2192 auth + cache hit (3ms)");
  }, [reducedMotion]);

  // Main animation loop — beat-scheduled phases
  useEffect(() => {
    if (reducedMotion || !isVisible) return;

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const sched = (fn: () => void, ms: number) => {
      timers.push(setTimeout(() => !cancelled && fn(), ms));
    };

    const runLoop = () => {
      if (cancelled) return;

      // Beat 1 — Problem (0s): slow path active, DB degraded
      setPhase("problem");
      setCachePlaced(false);
      setRps(0);
      setP99(52);
      setLog("GET /feed \u2192 auth + db read (52ms)");

      // Beat 2 — Drag (2s): ghost lifts from inventory
      sched(() => setPhase("drag"), 2000);

      // Beat 3 — Place (3.2s): cache snaps into slot
      sched(() => {
        setPhase("place");
        setCachePlaced(true);
        setLog("Cache placed");
      }, 3200);

      // Beat 4 — Connect (3.8s): edges draw on, slow path fades
      sched(() => {
        setPhase("connect");
        setLog("Wiring read path\u2026");
      }, 3800);

      // Beat 5 — Simulate (4.4s): packets flow, metrics climb
      sched(() => {
        setPhase("simulate");
        setLog(SIM_LOGS[0]);
      }, 4400);

      // Beat 6 — Insight (7.5s): before/after toast
      sched(() => {
        setPhase("insight");
        setLog("Read path optimized");
      }, 7500);

      // Beat 7 — Reset (9.5s): crossfade canvas opacity
      sched(() => setPhase("reset"), 9500);

      // Flip state during low opacity (10s)
      sched(() => {
        setCachePlaced(false);
        setRps(0);
        setP99(52);
        setLog("");
      }, 10000);

      timers.push(setTimeout(() => !cancelled && runLoop(), LOOP_MS));
    };

    runLoop();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [isVisible, reducedMotion]);

  // Metrics easing — interval runs only during simulate phase
  useEffect(() => {
    if (phase !== "simulate") return;
    let v = 80;
    let lat = 48;
    const id = setInterval(() => {
      v = Math.min(380, v + 22);
      lat = Math.max(6, lat - 3);
      setRps(Math.round(v));
      setP99(Math.round(lat));
    }, 220);
    return () => clearInterval(id);
  }, [phase]);

  // Log cycling during simulate
  useEffect(() => {
    if (phase !== "simulate") return;
    let idx = 0;
    const id = setInterval(() => {
      idx = (idx + 1) % SIM_LOGS.length;
      setLog(SIM_LOGS[idx]);
    }, 800);
    return () => clearInterval(id);
  }, [phase]);

  const simActive = phase === "simulate" || phase === "insight";
  const showSlot = !cachePlaced && phase !== "drag";
  const showDragGhost = phase === "drag";

  const canvasNodes: HeroNodeDef[] = cachePlaced
    ? [CLIENT, GATEWAY, AUTH, SERVICE, CACHE, QUEUE, WORKER, DB]
    : BASE_NODES;

  const renderNode = (node: HeroNodeDef): HeroNodeDef => {
    if (node.id === "db" && simActive)
      return { ...node, status: "healthy", latency: p99 || 8 };
    return node;
  };

  return (
    <div
      ref={containerRef}
      className="clay-bench-surface relative w-full overflow-hidden shadow-[var(--clay-shadow-out)]"
    >
      {/* Window chrome — traffic lights + session title */}
      <div className="flex items-center justify-between border-b border-[var(--clay-border)] bg-[var(--clay-surface)]/90 px-3 py-1.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#E8A0A0]" />
            <span className="h-2 w-2 rounded-full bg-[#E8D4A0]" />
            <span className="h-2 w-2 rounded-full bg-[#A0D4B0]" />
          </div>
          <span className="text-[10px] font-semibold text-[var(--clay-text-muted)]">
            Leetdesign &middot; Design session
          </span>
        </div>
        {simActive && (
          <span className="flex items-center gap-1 text-[9px] font-semibold text-[#65947C]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#65947C]" />
            Live
          </span>
        )}
      </div>

      <div className="grid grid-cols-[114px_1fr]">
        <HeroInventory items={INVENTORY_ITEMS} isDragging={showDragGhost} />

        <div className="flex flex-col bg-[var(--clay-canvas-a)]">
          {/* Canvas area with dot grid */}
          <div
            className="relative px-2 py-3"
            style={{
              backgroundImage:
                "radial-gradient(circle, color-mix(in srgb, var(--clay-primary) 20%, transparent) 1px, transparent 1px)",
              backgroundSize: "14px 14px",
            }}
          >
            {/* Canvas wrapper — fades during reset for crossfade */}
            <motion.div
              className="relative mx-auto w-full"
              style={{ aspectRatio: `${VB.w}/${VB.h}` }}
              animate={{ opacity: phase === "reset" ? 0.15 : 1 }}
              transition={{ duration: 0.4 }}
            >
              {/* SVG edge layer + packets */}
              <HeroEdges phase={phase} cachePlaced={cachePlaced} />

              {/* Pipeline nodes */}
              {canvasNodes.map((node) => (
                <NodeAnchor key={node.id} x={node.x} y={node.y}>
                  <HeroNode
                    node={renderNode(node)}
                    highlight={simActive && node.id === "cache"}
                    pulse={!cachePlaced && node.id === "db"}
                  />
                </NodeAnchor>
              ))}

              {/* Drop slot */}
              <AnimatePresence>
                {showSlot && (
                  <NodeAnchor key="slot" x={SLOT_POS.x} y={SLOT_POS.y}>
                    <HeroSlot />
                  </NodeAnchor>
                )}
              </AnimatePresence>

              {/* Drag ghost — quadratic arc from inventory to slot */}
              <AnimatePresence>
                {showDragGhost && (
                  <motion.div
                    className="absolute z-30 -translate-x-1/2 -translate-y-1/2"
                    initial={nodePos(30, 55)}
                    animate={nodePos(SLOT_POS.x, SLOT_POS.y)}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{
                      duration: 1,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    {/* Y offset for arc trajectory */}
                    <motion.div
                      initial={{ y: 0 }}
                      animate={{ y: [0, -30, 0] }}
                      transition={{
                        duration: 1,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <HeroNode node={CACHE} floating />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Insight toast — before/after comparison bars */}
              <AnimatePresence>
                {phase === "insight" && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.3 }}
                    className="absolute right-2 top-2 z-40 w-[164px] rounded-lg border border-[#C4B8DC] bg-[var(--clay-surface)]/95 p-2 shadow-lg"
                  >
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <Lightbulb className="h-3 w-3 shrink-0 text-[#9B8DC4]" />
                      <p className="text-[8px] font-bold text-[var(--clay-text)]">
                        Insight
                      </p>
                    </div>
                    <p className="mb-2 text-[7px] leading-snug text-[var(--clay-text-muted)]">
                      Cache cut read latency by 85%
                    </p>
                    {/* Before / After bars */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-7 text-[6px] font-semibold text-[var(--clay-text-subtle)]">
                          Before
                        </span>
                        <div className="relative h-[5px] flex-1 rounded-full bg-[var(--clay-surface-2)]">
                          <div
                            className="h-full rounded-full bg-[#D4893A]"
                            style={{ width: "100%" }}
                          />
                        </div>
                        <span className="w-6 text-right font-mono text-[6px] text-[#D4893A]">
                          52ms
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-7 text-[6px] font-semibold text-[var(--clay-text-subtle)]">
                          After
                        </span>
                        <div className="relative h-[5px] flex-1 rounded-full bg-[var(--clay-surface-2)]">
                          <motion.div
                            className="h-full rounded-full bg-[#65947C]"
                            initial={{ width: "100%" }}
                            animate={{ width: "15%" }}
                            transition={{
                              duration: 0.6,
                              ease: "easeOut",
                            }}
                          />
                        </div>
                        <span className="w-6 text-right font-mono text-[6px] text-[#65947C]">
                          8ms
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          <HeroSimBar phase={phase} log={log} rps={rps} p99={p99} />
        </div>
      </div>
    </div>
  );
}
