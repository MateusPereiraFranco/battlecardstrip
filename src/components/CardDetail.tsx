// src/components/CardDetail.tsx
import React from "react";
import Image from "next/image";
import { Card } from "../types/card";
import { getEffectiveStats } from "../utils/rules";

interface CardDetailProps {
  card: Card | null;
  activeFieldSpells?: (Card | null)[];
  equipments?: (Card | null)[];
}

// 👇 FUNÇÃO AUXILIAR: Define a cor Neon baseada no Nível 👇
const getNivelNeonClass = (level: number): string => {
  if (level <= 4)
    return "text-[#CD7F32] drop-shadow-[0_0_10px_rgba(205,127,50,0.8)]"; // Bronze Neon
  if (level <= 6)
    return "text-[#C0C0C0] drop-shadow-[0_0_10px_rgba(192,192,192,0.8)]"; // Prata Neon
  if (level <= 8)
    return "text-[#FFD700] drop-shadow-[0_0_15px_rgba(255,215,0,0.9)]"; // Ouro Neon
  return "text-[#b9f2ff] drop-shadow-[0_0_20px_rgba(185,242,255,1)]"; // Diamante Neon (9+)
};

export default function CardDetail({
  card,
  activeFieldSpells = [],
  equipments = [],
}: CardDetailProps) {
  if (!card) {
    return (
      <div className="w-full h-full min-h-[500px] border border-slate-700 rounded-xl bg-slate-900/50 flex flex-col items-center justify-center text-slate-500 p-4 text-center backdrop-blur-sm shadow-2xl">
        <div className="w-16 h-16 border border-slate-600 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl font-mono text-cyan-700">A</span>
        </div>
        <p className="text-lg">Aguardando transmissão holográfica...</p>
      </div>
    );
  }

  const currentStats = getEffectiveStats(card, activeFieldSpells, equipments);

  const getThemeColors = () => {
    switch (card.cardType) {
      case "Spell":
        return {
          glow: "rgba(16,185,129,0.6)",
          border: "from-emerald-400 via-emerald-700 to-emerald-900",
        };
      case "EquipSpell":
        return {
          glow: "rgba(56,189,248,0.6)",
          border: "from-cyan-400 via-cyan-700 to-cyan-900",
        };
      case "Trap":
        return {
          glow: "rgba(236,72,153,0.6)",
          border: "from-pink-400 via-pink-700 to-pink-900",
        };
      case "FieldSpell":
        return {
          glow: "rgba(16,185,129,0.6)",
          border: "from-teal-400 via-teal-700 to-teal-900",
        };
      default:
        return {
          glow: "rgba(250,204,21,0.6)",
          border: "from-gray-400 via-gray-700 to-gray-900",
        };
    }
  };

  const isMonster = "attack" in card;
  const theme = getThemeColors();

  const monsterLevel = "level" in card ? card.level : 1;
  const neonClass = getNivelNeonClass(monsterLevel);

  return (
    <div className="w-full h-full flex flex-col gap-4 pb-4 overflow-y-auto custom-scrollbar">
      {/* === ÁREA DA IMAGEM DA CARTA GIGANTE === */}
      <div className="w-full flex items-center justify-center relative shrink-0 mt-8 aspect-[3/4]">
        {isMonster ? (
          /* ============================================== */
          /* SE FOR MONSTRO: MANTÉM OS SEUS AJUSTES EXATOS! */
          /* ============================================== */
          <div
            className="relative w-full h-full max-w-[280px] z-10"
            style={{ filter: `drop-shadow(0px 15px 25px rgba(0,0,0,0.9))` }}
          >
            {/* 👇 MANTIDO O SEU AJUSTE AQUI 👇 */}
            <div
              className="absolute top-[10%] left-[15%] right-[12%] bottom-[15%] z-0 overflow-hidden bg-black"
              style={{
                clipPath:
                  "polygon(50% 0%, 100% 15%, 100% 100%, 0% 100%, 0% 15%)",
              }}
            >
              <Image
                src={card.image}
                alt={card.name}
                fill
                sizes="280px"
                quality={100}
                className="object-cover transition-transform duration-500 hover:scale-110"
              />
            </div>

            <div className="absolute inset-0 z-10 pointer-events-none">
              <Image
                src="/images/frames/monster-frame.png"
                alt="Frame"
                fill
                sizes="280px"
                className="object-contain"
                priority
              />
            </div>

            <div className="absolute inset-0 z-20 pointer-events-none">
              {/* 👇 MANTIDO O SEU AJUSTE AQUI 👇 */}
              <div className="absolute top-[5%] left-[15%] w-[25%] aspect-square flex items-center justify-center">
                <span
                  className={`${neonClass} font-black text-[36px] drop-shadow-[0_2px_4px_rgba(0,0,0,1)]`}
                >
                  {monsterLevel}
                </span>
              </div>

              {/* 👇 MANTIDO O SEU AJUSTE AQUI 👇 */}
              {currentStats && (
                <div className="absolute bottom-[13%] left-[50%] -translate-x-1/2 w-[38%] h-[20%] flex flex-col items-center justify-center">
                  <span
                    className={`text-[20px] leading-none ${currentStats.isBuffed ? "text-cyan-300 drop-shadow-[0_0_15px_rgba(34,211,238,1)]" : "text-white"} font-black drop-shadow-[0_4px_6px_rgba(0,0,0,1)] tracking-wider`}
                  >
                    {currentStats.attack}
                  </span>
                  <div className="w-[60%] border-b-[2px] border-white/30 my-[3px]"></div>
                  <span
                    className={`text-[17px] leading-none ${currentStats.isBuffed ? "text-cyan-300 drop-shadow-[0_0_15px_rgba(34,211,238,1)]" : "text-gray-300"} font-black drop-shadow-[0_4px_6px_rgba(0,0,0,1)] tracking-wider`}
                  >
                    {currentStats.defense}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ==================================================== */
          /* SE FOR MAGIA/ARMADILHA: NOVA ARQUITETURA DE SANDUÍCHE */
          /* ==================================================== */
          <div
            className="relative w-full h-full max-w-[280px] z-10"
            style={{ filter: `drop-shadow(0px 15px 25px rgba(0,0,0,0.9))` }}
          >
            {/* 👇 AJUSTE AQUI: Recorte da Imagem Gigante da Magia 👇 */}
            <div
              className="absolute top-[8%] left-[23%] right-[16%] bottom-[15%] z-0 overflow-hidden bg-black"
              style={{
                clipPath:
                  "polygon(50% 0%, 100% 20%, 100% 80%, 50% 100%, 0% 80%, 0% 20%)",
              }}
            >
              <Image
                src={card.image}
                alt={card.name}
                fill
                sizes="280px"
                quality={100}
                className="object-cover transition-transform duration-500 hover:scale-110"
              />
            </div>

            <div className="absolute inset-0 z-10 pointer-events-none">
              <Image
                src="/images/frames/spell-frame.png"
                alt="Frame"
                fill
                sizes="280px"
                className="object-contain"
                priority
              />
            </div>

            <div className="absolute inset-0 z-20 pointer-events-none">
              {/* 👇 AJUSTE AQUI: Custo de Mana Gigante 👇 */}
              <div className="absolute top-[5%] left-[15%] w-[25%] aspect-square flex items-center justify-center">
                <span className="text-cyan-300 font-black text-[36px] drop-shadow-[0_4px_6px_rgba(0,0,0,1)]">
                  {card.manaCost}
                </span>
              </div>

              {/* 👇 AJUSTE AQUI: Fita Inferior Gigante 👇 */}
              <div className="absolute bottom-[20%] left-[50%] -translate-x-1/2 w-[60%] h-[15%] flex items-center justify-center">
                <span className="text-[18px] text-white font-black drop-shadow-[0_4px_4px_rgba(0,0,0,1)] uppercase tracking-widest text-center">
                  {card.cardType === "Spell"
                    ? "Mágica"
                    : card.cardType === "EquipSpell"
                      ? "Equip"
                      : card.cardType === "Trap"
                        ? "Armadilha"
                        : "Campo"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* === PAINEL DE INFORMAÇÕES (HUD INFERIOR) === */}
      <div className="flex-1 bg-slate-900/90 backdrop-blur-sm border border-white/10 p-5 rounded-xl flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden shrink-0">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>

        {/* NOME DA CARTA E TIPO */}
        <div className="flex justify-between items-start border-b border-white/10 pb-3 mb-3">
          <h2 className="text-2xl font-black text-white uppercase tracking-wider leading-tight drop-shadow-md">
            {card.name}
          </h2>
          <div className="flex items-center justify-center bg-black/50 border border-white/20 px-3 py-1 rounded shadow-inner ml-2">
            <span className="text-cyan-400 font-black text-xs uppercase">
              {isMonster
                ? `Fragmento Vivo • ${"race" in card ? card.race : ""}`
                : card.cardType.replace("Spell", "Magia")}
            </span>
          </div>
        </div>

        {/* DESCRIÇÃO */}
        <div className="flex-1 text-base text-slate-200 leading-relaxed overflow-y-auto font-sans pr-3 custom-scrollbar">
          {card.description}
        </div>
      </div>
    </div>
  );
}
