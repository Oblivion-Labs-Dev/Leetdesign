import { promises as fs } from "fs";
import os from "os";
import path from "path";
import type { UserProfile } from "@/types";
import { BRAND } from "@/lib/brand";
import { makeAvatarUrl } from "@/lib/identity-shared";

type ComponentSeenRow = {
  componentId: string;
  projectId: string;
  seenAt: string;
};

type ProjectProgressRow = {
  projectId: string;
  stageIndex: number;
  status: "in_progress" | "completed";
  updatedAt: string;
};

type VisitDayRow = {
  day: string;
  count: number;
};

type ConceptCompletedRow = {
  trackSlug: string;
  conceptSlug: string;
  completedAt: string;
};

type UserState = {
  profile: UserProfile;
  firstVisitCompleted: boolean;
  componentsSeen: ComponentSeenRow[];
  projectProgress: ProjectProgressRow[];
  visitDays: VisitDayRow[];
  conceptsCompleted: ConceptCompletedRow[];
};

/** Outside the Next.js project tree so dev file-watching does not reload on every write. */
const DATA_DIR =
  process.env.LEETDESIGN_DATA_DIR ?? path.join(os.homedir(), ".leetdesign");
const STATE_FILE = path.join(DATA_DIR, "user-state.json");

let memoryState: UserState | null = null;

function defaultState(): UserState {
  const alias = "builder";
  return {
    profile: {
      id: "local-user",
      alias,
      fullName: "Local Builder",
      workEmail: `${alias}@${BRAND.emailDomain}`,
      avatarUrl: makeAvatarUrl(alias),
      badge: "intern",
      xp: 0,
      stardust: 0,
      status: null,
      mood: null,
      githubUrl: null,
      linkedinUrl: null,
      leetcodeUrl: null,
      websiteUrl: null,
      joinedAt: new Date().toISOString().slice(0, 10),
    },
    firstVisitCompleted: false,
    componentsSeen: [],
    projectProgress: [],
    visitDays: [],
    conceptsCompleted: [],
  };
}

async function readState(): Promise<UserState> {
  if (memoryState) return memoryState;
  try {
    const raw = await fs.readFile(STATE_FILE, "utf8");
    memoryState = { ...defaultState(), ...JSON.parse(raw) } as UserState;
  } catch {
    memoryState = defaultState();
  }
  return memoryState;
}

async function writeState(state: UserState): Promise<void> {
  memoryState = state;
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}

export async function getProfile(): Promise<UserProfile> {
  const state = await readState();
  return state.profile;
}

export async function isOnboardingComplete(): Promise<boolean> {
  const state = await readState();
  return state.firstVisitCompleted;
}

export async function completeOnboarding(): Promise<void> {
  const state = await readState();
  state.firstVisitCompleted = true;
  await writeState(state);
}

export async function updateProfile(
  patch: Partial<
    Pick<
      UserProfile,
      | "fullName"
      | "avatarUrl"
      | "status"
      | "mood"
      | "githubUrl"
      | "linkedinUrl"
      | "leetcodeUrl"
      | "websiteUrl"
    >
  > & { firstName?: string; lastName?: string },
): Promise<UserProfile> {
  const state = await readState();
  const profile = state.profile;

  if (patch.firstName !== undefined || patch.lastName !== undefined) {
    const parts = profile.fullName.split(" ");
    const first = patch.firstName ?? parts[0] ?? "";
    const last =
      patch.lastName ?? parts.slice(1).join(" ") ?? "";
    profile.fullName = `${first} ${last}`.trim() || profile.fullName;
  }
  if (patch.avatarUrl !== undefined) profile.avatarUrl = patch.avatarUrl || undefined;
  if (patch.status !== undefined) profile.status = patch.status;
  if (patch.mood !== undefined) profile.mood = patch.mood;
  if (patch.githubUrl !== undefined) profile.githubUrl = patch.githubUrl;
  if (patch.linkedinUrl !== undefined) profile.linkedinUrl = patch.linkedinUrl;
  if (patch.leetcodeUrl !== undefined) profile.leetcodeUrl = patch.leetcodeUrl;
  if (patch.websiteUrl !== undefined) profile.websiteUrl = patch.websiteUrl;

  await writeState(state);
  return profile;
}

