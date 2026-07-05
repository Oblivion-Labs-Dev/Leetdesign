import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

const USER_ID = "local-user";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const design = await prisma.design.findFirst({
    where: { id, userId: USER_ID },
  });

  if (!design) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(design);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  const design = await prisma.design.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      data: body.data,
      courseId: body.courseId,
      milestoneId: body.milestoneId,
      projectKind: body.projectKind,
    },
  });

  return NextResponse.json(design);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.design.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
