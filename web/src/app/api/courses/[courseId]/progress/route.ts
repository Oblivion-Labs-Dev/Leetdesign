import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

const USER_ID = "local-user";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await params;
  const progress = await prisma.courseProgress.findUnique({
    where: { userId_courseId: { userId: USER_ID, courseId } },
  });

  if (!progress) {
    return NextResponse.json(null);
  }

  return NextResponse.json(progress);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await params;
  const body = await request.json();

  const progress = await prisma.courseProgress.upsert({
    where: { userId_courseId: { userId: USER_ID, courseId } },
    create: {
      userId: USER_ID,
      courseId,
      milestoneId: body.milestoneId,
      phase: body.phase,
      completedMilestoneIds: body.completedMilestoneIds ?? [],
      simulationRuns: body.simulationRuns ?? 0,
      afterSimRuns: body.afterSimRuns ?? 0,
    },
    update: {
      milestoneId: body.milestoneId,
      phase: body.phase,
      completedMilestoneIds: body.completedMilestoneIds ?? [],
      simulationRuns: body.simulationRuns ?? 0,
      afterSimRuns: body.afterSimRuns ?? 0,
    },
  });

  return NextResponse.json(progress);
}
