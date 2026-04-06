// src/app/page.tsx
import Link from "next/link";

export default function HomeLobby() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-gray-950 to-black text-white font-sans overflow-hidden">
      {/* Efeito de grade/textura no fundo (opcional) */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,rgba(255,255,255,0.02)_20px,rgba(255,255,255,0.02)_40px)] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center gap-12 p-12 bg-black/50 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] max-w-2xl w-full mx-4">
        {/* TÍTULO DO JOGO */}
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-black tracking-widest uppercase bg-gradient-to-b from-white via-gray-300 to-gray-600 bg-clip-text text-transparent drop-shadow-2xl">
            Projeto
            <br />
            <span className="text-4xl md:text-6xl text-cyan-500 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
              Shatter
            </span>
          </h1>
          <p className="mt-4 text-gray-400 font-bold tracking-widest text-sm uppercase">
            Alpha Build v0.1.0
          </p>
        </div>

        {/* MENSAGEM DE STATUS */}
        <div className="bg-gray-900/80 border border-gray-700 rounded-lg p-4 w-full text-center">
          <p className="text-sm text-gray-300">
            Servidores Online.{" "}
            <span className="text-emerald-400 font-bold">1</span> jogador(es) no
            lobby.
          </p>
        </div>

        {/* BOTÃO JOGAR (Usa o Link do Next.js para ir para /game) */}
        <Link
          href="/game"
          className="group relative px-12 py-5 bg-gray-900 border-2 border-cyan-500/50 hover:border-cyan-400 rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(34,211,238,0.5)] active:scale-95"
        >
          {/* Efeito de brilho interno ao passar o mouse */}
          <div className="absolute inset-0 bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors"></div>

          <span className="relative font-black text-2xl uppercase tracking-widest text-cyan-400 group-hover:text-white transition-colors drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
            Entrar no Combate
          </span>
        </Link>

        {/* RODAPÉ DO MENU */}
        <div className="absolute bottom-4 text-xs text-gray-600 font-bold uppercase tracking-widest">
          Criado por Sua Equipe © 2024
        </div>
      </div>
    </main>
  );
}
