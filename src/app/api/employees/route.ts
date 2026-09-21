import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { canManageEmployees } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check or return callers list if requested
    const { searchParams } = new URL(req.url);
    const roleOnly = searchParams.get("role");

    const where: any = {};
    if (roleOnly) {
      where.role = roleOnly;
    }

    const employees = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        profile: true,
        _count: {
          select: {
            assignedTelecallerLeads: true,
            callReports: true,
            assignedSiteVisits: true,
            tasksAssigned: true,
          },
        },
      },
    });

    return NextResponse.json({ employees });
  } catch (err) {
    console.error("Error fetching employees:", err);
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManageEmployees(user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Only General Manager can create employee accounts." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      email,
      password,
      role,
      department,
      designation,
      employeeCode,
      phone,
    } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Name, email, password, and role are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An employee account with this email already exists." },
        { status: 400 }
      );
    }

    // Auto generate code if not given
    const code = employeeCode || `KYRA-${role.substring(0, 2)}-${Math.floor(100 + Math.random() * 900)}`;

    const passwordHash = await hashPassword(password);

    const newEmployee = await prisma.user.create({
      data: {
        name: name.trim(),
        email: trimmedEmail,
        passwordHash,
        role,
        status: "ACTIVE",
        profile: {
          create: {
            employeeCode: code,
            department: department || "Operations",
            designation: designation || role.replace(/_/g, " "),
            phone: phone || null,
            status: "Active",
          },
        },
      },
      include: { profile: true },
    });

    await logAudit({
      userId: user.id,
      action: "EMPLOYEE_CREATED",
      entityType: "USER",
      entityId: newEmployee.id,
      details: {
        name: newEmployee.name,
        email: newEmployee.email,
        role: newEmployee.role,
        code,
      },
    });

    return NextResponse.json(
      {
        success: true,
        employee: {
          id: newEmployee.id,
          name: newEmployee.name,
          email: newEmployee.email,
          role: newEmployee.role,
          status: newEmployee.status,
          profile: newEmployee.profile,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Error creating employee:", err);
    return NextResponse.json({ error: "Failed to create employee account" }, { status: 500 });
  }
}
