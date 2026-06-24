import { NextRequest, NextResponse } from "next/server";
import { markConceptCompleted, unmarkConceptCompleted } from "@/lib/local-store";
import { CONCEPT_CATALOG } from "@/lib/content/learn/roadmap";
import { getLesson } from "@/lib/content/learn/registry";

function validateConcept(trackSlug: string, conceptSlug: string) {
  const concept = CONCEPT_CATALOG[conceptSlug];
  if (!concept || concept.trackSlug !== trackSlug) {
    return { error: "Unknown concept" as const, status: 400 as const };
  }

  if (!concept.hasLesson || !getLesson(trackSlug, conceptSlug)) {
    return { error: "Lesson not available yet" as const, status: 400 as const };
  }

  return { concept };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const trackSlug = String(body.trackSlug ?? "");
  const conceptSlug = String(body.conceptSlug ?? "");

  const validated = validateConcept(trackSlug, conceptSlug);
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: validated.status });
  }

  const row = await markConceptCompleted({ trackSlug, conceptSlug });
  return NextResponse.json({ ok: true, concept: row });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const trackSlug = String(body.trackSlug ?? "");
  const conceptSlug = String(body.conceptSlug ?? "");

  const validated = validateConcept(trackSlug, conceptSlug);
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: validated.status });
  }

  await unmarkConceptCompleted({ trackSlug, conceptSlug });
  return NextResponse.json({ ok: true });
}
