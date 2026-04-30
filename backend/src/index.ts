import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import type { VerifyCallback } from "passport-google-oauth20";
import type { Profile as GitHubProfile } from "passport-github2";
import { db } from "./lib/db";
import {
  aliasSeedFromName,
  makeAvatarUrl,
  makeWorkEmail,
  normalizeAlias,
} from "./lib/identity";
import { signAppToken, verifyAppToken } from "./lib/jwt";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3333";

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(passport.initialize());

async function generateUniqueAlias(seedInput: string): Promise<string> {
  const seed = normalizeAlias(seedInput);
  let candidate = seed;
  let i = 0;
  while (true) {
    const exists = await db.user.findUnique({ where: { alias: candidate } });
    if (!exists) return candidate;
    i += 1;
    candidate = `${seed}${String(i).padStart(3, "0")}`.slice(0, 24);
  }
}

async function ensureUserFromOAuth(input: {
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}) {
  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) return existing;
  const alias = await generateUniqueAlias(
    aliasSeedFromName(input.firstName, input.lastName),
  );
  const workEmail = makeWorkEmail(alias);
  return db.user.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      name: `${input.firstName} ${input.lastName}`.trim(),
      email: input.email,
      alias,
      workEmail,
      avatarUrl: input.avatarUrl ?? makeAvatarUrl(alias),
    },
  });
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL ?? `http://localhost:${PORT}`}/api/auth/google/callback`,
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: any,
        done: VerifyCallback,
      ) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) return done(new Error("Google email not available"));
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
        } catch (err) {
          return done(err as Error);
        }
      },
    ),
  );
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL ?? `http://localhost:${PORT}`}/api/auth/github/callback`,
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: GitHubProfile,
        done: (error: Error | null, user?: Express.User | false) => void,
      ) => {
        try {
          const email =
            profile.emails?.[0]?.value?.toLowerCase() ||
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
        } catch (err) {
          return done(err as Error);
        }
      },
    ),
  );
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
  const normalized = normalizeAlias(requested);
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
  const taken = await db.user.findUnique({ where: { alias: normalized } });
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

  const exists = await db.user.findUnique({ where: { email } });
  if (exists) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }

  // Resolve alias: prefer user-chosen if provided + valid + free, otherwise auto-generate.
  let alias: string;
  if (requestedAlias) {
    const normalized = normalizeAlias(requestedAlias);
    if (normalized.length < 3) {
      return res.status(400).json({ error: "Alias must be at least 3 characters." });
    }
    const taken = await db.user.findUnique({ where: { alias: normalized } });
    if (taken) {
      return res.status(409).json({ error: "That alias is taken. Pick another." });
    }
    alias = normalized;
  } else {
    alias = await generateUniqueAlias(aliasSeedFromName(firstName, lastName));
  }

  const workEmail = makeWorkEmail(alias);
  const passwordHash = await bcrypt.hash(password, 12);
  const avatarUrl = makeAvatarUrl(alias);
  const user = await db.user.create({
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

  const token = signAppToken({ userId: user.id, workEmail, email });
  return res.json({
    ok: true,
    token,
    user: { id: user.id, alias: user.alias, workEmail: user.workEmail, firstVisitCompleted: user.firstVisitCompleted },
  });
});

app.post("/api/auth/login", async (req, res) => {
  // Accept either work email or personal email in `identifier`.
  const identifier = String(
    req.body.identifier ?? req.body.workEmail ?? req.body.email ?? "",
  )
    .trim()
    .toLowerCase();
  const password = String(req.body.password ?? "");
  if (!identifier || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  const user = await db.user.findFirst({
    where: { OR: [{ workEmail: identifier }, { email: identifier }] },
  });
  if (!user?.passwordHash) return res.status(401).json({ error: "Invalid credentials." });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials." });
  const token = signAppToken({ userId: user.id, workEmail: user.workEmail, email: user.email });
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
  passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});

app.get(
  "/api/auth/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${FRONTEND_URL}/login?oauth=google_fail` }),
  (req, res) => {
    const user = req.user as any;
    const token = signAppToken({
      userId: user.id,
      workEmail: user.workEmail,
      email: user.email,
    });
    const next = user.firstVisitCompleted ? "/dashboard" : "/onboarding";
    res.redirect(`${FRONTEND_URL}/api/auth/oauth-callback?token=${encodeURIComponent(token)}&next=${encodeURIComponent(next)}`);
  },
);

app.get("/api/auth/github", (req, res, next) => {
  if (!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET)) {
    return res.status(503).json({ error: "GitHub auth is not configured." });
  }
  passport.authenticate("github", { scope: ["user:email"] })(req, res, next);
});

