import { Bell, Sparkles } from "lucide-react";
import { BADGES, nextBadge, progressToNext } from "@/lib/badges";
import { BRAND } from "@/lib/brand";
import { Pill } from "@/components/ui/pill";
import { Progress } from "@/components/ui/progress";
import { getCurrentUserProfile } from "@/lib/auth-guard";
import { UserMenu } from "./user-menu";

export async function AppPageHeader({
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
    <header className="studio-header-shell shrink-0 border-b border-[var(--studio-border)] px-4 pt-4 pb-3 sm:px-5 sm:pt-5 sm:pb-4 lg:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-xl font-semibold tracking-tight text-[var(--studio-text)] sm:text-2xl">
              {title}
            </h1>
            <Pill tone="brand" className="hidden sm:inline-flex">
              <Sparkles className="h-3 w-3" /> {badge.shortTitle}
            </Pill>
          </div>
          {subtitle ? (
            <p className="mt-0.5 truncate text-sm text-[var(--studio-text-muted)]">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
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

          {next ? (
            <div className="hidden w-44 lg:block">
              <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-[var(--studio-text-subtle)]">
                <span>To {next.shortTitle}</span>
                <span>{Math.round(pct * 100)}%</span>
              </div>
              <Progress value={pct} />
            </div>
          ) : (
            <div className="hidden text-[10px] uppercase tracking-wider text-[var(--clay-accent)] lg:block">
              Max rank reached
            </div>
          )}

          <button
            className="grid h-9 w-9 place-items-center rounded-full border border-[var(--studio-border)] bg-[var(--studio-surface)] text-[var(--studio-text-muted)] transition-colors hover:text-[var(--studio-text)]"
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
