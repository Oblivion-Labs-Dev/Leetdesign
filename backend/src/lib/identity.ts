export function normalizeAlias(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 20);
  return base || "engineer";
}

export function aliasSeedFromName(firstName: string, lastName: string): string {
  const first = normalizeAlias(firstName);
  const last = normalizeAlias(lastName);
  if (first && last) {
    const firstPrefix = first.slice(0, Math.min(2, first.length));
    return normalizeAlias(`${firstPrefix}${last}`);
  }
  return normalizeAlias(`${first}${last}` || "engineer");
}

export function makeWorkEmail(alias: string): string {
  return `${alias}@leetdesign.com`;
}

export function makeAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(
    seed.toLowerCase(),
  )}`;
}
