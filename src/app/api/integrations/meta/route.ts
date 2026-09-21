import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notify";

export const dynamic = "force-dynamic";

// GET: 1. Handles Meta's webhook verification challenge (hub.mode, hub.verify_token, hub.challenge)
//      2. Returns integration status, config, and ingestion logs for the CRM UI
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hubMode = searchParams.get("hub.mode");
    const hubVerifyToken = searchParams.get("hub.verify_token");
    const hubChallenge = searchParams.get("hub.challenge");

    // Check if this is a Meta Webhook verification handshake
    if (hubMode && hubVerifyToken) {
      // Find or get configured verify token
      let config = await prisma.metaIntegrationConfig.findUnique({
        where: { id: "default" },
      });
      const expectedToken = config?.verifyToken || "kyra_meta_leads_webhook_token_2026";

      if (hubMode === "subscribe" && hubVerifyToken === expectedToken) {
        // Return raw challenge as plain text with 200 OK
        return new NextResponse(hubChallenge || "", {
          status: 200,
          headers: { "Content-Type": "text/plain" },
        });
      }

      return NextResponse.json({ error: "Verification token mismatch" }, { status: 403 });
    }

    // Otherwise, this is a CRM internal request to fetch integration status and logs
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let config = await prisma.metaIntegrationConfig.findUnique({
      where: { id: "default" },
    });

    if (!config) {
      config = await prisma.metaIntegrationConfig.create({
        data: {
          id: "default",
          isEnabled: true,
          webhookUrl: "/api/integrations/meta",
          verifyToken: "kyra_meta_leads_webhook_token_2026",
          adAccountId: "act_849201948201",
          pageAccessToken: "EAAB...kyra_meta_access_token_production",
          autoAssignRole: "TELECALLER",
        },
      });
    }

    const [totalIngested, fbCount, igCount, recentLogs] = await Promise.all([
      prisma.metaLeadLog.count(),
      prisma.metaLeadLog.count({ where: { platform: "Facebook" } }),
      prisma.metaLeadLog.count({ where: { platform: "Insta" } }),
      prisma.metaLeadLog.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Active telecallers for round-robin assignment display
    const telecallers = await prisma.user.findMany({
      where: { role: "TELECALLER", status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: { assignedTelecallerLeads: true },
        },
      },
    });

    return NextResponse.json({
      config,
      stats: {
        totalIngested,
        facebookLeads: fbCount,
        instagramLeads: igCount,
        activeTelecallersCount: telecallers.length,
      },
      telecallers,
      recentLogs,
    });
  } catch (err: any) {
    console.error("Meta integration GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Ingests incoming Meta Lead Ads (Webhook payload or Test Simulation payload)
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let body: any = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    let customerName = "";
    let phone = "";
    let email = "";
    let place = "";
    let profession = "";
    let platform = "Facebook";
    let campaignName = "Meta Real Estate Campaign";
    let adName = "Lead Ad Form";
    let metaLeadId = `meta_${Date.now()}`;
    let siteId: string | null = null;

    // Check if this is a simulation from the CRM UI or direct payload
    if (body.action === "SIMULATE_OR_INGEST" || body.customerName) {
      customerName = body.customerName || "Meta Prospect";
      phone = body.phone || "";
      email = body.email || "";
      place = body.place || body.location || "Coimbatore";
      profession = body.profession || "Business Professional";
      platform = body.platform === "Insta" || body.platform === "Instagram" ? "Insta" : "Facebook";
      campaignName = body.campaignName || "Monsoon Farmland Harvest 2026";
      adName = body.adName || "KYRA Sponsored Feed Ad";
      siteId = body.siteId || null;
      metaLeadId = body.metaLeadId || `meta_sim_${Date.now()}`;
    } else if (body.object === "page" && Array.isArray(body.entry)) {
      // Official Meta Webhook structure
      const entry = body.entry[0];
      const change = entry?.changes?.[0];
      const val = change?.value || {};
      metaLeadId = val.leadgen_id || `meta_${Date.now()}`;
      campaignName = val.campaign_name || "Meta Lead Ad Campaign";
      adName = val.ad_name || "Sponsored Ad";
      platform = (val.platform || "").toLowerCase().includes("ig") || (val.platform || "").toLowerCase().includes("insta")
        ? "Insta"
        : "Facebook";

      // If simulated or passed field data
      if (val.field_data && Array.isArray(val.field_data)) {
        for (const item of val.field_data) {
          const name = (item.name || "").toLowerCase();
          const valStr = item.values?.[0] || "";
          if (name.includes("full_name") || name.includes("name")) customerName = valStr;
          else if (name.includes("phone")) phone = valStr;
          else if (name.includes("email")) email = valStr;
          else if (name.includes("city") || name.includes("location") || name.includes("place")) place = valStr;
          else if (name.includes("profession") || name.includes("job") || name.includes("occupation")) profession = valStr;
        }
      }
    }

    if (!customerName) customerName = "Meta Ad Inquirer";
    if (!phone) phone = `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`;
    if (!place) place = "Coimbatore";

    const cleanPhone = phone.trim();

    // 1. Check or create Customer
    let customer = await prisma.customer.findUnique({
      where: { phone: cleanPhone },
    });

    let isDuplicateCustomer = false;
    if (customer) {
      isDuplicateCustomer = true;
      // Update profession and location if not present
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          profession: customer.profession || (profession || null),
          location: customer.location || place,
          email: customer.email || (email ? email.toLowerCase().trim() : null),
        },
      });
    } else {
      customer = await prisma.customer.create({
        data: {
          name: customerName.trim(),
          phone: cleanPhone,
          email: email ? email.toLowerCase().trim() : null,
          location: place.trim(),
          profession: profession ? profession.trim() : null,
          preferredContact: platform === "Insta" ? "WhatsApp" : "Phone",
        },
      });
    }

    // 2. Resolve LeadSource: Look for "Facebook" or "Insta" or create if missing
    const targetSourceName = platform === "Insta" ? "Insta" : "Facebook";
    let leadSource = await prisma.leadSource.findFirst({
      where: {
        OR: [
          { name: targetSourceName },
          { name: { contains: targetSourceName } },
          { name: { contains: "Meta" } },
        ],
      },
    });

    if (!leadSource) {
      leadSource = await prisma.leadSource.create({
        data: {
          name: targetSourceName,
          description: `Direct inbound leads from ${platform} Lead Ad campaigns`,
        },
      });
    }

    // 3. Resolve Project Site
    if (!siteId) {
      const defaultSite = await prisma.site.findFirst({
        where: { isActive: true },
      });
      siteId = defaultSite?.id || null;
    }

    // 4. Resolve Campaign
    let campaign = await prisma.campaign.findFirst({
      where: {
        OR: [
          { name: { contains: campaignName } },
          { platform: { contains: "Meta" } },
        ],
      },
    });

    // 5. Automatic Round-Robin Assignment to active Telecallers
    const activeTelecallers = await prisma.user.findMany({
      where: { role: "TELECALLER", status: "ACTIVE" },
      include: {
        _count: {
          select: { assignedTelecallerLeads: true },
        },
      },
      orderBy: {
        assignedTelecallerLeads: {
          _count: "asc", // Pick telecaller with least assigned leads
        },
      },
    });

    const assignedTelecaller = activeTelecallers.length > 0 ? activeTelecallers[0] : null;

    // 6. Generate Display ID & Serial (Enquiry Number)
    const count = await prisma.lead.count();
    const displayId = `KYRA-LD-${1001 + count}`;
    const enquiryNo = `E${String(count + 1).padStart(2, "0")}`;

    // 7. Find GM or System User for createdById
    const systemUser = await prisma.user.findFirst({
      where: {
        OR: [{ role: "DIGITAL_HEAD" }, { role: "GENERAL_MANAGER" }],
      },
    });
    const createdById = systemUser?.id || (assignedTelecaller?.id as string);

    // 8. Create Lead
    const lead = await prisma.lead.create({
      data: {
        displayId,
        enquiryNo,
        customerId: customer.id,
        siteId,
        leadSourceId: leadSource?.id || null,
        campaignId: campaign?.id || null,
        lifecycleStatus: assignedTelecaller ? "ASSIGNED" : "NEW",
        priority: "HIGH", // Meta ad leads are warm, set to HIGH priority
        preferredTime: "10:30 AM",
        metaLeadId,
        metaPlatform: platform,
        metaAdName: adName,
        metaCampaignName: campaignName,
        createdById,
        assignedTelecallerId: assignedTelecaller?.id || null,
        notes: `Inbound lead from Meta Ad Manager [${platform}: ${campaignName} | ${adName}]`,
      },
      include: {
        customer: true,
        site: true,
        leadSource: true,
        assignedTelecaller: { select: { id: true, name: true, email: true } },
      },
    });

    // 9. Record Assignment History & Dispatch Telecaller Notification
    if (assignedTelecaller) {
      await prisma.leadAssignmentHistory.create({
        data: {
          leadId: lead.id,
          toUserId: assignedTelecaller.id,
          assignedById: createdById,
          notes: `Auto-assigned via Meta Ad Manager Round-Robin engine (${platform} Lead Ad)`,
        },
      });

      await createNotification({
        userId: assignedTelecaller.id,
        type: "LEAD_ASSIGNED",
        title: `🚀 New ${platform} Lead: ${customer.name}`,
        message: `${customer.name} (${customer.profession || "Prospect"}, ${customer.location}) inquired via ${campaignName}. Call now!`,
        linkUrl: `/leads/${lead.displayId}`,
      });
    }

    // 10. Record in MetaLeadLog
    const metaLog = await prisma.metaLeadLog.create({
      data: {
        metaLeadId,
        platform,
        campaignName,
        adName,
        customerName: customer.name,
        phone: customer.phone,
        place: customer.location,
        profession: customer.profession,
        status: isDuplicateCustomer ? "MERGED_EXISTING" : "SUCCESS",
        assignedToId: assignedTelecaller?.name || "Unassigned",
        leadId: lead.displayId,
        rawPayload: JSON.stringify(body).slice(0, 1000),
      },
    });

    // 11. Record System Audit Log
    await logAudit({
      userId: createdById,
      action: "META_LEAD_INGESTED",
      entityType: "META_INTEGRATION",
      entityId: lead.id,
      details: {
        metaLeadId,
        platform,
        campaignName,
        customerName: customer.name,
        phone: customer.phone,
        profession: customer.profession,
        assignedTo: assignedTelecaller?.name,
        enquiryNo: lead.enquiryNo,
      },
    });

    // Update config lastSyncAt
    await prisma.metaIntegrationConfig.upsert({
      where: { id: "default" },
      update: { lastSyncAt: new Date() },
      create: {
        id: "default",
        isEnabled: true,
        lastSyncAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Meta Lead successfully ingested and assigned to ${assignedTelecaller?.name || "Queue"}`,
      lead,
      metaLog,
    });
  } catch (err: any) {
    console.error("Meta integration POST error:", err);
    return NextResponse.json({ error: err.message || "Failed to process Meta Lead" }, { status: 500 });
  }
}

// PUT: Update Meta Integration settings
export async function PUT(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "GENERAL_MANAGER" && user.role !== "DIGITAL_HEAD" && user.role !== "CRM_EXECUTIVE")) {
      return NextResponse.json({ error: "Forbidden: Only Administrators can update Meta settings" }, { status: 403 });
    }

    const body = await req.json();
    const { isEnabled, verifyToken, adAccountId, pageAccessToken, autoAssignRole } = body;

    const config = await prisma.metaIntegrationConfig.upsert({
      where: { id: "default" },
      update: {
        isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : true,
        verifyToken: verifyToken || "kyra_meta_leads_webhook_token_2026",
        adAccountId: adAccountId || "act_849201948201",
        pageAccessToken: pageAccessToken || "EAAB...kyra_token",
        autoAssignRole: autoAssignRole || "TELECALLER",
      },
      create: {
        id: "default",
        isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : true,
        verifyToken: verifyToken || "kyra_meta_leads_webhook_token_2026",
        adAccountId: adAccountId || "act_849201948201",
        pageAccessToken: pageAccessToken || "EAAB...kyra_token",
        autoAssignRole: autoAssignRole || "TELECALLER",
      },
    });

    await logAudit({
      userId: user.id,
      action: "SETTINGS_UPDATED",
      entityType: "META_INTEGRATION",
      details: { configUpdated: true },
    });

    return NextResponse.json({ success: true, config });
  } catch (err: any) {
    console.error("Meta integration PUT error:", err);
    return NextResponse.json({ error: "Failed to update Meta settings" }, { status: 500 });
  }
}
