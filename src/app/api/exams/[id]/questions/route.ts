import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const questionOptionSchema = z.object({
  label: z.string(),
  content: z.string(),
  isCorrect: z.boolean().default(false),
  order: z.number().int().optional(),
});

const createQuestionDirectSchema = z.object({
  content: z.string().min(1, "Nội dung câu hỏi không được để trống"),
  type: z.string().default("single_choice"),
  points: z.number().min(0.1).default(1.0),
  explanation: z.string().optional(),
  options: z.array(questionOptionSchema).optional(),
});

const addFromBankSchema = z.object({
  questionIds: z.array(z.string()).min(1),
  sectionId: z.string().optional(),
});

// POST: Add question to exam (supports BOTH direct creation and adding from bank)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAuthUserFromRequest(request);
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  try {
    const exam = await prisma.exam.findFirst({ where: { id, teacherId: session.userId } });
    if (!exam) return NextResponse.json({ error: "Không tìm thấy đề thi" }, { status: 404 });

    const body = await request.json();

    // Case 1: Adding from existing question bank
    if (Array.isArray(body.questionIds)) {
      const { questionIds, sectionId } = addFromBankSchema.parse(body);

      const lastQ = await prisma.examQuestion.findFirst({
        where: { examId: id },
        orderBy: { order: "desc" },
      });
      let order = (lastQ?.order ?? 0) + 1;

      const questions = await prisma.question.findMany({
        where: { id: { in: questionIds } },
      });

      const data = questionIds.map(qId => {
        const q = questions.find(x => x.id === qId);
        return {
          examId: id,
          questionId: qId,
          sectionId: sectionId || null,
          order: order++,
          points: q?.points ?? 1.0,
        };
      });

      await prisma.examQuestion.createMany({ data });
      return NextResponse.json({ success: true, added: data.length });
    }

    // Case 2: Creating a new question directly inside the exam
    const validated = createQuestionDirectSchema.parse(body);

    const newQuestion = await prisma.question.create({
      data: {
        content: validated.content,
        type: validated.type,
        points: validated.points,
        explanation: validated.explanation || null,
        createdById: session.userId,
        options: validated.options && validated.options.length > 0
          ? {
              createMany: {
                data: validated.options.map((opt, idx) => ({
                  label: opt.label,
                  content: opt.content,
                  isCorrect: opt.isCorrect,
                  order: opt.order ?? idx,
                })),
              },
            }
          : undefined,
      },
      include: { options: true },
    });

    const lastQ = await prisma.examQuestion.findFirst({
      where: { examId: id },
      orderBy: { order: "desc" },
    });
    const order = (lastQ?.order ?? 0) + 1;

    const examQuestion = await prisma.examQuestion.create({
      data: {
        examId: id,
        questionId: newQuestion.id,
        order,
        points: validated.points,
      },
      include: {
        question: { include: { options: true } },
      },
    });

    return NextResponse.json({ success: true, examQuestion }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("POST /api/exams/[id]/questions error:", error);
    return NextResponse.json({ error: "Lỗi thêm câu hỏi vào đề thi" }, { status: 500 });
  }
}

// DELETE: Remove a question from the exam (supports query param or JSON body)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAuthUserFromRequest(request);
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  try {
    const exam = await prisma.exam.findFirst({ where: { id, teacherId: session.userId } });
    if (!exam) return NextResponse.json({ error: "Không tìm thấy đề thi" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    let examQuestionId = searchParams.get("questionId") || searchParams.get("examQuestionId");

    if (!examQuestionId) {
      try {
        const body = await request.json();
        examQuestionId = body.examQuestionId || body.questionId;
      } catch {
        // No body
      }
    }

    if (!examQuestionId) {
      return NextResponse.json({ error: "Thiếu mã câu hỏi cần xoá" }, { status: 400 });
    }

    await prisma.examQuestion.deleteMany({
      where: {
        id: examQuestionId,
        examId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/exams/[id]/questions error:", error);
    return NextResponse.json({ error: "Lỗi xoá câu hỏi khỏi đề thi" }, { status: 500 });
  }
}
