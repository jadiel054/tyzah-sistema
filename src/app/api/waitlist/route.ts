import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { waitlist } from "@/lib/db/schema";
import { isAdminAuthenticated } from "@/lib/auth";
import { normalizePhone, waLink } from "@/lib/slots";
import { shop } from "@/lib/config";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

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
    const ip = getClientIp(req.headers);
    const limit = checkRateLimit(`waitlist:${ip}`, 5, 60 * 1000);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde um instante para entrar na lista de espera." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const name = String(body.name || "").trim();
    const rawPhone = String(body.phone || "").trim();
    const phone = normalizePhone(rawPhone);
    const serviceName = body.serviceName ? String(body.serviceName).trim() : null;
    const preferredDate = body.preferredDate ? String(body.preferredDate).trim() : null;
    const notes = body.notes ? String(body.notes).trim() : null;

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Nome obrigatório e válido." }, { status: 400 });
    }
    if (phone.length < 12 || phone.length > 13) {
      return NextResponse.json({ error: "Número de WhatsApp inválido." }, { status: 400 });
    }

    const db = getDb();
    const [row] = await db
      .insert(waitlist)
      .values({
        name,
        phone,
        serviceName: serviceName || null,
        preferredDate: preferredDate || null,
        notes: notes || null,
        status: "waiting",
      })
      .returning();

    const shopText =
      `📋 *Lista de espera — ${shop.name}*\n` +
      `Nome: ${name}\n` +
      `WhatsApp: ${phone}\n` +
      (serviceName ? `Serviço desejado: ${serviceName}\n` : "") +
      (preferredDate ? `Data preferida: ${preferredDate.split("-").reverse().join("/")}\n` : "") +
      (notes ? `Observações: ${notes}\n` : "");

    const shopWa = waLink(shop.phone, shopText);

    return NextResponse.json({
      ok: true,
      entry: row,
      whatsapp: {
        shop: shopWa,
        message: shopText,
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
