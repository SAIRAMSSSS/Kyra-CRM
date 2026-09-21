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
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const feedback = searchParams.get("feedback");
    const siteId = searchParams.get("siteId");
    const telecallerId = searchParams.get("telecallerId");
    const priority = searchParams.get("priority");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    // Role-based scoping
    if (user.role === "TELECALLER") {
      where.assignedTelecallerId = user.id;
    } else if (user.role === "SITE_MANAGER") {
      where.assignedSiteId = user.id;
    }

    // Specific status filters
    if (status) {
      if (status === "unassigned") {
        where.assignedTelecallerId = null;
      } else {
        where.lifecycleStatus = status;
      }
    }

    if (feedback) {
      where.callFeedback = feedback;
    }

    if (siteId) {
      where.siteId = siteId;
    }

    if (telecallerId && user.role !== "TELECALLER") {
      where.assignedTelecallerId = telecallerId === "unassigned" ? null : telecallerId;
    }

    if (priority) {
      where.priority = priority;
    }

    const sourceId = searchParams.get("sourceId");

    // Search query
    if (search) {
      where.OR = [
        { displayId: { contains: search } },
        { enquiryNo: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { phone: { contains: search } } },
        { customer: { location: { contains: search } } },
        { customer: { profession: { contains: search } } },
      ];
    }

    if (sourceId) {
      where.leadSourceId = sourceId;
    }

    const [total, leads] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        include: {
          customer: true,
          site: true,
          leadSource: true,
          campaign: true,
          assignedTelecaller: { select: { id: true, name: true, email: true } },
          assignedSiteManager: { select: { id: true, name: true } },
          _count: {
            select: {
              callReports: true,
              siteVisits: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Error fetching leads:", err);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
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
      customerName,
      phone,
      altPhone,
      email,
      location,
      address,
      profession,
      preferredTime,
      enquiryNo,
      preferredContact,
      notes,
      siteId,
      leadSourceId,
      campaignId,
      priority,
      assignedTelecallerId,
      assignedSiteId,
      metaPlatform,
      metaAdName,
      metaCampaignName,
      metaLeadId,
    } = body;

    if (!customerName || !phone || !location) {
      return NextResponse.json(
        { error: "Customer name, phone number, and location are required." },
        { status: 400 }
      );
    }

    const cleanPhone = String(phone).trim();

    // Check duplicate customer phone
    let customer = await prisma.customer.findUnique({
      where: { phone: cleanPhone },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: customerName.trim(),
          phone: cleanPhone,
          altPhone: altPhone ? String(altPhone).trim() : null,
          email: email ? String(email).trim().toLowerCase() : null,
          location: location.trim(),
          address: address ? String(address).trim() : null,
          profession: profession ? profession.trim() : null,
          preferredContact: preferredContact || "Phone",
          notes: notes || null,
        },
      });
    } else if (profession && !customer.profession) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: { profession: profession.trim() },
      });
    }

    // Generate unique displayId: KYRA-LD-<num>
    const count = await prisma.lead.count();
    const displayId = `KYRA-LD-${1001 + count}`;
    const autoEnquiryNo = enquiryNo || `E${String(count + 1).padStart(2, "0")}`;

    const lead = await prisma.lead.create({
      data: {
        displayId,
        enquiryNo: autoEnquiryNo,
        customerId: customer.id,
        siteId: siteId || null,
        leadSourceId: leadSourceId || null,
        campaignId: campaignId || null,
        priority: priority || "MEDIUM",
        lifecycleStatus: assignedTelecallerId ? "ASSIGNED" : "NEW",
        preferredTime: preferredTime || null,
        metaPlatform: metaPlatform || null,
        metaAdName: metaAdName || null,
        metaCampaignName: metaCampaignName || null,
        metaLeadId: metaLeadId || null,
        createdById: user.id,
        assignedCrmId: user.role === "CRM_EXECUTIVE" ? user.id : null,
        assignedTelecallerId: assignedTelecallerId || null,
        assignedSiteId: assignedSiteId || null,
        notes: notes || null,
      },
      include: {
        customer: true,
        site: true,
        assignedTelecaller: true,
      },
    });

    // Record assignment history if assigned
    if (assignedTelecallerId) {
      await prisma.leadAssignmentHistory.create({
        data: {
          leadId: lead.id,
          toUserId: assignedTelecallerId,
          assignedById: user.id,
          notes: "Initial assignment upon creation",
        },
      });

      // Send notification to telecaller
      await createNotification({
        userId: assignedTelecallerId,
        type: "LEAD_ASSIGNED",
        title: "New Lead Assigned",
        message: `Lead ${lead.displayId} (${customer.name}) assigned to you.`,
        linkUrl: `/leads/${lead.displayId}`,
      });
    }

    // Audit log
    await logAudit({
      userId: user.id,
      action: "LEAD_CREATED",
      entityType: "LEAD",
      entityId: lead.id,
      details: {
        displayId: lead.displayId,
        customerName: customer.name,
        phone: customer.phone,
        assignedTo: assignedTelecallerId,
      },
    });

    return NextResponse.json({ success: true, lead }, { status: 201 });
  } catch (err: unknown) {
    console.error("Error creating lead:", err);
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}
