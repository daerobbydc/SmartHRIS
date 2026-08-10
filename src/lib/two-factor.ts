import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";

// ==================== TWO-FACTOR AUTHENTICATION ====================

export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
  qrCodeUrl: string;
}

/**
 * Generate 2FA secret for user
 */
export async function generate2FASecret(userId: string, email: string): Promise<TwoFactorSetup> {
  const secret = speakeasy.generateSecret({
    name: `SmartHRIS (${email})`,
    issuer: "SmartHRIS",
    length: 20,
  });

  // Store secret (not enabled yet)
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: secret.base32,
      twoFactorEnabled: false,
    } as Record<string, unknown>,
  });

  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || "");

  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url || "",
    qrCodeUrl,
  };
}

/**
 * Verify 2FA token
 */
export function verify2FAToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 1,
  });
}

/**
 * Enable 2FA for user
 */
export async function enable2FA(userId: string, token: string): Promise<{ success: boolean; backupCodes?: string[] }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  }) as Record<string, unknown> | null;

  if (!user || !user.twoFactorSecret) {
    return { success: false };
  }

  const isValid = verify2FAToken(user.twoFactorSecret as string, token);
  if (!isValid) {
    return { success: false };
  }

  const backupCodes = Array.from({ length: 8 }, () =>
    Math.random().toString(36).substring(2, 8).toUpperCase()
  );

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: true,
      twoFactorBackupCodes: backupCodes.join(","),
    } as Record<string, unknown>,
  });

  return { success: true, backupCodes };
}

/**
 * Disable 2FA for user
 */
export async function disable2FA(userId: string): Promise<boolean> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: null,
    } as Record<string, unknown>,
  });
  return true;
}

/**
 * Verify backup code
 */
export async function verifyBackupCode(userId: string, code: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  }) as Record<string, unknown> | null;

  if (!user || !user.twoFactorBackupCodes) {
    return false;
  }

  const codes = (user.twoFactorBackupCodes as string).split(",");
  const codeIndex = codes.indexOf(code.toUpperCase());

  if (codeIndex === -1) {
    return false;
  }

  codes.splice(codeIndex, 1);
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorBackupCodes: codes.length > 0 ? codes.join(",") : null,
    } as Record<string, unknown>,
  });

  return true;
}

/**
 * Get 2FA status
 */
export async function get2FAStatus(userId: string): Promise<{
  enabled: boolean;
  backupCodesCount: number;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      twoFactorEnabled: true,
      twoFactorBackupCodes: true,
    },
  }) as Record<string, unknown> | null;

  return {
    enabled: (user?.twoFactorEnabled as boolean) || false,
    backupCodesCount: user?.twoFactorBackupCodes ? (user.twoFactorBackupCodes as string).split(",").length : 0,
  };
}

/**
 * Generate OTP for login verification
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
