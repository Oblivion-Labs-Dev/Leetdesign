import type { BadgeLevel, BadgeMeta } from "@/types";

export const BADGES: Record<BadgeLevel, BadgeMeta> = {
  intern: {
    id: "intern",
    title: "Leetdesign Intern",
    shortTitle: "Intern",
    description:
      "First-year hire. Access to onboarding, brush-ups, and starter incidents.",
    color: "#22d3ee",
    unlockXp: 0,
  },
  sde1: {
    id: "sde1",
    title: "Leetdesign Software Engineer I",
    shortTitle: "SE I",
    description:
      "Owns flagship projects end-to-end and short practice exercises.",
    color: "#a78bfa",
    unlockXp: 500,
  },
  sde2: {
    id: "sde2",
    title: "Leetdesign Software Engineer II",
    shortTitle: "SE II",
    description:
      "Trusted with cross-cutting incidents and harder practice prompts.",
    color: "#f472b6",
    unlockXp: 1500,
  },
  senior: {
    id: "senior",
    title: "Leetdesign Senior Software Engineer",
    shortTitle: "Senior",
    description:
      "Leads design reviews and ships large multi-service projects.",
    color: "#facc15",
    unlockXp: 4000,
  },
  principal: {
    id: "principal",
    title: "Leetdesign Principal Software Engineer",
    shortTitle: "Principal",
    description:
      "Sets the bar for the org. Architectural authority on hard scale problems.",
    color: "#34d399",
    unlockXp: 9000,
  },
};

const ORDER: BadgeLevel[] = ["intern", "sde1", "sde2", "senior", "principal"];

export function nextBadge(current: BadgeLevel): BadgeMeta | null {
  const idx = ORDER.indexOf(current);
  if (idx === -1 || idx === ORDER.length - 1) return null;
  return BADGES[ORDER[idx + 1]];
}

export function progressToNext(xp: number, current: BadgeLevel): number {
  const next = nextBadge(current);
  if (!next) return 1;
  const cur = BADGES[current].unlockXp;
  const span = next.unlockXp - cur;
  if (span <= 0) return 1;
  return Math.min(1, Math.max(0, (xp - cur) / span));
}

export function badgeRank(b: BadgeLevel): number {
  return ORDER.indexOf(b);
}
