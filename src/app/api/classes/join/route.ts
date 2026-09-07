import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const joinSchema = z.object({
  code: z.string().min(1, "Vui lòng nhập mã lớp học"),
  studentCode: z.string().optional(),
});

// POST: Student joins a class via Class Code (e.g. 11B1-LY or CLS-...)
export async function POST(request: NextRequest) {
  const session = await getAuthUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { code, studentCode } = joinSchema.parse(body);

    const classRecord = await prisma.class.findUnique({
      where: { code: code.trim().toUpperCase() },
      include: {
        teacher: { select: { fullName: true } },
      },
    });

    if (!classRecord) {
      return NextResponse.json({ error: "Không tìm thấy lớp học với mã này" }, { status: 404 });
    }

    // Check if membership exists
    const existing = await prisma.classMember.findUnique({
      where: {
        classId_studentId: {
          classId: classRecord.id,
          studentId: session.userId,
        },
      },
    });

    if (existing) {
      if (existing.status === "ACTIVE") {
        return NextResponse.json({
          message: "Bạn đã tham gia lớp học này rồi",
          class: classRecord,
          status: "ACTIVE",
        });
      }
      if (existing.status === "PENDING") {
        return NextResponse.json({
          message: "Yêu cầu tham gia lớp đang chờ giáo viên phê duyệt",
          status: "PENDING",
        });
      }
    }

    // Create new membership with PENDING status (requires teacher approval)
    const membership = await prisma.classMember.create({
      data: {
        classId: classRecord.id,
        studentId: session.userId,
        studentCode: studentCode || null,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Đã gửi yêu cầu vào lớp "${classRecord.name}" của GV ${classRecord.teacher.fullName}. Đang chờ duyệt!`,
      membership,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("POST /api/classes/join error:", error);
    return NextResponse.json({ error: "Lỗi tham gia lớp học" }, { status: 500 });
  }
}
