"use client";

import { useState } from "react";
import Link from "next/link";
import { DEFAULT_SERVICES } from "@/lib/services";

export default function EsperaPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          serviceName: serviceName || null,
          preferredDate: preferredDate || null,
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro");
        return;
      }
      setDone(true);
    } catch {
      setError("Falha de conexão");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <main className="min-h-screen px-5 py-16 max-w-md mx-auto text-center">
        <div className="text-4xl mb-4">📋</div>
        <h1 className="font-display text-3xl mb-2">Você está na lista</h1>
        <p className="text-cream/70 text-sm mb-6">
          Quando surgir um horário, o barbeiro te avisa no WhatsApp.
        </p>
        <Link href="/" className="text-sm text-gold">Voltar ao início</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 py-8 max-w-lg mx-auto">
      <Link href="/" className="text-sm text-cream/50">← Voltar</Link>
      <h1 className="font-display text-3xl mt-6 mb-2">Lista de espera</h1>
      <p className="text-sm text-cream/60 mb-6">
        Sem horário livre? Entra na lista. Avisamos no WhatsApp quando abrir vaga.
      </p>
      {error && (
        <div className="mb-4 rounded bg-red/20 border border-red/40 text-sm px-3 py-2">{error}</div>
      )}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs text-cream/50 mb-1">Nome</label>
          <input required value={name} onChange={(e) => setName(e.target.value)}
            className="w-full bg-ink-3 border border-white/10 rounded-lg px-4 py-3" />
        </div>
        <div>
          <label className="block text-xs text-cream/50 mb-1">WhatsApp</label>
          <input required value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel"
            placeholder="(33) 99999-9999"
            className="w-full bg-ink-3 border border-white/10 rounded-lg px-4 py-3" />
        </div>
        <div>
          <label className="block text-xs text-cream/50 mb-1">Serviço (opcional)</label>
          <select value={serviceName} onChange={(e) => setServiceName(e.target.value)}
            className="w-full bg-ink-3 border border-white/10 rounded-lg px-4 py-3">
            <option value="">Qualquer</option>
            {DEFAULT_SERVICES.map((s) => (
              <option key={s.name} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-cream/50 mb-1">Dia preferido (opcional)</label>
          <input type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)}
            className="w-full bg-ink-3 border border-white/10 rounded-lg px-4 py-3" />
        </div>
        <div>
          <label className="block text-xs text-cream/50 mb-1">Observação</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: só de manhã"
            className="w-full bg-ink-3 border border-white/10 rounded-lg px-4 py-3" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-red hover:bg-red-bright disabled:opacity-50 py-3.5 rounded font-medium uppercase text-sm tracking-wide">
          {loading ? "Enviando…" : "Entrar na lista"}
        </button>
      </form>
      <p className="text-center text-xs text-cream/40 mt-6">
        Ou <Link href="/agendar" className="text-gold">tente agendar um horário</Link>
      </p>
    </main>
  );
}
