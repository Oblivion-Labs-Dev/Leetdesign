import { NextResponse } from "next/server";
import { markComponentSeen } from "@/lib/local-store";

export async function POST(req: Request) {
  const body = await req.json();
  const componentId = String(body.componentId ?? "").trim();
  const projectId = String(body.projectId ?? "").trim();
  if (!componentId || !projectId) {
    return NextResponse.json(
      { error: "componentId and projectId required" },
      { status: 400 },
    );
  }
  const item = await markComponentSeen({ componentId, projectId });
  return NextResponse.json({ ok: true, item });
}
