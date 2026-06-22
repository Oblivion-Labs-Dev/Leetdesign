import { NextResponse } from "next/server";
import { getProjectProgress, setProjectProgress } from "@/lib/local-store";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await ctx.params;
  const item = await getProjectProgress(projectId);
  return NextResponse.json({ item });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await ctx.params;
  const body = await req.json();
  const stageIndex = Number(body.stageIndex ?? 0);
  const status =
    body.status === "completed" ? "completed" : ("in_progress" as const);
  const item = await setProjectProgress(projectId, { stageIndex, status });
  return NextResponse.json({ ok: true, item });
}
