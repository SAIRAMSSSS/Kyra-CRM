import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { AuthUser, UserRole } from "./rbac";

const JWT_SECRET = process.env.JWT_SECRET || "kyra-enterprise-crm-super-secure-jwt-secret-key-production-2026";
const COOKIE_NAME = "kyra_session";

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload || !payload.userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { profile: true },
    });

    if (!user || user.status !== "ACTIVE") {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      status: user.status,
      employeeCode: user.profile?.employeeCode,
      department: user.profile?.department,
      designation: user.profile?.designation,
    };
  } catch (err) {
    console.error("Failed to retrieve session user:", err);
    return null;
  }
}

export const AUTH_COOKIE = COOKIE_NAME;
