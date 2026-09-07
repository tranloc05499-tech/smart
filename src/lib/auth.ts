import { cookies } from "next/headers";
import { verifyAccessToken, TokenPayload } from "./jwt";
import { prisma } from "./prisma";

export interface AuthUserRecord {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  avatar: string | null;
  isActive: boolean;
}

export async function getCurrentUser(): Promise<(TokenPayload & { user: AuthUserRecord }) | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;

    const payload = verifyAccessToken(token);
    if (!payload) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        avatar: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) return null;

    return {
      ...payload,
      user,
    };
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest === "DYNAMIC_SERVER_USAGE") {
      throw error;
    }
    console.error("getCurrentUser error:", error);
    return null;
  }
}

export async function getAuthUserFromRequest(request: Request): Promise<TokenPayload | null> {
  // 1. Check Authorization Bearer header
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    if (payload) return payload;
  }

  // 2. Check Cookie header
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/auth_token=([^;]+)/);
  if (match && match[1]) {
    const token = match[1];
    return verifyAccessToken(token);
  }

  return null;
}
