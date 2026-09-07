import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// POST: Submit exam attempt and auto-grade objective questions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { attemptId, cheatFlags } = z.object({
      attemptId: z.string(),
      cheatFlags: z.array(z.string()).optional(),
    }).parse(body);

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: true,
        exam: {
          include: {
            questions: {
              include: {
                question: { include: { options: true } },
              },
            },
          },
        },
      },
    });

    if (!attempt) return NextResponse.json({ error: "Không tìm thấy bài thi" }, { status: 404 });
    if (attempt.status !== "IN_PROGRESS") return NextResponse.json({ error: "Bài thi đã được nộp" }, { status: 400 });

    const now = new Date();
    if (now > attempt.expiresAt) {
      await prisma.examAttempt.update({
        where: { id: attemptId },
        data: { status: "EXPIRED", submittedAt: now, cheatFlags: cheatFlags ? JSON.stringify(cheatFlags) : undefined },
      });
      return NextResponse.json({ error: "Đã hết thời gian làm bài", status: "EXPIRED" }, { status: 408 });
    }

    const snapshot = JSON.parse(attempt.snapshot || "[]") as Array<{
      questionId: string;
      type: string;
      points: number;
      options: Array<{ id: string }>;
    }>;
    let totalScore = 0;
    let totalPoints = 0;
    let hasEssay = false;

    // Auto-grade objective questions
    const gradingUpdates: Promise<unknown>[] = [];

    for (const snapshotQuestion of snapshot) {
      const question = attempt.exam.questions.find((examQuestion) => examQuestion.question.id === snapshotQuestion.questionId)?.question;
      if (!question) continue;
      const qPoints = snapshotQuestion.points;
      totalPoints += qPoints;

      const answer = attempt.answers.find(a => a.questionId === question.id);
      if (!answer) continue;

      let score = 0;
      let isCorrect = false;

      if (snapshotQuestion.type === "essay") {
        hasEssay = true;
        // Essay questions: no auto-grade, score stays null
        continue;
      } else if (snapshotQuestion.type === "single_choice" || snapshotQuestion.type === "true_false") {
        const correctOption = question.options.find(o => o.isCorrect);
        if (correctOption && answer.selectedOptionIds) {
          const selectedIds = answer.selectedOptionIds.split(",").map(s => s.trim()).filter(Boolean);
          isCorrect = selectedIds.includes(correctOption.id);
          score = isCorrect ? qPoints : 0;
        }
      } else if (snapshotQuestion.type === "multiple_choice") {
        const correctIds = question.options.filter(o => o.isCorrect).map(o => o.id).filter(id => snapshotQuestion.options.some(option => option.id === id)).sort();
        if (answer.selectedOptionIds) {
          const selectedIds = answer.selectedOptionIds.split(",").map(s => s.trim()).filter(Boolean).sort();
          isCorrect = JSON.stringify(correctIds) === JSON.stringify(selectedIds);
          score = isCorrect ? qPoints : 0;
        }
      } else if (snapshotQuestion.type === "short_answer" || snapshotQuestion.type === "fill_blank") {
        if (answer.textAnswer && question.correctAnswer) {
          const normalize = (s: string) => s.toLowerCase().trim().replace(/\s+/g, " ");
          isCorrect = normalize(answer.textAnswer) === normalize(question.correctAnswer);
          score = isCorrect ? qPoints : 0;
        }
      }

      totalScore += score;
      gradingUpdates.push(
        prisma.examAnswer.updateMany({
          where: { attemptId, questionId: question.id },
          data: { score, isCorrect },
        })
      );
    }

    await Promise.all(gradingUpdates);

    // Normalize score to 10-point scale
    const normalizedScore = totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) / 10 : 0;

    const updatedAttempt = await prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: hasEssay ? "SUBMITTED" : "GRADED",
        submittedAt: now,
        score: normalizedScore,
        totalPoints: totalScore,
        cheatFlags: cheatFlags ? JSON.stringify(cheatFlags) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      score: updatedAttempt.score,
      totalPoints: updatedAttempt.totalPoints,
      status: updatedAttempt.status,
      showScore: attempt.exam.showScore,
      showAnswers: attempt.exam.showAnswers,
      showExplanation: attempt.exam.showExplanation,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("POST /api/exam-session/submit error:", error);
    return NextResponse.json({ error: "Lỗi nộp bài thi" }, { status: 500 });
  }
}
