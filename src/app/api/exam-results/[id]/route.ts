import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Get attempt result details (after submission)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const attempt = await prisma.examAttempt.findUnique({
      where: { id },
      include: {
        answers: true,
        exam: {
          select: {
            id: true, title: true, code: true, showScore: true, showAnswers: true,
            showExplanation: true, passScore: true, durationMinutes: true,
            questions: {
              orderBy: { order: "asc" },
              include: {
                question: {
                  include: { options: { orderBy: { order: "asc" } } },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt) return NextResponse.json({ error: "Không tìm thấy bài thi" }, { status: 404 });

    if (attempt.status === "IN_PROGRESS") {
      return NextResponse.json({ error: "Bài thi chưa được nộp" }, { status: 400 });
    }

    const snapshot = JSON.parse(attempt.snapshot || "[]");
    
    // Build result
    const result = {
      attemptId: attempt.id,
      studentName: attempt.studentName,
      studentCode: attempt.studentCode,
      status: attempt.status,
      score: attempt.score,
      totalPoints: attempt.totalPoints,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      durationUsedSeconds: attempt.submittedAt
        ? Math.floor((attempt.submittedAt.getTime() - attempt.startedAt.getTime()) / 1000)
        : null,
      exam: {
        title: attempt.exam.title,
        code: attempt.exam.code,
        passScore: attempt.exam.passScore,
        showScore: attempt.exam.showScore,
        showAnswers: attempt.exam.showAnswers,
        showExplanation: attempt.exam.showExplanation,
      },
      answers: attempt.exam.showAnswers
        ? snapshot.map((q: { questionId: string; type: string; content: string; points: number; options: { id: string; label: string; content: string }[]; order: number }) => {
            const answer = attempt.answers.find(a => a.questionId === q.questionId);
            const examQ = attempt.exam.questions.find(eq => eq.question.id === q.questionId);
            const question = examQ?.question;
            return {
              order: q.order,
              questionId: q.questionId,
              type: q.type,
              content: q.content,
              points: q.points,
              options: q.options,
              selectedOptionIds: answer?.selectedOptionIds,
              textAnswer: answer?.textAnswer,
              score: answer?.score,
              isCorrect: answer?.isCorrect,
              isFlagged: answer?.isFlagged,
              correctAnswer: attempt.exam.showAnswers ? question?.correctAnswer : undefined,
              explanation: attempt.exam.showExplanation ? question?.explanation : undefined,
              correctOptionIds: attempt.exam.showAnswers
                ? question?.options.filter(o => o.isCorrect).map(o => o.id)
                : undefined,
            };
          })
        : null,
      questionsTotal: snapshot.length,
      questionsAnswered: attempt.answers.length,
      questionsCorrect: attempt.answers.filter(a => a.isCorrect).length,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/exam-results/[id] error:", error);
    return NextResponse.json({ error: "Lỗi lấy kết quả bài thi" }, { status: 500 });
  }
}
