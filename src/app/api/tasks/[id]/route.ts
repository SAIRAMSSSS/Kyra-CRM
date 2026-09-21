import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notify";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    const existingTask = await prisma.task.findFirst({
      where: { OR: [{ id }, { displayId: id }] },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Authorization: Assigned user, creator, or manager
    const isAssignee = existingTask.assignedToId === user.id;
    const isCreator = existingTask.createdById === user.id;
    const isManager = ["GENERAL_MANAGER", "DIGITAL_HEAD", "CRM_EXECUTIVE"].includes(user.role);

    if (!isAssignee && !isCreator && !isManager) {
      return NextResponse.json(
        { error: "Forbidden: You cannot modify this task." },
        { status: 403 }
      );
    }

    const { status, completionNotes, priority, dueDate, assignedToId, description } = body;
    const updateData: any = {};

    if (status !== undefined) updateData.status = status;
    if (completionNotes !== undefined) updateData.completionNotes = completionNotes;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (description !== undefined) updateData.description = description;

    // If reassigning
    if (assignedToId && assignedToId !== existingTask.assignedToId) {
      if (!isManager) {
        return NextResponse.json(
          { error: "Only managers can reassign tasks." },
          { status: 403 }
        );
      }
      updateData.assignedToId = assignedToId;
      await createNotification({
        userId: assignedToId,
        type: "TASK_ASSIGNED",
        title: "Task Reassigned To You",
        message: `Task "${existingTask.title}" has been reassigned to you.`,
        linkUrl: `/tasks`,
      });
    }

    const updatedTask = await prisma.task.update({
      where: { id: existingTask.id },
      data: updateData,
      include: {
        assignedTo: true,
        createdBy: true,
      },
    });

    await logAudit({
      userId: user.id,
      action: "TASK_UPDATED",
      entityType: "TASK",
      entityId: updatedTask.id,
      details: {
        displayId: updatedTask.displayId,
        newStatus: updatedTask.status,
        completionNotes: updatedTask.completionNotes,
      },
    });

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (err: any) {
    console.error("Error updating task:", err);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
