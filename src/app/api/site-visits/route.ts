import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");
    const status = searchParams.get("status");
    const siteManagerId = searchParams.get("siteManagerId");
    const search = searchParams.get("search");
    const dateFrom = searchParams.get("from");
    const dateTo = searchParams.get("to");

    const where: any = {};

    // Site Manager sees their assigned visits or their sites
    if (user.role === "SITE_MANAGER") {
      where.OR = [
        { assignedSiteManagerId: user.id },
        { assignedSiteManagerId: null },
      ];
    } else if (siteManagerId) {
      where.assignedSiteManagerId = siteManagerId;
    }

    if (siteId) {
      where.siteId = siteId;
    }

    if (status) {
      where.status = status;
    }

    if (dateFrom && dateTo) {
      where.scheduledDate = {
        gte: new Date(dateFrom),
        lte: new Date(dateTo),
      };
    }

    if (search) {
      where.OR = [
        { displayId: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { phone: { contains: search } } },
        { site: { name: { contains: search } } },
      ];
    }

    const siteVisits = await prisma.siteVisit.findMany({
      where,
      orderBy: { scheduledDate: "asc" },
      include: {
        customer: true,
        site: true,
        lead: { select: { id: true, displayId: true, priority: true } },
        assignedSiteManager: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ siteVisits });
  } catch (err) {
    console.error("Error fetching site visits:", err);
    return NextResponse.json({ error: "Failed to fetch site visits" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      leadId,
      customerId,
      siteId,
      scheduledDate,
      scheduledTime,
      assignedSiteManagerId,
      visitRemarks,
    } = body;

    if (!leadId || !siteId || !scheduledDate || !scheduledTime) {
      return NextResponse.json(
        { error: "Lead, site, scheduled date and time are required." },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { customer: true },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const svCount = await prisma.siteVisit.count();
    const displayId = `KYRA-SV-${2001 + svCount}`;

    const siteVisit = await prisma.siteVisit.create({
      data: {
        displayId,
        leadId,
        customerId: lead.customerId,
        siteId,
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        status: "SCHEDULED",
        assignedSiteManagerId: assignedSiteManagerId || null,
        createdById: user.id,
        visitRemarks: visitRemarks || null,
      },
      include: {
        customer: true,
        site: true,
      },
    });

    // Update lead status
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        lifecycleStatus: "SITE_VISIT_SCHEDULED",
        callFeedback: "INTERESTED",
      },
    });

    if (assignedSiteManagerId) {
      await createNotification({
        userId: assignedSiteManagerId,
        type: "SITE_VISIT_SCHEDULED",
        title: "Site Visit Scheduled",
        message: `Visit for ${lead.customer.name} scheduled on ${scheduledDate} at ${scheduledTime}.`,
        linkUrl: `/site-visits`,
      });
    }

    await logAudit({
      userId: user.id,
      action: "SITE_VISIT_SCHEDULED",
      entityType: "SITE_VISIT",
      entityId: siteVisit.id,
      details: {
        displayId: siteVisit.displayId,
        customer: lead.customer.name,
        date: scheduledDate,
        time: scheduledTime,
      },
    });

    return NextResponse.json({ success: true, siteVisit }, { status: 201 });
  } catch (err: any) {
    console.error("Error creating site visit:", err);
    return NextResponse.json({ error: "Failed to schedule site visit" }, { status: 500 });
  }
}
