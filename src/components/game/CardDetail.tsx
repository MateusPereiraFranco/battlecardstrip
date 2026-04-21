// src/components/game/CardDetail.tsx
import React from "react";
import Image from "next/image";
import { Card } from "../../types/card";
import { getEffectiveStats } from "../../utils/rules";
// 👇 IMPORTA TODAS AS UTILIDADES DE VISUAL AQUI
import {
  getDynamicAssets,
  getNivelNeonClass,
  GLASS_CLIP_PATH,
  getStatColorClass,
  getCardTypeLabel,
  getCardNameClass,
} from "../../utils/cardVisuals";

interface CardDetailProps {
  card: Card | null;
  activeFieldSpells?: (Card | null)[];
  equipments?: (Card | null)[];
}

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
  const isMonster = "attack" in card;
  const assets = getDynamicAssets(card);
  const monsterLevel = "level" in card ? card.level : 1;
  const neonClass = getNivelNeonClass(monsterLevel, "lg");

  return (
    <div className="w-full h-full flex flex-col gap-6 pb-4 overflow-y-auto custom-scrollbar">
      <div className="w-full flex items-center justify-center relative shrink-0 mt-8">
        <div
          className="relative w-full max-w-[280px] aspect-[100/145] z-10 select-none"
          style={{ filter: `drop-shadow(0px 15px 25px rgba(0,0,0,0.9))` }}
        >
          <div className="absolute inset-0 rounded-xl overflow-hidden bg-gray-900 z-0">
            <Image
              src={card.image}
              alt={card.name}
              fill
              sizes="280px"
              quality={100}
              className="object-cover object-top"
            />
          </div>

          <div className="absolute -inset-[8px] z-10 pointer-events-none">
            <Image
              src={assets.border}
              alt="Borda"
              fill
              sizes="300px"
              className="object-fill drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]"
            />
          </div>

          <div className="absolute inset-0 z-20 pointer-events-none">
            {isMonster && (
              <div className="absolute -top-[1px] -left-[-11px] w-[50px] h-[80px] flex items-center justify-center mix-blend-screen drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                <Image
                  src={assets.levelGem}
                  alt="Level"
                  fill
                  className="object-contain"
                />
                <span
                  className={`relative z-10 ${neonClass} font-black text-[30px] pb-1`}
                >
                  {monsterLevel}
                </span>
              </div>
            )}

            <div className="absolute top-[10px] -right-[-15px] flex flex-col items-center -space-y-[22px]">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="relative w-[17px] h-[42px] mix-blend-screen drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]"
                >
                  <Image
                    src={
                      i < card.manaCost ? assets.manaFilled : assets.manaEmpty
                    }
                    alt="Mana"
                    fill
                    className="object-contain"
                  />
                </div>
              ))}
            </div>

            <div className="absolute top-[4%] left-[15%] right-[7%] h-[15%] flex items-center justify-center">
              <span className={`text-[17px] ${getCardNameClass("sm")}`}>
                {card.name}
              </span>
            </div>

            <div
              className="absolute bottom-[11%] left-1/2 -translate-x-1/2 w-[88%] h-[26%] bg-purple-900/50 backdrop-blur-md border-[2px] border-cyan-400/30 flex flex-col items-center justify-start p-2 shadow-[0_8px_20px_rgba(0,0,0,0.8)] z-20"
              style={{ clipPath: GLASS_CLIP_PATH }} // 👈 Reciclado!
            >
              <span className="text-[12px] text-cyan-300 font-bold uppercase tracking-widest text-center leading-none mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                {getCardTypeLabel(card)} {/* 👈 Reciclado! */}
              </span>
              <div className="text-[11px] text-gray-200 leading-[1.3] text-center overflow-hidden line-clamp-4 w-full px-1 font-medium drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
                {card.description || "Sem descrição disponível."}
              </div>
            </div>

            {isMonster && currentStats && (
              <>
                <div className="absolute -bottom-[20px] -left-[25px] w-[120px] h-[120px] flex items-center justify-center drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] z-30">
                  <Image
                    src={assets.atkIcon}
                    alt="ATK"
                    fill
                    className="object-contain opacity-70"
                  />
                  {/* 👇 Atualizado: Passando "atk" 👇 */}
                  <span
                    className={`relative z-10 top-5 text-[34px] font-black tracking-tighter ${getStatColorClass(currentStats.isBuffed, "atk", "lg")}`}
                  >
                    {currentStats.attack}
                  </span>
                </div>

                <div className="absolute -bottom-[15px] -right-[15px] w-[90px] h-[90px] flex items-center justify-center mix-blend-screen drop-shadow-[0_0_10px_rgba(168,85,247,0.5)] z-30">
                  <Image
                    src={assets.defIcon}
                    alt="DEF"
                    fill
                    className="object-contain"
                  />
                  {/* 👇 Atualizado: Passando "def" 👇 */}
                  <span
                    className={`relative z-10 top-1 text-[28px] font-black tracking-tighter ${getStatColorClass(currentStats.isBuffed, "def", "lg")}`}
                  >
                    {currentStats.defense}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 bg-slate-900/90 backdrop-blur-sm border border-white/10 p-5 rounded-xl flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden shrink-0 mt-4">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
        <div className="flex justify-between items-start border-b border-white/10 pb-3 mb-3">
          <h2 className="text-xl font-black text-white uppercase tracking-wider leading-tight drop-shadow-md">
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
        <div className="flex-1 text-sm text-slate-200 leading-relaxed overflow-y-auto font-sans pr-3 custom-scrollbar">
          {card.description}
        </div>
      </div>
    </div>
  );
}