app.get(
  "/api/auth/github/callback",
  passport.authenticate("github", { session: false, failureRedirect: `${FRONTEND_URL}/login?oauth=github_fail` }),
  (req, res) => {
    const user = req.user as any;
    const token = signAppToken({
      userId: user.id,
      workEmail: user.workEmail,
      email: user.email,
    });
    const next = user.firstVisitCompleted ? "/dashboard" : "/onboarding";
    res.redirect(`${FRONTEND_URL}/api/auth/oauth-callback?token=${encodeURIComponent(token)}&next=${encodeURIComponent(next)}`);
  },
);

app.get("/api/users/me", async (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const payload = verifyAppToken(token);
    const user = await db.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(401).json({ error: "Unauthorized" });
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
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
});

async function trackVisit(userId: string) {
  const day = new Date().toISOString().slice(0, 10);
  try {
    await db.visitDay.upsert({
      where: { userId_day: { userId, day } },
      update: { count: { increment: 1 } },
      create: { userId, day, count: 1 },
    });
  } catch {
    // ignore – visit tracking is best-effort
  }
}

app.get("/api/users/me/visits", async (req, res) => {
  const userId = await authedUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const days = Number(req.query.days ?? 120);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const items = await db.visitDay.findMany({
    where: { userId, day: { gte: since } },
    orderBy: { day: "asc" },
  });
  return res.json({ items });
});

app.patch("/api/users/me", async (req, res) => {
  const userId = await authedUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const allowed: Record<string, unknown> = {};
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
  ] as const) {
    if (body[k] !== undefined) allowed[k] = body[k] === "" ? null : body[k];
  }
  if (allowed.firstName || allowed.lastName) {
    const cur = await db.user.findUnique({ where: { id: userId } });
    if (cur) {
      const fn = String(allowed.firstName ?? cur.firstName).trim();
      const ln = String(allowed.lastName ?? cur.lastName).trim();
      allowed.name = `${fn} ${ln}`.trim();
    }
  }
  const updated = await db.user.update({
    where: { id: userId },
    data: allowed as Parameters<typeof db.user.update>[0]["data"],
  });
  return res.json({ ok: true, user: updated });
});

app.post("/api/users/complete-onboarding", async (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const payload = verifyAppToken(token);
    await db.user.update({
      where: { id: payload.userId },
      data: { firstVisitCompleted: true },
    });
    return res.json({ ok: true });
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
});

function bearer(req: express.Request) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

async function authedUserId(req: express.Request) {
  const token = bearer(req);
  if (!token) return null;
  try {
    const payload = verifyAppToken(token);
    return payload.userId;
  } catch {
    return null;
  }
}

app.get("/api/users/me/components", async (req, res) => {
  const userId = await authedUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const seen = await db.componentSeen.findMany({
    where: { userId },
    orderBy: { seenAt: "desc" },
  });
  return res.json({ items: seen });
});

app.post("/api/users/me/components/seen", async (req, res) => {
  const userId = await authedUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const componentId = String(req.body.componentId ?? "").trim();
  const projectId = String(req.body.projectId ?? "").trim();
  if (!componentId || !projectId) {
    return res.status(400).json({ error: "componentId and projectId required" });
  }
  const row = await db.componentSeen.upsert({
    where: { userId_componentId: { userId, componentId } },
    create: { userId, componentId, projectId },
    update: { projectId },
  });
  return res.json({ ok: true, item: row });
});

app.get("/api/users/me/progress", async (req, res) => {
  const userId = await authedUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const items = await db.projectProgress.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  return res.json({ items });
});

app.get("/api/users/me/progress/:projectId", async (req, res) => {
  const userId = await authedUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const row = await db.projectProgress.findUnique({
    where: { userId_projectId: { userId, projectId: req.params.projectId } },
  });
  return res.json({ item: row });
});

app.post("/api/users/me/progress/:projectId", async (req, res) => {
  const userId = await authedUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const stageIndex = Number(req.body.stageIndex ?? 0);
  const status = req.body.status === "completed" ? "completed" : "in_progress";
  const completedAt = status === "completed" ? new Date() : null;
  const row = await db.projectProgress.upsert({
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
