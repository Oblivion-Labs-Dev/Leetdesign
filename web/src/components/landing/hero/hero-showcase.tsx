"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { Activity, ArrowRightLeft, Database, Network, ShieldCheck, Sparkles, Timer, Workflow, Zap } from "lucide-react";

const STEP_TEXT = ["Compose blocks", "Wire flows", "Run simulation"];
const SLIDES = ["Design canvas", "Runtime simulation"] as const;

export function HeroShowcase() {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(() => {
      setSlide((curr) => (curr + 1) % SLIDES.length);
    }, 4600);
    return () => clearInterval(id);
  }, [reducedMotion]);

  const rotateX = useSpring(
    useTransform(my, [-0.5, 0.5], reducedMotion ? [0, 0] : [5, -5]),
    { stiffness: 120, damping: 24 },
  );
  const rotateY = useSpring(
    useTransform(mx, [-0.5, 0.5], reducedMotion ? [0, 0] : [-7, 7]),
    { stiffness: 120, damping: 24 },
  );

  return (
    <div
      ref={ref}
      className="relative mx-auto w-full max-w-[680px]"
      style={{ perspective: 1300 }}
      onMouseMove={(e) => {
        if (reducedMotion || !ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        mx.set((e.clientX - rect.left) / rect.width - 0.5);
        my.set((e.clientY - rect.top) / rect.height - 0.5);
      }}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      <div className="pointer-events-none absolute -left-8 -top-6 h-40 w-40 rounded-full bg-[var(--clay-lilac)]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 -right-6 h-40 w-40 rounded-full bg-[var(--clay-accent)]/20 blur-3xl" />

      <motion.div
        className="relative"
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      >
        <div
          className="absolute -inset-x-6 -bottom-7 top-10 rounded-[2.2rem] blur-2xl"
          style={{ background: "rgba(42,49,66,0.18)" }}
        />

        <div className="clay-card relative overflow-hidden p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--clay-text-subtle)]">
              Leetdesign studio concept
            </p>
            <div className="flex items-center gap-1 rounded-full border border-[var(--clay-border)] px-2 py-1 text-[10px] text-[var(--clay-text-muted)]">
              <Sparkles className="h-3 w-3 text-[var(--clay-lilac)]" />
              Story carousel
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-[var(--clay-border)] bg-[var(--clay-canvas-a)] px-4 py-5 sm:px-6 sm:py-6">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle, color-mix(in srgb, var(--clay-primary) 22%, transparent) 1px, transparent 1px)",
                backgroundSize: "18px 18px",
              }}
            />

            <div className="relative z-10 h-[430px] sm:h-[296px]">
              <AnimatePresence mode="wait" initial={false}>
                {slide === 0 ? (
                  <motion.div
                    key="slide-design"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35 }}
                    className="absolute inset-0 flex h-full flex-col"
                  >
                    <div className="grid flex-1 gap-4 sm:grid-cols-[1.1fr_1fr]">
                      <div className="flex flex-col rounded-2xl border border-[var(--clay-border)] bg-[var(--clay-surface)]/90 p-3">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--clay-text-subtle)]">
                          Component rack
                        </p>
                        <div className="grid flex-1 grid-cols-2 content-start gap-2">
                          <RackTile icon={Network} label="Gateway" tone="#7BA892" />
                          <RackTile icon={ShieldCheck} label="Auth" tone="#6B8CAE" />
                          <RackTile icon={Database} label="Search" tone="#9B8DC4" />
                          <RackTile icon={Zap} label="Cache" tone="#7BA892" moving={!reducedMotion} />
                        </div>
                      </div>

                      <div className="flex flex-col rounded-2xl border border-[var(--clay-border)] bg-[var(--clay-surface)]/90 p-3">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--clay-text-subtle)]">
                          Runtime preview
                        </p>
                        <FlowPreview reducedMotion={Boolean(reducedMotion)} />
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {STEP_TEXT.map((label, i) => (
                        <motion.div
                          key={label}
                          className="rounded-xl border border-[var(--clay-border)] bg-[var(--clay-surface)]/92 px-3 py-2"
                          animate={
                            reducedMotion
                              ? {}
                              : { boxShadow: ["0 0 0 rgba(0,0,0,0)", "0 0 0 2px rgba(123,168,146,0.18)", "0 0 0 rgba(0,0,0,0)"] }
                          }
                          transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.45 }}
                        >
                          <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
                            Step {i + 1}
                          </p>
                          <p className="mt-0.5 text-xs font-semibold text-[var(--clay-text)]">{label}</p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="slide-runtime"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35 }}
                    className="absolute inset-0 h-full"
                  >
                    <RuntimeSlide reducedMotion={Boolean(reducedMotion)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative z-10 mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {SLIDES.map((label, idx) => (
                  <button
                    key={label}
                    type="button"
                    aria-label={`Show ${label}`}
                    onClick={() => setSlide(idx)}
                    className="group inline-flex items-center gap-1"
                  >
                    <span
                      className={`h-1.5 rounded-full transition-all ${
                        slide === idx
                          ? "w-6 bg-[var(--clay-primary)]"
                          : "w-2.5 bg-[var(--clay-border-strong)]/65 group-hover:bg-[var(--clay-primary)]/45"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-medium text-[var(--clay-text-muted)]">
                {slide + 1}/{SLIDES.length} · {SLIDES[slide]}
              </p>
            </div>
          </div>
        </div>

        <div
          className="mx-auto mt-2 h-2.5 w-[88%] rounded-full"
          style={{
            background: "linear-gradient(180deg, var(--clay-surface-2), var(--clay-border))",
            boxShadow: "0 3px 10px rgba(42,49,66,0.12), inset 0 1px 0 rgba(255,255,255,0.8)",
          }}
        />
      </motion.div>
    </div>
  );
}

function RuntimeSlide({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-[var(--clay-border)] bg-[var(--clay-surface)]/92 p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--clay-text-subtle)]">
          Runtime simulation
        </p>
        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--clay-border)] px-2 py-1 text-[9px] text-[var(--clay-text-muted)]">
          <Activity className="h-2.5 w-2.5 text-[var(--clay-accent)]" />
          Burst mode
        </span>
      </div>

      <div className="grid flex-1 grid-cols-5 content-center gap-2">
        <RuntimeNode label="Client" tone="#8CB4D9" />
        <RuntimeNode label="Gateway" tone="#7BA892" />
        <RuntimeNode label="Auth" tone="#9B8DC4" />
        <RuntimeNode label="Service" tone="#6B8CAE" />
        <RuntimeNode label="DB" tone="#6B8CAE" />
      </div>

      <div className="relative my-2 h-7 shrink-0">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 520 30" preserveAspectRatio="none" aria-hidden>
          <path d="M 20 15 L 500 15" fill="none" stroke="rgba(123,168,146,0.65)" strokeWidth="1.8" strokeDasharray="6 8" />
          {!reducedMotion && (
            <>
              <Packet path="M 20 15 L 500 15" color="#7BA892" begin="0s" />
              <Packet path="M 20 15 L 500 15" color="#9B8DC4" begin="0.7s" />
            </>
          )}
        </svg>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-3">
        <MetricChip icon={Timer} label="p99" value="8ms" />
        <MetricChip icon={ArrowRightLeft} label="throughput" value="428 rps" />
        <MetricChip icon={Workflow} label="path" value="cache + queue" />
      </div>
    </div>
  );
}

function RuntimeNode({ label, tone }: { label: string; tone: string }) {
  return (
    <div
      className="rounded-lg border px-2 py-1.5 text-center"
      style={{
        borderColor: "color-mix(in srgb, var(--clay-border) 72%, transparent)",
        background: `linear-gradient(165deg, color-mix(in srgb, ${tone} 14%, var(--clay-surface)) 0%, var(--clay-surface) 100%)`,
      }}
    >
      <p className="text-[9px] font-semibold text-[var(--clay-text)]">{label}</p>
    </div>
  );
}

function RackTile({
  icon: Icon,
  label,
  tone,
  moving,
}: {
  icon: typeof Network;
  label: string;
  tone: string;
  moving?: boolean;
}) {
  return (
    <motion.div
      className="rounded-xl border px-2 py-2"
      style={{
        borderColor: "color-mix(in srgb, var(--clay-border) 70%, transparent)",
        background: `linear-gradient(165deg, color-mix(in srgb, ${tone} 16%, var(--clay-surface)) 0%, var(--clay-surface) 100%)`,
        boxShadow: "var(--clay-shadow-in)",
      }}
      animate={moving ? { y: [0, -4, 0] } : {}}
      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" style={{ color: tone }} />
        <span className="text-[11px] font-semibold text-[var(--clay-text)]">{label}</span>
      </div>
    </motion.div>
  );
}

function FlowPreview({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="relative min-h-[108px] flex-1 rounded-xl border border-[var(--clay-border)] bg-[var(--clay-bg-soft)]/70 p-2">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 260 108" preserveAspectRatio="none" aria-hidden>
        <path d="M 20 30 C 80 25, 110 35, 150 36 C 185 36, 205 24, 238 27" fill="none" stroke="#7BA892" strokeWidth="1.8" opacity="0.72" />
        <path d="M 20 70 C 70 74, 105 72, 140 58 C 170 47, 198 62, 238 78" fill="none" stroke="#9B8DC4" strokeWidth="1.8" opacity="0.62" strokeDasharray="5 6" />
        {!reducedMotion && (
          <>
            <Packet path="M 20 30 C 80 25, 110 35, 150 36 C 185 36, 205 24, 238 27" color="#7BA892" begin="0s" />
            <Packet path="M 20 70 C 70 74, 105 72, 140 58 C 170 47, 198 62, 238 78" color="#9B8DC4" begin="0.8s" />
          </>
        )}
      </svg>

      <div className="relative z-10 flex h-full items-end justify-between">
        <MetricChip icon={Workflow} label="Topology" value="8 nodes" />
        <MetricChip icon={Timer} label="Latency" value="52 -> 9ms" />
      </div>
    </div>
  );
}

function Packet({ path, color, begin }: { path: string; color: string; begin: string }) {
  return (
    <circle r="3.2" fill={color} opacity="0">
      <animate attributeName="opacity" values="0;0.9;0.9;0" dur="2.2s" begin={begin} repeatCount="indefinite" />
      <animateMotion dur="2.2s" begin={begin} repeatCount="indefinite" path={path} />
    </circle>
  );
}

function MetricChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Workflow;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface)]/95 px-2 py-1.5">
      <div className="flex items-center gap-1">
        <Icon className="h-3 w-3 text-[var(--clay-primary)]" />
        <span className="text-[8px] uppercase tracking-wide text-[var(--clay-text-subtle)]">{label}</span>
      </div>
      <p className="mt-0.5 text-[10px] font-semibold text-[var(--clay-text)]">{value}</p>
    </div>
  );
}
