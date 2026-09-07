import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const classDetail = await prisma.class.findUnique({
      where: { id, teacherId: session.userId },
      include: {
        teacher: { select: { fullName: true, email: true } },
        members: {
          include: {
            student: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                examAttempts: {
                  where: { status: "GRADED" },
                  select: { score: true },
                },
                submissions: {
                  select: { id: true },
                },
              },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        assignments: {
          orderBy: { createdAt: "desc" },
          include: {
            _count: { select: { submissions: true } },
          },
        },
        examAssignments: {
          include: {
            exam: {
              select: {
                id: true,
                code: true,
                title: true,
                durationMinutes: true,
                status: true,
                _count: { select: { attempts: true } },
              },
            },
          },
        },
      },
    });

    if (!classDetail) {
      return NextResponse.json({ error: "Không tìm thấy lớp học" }, { status: 404 });
    }

    // Format students with calculated average score
    const students = classDetail.members.map((m, index) => {
      const scores = m.student.examAttempts
        .map((a) => a.score)
        .filter((s): s is number => s !== null);
      const avgScore =
        scores.length > 0
          ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1))
          : null;

      return {
        stt: index + 1,
        memberId: m.id,
        studentId: m.student.id,
        fullName: m.student.fullName,
        studentCode: m.studentCode || `HS${String(index + 1).padStart(3, "0")}`,
        email: m.student.email,
        phone: m.student.phone,
        status: m.status,
        submissionsCount: m.student.submissions.length,
        averageScore: avgScore,
        joinedAt: m.joinedAt,
      };
    });

    return NextResponse.json({
      id: classDetail.id,
      name: classDetail.name,
      code: classDetail.code,
      subject: classDetail.subject,
      grade: classDetail.grade,
      schoolYear: classDetail.schoolYear,
      description: classDetail.description,
      teacherName: classDetail.teacher.fullName,
      students,
      assignments: classDetail.assignments.map((a) => ({
        id: a.id,
        title: a.title,
        deadline: a.deadline,
        submittedCount: a._count.submissions,
        totalStudents: students.length,
      })),
      exams: classDetail.examAssignments.map((ea) => ({
        id: ea.exam.id,
        code: ea.exam.code,
        title: ea.exam.title,
        durationMinutes: ea.exam.durationMinutes,
        status: ea.exam.status,
        attemptsCount: ea.exam._count.attempts,
      })),
    });
  } catch (error: unknown) {
    console.error("GET /api/classes/[id] error:", error);
    return NextResponse.json({ error: "Lỗi lấy chi tiết lớp học" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentUser();
  if (!session || (session.user.role !== "TEACHER" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Không có quyền thực hiện" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const classRecord = await prisma.class.findFirst({ where: { id, teacherId: session.userId } });
    if (!classRecord && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Không có quyền xoá lớp học này" }, { status: 403 });
    }
    await prisma.class.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Đã xóa lớp học thành công" });
  } catch (error: unknown) {
    console.error("DELETE /api/classes/[id] error:", error);
    return NextResponse.json({ error: "Lỗi xóa lớp học" }, { status: 500 });
  }
}
