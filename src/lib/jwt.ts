import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "edutech-super-secret-jwt-key-azota-2026";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "edutech-super-refresh-secret-jwt-key-2026";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  fullName: string;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "30d" });
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}
