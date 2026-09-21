import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { canManageCampaigns } from "@/lib/rbac";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManageCampaigns(user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Only Digital Head and General Manager can manage campaigns." },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        contentTitle: body.contentTitle,
        contentType: body.contentType,
        platform: body.platform,
        status: body.status,
        leadSourceId: body.leadSourceId,
        notes: body.notes,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
      },
      include: { leadSource: true },
    });

    await logAudit({
      userId: user.id,
      action: "CAMPAIGN_UPDATED",
      entityType: "CAMPAIGN",
      entityId: updated.id,
      details: body,
    });

    return NextResponse.json({ success: true, campaign: updated });
  } catch (err: any) {
    console.error("Error updating campaign:", err);
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
  }
}
