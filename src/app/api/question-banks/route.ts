import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bankSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  subject: z.string().min(1),
  grade: z.number().int().min(1).max(12),
});

export async function GET(request: NextRequest) {
  const session = await getAuthUserFromRequest(request);
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  try {
    const banks = await prisma.questionBank.findMany({
      where: { teacherId: session.userId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { questions: true } } },
    });
    return NextResponse.json(banks.map(b => ({
      id: b.id, title: b.title, description: b.description,
      subject: b.subject, grade: b.grade,
      questionsCount: b._count.questions,
      createdAt: b.createdAt,
    })));
  } catch (error) {
    console.error("GET /api/question-banks error:", error);
    return NextResponse.json({ error: "Lỗi lấy ngân hàng câu hỏi" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAuthUserFromRequest(request);
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  try {
    const body = await request.json();
    const validated = bankSchema.parse(body);
    const bank = await prisma.questionBank.create({
      data: { ...validated, teacherId: session.userId },
    });
    return NextResponse.json({ success: true, bank }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("POST /api/question-banks error:", error);
    return NextResponse.json({ error: "Lỗi tạo ngân hàng câu hỏi" }, { status: 500 });
  }
}
