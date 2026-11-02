import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const COOKIE = "tyzah_admin";

function getJwtSecret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s || s === "dev-secret-change-me") {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CRITICAL SECURITY CONFIGURATION ERROR: JWT_SECRET must be set and cannot be the default value in production."
      );
    }
    // Only in non-production development with warning
    console.warn(
      "[WARN] Using temporary dev JWT secret. Set JWT_SECRET in .env.local immediately."
    );
    return new TextEncoder().encode("development-only-temporary-secret-32-chars-min");
  }
  return new TextEncoder().encode(s);
}

export async function createAdminSession(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(getJwtSecret());
}

export async function verifyAdminSession(token: string): Promise<boolean> {
  try {
    const verified = await jwtVerify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    });
    // Explicitly validate role claim
    if (verified.payload && verified.payload.role === "admin") {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  try {
    const jar = await cookies();
    const t = jar.get(COOKIE)?.value;
    if (!t) return false;
    return await verifyAdminSession(t);
  } catch {
    return false;
  }
}

export function adminCookieName() {
  return COOKIE;
}

export async function checkPassword(password: string): Promise<boolean> {
  if (!password) return false;

  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const plainPassword = process.env.ADMIN_PASSWORD;

  if (!passwordHash && (!plainPassword || plainPassword === "tyzah2026" || plainPassword === "troque-esta-senha")) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CRITICAL SECURITY CONFIGURATION ERROR: ADMIN_PASSWORD or ADMIN_PASSWORD_HASH must be configured securely and cannot use default passwords in production."
      );
    }
  }

  // 1. If bcrypt hash is provided, verify using bcrypt
  if (passwordHash) {
    try {
      return await bcrypt.compare(password, passwordHash);
    } catch (err) {
      console.error("Error comparing bcrypt password hash:", err);
      return false;
    }
  }

  // 2. If plain password is set (or check if it's already a bcrypt hash)
  if (plainPassword) {
    if (plainPassword.startsWith("$2a$") || plainPassword.startsWith("$2b$") || plainPassword.startsWith("$2y$")) {
      return await bcrypt.compare(password, plainPassword);
    }
    // Direct comparison for development fallback if hash not configured
    return password === plainPassword;
  }

  return false;
}
