import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAuthUserFromRequest(request);
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  try {
    const assignment = await prisma.assignment.findFirst({
      where: { id, teacherId: session.userId },
      include: {
        class: { select: { id: true, name: true, subject: true, grade: true } },
        submissions: {
          include: {
            student: { select: { id: true, fullName: true, email: true } },
            versions: { orderBy: { version: "desc" }, take: 1 },
          },
        },
      },
    });
    if (!assignment) return NextResponse.json({ error: "Không tìm thấy bài tập" }, { status: 404 });
    return NextResponse.json({ assignment });
  } catch (error) {
    console.error("GET /api/assignments/[id] error:", error);
    return NextResponse.json({ error: "Lỗi lấy bài tập" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAuthUserFromRequest(request);
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  try {
    const assignment = await prisma.assignment.findFirst({ where: { id, teacherId: session.userId } });
    if (!assignment) return NextResponse.json({ error: "Không tìm thấy bài tập" }, { status: 404 });

    const body = await request.json();
    const updated = await prisma.assignment.update({
      where: { id },
      data: {
        ...body,
        deadline: body.deadline ? new Date(body.deadline) : undefined,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
      },
    });
    return NextResponse.json({ success: true, assignment: updated });
  } catch (error) {
    console.error("PATCH /api/assignments/[id] error:", error);
    return NextResponse.json({ error: "Lỗi cập nhật bài tập" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAuthUserFromRequest(request);
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  try {
    const assignment = await prisma.assignment.findFirst({ where: { id, teacherId: session.userId } });
    if (!assignment) return NextResponse.json({ error: "Không tìm thấy bài tập" }, { status: 404 });
    await prisma.assignment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/assignments/[id] error:", error);
    return NextResponse.json({ error: "Lỗi xoá bài tập" }, { status: 500 });
  }
}
