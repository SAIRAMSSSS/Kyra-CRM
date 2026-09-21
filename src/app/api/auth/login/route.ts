import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, signToken, AUTH_COOKIE } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { UserRole } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const trimmedEmail = String(email).trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (user.status === "INACTIVE" || user.status === "SUSPENDED") {
      return NextResponse.json(
        { error: `Account is ${user.status.toLowerCase()}. Please contact the administrator.` },
        { status: 403 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Update lastLogin
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Create JWT
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    // Audit log
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    await logAudit({
      userId: user.id,
      action: "LOGIN",
      entityType: "USER",
      entityId: user.id,
      details: { email: user.email, role: user.role },
      ipAddress: ip,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        employeeCode: user.profile?.employeeCode,
        department: user.profile?.department,
        designation: user.profile?.designation,
      },
    });

    // Set secure cookie
    response.cookies.set({
      name: AUTH_COOKIE,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (err: unknown) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Internal server error during authentication" },
      { status: 500 }
    );
  }
}
