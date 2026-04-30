"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_github2_1 = require("passport-github2");
const db_1 = require("./lib/db");
const identity_1 = require("./lib/identity");
const jwt_1 = require("./lib/jwt");
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT ?? 4000);
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3333";
app.use((0, cors_1.default)({ origin: FRONTEND_URL, credentials: true }));
app.use(express_1.default.json());
app.use(passport_1.default.initialize());
async function generateUniqueAlias(seedInput) {
    const seed = (0, identity_1.normalizeAlias)(seedInput);
    let candidate = seed;
    let i = 0;
    while (true) {
        const exists = await db_1.db.user.findUnique({ where: { alias: candidate } });
        if (!exists)
            return candidate;
        i += 1;
        candidate = `${seed}${String(i).padStart(3, "0")}`.slice(0, 24);
    }
}
async function ensureUserFromOAuth(input) {
    const existing = await db_1.db.user.findUnique({ where: { email: input.email } });
    if (existing)
        return existing;
    const alias = await generateUniqueAlias((0, identity_1.aliasSeedFromName)(input.firstName, input.lastName));
    const workEmail = (0, identity_1.makeWorkEmail)(alias);
    return db_1.db.user.create({
        data: {
            firstName: input.firstName,
            lastName: input.lastName,
            name: `${input.firstName} ${input.lastName}`.trim(),
            email: input.email,
            alias,
            workEmail,
            avatarUrl: input.avatarUrl ?? (0, identity_1.makeAvatarUrl)(alias),
        },
    });
}
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL ?? `http://localhost:${PORT}`}/api/auth/google/callback`,
    }, async (_accessToken, _refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value?.toLowerCase();
            if (!email)
                return done(new Error("Google email not available"));
            const fullName = profile.displayName?.trim() || "Engineer";
            const [firstName = "Engineer", ...rest] = fullName.split(" ");
            const lastName = rest.join(" ") || "User";
            const user = await ensureUserFromOAuth({
                email,
                firstName,
                lastName,
                avatarUrl: profile.photos?.[0]?.value,
            });
            return done(null, user);
        }
        catch (err) {
            return done(err);
        }
    }));
}
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport_1.default.use(new passport_github2_1.Strategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL ?? `http://localhost:${PORT}`}/api/auth/github/callback`,
    }, async (_accessToken, _refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value?.toLowerCase() ||
                `${profile.username}@github.local`;
            const [firstName = "GitHub", ...rest] = (profile.displayName || profile.username || "User").split(" ");
            const lastName = rest.join(" ") || "User";
            const user = await ensureUserFromOAuth({
                email,
                firstName,
                lastName,
                avatarUrl: profile.photos?.[0]?.value,
            });
            return done(null, user);
        }
        catch (err) {
            return done(err);
        }
    }));
}
app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
});
app.get("/api/auth/providers", (_req, res) => {
    res.json({
        google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        github: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    });
});
app.get("/api/auth/alias-available", async (req, res) => {
    const requested = String(req.query.alias ?? "").trim();
    const normalized = (0, identity_1.normalizeAlias)(requested);
    if (normalized.length < 3) {
        return res.json({ available: false, reason: "Alias must be at least 3 characters." });
    }
    if (normalized !== requested.toLowerCase()) {
        return res.json({
            available: false,
            reason: "Alias may only contain lowercase letters and digits.",
            suggestion: normalized,
        });
    }
    const taken = await db_1.db.user.findUnique({ where: { alias: normalized } });
    return res.json({ available: !taken });
});
app.post("/api/auth/register", async (req, res) => {
    const firstName = String(req.body.firstName ?? "").trim();
    const lastName = String(req.body.lastName ?? "").trim();
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const password = String(req.body.password ?? "");
    const requestedAlias = String(req.body.alias ?? "").trim();
    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({
            error: "First name, last name, email, and password are required.",
        });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters." });
    }
    const exists = await db_1.db.user.findUnique({ where: { email } });
    if (exists) {
        return res.status(409).json({ error: "An account with this email already exists." });
    }
    // Resolve alias: prefer user-chosen if provided + valid + free, otherwise auto-generate.
    let alias;
    if (requestedAlias) {
        const normalized = (0, identity_1.normalizeAlias)(requestedAlias);
        if (normalized.length < 3) {
            return res.status(400).json({ error: "Alias must be at least 3 characters." });
        }
        const taken = await db_1.db.user.findUnique({ where: { alias: normalized } });
        if (taken) {
            return res.status(409).json({ error: "That alias is taken. Pick another." });
        }
        alias = normalized;
    }
    else {
        alias = await generateUniqueAlias((0, identity_1.aliasSeedFromName)(firstName, lastName));
    }
    const workEmail = (0, identity_1.makeWorkEmail)(alias);
    const passwordHash = await bcryptjs_1.default.hash(password, 12);
    const avatarUrl = (0, identity_1.makeAvatarUrl)(alias);
    const user = await db_1.db.user.create({
        data: {
            firstName,
            lastName,
            name: `${firstName} ${lastName}`.trim(),
            email,
            alias,
            workEmail,
            passwordHash,
            avatarUrl,
        },
    });
    const token = (0, jwt_1.signAppToken)({ userId: user.id, workEmail, email });
    return res.json({
        ok: true,
        token,
        user: { id: user.id, alias: user.alias, workEmail: user.workEmail, firstVisitCompleted: user.firstVisitCompleted },
    });
});
app.post("/api/auth/login", async (req, res) => {
    // Accept either work email or personal email in `identifier`.
    const identifier = String(req.body.identifier ?? req.body.workEmail ?? req.body.email ?? "")
        .trim()
        .toLowerCase();
    const password = String(req.body.password ?? "");
    if (!identifier || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }
    const user = await db_1.db.user.findFirst({
        where: { OR: [{ workEmail: identifier }, { email: identifier }] },
    });
    if (!user?.passwordHash)
        return res.status(401).json({ error: "Invalid credentials." });
    const ok = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!ok)
        return res.status(401).json({ error: "Invalid credentials." });
    const token = (0, jwt_1.signAppToken)({ userId: user.id, workEmail: user.workEmail, email: user.email });
    return res.json({
        ok: true,
        token,
        user: { id: user.id, alias: user.alias, workEmail: user.workEmail, firstVisitCompleted: user.firstVisitCompleted },
    });
});
app.get("/api/auth/google", (req, res, next) => {
    if (!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)) {
        return res.status(503).json({ error: "Google auth is not configured." });
    }
    passport_1.default.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});
