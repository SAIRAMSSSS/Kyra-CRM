import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");
    const siteId = searchParams.get("siteId");
    const telecallerId = searchParams.get("telecallerId");
    const leadSourceId = searchParams.get("leadSourceId");
    const campaignId = searchParams.get("campaignId");

    const whereLead: any = {};
    const whereCall: any = {};
    const whereVisit: any = {};

    if (fromDate && toDate) {
      const gte = startOfDay(new Date(fromDate));
      const lte = endOfDay(new Date(toDate));
      whereLead.createdAt = { gte, lte };
      whereCall.calledAt = { gte, lte };
      whereVisit.scheduledDate = { gte, lte };
    }

    if (siteId) {
      whereLead.siteId = siteId;
      whereVisit.siteId = siteId;
    }

    if (telecallerId) {
      whereLead.assignedTelecallerId = telecallerId;
      whereCall.telecallerId = telecallerId;
    }

    if (leadSourceId) {
      whereLead.leadSourceId = leadSourceId;
    }

    if (campaignId) {
      whereLead.campaignId = campaignId;
    }

    // Role restriction
    if (user.role === "TELECALLER") {
      whereLead.assignedTelecallerId = user.id;
      whereCall.telecallerId = user.id;
    } else if (user.role === "SITE_MANAGER") {
      whereLead.assignedSiteId = user.id;
      whereVisit.assignedSiteManagerId = user.id;
    }

    const [
      totalLeads,
      uniqueCustomersCount,
      totalCalls,
      totalVisits,
      completedVisits,
      feedbackCounts,
      leadsBySourceRaw,
      leadsBySiteRaw,
      leadsByCampaignRaw,
      telecallers,
      rawLeadsList,
    ] = await Promise.all([
      prisma.lead.count({ where: whereLead }),
      prisma.customer.count(),
      prisma.callReport.count({ where: whereCall }),
      prisma.siteVisit.count({ where: whereVisit }),
      prisma.siteVisit.count({ where: { ...whereVisit, status: "COMPLETED" } }),
      prisma.lead.groupBy({
        by: ["callFeedback"],
        _count: { id: true },
        where: whereLead,
      }),
      prisma.lead.groupBy({
        by: ["leadSourceId"],
        _count: { id: true },
        where: whereLead,
      }),
      prisma.lead.groupBy({
        by: ["siteId"],
        _count: { id: true },
        where: whereLead,
      }),
      prisma.lead.groupBy({
        by: ["campaignId"],
        _count: { id: true },
        where: whereLead,
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
      prisma.lead.findMany({
        where: whereLead,
        take: 50,
        orderBy: { createdAt: "desc" },
        include: {
          customer: true,
          site: true,
          leadSource: true,
          campaign: true,
          assignedTelecaller: { select: { name: true } },
        },
      }),
    ]);

    // Format feedback map
    const feedbackMap: Record<string, number> = {
      INTERESTED: 0,
      CALL_BACK: 0,
      NOT_CONNECTED: 0,
      NOT_INTERESTED: 0,
    };
    feedbackCounts.forEach((f) => {
      if (f.callFeedback && feedbackMap[f.callFeedback] !== undefined) {
        feedbackMap[f.callFeedback] = f._count.id;
      }
    });

    // Lookup metadata labels
    const sIds = leadsBySourceRaw.map((s) => s.leadSourceId).filter(Boolean) as string[];
    const siteIds = leadsBySiteRaw.map((s) => s.siteId).filter(Boolean) as string[];
    const cIds = leadsByCampaignRaw.map((c) => c.campaignId).filter(Boolean) as string[];

    const [sources, sites, campaigns] = await Promise.all([
      prisma.leadSource.findMany({ where: { id: { in: sIds } } }),
      prisma.site.findMany({ where: { id: { in: siteIds } } }),
      prisma.campaign.findMany({ where: { id: { in: cIds } } }),
    ]);

    const sourceMap = new Map(sources.map((s) => [s.id, s.name]));
    const siteMap = new Map(sites.map((s) => [s.id, s.name]));
    const campaignMap = new Map(campaigns.map((c) => [c.id, c.name]));

    const leadsBySource = leadsBySourceRaw.map((r) => ({
      name: r.leadSourceId ? sourceMap.get(r.leadSourceId) || "Unknown" : "Unspecified",
      count: r._count.id,
    }));

    const leadsBySite = leadsBySiteRaw.map((r) => ({
      name: r.siteId ? siteMap.get(r.siteId) || "Unknown" : "Unspecified",
      count: r._count.id,
    }));

    const leadsByCampaign = leadsByCampaignRaw.map((r) => ({
      name: r.campaignId ? campaignMap.get(r.campaignId) || "Unknown" : "Organic / Direct",
      count: r._count.id,
    }));

    return NextResponse.json({
      summary: {
        totalLeads,
        uniqueCustomersCount,
        totalCalls,
        totalVisits,
        completedVisits,
        interestedLeads: feedbackMap.INTERESTED,
        callbacksDue: feedbackMap.CALL_BACK,
        notConnected: feedbackMap.NOT_CONNECTED,
        notInterested: feedbackMap.NOT_INTERESTED,
      },
      feedbackBreakdown: [
        { name: "Interested", count: feedbackMap.INTERESTED, color: "#10b981" },
        { name: "Call Back", count: feedbackMap.CALL_BACK, color: "#f59e0b" },
        { name: "Not Connected", count: feedbackMap.NOT_CONNECTED, color: "#64748b" },
        { name: "Not Interested", count: feedbackMap.NOT_INTERESTED, color: "#f43f5e" },
      ],
      leadsBySource,
      leadsBySite,
      leadsByCampaign,
      telecallerPerformance: telecallers.map((t) => ({
        name: t.name,
        assignedLeads: t._count.assignedTelecallerLeads,
        callsMade: t._count.callReports,
      })),
      leadsList: rawLeadsList.map((l) => ({
        id: l.id,
        displayId: l.displayId,
        customerName: l.customer.name,
        phone: l.customer.phone,
        location: l.customer.location,
        site: l.site?.name || "—",
        source: l.leadSource?.name || "—",
        campaign: l.campaign?.name || "—",
        telecaller: l.assignedTelecaller?.name || "Unassigned",
        status: l.lifecycleStatus,
        feedback: l.callFeedback || "—",
        createdAt: l.createdAt,
      })),
    });
  } catch (err) {
    console.error("Error generating reports:", err);
    return NextResponse.json({ error: "Failed to generate reports" }, { status: 500 });
  }
}