export async function getComponentsSeen(): Promise<ComponentSeenRow[]> {
  return (await readState()).componentsSeen;
}

export async function markComponentSeen(input: {
  componentId: string;
  projectId: string;
}): Promise<ComponentSeenRow> {
  const state = await readState();
  const existing = state.componentsSeen.find(
    (r) => r.componentId === input.componentId,
  );
  if (existing) {
    if (existing.projectId === input.projectId) return existing;
    existing.projectId = input.projectId;
    await writeState(state);
    return existing;
  }
  const row: ComponentSeenRow = {
    ...input,
    seenAt: new Date().toISOString(),
  };
  state.componentsSeen.push(row);
  await writeState(state);
  return row;
}

export async function getProjectProgressList(): Promise<ProjectProgressRow[]> {
  return (await readState()).projectProgress;
}

export async function getProjectProgress(projectId: string) {
  const state = await readState();
  return (
    state.projectProgress.find((p) => p.projectId === projectId) ?? null
  );
}

export async function setProjectProgress(
  projectId: string,
  input: { stageIndex: number; status: "in_progress" | "completed" },
): Promise<ProjectProgressRow> {
  const state = await readState();
  const now = new Date().toISOString();
  const existing = state.projectProgress.find((p) => p.projectId === projectId);
  if (existing) {
    existing.stageIndex = input.stageIndex;
    existing.status = input.status;
    existing.updatedAt = now;
    await writeState(state);
    return existing;
  }
  const row: ProjectProgressRow = {
    projectId,
    stageIndex: input.stageIndex,
    status: input.status,
    updatedAt: now,
  };
  state.projectProgress.push(row);
  await writeState(state);
  return row;
}

export async function trackVisit(): Promise<void> {
  const day = new Date().toISOString().slice(0, 10);
  const state = await readState();
  const row = state.visitDays.find((v) => v.day === day);
  if (row) return;
  state.visitDays.push({ day, count: 1 });
  await writeState(state);
}

export async function getVisitDays(days = 120): Promise<VisitDayRow[]> {
  const state = await readState();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  return state.visitDays
    .filter((v) => v.day >= since)
    .sort((a, b) => (a.day < b.day ? -1 : 1));
}

export async function getConceptsCompleted(): Promise<ConceptCompletedRow[]> {
  const state = await readState();
  return state.conceptsCompleted ?? [];
}

export async function markConceptCompleted(input: {
  trackSlug: string;
  conceptSlug: string;
}): Promise<ConceptCompletedRow> {
  const state = await readState();
  if (!state.conceptsCompleted) state.conceptsCompleted = [];

  const existing = state.conceptsCompleted.find(
    (r) =>
      r.trackSlug === input.trackSlug && r.conceptSlug === input.conceptSlug,
  );
  if (existing) return existing;

  const row: ConceptCompletedRow = {
    ...input,
    completedAt: new Date().toISOString(),
  };
  state.conceptsCompleted.push(row);
  await writeState(state);
  return row;
}

export async function unmarkConceptCompleted(input: {
  trackSlug: string;
  conceptSlug: string;
}): Promise<boolean> {
  const state = await readState();
  if (!state.conceptsCompleted?.length) return false;

  const before = state.conceptsCompleted.length;
  state.conceptsCompleted = state.conceptsCompleted.filter(
    (r) =>
      !(r.trackSlug === input.trackSlug && r.conceptSlug === input.conceptSlug),
  );
  if (state.conceptsCompleted.length === before) return false;

  await writeState(state);
  return true;
}
