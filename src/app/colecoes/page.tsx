"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ==========================================
// 1. TIPOS E DADOS SIMULADOS (Baseado no seu card.ts)
// ==========================================
type CardAttribute = "Fogo" | "Água" | "Terra" | "Vento" | "Luz" | "Trevas" | "Divino";
type MonsterRace = "Dragão" | "Guerreiro" | "Mago" | "Besta" | "Demônio" | "Máquina" | "Soldado";

interface BaseCard {
  id: string;
  name: string;
  description: string;
  image: string;
  manaCost: number;
}

interface MonsterCard extends BaseCard {
  cardType: "NormalMonster" | "EffectMonster" | "FusionMonster";
  level: number;
  attack: number;
  defense: number;
  attribute: CardAttribute;
  race: MonsterRace;
}

interface SpellTrapCard extends BaseCard {
  cardType: "Spell" | "EquipSpell" | "Trap" | "FieldSpell";
}

type Card = MonsterCard | SpellTrapCard;

// Banco de dados falso para visualização
const mockCards: Card[] = [
  { id: "c1", name: "Dragão Estelar", description: "Um dragão nascido do pó das estrelas. Ganha +500 ATK se houver um campo de luz.", image: "🌌", manaCost: 5, cardType: "EffectMonster", level: 8, attack: 3000, defense: 2500, attribute: "Luz", race: "Dragão" },
  { id: "c2", name: "Soldado da Trincheira", description: "Guerreiro leal que nunca abandona seu posto. Base do deck de guerra.", image: "🪖", manaCost: 2, cardType: "NormalMonster", level: 4, attack: 1800, defense: 1500, attribute: "Terra", race: "Soldado" },
  { id: "c3", name: "Maga Cibernética", description: "Hackeia os sistemas do oponente, revelando uma carta aleatória da mão deles.", image: "💻", manaCost: 3, cardType: "EffectMonster", level: 4, attack: 1500, defense: 1200, attribute: "Trevas", race: "Mago" },
  { id: "c4", name: "Buraco Negro Dimensional", description: "Destrói todos os monstros em campo. Uma força implacável.", image: "🕳️", manaCost: 4, cardType: "Spell" },
  { id: "c5", name: "Canhão Amaldiçoado", description: "Equipe apenas num Soldado. Ele ganha +400 ATK.", image: "🔫", manaCost: 1, cardType: "EquipSpell" },
  { id: "c6", name: "Mina Terrestre", description: "Armadilha mortal. Quando o inimigo ataca, destrói o atacante.", image: "💣", manaCost: 2, cardType: "Trap" },
  { id: "c7", name: "Guardião de Fogo", description: "Uma besta feita de pura chama e fúria.", image: "🔥", manaCost: 4, cardType: "NormalMonster", level: 6, attack: 2400, defense: 1000, attribute: "Fogo", race: "Besta" },
  { id: "c8", name: "Campo Eletromagnético", description: "Monstros Máquina ganham +500 DEF.", image: "⚡", manaCost: 2, cardType: "FieldSpell" },
  { id: "c9", name: "Ciborgue Assassino", description: "Ataca duas vezes se tiver equipamentos.", image: "🤖", manaCost: 3, cardType: "EffectMonster", level: 4, attack: 1700, defense: 1000, attribute: "Trevas", race: "Máquina" },
  { id: "c10", name: "Lobo de Gelo", description: "Congela o inimigo ao atacar.", image: "🐺", manaCost: 2, cardType: "NormalMonster", level: 3, attack: 1200, defense: 800, attribute: "Água", race: "Besta" },
];

const mockDecks = [
  { id: "d1", name: "Vanguarda Cósmica", color: "from-blue-600 to-cyan-400" },
  { id: "d2", name: "Enxame das Sombras", color: "from-purple-900 to-fuchsia-600" },
  { id: "d3", name: "Tropa da Trincheira", color: "from-emerald-700 to-green-500" },
];

// ==========================================
// 2. ÍCONES SVG (Sem bibliotecas externas)
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
  Search: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  Filter: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
  User: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
};

