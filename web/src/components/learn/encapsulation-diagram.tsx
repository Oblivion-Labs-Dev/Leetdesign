"use client";

import { motion } from "framer-motion";

export function EncapsulationVaultAnimation({
  caption,
  playing = false,
  compact = false,
}: {
  caption?: string;
  playing?: boolean;
  compact?: boolean;
}) {
  return (
    <figure className={`learn-animation ${compact ? "learn-animation--compact" : ""}`}>
      <div className="learn-animation-stage">
        <motion.div
          className="learn-vault"
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="learn-vault-label">BankAccount</div>
          <div className="learn-vault-core">
            <motion.div
              className="learn-vault-field"
              animate={playing ? { opacity: [0.55, 1, 0.55] } : { opacity: 0.85 }}
              transition={
                playing
                  ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.2 }
              }
            >
              <span className="learn-vault-key">private</span>
              <span>balance</span>
            </motion.div>
            <motion.div
              className="learn-vault-door"
              animate={playing ? { scaleX: [0.65, 1, 0.65] } : { scaleX: 1 }}
              transition={
                playing
                  ? { duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }
                  : { duration: 0.3 }
              }
            >
              withdraw()
            </motion.div>
            <motion.div
              className="learn-vault-door learn-vault-door--secondary"
              animate={playing ? { scaleX: [0.65, 1, 0.65] } : { scaleX: 1 }}
              transition={
                playing
                  ? { duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.55 }
                  : { duration: 0.3, delay: 0.05 }
              }
            >
              getBalance()
            </motion.div>
          </div>
          <motion.div
            className="learn-vault-arrow"
            animate={playing ? { opacity: [0.45, 1, 0.45], x: [0, 4, 0] } : { opacity: 0.75, x: 0 }}
            transition={
              playing
                ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.2 }
            }
          >
            external code → public methods only
          </motion.div>
        </motion.div>
      </div>
      {caption ? <figcaption className="learn-animation-caption">{caption}</figcaption> : null}
    </figure>
  );
}
