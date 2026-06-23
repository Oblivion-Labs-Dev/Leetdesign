"use client";

import { motion } from "framer-motion";
import {
  VB,
  CLIENT,
  GATEWAY,
  AUTH,
  SERVICE,
  DB,
  CACHE,
  QUEUE,
  WORKER,
  SLOT_POS,
  edgeH,
  edgeSmooth,
  SLOW_FLOW_PATH,
  FAST_FLOW_PATH,
  ASYNC_FLOW_PATH,
  type Phase,
} from "./hero-scenario";

export function HeroEdges({
  phase,
  cachePlaced,
}: {
  phase: Phase;
  cachePlaced: boolean;
}) {
  const simActive = phase === "simulate" || phase === "insight";
  const showSlowPacket =
    (phase === "problem" || phase === "drag") && !cachePlaced;

  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox={`0 0 ${VB.w} ${VB.h}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      {/* Client → Gateway */}
      <EdgeLine
        d={edgeH(CLIENT.x, CLIENT.y, GATEWAY.x, GATEWAY.y)}
        color="#7BA892"
        flowing={simActive}
      />
      {/* Gateway → Service */}
      <EdgeLine
        d={edgeH(GATEWAY.x, GATEWAY.y, AUTH.x, AUTH.y)}
        color="#7BA892"
        flowing={simActive}
      />
      {/* Auth -> Service */}
      <EdgeLine
        d={edgeH(AUTH.x, AUTH.y, SERVICE.x, SERVICE.y)}
        color="#7BA892"
        flowing={simActive}
      />

      {/* Pre-cache: amber slow path + dashed branch to slot */}
      {!cachePlaced && (
        <>
          <EdgeLine
            d={edgeH(SERVICE.x, SERVICE.y, DB.x, DB.y)}
            color="#D4893A"
          />
          <EdgeLine
            d={edgeSmooth(
              SERVICE.x,
              SERVICE.y,
              SLOT_POS.x,
              SLOT_POS.y,
            )}
            color="#9B8DC4"
            dashed
          />
        </>
      )}

      {/* Always-on async write path */}
      <EdgeLine
        d={edgeSmooth(SERVICE.x, SERVICE.y, QUEUE.x, QUEUE.y)}
        color="#8CA5C0"
        dashed
      />
      <EdgeLine
        d={edgeH(QUEUE.x, QUEUE.y, WORKER.x, WORKER.y)}
        color="#8CA5C0"
        dashed
      />
      <EdgeLine
        d={edgeSmooth(WORKER.x, WORKER.y, DB.x, DB.y)}
        color="#8CA5C0"
        dashed
      />

      {/* Post-cache: branch edges with pathLength draw-on */}
      {cachePlaced && (
        <>
          <EdgeLine
            d={edgeSmooth(SERVICE.x, SERVICE.y, CACHE.x, CACHE.y)}
            color="#7BA892"
            drawOn
            flowing={simActive}
          />
          <EdgeLine
            d={edgeSmooth(CACHE.x, CACHE.y, DB.x, DB.y)}
            color="#7BA892"
            drawOn
            flowing={simActive}
          />
        </>
      )}

      {/* Slow-path packet during problem beat */}
      {showSlowPacket && (
        <circle r="3.5" fill="#D4893A" opacity="0">
          <animate
            attributeName="opacity"
            values="0;0.8;0.8;0"
            dur="2.6s"
            repeatCount="indefinite"
          />
          <animateMotion
            dur="2.6s"
            repeatCount="indefinite"
            path={SLOW_FLOW_PATH}
          />
        </circle>
      )}

      {/* Fast-path staggered packets during simulate */}
      {simActive &&
        cachePlaced &&
        [0, 0.5, 1.0, 1.5].map((delay) => (
          <circle key={delay} r="3" fill="#6B8CAE" opacity="0">
            <animate
              attributeName="opacity"
              values="0;0.85;0.85;0"
              dur="2s"
              repeatCount="indefinite"
              begin={`${delay}s`}
            />
            <animateMotion
              dur="2s"
              repeatCount="indefinite"
              begin={`${delay}s`}
              path={FAST_FLOW_PATH}
            />
          </circle>
        ))}

      {/* Async packets during simulation */}
      {simActive &&
        [0.2, 1.2].map((delay) => (
          <circle key={`async-${delay}`} r="2.6" fill="#8CA5C0" opacity="0">
            <animate
              attributeName="opacity"
              values="0;0.7;0.7;0"
              dur="2.6s"
              repeatCount="indefinite"
              begin={`${delay}s`}
            />
            <animateMotion
              dur="2.6s"
              repeatCount="indefinite"
              begin={`${delay}s`}
              path={ASYNC_FLOW_PATH}
            />
          </circle>
        ))}
    </svg>
  );
}

/** Single edge with optional draw-on, dashed, or flowing variants */
function EdgeLine({
  d,
  color,
  dashed,
  drawOn,
  flowing,
}: {
  d: string;
  color: string;
  dashed?: boolean;
  drawOn?: boolean;
  flowing?: boolean;
}) {
  return (
    <g>
      {/* Soft glow layer */}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        opacity={0.06}
      />

      {drawOn ? (
        <motion.path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={flowing ? "6 10" : "none"}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: 1,
            opacity: flowing ? 0.85 : 0.6,
            strokeDashoffset: flowing ? [0, -32] : 0,
          }}
          transition={{
            pathLength: { duration: 0.6, ease: "easeOut" },
            opacity: { duration: 0.4 },
            strokeDashoffset: {
              duration: 1.2,
              repeat: Infinity,
              ease: "linear",
            },
          }}
        />
      ) : (
        <motion.path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={dashed ? "4 6" : flowing ? "6 10" : "none"}
          animate={{
            opacity: dashed ? 0.3 : flowing ? 0.85 : 0.5,
            strokeDashoffset: flowing ? [0, -32] : 0,
          }}
          transition={{
            opacity: { duration: 0.3 },
            strokeDashoffset: {
              duration: 1.2,
              repeat: Infinity,
              ease: "linear",
            },
          }}
        />
      )}
    </g>
  );
}
