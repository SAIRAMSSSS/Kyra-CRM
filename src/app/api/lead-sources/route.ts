import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const leadSources = await prisma.leadSource.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { leads: true },
        },
      },
    });
    return NextResponse.json({ leadSources });
  } catch (err) {
    console.error("Error fetching lead sources:", err);
    return NextResponse.json({ error: "Failed to fetch lead sources" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Lead source name is required." }, { status: 400 });
    }

    const leadSource = await prisma.leadSource.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isActive: true,
      },
    });

    await logAudit({
      userId: user.id,
      action: "LEAD_SOURCE_CREATED",
      entityType: "LEAD_SOURCE",
      entityId: leadSource.id,
      details: { name: leadSource.name },
    });

    return NextResponse.json({ success: true, leadSource }, { status: 201 });
  } catch (err: any) {
    console.error("Error creating lead source:", err);
    return NextResponse.json({ error: "Failed to create lead source" }, { status: 500 });
  }
}
