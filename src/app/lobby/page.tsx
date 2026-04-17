"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ==========================================
// SVGs dos Ícones
// ==========================================
const Icons = {
  Menu: () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  ),
  Close: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  ),
  Play: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  ),
  Collection: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  ),
  Store: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  Exit: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  User: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  // Ícones Específicos para os Modos de Jogo
  Shield: () => (
    <svg className="w-12 h-12 mb-2 text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M12 8l1.5 3.5L17 12l-2.5 2.5.5 3.5-3-1.5-3 1.5.5-3.5L7 12l3.5-.5z" />
    </svg>
  ),
  Bot: () => (
    <svg className="w-12 h-12 mb-2 text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16" />
      <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
  ),
  Users: () => (
    <svg className="w-12 h-12 mb-2 text-fuchsia-300 drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Book: () => (
    <svg className="w-12 h-12 mb-2 text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  Swords: () => (
    <svg className="w-12 h-12 mb-2 text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
      <path d="M13 19l6-6" />
      <path d="M16 16l4 4" />
      <path d="M19 21l2-2" />
      <path d="M9.5 6.5L21 18v3h-3L6.5 9.5" />
      <path d="M5 5l6 6" />
      <path d="M8 8l-4 4" />
      <path d="M3 15l2 2" />
    </svg>
  )
};