// ==========================================
// 3. COMPONENTES VISUAIS
// ==========================================
const SidebarButton = ({ label, icon: Icon, onClick, isPrimary = false, isActive = false }: any) => (
  <motion.button
    whileHover={{ scale: 1.05, x: 10 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`group flex items-center gap-4 w-full px-6 py-3 mb-4 rounded-r-full border-y border-r transition-all duration-300
      ${isActive 
        ? "bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)] text-white" 
        : isPrimary
          ? "bg-fuchsia-500/10 border-fuchsia-400/50 text-fuchsia-300"
          : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-cyan-400 text-gray-300 hover:text-white"
      } backdrop-blur-sm`}
  >
    <div className={`${isActive || isPrimary ? "text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" : "text-gray-400 group-hover:text-cyan-400 transition-colors"}`}>
      <Icon />
    </div>
    <span className="font-bold tracking-widest uppercase text-sm">{label}</span>
  </motion.button>
);

const CardVisual = ({ card, onClick }: { card: Card; onClick: () => void }) => {
  const isMonster = "attack" in card;
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -10 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative w-40 h-56 rounded-lg border-2 border-cyan-800 bg-gray-900 overflow-hidden cursor-pointer shadow-[0_5px_15px_rgba(0,0,0,0.5)] hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all flex flex-col"
    >
      <div className="absolute top-1 left-1 bg-cyan-500 rounded-full w-6 h-6 flex items-center justify-center border border-white text-xs font-black shadow-md z-10">
        {card.manaCost}
      </div>
      <div className="h-1/2 w-full bg-gradient-to-b from-slate-700 to-gray-800 flex flex-col">
        <div className="text-[10px] font-black uppercase text-center mt-1 text-cyan-100 px-6 truncate">{card.name}</div>
        <div className="flex-1 flex items-center justify-center text-4xl drop-shadow-lg">{card.image}</div>
      </div>
      <div className="flex-1 p-2 bg-gray-950 flex flex-col justify-between border-t border-cyan-900/50">
        <p className="text-[8px] text-gray-400 leading-tight line-clamp-3">{card.description}</p>
        {isMonster && (
          <div className="flex justify-between items-center mt-1 pt-1 border-t border-gray-800">
            <span className="text-[10px] font-bold text-red-400">⚔️ {(card as MonsterCard).attack}</span>
            <span className="text-[10px] font-bold text-blue-400">🛡️ {(card as MonsterCard).defense}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ==========================================
// 4. A PÁGINA PRINCIPAL
// ==========================================
export default function Collection() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterRace, setFilterRace] = useState("All");
  const [filterAttr, setFilterAttr] = useState("All");
  const [filterType, setFilterType] = useState("All");

  const filteredCards = useMemo(() => {
    return mockCards.filter((card) => {
      const matchName = card.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterType === "All" || card.cardType.includes(filterType);
      let matchRace = true;
      let matchAttr = true;
      if ("attack" in card) {
        matchRace = filterRace === "All" || card.race === filterRace;
        matchAttr = filterAttr === "All" || card.attribute === filterAttr;
      } else {
        if (filterRace !== "All") matchRace = false;
        if (filterAttr !== "All") matchAttr = false;
      }
      return matchName && matchType && matchRace && matchAttr;
    });
  }, [searchTerm, filterRace, filterAttr, filterType]);

  const menuItems = [
    { label: "Jogar", icon: Icons.Play, action: () => window.location.href = '/lobby' },
    { label: "Lobby", icon: Icons.Exit, action: () => window.location.href = '/lobby' },
    { label: "Coleções", icon: Icons.Collection, isActive: true, action: () => setIsSidebarOpen(false) },
    { label: "Loja", icon: Icons.Store, action: () => setIsSidebarOpen(false) },
    { label: "Configurações", icon: Icons.Settings, action: () => setIsSidebarOpen(false) },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-sans text-white select-none">
      
      {/* BACKGROUND ESTELAR */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-fuchsia-950/40 via-black to-black"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/30 via-transparent to-transparent"></div>
      </div>

      {/* ==========================================
          NAVBAR / HEADER
          ========================================== */}
      <header className="absolute top-0 left-0 w-full h-24 z-40 flex items-center justify-between px-8 bg-gradient-to-b from-black/90 to-transparent">
        <div className="flex items-center gap-6">
          <button onClick={() => setIsSidebarOpen(true)} className="text-cyan-400 hover:text-white transition-colors drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
            <Icons.Menu />
          </button>
          <h1 className="text-2xl tracking-widest font-black uppercase drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
            Collection
          </h1>
        </div>
        
        <div className="flex items-center gap-6">
          {/* HUD de Recursos */}
          <div className="hidden md:flex items-center gap-3 bg-white/5 border border-white/10 backdrop-blur-md px-4 py-2 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-2 text-cyan-300">
              <span className="text-[10px] uppercase font-bold bg-cyan-900/80 px-2 py-0.5 rounded-sm border border-cyan-500/50">Lvl</span>
              <span className="font-black text-sm">???</span>
            </div>
            <div className="w-px h-4 bg-white/20 mx-1"></div>
            <div className="flex items-center gap-2 text-yellow-400"><span className="text-sm">💰</span><span className="font-black text-sm">???</span></div>
            <div className="w-px h-4 bg-white/20 mx-1"></div>
            <div className="flex items-center gap-2 text-fuchsia-400"><span className="text-sm">💎</span><span className="font-black text-sm">???</span></div>
          </div>

          {/* Perfil */}
          <button className="flex items-center gap-3 bg-white/5 border border-white/10 backdrop-blur-md pl-4 pr-1 py-1 rounded-full shadow-lg hover:bg-white/10 transition-colors group">
            <span className="text-gray-400 font-bold tracking-widest uppercase text-xs group-hover:text-white hidden sm:block">???</span>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 p-[2px] shadow-[0_0_10px_rgba(0,0,0,0.5)] group-hover:from-cyan-400 group-hover:to-blue-600 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all">
              <div className="w-full h-full rounded-full bg-black/80 flex items-center justify-center text-gray-400 group-hover:text-cyan-400"><Icons.User /></div>
            </div>
          </button>
        </div>
      </header>

      {/* ==========================================
          SIDEBAR HAMBÚRGUER (Agora com os Links unificados)
          ========================================== */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[60]" />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 20 }} className="absolute top-0 left-0 h-full w-72 bg-gray-950/90 border-r border-white/10 z-[70] flex flex-col justify-center py-10 pr-6 pt-32 shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
              <button onClick={() => setIsSidebarOpen(false)} className="absolute top-8 left-8 text-gray-400 hover:text-white transition-colors"><Icons.Close /></button>
              <div className="mb-12 pl-6"><h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 uppercase tracking-tighter">Menu</h2></div>
              <div className="flex flex-col flex-1 w-full">
                {menuItems.map((item) => (
                  <SidebarButton key={item.label} label={item.label} icon={item.icon} isActive={item.isActive} onClick={item.action} />
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="absolute inset-0 pt-28 px-8 pb-8 z-10 flex flex-col gap-6">
        
        {/* PAINEL SUPERIOR: MEUS DECKS */}
        <section className="relative w-full h-1/3 bg-white/5 border border-cyan-500/30 rounded-2xl backdrop-blur-md p-6 flex flex-col shadow-[0_0_30px_rgba(34,211,238,0.1)]">
          <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-cyan-400 rounded-tl-2xl opacity-50"></div>
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-fuchsia-500 rounded-br-2xl opacity-50"></div>

          <div className="flex justify-between items-end mb-4">
            <h2 className="text-xl font-black uppercase tracking-[0.2em] text-cyan-200">Meus Decks</h2>
            <button className="text-sm uppercase tracking-widest font-bold bg-cyan-500/20 text-cyan-300 px-4 py-2 rounded-md border border-cyan-500/50 hover:bg-cyan-500/40 transition-colors">
              + Criar Novo Deck
            </button>
          </div>

          <div className="flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar items-center px-4">
            {mockDecks.map((deck) => (
              <motion.div
                key={deck.id}
                whileHover={{ scale: 1.05 }}
                className="group relative flex-shrink-0 w-48 h-28 rounded-xl border border-white/20 bg-gray-900 overflow-hidden cursor-pointer"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${deck.color} opacity-40 group-hover:opacity-60 transition-opacity`}></div>
                <div className="absolute inset-0 p-4 flex flex-col justify-between z-10">
                  <span className="font-bold text-sm tracking-wider uppercase text-white shadow-black drop-shadow-md">{deck.name}</span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                    <button className="p-2 bg-blue-500/80 rounded hover:bg-blue-400 text-white"><Icons.Edit /></button>
                    <button className="p-2 bg-red-500/80 rounded hover:bg-red-400 text-white"><Icons.Trash /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* PAINEL INFERIOR: TODAS AS CARTAS E FILTROS */}
        <section className="relative w-full h-2/3 bg-white/5 border border-fuchsia-500/30 rounded-2xl backdrop-blur-md p-6 flex flex-col shadow-[0_0_30px_rgba(217,70,239,0.1)]">
          <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-fuchsia-500 rounded-tr-2xl opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-cyan-400 rounded-bl-2xl opacity-50"></div>

          {/* BARRA DE FILTROS */}
          <div className="flex flex-wrap gap-4 mb-6 items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <Icons.Filter />
              <span className="font-bold tracking-widest uppercase text-sm text-gray-400">Filtros</span>
            </div>

            <div className="flex flex-wrap gap-3">
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-black/50 border border-white/20 text-sm text-gray-300 rounded px-3 py-2 outline-none focus:border-cyan-400">
                <option value="All">Tipos (Todos)</option>
                <option value="Monster">Monstros</option>
                <option value="Spell">Mágicas</option>
                <option value="Trap">Armadilhas</option>
              </select>
              <select value={filterAttr} onChange={(e) => setFilterAttr(e.target.value)} className="bg-black/50 border border-white/20 text-sm text-gray-300 rounded px-3 py-2 outline-none focus:border-cyan-400">
                <option value="All">Atributos (Todos)</option>
                <option value="Fogo">Fogo</option>
                <option value="Água">Água</option>
                <option value="Terra">Terra</option>
                <option value="Luz">Luz</option>
                <option value="Trevas">Trevas</option>
              </select>
              <select value={filterRace} onChange={(e) => setFilterRace(e.target.value)} className="bg-black/50 border border-white/20 text-sm text-gray-300 rounded px-3 py-2 outline-none focus:border-cyan-400">
                <option value="All">Raça (Todas)</option>
                <option value="Soldado">Soldado</option>
                <option value="Dragão">Dragão</option>
                <option value="Mago">Mago</option>
                <option value="Máquina">Máquina</option>
              </select>
              <div className="relative flex items-center">
                <input type="text" placeholder="Buscar carta..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-black/50 border border-white/20 text-sm text-white rounded-full pl-10 pr-4 py-2 outline-none focus:border-cyan-400 w-48 transition-all focus:w-64" />
                <div className="absolute left-4 text-gray-400"><Icons.Search /></div>
              </div>
            </div>
          </div>

          {/* GRID DE CARTAS */}
          <div className="flex-1 overflow-y-auto custom-scrollbar z-10 pr-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6 justify-items-center pb-10">
              {filteredCards.length > 0 ? (
                filteredCards.map((card) => (
                  <CardVisual key={card.id} card={card} onClick={() => setSelectedCard(card)} />
                ))
              ) : (
                <div className="col-span-full mt-20 text-center text-gray-500 font-bold uppercase tracking-widest">
                  Nenhuma carta encontrada.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* MODAL DE FOCO (Detalhes da Carta) */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setSelectedCard(null)}
          >
            <motion.div 
              initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex flex-col md:flex-row max-w-4xl w-full bg-gray-950 border border-cyan-500/50 rounded-2xl shadow-[0_0_50px_rgba(34,211,238,0.2)] overflow-hidden"
            >
              <button onClick={() => setSelectedCard(null)} className="absolute top-4 right-4 z-50 text-gray-400 hover:text-white bg-black/50 p-2 rounded-full backdrop-blur">
                <Icons.Close />
              </button>

              <div className="w-full md:w-1/2 p-8 flex justify-center items-center bg-gradient-to-br from-gray-900 to-black relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 to-transparent"></div>
                <div className="scale-[1.5] origin-center z-10 pointer-events-none">
                   <CardVisual card={selectedCard} onClick={() => {}} />
                </div>
              </div>

              <div className="w-full md:w-1/2 p-8 flex flex-col justify-center border-l border-white/10 relative">
                <div className="mb-2 text-cyan-400 text-sm font-bold tracking-widest uppercase">
                  {selectedCard.cardType.replace("Monster", " Monstro").replace("Spell", " Mágica").replace("Trap", " Armadilha")}
                </div>
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                  {selectedCard.name}
                </h2>

                {"attack" in selectedCard && (
                  <div className="flex gap-4 mb-6">
                    <div className="bg-white/5 border border-white/10 rounded px-4 py-2 flex flex-col items-center">
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest">Nível</span>
                      <span className="font-bold text-yellow-400 text-lg">{(selectedCard as MonsterCard).level}</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded px-4 py-2 flex flex-col items-center">
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest">Ataque</span>
                      <span className="font-bold text-red-400 text-lg">{(selectedCard as MonsterCard).attack}</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded px-4 py-2 flex flex-col items-center">
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest">Defesa</span>
                      <span className="font-bold text-blue-400 text-lg">{(selectedCard as MonsterCard).defense}</span>
                    </div>
                  </div>
                )}

                {"attribute" in selectedCard && (
                  <div className="flex gap-2 mb-6">
                    <span className="bg-cyan-900/50 text-cyan-300 px-3 py-1 rounded-full text-xs font-bold uppercase border border-cyan-500/50">
                      {(selectedCard as MonsterCard).attribute}
                    </span>
                    <span className="bg-fuchsia-900/50 text-fuchsia-300 px-3 py-1 rounded-full text-xs font-bold uppercase border border-fuchsia-500/50">
                      {(selectedCard as MonsterCard).race}
                    </span>
                  </div>
                )}

                <div className="mt-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Efeito / Descrição</h3>
                  <p className="text-gray-300 leading-relaxed text-lg bg-black/30 p-4 rounded-lg border border-white/5">
                    {selectedCard.description}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(34, 211, 238, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(34, 211, 238, 0.6); }
      `}} />
    </div>
  );
}