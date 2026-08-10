import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "smarthris_enterprise_secret_key_32b!"; // Must be 32 bytes
const IV_LENGTH = 16;

/**
 * Encrypts sensitive text using AES-256-CBC
 */
export function encryptField(text: string | null | undefined): string | null {
  if (!text) return null;
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
  } catch (error) {
    console.error("Encryption error:", error);
    return null;
  }
}

/**
 * Decrypts sensitive text using AES-256-CBC
 */
export function decryptField(encryptedText: string | null | undefined): string | null {
  if (!encryptedText || !encryptedText.includes(":")) return encryptedText || null;
  try {
    const [ivHex, encryptedHex] = encryptedText.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    return "[Encrypted Data]";
  }
}

/**
 * Mask NIK for privacy (e.g. "3171********0001")
 */
export function maskNIK(nik?: string | null): string {
  if (!nik) return "-";
  if (nik.length < 8) return "********";
  return `${nik.slice(0, 4)}********${nik.slice(-4)}`;
}

/**
 * Mask Bank Account Number for privacy (e.g. "****5678")
 */
export function maskBankAccount(acc?: string | null): string {
  if (!acc) return "-";
  if (acc.length < 4) return "****";
  return `****${acc.slice(-4)}`;
}

/**
 * Log Audit Event to database
 */
export interface AuditLogOptions {
  userId?: string | null;
  userName?: string | null;
  userRole?: string | null;
  action: "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "REJECT" | "VIEW_PAYROLL" | "LOGIN";
  entity: "Employee" | "Payroll" | "Leave" | "Attendance" | "SalaryComponent" | "OfficeLocation" | "System";
  entityId?: string | null;
  details?: string | null;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function createAuditLog(options: AuditLogOptions) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: options.userId || null,
        userName: options.userName || null,
        userRole: options.userRole || null,
        action: options.action,
        entity: options.entity,
        entityId: options.entityId || null,
        details: options.details || null,
        oldData: options.oldData ? JSON.stringify(options.oldData) : null,
        newData: options.newData ? JSON.stringify(options.newData) : null,
        ipAddress: options.ipAddress || "127.0.0.1",
        userAgent: options.userAgent || "SmartHRIS Secure Client",
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
    return null;
  }
}
