import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { canImportLeads } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canImportLeads(user.role)) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to import leads." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { rows, defaultSiteId, defaultSourceId, defaultTelecallerId } = body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No records provided for import." }, { status: 400 });
    }

    const results = {
      totalRows: rows.length,
      imported: 0,
      existingCustomerAttached: 0,
      failed: 0,
      errors: [] as { row: number; reason: string; data: any }[],
      createdLeads: [] as string[],
    };

    let baseCount = await prisma.lead.count();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      const name = String(row.name || row["Customer Name"] || row["customer_name"] || "").trim();
      const phone = String(row.phone || row["Phone"] || row["phone_number"] || "").trim();
      const location = String(row.location || row["Location"] || row["City"] || "").trim();
      const email = String(row.email || row["Email"] || "").trim();
      const notes = String(row.notes || row["Notes"] || "").trim();
      const priority = String(row.priority || "MEDIUM").toUpperCase();

      // Row-level validation
      if (!name) {
        results.failed++;
        results.errors.push({ row: rowNum, reason: "Missing required customer name", data: row });
        continue;
      }

      if (!phone || phone.length < 7) {
        results.failed++;
        results.errors.push({ row: rowNum, reason: "Invalid or missing phone number", data: row });
        continue;
      }

      if (!location) {
        results.failed++;
        results.errors.push({ row: rowNum, reason: "Missing customer location/city", data: row });
        continue;
      }

      try {
        // Check if customer exists
        let customer = await prisma.customer.findUnique({
          where: { phone },
        });

        if (!customer) {
          customer = await prisma.customer.create({
            data: {
              name,
              phone,
              email: email || null,
              location,
              notes: notes || null,
            },
          });
        } else {
          results.existingCustomerAttached++;
        }

        baseCount++;
        const displayId = `KYRA-LD-${1000 + baseCount}`;

        const lead = await prisma.lead.create({
          data: {
            displayId,
            customerId: customer.id,
            siteId: defaultSiteId || null,
            leadSourceId: defaultSourceId || null,
            priority: ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(priority) ? priority : "MEDIUM",
            lifecycleStatus: defaultTelecallerId ? "ASSIGNED" : "NEW",
            createdById: user.id,
            assignedTelecallerId: defaultTelecallerId || null,
            notes: notes ? `Imported via CSV: ${notes}` : "Imported via CSV batch",
          },
        });

        if (defaultTelecallerId) {
          await prisma.leadAssignmentHistory.create({
            data: {
              leadId: lead.id,
              toUserId: defaultTelecallerId,
              assignedById: user.id,
              notes: "Assigned during bulk CSV import",
            },
          });
        }

        results.imported++;
        results.createdLeads.push(displayId);
      } catch (rowErr: any) {
        results.failed++;
        results.errors.push({ row: rowNum, reason: rowErr.message || "Database insert error", data: row });
      }
    }

    // Record audit log
    await logAudit({
      userId: user.id,
      action: "LEAD_IMPORTED",
      entityType: "LEAD",
      details: {
        totalRows: results.totalRows,
        imported: results.imported,
        failed: results.failed,
        errorsCount: results.errors.length,
      },
    });

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (err: any) {
    console.error("Error running CSV import:", err);
    return NextResponse.json({ error: "Failed to process CSV import" }, { status: 500 });
  }
}
