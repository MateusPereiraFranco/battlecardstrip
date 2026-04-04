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

  const getCardShape = (type?: string, isFaceDown?: boolean) => {
    if (isFaceDown)
      return "polygon(15% 0, 85% 0, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0 85%, 0 15%)";
    switch (type) {
      case "NormalMonster":
      case "EffectMonster":
      case "FusionMonster":
        return "polygon(50% 0%, 100% 15%, 90% 100%, 10% 100%, 0% 15%)";
      case "Spell":
        return "polygon(10% 0%, 100% 10%, 90% 100%, 0% 90%)";
      case "EquipSpell":
        return "polygon(50% 0%, 100% 25%, 85% 100%, 15% 100%, 0% 25%)";
      case "Trap":
        return "polygon(15% 0%, 85% 0%, 100% 25%, 70% 100%, 30% 100%, 0% 25%)";
      case "FieldSpell":
        return "polygon(0% 15%, 50% 0%, 100% 15%, 100% 85%, 50% 100%, 0% 85%)";
      default:
        return "polygon(0 0, 100% 0, 100% 100%, 0 100%)";
    }
  };

  const getThemeColors = () => {
    switch (card.cardType) {
      case "NormalMonster":
        return {
          glow: "rgba(250,204,21,0.6)",
          border: "from-yellow-400 via-yellow-700 to-yellow-900",
        };
      case "EffectMonster":
        return {
          glow: "rgba(249,115,22,0.6)",
          border: "from-orange-400 via-orange-700 to-orange-900",
        };
      case "FusionMonster":
        return {
          glow: "rgba(168,85,247,0.6)",
          border: "from-purple-400 via-purple-700 to-purple-900",
        };
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
          glow: "rgba(156,163,175,0.6)",
          border: "from-gray-400 via-gray-700 to-gray-900",
        };
    }
  };

  const cardShape = getCardShape(card.cardType, card.isFaceDown);
  const theme = getThemeColors();
  const isMonster = "attack" in card;

  return (
    <div className="w-full h-full flex flex-col gap-4 pb-4">
      <div className="w-full h-[300px] flex items-center justify-center relative shrink-0 mt-2">
        {/* OTIMIZAÇÃO: will-change-filter adicionado aqui para estabilizar a sombra */}
        <div
          className="absolute inset-0 z-0 opacity-50 transition-all duration-300 will-change-[filter]"
          style={{ filter: `drop-shadow(0px 0px 20px ${theme.glow})` }}
        >
          <div
            className="w-[260px] h-[300px] bg-white mx-auto"
            style={{ clipPath: cardShape }}
          ></div>
        </div>

        <div className="relative w-[260px] h-[300px] z-10 transition-transform duration-300 hover:scale-[1.02] will-change-transform">
          <div
            className={`absolute inset-0 bg-gradient-to-br ${theme.border}`}
            style={{ clipPath: cardShape }}
          ></div>

          <div
            className="absolute z-10 overflow-hidden bg-black"
            style={{
              top: "3px",
              left: "3px",
              right: "3px",
              bottom: "3px",
              clipPath: cardShape,
            }}
          >
            <Image
              src={card.image}
              alt={card.name}
              fill
              sizes="260px"
              className="object-cover opacity-90 hover:opacity-100 transition-opacity duration-300"
            />
            {/* OTIMIZAÇÃO: Removido o mix-blend-overlay, o vidro reflexivo agora é apenas um gradiente limpo */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 pointer-events-none"></div>
          </div>
        </div>
      </div>

      {/* Reduzimos o Blur de 'backdrop-blur-xl' para 'backdrop-blur-sm' para performance */}
      <div className="flex-1 bg-slate-900/90 backdrop-blur-sm border border-white/10 p-5 rounded-xl flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>

        <div className="flex justify-between items-start border-b border-white/10 pb-3 mb-3">
          <h2 className="text-2xl font-black text-white uppercase tracking-wider leading-tight drop-shadow-md">
            {card.name}
          </h2>
          {"level" in card && (
            <div className="flex items-center justify-center bg-black/50 border border-white/20 px-3 py-1 rounded shadow-inner ml-2">
              <span className="text-amber-400 font-black text-base drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]">
                Lv.{card.level}
              </span>
            </div>
          )}
        </div>

        <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-3 flex gap-2">
          <span>
            {isMonster
              ? `Fragmento Vivo • ${"race" in card ? card.race : ""}`
              : "Fragmento Arcano"}
          </span>
          <span className="text-cyan-700">•</span>
          <span className="text-cyan-200">
            {card.cardType
              .replace("Monster", "")
              .replace("Spell", " Mágica")
              .replace("Trap", "Armadilha")}
          </span>
        </div>

        <div className="flex-1 text-base text-slate-200 leading-relaxed overflow-y-auto font-sans pr-3 custom-scrollbar">
          {card.description}
        </div>

        {isMonster && currentStats && (
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-2 bg-black/40 rounded-lg p-4 shadow-inner">
            <div className="flex justify-around items-center w-full">
              <div
                className={`flex items-baseline gap-2 text-3xl ${currentStats.isBuffed ? "text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]" : "text-white"} font-black`}
              >
                <span className="text-sm opacity-60 font-normal tracking-widest">
                  ATK
                </span>{" "}
                {currentStats.attack}
              </div>
              <div className="w-px h-8 bg-white/10"></div>
              <div
                className={`flex items-baseline gap-2 text-3xl ${currentStats.isBuffed ? "text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]" : "text-slate-300"} font-black`}
              >
                <span className="text-sm opacity-60 font-normal tracking-widest">
                  DEF
                </span>{" "}
                {currentStats.defense}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
