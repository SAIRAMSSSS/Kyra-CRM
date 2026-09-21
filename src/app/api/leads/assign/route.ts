import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notify";
import { canAssignLeads } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canAssignLeads(user.role)) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to assign leads." },
        { status: 403 }
      );
    }

    const { leadIds, telecallerId, siteManagerId, notes, autoRoundRobin } = await req.json();

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { error: "Please select at least one lead to assign." },
        { status: 400 }
      );
    }

    if (autoRoundRobin) {
      const activeTelecallers = await prisma.user.findMany({
        where: { role: "TELECALLER", status: "ACTIVE" },
      });
      if (activeTelecallers.length === 0) {
        return NextResponse.json(
          { error: "No active telecallers found for auto-distribution." },
          { status: 400 }
        );
      }

      const leadsToAssign = await prisma.lead.findMany({
        where: { id: { in: leadIds } },
        include: { customer: true },
      });

      for (let i = 0; i < leadsToAssign.length; i++) {
        const targetLead = leadsToAssign[i];
        const assignedTc = activeTelecallers[i % activeTelecallers.length];

        await prisma.lead.update({
          where: { id: targetLead.id },
          data: {
            assignedTelecallerId: assignedTc.id,
            lifecycleStatus: targetLead.lifecycleStatus === "NEW" ? "ASSIGNED" : targetLead.lifecycleStatus,
          },
        });

        await prisma.leadAssignmentHistory.create({
          data: {
            leadId: targetLead.id,
            toUserId: assignedTc.id,
            assignedById: user.id,
            notes: notes || "Auto-assigned via Round-Robin distribution",
          },
        });

        await createNotification({
          userId: assignedTc.id,
          type: "LEAD_ASSIGNED",
          title: "New Lead Auto-Assigned",
          message: `Lead ${targetLead.displayId} (${targetLead.customer.name}) assigned to you.`,
          linkUrl: `/leads/${targetLead.displayId}`,
        });
      }

      await logAudit({
        userId: user.id,
        action: "LEAD_ASSIGNED",
        entityType: "LEAD",
        details: { count: leadsToAssign.length, strategy: "ROUND_ROBIN" },
      });

      return NextResponse.json({
        success: true,
        count: leadsToAssign.length,
        message: `Successfully distributed ${leadsToAssign.length} leads across ${activeTelecallers.length} telecallers.`,
      });
    }

    if (!telecallerId && !siteManagerId && telecallerId !== null) {
      return NextResponse.json(
        { error: "Assignee is required." },
        { status: 400 }
      );
    }

    const leads = await prisma.lead.findMany({
      where: { id: { in: leadIds } },
      include: { customer: true },
    });

    for (const lead of leads) {
      const updateData: any = {};
      if (telecallerId !== undefined) {
        updateData.assignedTelecallerId = telecallerId;
        if (telecallerId) {
          updateData.lifecycleStatus =
            lead.lifecycleStatus === "NEW" ? "ASSIGNED" : lead.lifecycleStatus;
        }
      }
      if (siteManagerId !== undefined) {
        updateData.assignedSiteId = siteManagerId;
      }

      await prisma.lead.update({
        where: { id: lead.id },
        data: updateData,
      });

      // Assignment history
      if (telecallerId) {
        await prisma.leadAssignmentHistory.create({
          data: {
            leadId: lead.id,
            fromUserId: lead.assignedTelecallerId,
            toUserId: telecallerId,
            assignedById: user.id,
            notes: notes || `Assigned by ${user.name}`,
          },
        });

        // Notify telecaller
        await createNotification({
          userId: telecallerId,
          type: "LEAD_ASSIGNED",
          title: "New Lead Assigned",
          message: `Lead ${lead.displayId} (${lead.customer.name}) has been assigned to you.`,
          linkUrl: `/leads/${lead.displayId}`,
        });
      }

      // If site manager assigned
      if (siteManagerId) {
        await createNotification({
          userId: siteManagerId,
          type: "LEAD_ASSIGNED",
          title: "Site Lead Assigned",
          message: `Lead ${lead.displayId} (${lead.customer.name}) assigned to your site operations.`,
          linkUrl: `/leads/${lead.displayId}`,
        });
      }

      // Audit log
      await logAudit({
        userId: user.id,
        action: "LEAD_ASSIGNED",
        entityType: "LEAD",
        entityId: lead.id,
        details: {
          displayId: lead.displayId,
          assignedToTelecaller: telecallerId,
          assignedToSiteManager: siteManagerId,
          assignedBy: user.email,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${leads.length} lead(s).`,
      count: leads.length,
    });
  } catch (err) {
    console.error("Error assigning leads:", err);
    return NextResponse.json({ error: "Failed to assign leads" }, { status: 500 });
  }
}
