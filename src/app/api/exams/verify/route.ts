import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint to verify an exam code (used by join page)
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
        teacher: { select: { fullName: true } },
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
      durationMinutes: exam.durationMinutes,
      questionCount: exam._count.questions,
      teacherName: exam.teacher.fullName,
      requireLogin: exam.requireLogin,
      antiCheatLevel: exam.antiCheatLevel,
      maxAttempts: exam.maxAttempts,
    });
  } catch (error) {
    console.error("GET /api/exams/verify error:", error);
    return NextResponse.json({ error: "Lỗi kiểm tra đề thi" }, { status: 500 });
  }
}
