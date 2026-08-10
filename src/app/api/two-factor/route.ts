import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import { generate2FASecret, enable2FA, disable2FA, get2FAStatus, verifyBackupCode } from "@/lib/two-factor";

// GET - Get 2FA status
export async function GET(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const status = await get2FAStatus(auth.userId);
    return NextResponse.json(status);
  } catch (error) {
    console.error("2FA status error:", error);
    return NextResponse.json({ error: "Gagal mengambil status 2FA" }, { status: 500 });
  }
}

// POST - Setup 2FA
export async function POST(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { action, token, code } = await req.json();

    if (action === "setup") {
      // Generate new 2FA secret
      const user = await import("@/lib/prisma").then(m => m.prisma.user.findUnique({
        where: { id: auth.userId },
        select: { email: true },
      }));

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const setup = await generate2FASecret(auth.userId, user.email);
      return NextResponse.json(setup);
    }

    if (action === "enable" && token) {
      const result = await enable2FA(auth.userId, token);
      if (result.success) {
        return NextResponse.json({ success: true, backupCodes: result.backupCodes });
      }
      return NextResponse.json({ error: "Token tidak valid" }, { status: 400 });
    }

    if (action === "disable") {
      await disable2FA(auth.userId);
      return NextResponse.json({ success: true });
    }

    if (action === "verify_backup" && code) {
      const valid = await verifyBackupCode(auth.userId, code);
      return NextResponse.json({ valid });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("2FA error:", error);
    return NextResponse.json({ error: "Gagal memproses 2FA" }, { status: 500 });
  }
}
