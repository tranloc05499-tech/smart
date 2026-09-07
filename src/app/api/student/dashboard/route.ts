import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const studentId = session.userId;

  try {
    // 1. Enrolled classes (only ACTIVE memberships)
    const classMemberships = await prisma.classMember.findMany({
      where: { studentId, status: "ACTIVE" },
      include: {
        class: {
          include: {
            teacher: { select: { fullName: true } },
          },
        },
      },
    });

    const enrolledClasses = classMemberships.map((m) => ({
      id: m.class.id,
      name: m.class.name,
      code: m.class.code,
      subject: m.class.subject,
      grade: m.class.grade,
      teacherName: m.class.teacher.fullName,
      studentCode: m.studentCode,
    }));

    const classIds = enrolledClasses.map((c) => c.id);

    // 2. Assigned Exams for enrolled classes
    const assignedExams = await prisma.exam.findMany({
      where: {
        status: "PUBLISHED",
        classAssignments: {
          some: { classId: { in: classIds } },
        },
      },
      include: {
        teacher: { select: { fullName: true } },
        attempts: {
          where: { studentId },
          select: { id: true, status: true, score: true, submittedAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedExams = assignedExams.map((e) => {
      const myAttempt = e.attempts[0] || null;
      return {
        id: e.id,
        code: e.code,
        title: e.title,
        description: e.description,
        durationMinutes: e.durationMinutes,
        teacherName: e.teacher.fullName,
        isCompleted: myAttempt ? myAttempt.status === "GRADED" || myAttempt.status === "SUBMITTED" : false,
        myScore: myAttempt?.score ?? null,
        attemptId: myAttempt?.id ?? null,
      };
    });

    // 3. Pending & Active Assignments
    const assignments = await prisma.assignment.findMany({
      where: {
        classId: { in: classIds },
      },
      include: {
        class: { select: { name: true } },
        submissions: {
          where: { studentId },
          include: {
            versions: {
              orderBy: { version: "desc" },
              take: 1,
            },
          },
        },
      },
      orderBy: { deadline: "asc" },
    });

    const formattedAssignments = assignments.map((a) => {
      const sub = a.submissions[0];
      const latestVersion = sub?.versions[0];
      return {
        id: a.id,
        title: a.title,
        description: a.description,
        className: a.class.name,
        deadline: a.deadline,
        isSubmitted: !!sub,
        status: sub?.status || "NOT_SUBMITTED",
        score: latestVersion?.score ?? null,
        feedback: latestVersion?.feedback ?? null,
      };
    });

    // 4. Recent completed attempts
    const recentAttempts = await prisma.examAttempt.findMany({
      where: {
        studentId,
        status: { in: ["GRADED", "SUBMITTED"] },
      },
      include: {
        exam: { select: { title: true, code: true } },
      },
      orderBy: { submittedAt: "desc" },
      take: 5,
    });

    const allGradedAttempts = await prisma.examAttempt.findMany({
      where: { studentId, status: { in: ["GRADED", "SUBMITTED"] }, score: { not: null } },
      select: { score: true },
    });

    const scores = allGradedAttempts.map((a) => a.score).filter((s): s is number => s !== null);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

    return NextResponse.json({
      studentName: session.user.fullName,
      stats: {
        enrolledClassesCount: enrolledClasses.length,
        assignedExamsCount: formattedExams.length,
        completedExamsCount: allGradedAttempts.length,
        averageScore: avgScore !== null ? Number(avgScore.toFixed(1)) : null,
      },
      classes: enrolledClasses,
      exams: formattedExams,
      assignments: formattedAssignments,
      recentAttempts: recentAttempts.map((a) => ({
        id: a.id,
        examTitle: a.exam.title,
        examCode: a.exam.code,
        score: a.score,
        totalPoints: a.totalPoints,
        submittedAt: a.submittedAt,
      })),
    });
  } catch (error) {
    console.error("Student dashboard API error:", error);
    return NextResponse.json({ error: "Lỗi khi lấy dữ liệu học sinh" }, { status: 500 });
  }
}
