import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notify";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const siteVisit = await prisma.siteVisit.findFirst({
      where: { OR: [{ id }, { displayId: id }] },
      include: {
        customer: true,
        site: true,
        lead: true,
        assignedSiteManager: true,
        createdBy: true,
      },
    });

    if (!siteVisit) {
      return NextResponse.json({ error: "Site visit not found" }, { status: 404 });
    }

    return NextResponse.json({ siteVisit });
  } catch (err) {
    console.error("Error fetching site visit:", err);
    return NextResponse.json({ error: "Failed to fetch site visit" }, { status: 500 });
  }
}

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

    const existingVisit = await prisma.siteVisit.findFirst({
      where: { OR: [{ id }, { displayId: id }] },
      include: { customer: true, lead: true },
    });

    if (!existingVisit) {
      return NextResponse.json({ error: "Site visit not found" }, { status: 404 });
    }

    const {
      status,
      scheduledDate,
      scheduledTime,
      visitRemarks,
      completionNotes,
      cancellationReason,
      assignedSiteManagerId,
      rescheduleReason,
    } = body;

    const updateData: any = {};

    if (visitRemarks !== undefined) updateData.visitRemarks = visitRemarks;
    if (assignedSiteManagerId !== undefined) updateData.assignedSiteManagerId = assignedSiteManagerId;

    // Rescheduling logic
    if (status === "RESCHEDULED" || (scheduledDate && new Date(scheduledDate).getTime() !== existingVisit.scheduledDate.getTime())) {
      updateData.status = "RESCHEDULED";
      if (scheduledDate) updateData.scheduledDate = new Date(scheduledDate);
      if (scheduledTime) updateData.scheduledTime = scheduledTime;

      const history = existingVisit.rescheduleHistory ? JSON.parse(existingVisit.rescheduleHistory) : [];
      history.push({
        previousDate: existingVisit.scheduledDate,
        previousTime: existingVisit.scheduledTime,
        rescheduledAt: new Date(),
        rescheduledBy: user.name,
        reason: rescheduleReason || "Customer schedule adjustment",
      });
      updateData.rescheduleHistory = JSON.stringify(history);

      if (existingVisit.assignedSiteManagerId) {
        await createNotification({
          userId: existingVisit.assignedSiteManagerId,
          type: "SITE_VISIT_RESCHEDULED",
          title: "Site Visit Rescheduled",
          message: `Visit for ${existingVisit.customer.name} moved to ${scheduledDate} at ${scheduledTime}.`,
          linkUrl: `/site-visits`,
        });
      }
    } else if (status) {
      updateData.status = status;
    }

    // Completion logic
    if (status === "COMPLETED") {
      updateData.completionNotes = completionNotes || existingVisit.completionNotes;
      updateData.completedAt = new Date();

      // Mark lead as SITE_VISIT_COMPLETED
      await prisma.lead.update({
        where: { id: existingVisit.leadId },
        data: { lifecycleStatus: "SITE_VISIT_COMPLETED" },
      });
    }

    // Cancellation logic
    if (status === "CANCELLED" || status === "NO_SHOW") {
      updateData.cancellationReason = cancellationReason || existingVisit.cancellationReason;
    }

    const updated = await prisma.siteVisit.update({
      where: { id: existingVisit.id },
      data: updateData,
      include: {
        customer: true,
        site: true,
        assignedSiteManager: true,
      },
    });

    await logAudit({
      userId: user.id,
      action: "SITE_VISIT_UPDATED",
      entityType: "SITE_VISIT",
      entityId: updated.id,
      details: {
        displayId: updated.displayId,
        newStatus: updated.status,
        scheduledDate: updated.scheduledDate,
        remarks: updated.visitRemarks,
      },
    });

    return NextResponse.json({ success: true, siteVisit: updated });
  } catch (err: any) {
    console.error("Error updating site visit:", err);
    return NextResponse.json({ error: "Failed to update site visit" }, { status: 500 });
  }
}
