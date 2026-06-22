"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { BADGES } from "@/lib/badges";
import { BRAND } from "@/lib/brand";
import type { UserProfile } from "@/types";

export function IdentityCard({ profile }: { profile: UserProfile }) {
  const badge = BADGES[profile.badge];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      data-tour="identity-card"
      className="ring-brand relative overflow-hidden rounded-t-3xl rounded-b-2xl border border-[var(--tone-brand-border)] bg-[var(--surface)] p-5 pt-7 shadow-[0_18px_50px_-15px_rgba(0,0,0,0.6)]"
      style={{
        backgroundImage:
          "linear-gradient(135deg, var(--tone-brand-bg), transparent 55%, var(--tone-accent-bg))",
      }}
    >
      <div className="pointer-events-none absolute left-1/2 top-0 h-10 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--tone-accent-border)] bg-[var(--tone-brand-bg)] shadow-[0_8px_18px_-10px_rgba(99,102,241,0.45)]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--border-strong)] bg-[var(--surface)]" />
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-30 blur-3xl"
        style={{ background: badge.color }}
      />
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--foreground-subtle)]">
            Employee Badge
          </div>
          <div className="mt-1 text-lg font-semibold tracking-tight">
            {profile.fullName}
          </div>
          <div className="text-xs text-[var(--foreground-muted)]">
            {profile.workEmail}
          </div>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--surface-2)] ring-1 ring-[var(--border)]">
          <ShieldCheck className="h-6 w-6" style={{ color: badge.color }} />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        {profile.avatarUrl ? (
          <Image
            src={profile.avatarUrl}
            alt={`${profile.alias} avatar`}
            width={48}
            height={48}
            unoptimized
            className="rounded-xl border border-white/10 bg-[var(--surface)]"
          />
        ) : (
          <div
            className="grid h-12 w-12 place-items-center rounded-xl border border-[var(--border)] text-sm font-bold uppercase text-white"
            style={{
              background: `linear-gradient(135deg, ${badge.color}, ${badge.color}99)`,
              textShadow: "0 1px 2px rgba(0,0,0,0.35)",
            }}
          >
            {profile.alias.slice(0, 2)}
          </div>
        )}
        <div className="leading-tight">
          <div className="text-xs uppercase tracking-wider text-[var(--foreground-subtle)]">
            Role
          </div>
          <div className="text-sm font-semibold">{badge.title}</div>
          <div className="text-[11px] text-[var(--foreground-muted)]">
            Joined {profile.joinedAt}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 text-center">
        <Stat label="XP" value={profile.xp} />
        <Stat label={BRAND.currency} value={profile.stardust} />
      </div>

      <div className="pointer-events-none absolute inset-x-5 bottom-3 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--background-soft)]/60 px-2 py-2">
      <div className="text-sm font-semibold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--foreground-subtle)]">
        {label}
      </div>
    </div>
  );
}
