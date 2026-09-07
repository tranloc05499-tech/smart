import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Assign exam to class(es)
const assignSchema = z.object({
  classIds: z.array(z.string()).min(1),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAuthUserFromRequest(request);
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  try {
    const exam = await prisma.exam.findFirst({ where: { id, teacherId: session.userId } });
    if (!exam) return NextResponse.json({ error: "Không tìm thấy đề thi" }, { status: 404 });

    const body = await request.json();
    const { classIds } = assignSchema.parse(body);

    await prisma.examClassAssignment.createMany({
      data: classIds.map(classId => ({ examId: id, classId })),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("POST /api/exams/[id]/classes error:", error);
    return NextResponse.json({ error: "Lỗi giao đề thi cho lớp" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAuthUserFromRequest(request);
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  try {
    const exam = await prisma.exam.findFirst({ where: { id, teacherId: session.userId } });
    if (!exam) return NextResponse.json({ error: "Không tìm thấy đề thi" }, { status: 404 });
    const body = await request.json();
    const { classId } = z.object({ classId: z.string() }).parse(body);

    await prisma.examClassAssignment.deleteMany({ where: { examId: id, classId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/exams/[id]/classes error:", error);
    return NextResponse.json({ error: "Lỗi xoá giao lớp" }, { status: 500 });
  }
}
