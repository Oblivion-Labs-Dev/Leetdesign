"use client";

import { motion } from "framer-motion";

export function EncapsulationVaultAnimation({ caption }: { caption?: string }) {
  return (
    <figure className="learn-animation">
      <div className="learn-animation-stage">
        <motion.div
          className="learn-vault"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="learn-vault-label">BankAccount</div>
          <div className="learn-vault-core">
            <motion.div
              className="learn-vault-field"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="learn-vault-key">private</span>
              <span>balance</span>
            </motion.div>
            <motion.div
              className="learn-vault-door"
              initial={{ scaleX: 0.3 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              withdraw()
            </motion.div>
            <motion.div
              className="learn-vault-door learn-vault-door--secondary"
              initial={{ scaleX: 0.3 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              getBalance()
            </motion.div>
          </div>
          <motion.div
            className="learn-vault-arrow"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9, duration: 0.4 }}
          >
            caller → public API only
          </motion.div>
        </motion.div>
      </div>
      {caption ? <figcaption className="learn-animation-caption">{caption}</figcaption> : null}
    </figure>
  );
}
