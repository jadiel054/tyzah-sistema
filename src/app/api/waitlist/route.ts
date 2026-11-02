import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { waitlist } from "@/lib/db/schema";
import { isAdminAuthenticated } from "@/lib/auth";
import { normalizePhone, waLink } from "@/lib/slots";
import { shop } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const db = getDb();
    const rows = await db
      .select()
      .from(waitlist)
      .orderBy(desc(waitlist.createdAt))
      .limit(100);

    const withLinks = rows.map((r) => {
      const text =
        `🔥 *Vaga liberada — ${shop.name}*\n\n` +
        `Oi ${r.name}! Surgiu um horário.\n` +
        (r.serviceName ? `Serviço: ${r.serviceName}\n` : "") +
        `Agende agora: ${shop.appUrl}/agendar\n\n` +
        `Se não puder, me avisa.`;
      return {
        ...r,
        whatsappLink: waLink(r.phone, text),
      };
    });

    return NextResponse.json({ waitlist: withLinks });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const phone = normalizePhone(String(body.phone || ""));
    const serviceName = body.serviceName ? String(body.serviceName).trim() : null;
    const preferredDate = body.preferredDate ? String(body.preferredDate) : null;
    const notes = body.notes ? String(body.notes).trim() : null;

    if (!name || phone.length < 12) {
      return NextResponse.json({ error: "Nome e WhatsApp obrigatórios" }, { status: 400 });
    }

    const db = getDb();
    const [row] = await db
      .insert(waitlist)
      .values({
        name,
        phone,
        serviceName,
        preferredDate,
        notes,
        status: "waiting",
      })
      .returning();

    const shopText =
      `📋 *Lista de espera*\n${name}\nWhatsApp: ${phone}\n` +
      (serviceName ? `Serviço: ${serviceName}\n` : "") +
      (preferredDate ? `Preferência: ${preferredDate.split("-").reverse().join("/")}\n` : "");

    return NextResponse.json({
      ok: true,
      entry: row,
      whatsapp: {
        shop: waLink(shop.phone, shopText),
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao entrar na lista" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const body = await req.json();
    const id = String(body.id || "");
    const status = String(body.status || "");
    if (!id || !["waiting", "notified", "booked", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    const db = getDb();
    const [row] = await db
      .update(waitlist)
      .set({
        status,
        notifiedAt: status === "notified" ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(waitlist.id, id))
      .returning();
    return NextResponse.json({ entry: row });
  } catch (e) {
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
