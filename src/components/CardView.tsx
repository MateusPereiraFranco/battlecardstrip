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

  // === VERSO DA CARTA ===
  if (card.isFaceDown) {
    return (
      <motion.div
        layoutId={card.id}
        onClick={() => onClick && onClick(card)}
        animate={{ rotate: finalRotation }}
        whileHover={{ scale: disableDrag ? 1 : 1.05 }}
        style={{
          width: "100px",
          height: "145px",
          minWidth: "100px",
          WebkitTransform: "translateZ(0)",
        }}
        className={`relative flex items-center justify-center cursor-pointer filter drop-shadow-[0_0_8px_rgba(34,211,238,0.4)] will-change-transform`}
      >
        <div
          className="w-full h-full bg-slate-900 flex items-center justify-center relative overflow-hidden"
          style={{ clipPath: cardShape }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900 via-slate-900 to-black opacity-80"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/40 to-transparent pointer-events-none"></div>
          {/* Removido o backdrop-blur daqui */}
          <div className="z-10 w-[40px] h-[40px] rounded-full border-2 border-cyan-500/80 flex items-center justify-center bg-black/80 shadow-[0_0_10px_rgba(34,211,238,0.8)]">
            <span className="text-cyan-400 font-bold text-[14px] font-mono">
              A
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  // === FRENTE DA CARTA ===
  const isMonster = "attack" in card;

  return (
    <motion.div
      onClick={() => onClick && onClick(card)}
      layoutId={card.id}
      drag={!disableDrag}
      dragSnapToOrigin={true}
      onDragEnd={(event, info) => {
        if (!disableDrag && info.offset.y < -100 && onPlayCard)
          onPlayCard(card);
      }}
      animate={
        isAttacking && attackTrajectory
          ? {
              x: [0, attackTrajectory.x, 0],
              y: [0, attackTrajectory.y, 0],
              rotate: finalRotation,
              scale: [1, 1.2, 1],
              zIndex: [100, 100, 100],
            }
          : { x: 0, y: 0, rotate: finalRotation }
      }
      transition={{ duration: 0.2 }}
      whileHover={disableDrag ? {} : { scale: 1.1, y: -10, zIndex: 50 }}
      whileTap={disableDrag ? {} : { scale: 0.95, cursor: "grabbing" }}
      layout
      // 👇 OTIMIZAÇÃO: TranslateZ(0) força a GPU a assumir o desenho da carta!
      style={{
        width: "100px",
        height: "145px",
        minWidth: "100px",
        WebkitTransform: "translateZ(0)",
      }}
      // 👇 OTIMIZAÇÃO: Removido o "transition-all duration-300" que brigava com o Framer Motion e adicionado "will-change-transform"
      className={`relative ${disableDrag ? "cursor-pointer" : "cursor-grab"} will-change-transform`}
    >
      <div
        className="w-full h-full relative"
        style={{ filter: `drop-shadow(0px 0px 6px ${theme.glow})` }}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-br ${theme.border}`}
          style={{ clipPath: cardShape }}
        ></div>

        <div
          className="absolute z-10 overflow-hidden"
          style={{
            top: "2px",
            left: "2px",
            right: "2px",
            bottom: "2px",
            clipPath: cardShape,
            backgroundColor: "black",
          }}
        >
          {/* 👇 OTIMIZAÇÃO: quality={50} deixa a imagem mais leve de carregar nas cartas minúsculas */}
          <Image
            src={card.image}
            alt={card.name}
            fill
            sizes="100px"
            quality={50}
            className="object-cover"
          />
          {/* 👇 OTIMIZAÇÃO: Removido o mix-blend-overlay caríssimo do reflexo! Apenas usamos gradientes normais */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 pointer-events-none"></div>
        </div>

        <div
          className="absolute z-20 w-full h-full flex flex-col justify-between pointer-events-none p-1"
          style={{ clipPath: cardShape }}
        >
          <div className="w-full text-center mt-2 px-1">
            <h3 className="text-[8px] font-black text-white truncate drop-shadow-[0_2px_2px_rgba(0,0,0,1)] uppercase tracking-wider">
              {card.name}
            </h3>
          </div>

          {/* 👇 OTIMIZAÇÃO: Removido o "backdrop-blur-md" daqui. Trocamos por um bg-black/90 sólido, idêntico no visual mas 0 custo na placa de vídeo! */}
          {isMonster && currentStats && (
            <div className="w-full flex flex-col items-center gap-0 bg-black/90 pb-1.5 pt-1 border-t border-white/20 mb-1 rounded-t-lg">
              <span
                className={`text-[12px] leading-none ${currentStats.isBuffed ? "text-cyan-300 font-black drop-shadow-[0_0_5px_rgba(34,211,238,1)]" : "text-white font-black drop-shadow-[0_1px_1px_rgba(0,0,0,1)]"}`}
              >
                ⚔️ {currentStats.attack}
              </span>
              <span
                className={`text-[12px] leading-none ${currentStats.isBuffed ? "text-cyan-300 font-black drop-shadow-[0_0_5px_rgba(34,211,238,1)]" : "text-gray-200 font-black drop-shadow-[0_1px_1px_rgba(0,0,0,1)]"}`}
              >
                🛡️ {currentStats.defense}
              </span>
            </div>
          )}

          {!isMonster && (
            <div className="w-full flex justify-center bg-black/90 pb-2 pt-1 mb-1 rounded-t-lg">
              <span className="text-[7px] font-black text-cyan-300 uppercase tracking-widest drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">
                {card.cardType === "Spell"
                  ? "Mágica"
                  : card.cardType === "EquipSpell"
                    ? "Equip"
                    : card.cardType === "Trap"
                      ? "Armadilha"
                      : "Campo"}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
