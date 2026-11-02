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
    if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) {
      const trimmed = String(body.name).trim();
      if (!trimmed) {
        return NextResponse.json({ error: "Nome não pode ser vazio" }, { status: 400 });
      }
      updateData.name = trimmed;
    }

    if (body.phone !== undefined) {
      const norm = normalizePhone(String(body.phone));
      if (norm.length < 12) {
        return NextResponse.json({ error: "Telefone inválido" }, { status: 400 });
      }
      updateData.phone = norm;
    }

    // Crucial: Handle null and whitespace strings explicitly without converting to "null"
    if (body.notes !== undefined) {
      const val = body.notes === null ? null : String(body.notes).trim();
      updateData.notes = !val ? null : val;
    }

    if (body.photoUrl !== undefined) {
      const val = body.photoUrl === null ? null : String(body.photoUrl).trim();
      updateData.photoUrl = !val ? null : val;
    }

    if (body.lastService !== undefined) {
      const val = body.lastService === null ? null : String(body.lastService).trim();
      updateData.lastService = !val ? null : val;
    }

    const db = getDb();
    const [row] = await db
      .update(clients)
      .set(updateData)
      .where(eq(clients.id, id))
      .returning();

    return NextResponse.json({ client: row });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao atualizar cliente" }, { status: 500 });
  }
}