// ==========================================
// COMPONENTES REUTILIZÁVEIS
// ==========================================
const SidebarButton = ({ label, icon: Icon, onClick, isPrimary = false }: any) => (
  <motion.button
    whileHover={{ scale: 1.05, x: 10 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`group flex items-center gap-4 w-full px-6 py-3 mb-4 rounded-r-full border-y border-r transition-all duration-300
      ${isPrimary 
        ? "bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)] text-white" 
        : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-cyan-400 text-gray-300 hover:text-white"
      } backdrop-blur-sm`}
  >
    <div className={`${isPrimary ? "text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" : "text-gray-400 group-hover:text-cyan-400 transition-colors"}`}>
      <Icon />
    </div>
    <span className="font-bold tracking-widest uppercase text-sm">{label}</span>
  </motion.button>
);

const GlassShard = ({ clipPath, gradient, children, style, delay, onClick }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
    transition={{ duration: 0.6, delay, ease: "easeOut" }}
    whileHover={{ scale: 1.05, zIndex: 50, filter: "brightness(1.2)" }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="absolute cursor-pointer group"
    style={{ ...style, clipPath }}
  >
    {/* Borda brilhante interna */}
    <div className="w-full h-full bg-cyan-400/30 p-[2px]">
      <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${gradient} transition-all duration-500 bg-[length:200%_200%] hover:bg-right-bottom`}>
        {/* Camada de escurecimento para dar contraste */}
        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/20 transition-colors duration-300"></div>
        
        {/* Conteúdo dinâmico (Ícone + Texto) */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
          {children}
        </div>
      </div>
    </div>
  </motion.div>
);

// ==========================================
// TELA PRINCIPAL (LOBBY)
// ==========================================
export default function Lobby() {
  // Controle de Abas: "home" (Cenários/Hub) ou "play" (Modos de Jogo)
  const [currentView, setCurrentView] = useState<"home" | "play">("home");
  
  // Controle da Sidebar "Três Barrinhas"
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Ações do Menu
  const menuItems = [
    { label: "Jogar", icon: Icons.Play, primary: true, action: () => { setCurrentView("play"); setIsSidebarOpen(false); } },
    { label: "Coleções", icon: Icons.Collection, action: () => window.location.href = '/colecoes' },
    { label: "Loja", icon: Icons.Store, action: () => { setCurrentView("home"); setIsSidebarOpen(false); } },
    { label: "Configurações", icon: Icons.Settings, action: () => setIsSidebarOpen(false) },
    { label: "Sair", icon: Icons.Exit, action: () => alert("Saindo e fechando janela...") },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-sans text-white select-none">
      
      {/* 1. FUNDO ESPACIAL GERAL */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-fuchsia-900/30 via-black to-black transition-colors duration-1000"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/40 via-transparent to-transparent"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[20%] bg-fuchsia-500/10 blur-[100px] rotate-[-15deg]"></div>
      </div>

      {/* 2. MENU HAMBÚRGUER (Sempre Visível) */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="absolute top-8 left-8 z-50 text-cyan-400 hover:text-white transition-colors drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]"
      >
        <Icons.Menu />
      </button>

      {/* 3. SIDEBAR RETRÁTIL */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Fundo escuro para destacar o menu e fechar ao clicar fora */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            {/* O Menu em si deslizando da esquerda */}
            <motion.div 
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 20 }}
              className="absolute top-0 left-0 h-full w-72 bg-gray-950/90 border-r border-white/10 z-[70] flex flex-col justify-center py-10 pr-6 pt-32 shadow-[20px_0_50px_rgba(0,0,0,0.5)]"
            >
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="absolute top-8 left-8 text-gray-400 hover:text-white transition-colors"
              >
                <Icons.Close />
              </button>
              
              <div className="mb-12 pl-6">
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 uppercase tracking-tighter">
                  Menu
                </h2>
              </div>

              <div className="flex flex-col flex-1 w-full">
                {menuItems.map((item) => (
                  <SidebarButton 
                    key={item.label}
                    label={item.label} 
                    icon={item.icon} 
                    isPrimary={item.primary}
                    onClick={item.action} 
                  />
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 4. TÍTULO CENTRALIZADO RESPONSIVO NO TOPO */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute top-6 inset-x-0 w-full flex justify-center z-40 pointer-events-none px-4"
      >
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 uppercase tracking-[0.2em] drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] text-center leading-tight transition-all duration-300">
          Shattered<br/>
          <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl tracking-[0.3em] bg-clip-text bg-gradient-to-r from-white to-gray-400 transition-all duration-300">Cards</span>
        </h1>
      </motion.div>

      {/* 5. TOP BAR (Recursos com Placeholders "???") */}
      <div className="absolute top-8 right-8 z-40 flex gap-4 hidden sm:flex">
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 backdrop-blur-md px-5 py-2.5 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2 text-cyan-300">
            <span className="text-[10px] uppercase font-bold bg-cyan-900/80 px-2 py-0.5 rounded-sm border border-cyan-500/50">Lvl</span>
            <span className="font-black text-lg min-w-[2ch] text-center">???</span>
          </div>
          <div className="w-px h-6 bg-white/20 mx-2"></div>
          <div className="flex items-center gap-2 text-yellow-400">
            <span className="text-xl drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]">💰</span>
            <span className="font-black text-lg min-w-[3ch] text-center">???</span>
          </div>
          <div className="w-px h-6 bg-white/20 mx-2"></div>
          <div className="flex items-center gap-2 text-fuchsia-400">
            <span className="text-xl drop-shadow-[0_0_5px_rgba(217,70,239,0.5)]">💎</span>
            <span className="font-black text-lg min-w-[3ch] text-center">???</span>
          </div>
        </div>
      </div>

      {/* 6. ÁREA CENTRAL DINÂMICA (As Formas Geométricas) */}
      <div className="absolute inset-0 z-10 flex items-center justify-center mt-16">
        <div className="relative w-[1000px] h-[600px] transform scale-[0.65] sm:scale-75 lg:scale-90 xl:scale-100 transition-transform duration-500">
          
          <AnimatePresence mode="wait">
            
            {/* ===== VIEW: MODOS DE JOGO (PLAY) ===== */}
            {currentView === "play" && (
              <motion.div key="play-view" className="absolute inset-0">
                
                {/* Top-Left: Ranked Arena */}
                <GlassShard delay={0.1} gradient="from-blue-900 via-indigo-900 to-black" clipPath="polygon(10% 0, 100% 0, 80% 100%, 0 80%)" style={{ top: "10%", left: "5%", width: "35%", height: "35%" }}>
                  <Icons.Shield />
                  <span className="text-white font-black text-xl uppercase tracking-[0.1em]">Arena Ranked</span>
                </GlassShard>

                {/* Center: Random Player / PvP */}
                <GlassShard delay={0.2} gradient="from-fuchsia-900 via-pink-800 to-rose-900" clipPath="polygon(50% 0, 100% 30%, 80% 100%, 20% 100%, 0 30%)" style={{ top: "20%", left: "35%", width: "30%", height: "60%", zIndex: 20 }}>
                  <Icons.Swords />
                  <span className="text-white font-black text-2xl uppercase tracking-[0.1em] mt-2 leading-tight">Jogador<br/>Aleatório</span>
                  <span className="text-fuchsia-300 font-bold mt-4 text-xl drop-shadow-[0_0_5px_rgba(217,70,239,0.8)]">VS</span>
                </GlassShard>

                {/* Top-Right: Friend Match */}
                <GlassShard delay={0.3} gradient="from-cyan-900 via-teal-800 to-black" clipPath="polygon(0 0, 90% 20%, 100% 100%, 20% 80%)" style={{ top: "10%", right: "5%", width: "35%", height: "35%" }}>
                  <Icons.Users />
                  <span className="text-white font-black text-xl uppercase tracking-[0.1em]">Contra Amigos</span>
                </GlassShard>

                {/* Bottom-Left: Story Mode */}
                <GlassShard delay={0.4} gradient="from-yellow-900 via-amber-800 to-black" clipPath="polygon(20% 0, 100% 20%, 80% 100%, 0 100%)" style={{ bottom: "5%", left: "10%", width: "30%", height: "35%" }}>
                  <Icons.Book />
                  <span className="text-white font-black text-xl uppercase tracking-[0.1em]">História</span>
                </GlassShard>

                {/* Bottom-Right: Bot Match (MANDA PRO JOGO) */}
                <GlassShard 
                  delay={0.5} 
                  gradient="from-emerald-900 via-green-800 to-black" 
                  clipPath="polygon(0 20%, 80% 0, 100% 80%, 20% 100%)" 
                  style={{ bottom: "5%", right: "10%", width: "30%", height: "35%" }}
                  onClick={() => window.location.href = '/game'} 
                >
                  <Icons.Bot />
                  <span className="text-white font-black text-xl uppercase tracking-[0.1em]">Partida vs Bot</span>
                </GlassShard>

                {/* Botão de Voltar para o Hub */}
                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
                  <motion.button 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
                    onClick={() => setCurrentView("home")}
                    className="text-gray-400 hover:text-cyan-400 uppercase tracking-widest text-sm font-bold flex items-center gap-2 transition-colors"
                  >
                    ← Voltar ao Início
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ===== VIEW: HUB INICIAL (HOME) ===== */}
            {currentView === "home" && (
              <motion.div key="home-view" className="absolute inset-0">
                <GlassShard delay={0.1} title="Arcade" gradient="from-fuchsia-900 via-purple-800 to-blue-900" clipPath="polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)" style={{ top: "15%", left: "10%", width: "25%", height: "45%" }}>
                  <span className="text-white font-black text-2xl uppercase tracking-[0.2em]">Arcade</span>
                </GlassShard>
                
                <GlassShard delay={0.2} title="Campanha" gradient="from-gray-800 via-slate-700 to-black" clipPath="polygon(0% 20%, 100% 0%, 100% 80%, 50% 100%, 0% 80%)" style={{ top: "15%", right: "10%", width: "25%", height: "45%" }}>
                  <span className="text-white font-black text-2xl uppercase tracking-[0.2em]">Campanha</span>
                </GlassShard>
                
                <GlassShard delay={0.3} title="Duelo" gradient="from-cyan-700 via-blue-800 to-emerald-800" clipPath="polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" style={{ top: "25%", left: "35%", width: "30%", height: "50%", zIndex: 20 }}>
                  <span className="text-white font-black text-3xl uppercase tracking-[0.2em]">Duelo</span>
                </GlassShard>
                
                <GlassShard delay={0.4} title="Eventos" gradient="from-red-900 via-orange-900 to-stone-800" clipPath="polygon(20% 0%, 100% 0%, 80% 100%, 0% 100%)" style={{ bottom: "5%", left: "20%", width: "28%", height: "35%" }}>
                  <span className="text-white font-black text-2xl uppercase tracking-[0.2em]">Eventos</span>
                </GlassShard>
                
                <GlassShard delay={0.5} title="Draft" gradient="from-yellow-700 via-amber-600 to-orange-800" clipPath="polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" style={{ bottom: "5%", right: "20%", width: "28%", height: "35%" }}>
                  <span className="text-white font-black text-2xl uppercase tracking-[0.2em]">Draft</span>
                </GlassShard>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Fendas/Luzes fixas no fundo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-1 bg-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,1)] rotate-[15deg] mix-blend-screen pointer-events-none z-0 opacity-70"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-1 bg-fuchsia-400/50 shadow-[0_0_20px_rgba(217,70,239,1)] rotate-[-45deg] mix-blend-screen pointer-events-none z-0 opacity-70"></div>
        </div>
      </div>

      {/* 7. BOTTOM BAR (Perfil do Jogador) */}
      <div className="absolute bottom-8 right-8 z-40">
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="flex items-center gap-4 bg-white/5 border border-white/10 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl cursor-pointer hover:bg-white/10 transition-all duration-300 group"
        >
          <span className="text-gray-400 font-bold tracking-widest uppercase text-sm group-hover:text-white transition-colors">
            ???
          </span>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 p-[2px] shadow-[0_0_10px_rgba(0,0,0,0.5)] group-hover:from-cyan-400 group-hover:to-blue-600 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all duration-500">
            <div className="w-full h-full rounded-full bg-black/80 flex items-center justify-center text-gray-500 group-hover:text-cyan-400 transition-colors">
              <Icons.User />
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}