import { NextRequest, NextResponse } from "next/server";
import { markConceptCompleted } from "@/lib/local-store";
import { CONCEPT_CATALOG } from "@/lib/content/learn/roadmap";
import { getLesson } from "@/lib/content/learn/registry";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const trackSlug = String(body.trackSlug ?? "");
  const conceptSlug = String(body.conceptSlug ?? "");

  const concept = CONCEPT_CATALOG[conceptSlug];
  if (!concept || concept.trackSlug !== trackSlug) {
    return NextResponse.json({ error: "Unknown concept" }, { status: 400 });
  }

  if (!concept.hasLesson || !getLesson(trackSlug, conceptSlug)) {
    return NextResponse.json(
      { error: "Lesson not available yet" },
      { status: 400 },
    );
  }

  const row = await markConceptCompleted({ trackSlug, conceptSlug });
  return NextResponse.json({ ok: true, concept: row });
}
