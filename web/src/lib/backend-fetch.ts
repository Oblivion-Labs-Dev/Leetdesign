import { cookies } from "next/headers";

const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "http://localhost:4000";

export async function backendFetch<T = Record<string, unknown>>(
  path: string,
  init: RequestInit = {},
): Promise<T | null> {
  const token = (await cookies()).get("leetdesign_token")?.value;
  if (!token) return null;
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json().catch(() => null)) as T | null;
}
