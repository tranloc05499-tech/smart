import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const assignmentSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống"),
  description: z.string().optional().default(""),
  classId: z.string().min(1, "Vui lòng chọn lớp"),
  dueDate: z.string().optional(),
  deadline: z.string().optional(),
  startDate: z.string().optional(),
  allowLate: z.boolean().optional(),
  allowLateSubmission: z.boolean().optional().default(true),
  maxAttempts: z.number().int().min(1).max(10).default(3),
  showScore: z.boolean().default(true),
  showFeedback: z.boolean().default(true),
  attachments: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const session = await getAuthUserFromRequest(request);
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(50, Number(searchParams.get("limit") || "20"));

    const where: Record<string, unknown> = { teacherId: session.userId };
    if (classId) where.classId = classId;

    const [assignments, total] = await Promise.all([
      prisma.assignment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          class: { select: { id: true, name: true, subject: true, grade: true } },
          _count: { select: { submissions: true } },
        },
      }),
      prisma.assignment.count({ where }),
    ]);

    const formatted = assignments.map(a => ({
      id: a.id,
      title: a.title,
      description: a.description,
      dueDate: a.deadline ? a.deadline.toISOString() : null,
      deadline: a.deadline ? a.deadline.toISOString() : null,
      startDate: a.startDate ? a.startDate.toISOString() : null,
      allowLate: a.allowLateSubmission,
      allowLateSubmission: a.allowLateSubmission,
      status: "PUBLISHED",
      class: {
        id: a.class.id,
        name: a.class.name,
        code: a.class.id.slice(0, 6).toUpperCase(),
        gradeLevel: a.class.grade,
      },
      _count: {
        submissions: a._count.submissions,
      },
      submissionsCount: a._count.submissions,
      createdAt: a.createdAt.toISOString(),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("GET /api/assignments error:", error);
    return NextResponse.json({ error: "Lỗi lấy danh sách bài tập" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAuthUserFromRequest(request);
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  try {
    const body = await request.json();
    const validated = assignmentSchema.parse(body);

    // Verify teacher owns the class
    const cls = await prisma.class.findFirst({
      where: { id: validated.classId, teacherId: session.userId },
    });
    if (!cls) return NextResponse.json({ error: "Lớp không tồn tại hoặc bạn không có quyền" }, { status: 403 });

    const finalDeadline = validated.dueDate || validated.deadline;
    const finalAllowLate = validated.allowLate !== undefined ? validated.allowLate : validated.allowLateSubmission;

    const assignment = await prisma.assignment.create({
      data: {
        title: validated.title,
        description: validated.description || "",
        classId: validated.classId,
        teacherId: session.userId,
        deadline: finalDeadline ? new Date(finalDeadline) : null,
        startDate: validated.startDate ? new Date(validated.startDate) : null,
        allowLateSubmission: finalAllowLate ?? true,
        maxAttempts: validated.maxAttempts,
        showScore: validated.showScore,
        showFeedback: validated.showFeedback,
        attachments: validated.attachments || null,
      },
      include: { class: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ success: true, assignment }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("POST /api/assignments error:", error);
    return NextResponse.json({ error: "Lỗi tạo bài tập" }, { status: 500 });
  }
}
