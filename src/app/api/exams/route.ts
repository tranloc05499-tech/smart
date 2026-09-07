import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createExamSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống"),
  description: z.string().optional(),
  durationMinutes: z.number().int().min(5).max(300).default(45),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  maxAttempts: z.number().int().min(1).default(1),
  randomizeQuestions: z.boolean().default(true),
  randomizeOptions: z.boolean().default(true),
  showScore: z.boolean().default(true),
  showAnswers: z.boolean().default(false),
  showExplanation: z.boolean().default(false),
  requireLogin: z.boolean().default(false),
  antiCheatLevel: z.number().int().min(0).max(2).default(1),
  passScore: z.number().min(0).max(100).default(5.0),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]).default("DRAFT"),
});

// Generate unique 6-char uppercase code
async function generateUniqueCode(): Promise<string> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  let attempts = 0;
  while (attempts < 10) {
    code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const existing = await prisma.exam.findUnique({ where: { code } });
    if (!existing) return code;
    attempts++;
  }
  return code + Math.floor(Math.random() * 100);
}

export async function GET(request: NextRequest) {
  const session = await getAuthUserFromRequest(request);
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(50, Number(searchParams.get("limit") || "20"));

    const where: Record<string, unknown> = { teacherId: session.userId };
    if (status && ["DRAFT", "PUBLISHED", "CLOSED"].includes(status)) {
      where.status = status;
    }

    const [exams, total] = await Promise.all([
      prisma.exam.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { questions: true, attempts: true, classAssignments: true } },
        },
      }),
      prisma.exam.count({ where }),
    ]);

    return NextResponse.json({
      data: exams.map(e => ({
        id: e.id, title: e.title, code: e.code, description: e.description,
        durationMinutes: e.durationMinutes, status: e.status,
        startTime: e.startTime, endTime: e.endTime,
        passScore: e.passScore, requireLogin: e.requireLogin,
        randomizeQuestions: e.randomizeQuestions, randomizeOptions: e.randomizeOptions,
        showScore: e.showScore, showAnswers: e.showAnswers,
        antiCheatLevel: e.antiCheatLevel, maxAttempts: e.maxAttempts,
        questionsCount: e._count.questions,
        attemptsCount: e._count.attempts,
        classesCount: e._count.classAssignments,
        createdAt: e.createdAt, updatedAt: e.updatedAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/exams error:", error);
    return NextResponse.json({ error: "Lỗi lấy danh sách đề thi" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAuthUserFromRequest(request);
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  try {
    const body = await request.json();
    const validated = createExamSchema.parse(body);
    const code = await generateUniqueCode();

    const exam = await prisma.exam.create({
      data: {
        title: validated.title,
        description: validated.description || null,
        code,
        durationMinutes: validated.durationMinutes,
        startTime: validated.startTime ? new Date(validated.startTime) : null,
        endTime: validated.endTime ? new Date(validated.endTime) : null,
        maxAttempts: validated.maxAttempts,
        randomizeQuestions: validated.randomizeQuestions,
        randomizeOptions: validated.randomizeOptions,
        showScore: validated.showScore,
        showAnswers: validated.showAnswers,
        showExplanation: validated.showExplanation,
        requireLogin: validated.requireLogin,
        antiCheatLevel: validated.antiCheatLevel,
        passScore: validated.passScore,
        status: validated.status,
        teacherId: session.userId,
      },
    });

    return NextResponse.json({ success: true, exam }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("POST /api/exams error:", error);
    return NextResponse.json({ error: "Lỗi tạo đề thi" }, { status: 500 });
  }
}
