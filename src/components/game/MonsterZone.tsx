// src/components/game/MonsterZone.tsx
import React from "react";
import CardView from "./CardView";
import { Card } from "../../types/card";
import { isValidEquipTarget } from "../../utils/rules";
import { motion, AnimatePresence } from "framer-motion";

interface MonsterZoneProps {
  cards: (Card | null)[];
  isOpponent?: boolean;

  pendingEquip: { spellCard: Card; spellIndex: number } | null;
  pendingSelection: { validTargetIds: string[] } | null;
  attackerInfo: { card: Card; index: number } | null;
  activeFieldCardId: string | null;
  attackingAnimId: string | null;
  attackTrajectory: { x: number; y: number } | null;
  fieldSpells: (Card | null)[];
  getMonsterEquips: (id: string) => Card[];

  onHover: (id: string, type: "monster" | "spell") => void;
  onLeave: () => void;
  onSlotClick: (
    card: Card | null,
    index: number,
    isDirectAttackTarget: boolean,
    isEquipTarget: boolean,
    isSelectableTarget: boolean,
  ) => void;

  onDropCard?: (cardId: string, slotIndex: number) => void;

  currentPlayer?: string;
  currentPhase?: string;
  attackedMonsters?: string[];
  usedEffectsThisTurn?: string[];
  canActivateEffect?: (card: Card) => boolean;
  onAttackAction?: (card: Card, index: number) => void;
  onEffectAction?: (card: Card, index: number) => void;
  onGraveyardAction?: (card: Card, index: number) => void;
}

