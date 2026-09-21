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
    const phone = searchParams.get("phone");

    if (!phone || phone.trim().length < 6) {
      return NextResponse.json({ exists: false });
    }

    const cleanPhone = phone.trim();

    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          { altPhone: cleanPhone },
        ],
      },
      include: {
        leads: {
          select: {
            id: true,
            displayId: true,
            lifecycleStatus: true,
            createdAt: true,
          },
        },
      },
    });

    if (customer) {
      return NextResponse.json({
        exists: true,
        customer: {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          location: customer.location,
          leadsCount: customer.leads.length,
          recentLead: customer.leads[0] || null,
        },
      });
    }

    return NextResponse.json({ exists: false });
  } catch (err) {
    console.error("Error checking phone duplicate:", err);
    return NextResponse.json({ error: "Failed to check phone" }, { status: 500 });
  }
}
