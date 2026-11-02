"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Falha");
        return;
      }
      router.push("/admin/hoje");
      router.refresh();
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-5">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-ink-3 border border-white/10 rounded-xl p-6">
        <h1 className="font-display text-2xl mb-1">Painel Ty_Zah</h1>
        <p className="text-xs text-cream/50 mb-6">Área do barbeiro</p>
        {error && <p className="text-sm text-red-bright mb-3">{error}</p>}
        <label className="block text-xs text-cream/50 mb-1">Senha</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-ink-2 border border-white/10 rounded-lg px-4 py-3 mb-4"
          autoFocus
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red hover:bg-red-bright py-3 rounded font-medium text-sm uppercase tracking-wide disabled:opacity-50"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
