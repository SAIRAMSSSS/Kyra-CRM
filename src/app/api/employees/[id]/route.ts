import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { canManageEmployees } from "@/lib/rbac";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManageEmployees(user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Only General Manager can modify employee accounts." },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();

    const {
      name,
      role,
      status,
      password,
      department,
      designation,
      phone,
    } = body;

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    if (password && password.length >= 8) {
      updateData.passwordHash = await hashPassword(password);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...updateData,
        profile: {
          upsert: {
            create: {
              employeeCode: `KYRA-EMP-${Math.floor(100 + Math.random() * 900)}`,
              department: department || "Operations",
              designation: designation || (role ? role.replace(/_/g, " ") : "Employee"),
              phone: phone || null,
              status: status || "Active",
            },
            update: {
              department: department !== undefined ? department : undefined,
              designation: designation !== undefined ? designation : undefined,
              phone: phone !== undefined ? phone : undefined,
              status: status !== undefined ? status : undefined,
            },
          },
        },
      },
      include: { profile: true },
    });

    await logAudit({
      userId: user.id,
      action: "EMPLOYEE_UPDATED",
      entityType: "USER",
      entityId: updatedUser.id,
      details: {
        updatedUserId: updatedUser.id,
        role: updatedUser.role,
        status: updatedUser.status,
        passwordReset: Boolean(password),
      },
    });

    return NextResponse.json({
      success: true,
      employee: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        profile: updatedUser.profile,
      },
    });
  } catch (err: any) {
    console.error("Error updating employee:", err);
    return NextResponse.json({ error: "Failed to update employee account" }, { status: 500 });
  }
}
