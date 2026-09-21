import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { location: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: {
        leads: {
          select: {
            id: true,
            displayId: true,
            lifecycleStatus: true,
            callFeedback: true,
            site: { select: { name: true } },
            assignedTelecaller: { select: { name: true } },
          },
        },
        siteVisits: {
          select: {
            id: true,
            displayId: true,
            status: true,
            scheduledDate: true,
            site: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json({ customers });
  } catch (err) {
    console.error("Error fetching customers:", err);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}
