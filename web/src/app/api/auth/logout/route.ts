import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { buildExpiredAuthCookie } from "@/lib/auth-cookie";

export async function POST() {
  (await cookies()).set(buildExpiredAuthCookie());
  return NextResponse.json({ ok: true });
}
