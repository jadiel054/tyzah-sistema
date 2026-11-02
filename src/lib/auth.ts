import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE = "tyzah_admin";

function secret() {
  const s = process.env.JWT_SECRET || process.env.ADMIN_PASSWORD || "dev-secret-change-me";
  return new TextEncoder().encode(s);
}

export async function createAdminSession(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(secret());
}

export async function verifyAdminSession(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secret());
    return true;
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  const t = jar.get(COOKIE)?.value;
  if (!t) return false;
  return verifyAdminSession(t);
}

export function adminCookieName() {
  return COOKIE;
}

export function checkPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || "tyzah2026";
  return password === expected;
}
