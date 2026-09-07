import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const autosaveSchema = z.object({
  attemptId: z.string(),
  questionId: z.string(),
  selectedOptionIds: z.string().optional(),
  textAnswer: z.string().optional(),
  isFlagged: z.boolean().optional(),
});

// PATCH: Autosave a single answer
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = autosaveSchema.parse(body);

    // Verify attempt exists and is still valid
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: validated.attemptId },
      select: { id: true, status: true, expiresAt: true },
    });

    if (!attempt) return NextResponse.json({ error: "Không tìm thấy bài thi" }, { status: 404 });
    if (attempt.status !== "IN_PROGRESS") return NextResponse.json({ error: "Bài thi đã kết thúc" }, { status: 400 });
    if (new Date() > attempt.expiresAt) {
      // Auto-expire
      await prisma.examAttempt.update({ where: { id: validated.attemptId }, data: { status: "EXPIRED" } });
      return NextResponse.json({ error: "Hết thời gian làm bài" }, { status: 400 });
    }

    await prisma.examAnswer.upsert({
      where: { attemptId_questionId: { attemptId: validated.attemptId, questionId: validated.questionId } },
      create: {
        attemptId: validated.attemptId,
        questionId: validated.questionId,
        selectedOptionIds: validated.selectedOptionIds || null,
        textAnswer: validated.textAnswer || null,
        isFlagged: validated.isFlagged ?? false,
        autosavedAt: new Date(),
      },
      update: {
        selectedOptionIds: validated.selectedOptionIds !== undefined ? validated.selectedOptionIds : undefined,
        textAnswer: validated.textAnswer !== undefined ? validated.textAnswer : undefined,
        isFlagged: validated.isFlagged !== undefined ? validated.isFlagged : undefined,
        autosavedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, savedAt: new Date() });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("PATCH /api/exam-session/autosave error:", error);
    return NextResponse.json({ error: "Lỗi tự động lưu" }, { status: 500 });
  }
}
