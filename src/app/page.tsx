import Link from "next/link";
import { shop } from "@/lib/config";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-5 py-4 bg-ink/95 border-b border-red/20 backdrop-blur">
        <div>
          <div className="font-display text-xl tracking-widest text-cream">TY_ZAH</div>
          <div className="text-[10px] tracking-[0.3em] text-gold uppercase">Barbearia</div>
        </div>
        <Link
          href="/agendar"
          className="bg-red hover:bg-red-bright text-cream text-xs font-medium tracking-widest uppercase px-5 py-2.5 rounded transition"
        >
          Agendar
        </Link>
      </nav>

      <header className="pt-28 pb-16 px-5 text-center max-w-2xl mx-auto">
        <p className="text-gold text-xs tracking-[0.35em] uppercase mb-4">Estilo & Precisão</p>
        <h1 className="font-display text-5xl sm:text-6xl tracking-wide text-cream mb-4">
          Barbearia <span className="text-red">Ty_Zah</span>
        </h1>
        <p className="text-cream/70 text-sm leading-relaxed mb-8">
          Corte, barba e combos com cuidado. Agende em menos de 1 minuto — sem app, sem filas de
          mensagem.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/agendar"
            className="bg-red hover:bg-red-bright text-cream px-8 py-3.5 rounded font-medium tracking-wide uppercase text-sm transition"
          >
            Reservar horário
          </Link>
          <a
            href={shop.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-gold/40 text-gold px-8 py-3.5 rounded text-sm tracking-wide uppercase hover:bg-gold/10 transition"
          >
            Ver no Google Maps
          </a>
        </div>
      </header>

      <section className="px-5 py-12 max-w-lg mx-auto border-t border-white/5">
        <h2 className="font-display text-2xl tracking-wide mb-6 text-center">Horários</h2>
        <ul className="space-y-2 text-sm text-cream/80">
          <li className="flex justify-between border-b border-white/5 pb-2">
            <span>Segunda</span>
            <span className="text-muted">Fechado</span>
          </li>
          <li className="flex justify-between border-b border-white/5 pb-2">
            <span>Terça a Sexta</span>
            <span>09h — 20h</span>
          </li>
          <li className="flex justify-between border-b border-white/5 pb-2">
            <span>Sábado</span>
            <span>08h — 18h</span>
          </li>
          <li className="flex justify-between">
            <span>Domingo</span>
            <span className="text-muted">Fechado</span>
          </li>
        </ul>
      </section>

      <section className="px-5 py-12 max-w-lg mx-auto border-t border-white/5">
        <h2 className="font-display text-2xl tracking-wide mb-4 text-center">Onde estamos</h2>
        <p className="text-center text-cream/80 text-sm mb-2">{shop.address}</p>
        <p className="text-center text-xs text-cream/50 mb-6">
          WhatsApp:{" "}
          <a className="text-gold" href={`https://wa.me/${shop.phone}`}>
            {shop.phone}
          </a>
        </p>
        <a
          href={shop.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-gold text-sm hover:underline"
        >
          Abrir no Google Maps →
        </a>
      </section>

      <footer className="py-10 text-center text-xs text-cream/40 border-t border-white/5">
        © {new Date().getFullYear()} {shop.name}
        <span className="mx-2">·</span>
        <Link href="/admin" className="hover:text-cream/70">
          Área do barbeiro
        </Link>
      </footer>
    </div>
  );
}
