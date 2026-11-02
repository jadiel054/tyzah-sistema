import { NextRequest, NextResponse } from "next/server";
import { and, eq, ne, desc, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { appointments, clients, blockedSlots, services } from "@/lib/db/schema";
import { addMinutes, generateDaySlots, normalizePhone, timeToMinutes, waLink } from "@/lib/slots";
import { shop, getHours } from "@/lib/config";
import { isAdminAuthenticated } from "@/lib/auth";
import { isDateInPast } from "@/lib/date";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { DEFAULT_SERVICES } from "@/lib/services";

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
    // 1. Rate limiting on public appointment creation (max 10 requests per minute per IP)
    const ip = getClientIp(req.headers);
    const limit = checkRateLimit(`appt:${ip}`, 10, 60 * 1000);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Muitas tentativas de agendamento. Aguarde um instante." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const name = String(body.name || "").trim();
    const rawPhone = String(body.phone || "").trim();
    const phone = normalizePhone(rawPhone);
    const serviceName = String(body.serviceName || "").trim();
    const date = String(body.date || "").trim();
    const startTime = String(body.startTime || "").trim();

    // 2. Validate input fields
    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Nome inválido ou muito curto." }, { status: 400 });
    }
    if (phone.length < 12 || phone.length > 13) {
      return NextResponse.json({ error: "Telefone/WhatsApp inválido." }, { status: 400 });
    }
    if (!serviceName || !date || !startTime) {
      return NextResponse.json({ error: "Dados incompletos para o agendamento." }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Formato de data inválido." }, { status: 400 });
    }
    if (!/^\d{2}:\d{2}$/.test(startTime)) {
      return NextResponse.json({ error: "Formato de horário inválido." }, { status: 400 });
    }

    // 3. Reject past dates (respecting America/Sao_Paulo timezone)
    if (isDateInPast(date, shop.tz)) {
      return NextResponse.json({ error: "Não é permitido agendar em datas passadas." }, { status: 400 });
    }

    // 4. Source of truth for services, duration, and price: NEVER trust client-provided duration or price
    const db = getDb();
    let serviceDurationMin = 30;
    let servicePriceCents = 0;

    // Check DB first
    const dbServices = await db
      .select()
      .from(services)
      .where(and(eq(services.name, serviceName), eq(services.active, true)))
      .limit(1);

    if (dbServices.length > 0) {
      serviceDurationMin = dbServices[0].durationMin;
      servicePriceCents = dbServices[0].priceCents;
    } else {
      // Fallback to DEFAULT_SERVICES
      const def = DEFAULT_SERVICES.find((s) => s.name === serviceName);
      if (!def) {
        return NextResponse.json(
          { error: "Serviço inválido, inativo ou não encontrado." },
          { status: 400 }
        );
      }
      serviceDurationMin = def.durationMin;
      servicePriceCents = def.priceCents;
    }

    // 5. Operating hours check
    const d = new Date(date + "T12:00:00");
    const dow = d.getDay();
    const hours = getHours()[dow];
    if (!hours) {
      return NextResponse.json({ error: "Estabelecimento fechado nesta data." }, { status: 400 });
    }

    const [openStr, closeStr] = hours;
    const openM = timeToMinutes(openStr);
    const closeM = timeToMinutes(closeStr);
    const startM = timeToMinutes(startTime);
    const endM = startM + serviceDurationMin;
    const endTime = addMinutes(startTime, serviceDurationMin);

    if (startM < openM || endM > closeM) {
      return NextResponse.json(
        { error: "Horário selecionado fora do período de funcionamento." },
        { status: 400 }
      );
    }

    // 6. Concurrency / Collision protection:
    // Check against blocks
    const blocks = await db
      .select({ startTime: blockedSlots.startTime, endTime: blockedSlots.endTime })
      .from(blockedSlots)
      .where(eq(blockedSlots.date, date));

    const isBlocked = blocks.some((b) => {
      if (!b.startTime || !b.endTime) return true; // full day block
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);
      return startM < bEnd && endM > bStart;
    });

    if (isBlocked) {
      return NextResponse.json(
        { error: "Este horário ou dia está bloqueado para agendamentos." },
        { status: 409 }
      );
    }

    // Check availability using slots generator
    const existingAppts = await db
      .select({ startTime: appointments.startTime, endTime: appointments.endTime })
      .from(appointments)
      .where(and(eq(appointments.date, date), ne(appointments.status, "cancelled")));

    const freeSlots = generateDaySlots(date, serviceDurationMin, existingAppts, blocks);
    if (!freeSlots.includes(startTime)) {
      return NextResponse.json(
        { error: "Horário indisponível ou já reservado. Por favor, escolha outro." },
        { status: 409 }
      );
    }

    // 7. Double-booking atomic check / insertion:
    // Ensure no overlapping appointment was committed concurrently
    const conflictCheck = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          eq(appointments.date, date),
          ne(appointments.status, "cancelled"),
          sql`${appointments.startTime} < ${endTime} AND ${appointments.endTime} > ${startTime}`
        )
      )
      .limit(1);

    if (conflictCheck.length > 0) {
      return NextResponse.json(
        { error: "Horário acabou de ser reservado por outro cliente. Escolha outro horário." },
        { status: 409 }
      );
    }

    // Upsert / Link Client
    const existingClient = await db.select().from(clients).where(eq(clients.phone, phone)).limit(1);
    let clientId: string | null = null;
    if (existingClient[0]) {
      clientId = existingClient[0].id;
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

    // Notice: confirmationSent is set to FALSE initially.
    // It is only marked TRUE when the confirmation is actually triggered/sent.
    const [appt] = await db
      .insert(appointments)
      .values({
        clientId,
        clientName: name,
        clientPhone: phone,
        serviceName,
        serviceDurationMin,
        priceCents: servicePriceCents,
        date,
        startTime,
        endTime,
        status: "confirmed",
        confirmationSent: false,
      })
      .returning();

    const confirmText =
      `✅ *Agendamento reservado — ${shop.name}*\n\n` +
      `👤 ${name}\n` +
      `✂️ ${serviceName}\n` +
      `📅 ${date.split("-").reverse().join("/")}\n` +
      `🕐 ${startTime}\n\n` +
      `📍 ${shop.address}\n` +
      `🗺️ ${shop.mapsUrl}\n\n` +
      `Para confirmar ou remarcar, responda esta mensagem.`;

    const clientWa = waLink(phone, confirmText);
    const shopWa = waLink(
      shop.phone,
      `🆕 Novo agendamento\n${name} · ${serviceName}\n${date.split("-").reverse().join("/")} às ${startTime}\nWhatsApp: ${phone}`
    );

    return NextResponse.json({
      ok: true,
      appointment: appt,
      whatsapp: {
        client: clientWa,
        shop: shopWa,
        message: confirmText,
        linkPrepared: true,
      },
    });
  } catch (e) {
    console.error("Error creating appointment:", e);
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
    const status = body.status ? String(body.status) : undefined;
    const confirmationSent =
      body.confirmationSent !== undefined ? Boolean(body.confirmationSent) : undefined;

    if (!id) {
      return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
    }

    if (status && !["confirmed", "done", "cancelled", "no_show"].includes(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    const db = getDb();
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (confirmationSent !== undefined) updateData.confirmationSent = confirmationSent;

    const [row] = await db
      .update(appointments)
      .set(updateData)
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
