import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { canManageCampaigns } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        leadSource: true,
        createdBy: { select: { id: true, name: true } },
        _count: {
          select: { leads: true },
        },
      },
    });

    return NextResponse.json({ campaigns });
  } catch (err) {
    console.error("Error fetching campaigns:", err);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManageCampaigns(user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Only Digital Head and General Manager can create campaigns." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      description,
      contentTitle,
      contentType,
      platform,
      startDate,
      endDate,
      status,
      leadSourceId,
      notes,
      mediaAttachmentUrl,
    } = body;

    if (!name || !contentTitle || !contentType || !platform) {
      return NextResponse.json(
        { error: "Campaign name, content title, content type, and platform are required." },
        { status: 400 }
      );
    }

    const campaign = await prisma.campaign.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        contentTitle: contentTitle.trim(),
        contentType,
        platform,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: status || "Active",
        leadSourceId: leadSourceId || null,
        notes: notes?.trim() || null,
        mediaAttachmentUrl: mediaAttachmentUrl?.trim() || null,
        createdById: user.id,
      },
      include: {
        leadSource: true,
        createdBy: true,
      },
    });

    await logAudit({
      userId: user.id,
      action: "CAMPAIGN_CREATED",
      entityType: "CAMPAIGN",
      entityId: campaign.id,
      details: { name: campaign.name, platform: campaign.platform, contentType: campaign.contentType },
    });

    return NextResponse.json({ success: true, campaign }, { status: 201 });
  } catch (err: any) {
    console.error("Error creating campaign:", err);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
