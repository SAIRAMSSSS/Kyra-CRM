import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { createNotification, notifyUsersWithRole } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      leadId,
      actionType, // "LOG_ATTEMPT" | "SUBMIT_REPORT"
      outcome, // "Answered", "Busy", "Ringing Unanswered", "Switched Off", "Invalid Number", "Attempted"
      feedback, // "NOT_INTERESTED", "NOT_CONNECTED", "CALL_BACK", "INTERESTED"
      notes,
      notInterestedReason,
      nextFollowUpDate,
      // Site visit fixed fields:
      siteVisitFixed, // boolean
      siteVisitDate,
      siteVisitTime,
      siteVisitSiteId,
      siteVisitRemarks,
      assignedSiteManagerId,
    } = body;

    if (!leadId) {
      return NextResponse.json({ error: "Lead ID is required" }, { status: 400 });
    }

    const lead = await prisma.lead.findFirst({
      where: { OR: [{ id: leadId }, { displayId: leadId }] },
      include: { customer: true, site: true },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Role check: Telecallers can only log calls for their assigned leads
    if (user.role === "TELECALLER" && lead.assignedTelecallerId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: You are only permitted to call your own assigned leads." },
        { status: 403 }
      );
    }

    // Case 1: Simple call attempt initiated via `tel:` button click
    if (actionType === "LOG_ATTEMPT") {
      const callAttempt = await prisma.callReport.create({
        data: {
          leadId: lead.id,
          telecallerId: user.id,
          calledAt: new Date(),
          outcome: outcome || "Attempted",
          feedback: lead.callFeedback || "NOT_CONNECTED",
          notes: notes || "Call attempt initiated via portal telephone action.",
        },
      });

      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          lastContactedAt: new Date(),
          lifecycleStatus: lead.lifecycleStatus === "NEW" ? "IN_PROGRESS" : lead.lifecycleStatus,
        },
      });

      return NextResponse.json({ success: true, callAttempt });
    }

    // Case 2: Full Call Report submission
    if (!feedback) {
      return NextResponse.json(
        { error: "Controlled call feedback is required (Not interested, Not connected, Call back, or Interested)." },
        { status: 400 }
      );
    }

    const validFeedbacks = [
      "CONFIRM",
      "CONFIRMED",
      "CALL_BACK",
      "NOT_INTERESTED",
      "N.I",
      "NI",
      "NOT_CONNECTED",
      "N.CON",
      "N_CON",
      "CALL_BUSY",
      "SWITCHED_OFF",
      "OTHERS",
      "INTERESTED",
    ];

    let canonicalFeedback = String(feedback).toUpperCase().trim();
    if (canonicalFeedback === "N.I" || canonicalFeedback === "NI") canonicalFeedback = "NOT_INTERESTED";
    if (canonicalFeedback === "N.CON" || canonicalFeedback === "N_CON") canonicalFeedback = "NOT_CONNECTED";
    if (canonicalFeedback === "CONFIRMED") canonicalFeedback = "CONFIRM";

    if (!validFeedbacks.includes(feedback.toUpperCase()) && !validFeedbacks.includes(canonicalFeedback)) {
      return NextResponse.json(
        { error: "Invalid feedback selection. Must be one of: Confirm, Call back, N.I, N.Con, Call busy, Switched off, Others." },
        { status: 400 }
      );
    }

    const isConfirmType = canonicalFeedback === "CONFIRM" || canonicalFeedback === "INTERESTED";

    // Validation for Call back
    if (canonicalFeedback === "CALL_BACK" && !nextFollowUpDate) {
      return NextResponse.json(
        { error: "A scheduled follow-up date & time is required for Call Back feedback." },
        { status: 400 }
      );
    }

    // Validation for Confirm / Interested -> Fixed site visit
    if (isConfirmType && siteVisitFixed) {
      if (!siteVisitDate || !siteVisitTime) {
        return NextResponse.json(
          { error: "Site visit date and time are required when a site visit is marked as Fixed." },
          { status: 400 }
        );
      }
    }

    // Save Call Report
    const callReport = await prisma.callReport.create({
      data: {
        leadId: lead.id,
        telecallerId: user.id,
        calledAt: new Date(),
        outcome: outcome || "Answered",
        feedback: canonicalFeedback,
        notes: notes || null,
        notInterestedReason: canonicalFeedback === "NOT_INTERESTED" ? notInterestedReason : null,
        nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
        siteVisitFixed: isConfirmType ? Boolean(siteVisitFixed) : null,
      },
    });

    // Update Lead state according to feedback
    let newLifecycleStatus = "CONTACTED";
    if (isConfirmType) {
      newLifecycleStatus = siteVisitFixed ? "SITE_VISIT_SCHEDULED" : "QUALIFIED";
    } else if (canonicalFeedback === "CALL_BACK") {
      newLifecycleStatus = "FOLLOW_UP_REQUIRED";
    } else if (canonicalFeedback === "NOT_INTERESTED") {
      newLifecycleStatus = "CLOSED";
    } else if (canonicalFeedback === "CALL_BUSY" || canonicalFeedback === "SWITCHED_OFF" || canonicalFeedback === "NOT_CONNECTED") {
      newLifecycleStatus = "CONTACTED";
    } else if (canonicalFeedback === "OTHERS") {
      newLifecycleStatus = "IN_PROGRESS";
    }

    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        callFeedback: canonicalFeedback,
        lifecycleStatus: newLifecycleStatus,
        lastContactedAt: new Date(),
        nextFollowUpAt: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
      },
    });

    // If Site Visit is Fixed, create SiteVisit record
    let createdVisit = null;
    if (isConfirmType && siteVisitFixed) {
      const visitSiteId = siteVisitSiteId || lead.siteId;
      if (!visitSiteId) {
        return NextResponse.json(
          { error: "A selected project site is required for scheduling a site visit." },
          { status: 400 }
        );
      }

      const svCount = await prisma.siteVisit.count();
      const displayId = `KYRA-SV-${2001 + svCount}`;

      // Pick assigned site manager or find active site manager
      let targetSiteManagerId = assignedSiteManagerId;
      if (!targetSiteManagerId) {
        const sm = await prisma.user.findFirst({
          where: { role: "SITE_MANAGER", status: "ACTIVE" },
        });
        targetSiteManagerId = sm?.id || null;
      }

      createdVisit = await prisma.siteVisit.create({
        data: {
          displayId,
          leadId: lead.id,
          customerId: lead.customerId,
          siteId: visitSiteId,
          scheduledDate: new Date(siteVisitDate),
          scheduledTime: siteVisitTime,
          status: "SCHEDULED",
          assignedSiteManagerId: targetSiteManagerId,
          createdById: user.id,
          visitRemarks: siteVisitRemarks || null,
        },
      });

      // Notify Site Manager
      if (targetSiteManagerId) {
        await createNotification({
          userId: targetSiteManagerId,
          type: "SITE_VISIT_SCHEDULED",
          title: "New Site Visit Scheduled",
          message: `Client ${lead.customer.name} scheduled for ${siteVisitDate} at ${siteVisitTime}.`,
          linkUrl: `/site-visits`,
        });
      }

      // Notify CRM Executive
      await notifyUsersWithRole("CRM_EXECUTIVE", {
        type: "SITE_VISIT_SCHEDULED",
        title: "Site Visit Booked",
        message: `${user.name} booked a site visit for ${lead.customer.name} (${displayId}).`,
        linkUrl: `/site-visits`,
      });
    }

    // Record audit log
    await logAudit({
      userId: user.id,
      action: "CALL_LOGGED",
      entityType: "CALL_REPORT",
      entityId: callReport.id,
      details: {
        leadId: lead.displayId,
        feedback,
        outcome: callReport.outcome,
        siteVisitFixed: Boolean(siteVisitFixed),
        visitId: createdVisit?.displayId,
      },
    });

    return NextResponse.json({
      success: true,
      callReport,
      siteVisit: createdVisit,
      message: "Call report and feedback logged successfully.",
    });
  } catch (err: any) {
    console.error("Error logging call:", err);
    return NextResponse.json({ error: "Failed to log call outcome" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const feedback = searchParams.get("feedback");
    const telecallerId = searchParams.get("telecallerId");
    const leadId = searchParams.get("leadId");

    const where: any = {};

    if (user.role === "TELECALLER") {
      where.telecallerId = user.id;
    } else if (telecallerId) {
      where.telecallerId = telecallerId;
    }

    if (feedback) {
      where.feedback = feedback;
    }

    if (leadId) {
      where.leadId = leadId;
    }

    const callReports = await prisma.callReport.findMany({
      where,
      orderBy: { calledAt: "desc" },
      take: 100,
      include: {
        telecaller: { select: { id: true, name: true, email: true } },
        lead: {
          include: {
            customer: true,
            site: true,
          },
        },
      },
    });

    return NextResponse.json({ callReports });
  } catch (err) {
    console.error("Error fetching call reports:", err);
    return NextResponse.json({ error: "Failed to fetch call reports" }, { status: 500 });
  }
}

