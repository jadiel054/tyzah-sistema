import { NextRequest, NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { appointments } from "@/lib/db/schema";
import { isAdminAuthenticated } from "@/lib/auth";
import { shop } from "@/lib/config";
import { waLink } from "@/lib/slots";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const db = getDb();
    const now = new Date();
    const today = now.toLocaleDateString("en-CA", { timeZone: shop.tz });
    const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrow = tomorrowDate.toLocaleDateString("en-CA", { timeZone: shop.tz });

    const rows = await db
      .select()
      .from(appointments)
      .where(
        and(
          ne(appointments.status, "cancelled"),
          ne(appointments.status, "done"),
          eq(appointments.reminderSent, false)
        )
      );

    const due = rows.filter((r) => r.date === today || r.date === tomorrow);

    const withLinks = due.map((r) => {
      const text =
        `⏰ *Lembrete — ${shop.name}*\n\n` +
        `Olá ${r.clientName}! Seu horário é amanhã/hoje:\n` +
        `✂️ ${r.serviceName}\n` +
        `📅 ${String(r.date).split("-").reverse().join("/")}\n` +
        `🕐 ${r.startTime}\n\n` +
        `📍 ${shop.address}\n` +
        `Se não puder vir, avise por aqui. 🙏`;
      return {
        ...r,
        whatsappLink: waLink(r.clientPhone, text),
        message: text,
      };
    });

    return NextResponse.json({ reminders: withLinks, today, tomorrow });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id" }, { status: 400 });
    const db = getDb();
    await db
      .update(appointments)
      .set({ reminderSent: true, updatedAt: new Date() })
      .where(eq(appointments.id, id));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
