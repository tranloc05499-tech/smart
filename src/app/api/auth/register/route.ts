import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { signAccessToken } from "@/lib/jwt";

const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Họ tên phải có ít nhất 2 ký tự").max(120, "Họ tên quá dài"),
  email: z.string().trim().email("Email không hợp lệ").transform((value) => value.toLowerCase()),
  phone: z.string().trim().regex(/^[0-9+()\-\s]{8,20}$/, "Số điện thoại không hợp lệ").optional().or(z.literal("")),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  role: z.enum(["TEACHER", "STUDENT"]).default("TEACHER"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = registerSchema.parse(body);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validated.email },
          ...(validated.phone ? [{ phone: validated.phone }] : []),
        ],
      },
    });

    if (existingUser) {
      const duplicateField = existingUser.email === validated.email ? "Email" : "Số điện thoại";
      return NextResponse.json(
        { error: `${duplicateField} đã được đăng ký trong hệ thống` },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(validated.password);

    const newUser = await prisma.user.create({
      data: {
        fullName: validated.fullName,
        email: validated.email,
        phone: validated.phone || null,
        passwordHash,
        role: validated.role,
      },
    });

    const token = signAccessToken({
      userId: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
      },
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Email hoặc số điện thoại vừa được đăng ký bởi tài khoản khác" }, { status: 409 });
    }
    console.error("Register error:", error);
    return NextResponse.json({ error: "Lỗi hệ thống khi đăng ký" }, { status: 500 });
  }
}
