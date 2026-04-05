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

// 👇 FUNÇÃO AUXILIAR: Cores Neon baseadas no Nível (Igual ao CardDetail) 👇
const getNivelNeonClass = (level: number): string => {
  if (level <= 4)
    return "text-[#CD7F32] drop-shadow-[0_0_10px_rgba(205,127,50,0.8)]"; // Bronze
  if (level <= 6)
    return "text-[#C0C0C0] drop-shadow-[0_0_10px_rgba(192,192,192,0.8)]"; // Prata
  if (level <= 8)
    return "text-[#FFD700] drop-shadow-[0_0_15px_rgba(255,215,0,0.9)]"; // Ouro
  return "text-[#b9f2ff] drop-shadow-[0_0_20px_rgba(185,242,255,1)]"; // Diamante (9+)
};

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

  // Serve apenas para o verso da carta agora
  const getCardShape = (type?: string, isFaceDown?: boolean) => {
    if (isFaceDown)
      return "polygon(15% 0, 85% 0, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0 85%, 0 15%)";
    return "polygon(0 0, 100% 0, 100% 100%, 0 100%)";
  };

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
          style={{ clipPath: getCardShape("none", true) }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900 via-slate-900 to-black opacity-80"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/40 to-transparent pointer-events-none"></div>
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
      style={{
        width: "150px",
        height: "195px",
        minWidth: "100px",
        WebkitTransform: "translateZ(0)",
      }}
      className={`relative ${disableDrag ? "cursor-pointer" : "cursor-grab"} will-change-transform`}
    >
      {/* ============================================== */}
      {/* SE FOR MONSTRO: MANTÉM OS SEUS AJUSTES EXATOS! */}
      {/* ============================================== */}
      {isMonster ? (
        <div
          className="w-full h-full relative"
          style={{
            filter: `drop-shadow(0px 8px 10px rgba(0,0,0,0.9)) drop-shadow(0px 0px 5px ${theme.glow})`,
          }}
        >
          {/* 👇 MANTIDO O SEU AJUSTE AQUI 👇 */}
          <div
            className="absolute top-[10%] left-[27%] right-[25%] bottom-[15%] z-0 overflow-hidden bg-black"
            style={{
              clipPath: "polygon(50% 0%, 100% 15%, 100% 100%, 0% 100%, 0% 15%)",
            }}
          >
            <Image
              src={card.image}
              alt={card.name}
              fill
              sizes="100px"
              quality={75}
              className="object-cover"
            />
          </div>

          <div className="absolute inset-0 z-10 pointer-events-none">
            <Image
              src="/images/frames/monster-frame.png"
              alt="Frame"
              fill
              sizes="100px"
              className="object-contain"
            />
          </div>

          <div className="absolute inset-0 z-20 pointer-events-none">
            {/* 👇 MANTIDO O SEU AJUSTE AQUI 👇 */}
            <div className="absolute top-[5%] left-[17%] w-[25%] aspect-square flex items-center justify-center">
              <span
                className={`${neonClass} font-black text-[14px] drop-shadow-[0_2px_4px_rgba(0,0,0,1)]`}
              >
                {monsterLevel}
              </span>
            </div>

            {/* 👇 MANTIDO O SEU AJUSTE AQUI 👇 */}
            {currentStats && (
              <div className="absolute bottom-[13%] left-[50%] -translate-x-1/2 w-[38%] h-[20%] flex flex-col items-center justify-center">
                <span
                  className={`text-[10px] leading-none ${currentStats.isBuffed ? "text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,1)]" : "text-white"} font-black drop-shadow-[0_2px_4px_rgba(0,0,0,1)] tracking-wider`}
                >
                  {currentStats.attack}
                </span>

                <div className="w-[60%] border-b-[1px] border-white/30 my-[1px]"></div>

                <span
                  className={`text-[8px] leading-none ${currentStats.isBuffed ? "text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,1)]" : "text-gray-300"} font-black drop-shadow-[0_2px_4px_rgba(0,0,0,1)] tracking-wider`}
                >
                  {currentStats.defense}
                </span>
              </div>
            )}

            <div className="absolute -top-2 left-[10%] right-[10%] flex justify-center pointer-events-none">
              <div className="bg-black/90 backdrop-blur-md px-1 py-[2px] rounded border border-white/20 shadow-lg">
                <h3 className="text-[6px] font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,1)] uppercase tracking-wider whitespace-nowrap overflow-hidden text-ellipsis max-w-[80px]">
                  {card.name}
                </h3>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ==================================================== */
        /* SE FOR MAGIA/ARMADILHA: NOVA ARQUITETURA DE SANDUÍCHE */
        /* ==================================================== */
        <div
          className="w-full h-full relative"
          style={{
            filter: `drop-shadow(0px 8px 10px rgba(0,0,0,0.9)) drop-shadow(0px 0px 5px ${theme.glow})`,
          }}
        >
          {/* 👇 AJUSTE AQUI: Recorte da Imagem da Magia 👇 */}
          <div
            className="absolute top-[8%] left-[24%] right-[20%] bottom-[15%] z-0 overflow-hidden bg-black rounded-sm"
            style={{
              clipPath:
                "polygon(50% 0%, 100% 20%, 100% 80%, 50% 100%, 0% 80%, 0% 20%)",
            }}
          >
            <Image
              src={card.image}
              alt={card.name}
              fill
              sizes="100px"
              quality={75}
              className="object-cover"
            />
          </div>

          <div className="absolute inset-0 z-10 pointer-events-none">
            <Image
              src="/images/frames/spell-frame.png"
              alt="Frame"
              fill
              sizes="100px"
              className="object-contain"
            />
          </div>

          <div className="absolute inset-0 z-20 pointer-events-none">
            {/* 👇 AJUSTE AQUI: Custo de Mana (Círculo Topo Esquerdo) 👇 */}
            <div className="absolute top-[4%] left-[17%] w-[25%] aspect-square flex items-center justify-center">
              <span className="text-cyan-300 font-black text-[14px] drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                {card.manaCost}
              </span>
            </div>

            {/* 👇 AJUSTE AQUI: Fita Inferior (Tipo da Carta) 👇 */}
            <div className="absolute bottom-[20%] left-[50%] -translate-x-1/2 w-[60%] h-[15%] flex items-center justify-center">
              <span className="text-[7px] text-white font-black drop-shadow-[0_2px_2px_rgba(0,0,0,1)] uppercase tracking-widest text-center">
                {card.cardType === "Spell"
                  ? "Mágica"
                  : card.cardType === "EquipSpell"
                    ? "Equip"
                    : card.cardType === "Trap"
                      ? "Armadilha"
                      : "Campo"}
              </span>
            </div>

            <div className="absolute -top-2 left-[10%] right-[10%] flex justify-center pointer-events-none">
              <div className="bg-black/90 backdrop-blur-md px-1 py-[2px] rounded border border-white/20 shadow-lg">
                <h3 className="text-[6px] font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,1)] uppercase tracking-wider whitespace-nowrap overflow-hidden text-ellipsis max-w-[80px]">
                  {card.name}
                </h3>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
