import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAuthUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: session.user,
  });
}

const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(120),
  phone: z.string().max(30).optional().or(z.literal("")),
});

export async function PATCH(request: Request) {
  const session = await getAuthUserFromRequest(request);
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  try {
    const body = updateProfileSchema.parse(await request.json());
    const user = await prisma.user.update({
      where: { id: session.userId },
      data: { fullName: body.fullName.trim(), phone: body.phone?.trim() || null },
      select: { id: true, fullName: true, email: true, phone: true, role: true, avatar: true },
    });
    return NextResponse.json({ success: true, user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Không thể cập nhật hồ sơ" }, { status: 500 });
  }
}
