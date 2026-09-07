import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  // Teacher or Admin access
  const teacherId = session.userId;

  try {
    // 1. Classes count & students count
    const classes = await prisma.class.findMany({
      where: { teacherId },
      include: {
        _count: {
          select: { members: true, assignments: true, examAssignments: true },
        },
      },
    });

    const totalClasses = classes.length;
    const totalStudents = classes.reduce((sum, c) => sum + c._count.members, 0);

    // 2. Exams count
    const totalExams = await prisma.exam.count({
      where: { teacherId },
    });

    // 3. Questions count
    const totalQuestions = await prisma.question.count({
      where: { createdById: teacherId },
    });

    // 4. Active assignments with submission rates
    const activeAssignments = await prisma.assignment.findMany({
      where: { teacherId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        class: {
          select: {
            name: true,
            _count: { select: { members: true } },
          },
        },
        _count: {
          select: { submissions: true },
        },
      },
    });

    const formattedAssignments = activeAssignments.map((a) => ({
      id: a.id,
      title: a.title,
      className: a.class.name,
      submittedCount: a._count.submissions,
      totalStudents: a.class._count.members,
      deadline: a.deadline,
    }));

    // 5. Recent exams with average score from attempts
    const recentExams = await prisma.exam.findMany({
      where: { teacherId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        attempts: {
          where: { status: "GRADED" },
          select: { score: true },
        },
        _count: {
          select: { attempts: true },
        },
      },
    });

    const formattedExams = recentExams.map((e) => {
      const validScores = e.attempts.map((att) => att.score).filter((s): s is number => s !== null);
      const avgScore = validScores.length > 0
        ? validScores.reduce((a, b) => a + b, 0) / validScores.length
        : null;

      return {
        id: e.id,
        code: e.code,
        title: e.title,
        durationMinutes: e.durationMinutes,
        status: e.status,
        attemptsCount: e._count.attempts,
        averageScore: avgScore !== null ? Number(avgScore.toFixed(1)) : null,
        createdAt: e.createdAt,
      };
    });

    return NextResponse.json({
      teacherName: session.user.fullName,
      stats: {
        totalClasses,
        totalStudents,
        totalExams,
        totalQuestions,
      },
      activeAssignments: formattedAssignments,
      recentExams: formattedExams,
      classes: classes.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        subject: c.subject,
        grade: c.grade,
        studentsCount: c._count.members,
        assignmentsCount: c._count.assignments,
      })),
    });
  } catch (error) {
    console.error("Teacher dashboard API error:", error);
    return NextResponse.json({ error: "Lỗi khi lấy dữ liệu bảng điều khiển" }, { status: 500 });
  }
}
