import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserProfile } from "@/types";

const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "http://localhost:4000";

type BackendMe = {
  id: string;
  name: string;
  alias: string;
  workEmail: string;
  avatarUrl?: string;
  badge?: string;
  xp?: number;
  stardust?: number;
  status?: string | null;
  mood?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  leetcodeUrl?: string | null;
  websiteUrl?: string | null;
  firstVisitCompleted: boolean;
  createdAt: string;
};

export async function getAuthToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get("leetdesign_token")?.value ?? null;
}

export async function fetchCurrentUserRaw(
  token: string,
): Promise<BackendMe | null> {
  const res = await fetch(`${BACKEND_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as BackendMe;
}

export async function requireBackendUser() {
  const token = await getAuthToken();
  if (!token) redirect("/login");
  const user = await fetchCurrentUserRaw(token);
  if (!user) redirect("/login");
  return { token, user };
}

export async function getCurrentUserProfile(): Promise<UserProfile> {
  const { user } = await requireBackendUser();
  return {
    id: user.id,
    alias: user.alias,
    fullName: user.name,
    workEmail: user.workEmail,
    avatarUrl: user.avatarUrl,
    badge: (user.badge as UserProfile["badge"]) ?? "intern",
    xp: user.xp ?? 0,
    stardust: user.stardust ?? 0,
    status: user.status ?? null,
    mood: user.mood ?? null,
    githubUrl: user.githubUrl ?? null,
    linkedinUrl: user.linkedinUrl ?? null,
    leetcodeUrl: user.leetcodeUrl ?? null,
    websiteUrl: user.websiteUrl ?? null,
    joinedAt: new Date(user.createdAt).toISOString().slice(0, 10),
  };
}
