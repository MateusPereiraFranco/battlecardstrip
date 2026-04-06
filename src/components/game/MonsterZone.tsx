// src/components/game/MonsterZone.tsx
import React from "react";
import CardView from "./CardView";
import { Card } from "../../types/card";
import { isValidEquipTarget } from "../../utils/rules";

interface MonsterZoneProps {
  cards: (Card | null)[];
  isOpponent?: boolean;

  // Estados do Jogo
  pendingEquip: { spellCard: Card; spellIndex: number } | null;
  pendingSelection: { validTargetIds: string[] } | null;
  attackerInfo: { card: Card; index: number } | null;
  activeFieldCardId: string | null;
  attackingAnimId: string | null;
  attackTrajectory: { x: number; y: number } | null;
  fieldSpells: (Card | null)[];
  getMonsterEquips: (id: string) => Card[];

  // Eventos de Mouse e Clique
  onHover: (id: string, type: "monster" | "spell") => void;
  onLeave: () => void;
  onSlotClick: (
    card: Card | null,
    index: number,
    isDirectAttackTarget: boolean,
    isEquipTarget: boolean,
    isSelectableTarget: boolean,
  ) => void;

  // Ações Específicas do Jogador (Só aparecem se isOpponent for falso)
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
        // Lógica de Alvos e Cores
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

        // Identificador único para a animação da linha de laser
        const domId = isOpponent
          ? `opp-monster-${index}`
          : `my-monster-${index}`;

        // Define a classe CSS baseada no estado atual
        let slotClass =
          "w-[100px] h-[145px] border-2 border-dashed rounded-sm flex items-center justify-center relative ";
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
            : "z-10 border-blue-500/40 bg-blue-500/10";
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
          >
            {/* Texto de Slot Vazio */}
            {!cardInZone ? (
              <span
                className={`text-[10px] font-bold ${isOpponent ? "text-red-500/30" : "text-blue-500/50"}`}
              >
                MONSTRO
              </span>
            ) : (
              <div className="absolute top-0 left-0 w-full h-full z-10">
                {/* Borda laranja indicando que este é o monstro que vai atacar */}
                {!isOpponent && attackerInfo?.card.id === cardInZone.id && (
                  <div className="absolute inset-0 border-4 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,1)] rounded z-0 animate-pulse pointer-events-none"></div>
                )}

                {/* === MENU DE AÇÕES (SÓ APARECE PARA O JOGADOR) === */}
                {!isOpponent && activeFieldCardId === cardInZone.id && (
                  <div className="absolute -top-[50px] left-1/2 transform -translate-x-1/2 flex gap-2 bg-gray-800 border-2 border-gray-600 p-2 rounded-lg z-50 shadow-2xl">
                    {/* Botão de Atacar */}
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

                    {/* Botão de Efeito */}
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

                    {/* Botão Cemitério */}
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

                {/* Renderização da Carta */}
                <CardView
                  card={cardInZone}
                  isOpponent={isOpponent}
                  activeFieldSpells={fieldSpells}
                  equipments={getMonsterEquips(cardInZone.id)}
                  isAttacking={attackingAnimId === cardInZone.id}
                  attackTrajectory={
                    attackingAnimId === cardInZone.id ? attackTrajectory : null
                  }
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
