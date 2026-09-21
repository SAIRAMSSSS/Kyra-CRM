import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { canManageSites } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sites = await prisma.site.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { leads: true, siteVisits: true },
        },
      },
    });
    return NextResponse.json({ sites });
  } catch (err) {
    console.error("Error fetching sites:", err);
    return NextResponse.json({ error: "Failed to fetch sites" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManageSites(user.role)) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to add project sites." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, location, address, description } = body;

    if (!name || !location) {
      return NextResponse.json(
        { error: "Site name and location are required." },
        { status: 400 }
      );
    }

    const site = await prisma.site.create({
      data: {
        name: name.trim(),
        location: location.trim(),
        address: address?.trim() || null,
        description: description?.trim() || null,
        isActive: true,
      },
    });

    await logAudit({
      userId: user.id,
      action: "SITE_CREATED",
      entityType: "SITE",
      entityId: site.id,
      details: { name: site.name, location: site.location },
    });

    return NextResponse.json({ success: true, site }, { status: 201 });
  } catch (err: any) {
    console.error("Error creating site:", err);
    return NextResponse.json({ error: "Failed to create site" }, { status: 500 });
  }
}
