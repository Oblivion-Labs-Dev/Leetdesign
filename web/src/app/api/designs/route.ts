import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

const USER_ID = "local-user";

async function ensureUser() {
  return prisma.user.upsert({
    where: { id: USER_ID },
    create: { id: USER_ID, alias: "Local User" },
    update: {},
  });
}

export async function GET() {
  await ensureUser();
  const designs = await prisma.design.findMany({
    where: { userId: USER_ID },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      courseId: true,
      milestoneId: true,
      projectKind: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return NextResponse.json(designs);
}

export async function POST(request: Request) {
  await ensureUser();
  const body = await request.json();

  const design = await prisma.design.create({
    data: {
      userId: USER_ID,
      name: body.name ?? "Untitled",
      description: body.description ?? "",
      data: body.data ?? { nodes: [], edges: [], simulation: { tickRateMs: 100, timeScale: 1 } },
      courseId: body.courseId ?? null,
      milestoneId: body.milestoneId ?? null,
      projectKind: body.projectKind ?? null,
    },
  });

  return NextResponse.json(design, { status: 201 });
}
