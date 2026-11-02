"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DEFAULT_SERVICES, priceLabel } from "@/lib/services";

type Service = (typeof DEFAULT_SERVICES)[number];

export default function AgendarPage() {
  const [step, setStep] = useState(1);
  const [service, setService] = useState<Service | null>(null);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ whatsapp: { client: string } } | null>(null);
  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    if (!service || !date) return;
    setLoadingSlots(true);
    setStartTime("");
    setError("");
    fetch(`/api/slots?date=${date}&duration=${service.durationMin}`)
      .then((r) => r.json())
      .then((data) => {
        setSlots(data.slots || []);
        if (data.error) setError(data.error);
      })
      .catch(() => setError("Não foi possível carregar horários"))
      .finally(() => setLoadingSlots(false));
  }, [service, date]);

  async function submit() {
    if (!service || !date || !startTime || !name || !phone) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          serviceName: service.name,
          durationMin: service.durationMin,
          priceCents: service.priceCents,
          date,
          startTime,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao agendar");
        return;
      }
      setDone(data);
      window.open(data.whatsapp.client, "_blank");
    } catch {
      setError("Falha de conexão");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="min-h-screen px-5 py-16 max-w-md mx-auto text-center">
        <div className="text-4xl mb-4">✅</div>
        <h1 className="font-display text-3xl mb-2">Horário reservado</h1>
        <p className="text-cream/70 text-sm mb-6">Abrimos o WhatsApp com a confirmação.</p>
        <a href={done.whatsapp.client} className="block bg-green-600 text-white py-3 rounded mb-3">
          Abrir confirmação no WhatsApp
        </a>
        <Link href="/" className="text-sm text-gold">Voltar</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 py-8 max-w-lg mx-auto">
      <div className="flex justify-between mb-8">
        <Link href="/" className="text-sm text-cream/50">← Voltar</Link>
        <span className="text-xs text-gold uppercase">Passo {step}/3</span>
      </div>
      {error && <div className="mb-4 rounded bg-red/20 border border-red/40 text-sm px-3 py-2">{error}</div>}

      {step === 1 && (
        <section>
          <h1 className="font-display text-3xl mb-6">Escolha o serviço</h1>
          <div className="space-y-2">
            {DEFAULT_SERVICES.map((s) => (
              <button key={s.name} type="button" onClick={() => { setService(s); setStep(2); }}
                className="w-full flex justify-between text-left bg-ink-3 border border-white/5 rounded-lg px-4 py-3">
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-cream/50">{s.durationMin} min</div>
                </div>
                <div className="text-gold text-sm">{priceLabel(s.priceCents)}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 2 && service && (
        <section>
          <button type="button" onClick={() => setStep(1)} className="text-xs text-cream/50 mb-4">← Trocar serviço</button>
          <h1 className="font-display text-3xl mb-2">Data e horário</h1>
          <p className="text-sm text-cream/60 mb-6">{service.name} · {priceLabel(service.priceCents)}</p>
          <input type="date" min={minDate} value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full bg-ink-3 border border-white/10 rounded-lg px-4 py-3 mb-6" />
          {date && (
            <>
              {loadingSlots ? <p className="text-sm text-cream/50">Carregando…</p> : slots.length === 0 ? (
                <p className="text-sm text-cream/50">Nenhum horário neste dia.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {slots.map((t) => (
                    <button key={t} type="button" onClick={() => setStartTime(t)}
                      className={`py-2.5 rounded text-sm border ${startTime === t ? "bg-red border-red" : "bg-ink-3 border-white/10"}`}>{t}</button>
                  ))}
                </div>
              )}
              {startTime && (
                <button type="button" onClick={() => setStep(3)} className="w-full bg-red py-3 rounded font-medium uppercase text-sm">Continuar</button>
              )}
            </>
          )}
        </section>
      )}

      {step === 3 && service && (
        <section>
          <button type="button" onClick={() => setStep(2)} className="text-xs text-cream/50 mb-4">← Trocar horário</button>
          <h1 className="font-display text-3xl mb-2">Seus dados</h1>
          <p className="text-sm text-cream/60 mb-6">{service.name} · {date.split("-").reverse().join("/")} às {startTime}</p>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" className="w-full bg-ink-3 border border-white/10 rounded-lg px-4 py-3 mb-4" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WhatsApp" inputMode="tel" className="w-full bg-ink-3 border border-white/10 rounded-lg px-4 py-3 mb-6" />
          <button type="button" disabled={submitting || !name || !phone} onClick={submit}
            className="w-full bg-red disabled:opacity-50 py-3.5 rounded font-medium uppercase text-sm">
            {submitting ? "Reservando…" : "Confirmar agendamento"}
          </button>
        </section>
      )}
    </main>
  );
}
