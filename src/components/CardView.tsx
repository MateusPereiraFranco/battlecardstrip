// src/components/CardView.tsx
"use client";

import React from "react";
import Image from "next/image";
import { Card } from "../types/card";
import { motion } from "framer-motion";
import { getEffectiveStats } from "../utils/rules";

interface CardViewProps {
  card: Card | null;
  activeFieldSpells?: (Card | null)[];
  equipments?: (Card | null)[];
  onClick?: (card: Card) => void;
  onPlayCard?: (card: Card) => void;
  disableDrag?: boolean;
  isAttacking?: boolean;
  attackTrajectory?: { x: number; y: number } | null;
  isOpponent?: boolean;
}

export default function CardView({
  card,
  activeFieldSpells = [],
  equipments = [],
  onClick,
  onPlayCard,
  disableDrag = false,
  isAttacking = false,
  attackTrajectory = null,
  isOpponent = false,
}: CardViewProps) {
  if (!card) return null;

  const currentStats = getEffectiveStats(card, activeFieldSpells, equipments);
  const isDefense = card.cardPosition === "defense";
  const finalRotation = isOpponent
    ? isDefense
      ? -90
      : 180
    : isDefense
      ? 90
      : 0;

  // === SE A CARTA ESTIVER VIRADA PARA BAIXO ===
  if (card.isFaceDown) {
    return (
      <motion.div
        layoutId={card.id}
        onClick={() => onClick && onClick(card)}
        animate={{ rotate: finalRotation }}
        whileHover={{ scale: disableDrag ? 1 : 1.05 }}
        style={{ width: "100px", height: "145px", minWidth: "100px" }}
        className="relative border-[4px] border-white rounded-sm shadow-lg cursor-pointer bg-amber-900 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.2)_10px,rgba(0,0,0,0.2)_20px)] flex items-center justify-center"
      >
        <div className="w-[70px] h-[110px] border-[2px] border-amber-600 rounded-sm bg-amber-800 flex items-center justify-center shadow-inner">
          <div className="w-[40px] h-[40px] rounded-full bg-amber-500/50 flex items-center justify-center border-2 border-amber-400">
            <span className="text-amber-200 font-bold text-[10px] transform -rotate-45 font-serif">
              TCG
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  // === SE A CARTA ESTIVER NORMAL (FACE-UP) ===
  const getCardColor = () => {
    switch (card.cardType) {
      case "NormalMonster":
        return "bg-yellow-400";
      case "EffectMonster":
        return "bg-orange-400";
      case "Spell":
        return "bg-emerald-500";
      case "FieldSpell":
        return "bg-emerald-500";
      case "Trap":
        return "bg-pink-500";
      case "FusionMonster":
        return "bg-purple-600";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <motion.div
      onClick={() => onClick && onClick(card)}
      layoutId={card.id}
      // Se for disableDrag, desativa o arrasto!
      drag={!disableDrag}
      dragSnapToOrigin={true}
      onDragEnd={(event, info) => {
        if (!disableDrag && info.offset.y < -100 && onPlayCard) {
          onPlayCard(card);
        }
      }}
      animate={
        attackTrajectory
          ? {
              x: [0, attackTrajectory.x, 0],
              y: [0, attackTrajectory.y, 0],
              scale: [1, 1.2, 1],
              zIndex: [100, 100, 100],
            }
          : { rotate: finalRotation, x: 0, y: 0 } // 👇 Usa a rotação calculada!
      }
      transition={{ duration: 0.2 }}
      whileHover={disableDrag ? {} : { scale: 1.1, y: -10, zIndex: 50 }}
      whileTap={disableDrag ? {} : { scale: 0.95, cursor: "grabbing" }}
      layout
      style={{ width: "100px", height: "145px", minWidth: "100px" }}
      className={`relative border-[4px] border-gray-800 rounded-sm p-[3px] shadow-lg ${disableDrag ? "cursor-pointer" : "cursor-grab"} ${getCardColor()}`}
    >
      <div className="border border-black/30 w-full h-full flex flex-col pointer-events-none">
        <div className="border border-black/40 px-1 mt-[2px] mx-[2px] shadow-sm bg-white/10">
          <h3 className="text-[9px] font-bold text-black text-left truncate w-full shadow-white">
            {card.name}
          </h3>
        </div>

        <div className="relative w-[calc(100%-4px)] flex-1 mx-auto mt-1 border-[2px] border-slate-300 shadow-inner bg-black overflow-hidden flex items-center justify-center">
          <Image
            src={card.image}
            alt={card.name}
            fill
            sizes="100px"
            className="object-cover"
          />
        </div>

        {/* NOVO: Aumentamos a caixinha de baixo para caber as letrinhas e o ATK/DEF */}
        <div className="w-[calc(100%-4px)] mx-auto mt-1 h-[36px] bg-yellow-50/90 border border-amber-300 p-[2px] flex flex-col justify-between overflow-hidden">
          {/* As letrinhas minúsculas da descrição para dar textura! */}
          <div className="text-[4px] leading-[5px] text-gray-800 italic line-clamp-3">
            {card.description}
          </div>

          {currentStats ? (
            <div className="w-full text-[8px] font-bold text-black flex justify-end gap-1 mt-auto">
              <span
                className={
                  currentStats.isBuffed ? "text-blue-700 font-extrabold" : ""
                }
              >
                ATK/{currentStats.attack}
              </span>
              <span
                className={
                  currentStats.isBuffed ? "text-blue-700 font-extrabold" : ""
                }
              >
                DEF/{currentStats.defense}
              </span>
            </div>
          ) : (
            <div className="w-full text-[8px] font-bold text-black text-center mt-auto">
              [ {card.cardType} ]
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
