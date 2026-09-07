import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createClassSchema = z.object({
  name: z.string().min(2, "Tên lớp phải có ít nhất 2 ký tự"),
  subject: z.string().min(1, "Vui lòng chọn hoặc nhập môn học"),
  grade: z.number().int().min(1).max(12),
  schoolYear: z.string().default("2026-2027"),
  description: z.string().optional(),
});

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  try {
    const classes = await prisma.class.findMany({
      where: { teacherId: session.userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { members: true, assignments: true, examAssignments: true },
        },
      },
    });

    return NextResponse.json(
      classes.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        subject: c.subject,
        grade: c.grade,
        schoolYear: c.schoolYear,
        description: c.description,
        studentsCount: c._count.members,
        assignmentsCount: c._count.assignments,
        examsCount: c._count.examAssignments,
        createdAt: c.createdAt,
      }))
    );
  } catch (error: unknown) {
    console.error("GET /api/classes error:", error);
    return NextResponse.json({ error: "Lỗi lấy danh sách lớp" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getCurrentUser();
  if (!session || (session.user.role !== "TEACHER" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Không có quyền thực hiện" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validated = createClassSchema.parse(body);

    // Generate unique class code (e.g. 12A1-ABCD)
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const cleanName = validated.name.replace(/\s+/g, "").substring(0, 5).toUpperCase();
    const code = `CLS-${cleanName}-${randomSuffix}`;

    const newClass = await prisma.class.create({
      data: {
        name: validated.name,
        code,
        subject: validated.subject,
        grade: validated.grade,
        schoolYear: validated.schoolYear,
        description: validated.description || null,
        teacherId: session.userId,
      },
    });

    return NextResponse.json({ success: true, class: newClass });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("POST /api/classes error:", error);
    return NextResponse.json({ error: "Lỗi tạo lớp học mới" }, { status: 500 });
  }
}
