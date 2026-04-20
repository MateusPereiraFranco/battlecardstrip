// src/components/game/CardView.tsx
"use client";

import React from "react";
import Image from "next/image";
import { Card } from "../../types/card";
import { motion } from "framer-motion";
import { getEffectiveStats } from "../../utils/rules";

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

const getDynamicAssets = (card: Card) => {
  let assets = {
    border: "/images/cardElements/borda.png",
    levelGem: "/images/cardElements/gemaCarta.png",
    manaFilled: "/images/cardElements/gemaGastoPreenchido.png",
    manaEmpty: "/images/cardElements/gemaGastoVazio.png",
    atkIcon: "/images/cardElements/chamas2.png",
    defIcon: "/images/cardElements/escudo.png",
  };
  return assets;
};

const getNivelNeonClass = (level: number): string => {
  if (level <= 4)
    return "text-[#CD7F32] drop-shadow-[0_0_8px_rgba(205,127,50,1)]";
  if (level <= 6)
    return "text-[#C0C0C0] drop-shadow-[0_0_8px_rgba(192,192,192,1)]";
  if (level <= 8)
    return "text-[#FFD700] drop-shadow-[0_0_10px_rgba(255,215,0,1)]";
  return "text-[#b9f2ff] drop-shadow-[0_0_15px_rgba(185,242,255,1)]";
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

  const isMonster = "attack" in card;
  const assets = getDynamicAssets(card);
  const monsterLevel = "level" in card ? card.level : 1;
  const neonClass = getNivelNeonClass(monsterLevel);

  if (card.isFaceDown) {
    return (
      <motion.div
        layoutId={card.id}
        onClick={() => onClick && onClick(card)}
        initial={{ rotate: finalRotation }}
        animate={{ rotate: finalRotation }}
        whileHover={{ scale: disableDrag ? 1 : 1.05 }}
        style={{ width: "100px", height: "145px", minWidth: "100px" }}
        className="relative flex items-center justify-center cursor-pointer drop-shadow-md rounded-md overflow-hidden bg-slate-900 border-2 border-cyan-800"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900 via-slate-900 to-black opacity-80"></div>
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.4)_10px,rgba(0,0,0,0.4)_20px)]"></div>
        <div className="z-10 w-[40px] h-[40px] rounded-full border-2 border-cyan-500/80 flex items-center justify-center bg-black/80 shadow-[0_0_15px_rgba(34,211,238,0.8)]">
          <span className="text-cyan-400 font-bold text-[14px] font-mono">
            A
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      onClick={() => onClick && onClick(card)}
      layoutId={card.id}
      drag={!disableDrag}
      dragSnapToOrigin={true}
      initial={{ rotate: finalRotation }}
      onDragEnd={(event, info) => {
        if (!disableDrag && info.offset.y < -100 && onPlayCard)
          onPlayCard(card);
      }}
      animate={
        isAttacking && attackTrajectory
          ? {
              x: attackTrajectory.x,
              y: attackTrajectory.y,
              rotate: finalRotation,
              scale: 1.15,
              zIndex: 9999,
            }
          : { x: 0, y: 0, rotate: finalRotation, scale: 1, zIndex: 1 }
      }
      transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
      whileHover={disableDrag ? {} : { scale: 1.1, y: -10, zIndex: 50 }}
      whileTap={disableDrag ? {} : { scale: 0.95, cursor: "grabbing" }}
      layout={!isAttacking}
      style={{ width: "100px", height: "145px", minWidth: "100px" }}
      className={`relative ${disableDrag ? "cursor-pointer" : "cursor-grab"} select-none`}
    >
      <div className="absolute inset-0 rounded-md overflow-hidden bg-gray-900 z-0">
        <Image
          src={card.image}
          alt={card.name}
          fill
          sizes="100px"
          quality={75}
          className="object-cover object-top"
        />
      </div>

      <div className="absolute -inset-[2px] z-10 pointer-events-none">
        <Image
          src={assets.border}
          alt="Borda"
          fill
          sizes="100px"
          className="object-fill drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]"
        />
      </div>

      <div className="absolute inset-0 z-20 pointer-events-none">
        {isMonster && (
          <div className="absolute -top-[0px] -left-[-5px] w-[20px] h-[35px] flex items-center justify-center mix-blend-screen drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
            <Image
              src={assets.levelGem}
              alt="Level"
              fill
              className="object-contain"
            />
            <span
              className={`relative z-10 ${neonClass} font-black text-[16px]`}
            >
              {monsterLevel}
            </span>
          </div>
        )}

        <div className="absolute top-1 -right-[-6px] flex flex-col items-center -space-y-[7px]">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="relative w-[7px] h-[16px] mix-blend-screen drop-shadow-[0_0_3px_rgba(255,255,255,0.5)]"
            >
              <Image
                src={i < card.manaCost ? assets.manaFilled : assets.manaEmpty}
                alt="Mana"
                fill
                className="object-contain"
              />
            </div>
          ))}
        </div>

        <div className="absolute top-[4%] left-[28%] right-[16%] h-[15%] flex items-start justify-start">
          <span className="text-[8px] font-black text-gray-100 uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,1)] line-clamp-2 leading-[1.1]">
            {card.name}
          </span>
        </div>

        {/* 👇 BASE CENTRAL: bg-purple-900/50 👇 */}
        <div
          className="absolute bottom-[11%] left-1/2 -translate-x-1/2 w-[88%] h-[26%] bg-purple-900/50 backdrop-blur-md border-[1px] border-cyan-400/30 flex flex-col items-center justify-start p-[2px] shadow-[0_4px_10px_rgba(0,0,0,0.8)] z-20"
          style={{
            clipPath:
              "polygon(3% 0, 97% 0, 100% 10%, 100% 90%, 97% 100%, 3% 100%, 0 90%, 0 10%)",
          }}
        >
          <span className="text-[5px] text-cyan-300 font-bold uppercase tracking-widest text-center leading-none mb-[2px] drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
            {isMonster
              ? `[ ${"race" in card ? card.race : "Normal"} ]`
              : `[ ${card.cardType === "Spell" ? "Mágica" : card.cardType === "EquipSpell" ? "Equipamento" : card.cardType === "Trap" ? "Armadilha" : "Campo"} ]`}
          </span>
          <div className="text-[4px] text-gray-200 leading-[1.2] text-center overflow-hidden line-clamp-4 w-full px-[2px] font-medium drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">
            {card.description || "Sem descrição disponível."}
          </div>
        </div>

        {isMonster && currentStats && (
          <>
            {/* 👇 CHAMAS DE ATK: z-30 👇 */}
            <div className="absolute -bottom-3 -left-[10px] w-[45px] h-[45px] flex items-center justify-center drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] z-30">
              <Image
                src={assets.atkIcon}
                alt="ATK"
                fill
                className="object-contain opacity-60"
              />
              <span
                className={`relative z-10 top-2 text-[12px] font-black drop-shadow-[0_2px_2px_rgba(0,0,0,1)] tracking-tighter ${currentStats.isBuffed ? "text-green-300" : "text-white"}`}
              >
                {currentStats.attack}
              </span>
            </div>

            {/* 👇 ESCUDO DE DEF: z-30 👇 */}
            <div className="absolute -bottom-2 -right-[6px] w-[35px] h-[35px] flex items-center justify-center mix-blend-screen drop-shadow-[0_0_5px_rgba(168,85,247,0.5)] z-30">
              <Image
                src={assets.defIcon}
                alt="DEF"
                fill
                className="object-contain"
              />
              <span
                className={`relative z-10 top-[2px] text-[11px] font-black drop-shadow-[0_2px_2px_rgba(0,0,0,1)] tracking-tighter ${currentStats.isBuffed ? "text-green-300" : "text-white"}`}
              >
                {currentStats.defense}
              </span>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
