import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentUser();
  if (!session || (session.user.role !== "TEACHER" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Không có quyền thực hiện" }, { status: 403 });
  }

  const { id: classId } = await params;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Vui lòng chọn file Excel hoặc CSV" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

    if (rawRows.length === 0) {
      return NextResponse.json({ error: "File Excel rỗng, không có dữ liệu" }, { status: 400 });
    }

    const defaultPasswordHash = await hashPassword("123456");
    let importedCount = 0;

    for (const row of rawRows) {
      // Flexible column header matching
      const fullName = (
        row["Họ và tên"] ||
        row["Họ tên"] ||
        row["Họ và Tên"] ||
        row["FullName"] ||
        row["Name"] ||
        row["hoten"] ||
        ""
      )?.toString().trim();

      if (!fullName) continue;

      const studentCode = (
        row["Mã học sinh"] ||
        row["Mã HS"] ||
        row["SBD"] ||
        row["Số báo danh"] ||
        row["Code"] ||
        ""
      )?.toString().trim() || null;

      const phone = (
        row["Số điện thoại"] ||
        row["SĐT"] ||
        row["Phone"] ||
        ""
      )?.toString().trim() || null;

      const rawEmail = (
        row["Email"] ||
        row["email"] ||
        ""
      )?.toString().trim();

      const email =
        rawEmail && rawEmail.includes("@")
          ? rawEmail
          : `hs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}@school.local`;

      // Find or create student
      let student = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            ...(phone ? [{ phone }] : []),
          ],
        },
      });

      if (!student) {
        student = await prisma.user.create({
          data: {
            fullName,
            email,
            phone,
            role: "STUDENT",
            passwordHash: defaultPasswordHash,
          },
        });
      }

      // Add to class if not yet enrolled
      const existing = await prisma.classMember.findUnique({
        where: {
          classId_studentId: { classId, studentId: student.id },
        },
      });

      if (!existing) {
        await prisma.classMember.create({
          data: {
            classId,
            studentId: student.id,
            studentCode,
          },
        });
        importedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã nạp thành công ${importedCount} học sinh vào lớp học!`,
      importedCount,
    });
  } catch (error: unknown) {
    console.error("Import excel error:", error);
    return NextResponse.json({ error: "Lỗi xử lý file Excel" }, { status: 500 });
  }
}
