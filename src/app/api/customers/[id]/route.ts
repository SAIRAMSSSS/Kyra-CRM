import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        leads: {
          include: {
            site: true,
            leadSource: true,
            campaign: true,
            assignedTelecaller: { select: { id: true, name: true, email: true } },
            callReports: {
              orderBy: { calledAt: "desc" },
              include: {
                telecaller: { select: { name: true } },
              },
            },
          },
        },
        siteVisits: {
          orderBy: { scheduledDate: "desc" },
          include: {
            site: true,
            assignedSiteManager: { select: { name: true } },
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ customer });
  } catch (err) {
    console.error("Error fetching customer 360:", err);
    return NextResponse.json({ error: "Failed to load customer profile" }, { status: 500 });
  }
}
