"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPhoneBR } from "@/lib/slots";

type Entry = {
  id: string;
  name: string;
  phone: string;
  serviceName: string | null;
  preferredDate: string | null;
  notes: string | null;
  status: string;
  whatsappLink: string;
  createdAt: string;
};

export default function AdminEsperaPage() {
  const [rows, setRows] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/waitlist");
      const data = await res.json();
      if (data.error === "Não autorizado") {
        window.location.href = "/admin";
        return;
      }
      setRows(data.waitlist || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: string) {
    await fetch("/api/waitlist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  const waiting = rows.filter((r) => r.status === "waiting" || r.status === "notified");

  return (
    <main className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl">Lista de espera</h1>
          <p className="text-xs text-cream/50">{waiting.length} aguardando</p>
        </div>
        <Link href="/admin/hoje" className="text-xs text-gold">← Agenda</Link>
      </div>

      {loading ? (
        <p className="text-sm text-cream/40">Carregando…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-cream/40">Ninguém na lista ainda.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="bg-ink-3 border border-white/5 rounded-xl p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-cream/50">{formatPhoneBR(r.phone)}</div>
                  {r.serviceName && <div className="text-xs text-gold/80 mt-1">{r.serviceName}</div>}
                  {r.preferredDate && (
                    <div className="text-xs text-cream/40">
                      Prefere: {String(r.preferredDate).slice(0, 10).split("-").reverse().join("/")}
                    </div>
                  )}
                  {r.notes && <div className="text-xs text-cream/40 mt-1">{r.notes}</div>}
                </div>
                <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-white/10">{r.status}</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {(r.status === "waiting" || r.status === "notified") && (
                  <a
                    href={r.whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setStatus(r.id, "notified")}
                    className="text-xs bg-green-700 px-2 py-1 rounded"
                  >
                    Avisar vaga
                  </a>
                )}
                <button type="button" onClick={() => setStatus(r.id, "booked")} className="text-xs bg-white/10 px-2 py-1 rounded">
                  Agendou
                </button>
                <button type="button" onClick={() => setStatus(r.id, "cancelled")} className="text-xs bg-red/30 px-2 py-1 rounded">
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
