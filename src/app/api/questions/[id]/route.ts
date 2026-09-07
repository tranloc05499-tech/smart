import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAuthUserFromRequest(request);
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  try {
    const question = await prisma.question.findFirst({
      where: { id, createdById: session.userId },
      include: { options: { orderBy: { order: "asc" } }, bank: true },
    });
    if (!question) return NextResponse.json({ error: "Không tìm thấy câu hỏi" }, { status: 404 });
    return NextResponse.json({ question });
  } catch (error) {
    console.error("GET /api/questions/[id] error:", error);
    return NextResponse.json({ error: "Lỗi lấy câu hỏi" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAuthUserFromRequest(request);
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  try {
    const question = await prisma.question.findFirst({ where: { id, createdById: session.userId } });
    if (!question) return NextResponse.json({ error: "Không tìm thấy câu hỏi" }, { status: 404 });

    const body = await request.json();
    const { options, ...rest } = body;

    const updated = await prisma.question.update({
      where: { id },
      data: rest,
    });

    // If options provided, replace all
    if (options && Array.isArray(options)) {
      await prisma.questionOption.deleteMany({ where: { questionId: id } });
      await prisma.questionOption.createMany({
        data: options.map((o: { label: string; content: string; isCorrect: boolean; order: number }) => ({
          questionId: id,
          label: o.label,
          content: o.content,
          isCorrect: o.isCorrect,
          order: o.order,
        })),
      });
    }

    const final = await prisma.question.findUnique({
      where: { id },
      include: { options: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json({ success: true, question: final });
  } catch (error) {
    console.error("PATCH /api/questions/[id] error:", error);
    return NextResponse.json({ error: "Lỗi cập nhật câu hỏi" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAuthUserFromRequest(request);
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  try {
    const question = await prisma.question.findFirst({ where: { id, createdById: session.userId } });
    if (!question) return NextResponse.json({ error: "Không tìm thấy câu hỏi" }, { status: 404 });

    await prisma.question.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/questions/[id] error:", error);
    return NextResponse.json({ error: "Lỗi xoá câu hỏi" }, { status: 500 });
  }
}
