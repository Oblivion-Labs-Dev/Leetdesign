import { BRAND } from "@/lib/brand";

export function normalizeAlias(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 20);
  return base || "engineer";
}

export function aliasSeedFromName(
  firstName: string,
  lastName: string,
  fallbackEmail?: string,
): string {
  const first = normalizeAlias(firstName);
  const last = normalizeAlias(lastName);
  if (first && last) {
    // Human-friendly alias style: first-name prefix + surname.
    // Example: akshay borse -> akborse
    const firstPrefix = first.slice(0, Math.min(2, first.length));
    return normalizeAlias(`${firstPrefix}${last}`);
  }
  const emailBase = (fallbackEmail ?? "").split("@")[0];
  return normalizeAlias(emailBase || "engineer");
}

export function makeWorkEmail(alias: string): string {
  return `${alias}@${BRAND.emailDomain}`.toLowerCase();
}

export function makeAvatarUrl(seed: string): string {
  const s = encodeURIComponent(seed.toLowerCase());
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${s}`;
}
