import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

/**
 * Configure DATABASE_URL dynamically for local development & Vercel / serverless deployments.
 * On Vercel, serverless function roots (/var/task) are read-only.
 * We automatically copy the pre-seeded SQLite database to writable /tmp so both reads and writes work seamlessly.
 */
function initDatabaseUrl() {
  const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
  const currentUrl = process.env.DATABASE_URL?.trim();

  if (isVercel) {
    const srcDb = path.join(process.cwd(), "prisma", "dev.db");
    const tmpDb = path.join("/tmp", "dev.db");

    // Copy bundled seed database to writable /tmp on cold start
    try {
      if (fs.existsSync(srcDb) && !fs.existsSync(tmpDb)) {
        fs.copyFileSync(srcDb, tmpDb);
      }
    } catch (err) {
      console.warn("Notice: Could not copy seed DB to /tmp:", err);
    }

    // Always route to writable /tmp/dev.db on Vercel unless an external database is deliberately specified
    if (!currentUrl || currentUrl.startsWith("file:") || currentUrl.startsWith("postgres")) {
      process.env.DATABASE_URL = `file:${tmpDb}`;
    }
  } else {
    // Local fallback: use absolute path to prisma/dev.db if DATABASE_URL is unset
    if (!currentUrl) {
      const localDb = path.join(process.cwd(), "prisma", "dev.db");
      process.env.DATABASE_URL = `file:${localDb}`;
    }
  }
}

initDatabaseUrl();

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
