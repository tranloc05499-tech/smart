import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const optionSchema = z.object({
  label: z.string(),
  content: z.string(),
  isCorrect: z.boolean().default(false),
  order: z.number().int().optional(),
});

const questionInputSchema = z.object({
  bankId: z.string().nullable().optional(),
  type: z.string().default("single_choice"),
  content: z.string().min(1, "Nội dung câu hỏi không được để trống"),
  correctAnswer: z.string().nullable().optional(),
  explanation: z.string().nullable().optional(),
  points: z.number().min(0.1).default(1.0),
  subject: z.string().default("Toán học"),
  grade: z.number().int().min(1).max(12).default(12),
  difficulty: z.string().default("MEDIUM"),
  options: z.array(optionSchema).optional(),
});

export async function GET(request: NextRequest) {
  const session = await getAuthUserFromRequest(request);
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const bankId = searchParams.get("bankId");
    const type = searchParams.get("type");
    const subject = searchParams.get("subject");
    const difficulty = searchParams.get("difficulty");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = { createdById: session.userId };
    if (bankId) where.bankId = bankId;
    if (type && type !== "ALL") where.type = type;
    if (subject && subject !== "ALL") where.subject = subject;
    if (difficulty && difficulty !== "ALL") where.difficulty = difficulty;
    if (search) where.content = { contains: search };

    const questions = await prisma.question.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        options: { orderBy: { order: "asc" } },
        bank: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error("GET /api/questions error:", error);
    return NextResponse.json({ error: "Lỗi lấy danh sách câu hỏi" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAuthUserFromRequest(request);
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  try {
    const body = await request.json();
    const validated = questionInputSchema.parse(body);

    const question = await prisma.question.create({
      data: {
        content: validated.content,
        type: validated.type,
        points: validated.points,
        subject: validated.subject,
        grade: validated.grade,
        difficulty: validated.difficulty,
        explanation: validated.explanation || null,
        correctAnswer: validated.correctAnswer || null,
        bankId: validated.bankId || null,
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
      include: {
        options: { orderBy: { order: "asc" } },
        bank: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({ success: true, question }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("POST /api/questions error:", error);
    return NextResponse.json({ error: "Lỗi tạo câu hỏi" }, { status: 500 });
  }
}
