import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

const addStudentSchema = z.object({
  fullName: z.string().min(2, "Vui lòng nhập họ tên học sinh"),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  phone: z.string().optional(),
  studentCode: z.string().optional(),
});

const updateStatusSchema = z.object({
  memberId: z.string(),
  status: z.enum(["ACTIVE", "SUSPENDED", "PENDING"]),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const { id: classId } = await params;

  try {
    const classRecord = await prisma.class.findFirst({ where: { id: classId, teacherId: session.userId } });
    if (!classRecord) return NextResponse.json({ error: "Không tìm thấy lớp học" }, { status: 404 });
    const members = await prisma.classMember.findMany({
      where: { classId },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    return NextResponse.json(
      members.map((m) => ({
        id: m.id,
        memberId: m.id,
        studentId: m.student.id,
        studentCode: m.studentCode,
        status: m.status,
        joinedAt: m.joinedAt,
        user: m.student,
      }))
    );
  } catch (error) {
    console.error("GET /api/classes/[id]/students error:", error);
    return NextResponse.json({ error: "Lỗi lấy danh sách học sinh" }, { status: 500 });
  }
}

// POST: Add new student directly to class (by teacher)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthUserFromRequest(request);
  if (!session || (session.role !== "TEACHER" && session.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Không có quyền thực hiện" }, { status: 403 });
  }

  const { id: classId } = await params;

  try {
    const body = await request.json();
    const validated = addStudentSchema.parse(body);

    const classRecord = await prisma.class.findFirst({
      where: { id: classId, teacherId: session.userId },
    });
    if (!classRecord) {
      return NextResponse.json({ error: "Lớp học không tồn tại hoặc không thuộc quyền quản lý" }, { status: 404 });
    }

    const email =
      validated.email && validated.email.length > 0
        ? validated.email
        : `hs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}@school.local`;

    let student = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(validated.phone ? [{ phone: validated.phone }] : []),
        ],
      },
    });

    if (!student) {
      const defaultPasswordHash = await hashPassword("123456");
      student = await prisma.user.create({
        data: {
          fullName: validated.fullName,
          email,
          phone: validated.phone || null,
          role: "STUDENT",
          passwordHash: defaultPasswordHash,
        },
      });
    }

    const existingMembership = await prisma.classMember.findUnique({
      where: {
        classId_studentId: { classId, studentId: student.id },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "Học sinh này đã có trong danh sách lớp" },
        { status: 400 }
      );
    }

    const membership = await prisma.classMember.create({
      data: {
        classId,
        studentId: student.id,
        studentCode: validated.studentCode || null,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        fullName: student.fullName,
        email: student.email,
        phone: student.phone,
        studentCode: membership.studentCode,
        status: membership.status,
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Add student error:", error);
    return NextResponse.json({ error: "Lỗi thêm học sinh vào lớp" }, { status: 500 });
  }
}

// PATCH: Approve / reject / change status of a student in class
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthUserFromRequest(request);
  if (!session || (session.role !== "TEACHER" && session.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Không có quyền thực hiện" }, { status: 403 });
  }

  const { id: classId } = await params;

  try {
    const body = await request.json();
    const { memberId, status } = updateStatusSchema.parse(body);

    const updated = await prisma.classMember.update({
      where: { id: memberId, classId },
      data: { status },
    });

    return NextResponse.json({ success: true, member: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("PATCH /api/classes/[id]/students error:", error);
    return NextResponse.json({ error: "Lỗi cập nhật trạng thái học sinh" }, { status: 500 });
  }
}

// DELETE: Remove student from class
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthUserFromRequest(request);
  if (!session || (session.role !== "TEACHER" && session.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Không có quyền thực hiện" }, { status: 403 });
  }

  const { id: classId } = await params;

  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");
    if (!memberId) {
      return NextResponse.json({ error: "Thiếu mã thành viên cần xoá" }, { status: 400 });
    }

    await prisma.classMember.delete({
      where: { id: memberId, classId },
    });

    return NextResponse.json({ success: true, message: "Đã xóa học sinh khỏi lớp" });
  } catch (error) {
    console.error("DELETE /api/classes/[id]/students error:", error);
    return NextResponse.json({ error: "Lỗi xóa học sinh khỏi lớp" }, { status: 500 });
  }
}
