import { Bell, Sparkles } from "lucide-react";
import { BADGES, nextBadge, progressToNext } from "@/lib/badges";
import { BRAND } from "@/lib/brand";
import { Pill } from "@/components/ui/pill";
import { Progress } from "@/components/ui/progress";
import { getCurrentUserProfile } from "@/lib/auth-guard";
import { UserMenu } from "./user-menu";

export async function TopBar({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const profile = await getCurrentUserProfile();
  const badge = BADGES[profile.badge];
  const next = nextBadge(profile.badge);
  const pct = progressToNext(profile.xp, profile.badge);

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/85 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:h-16 sm:gap-4 sm:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-semibold text-[var(--foreground)]">
              {title}
            </h1>
            <Pill tone="brand" className="hidden sm:inline-flex">
              <Sparkles className="h-3 w-3" /> {badge.shortTitle}
            </Pill>
          </div>
          {subtitle ? (
            <p className="truncate text-xs text-[var(--foreground-muted)]">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          {/* Currency */}
          <div
            className="hidden items-center gap-1.5 rounded-full border border-[var(--tone-warning-border)] bg-[var(--tone-warning-bg)] px-3 py-1 text-xs font-medium text-[var(--tone-warning-text)] lg:inline-flex"
            title={`${BRAND.currency} — Leetdesign in-product currency`}
          >
            <span aria-hidden>{BRAND.currencyShort}</span>
            <span className="tabular-nums">{profile.stardust ?? 0}</span>
            <span className="text-[10px] uppercase tracking-wider opacity-80">
              {BRAND.currency}
            </span>
          </div>

          {/* Level meter */}
          {next ? (
            <div className="hidden w-44 lg:block">
              <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-[var(--foreground-subtle)]">
                <span>To {next.shortTitle}</span>
                <span>{Math.round(pct * 100)}%</span>
              </div>
              <Progress value={pct} />
            </div>
          ) : (
            <div className="hidden text-[10px] uppercase tracking-wider text-emerald-300 lg:block">
              Max rank reached
            </div>
          )}

          <button
            className="grid h-9 w-9 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>

          <UserMenu
            user={{
              alias: profile.alias,
              fullName: profile.fullName,
              workEmail: profile.workEmail,
              avatarUrl: profile.avatarUrl,
              badgeShortTitle: badge.shortTitle,
            }}
          />
        </div>
      </div>
    </header>
  );
}
