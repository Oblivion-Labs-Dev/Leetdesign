import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { BADGES, nextBadge, progressToNext } from "@/lib/badges";
import { BRAND } from "@/lib/brand";
import type { UserProfile } from "@/types";

export function LevelCard({ profile }: { profile: UserProfile }) {
  const badge = BADGES[profile.badge];
  const next = nextBadge(profile.badge);
  const pct = progressToNext(profile.xp, profile.badge);

  return (
    <Card data-tour="level-card">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--foreground-subtle)]">
            Current rank
          </div>
          <div className="mt-1 truncate text-base font-semibold">
            {badge.title}
          </div>
        </div>
        <div
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${badge.color}55, transparent)`,
            border: `1px solid ${badge.color}55`,
          }}
        >
          <Sparkles className="h-4 w-4" style={{ color: badge.color }} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-center">
        <Cell label="XP" value={profile.xp.toLocaleString()} />
        <Cell
          label={BRAND.currency}
          value={`${BRAND.currencyShort} ${profile.stardust.toLocaleString()}`}
        />
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-[var(--foreground-subtle)]">
          <span>{next ? `Next: ${next.shortTitle}` : "Max rank reached"}</span>
          <span>{Math.round(pct * 100)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
            style={{ width: `${Math.round(pct * 100)}%` }}
          />
        </div>
        {next ? (
          <div className="mt-1 text-[11px] text-[var(--foreground-subtle)]">
            {Math.max(next.unlockXp - profile.xp, 0)} XP to {next.shortTitle}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/60 px-3 py-2">
      <div className="text-sm font-semibold tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--foreground-subtle)]">
        {label}
      </div>
    </div>
  );
}
