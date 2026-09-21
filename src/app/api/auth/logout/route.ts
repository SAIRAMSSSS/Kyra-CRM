import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, AUTH_COOKIE } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (user) {
      const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
      await logAudit({
        userId: user.id,
        action: "LOGOUT",
        entityType: "USER",
        entityId: user.id,
        details: { email: user.email },
        ipAddress: ip,
      });
    }

    const response = NextResponse.json({ success: true, message: "Logged out successfully" });
    response.cookies.delete(AUTH_COOKIE);
    return response;
  } catch (err: unknown) {
    console.error("Logout error:", err);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
