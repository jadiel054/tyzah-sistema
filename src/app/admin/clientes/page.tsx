"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPhoneBR, waLink } from "@/lib/slots";

type Client = {
  id: string; name: string; phone: string; notes: string | null;
  photoUrl: string | null; lastService: string | null;
};

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Client | null>(null);
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [lastService, setLastService] = useState("");

  async function load(query = "") {
    const res = await fetch(`/api/clients${query ? `?q=${encodeURIComponent(query)}` : ""}`);
    const data = await res.json();
    if (data.error === "Não autorizado") { window.location.href = "/admin"; return; }
    setClients(data.clients || []);
  }

  useEffect(() => { load(); }, []);

  function openEdit(c: Client) {
    setEditing(c);
    setNotes(c.notes || "");
    setPhotoUrl(c.photoUrl || "");
    setLastService(c.lastService || "");
  }

  async function save() {
    if (!editing) return;
    await fetch("/api/clients", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editing.id, notes, photoUrl: photoUrl || null, lastService: lastService || null }),
    });
    setEditing(null);
    load(q);
  }

  return (
    <main className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      <div className="flex justify-between mb-6">
        <h1 className="font-display text-2xl">Clientes</h1>
        <Link href="/admin/hoje" className="text-xs text-gold">← Agenda</Link>
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load(q)}
        placeholder="Buscar nome ou WhatsApp" className="w-full bg-ink-3 border border-white/10 rounded-lg px-3 py-2 text-sm mb-4" />
      <button type="button" onClick={() => load(q)} className="text-xs text-gold mb-4">Buscar</button>

      <div className="space-y-3">
        {clients.map((c) => (
          <button key={c.id} type="button" onClick={() => openEdit(c)}
            className="w-full text-left bg-ink-3 border border-white/5 rounded-xl p-4">
            <div className="font-medium">{c.name}</div>
            <div className="text-xs text-cream/50">{formatPhoneBR(c.phone)}</div>
            {c.lastService && <div className="text-xs text-gold/80 mt-1">Último: {c.lastService}</div>}
          </button>
        ))}
        {clients.length === 0 && <p className="text-sm text-cream/40">Nenhum cliente ainda.</p>}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-ink-2 border border-white/10 rounded-xl w-full max-w-md p-5">
            <h2 className="font-display text-xl mb-1">{editing.name}</h2>
            <a href={waLink(editing.phone, `Oi ${editing.name}!`)} className="text-xs text-gold" target="_blank" rel="noreferrer">
              {formatPhoneBR(editing.phone)} · WhatsApp
            </a>
            <label className="block text-xs text-cream/50 mt-4 mb-1">Último serviço</label>
            <input value={lastService} onChange={(e) => setLastService(e.target.value)} className="w-full bg-ink-3 border border-white/10 rounded px-3 py-2 text-sm mb-3" />
            <label className="block text-xs text-cream/50 mb-1">Foto (URL)</label>
            <input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} className="w-full bg-ink-3 border border-white/10 rounded px-3 py-2 text-sm mb-3" />
            <label className="block text-xs text-cream/50 mb-1">Notas</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full bg-ink-3 border border-white/10 rounded px-3 py-2 text-sm mb-4" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditing(null)} className="flex-1 py-2 rounded border border-white/10 text-sm">Fechar</button>
              <button type="button" onClick={save} className="flex-1 py-2 rounded bg-red text-sm font-medium">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
