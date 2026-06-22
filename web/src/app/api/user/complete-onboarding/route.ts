import { NextResponse } from "next/server";
import { completeOnboarding } from "@/lib/local-store";

export async function POST() {
  await completeOnboarding();
  return NextResponse.json({ ok: true });
}
