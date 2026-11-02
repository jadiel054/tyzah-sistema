import { NextRequest, NextResponse } from "next/server";
import { desc, eq, ilike, or } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { isAdminAuthenticated } from "@/lib/auth";
import { normalizePhone } from "@/lib/slots";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const q = req.nextUrl.searchParams.get("q")?.trim();
    const db = getDb();
    if (q) {
      const rows = await db
        .select()
        .from(clients)
        .where(or(ilike(clients.name, `%${q}%`), ilike(clients.phone, `%${q}%`)))
        .orderBy(desc(clients.updatedAt))
        .limit(40);
      return NextResponse.json({ clients: rows });
    }
    const rows = await db.select().from(clients).orderBy(desc(clients.updatedAt)).limit(100);
    return NextResponse.json({ clients: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const body = await req.json();
    const id = String(body.id || "");
    if (!id) return NextResponse.json({ error: "id" }, { status: 400 });

    const db = getDb();
    const [row] = await db
      .update(clients)
      .set({
        name: body.name !== undefined ? String(body.name) : undefined,
        notes: body.notes !== undefined ? String(body.notes) : undefined,
        photoUrl: body.photoUrl !== undefined ? String(body.photoUrl) : undefined,
        lastService: body.lastService !== undefined ? String(body.lastService) : undefined,
        phone: body.phone !== undefined ? normalizePhone(String(body.phone)) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(clients.id, id))
      .returning();
    return NextResponse.json({ client: row });
  } catch (e) {
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
