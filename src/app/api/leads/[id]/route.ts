import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

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

    const lead = await prisma.lead.findFirst({
      where: {
        OR: [{ id }, { displayId: id }],
      },
      include: {
        customer: true,
        site: true,
        leadSource: true,
        campaign: true,
        createdBy: { select: { id: true, name: true, role: true } },
        assignedCrm: { select: { id: true, name: true } },
        assignedTelecaller: { select: { id: true, name: true, email: true } },
        assignedSiteManager: { select: { id: true, name: true } },
        callReports: {
          orderBy: { calledAt: "desc" },
          include: {
            telecaller: { select: { id: true, name: true } },
          },
        },
        siteVisits: {
          orderBy: { scheduledDate: "desc" },
          include: {
            site: true,
            assignedSiteManager: { select: { id: true, name: true } },
            createdBy: { select: { id: true, name: true } },
          },
        },
        assignmentHistories: {
          orderBy: { assignedAt: "desc" },
          include: {
            toUser: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Role check: Telecallers can only view their assigned leads
    if (user.role === "TELECALLER" && lead.assignedTelecallerId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: You are not assigned to this lead." },
        { status: 403 }
      );
    }

    return NextResponse.json({ lead });
  } catch (err) {
    console.error("Error fetching lead detail:", err);
    return NextResponse.json({ error: "Failed to fetch lead" }, { status: 500 });
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

    const existingLead = await prisma.lead.findFirst({
      where: { OR: [{ id }, { displayId: id }] },
      include: { customer: true },
    });

    if (!existingLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Telecaller permission check
    if (user.role === "TELECALLER" && existingLead.assignedTelecallerId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only edit your own assigned leads." },
        { status: 403 }
      );
    }

    // Allowed updates
    const {
      lifecycleStatus,
      callFeedback,
      priority,
      siteId,
      notes,
      nextFollowUpAt,
      preferredTime,
      enquiryNo,
      customerName,
      customerLocation,
      customerAddress,
      customerProfession,
      customerEmail,
      customerPhone,
      altPhone,
    } = body;

    // Update customer info if changed
    if (
      customerName ||
      customerLocation ||
      customerProfession !== undefined ||
      customerAddress !== undefined ||
      customerEmail !== undefined ||
      altPhone !== undefined
    ) {
      await prisma.customer.update({
        where: { id: existingLead.customerId },
        data: {
          name: customerName || existingLead.customer.name,
          location: customerLocation || existingLead.customer.location,
          profession: customerProfession !== undefined ? customerProfession : existingLead.customer.profession,
          address: customerAddress !== undefined ? customerAddress : existingLead.customer.address,
          email: customerEmail !== undefined ? customerEmail : existingLead.customer.email,
          altPhone: altPhone !== undefined ? altPhone : existingLead.customer.altPhone,
        },
      });
    }

    // Update lead
    const updatedLead = await prisma.lead.update({
      where: { id: existingLead.id },
      data: {
        lifecycleStatus: lifecycleStatus || existingLead.lifecycleStatus,
        callFeedback: callFeedback !== undefined ? callFeedback : existingLead.callFeedback,
        priority: priority || existingLead.priority,
        siteId: siteId !== undefined ? siteId : existingLead.siteId,
        notes: notes !== undefined ? notes : existingLead.notes,
        enquiryNo: enquiryNo !== undefined ? enquiryNo : existingLead.enquiryNo,
        preferredTime: preferredTime !== undefined ? preferredTime : existingLead.preferredTime,
        nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : existingLead.nextFollowUpAt,
      },
      include: {
        customer: true,
        site: true,
        assignedTelecaller: true,
      },
    });

    await logAudit({
      userId: user.id,
      action: "LEAD_UPDATED",
      entityType: "LEAD",
      entityId: updatedLead.id,
      details: {
        displayId: updatedLead.displayId,
        changes: body,
      },
    });

    return NextResponse.json({ success: true, lead: updatedLead });
  } catch (err) {
    console.error("Error updating lead:", err);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}
