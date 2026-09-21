import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notify";
import { canAssignTasks } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const assignedToId = searchParams.get("assignedToId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");

    const where: any = {};

    // Telecallers and Site Managers see their assigned tasks or tasks they created
    if (user.role === "TELECALLER" || user.role === "SITE_MANAGER") {
      where.OR = [
        { assignedToId: user.id },
        { createdById: user.id },
      ];
    } else if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (category) {
      where.category = category;
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
      include: {
        assignedTo: { select: { id: true, name: true, role: true, email: true } },
        createdBy: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json({ tasks });
  } catch (err) {
    console.error("Error fetching tasks:", err);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canAssignTasks(user.role)) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to create and assign tasks." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, assignedToId, category, priority, dueDate } = body;

    if (!title || !assignedToId) {
      return NextResponse.json(
        { error: "Task title and assigned employee are required." },
        { status: 400 }
      );
    }

    const count = await prisma.task.count();
    const displayId = `KYRA-TSK-${3001 + count}`;

    const task = await prisma.task.create({
      data: {
        displayId,
        title: title.trim(),
        description: description?.trim() || null,
        assignedToId,
        createdById: user.id,
        category: category || "General",
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        status: "TODO",
      },
      include: {
        assignedTo: true,
        createdBy: true,
      },
    });

    // Send in-app notification to assignee
    await createNotification({
      userId: assignedToId,
      type: "TASK_ASSIGNED",
      title: "New Task Assigned",
      message: `Task "${task.title}" has been assigned to you by ${user.name}.`,
      linkUrl: `/tasks`,
    });

    await logAudit({
      userId: user.id,
      action: "TASK_CREATED",
      entityType: "TASK",
      entityId: task.id,
      details: {
        displayId: task.displayId,
        title: task.title,
        assignedTo: assignedToId,
      },
    });

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (err: any) {
    console.error("Error creating task:", err);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
