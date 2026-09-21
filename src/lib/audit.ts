import { prisma } from "./prisma";

interface LogAuditParams {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown> | string;
  ipAddress?: string;
}

export async function logAudit({
  userId,
  action,
  entityType,
  entityId,
  details,
  ipAddress,
}: LogAuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entityType,
        entityId: entityId || null,
        details: typeof details === "object" ? JSON.stringify(details) : details || null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (err) {
    console.error("Failed to write audit log entry:", err);
  }
}
