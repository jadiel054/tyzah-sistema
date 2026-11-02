import { NextRequest, NextResponse } from "next/server";
import { adminCookieName, checkPassword, createAdminSession } from "@/lib/auth";
import { checkRateLimit, getClientIp, resetRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const rateLimitKey = `login:${ip}`;

    // Limit login attempts: 5 attempts per 15 minutes per IP
    const limit = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);
    if (!limit.success) {
      return NextResponse.json(
        {
          error: "Muitas tentativas de login incorretas. Tente novamente mais tarde.",
          retryAfterMs: Math.max(0, limit.resetAt - Date.now()),
        },
        { status: 429 }
      );
    }

    const { password } = await req.json();
    const isValid = await checkPassword(String(password || ""));
    if (!isValid) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
    }

    // Reset rate limit on successful authentication
    resetRateLimit(rateLimitKey);

    const token = await createAdminSession();
    const res = NextResponse.json({ ok: true });
    res.cookies.set(adminCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 14, // 14 days
    });
    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro no servidor" },
      { status: 500 }
    );
  }
}
