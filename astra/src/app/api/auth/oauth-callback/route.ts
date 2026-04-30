import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { buildAuthCookie } from "@/lib/auth-cookie";

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const token = searchParams.get("token");
  const nextPath = searchParams.get("next") ?? "/dashboard";

  if (!token) {
    return NextResponse.redirect(new URL("/login?oauth=failed", origin));
  }

  const safeNext = nextPath.startsWith("/") ? nextPath : "/dashboard";
  (await cookies()).set(buildAuthCookie(token));
  return NextResponse.redirect(new URL(safeNext, origin));
}
