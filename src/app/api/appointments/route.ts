import { NextRequest, NextResponse } from "next/server";
import { and, eq, ne, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { appointments, clients, blockedSlots } from "@/lib/db/schema";
import { addMinutes, generateDaySlots, normalizePhone, waLink } from "@/lib/slots";
import { shop } from "@/lib/config";
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
      const rows = await db
        .select()
        .from(appointments)
        .where(eq(appointments.date, date))
        .orderBy(appointments.startTime);
      return NextResponse.json({ appointments: rows });
    }
    const rows = await db
      .select()
      .from(appointments)
      .orderBy(desc(appointments.date), appointments.startTime)
      .limit(50);
    return NextResponse.json({ appointments: rows });
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
    const serviceName = String(body.serviceName || "").trim();
    const durationMin = Number(body.durationMin || 30);
    const priceCents = Number(body.priceCents || 0);
    const date = String(body.date || "");
    const startTime = String(body.startTime || "");

    if (!name || phone.length < 12 || !serviceName || !date || !startTime) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const endTime = addMinutes(startTime, durationMin);
    const db = getDb();

    const appts = await db
      .select({ startTime: appointments.startTime, endTime: appointments.endTime })
      .from(appointments)
      .where(and(eq(appointments.date, date), ne(appointments.status, "cancelled")));

    const blocks = await db
      .select({ startTime: blockedSlots.startTime, endTime: blockedSlots.endTime })
      .from(blockedSlots)
      .where(eq(blockedSlots.date, date));

    const free = generateDaySlots(date, durationMin, appts, blocks);
    if (!free.includes(startTime)) {
      return NextResponse.json({ error: "Horário indisponível. Escolha outro." }, { status: 409 });
    }

    const existing = await db.select().from(clients).where(eq(clients.phone, phone)).limit(1);
    let clientId: string | null = null;
    if (existing[0]) {
      clientId = existing[0].id;
      await db
        .update(clients)
        .set({ name, lastService: serviceName, updatedAt: new Date() })
        .where(eq(clients.id, clientId));
    } else {
      const [created] = await db
        .insert(clients)
        .values({ name, phone, lastService: serviceName })
        .returning();
      clientId = created.id;
    }

    const [appt] = await db
      .insert(appointments)
      .values({
        clientId,
        clientName: name,
        clientPhone: phone,
        serviceName,
        serviceDurationMin: durationMin,
        priceCents,
        date,
        startTime,
        endTime,
        status: "confirmed",
        confirmationSent: true,
      })
      .returning();

    const confirmText =
      `✅ *Agendamento confirmado — ${shop.name}*\n\n` +
      `👤 ${name}\n` +
      `✂️ ${serviceName}\n` +
      `📅 ${date.split("-").reverse().join("/")}\n` +
      `🕐 ${startTime}\n\n` +
      `📍 ${shop.address}\n` +
      `🗺️ ${shop.mapsUrl}\n\n` +
      `Se precisar remarcar, responda esta mensagem.`;

    const clientWa = waLink(phone, confirmText);
    const shopWa = waLink(
      shop.phone,
      `🆕 Novo agendamento\n${name} · ${serviceName}\n${date} às ${startTime}\nWhatsApp: ${phone}`
    );

    return NextResponse.json({
      ok: true,
      appointment: appt,
      whatsapp: { client: clientWa, shop: shopWa, message: confirmText },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro ao agendar" },
      { status: 500 }
    );
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
    if (!id || !["confirmed", "done", "cancelled", "no_show"].includes(status)) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    const db = getDb();
    const [row] = await db
      .update(appointments)
      .set({ status, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();

    if (status === "done" && row?.clientId) {
      await db
        .update(clients)
        .set({
          lastService: row.serviceName,
          lastVisitAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(clients.id, row.clientId));
    }

    return NextResponse.json({ appointment: row });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
