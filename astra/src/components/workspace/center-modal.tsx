"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

/**
 * Generic centered overlay used for the in-flight code editor and the CI /
 * branch animation. Locks body scroll, renders a backdrop, and traps Escape
 * for a quick dismiss.
 */
export function CenterModal({
  open,
  onClose,
  children,
  size = "lg",
  dismissable = true,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: "md" | "lg" | "xl";
  /** When false the user cannot click backdrop / press Escape to dismiss. */
  dismissable?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissable) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, dismissable]);

  const widthClass =
    size === "xl"
      ? "w-[min(1100px,calc(100vw-32px))]"
      : size === "lg"
        ? "w-[min(900px,calc(100vw-32px))]"
        : "w-[min(640px,calc(100vw-32px))]";

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="ovl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[80] grid place-items-center"
        >
          <button
            aria-label="Close"
            onClick={dismissable ? onClose : undefined}
            className={`absolute inset-0 cursor-default bg-black/65 backdrop-blur-sm ${
              dismissable ? "" : "pointer-events-none"
            }`}
            tabIndex={-1}
          />
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={`surface relative z-10 max-h-[calc(100vh-32px)] overflow-hidden border border-[var(--tone-brand-border)] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] ${widthClass}`}
          >
            {dismissable ? (
              <button
                onClick={onClose}
                className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
                title="Close (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
