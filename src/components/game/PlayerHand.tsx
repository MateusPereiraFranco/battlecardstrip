// src/components/game/PlayerHand.tsx
import React from "react";
import CardView from "./CardView";
import { Card } from "../../types/card";

interface PlayerHandProps {
  hand: Card[];
  playerMana: number;
  monsterZone: (Card | null)[];
  spellZone: (Card | null)[];
  hasSummonedThisTurn: boolean;
  currentPlayer: string;
  currentPhase: string;
  activeHandCardId: string | null;
  pendingEquip: boolean;
  canActivateEquip: (card: Card) => boolean;
  onSelectCard: (card: Card) => void;
  onPlayCard: (
    card: Card,
    isFaceDown?: boolean,
    forcePosition?: "attack" | "defense",
  ) => void;
}

export default function PlayerHand({
  hand,
  playerMana,
  monsterZone,
  spellZone,
  hasSummonedThisTurn,
  currentPlayer,
  currentPhase,
  activeHandCardId,
  pendingEquip,
  canActivateEquip,
  onSelectCard,
  onPlayCard,
}: PlayerHandProps) {
  const isMonsterZoneFull = !monsterZone.some((slot) => slot === null);
  const isSpellZoneFull = !spellZone.some((slot) => slot === null);

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex justify-center -space-x-10 z-40 p-4">
      {hand.length === 0 && (
        <span className="text-gray-400 italic bg-gray-900/50 px-4 py-2 rounded-full">
          Sua mão está vazia. Clique no Deck para comprar.
        </span>
      )}

      {hand.map((card) => {
        const cost = card.manaCost;
        const isMonster = "attack" in card;
        const isSpellOrEquip =
          card.cardType === "Spell" || card.cardType === "EquipSpell";
        const isField = card.cardType === "FieldSpell";
        const isTrap = card.cardType === "Trap";

        const level = "level" in card ? card.level : 0;
        const tributesNeeded = level >= 7 ? 2 : level >= 5 ? 1 : 0;
        const myActiveMonstersCount = monsterZone.filter(
          (m) => m !== null,
        ).length;

        const canPlayMonster =
          isMonster &&
          !hasSummonedThisTurn &&
          (tributesNeeded === 0
            ? !isMonsterZoneFull
            : myActiveMonstersCount >= tributesNeeded);
        const canPlaySpellOrEquip = isSpellOrEquip && !isSpellZoneFull;
        const canPlayField = isField;
        const canPlayTrap = isTrap && !isSpellZoneFull;

        const canDoSomething =
          (canPlayMonster ||
            canPlaySpellOrEquip ||
            canPlayField ||
            canPlayTrap) &&
          playerMana >= cost;

        return (
          <div
            key={card.id}
            className="relative z-20"
            onClick={(e) => e.stopPropagation()}
          >
            {activeHandCardId === card.id &&
              currentPlayer === "player" &&
              currentPhase === "main" &&
              canDoSomething && (
                <div className="absolute -top-[70px] left-1/2 transform -translate-x-1/2 flex gap-2 bg-gray-800 border-2 border-gray-600 p-2 rounded-lg z-50 shadow-2xl">
                  {/* OPÇÕES DE MONSTRO */}
                  {canPlayMonster && (
                    <>
                      <button
                        onClick={() => onPlayCard(card, false, "attack")}
                        className="flex flex-col items-center justify-center bg-gray-700 hover:bg-gray-600 p-1 rounded w-18 transition-colors"
                      >
                        <div className="w-3 h-5 border border-white bg-blue-400"></div>
                        <span className="text-[10px] text-white mt-1 font-bold">
                          Invocar ATK
                        </span>
                        <span className="text-[8px] text-cyan-300">
                          -{cost} Energia
                        </span>
                      </button>
                      <button
                        onClick={() => onPlayCard(card, false, "defense")}
                        className="flex flex-col items-center justify-center bg-gray-700 hover:bg-gray-600 p-1 rounded w-18 transition-colors"
                      >
                        <div className="w-5 h-3 border border-white bg-blue-400"></div>
                        <span className="text-[10px] text-white mt-1 font-bold">
                          Invocar DEF
                        </span>
                        <span className="text-[8px] text-cyan-300">
                          -{cost} Energia
                        </span>
                      </button>
                    </>
                  )}

                  {/* OPÇÕES DE MAGIAS E EQUIPAMENTOS */}
                  {canPlaySpellOrEquip && (
                    <>
                      {(card.cardType !== "EquipSpell" ||
                        canActivateEquip(card)) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayCard(card, false);
                          }}
                          className="flex flex-col items-center justify-center bg-gray-700 hover:bg-gray-600 p-1 rounded w-16 transition-colors"
                        >
                          <div className="w-3 h-5 border border-white bg-emerald-500"></div>
                          <span className="text-[10px] text-white mt-1 font-bold">
                            Ativar
                          </span>
                          <span className="text-[8px] text-cyan-300">
                            -{cost} Energia
                          </span>
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayCard(card, true);
                        }}
                        className="flex flex-col items-center justify-center bg-gray-700 hover:bg-gray-600 p-1 rounded w-16 transition-colors"
                      >
                        <div className="w-3 h-5 border border-white bg-amber-800"></div>
                        <span className="text-[10px] text-white mt-1 font-bold">
                          Baixar
                        </span>
                        <span className="text-[8px] text-cyan-300">
                          -{cost} Energia
                        </span>
                      </button>
                    </>
                  )}

                  {/* OPÇÕES DE CAMPO */}
                  {canPlayField && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayCard(card, false);
                        }}
                        className="flex flex-col items-center justify-center bg-gray-700 hover:bg-gray-600 p-1 rounded w-16 transition-colors"
                      >
                        <div className="w-3 h-5 border border-white bg-emerald-500"></div>
                        <span className="text-[10px] text-white mt-1 font-bold">
                          Ativar
                        </span>
                        <span className="text-[8px] text-cyan-300">
                          -{cost} Energia
                        </span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayCard(card, true);
                        }}
                        className="flex flex-col items-center justify-center bg-gray-700 hover:bg-gray-600 p-1 rounded w-16 transition-colors"
                      >
                        <div className="w-3 h-5 border border-white bg-amber-800"></div>
                        <span className="text-[10px] text-white mt-1 font-bold">
                          Baixar
                        </span>
                        <span className="text-[8px] text-cyan-300">
                          -{cost} Energia
                        </span>
                      </button>
                    </>
                  )}

                  {/* OPÇÕES DE ARMADILHA */}
                  {canPlayTrap && (
                    <button
                      onClick={() => onPlayCard(card, true)}
                      className="flex flex-col items-center justify-center bg-gray-700 hover:bg-gray-600 p-1 rounded w-16 transition-colors"
                    >
                      <div className="w-3 h-5 border border-white bg-amber-800"></div>
                      <span className="text-[10px] text-white mt-1 font-bold">
                        Baixar
                      </span>
                      <span className="text-[8px] text-cyan-300">
                        -{cost} Energia
                      </span>
                    </button>
                  )}
                </div>
              )}
            <CardView
              card={card}
              onClick={(c) => onSelectCard(c)}
              onPlayCard={(c) => {
                if (pendingEquip) return;
                onPlayCard(c, false);
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
