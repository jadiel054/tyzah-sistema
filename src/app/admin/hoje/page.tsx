"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatPhoneBR, priceLabel, waLink } from "@/lib/slots";

type Appt = {
  id: string; clientName: string; clientPhone: string; serviceName: string;
  startTime: string; endTime: string; status: string; priceCents: number;
};
type Reminder = Appt & { whatsappLink: string };

export default function AdminHojePage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [appts, setAppts] = useState<Appt[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [blockReason, setBlockReason] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, r] = await Promise.all([
        fetch(`/api/appointments?date=${date}`).then((x) => x.json()),
        fetch("/api/reminders").then((x) => x.json()),
      ]);
      if (a.error === "Não autorizado") { window.location.href = "/admin"; return; }
      setAppts(a.appointments || []);
      setReminders(r.reminders || []);
    } finally { setLoading(false); }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  async function setStatus(id: string, status: string) {
    await fetch("/api/appointments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  async function blockDay() {
    const res = await fetch("/api/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, reason: blockReason || "Bloqueado" }),
    });
    setMsg(res.ok ? "Dia bloqueado" : "Erro ao bloquear");
  }

  async function markReminder(id: string) {
    await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/admin";
  }

  const active = appts.filter((a) => a.status !== "cancelled");

  return (
    <main className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl">Hoje</h1>
          <p className="text-xs text-cream/50">Painel do barbeiro</p>
        </div>
        <div className="flex gap-3 text-xs flex-wrap justify-end">
          <Link href="/admin/clientes" className="text-gold">Clientes</Link>
          <Link href="/admin/espera" className="text-gold">Espera</Link>
          <button type="button" onClick={logout} className="text-cream/40">Sair</button>
        </div>
      </div>

      <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
        className="w-full bg-ink-3 border border-white/10 rounded-lg px-3 py-2 mb-4 text-sm" />
      {msg && <p className="text-xs text-gold mb-3">{msg}</p>}

      {reminders.length > 0 && (
        <section className="mb-6 rounded-xl border border-gold/30 bg-gold/5 p-4">
          <h2 className="text-sm font-medium text-gold mb-3">Lembretes ({reminders.length})</h2>
          {reminders.map((r) => (
            <div key={r.id} className="flex justify-between text-sm mb-2">
              <span>{r.clientName} · {r.startTime}</span>
              <a href={r.whatsappLink} target="_blank" rel="noreferrer" onClick={() => markReminder(r.id)}
                className="bg-green-700 px-2 py-1 rounded text-xs">Enviar</a>
            </div>
          ))}
        </section>
      )}

      <section className="mb-6">
        <h2 className="text-sm font-medium mb-3">Agenda ({active.length})</h2>
        {loading ? <p className="text-sm text-cream/40">Carregando…</p> : active.length === 0 ? (
          <p className="text-sm text-cream/40">Nenhum agendamento.</p>
        ) : active.map((a) => (
          <div key={a.id} className="bg-ink-3 border border-white/5 rounded-xl p-4 mb-3">
            <div className="font-medium">{a.startTime}–{a.endTime} · {a.clientName}</div>
            <div className="text-xs text-cream/50">{a.serviceName} · {priceLabel(a.priceCents)}</div>
            <a className="text-xs text-gold" href={waLink(a.clientPhone, `Oi ${a.clientName}!`)}>{formatPhoneBR(a.clientPhone)}</a>
            <div className="flex gap-2 mt-2">
              <button type="button" onClick={() => setStatus(a.id, "done")} className="text-xs bg-green-800/60 px-2 py-1 rounded">Concluído</button>
              <button type="button" onClick={() => setStatus(a.id, "no_show")} className="text-xs bg-red/30 px-2 py-1 rounded">Faltou</button>
              <button type="button" onClick={() => setStatus(a.id, "cancelled")} className="text-xs bg-white/10 px-2 py-1 rounded">Cancelar</button>
            </div>
          </div>
        ))}
      </section>

      <section className="border-t border-white/5 pt-6">
        <h2 className="text-sm font-medium mb-2">Bloquear dia</h2>
        <input value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="Motivo" className="w-full bg-ink-3 border border-white/10 rounded-lg px-3 py-2 text-sm mb-2" />
        <button type="button" onClick={blockDay} className="w-full border border-red/40 text-red-bright py-2 rounded text-sm">Bloquear dia</button>
      </section>
    </main>
  );
}
