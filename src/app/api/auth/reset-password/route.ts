import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hashPassword, comparePassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { canManageEmployees } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId, currentPassword, newPassword } = await req.json();

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Case 1: Admin resetting another user's password
    if (targetUserId && targetUserId !== currentUser.id) {
      if (!canManageEmployees(currentUser.role)) {
        return NextResponse.json(
          { error: "Forbidden: Only General Manager can reset employee passwords" },
          { status: 403 }
        );
      }

      const newHash = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: targetUserId },
        data: { passwordHash: newHash },
      });

      await logAudit({
        userId: currentUser.id,
        action: "PASSWORD_RESET_ADMIN",
        entityType: "USER",
        entityId: targetUserId,
        details: { resetBy: currentUser.email },
      });

      return NextResponse.json({ success: true, message: "Password updated successfully" });
    }

    // Case 2: User updating their own password
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!currentPassword) {
      return NextResponse.json(
        { error: "Current password is required to change password" },
        { status: 400 }
      );
    }

    const isValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: currentUser.id },
      data: { passwordHash: newHash },
    });

    await logAudit({
      userId: currentUser.id,
      action: "PASSWORD_CHANGED_SELF",
      entityType: "USER",
      entityId: currentUser.id,
    });

    return NextResponse.json({ success: true, message: "Password changed successfully" });
  } catch (err: unknown) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
