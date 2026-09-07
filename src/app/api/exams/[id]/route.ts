import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateExamSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  durationMinutes: z.number().int().min(5).max(300).optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  maxAttempts: z.number().int().min(1).optional(),
  randomizeQuestions: z.boolean().optional(),
  randomizeOptions: z.boolean().optional(),
  showScore: z.boolean().optional(),
  showAnswers: z.boolean().optional(),
  showExplanation: z.boolean().optional(),
  requireLogin: z.boolean().optional(),
  antiCheatLevel: z.number().int().min(0).max(2).optional(),
  passScore: z.number().min(0).max(100).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]).optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAuthUserFromRequest(request);
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  try {
    const exam = await prisma.exam.findFirst({
      where: { id, teacherId: session.userId },
      include: {
        sections: { orderBy: { order: "asc" } },
        questions: {
          orderBy: { order: "asc" },
          include: {
            question: {
              include: { options: { orderBy: { order: "asc" } } },
            },
            section: true,
          },
        },
        classAssignments: {
          include: { class: { select: { id: true, name: true, code: true } } },
        },
        _count: { select: { attempts: true } },
      },
    });

    if (!exam) return NextResponse.json({ error: "Không tìm thấy đề thi" }, { status: 404 });

    return NextResponse.json({
      ...exam,
      exam,
    });
  } catch (error) {
    console.error("GET /api/exams/[id] error:", error);
    return NextResponse.json({ error: "Lỗi lấy đề thi" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAuthUserFromRequest(request);
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  try {
    const exam = await prisma.exam.findFirst({ where: { id, teacherId: session.userId } });
    if (!exam) return NextResponse.json({ error: "Không tìm thấy đề thi" }, { status: 404 });

    const body = await request.json();
    const validated = updateExamSchema.parse(body);

    const updated = await prisma.exam.update({
      where: { id },
      data: {
        ...validated,
        startTime: validated.startTime === null ? null : validated.startTime ? new Date(validated.startTime) : undefined,
        endTime: validated.endTime === null ? null : validated.endTime ? new Date(validated.endTime) : undefined,
      },
    });

    return NextResponse.json({ success: true, exam: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("PATCH /api/exams/[id] error:", error);
    return NextResponse.json({ error: "Lỗi cập nhật đề thi" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAuthUserFromRequest(request);
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  try {
    const exam = await prisma.exam.findFirst({ where: { id, teacherId: session.userId } });
    if (!exam) return NextResponse.json({ error: "Không tìm thấy đề thi" }, { status: 404 });

    await prisma.exam.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/exams/[id] error:", error);
    return NextResponse.json({ error: "Lỗi xoá đề thi" }, { status: 500 });
  }
}
