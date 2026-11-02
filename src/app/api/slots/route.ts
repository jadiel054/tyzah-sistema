import { NextRequest, NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { appointments, blockedSlots } from "@/lib/db/schema";
import { generateDaySlots } from "@/lib/slots";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const date = req.nextUrl.searchParams.get("date");
    const duration = Number(req.nextUrl.searchParams.get("duration") || 30);
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "date inválida" }, { status: 400 });
    }
    const db = getDb();
    const appts = await db
      .select({ startTime: appointments.startTime, endTime: appointments.endTime })
      .from(appointments)
      .where(and(eq(appointments.date, date), ne(appointments.status, "cancelled")));
    const blocks = await db
      .select({ startTime: blockedSlots.startTime, endTime: blockedSlots.endTime })
      .from(blockedSlots)
      .where(eq(blockedSlots.date, date));
    const slots = generateDaySlots(date, duration, appts, blocks);
    return NextResponse.json({ date, duration, slots });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro ao buscar horários" },
      { status: 500 }
    );
  }
}