app.get("/api/auth/google/callback", passport_1.default.authenticate("google", { session: false, failureRedirect: `${FRONTEND_URL}/login?oauth=google_fail` }), (req, res) => {
    const user = req.user;
    const token = (0, jwt_1.signAppToken)({
        userId: user.id,
        workEmail: user.workEmail,
        email: user.email,
    });
    const next = user.firstVisitCompleted ? "/dashboard" : "/onboarding";
    res.redirect(`${FRONTEND_URL}/api/auth/oauth-callback?token=${encodeURIComponent(token)}&next=${encodeURIComponent(next)}`);
});
app.get("/api/auth/github", (req, res, next) => {
    if (!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET)) {
        return res.status(503).json({ error: "GitHub auth is not configured." });
    }
    passport_1.default.authenticate("github", { scope: ["user:email"] })(req, res, next);
});
app.get("/api/auth/github/callback", passport_1.default.authenticate("github", { session: false, failureRedirect: `${FRONTEND_URL}/login?oauth=github_fail` }), (req, res) => {
    const user = req.user;
    const token = (0, jwt_1.signAppToken)({
        userId: user.id,
        workEmail: user.workEmail,
        email: user.email,
    });
    const next = user.firstVisitCompleted ? "/dashboard" : "/onboarding";
    res.redirect(`${FRONTEND_URL}/api/auth/oauth-callback?token=${encodeURIComponent(token)}&next=${encodeURIComponent(next)}`);
});
app.get("/api/users/me", async (req, res) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token)
        return res.status(401).json({ error: "Unauthorized" });
    try {
        const payload = (0, jwt_1.verifyAppToken)(token);
        const user = await db_1.db.user.findUnique({ where: { id: payload.userId } });
        if (!user)
            return res.status(401).json({ error: "Unauthorized" });
        // Track today's visit (idempotent for the day).
        await trackVisit(user.id);
        return res.json({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            name: user.name,
            alias: user.alias,
            workEmail: user.workEmail,
            avatarUrl: user.avatarUrl,
            badge: user.badge,
            xp: user.xp,
            stardust: user.stardust,
            status: user.status,
            mood: user.mood,
            githubUrl: user.githubUrl,
            linkedinUrl: user.linkedinUrl,
            leetcodeUrl: user.leetcodeUrl,
            websiteUrl: user.websiteUrl,
            firstVisitCompleted: user.firstVisitCompleted,
            createdAt: user.createdAt,
        });
    }
    catch {
        return res.status(401).json({ error: "Unauthorized" });
    }
});
async function trackVisit(userId) {
    const day = new Date().toISOString().slice(0, 10);
    try {
        await db_1.db.visitDay.upsert({
            where: { userId_day: { userId, day } },
            update: { count: { increment: 1 } },
            create: { userId, day, count: 1 },
        });
    }
    catch {
        // ignore – visit tracking is best-effort
    }
}
app.get("/api/users/me/visits", async (req, res) => {
    const userId = await authedUserId(req);
    if (!userId)
        return res.status(401).json({ error: "Unauthorized" });
    const days = Number(req.query.days ?? 120);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
    const items = await db_1.db.visitDay.findMany({
        where: { userId, day: { gte: since } },
        orderBy: { day: "asc" },
    });
    return res.json({ items });
});
app.patch("/api/users/me", async (req, res) => {
    const userId = await authedUserId(req);
    if (!userId)
        return res.status(401).json({ error: "Unauthorized" });
    const allowed = {};
    const body = req.body ?? {};
    for (const k of [
        "firstName",
        "lastName",
        "avatarUrl",
        "status",
        "mood",
        "githubUrl",
        "linkedinUrl",
        "leetcodeUrl",
        "websiteUrl",
    ]) {
        if (body[k] !== undefined)
            allowed[k] = body[k] === "" ? null : body[k];
    }
    if (allowed.firstName || allowed.lastName) {
        const cur = await db_1.db.user.findUnique({ where: { id: userId } });
        if (cur) {
            const fn = String(allowed.firstName ?? cur.firstName).trim();
            const ln = String(allowed.lastName ?? cur.lastName).trim();
            allowed.name = `${fn} ${ln}`.trim();
        }
    }
    const updated = await db_1.db.user.update({
        where: { id: userId },
        data: allowed,
    });
    return res.json({ ok: true, user: updated });
});
app.post("/api/users/complete-onboarding", async (req, res) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token)
        return res.status(401).json({ error: "Unauthorized" });
    try {
        const payload = (0, jwt_1.verifyAppToken)(token);
        await db_1.db.user.update({
            where: { id: payload.userId },
            data: { firstVisitCompleted: true },
        });
        return res.json({ ok: true });
    }
    catch {
        return res.status(401).json({ error: "Unauthorized" });
    }
});
function bearer(req) {
    const header = req.headers.authorization || "";
    return header.startsWith("Bearer ") ? header.slice(7) : "";
}
async function authedUserId(req) {
    const token = bearer(req);
    if (!token)
        return null;
    try {
        const payload = (0, jwt_1.verifyAppToken)(token);
        return payload.userId;
    }
    catch {
        return null;
    }
}
app.get("/api/users/me/components", async (req, res) => {
    const userId = await authedUserId(req);
    if (!userId)
        return res.status(401).json({ error: "Unauthorized" });
    const seen = await db_1.db.componentSeen.findMany({
        where: { userId },
        orderBy: { seenAt: "desc" },
    });
    return res.json({ items: seen });
});
app.post("/api/users/me/components/seen", async (req, res) => {
    const userId = await authedUserId(req);
    if (!userId)
        return res.status(401).json({ error: "Unauthorized" });
    const componentId = String(req.body.componentId ?? "").trim();
    const projectId = String(req.body.projectId ?? "").trim();
    if (!componentId || !projectId) {
        return res.status(400).json({ error: "componentId and projectId required" });
    }
    const row = await db_1.db.componentSeen.upsert({
        where: { userId_componentId: { userId, componentId } },
        create: { userId, componentId, projectId },
        update: { projectId },
    });
    return res.json({ ok: true, item: row });
});
app.get("/api/users/me/progress", async (req, res) => {
    const userId = await authedUserId(req);
    if (!userId)
        return res.status(401).json({ error: "Unauthorized" });
    const items = await db_1.db.projectProgress.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
    });
    return res.json({ items });
});
app.get("/api/users/me/progress/:projectId", async (req, res) => {
    const userId = await authedUserId(req);
    if (!userId)
        return res.status(401).json({ error: "Unauthorized" });
    const row = await db_1.db.projectProgress.findUnique({
        where: { userId_projectId: { userId, projectId: req.params.projectId } },
    });
    return res.json({ item: row });
});
app.post("/api/users/me/progress/:projectId", async (req, res) => {
    const userId = await authedUserId(req);
    if (!userId)
        return res.status(401).json({ error: "Unauthorized" });
    const stageIndex = Number(req.body.stageIndex ?? 0);
    const status = req.body.status === "completed" ? "completed" : "in_progress";
    const completedAt = status === "completed" ? new Date() : null;
    const row = await db_1.db.projectProgress.upsert({
        where: { userId_projectId: { userId, projectId: req.params.projectId } },
        create: {
            userId,
            projectId: req.params.projectId,
            stageIndex,
            status,
            completedAt,
        },
        update: { stageIndex, status, completedAt },
    });
    return res.json({ ok: true, item: row });
});
app.listen(PORT, () => {
    console.log(`Astra backend running on http://localhost:${PORT}`);
});
