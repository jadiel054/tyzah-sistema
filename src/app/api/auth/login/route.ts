import { NextRequest, NextResponse } from "next/server";
import { adminCookieName, checkPassword, createAdminSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    if (!checkPassword(String(password || ""))) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
    }
    const token = await createAdminSession();
    const res = NextResponse.json({ ok: true });
    res.cookies.set(adminCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
