// src/components/CardDetail.tsx
import React from "react";
import Image from "next/image";
import { Card } from "../types/card";
import { getEffectiveStats } from "../utils/rules"; // 👇 1. Importamos o Motor de Regras!

interface CardDetailProps {
  card: Card | null;
  activeFieldSpells?: (Card | null)[];
  equipments?: (Card | null)[]; // 👇 2. Agora ele recebe os equipamentos da mesa!
}

export default function CardDetail({
  card,
  activeFieldSpells = [],
  equipments = [], // 👇 3. Recebe a lista (padrão é vazio)
}: CardDetailProps) {
  if (!card) {
    return (
      <div
        style={{ width: "340px", height: "490px" }}
        className="border-[6px] border-gray-800 rounded-md bg-gray-900 flex items-center justify-center text-gray-400 p-4 text-center"
      >
        Clique em uma carta para ver seus detalhes.
      </div>
    );
  }

  // 👇 4. O painel agora calcula os status reais consolidados!
  const currentStats = getEffectiveStats(card, activeFieldSpells, equipments);

  const getCardColor = () => {
    switch (card.cardType) {
      case "NormalMonster":
        return "bg-yellow-400";
      case "EffectMonster":
        return "bg-orange-400";
      case "Spell":
        return "bg-emerald-500";
      case "Trap":
        return "bg-pink-500";
      case "FieldSpell":
        return "bg-emerald-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div
      style={{ width: "340px", height: "490px", minWidth: "340px" }}
      className={`relative border-[8px] border-gray-800 rounded-sm p-1 shadow-2xl ${getCardColor()}`}
    >
      <div className="border-[1.5px] border-black/40 w-full h-full p-1 flex flex-col">
        <div className="flex justify-between items-center border-[2px] border-black/30 px-2 py-1 shadow-sm bg-white/20">
          <h2 className="text-lg font-bold text-black font-serif leading-none drop-shadow-md">
            {card.name}
          </h2>
          <span className="text-xs font-bold text-white bg-black/80 rounded-full px-2 py-[2px] border border-white/50 shadow-md">
            {"attribute" in card ? card.attribute.toUpperCase() : "MAGIA"}
          </span>
        </div>

        <div className="h-6 flex justify-end items-center px-2">
          {"level" in card && (
            <span className="text-red-600 drop-shadow-sm font-bold tracking-widest">
              {"⭐".repeat(card.level)}
            </span>
          )}
        </div>

        <div className="relative w-[280px] h-[280px] mx-auto border-[4px] border-t-slate-400 border-l-slate-400 border-b-slate-600 border-r-slate-600 shadow-2xl bg-black overflow-hidden flex items-center justify-center">
          <Image
            src={card.image}
            alt={card.name}
            fill
            sizes="300px"
            className="object-cover"
          />
        </div>

        <div className="flex-1 mt-3 bg-orange-50/95 border-[2px] border-amber-600/50 flex flex-col p-2 shadow-inner">
          <div className="text-[13px] font-bold text-gray-900 border-b border-black/20 pb-[2px] mb-1">
            {"race" in card ? `[ ${card.race} / Normal ]` : "[ Carta Mágica ]"}
          </div>

          <div className="flex-1 text-[11px] text-gray-800 leading-tight overflow-y-auto italic font-serif">
            {card.description}
          </div>

          {/* 👇 5. Mostramos o Status consolidados e pintamos de azul se houver bônus! */}
          {"attack" in card && currentStats && (
            <div className="text-right border-t border-black/20 mt-1 pt-1 text-sm font-bold flex justify-end gap-3">
              <span
                className={
                  currentStats.isBuffed
                    ? "text-blue-700 font-extrabold"
                    : "text-black"
                }
              >
                ATK/ {currentStats.attack}
              </span>
              <span
                className={
                  currentStats.isBuffed
                    ? "text-blue-700 font-extrabold"
                    : "text-black"
                }
              >
                DEF/ {currentStats.defense}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
