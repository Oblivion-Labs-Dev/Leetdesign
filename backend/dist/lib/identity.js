"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeAlias = normalizeAlias;
exports.aliasSeedFromName = aliasSeedFromName;
exports.makeWorkEmail = makeWorkEmail;
exports.makeAvatarUrl = makeAvatarUrl;
function normalizeAlias(input) {
    const base = input
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "")
        .slice(0, 20);
    return base || "engineer";
}
function aliasSeedFromName(firstName, lastName) {
    const first = normalizeAlias(firstName);
    const last = normalizeAlias(lastName);
    if (first && last) {
        const firstPrefix = first.slice(0, Math.min(2, first.length));
        return normalizeAlias(`${firstPrefix}${last}`);
    }
    return normalizeAlias(`${first}${last}` || "engineer");
}
function makeWorkEmail(alias) {
    return `${alias}@astra.oblivionlabs.com`;
}
function makeAvatarUrl(seed) {
    return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed.toLowerCase())}`;
}
