import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { buildExpiredAuthCookie } from "@/lib/auth-cookie";

const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "http://localhost:4000";

export default async function proxy(req: NextRequest) {
  const token = req.cookies.get("leetdesign_token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      const redirectRes = NextResponse.redirect(new URL("/login", req.url));
      redirectRes.cookies.set(buildExpiredAuthCookie());
      return redirectRes;
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/practice/:path*",
    "/tasks/:path*",
    "/library/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/brushup/:path*",
    "/welcome/:path*",
    "/onboarding/:path*",
  ],
};
