import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateFilter = searchParams.get("filter") || "month";
    const customFrom = searchParams.get("from");
    const customTo = searchParams.get("to");

    let dateRange: { gte?: Date; lte?: Date } = {};
    const now = new Date();

    if (dateFilter === "today") {
      dateRange = { gte: startOfDay(now), lte: endOfDay(now) };
    } else if (dateFilter === "yesterday") {
      const yest = subDays(now, 1);
      dateRange = { gte: startOfDay(yest), lte: endOfDay(yest) };
    } else if (dateFilter === "week") {
      dateRange = { gte: startOfWeek(now, { weekStartsOn: 1 }), lte: endOfWeek(now, { weekStartsOn: 1 }) };
    } else if (dateFilter === "month") {
      dateRange = { gte: startOfMonth(now), lte: endOfMonth(now) };
    } else if (dateFilter === "custom" && customFrom && customTo) {
      dateRange = { gte: startOfDay(new Date(customFrom)), lte: endOfDay(new Date(customTo)) };
    }

    // Role-specific metrics logic
    if (user.role === "GENERAL_MANAGER") {
      const [
        totalLeads,
        newLeads,
        unassignedLeads,
        assignedLeads,
        contactedLeads,
        interestedLeads,
        followUpLeads,
        siteVisitsFixed,
        siteVisitsCompleted,
        siteVisitsPending,
        notInterestedLeads,
        notConnectedLeads,
        leadsBySourceRaw,
        leadsBySiteRaw,
        telecallers,
        recentActivity,
        upcomingVisits,
        outstandingTasks,
      ] = await Promise.all([
        prisma.lead.count({ where: dateRange.gte ? { createdAt: dateRange } : {} }),
        prisma.lead.count({ where: { lifecycleStatus: "NEW", ...(dateRange.gte ? { createdAt: dateRange } : {}) } }),
        prisma.lead.count({ where: { assignedTelecallerId: null, ...(dateRange.gte ? { createdAt: dateRange } : {}) } }),
        prisma.lead.count({ where: { assignedTelecallerId: { not: null }, ...(dateRange.gte ? { createdAt: dateRange } : {}) } }),
        prisma.lead.count({ where: { lifecycleStatus: "CONTACTED", ...(dateRange.gte ? { createdAt: dateRange } : {}) } }),
        prisma.lead.count({ where: { callFeedback: "INTERESTED", ...(dateRange.gte ? { createdAt: dateRange } : {}) } }),
        prisma.lead.count({ where: { callFeedback: "CALL_BACK", ...(dateRange.gte ? { createdAt: dateRange } : {}) } }),
        prisma.siteVisit.count({ where: { status: { in: ["SCHEDULED", "CONFIRMED", "RESCHEDULED"] }, ...(dateRange.gte ? { createdAt: dateRange } : {}) } }),
        prisma.siteVisit.count({ where: { status: "COMPLETED", ...(dateRange.gte ? { createdAt: dateRange } : {}) } }),
        prisma.siteVisit.count({ where: { status: "SCHEDULED", ...(dateRange.gte ? { createdAt: dateRange } : {}) } }),
        prisma.lead.count({ where: { callFeedback: "NOT_INTERESTED", ...(dateRange.gte ? { createdAt: dateRange } : {}) } }),
        prisma.lead.count({ where: { callFeedback: "NOT_CONNECTED", ...(dateRange.gte ? { createdAt: dateRange } : {}) } }),
        prisma.lead.groupBy({
          by: ["leadSourceId"],
          _count: { id: true },
          where: dateRange.gte ? { createdAt: dateRange } : {},
        }),
        prisma.lead.groupBy({
          by: ["siteId"],
          _count: { id: true },
          where: dateRange.gte ? { createdAt: dateRange } : {},
        }),
        prisma.user.findMany({
          where: { role: "TELECALLER", status: "ACTIVE" },
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                assignedTelecallerLeads: true,
                callReports: true,
              },
            },
          },
        }),
        prisma.auditLog.findMany({
          take: 8,
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true, role: true } } },
        }),
        prisma.siteVisit.findMany({
          where: { status: { in: ["SCHEDULED", "CONFIRMED", "RESCHEDULED"] }, scheduledDate: { gte: startOfDay(now) } },
          take: 5,
          orderBy: { scheduledDate: "asc" },
          include: {
            customer: { select: { name: true, phone: true, location: true } },
            site: { select: { name: true } },
            assignedSiteManager: { select: { name: true } },
          },
        }),
        prisma.task.findMany({
          where: { status: { notIn: ["COMPLETED", "CANCELLED"] } },
          take: 5,
          orderBy: { dueDate: "asc" },
          include: {
            assignedTo: { select: { name: true } },
          },
        }),
      ]);

      // Enrich sources & sites labels
      const sourceIds = leadsBySourceRaw.map((s) => s.leadSourceId).filter(Boolean) as string[];
      const siteIds = leadsBySiteRaw.map((s) => s.siteId).filter(Boolean) as string[];

      const [sources, sites] = await Promise.all([
        prisma.leadSource.findMany({ where: { id: { in: sourceIds } } }),
        prisma.site.findMany({ where: { id: { in: siteIds } } }),
      ]);

      const sourceMap = new Map(sources.map((s) => [s.id, s.name]));
      const siteMap = new Map(sites.map((s) => [s.id, s.name]));

      const leadsBySource = leadsBySourceRaw.map((item) => ({
        name: item.leadSourceId ? sourceMap.get(item.leadSourceId) || "Unknown" : "Unspecified",
        count: item._count.id,
      }));

      const leadsBySite = leadsBySiteRaw.map((item) => ({
        name: item.siteId ? siteMap.get(item.siteId) || "Unknown" : "Unspecified",
        count: item._count.id,
      }));

      return NextResponse.json({
        role: user.role,
        metrics: {
          totalLeads,
          newLeads,
          unassignedLeads,
          assignedLeads,
          contactedLeads,
          interestedLeads,
          followUpLeads,
          siteVisitsFixed,
          siteVisitsCompleted,
          siteVisitsPending,
          notInterestedLeads,
          notConnectedLeads,
        },
        conversionFunnel: [
          { stage: "Total Inquiries", count: totalLeads },
          { stage: "Assigned", count: assignedLeads },
          { stage: "Contacted", count: contactedLeads + interestedLeads + notInterestedLeads + notConnectedLeads },
          { stage: "Interested", count: interestedLeads },
          { stage: "Site Visit Fixed", count: siteVisitsFixed + siteVisitsCompleted },
          { stage: "Site Visit Completed", count: siteVisitsCompleted },
        ],
        leadsBySource,
        leadsBySite,
        telecallerActivity: telecallers.map((t) => ({
          name: t.name,
          leads: t._count.assignedTelecallerLeads,
          calls: t._count.callReports,
        })),
        recentActivity,
        upcomingVisits,
        outstandingTasks,
      });
    }

    if (user.role === "DIGITAL_HEAD") {
      const [
        activeCampaignsCount,
        campaigns,
        totalLeads,
        newLeads,
        assignedLeads,
        unassignedLeads,
        leadsBySourceRaw,
        recentLeads,
        tasksAssignedToMe,
      ] = await Promise.all([
        prisma.campaign.count({ where: { status: "Active" } }),
        prisma.campaign.findMany({
          orderBy: { createdAt: "desc" },
          include: {
            _count: { select: { leads: true } },
            leadSource: { select: { name: true } },
          },
        }),
        prisma.lead.count({ where: dateRange.gte ? { createdAt: dateRange } : {} }),
        prisma.lead.count({ where: { lifecycleStatus: "NEW", ...(dateRange.gte ? { createdAt: dateRange } : {}) } }),
        prisma.lead.count({ where: { assignedTelecallerId: { not: null }, ...(dateRange.gte ? { createdAt: dateRange } : {}) } }),
        prisma.lead.count({ where: { assignedTelecallerId: null, ...(dateRange.gte ? { createdAt: dateRange } : {}) } }),
        prisma.lead.groupBy({
          by: ["leadSourceId"],
          _count: { id: true },
          where: dateRange.gte ? { createdAt: dateRange } : {},
        }),
        prisma.lead.findMany({
          take: 6,
          orderBy: { createdAt: "desc" },
          include: {
            customer: { select: { name: true, phone: true, location: true } },
            leadSource: { select: { name: true } },
            campaign: { select: { name: true } },
            site: { select: { name: true } },
          },
        }),
        prisma.task.findMany({
          where: { assignedToId: user.id, status: { notIn: ["COMPLETED", "CANCELLED"] } },
          take: 5,
        }),
      ]);

      const sourceIds = leadsBySourceRaw.map((s) => s.leadSourceId).filter(Boolean) as string[];
      const sources = await prisma.leadSource.findMany({ where: { id: { in: sourceIds } } });
      const sourceMap = new Map(sources.map((s) => [s.id, s.name]));

      const leadsBySource = leadsBySourceRaw.map((item) => ({
        name: item.leadSourceId ? sourceMap.get(item.leadSourceId) || "Unknown" : "Direct / Other",
        count: item._count.id,
      }));

      return NextResponse.json({
        role: user.role,
        metrics: {
          activeCampaignsCount,
          totalLeads,
          newLeads,
          assignedLeads,
          unassignedLeads,
        },
        campaigns: campaigns.map((c) => ({
          id: c.id,
          name: c.name,
          contentType: c.contentType,
          platform: c.platform,
          status: c.status,
          leadsCount: c._count.leads,
          leadSource: c.leadSource?.name,
        })),
        leadsBySource,
        recentLeads,
        tasks: tasksAssignedToMe,
      });
    }

    if (user.role === "CRM_EXECUTIVE") {
      const [
        totalLeads,
        newLeads,
        unassignedLeads,
        assignedLeads,
        followUpTodayCount,
        interestedCount,
        siteVisitsFixedCount,
        telecallers,
        recentLeads,
        pendingTasks,
      ] = await Promise.all([
        prisma.lead.count(),
        prisma.lead.count({ where: { lifecycleStatus: "NEW" } }),
        prisma.lead.count({ where: { assignedTelecallerId: null } }),
        prisma.lead.count({ where: { assignedTelecallerId: { not: null } } }),
        prisma.lead.count({
          where: {
            nextFollowUpAt: {
              gte: startOfDay(now),
              lte: endOfDay(now),
            },
          },
        }),
        prisma.lead.count({ where: { callFeedback: "INTERESTED" } }),
        prisma.siteVisit.count({ where: { status: { in: ["SCHEDULED", "CONFIRMED", "RESCHEDULED"] } } }),
        prisma.user.findMany({
          where: { role: "TELECALLER", status: "ACTIVE" },
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                assignedTelecallerLeads: true,
                callReports: true,
              },
            },
          },
        }),
        prisma.lead.findMany({
          take: 6,
          orderBy: { createdAt: "desc" },
          include: {
            customer: true,
            site: true,
            assignedTelecaller: { select: { name: true } },
          },
        }),
        prisma.task.findMany({
          where: { assignedToId: user.id, status: { notIn: ["COMPLETED", "CANCELLED"] } },
          take: 5,
        }),
      ]);

      return NextResponse.json({
        role: user.role,
        metrics: {
          totalLeads,
          newLeads,
          unassignedLeads,
          assignedLeads,
          followUpTodayCount,
          interestedCount,
          siteVisitsFixedCount,
        },
        telecallerWorkload: telecallers.map((t) => ({
          id: t.id,
          name: t.name,
          assignedLeads: t._count.assignedTelecallerLeads,
          totalCalls: t._count.callReports,
        })),
        recentLeads,
        pendingTasks,
      });
    }

    if (user.role === "SITE_MANAGER") {
      const [
        todayVisits,
        upcomingVisits,
        completedVisitsCount,
        cancelledVisitsCount,
        pendingVisitsCount,
        assignedTasks,
      ] = await Promise.all([
        prisma.siteVisit.findMany({
          where: {
            assignedSiteManagerId: user.id,
            scheduledDate: { gte: startOfDay(now), lte: endOfDay(now) },
          },
          include: {
            customer: true,
            site: true,
          },
          orderBy: { scheduledTime: "asc" },
        }),
        prisma.siteVisit.findMany({
          where: {
            assignedSiteManagerId: user.id,
            scheduledDate: { gt: endOfDay(now) },
            status: { in: ["SCHEDULED", "CONFIRMED", "RESCHEDULED"] },
          },
          include: {
            customer: true,
            site: true,
          },
          orderBy: { scheduledDate: "asc" },
          take: 10,
        }),
        prisma.siteVisit.count({ where: { assignedSiteManagerId: user.id, status: "COMPLETED" } }),
        prisma.siteVisit.count({ where: { assignedSiteManagerId: user.id, status: "CANCELLED" } }),
        prisma.siteVisit.count({ where: { assignedSiteManagerId: user.id, status: "SCHEDULED" } }),
        prisma.task.findMany({
          where: { assignedToId: user.id, status: { notIn: ["COMPLETED", "CANCELLED"] } },
          orderBy: { dueDate: "asc" },
        }),
      ]);

      return NextResponse.json({
        role: user.role,
        metrics: {
          todayVisitsCount: todayVisits.length,
          upcomingVisitsCount: upcomingVisits.length,
          completedVisitsCount,
          cancelledVisitsCount,
          pendingVisitsCount,
        },
        todayVisits,
        upcomingVisits,
        assignedTasks,
      });
    }

    if (user.role === "TELECALLER") {
      const [
        myAssignedLeadsCount,
        callsTodayCount,
        interestedCount,
        callBacksDueToday,
        notConnectedCount,
        siteVisitsFixedByMe,
        recentCalls,
        urgentLeads,
      ] = await Promise.all([
        prisma.lead.count({ where: { assignedTelecallerId: user.id } }),
        prisma.callReport.count({
          where: {
            telecallerId: user.id,
            calledAt: { gte: startOfDay(now), lte: endOfDay(now) },
          },
        }),
        prisma.lead.count({
          where: { assignedTelecallerId: user.id, callFeedback: "INTERESTED" },
        }),
        prisma.lead.findMany({
          where: {
            assignedTelecallerId: user.id,
            nextFollowUpAt: { gte: startOfDay(now), lte: endOfDay(now) },
          },
          include: { customer: true, site: true },
          take: 6,
        }),
        prisma.lead.count({
          where: { assignedTelecallerId: user.id, callFeedback: "NOT_CONNECTED" },
        }),
        prisma.siteVisit.count({
          where: { createdById: user.id },
        }),
        prisma.callReport.findMany({
          where: { telecallerId: user.id },
          take: 5,
          orderBy: { calledAt: "desc" },
          include: {
            lead: {
              include: { customer: true },
            },
          },
        }),
        prisma.lead.findMany({
          where: {
            assignedTelecallerId: user.id,
            lifecycleStatus: { in: ["NEW", "ASSIGNED", "CONTACTED", "FOLLOW_UP_REQUIRED"] },
          },
          orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
          take: 6,
          include: { customer: true, site: true },
        }),
      ]);

      return NextResponse.json({
        role: user.role,
        metrics: {
          myAssignedLeadsCount,
          callsTodayCount,
          callsPendingCount: Math.max(0, myAssignedLeadsCount - callsTodayCount),
          interestedCount,
          callBacksDueTodayCount: callBacksDueToday.length,
          notConnectedCount,
          siteVisitsFixedByMe,
        },
        callBacksDueToday,
        urgentLeads,
        recentCalls,
      });
    }

    return NextResponse.json({ error: "Unknown role" }, { status: 400 });
  } catch (err) {
    console.error("Dashboard metrics error:", err);
    return NextResponse.json({ error: "Failed to fetch dashboard metrics" }, { status: 500 });
  }
}
