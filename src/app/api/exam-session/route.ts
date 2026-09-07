import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getAuthUserFromRequest } from "@/lib/auth";

// GET: Verify exam by code and return basic info (public endpoint)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) return NextResponse.json({ error: "Thiếu mã đề thi" }, { status: 400 });

  try {
    const exam = await prisma.exam.findUnique({
      where: { code: code.toUpperCase() },
      select: {
        id: true, title: true, code: true, description: true,
        durationMinutes: true, status: true, startTime: true, endTime: true,
        maxAttempts: true, requireLogin: true, antiCheatLevel: true,
        _count: { select: { questions: true } },
      },
    });

    if (!exam) return NextResponse.json({ error: "Không tìm thấy đề thi với mã này" }, { status: 404 });

    if (exam.status !== "PUBLISHED") {
      return NextResponse.json({
        error: exam.status === "DRAFT" ? "Đề thi chưa được mở cho học sinh" : "Đề thi đã kết thúc",
      }, { status: 403 });
    }

    const now = new Date();
    if (exam.startTime && now < exam.startTime) {
      return NextResponse.json({ error: `Đề thi sẽ bắt đầu lúc ${exam.startTime.toLocaleString("vi-VN")}` }, { status: 403 });
    }
    if (exam.endTime && now > exam.endTime) {
      return NextResponse.json({ error: "Đề thi đã hết thời gian" }, { status: 403 });
    }

    return NextResponse.json({
      id: exam.id, title: exam.title, code: exam.code, description: exam.description,
      durationMinutes: exam.durationMinutes, questionsCount: exam._count.questions,
      requireLogin: exam.requireLogin, antiCheatLevel: exam.antiCheatLevel,
      maxAttempts: exam.maxAttempts,
    });
  } catch (error) {
    console.error("GET /api/exam-session error:", error);
    return NextResponse.json({ error: "Lỗi kiểm tra đề thi" }, { status: 500 });
  }
}

const startSchema = z.object({
  examCode: z.string().min(1),
  studentName: z.string().min(1, "Vui lòng nhập tên"),
  studentCode: z.string().optional(),
});

// POST: Start exam session → create ExamAttempt + return snapshot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { examCode, studentName, studentCode } = startSchema.parse(body);

    const exam = await prisma.exam.findUnique({
      where: { code: examCode.toUpperCase() },
      include: {
        questions: {
          include: {
            question: {
              include: { options: { orderBy: { order: "asc" } } },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!exam) return NextResponse.json({ error: "Không tìm thấy đề thi" }, { status: 404 });
    if (exam.status !== "PUBLISHED") return NextResponse.json({ error: "Đề thi chưa được mở" }, { status: 403 });
    if (exam.questions.length === 0) return NextResponse.json({ error: "Đề thi chưa có câu hỏi" }, { status: 400 });

    const session = await getAuthUserFromRequest(request);
    if (exam.requireLogin && !session) {
      return NextResponse.json({ error: "Đề thi yêu cầu đăng nhập" }, { status: 401 });
    }

    const identity = session?.userId
      ? { studentId: session.userId }
      : { studentName, studentCode: studentCode || null };
    const previousAttempts = await prisma.examAttempt.count({
      where: { examId: exam.id, ...identity, status: { not: "EXPIRED" } },
    });
    if (previousAttempts >= exam.maxAttempts) {
      return NextResponse.json({ error: "Bạn đã sử dụng hết số lượt làm bài cho đề thi này" }, { status: 429 });
    }

    // Build immutable snapshot (randomize if needed)
    let examQuestions = [...exam.questions];
    if (exam.randomizeQuestions) {
      examQuestions = examQuestions.sort(() => Math.random() - 0.5);
    }

    const snapshot = examQuestions.map((eq, idx) => {
      const q = eq.question;
      let options = q.options.map(o => ({
        id: o.id, label: o.label, content: o.content, order: o.order,
      }));
      if (exam.randomizeOptions && options.length > 0) {
        options = options.sort(() => Math.random() - 0.5).map((o, i) => ({
          ...o, label: String.fromCharCode(65 + i), // A, B, C, D
        }));
      }
      return {
        order: idx + 1,
        examQuestionId: eq.id,
        questionId: q.id,
        type: q.type,
        content: q.content,
        points: eq.points,
        options,
      };
    });

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "";
    const now = new Date();
    const expiresAt = new Date(now.getTime() + exam.durationMinutes * 60 * 1000);

    const attempt = await prisma.examAttempt.create({
      data: {
        examId: exam.id,
        studentId: session?.userId || null,
        studentName,
        studentCode: studentCode || null,
        startedAt: now,
        expiresAt,
        snapshot: JSON.stringify(snapshot),
        ipAddress: ip.substring(0, 45),
        userAgent: userAgent.substring(0, 500),
        status: "IN_PROGRESS",
      },
    });

    return NextResponse.json({
      attemptId: attempt.id,
      examId: exam.id,
      title: exam.title,
      durationMinutes: exam.durationMinutes,
      startedAt: attempt.startedAt,
      expiresAt: attempt.expiresAt,
      antiCheatLevel: exam.antiCheatLevel,
      snapshot,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("POST /api/exam-session error:", error);
    return NextResponse.json({ error: "Lỗi bắt đầu bài thi" }, { status: 500 });
  }
}
