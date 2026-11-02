import { getHours, shop } from "./config";

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function addMinutes(time: string, mins: number): string {
  return minutesToTime(timeToMinutes(time) + mins);
}

export function generateDaySlots(
  dateStr: string,
  durationMin: number,
  occupied: { startTime: string; endTime: string }[],
  blocks: { startTime: string | null; endTime: string | null }[]
): string[] {
  const d = new Date(dateStr + "T12:00:00");
  const dow = d.getDay();
  const hours = getHours()[dow];
  if (!hours) return [];
  const [open, close] = hours;
  const openM = timeToMinutes(open);
  const closeM = timeToMinutes(close);
  const step = shop.slotMinutes;
  const slots: string[] = [];
  for (let t = openM; t + durationMin <= closeM; t += step) {
    const start = minutesToTime(t);
    const end = minutesToTime(t + durationMin);
    const blocked = blocks.some((b) => {
      if (!b.startTime || !b.endTime) return true;
      return timeToMinutes(start) < timeToMinutes(b.endTime) && timeToMinutes(end) > timeToMinutes(b.startTime);
    });
    if (blocked) continue;
    const clash = occupied.some(
      (o) => timeToMinutes(start) < timeToMinutes(o.endTime) && timeToMinutes(end) > timeToMinutes(o.startTime)
    );
    if (clash) continue;
    slots.push(start);
  }
  return slots;
}

export function formatPhoneBR(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.length === 13 && d.startsWith("55"))
    return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  return digits;
}

export function normalizePhone(input: string): string {
  let d = input.replace(/\D/g, "");
  if (d.length === 11 || d.length === 10) d = "55" + d;
  return d;
}

export function waLink(phone: string, text: string): string {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(text)}`;
}

export function priceLabel(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
