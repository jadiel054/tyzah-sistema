import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { blockedSlots } from "@/lib/db/schema";
import { isAdminAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const date = req.nextUrl.searchParams.get("date");
    const db = getDb();
    if (date) {
      const rows = await db.select().from(blockedSlots).where(eq(blockedSlots.date, date));
      return NextResponse.json({ blocks: rows });
    }
    const rows = await db.select().from(blockedSlots);
    return NextResponse.json({ blocks: rows });
  } catch (e) {
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const body = await req.json();
    const date = String(body.date || "");
    if (!date) return NextResponse.json({ error: "date obrigatória" }, { status: 400 });

    const db = getDb();
    const [row] = await db
      .insert(blockedSlots)
      .values({
        date,
        startTime: body.startTime || null,
        endTime: body.endTime || null,
        reason: body.reason || null,
      })
      .returning();
    return NextResponse.json({ block: row });
  } catch (e) {
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id" }, { status: 400 });
    const db = getDb();
    await db.delete(blockedSlots).where(eq(blockedSlots.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