export default function MonsterZone({
  cards,
  isOpponent = false,
  pendingEquip,
  pendingSelection,
  attackerInfo,
  activeFieldCardId,
  attackingAnimId,
  attackTrajectory,
  fieldSpells,
  getMonsterEquips,
  onHover,
  onLeave,
  onSlotClick,
  onDropCard,
  currentPlayer,
  currentPhase,
  attackedMonsters = [],
  usedEffectsThisTurn = [],
  canActivateEffect,
  onAttackAction,
  onEffectAction,
  onGraveyardAction,
}: MonsterZoneProps) {
  return (
    <div className="flex justify-center gap-4">
      {cards.map((cardInZone, index) => {
        const isDirectAttackTarget =
          isOpponent &&
          attackerInfo &&
          !cardInZone &&
          !cards.some((c) => c !== null);
        const isEquipTarget =
          pendingEquip &&
          isValidEquipTarget(pendingEquip.spellCard, cardInZone);
        const isSelectableTarget = pendingSelection?.validTargetIds.includes(
          cardInZone?.id || "",
        );

        const domId = isOpponent
          ? `opp-monster-${index}`
          : `my-monster-${index}`;

        let slotClass =
          "w-[100px] h-[145px] border-2 border-dashed rounded-sm flex items-center justify-center relative transition-all ";
        if (isSelectableTarget) {
          slotClass +=
            "z-[9999] border-emerald-400 bg-emerald-500/30 cursor-pointer animate-pulse shadow-[0_0_20px_rgba(52,211,153,0.8)]";
        } else if (isEquipTarget) {
          slotClass +=
            "z-[9999] border-yellow-400 bg-yellow-400/20 cursor-crosshair animate-pulse shadow-[0_0_15px_rgba(250,204,21,0.5)]";
        } else if (!isOpponent && activeFieldCardId === cardInZone?.id) {
          slotClass += "z-[9999] border-blue-500/40 bg-blue-500/10";
        } else if (isOpponent && attackerInfo && cardInZone) {
          slotClass +=
            "z-[9999] border-red-500/80 bg-red-500/20 cursor-crosshair animate-pulse";
        } else if (isDirectAttackTarget) {
          slotClass +=
            "z-[9999] border-red-500/80 bg-red-500/20 cursor-crosshair animate-pulse";
        } else {
          slotClass += isOpponent
            ? "border-red-500/30 bg-red-500/5"
            : "z-10 border-blue-500/40 bg-blue-500/10 hover:border-blue-400";
        }

        return (
          <div
            key={domId}
            id={domId}
            className={slotClass}
            onMouseEnter={() => {
              if (cardInZone) onHover(cardInZone.id, "monster");
            }}
            onMouseLeave={onLeave}
            onClick={(e) => {
              e.stopPropagation();
              onSlotClick(
                cardInZone,
                index,
                Boolean(isDirectAttackTarget),
                Boolean(isEquipTarget),
                Boolean(isSelectableTarget),
              );
            }}
            // 👇 EVENTOS BLINDADOS DE DROP 👇
            onDragOver={(e) => {
              // Previne APENAS se o slot estiver livre e for do jogador!
              if (!isOpponent && cardInZone === null) {
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = "move";
              }
            }}
            onDragEnter={(e) => {
              if (!isOpponent && cardInZone === null) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();

              if (isOpponent || cardInZone !== null) return;

              const draggedCardId =
                e.dataTransfer.getData("text/plain") ||
                (window as any).fallbackCardId;

              if (draggedCardId && onDropCard) {
                // Remove a referência do backup para limpar o Drag
                (window as any).fallbackCardId = null;
                onDropCard(draggedCardId, index);
              }
            }}
          >
            {/* O texto "MONSTRO" só aparece se não tiver carta (e não destrói a animação) */}
            {!cardInZone && (
              <span
                className={`text-[10px] font-bold ${isOpponent ? "text-red-500/30" : "text-blue-500/50"} pointer-events-none`}
              >
                MONSTRO
              </span>
            )}

            {/* 👇 MAGIA DE DESTRUIÇÃO: AnimatePresence segura a carta na tela até a animação acabar! 👇 */}
            <AnimatePresence>
              {cardInZone && (
                <motion.div
                  key={cardInZone.id} // A key é OBRIGATÓRIA pro React saber quem está morrendo
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  // Efeito de morte: Brilha branco, encolhe e some rápido!
                  exit={{
                    opacity: 0,
                    scale: 1.4,
                    filter:
                      "brightness(3) blur(10px) drop-shadow(0 0 30px rgba(239,68,68,1))",
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="absolute top-0 left-0 w-full h-full z-10"
                >
                  {!isOpponent && attackerInfo?.card.id === cardInZone.id && (
                    <div className="absolute inset-0 border-4 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,1)] rounded z-0 animate-pulse pointer-events-none"></div>
                  )}

                  {!isOpponent && activeFieldCardId === cardInZone.id && (
                    <div className="absolute -top-[50px] left-1/2 transform -translate-x-1/2 flex gap-2 bg-gray-800 border-2 border-gray-600 p-2 rounded-lg z-50 shadow-2xl">
                      {cardInZone.cardPosition === "attack" &&
                        !cardInZone.isFaceDown &&
                        currentPhase === "battle" &&
                        currentPlayer === "player" &&
                        !attackedMonsters.includes(cardInZone.id) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAttackAction?.(cardInZone, index);
                            }}
                            className="bg-orange-600 hover:bg-orange-500 p-1 px-2 rounded text-[10px] text-white font-bold transition"
                          >
                            Atacar
                          </button>
                        )}

                      {!cardInZone.isFaceDown &&
                        currentPhase === "main" &&
                        currentPlayer === "player" &&
                        !usedEffectsThisTurn.includes(cardInZone.id) &&
                        canActivateEffect?.(cardInZone) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEffectAction?.(cardInZone, index);
                            }}
                            className="bg-purple-600 hover:bg-purple-500 p-1 px-2 rounded text-[10px] text-white font-bold transition"
                          >
                            Efeito
                          </button>
                        )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onGraveyardAction?.(cardInZone, index);
                        }}
                        className="bg-red-900 hover:bg-red-800 p-1 px-2 rounded text-[10px] text-white font-bold transition"
                      >
                        Cemitério
                      </button>
                    </div>
                  )}

                  <CardView
                    card={cardInZone}
                    isOpponent={isOpponent}
                    activeFieldSpells={fieldSpells}
                    equipments={getMonsterEquips(cardInZone.id)}
                    isAttacking={attackingAnimId === cardInZone.id}
                    attackTrajectory={
                      attackingAnimId === cardInZone.id
                        ? attackTrajectory
                        : null
                    }
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
