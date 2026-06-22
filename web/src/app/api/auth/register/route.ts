import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { buildAuthCookie } from "@/lib/auth-cookie";

const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "http://localhost:4000";

export async function POST(req: Request) {
  const body = await req.json();
  const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const json = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { error: json?.error ?? "Signup failed." },
      { status: res.status },
    );
  }

  const token = String(json?.token ?? "");
  if (!token) {
    return NextResponse.json(
      { error: "Auth token missing from backend response." },
      { status: 502 },
    );
  }

  (await cookies()).set(buildAuthCookie(token));
  return NextResponse.json({
    ok: true,
    user: json.user,
  });
}
