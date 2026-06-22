import { NextRequest, NextResponse } from "next/server";
import { updateProfile } from "@/lib/local-store";

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const user = await updateProfile(body ?? {});
  return NextResponse.json({ ok: true, user });
}
