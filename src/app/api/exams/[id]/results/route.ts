import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET list of exam results/attempts for a specific exam (teacher view)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAuthUserFromRequest(request);
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  try {
    const exam = await prisma.exam.findFirst({ where: { id, teacherId: session.userId } });
    if (!exam) return NextResponse.json({ error: "Không tìm thấy đề thi" }, { status: 404 });

    const attempts = await prisma.examAttempt.findMany({
      where: { examId: id },
      orderBy: { submittedAt: "desc" },
      include: {
        student: { select: { id: true, fullName: true, email: true } },
        _count: { select: { answers: true } },
      },
    });

    return NextResponse.json(
      attempts.map(a => ({
        id: a.id, studentId: a.studentId,
        studentName: a.studentName, studentCode: a.studentCode,
        status: a.status, score: a.score, totalPoints: a.totalPoints,
        startedAt: a.startedAt, submittedAt: a.submittedAt,
        answersCount: a._count.answers,
        studentInfo: a.student,
        user: a.student,
      }))
    );
  } catch (error) {
    console.error("GET /api/exams/[id]/results error:", error);
    return NextResponse.json({ error: "Lỗi lấy kết quả thi" }, { status: 500 });
  }
}

// Trigger manual grading for essay questions in an attempt
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAuthUserFromRequest(request);
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  try {
    const body = await request.json();
    const { attemptId, questionId, score, feedback } = z.object({
      attemptId: z.string(),
      questionId: z.string(),
      score: z.number().min(0),
      feedback: z.string().optional(),
    }).parse(body);

    // Verify access
    const attempt = await prisma.examAttempt.findFirst({
      where: { id: attemptId, examId: id, exam: { teacherId: session.userId } },
    });
    if (!attempt) return NextResponse.json({ error: "Không tìm thấy bài làm" }, { status: 404 });

    // Update the specific answer
    await prisma.examAnswer.updateMany({
      where: { attemptId, questionId },
      data: { score, isCorrect: score > 0 },
    });

    // Recalculate total score for the attempt
    const answers = await prisma.examAnswer.findMany({ where: { attemptId } });
    const totalScore = answers.reduce((sum, a) => sum + (a.score ?? 0), 0);

    // Get max possible score
    const examQuestions = await prisma.examQuestion.findMany({ where: { examId: id } });
    const maxScore = examQuestions.reduce((sum, eq) => sum + eq.points, 0);
    const normalizedScore = maxScore > 0 ? (totalScore / maxScore) * 10 : 0;

    await prisma.examAttempt.update({
      where: { id: attemptId },
      data: { score: Math.round(normalizedScore * 10) / 10, totalPoints: totalScore, status: "GRADED" },
    });

    return NextResponse.json({ success: true, score: normalizedScore });
  } catch (error) {
    console.error("POST /api/exams/[id]/results error:", error);
    return NextResponse.json({ error: "Lỗi chấm điểm" }, { status: 500 });
  }
}
