import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const submitAssignmentSchema = z.object({
  assignmentId: z.string().min(1, "Thiếu mã bài tập"),
  textContent: z.string().optional(),
  fileUrls: z.array(z.string()).optional(),
});

// POST: Student submits an assignment (homework)
export async function POST(request: NextRequest) {
  const session = await getAuthUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { assignmentId, textContent, fileUrls } = submitAssignmentSchema.parse(body);

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { class: true },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Bài tập không tồn tại" }, { status: 404 });
    }

    // Check if student belongs to class
    const membership = await prisma.classMember.findFirst({
      where: {
        classId: assignment.classId,
        studentId: session.userId,
        status: "ACTIVE",
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Bạn chưa là thành viên chính thức của lớp học này" }, { status: 403 });
    }

    // Check deadline
    const now = new Date();
    if (assignment.deadline && now > assignment.deadline && !assignment.allowLateSubmission) {
      return NextResponse.json({ error: "Bài tập đã hết hạn nộp và không cho phép nộp muộn" }, { status: 400 });
    }

    // Find existing submission
    let submission = await prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId,
        studentId: session.userId,
      },
      include: { versions: { orderBy: { version: "desc" }, take: 1 } },
    });

    const nextVersion = submission && submission.versions[0] ? submission.versions[0].version + 1 : 1;

    if (submission && nextVersion > assignment.maxAttempts) {
      return NextResponse.json({ error: "Bạn đã sử dụng hết số lần nộp bài cho bài tập này" }, { status: 429 });
    }

    if (!submission) {
      submission = await prisma.assignmentSubmission.create({
        data: {
          assignmentId,
          studentId: session.userId,
          status: "SUBMITTED",
          currentVersion: 1,
        },
        include: { versions: true },
      });
    } else {
      submission = await prisma.assignmentSubmission.update({
        where: { id: submission.id },
        data: { status: "SUBMITTED", currentVersion: nextVersion },
        include: { versions: true },
      });
    }

    // Create SubmissionVersion
    const version = await prisma.submissionVersion.create({
      data: {
        submissionId: submission.id,
        version: nextVersion,
        submittedAt: now,
        textContent: textContent || "",
        files: fileUrls ? JSON.stringify(fileUrls) : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Nộp bài tập thành công!",
      version,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("POST /api/assignments/submit error:", error);
    return NextResponse.json({ error: "Lỗi nộp bài tập" }, { status: 500 });
  }
}

const gradeSchema = z.object({
  submissionId: z.string().min(1),
  versionId: z.string().min(1),
  score: z.number().min(0).max(10).nullable(),
  feedback: z.string().nullable().optional(),
  status: z.enum(["GRADED", "RETURNED"]).default("GRADED"),
});

// PATCH: Teacher grades a submission version
export async function PATCH(request: NextRequest) {
  const session = await getAuthUserFromRequest(request);
  if (!session || (session.role !== "TEACHER" && session.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Không có quyền chấm bài" }, { status: 403 });
  }

  try {
    const body = gradeSchema.parse(await request.json());
    const version = await prisma.submissionVersion.findFirst({
      where: {
        id: body.versionId,
        submissionId: body.submissionId,
        submission: { assignment: { teacherId: session.userId } },
      },
      include: { submission: true },
    });

    if (!version) return NextResponse.json({ error: "Không tìm thấy bài nộp" }, { status: 404 });

    const [updatedVersion] = await prisma.$transaction([
      prisma.submissionVersion.update({
        where: { id: version.id },
        data: {
          score: body.score,
          feedback: body.feedback || null,
          gradedAt: new Date(),
          gradedById: session.userId,
        },
      }),
      prisma.assignmentSubmission.update({
        where: { id: body.submissionId },
        data: { status: body.status },
      }),
    ]);

    return NextResponse.json({ success: true, version: updatedVersion });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("PATCH /api/assignments/submit error:", error);
    return NextResponse.json({ error: "Lỗi chấm bài" }, { status: 500 });
  }
}
