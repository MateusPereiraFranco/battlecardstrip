// src/app/game/page.tsx
"use client";

import { useState } from "react";
import CardView from "../../components/game/CardView";
import CardDetail from "../../components/game/CardDetail";
import { Card } from "../../types/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  isValidEquipTarget,
  checkMonsterActivatedEffect,
  getEffectiveStats,
  checkTriggers,
} from "../../utils/rules";
import { useGameEngine } from "../../hooks/useGameEngine";
import { useOpponentBot } from "../../hooks/useOpponentBot";
import GameConnectionLine, {
  GameLineProps,
} from "../../components/game/GameConnectionLine";
import TurnPhaseHUD from "../../components/game/TurnPhaseHUD";
import GraveyardModal from "../../components/game/modals/GraveyardModal";
import SpecialSummonModal from "../../components/game/modals/SpecialSummonModal";
import PlayerHand from "../../components/game/PlayerHand";
import MonsterZone from "../../components/game/MonsterZone";

export default function Home() {
  const { state, actions } = useGameEngine();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [activeHandCardId, setActiveHandCardId] = useState<string | null>(null);
  const [activeFieldCardId, setActiveFieldCardId] = useState<string | null>(
    null,
  );
  const [showGraveyardModal, setShowGraveyardModal] = useState(false);
  const [showOpponentGraveyardModal, setShowOpponentGraveyardModal] =
    useState(false);
  const [detailsKey, setDetailsKey] = useState(0);
  const [activeEquipLine, setActiveEquipLine] = useState<GameLineProps | null>(
    null,
  );

  const selectCardWithFlash = (c: Card | null) => {
    setSelectedCard(c);
    if (c) setDetailsKey((prev) => prev + 1);
  };

  const handleEquipHover = (cardId: string, type: "monster" | "spell") => {
    if (activeEquipLine?.type === "attack" || state.pendingPrompt) return;
    const link = state.equipLinks.find((l) =>
      type === "spell" ? l.spellId === cardId : l.monsterId === cardId,
    );
    if (!link) return;

    let mId = "";
    const myMIdx = state.monsterZone.findIndex((m) => m?.id === link.monsterId);
    if (myMIdx !== -1) mId = `my-monster-${myMIdx}`;
    else {
      const oppMIdx = state.opponentMonsterZone.findIndex(
        (m) => m?.id === link.monsterId,
      );
      if (oppMIdx !== -1) mId = `opp-monster-${oppMIdx}`;
    }

    let sId = "";
    let isOpp = false;
    const mySIdx = state.spellZone.findIndex((s) => s?.id === link.spellId);
    if (mySIdx !== -1) {
      sId = `my-spell-${mySIdx}`;
      isOpp = false;
    } else {
      const oppSIdx = state.opponentSpellZone.findIndex(
        (s) => s?.id === link.spellId,
      );
      if (oppSIdx !== -1) {
        sId = `opp-spell-${oppSIdx}`;
        isOpp = true;
      }
    }

    if (mId && sId)
      setActiveEquipLine({
        monsterId: mId,
        targetId: sId,
        isOpponent: isOpp,
        type: "equip",
      });
  };

  const handleSendToGraveyard = (
    card: Card,
    zone: "monster" | "spell" | "field",
    index: number = 0,
  ) => {
    const resetCard = {
      ...card,
      isFaceDown: false,
      cardPosition: "attack" as const,
    };
    actions.setGraveyard([...state.graveyard, resetCard]);
    if (zone === "monster") {
      const newZone = [...state.monsterZone];
      newZone[index] = null;
      actions.setMonsterZone(newZone);
    } else if (zone === "spell") {
      const newZone = [...state.spellZone];
      newZone[index] = null;
      actions.setSpellZone(newZone);
    } else if (zone === "field") actions.setFieldSpell(null);
    setActiveFieldCardId(null);
    selectCardWithFlash(null);
  };

  const handleEquipToMonster = (
    targetCard: Card,
    targetIndex: number,
    isOpponent: boolean,
  ) => {
    if (!state.pendingEquip) return;
    if (!("attack" in targetCard)) return;
    if (!isValidEquipTarget(state.pendingEquip.spellCard, targetCard)) return;
    actions.setEquipLinks((prev: any) => [
      ...prev,
      { spellId: state.pendingEquip!.spellCard.id, monsterId: targetCard.id },
    ]);
    actions.setPendingEquip(null);
  };

  const handleOpponentDirectAttack = (attackerIndex: number) => {
    const attackerCard = state.opponentMonsterZone[attackerIndex]!;
    setActiveEquipLine({
      monsterId: `player-lp-hud`,
      targetId: `opp-monster-${attackerIndex}`,
      isOpponent: true,
      type: "attack",
    });
    actions.setAttackingAnimId(attackerCard.id);
    actions.setAttackedMonsters((prev: string[]) => [...prev, attackerCard.id]);

    setTimeout(() => {
      const atkStats = getEffectiveStats(
        attackerCard,
        [state.fieldSpell, state.opponentFieldSpell],
        actions.getMonsterEquips(attackerCard.id),
      );
      const atkValue = atkStats
        ? atkStats.attack
        : "attack" in attackerCard
          ? attackerCard.attack
          : 0;
      actions.setPlayerLP((prev: number) => prev - atkValue);
      actions.setAttackingAnimId(null);
      setActiveEquipLine(null);
    }, 500);
  };

  const handleOpponentAttack = (attackerIndex: number, targetIndex: number) => {
    const attackerCard = state.opponentMonsterZone[attackerIndex]!;
    setActiveEquipLine({
      monsterId: `my-monster-${targetIndex}`,
      targetId: `opp-monster-${attackerIndex}`,
      isOpponent: true,
      type: "attack",
    });
    actions.setAttackingAnimId(attackerCard.id);
    actions.setAttackedMonsters((prev: string[]) => [...prev, attackerCard.id]);

    // Função que resolve o combate normal caso não haja armadilha ativada
    const resolveNormalCombat = () => {
      setTimeout(() => {
        const myCard = state.monsterZone[targetIndex]!;
        const oppAtk = "attack" in attackerCard ? attackerCard.attack : 0;
        const myAtk = "attack" in myCard ? myCard.attack : 0;

        if (myCard.cardPosition === "attack") {
          if (oppAtk > myAtk) {
            actions.setPlayerLP((prev: number) => prev - (oppAtk - myAtk));
            actions.setMonsterZone((prev: (Card | null)[]) => {
              const nz = [...prev];
              nz[targetIndex] = null;
              return nz;
            });
            actions.setGraveyard((prev: Card[]) => [
              ...prev,
              { ...myCard, isFaceDown: false, cardPosition: "attack" },
            ]);
          }
        }
        actions.setAttackingAnimId(null);
        setActiveEquipLine(null);
      }, 500);
    };

    // Pergunta ao Juiz se VOCÊ tem uma Armadilha armada!
    const trapCheck = checkTriggers(
      "ON_ATTACK",
      attackerCard,
      state.opponentMonsterZone,
      state.monsterZone,
      state.spellZone,
      [state.fieldSpell, state.opponentFieldSpell],
    );

    if (trapCheck.triggered && trapCheck.effect) {
      actions.setPendingPrompt({
        message: trapCheck.effect.message,
        onConfirm: () => {
          // Vira a armadilha para cima
          actions.setSpellZone((prev: (Card | null)[]) => {
            const nz = [...prev];
            nz[trapCheck.trapIndex!] = {
              ...trapCheck.trapCard!,
              isFaceDown: false,
            };
            return nz;
          });

          // Fecha a janela vermelha de corrente
          actions.setPendingPrompt(null);

          // Se a armadilha exige sacrificar seu próprio monstro (Kamikaze)
          if ((trapCheck.effect as any).requiresSelfMonsterDestruction) {
            // Busca todos os Soldados virados para cima na sua mesa
            const validSoldiersIds = state.monsterZone
              .filter(
                (m: Card | null) =>
                  m !== null &&
                  !m.isFaceDown &&
                  "race" in m &&
                  m.race === "Soldado",
              )
              .map((m: any) => m.id);

            // ABRE A MIRA VERDE PARA VOCÊ ESCOLHER O SACRIFÍCIO!
            actions.setPendingSelection({
              message: "Selecione qual Soldado sacrificar para a Kamikaze!",
              validTargetIds: validSoldiersIds,
              onSelect: (selectedId: string) => {
                const selectedIdx = state.monsterZone.findIndex(
                  (m: Card | null) => m?.id === selectedId,
                );
                const selectedSoldier = state.monsterZone[selectedIdx]!;

                // 1. Destrói o soldado selecionado
                actions.setMonsterZone((prev: (Card | null)[]) => {
                  const nz = [...prev];
                  nz[selectedIdx] = null;
                  return nz;
                });
                actions.setGraveyard((prev: Card[]) => [
                  ...prev,
                  {
                    ...selectedSoldier,
                    isFaceDown: false,
                    cardPosition: "attack",
                  },
                ]);

                // 2. Destrói o atacante inimigo
                actions.setOpponentMonsterZone((prev: (Card | null)[]) => {
                  const nz = [...prev];
                  nz[attackerIndex] = null;
                  return nz;
                });
                actions.setOpponentGraveyard((prev: Card[]) => [
                  ...prev,
                  {
                    ...attackerCard,
                    isFaceDown: false,
                    cardPosition: "attack",
                  },
                ]);

                // 3. Destrói a armadilha
                actions.setSpellZone((prev: (Card | null)[]) => {
                  const nz = [...prev];
                  nz[trapCheck.trapIndex!] = null;
                  return nz;
                });
                actions.setGraveyard((prev: Card[]) => [
                  ...prev,
                  {
                    ...trapCheck.trapCard!,
                    isFaceDown: false,
                    cardPosition: "attack",
                  },
                ]);

                actions.setAttackingAnimId(null);
                setActiveEquipLine(null);
                actions.setPendingSelection(null);
              },
              onCancel: () => {
                // Se cancelar o alvo, a armadilha vai pro cemitério e o combate rola normalmente
                actions.setPendingSelection(null);
                actions.setSpellZone((prev: (Card | null)[]) => {
                  const nz = [...prev];
                  nz[trapCheck.trapIndex!] = null;
                  return nz;
                });
                actions.setGraveyard((prev: Card[]) => [
                  ...prev,
                  {
                    ...trapCheck.trapCard!,
                    isFaceDown: false,
                    cardPosition: "attack",
                  },
                ]);
                resolveNormalCombat();
              },
            });
          } else {
            // Caso seja alguma outra armadilha futura sem sacrifício
            setTimeout(() => {
              if (trapCheck.effect!.destroyTrap) {
                actions.setSpellZone((prev: (Card | null)[]) => {
                  const nz = [...prev];
                  nz[trapCheck.trapIndex!] = null;
                  return nz;
                });
                actions.setGraveyard((prev: Card[]) => [
                  ...prev,
                  {
                    ...trapCheck.trapCard!,
                    isFaceDown: false,
                    cardPosition: "attack",
                  },
                ]);
              }

              if (trapCheck.effect!.negateActivation) {
                actions.setOpponentMonsterZone((prev: (Card | null)[]) => {
                  const nz = [...prev];
                  nz[attackerIndex] = null;
                  return nz;
                });
                actions.setOpponentGraveyard((prev: Card[]) => [
                  ...prev,
                  {
                    ...attackerCard,
                    isFaceDown: false,
                    cardPosition: "attack",
                  },
                ]);
              }
              actions.setAttackingAnimId(null);
              setActiveEquipLine(null);
            }, 1500);
          }
        },
        onCancel: () => {
          actions.setPendingPrompt(null);
          resolveNormalCombat();
        },
      });
    } else {
      resolveNormalCombat(); // O ataque segue normalmente se não houver traps
    }
  };

  const handleOpponentSummon = (cardToPlay: Card) => {
    const level = "level" in cardToPlay ? cardToPlay.level : 0;
    const tributesNeeded = level >= 7 ? 2 : level >= 5 ? 1 : 0;

    let newZone = [...state.opponentMonsterZone];
    let newGy = [...state.opponentGraveyard];

    let tributesTaken = 0;
    for (let i = 0; i < newZone.length; i++) {
      if (newZone[i] !== null && tributesTaken < tributesNeeded) {
        newGy.push({
          ...newZone[i]!,
          isFaceDown: false,
          cardPosition: "attack",
        });
        newZone[i] = null;
        tributesTaken++;
      }
    }

    const emptyMIdx = newZone.findIndex((m: Card | null) => m === null);
    if (emptyMIdx === -1) return;

    actions.setOpponentMana((prev: number) => prev - cardToPlay.manaCost);
    actions.setOpponentHand((prev: Card[]) =>
      prev.filter((c: Card) => c.id !== cardToPlay.id),
    );

    const cardWithState = {
      ...cardToPlay,
      isFaceDown: false,
      cardPosition: "attack" as const,
      turnSet: state.currentTurn,
    };
    newZone[emptyMIdx] = cardWithState;

    actions.setOpponentMonsterZone(newZone);
    if (tributesTaken > 0) actions.setOpponentGraveyard(newGy);

    actions.setHasSummonedThisTurn(true);
    actions.setResolvingEffectId(cardWithState.id);

    setTimeout(() => {
      actions.setResolvingEffectId(null);

      // 👇 CORREÇÃO: Pergunta ao Juiz se VOCÊ tem a Mina Terrestre!
      const trapCheck = checkTriggers(
        "ON_SUMMON",
        cardWithState,
        newZone, // Zona do Bot
        state.monsterZone, // Sua Zona
        state.spellZone, // Suas Mágicas/Armadilhas (inimigas do bot)
        [state.fieldSpell, state.opponentFieldSpell],
      );

      if (trapCheck.triggered && trapCheck.effect) {
        // Se achou, abre a janela vermelha perguntando se você quer ativar!
        actions.setPendingPrompt({
          message: trapCheck.effect.message,
          onConfirm: () => {
            // Vira a sua armadilha para cima
            actions.setSpellZone((prev: (Card | null)[]) => {
              const nz = [...prev];
              nz[trapCheck.trapIndex!] = {
                ...trapCheck.trapCard!,
                isFaceDown: false,
              };
              return nz;
            });

            setTimeout(() => {
              // Aplica os efeitos (Explode o monstro do bot)
              if (trapCheck.effect!.destroyTriggeringCard) {
                actions.setOpponentMonsterZone((prev: (Card | null)[]) => {
                  const nz = [...prev];
                  nz[emptyMIdx] = null;
                  return nz;
                });
                actions.setOpponentGraveyard((prev: Card[]) => [
                  ...prev,
                  {
                    ...cardWithState,
                    isFaceDown: false,
                    cardPosition: "attack",
                  },
                ]);
              }
              // Envia a sua armadilha pro cemitério
              if (trapCheck.effect!.destroyTrap) {
                actions.setSpellZone((prev: (Card | null)[]) => {
                  const nz = [...prev];
                  nz[trapCheck.trapIndex!] = null;
                  return nz;
                });
                actions.setGraveyard((prev: Card[]) => [
                  ...prev,
                  {
                    ...trapCheck.trapCard!,
                    isFaceDown: false,
                    cardPosition: "attack",
                  },
                ]);
              }
              actions.setPendingPrompt(null);
            }, 1500);
          },
          onCancel: () => actions.setPendingPrompt(null),
        });
      }
    }, 1000);
  };

  const handleOpponentPlaySpell = (spellCard: Card) => {
    actions.setOpponentMana((prev: number) => prev - spellCard.manaCost);
    actions.setOpponentHand((prev: Card[]) =>
      prev.filter((c: Card) => c.id !== spellCard.id),
    );

    const emptySIdx = state.opponentSpellZone.findIndex(
      (s: Card | null) => s === null,
    );
    if (emptySIdx !== -1) {
      const newZone = [...state.opponentSpellZone];
      newZone[emptySIdx] = {
        ...spellCard,
        isFaceDown: spellCard.cardType === "Trap",
        turnSet: state.currentTurn,
      };
      actions.setOpponentSpellZone(newZone);

      // 👇 CORREÇÃO AQUI: Agora a engine sabe que tem que disparar o efeito tanto de Mágicas Normais quanto de Equipamentos!
      if (
        spellCard.cardType === "Spell" ||
        spellCard.cardType === "EquipSpell"
      ) {
        actions.executeActivateSpell(
          { ...spellCard, isFaceDown: false },
          emptySIdx,
          newZone,
        );
      }
    }
  };

  useOpponentBot({
    state,
    actions,
    uiState: {
      pendingPrompt: state.pendingPrompt,
      pendingSelection: state.pendingSelection,
      pendingDeckSearch: state.pendingDeckSearch,
      pendingDiscard: state.pendingDiscard,
      pendingSpecialSummon: state.pendingSpecialSummon,
      resolvingEffectId: state.resolvingEffectId,
      attackingAnimId: state.attackingAnimId,
    },
    uiCallbacks: {
      handleOpponentDirectAttack,
      handleOpponentAttack,
      handleOpponentSummon,
      handleOpponentPlaySpell,
      clearUIAttacks: () => actions.setAttackerInfo(null),
    },
  });

  return (
    <main
      onClick={() => {
        if (state.pendingEquip)
          return alert(
            "Selecione um alvo válido (iluminado em amarelo) para equipar a carta!",
          );
        setActiveHandCardId(null);
        setActiveFieldCardId(null);
      }}
      className="h-screen w-screen flex bg-gray-950 overflow-hidden font-sans text-white"
    >
      <div
        className="w-[360px] h-full bg-gray-900 border-r-4 border-gray-800 p-4 shrink-0 flex items-center z-50 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div key={detailsKey} className="w-full">
          <CardDetail
            card={
              selectedCard
                ? { ...selectedCard, id: `${selectedCard.id}-detail` }
                : null
            }
            activeFieldSpells={[state.fieldSpell, state.opponentFieldSpell]}
            equipments={
              selectedCard ? actions.getMonsterEquips(selectedCard.id) : []
            }
          />
        </div>
      </div>

      <div className="flex-1 h-full relative flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-gray-900 to-black">
        <div className="absolute top-6 left-6 z-20 flex gap-4 pointer-events-none">
          <div
            id="opp-lp-hud"
            onClick={(e) => {
              e.stopPropagation();
              if (state.pendingEquip)
                return alert("Selecione um alvo para o equipamento!");
              if (state.attackerInfo) {
                setActiveEquipLine({
                  monsterId: `my-monster-${state.attackerInfo.index}`,
                  targetId: `opp-lp-hud`,
                  isOpponent: true,
                  type: "attack",
                });
                actions.executeDirectAttack();
                setTimeout(() => setActiveEquipLine(null), 500);
              }
            }}
            className={`bg-red-950/80 border-2 rounded-lg py-2 px-6 flex gap-4 items-center shadow-lg transition-all ${state.attackerInfo && !state.opponentMonsterZone.some((c) => c !== null) ? "border-red-500 scale-110 cursor-crosshair pointer-events-auto animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.8)]" : "border-red-900 pointer-events-auto"}`}
          >
            <span className="text-red-400 font-bold uppercase tracking-widest text-sm">
              Oponente
            </span>
            <span className="text-3xl font-black text-red-500 font-mono drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
              {state.opponentLP}
            </span>
          </div>
          <div className="bg-red-950/80 border-2 border-orange-400 rounded-lg py-2 px-6 flex gap-4 items-center shadow-[0_0_15px_rgba(249,115,22,0.6)] pointer-events-auto">
            <span className="text-orange-200 font-bold uppercase tracking-widest text-sm">
              Energia
            </span>
            <span className="text-3xl font-black text-white">
              {state.opponentMana}/8
            </span>
          </div>
        </div>

        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex justify-center -space-x-8 scale-[0.60] z-10">
          {state.opponentHand.length === 0 && (
            <span className="text-gray-500 italic mt-12 text-lg">
              Deck Oponente para simular
            </span>
          )}
          {state.opponentHand.map((card) => (
            <CardView
              key={`opp-hand-${card.id}`}
              card={{ ...card, isFaceDown: true }}
              disableDrag={true}
              isOpponent={true}
            />
          ))}
        </div>

        <div className="scale-[0.80] 2xl:scale-95 origin-center flex flex-col gap-3 rounded-xl p-4">
          <div className="flex gap-8 justify-center">
            <div
              onClick={() => {
                if (!state.pendingEquip) actions.drawOpponentCard();
              }}
              className={`w-[100px] h-[145px] border-4 rounded-sm bg-red-900 bg-[repeating-linear-gradient(-45deg,transparent,transparent_10px,rgba(0,0,0,0.3)_10px,rgba(0,0,0,0.3)_20px)] flex flex-col items-center justify-center shadow-xl cursor-pointer transition-transform ${state.currentPhase === "draw" && state.currentPlayer === "opponent" ? "border-yellow-400 animate-pulse scale-105 shadow-[0_0_20px_rgba(250,204,21,0.6)]" : "border-gray-600 hover:border-gray-400"}`}
            >
              <span className="text-red-300/50 font-bold text-[10px]">
                DECK ({state.opponentDeck.length})
              </span>
            </div>
            <div className="flex gap-6">
              {state.opponentSpellZone.map((c, i) => (
                <div
                  key={`o-s-${i}`}
                  id={`opp-spell-${i}`}
                  className="w-[100px] h-[145px] border-2 border-dashed border-red-500/30 bg-red-500/5 rounded-sm flex items-center justify-center relative"
                  onMouseEnter={() => {
                    if (c && c.cardType === "EquipSpell")
                      handleEquipHover(c.id, "spell");
                  }}
                  onMouseLeave={() =>
                    setActiveEquipLine((prev) =>
                      prev?.type === "attack" ? prev : null,
                    )
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    if (c) selectCardWithFlash(c);
                  }}
                >
                  {!c ? (
                    <span className="text-red-500/30 text-[10px] font-bold">
                      MÁGICA
                    </span>
                  ) : (
                    <div className="absolute top-0 left-0 w-full h-full cursor-pointer">
                      <CardView card={c} isOpponent={true} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="w-[100px] h-[145px] border-2 border-dashed border-purple-500/30 bg-purple-500/5 rounded-sm flex items-center justify-center">
              <span className="text-purple-500/30 text-[10px] font-bold text-center">
                EXTRA
                <br />
                DECK
              </span>
            </div>
          </div>

          <div className="flex gap-8 justify-center items-center">
            <div
              className="w-[100px] h-[145px] border-2 border-dashed border-emerald-500/30 bg-emerald-500/5 rounded-sm flex items-center justify-center relative cursor-pointer hover:border-emerald-500/80 transition-colors"
              onClick={() =>
                state.opponentFieldSpell &&
                selectCardWithFlash(state.opponentFieldSpell)
              }
            >
              {!state.opponentFieldSpell ? (
                <span className="text-emerald-500/30 text-[10px] font-bold text-center">
                  CAMPO
                  <br />
                  OPONENTE
                </span>
              ) : (
                <div className="absolute inset-0 z-10">
                  <CardView card={state.opponentFieldSpell} isOpponent={true} />
                </div>
              )}
            </div>

            <MonsterZone
              cards={state.opponentMonsterZone}
              isOpponent={true}
              pendingEquip={state.pendingEquip}
              pendingSelection={state.pendingSelection}
              attackerInfo={state.attackerInfo}
              activeFieldCardId={activeFieldCardId}
              attackingAnimId={state.attackingAnimId}
              attackTrajectory={state.attackTrajectory}
              fieldSpells={[state.fieldSpell, state.opponentFieldSpell]}
              getMonsterEquips={actions.getMonsterEquips}
              onHover={handleEquipHover}
              onLeave={() =>
                setActiveEquipLine((prev) =>
                  prev?.type === "attack" ? prev : null,
                )
              }
              onSlotClick={(
                cardInZone,
                index,
                isDirectAttackTarget,
                isEquipTarget,
                isSelectableTarget,
              ) => {
                if (state.pendingPrompt) return;
                if (state.pendingSelection) {
                  if (isSelectableTarget && cardInZone)
                    state.pendingSelection.onSelect(cardInZone.id);
                  else alert("Selecione um alvo válido!");
                  return;
                }
                if (state.pendingEquip) {
                  if (isEquipTarget && cardInZone)
                    handleEquipToMonster(cardInZone, index, true);
                  else alert("Alvo inválido!");
                  return;
                }
                if (state.attackerInfo && cardInZone) {
                  setActiveEquipLine({
                    monsterId: `my-monster-${state.attackerInfo.index}`,
                    targetId: `opp-monster-${index}`,
                    isOpponent: true,
                    type: "attack",
                  });
                  actions.executeAttackMonster(cardInZone, index);
                  setTimeout(() => setActiveEquipLine(null), 500);
                } else if (isDirectAttackTarget) {
                  setActiveEquipLine({
                    monsterId: `my-monster-${state.attackerInfo?.index}`,
                    targetId: `opp-lp-hud`,
                    isOpponent: true,
                    type: "attack",
                  });
                  actions.executeDirectAttack();
                  setTimeout(() => setActiveEquipLine(null), 500);
                } else if (cardInZone) setSelectedCard(cardInZone);
              }}
            />

            <div
              className="w-[100px] h-[145px] border-2 border-gray-700 bg-gray-900 rounded-sm flex items-center justify-center cursor-pointer hover:border-gray-500 transition-colors shadow-inner relative overflow-hidden"
              onClick={() => setShowOpponentGraveyardModal(true)}
            >
              {state.opponentGraveyard.length === 0 ? (
                <div className="flex flex-col items-center">
                  <span className="text-gray-600 font-bold text-[10px]">
                    CEMITÉRIO
                  </span>
                  <span className="text-xl font-black text-gray-700 mt-1">
                    0
                  </span>
                </div>
              ) : (
                <div className="absolute inset-0 pointer-events-none">
                  <CardView
                    card={
                      state.opponentGraveyard[
                        state.opponentGraveyard.length - 1
                      ]
                    }
                    isOpponent={true}
                    disableDrag={true}
                  />
                  <div className="absolute bottom-0 right-0 bg-black/90 text-white text-[10px] font-bold px-2 py-1 rounded-tl-md border-t border-l border-gray-600 z-50 shadow-lg">
                    {state.opponentGraveyard.length}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent my-2 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>

          <div className="flex gap-8 justify-center items-center">
            <div
              className="w-[100px] h-[145px] border-2 border-dashed border-emerald-500/50 bg-emerald-500/10 rounded-sm flex items-center justify-center relative cursor-pointer hover:border-emerald-400 transition-colors"
              onClick={() => {
                if (state.fieldSpell) {
                  selectCardWithFlash(state.fieldSpell);
                  setActiveFieldCardId(state.fieldSpell.id);
                }
              }}
            >
              {!state.fieldSpell ? (
                <span className="text-emerald-500/50 text-[10px] font-bold text-center">
                  SEU
                  <br />
                  CAMPO
                </span>
              ) : (
                <div className="absolute inset-0 z-10">
                  {activeFieldCardId === state.fieldSpell.id && (
                    <div className="absolute -top-[35px] left-1/2 -translate-x-1/2 flex gap-2 bg-gray-800 border-2 border-gray-600 p-2 rounded-lg z-50">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendToGraveyard(state.fieldSpell!, "field");
                        }}
                        className="bg-red-900 hover:bg-red-800 p-1 px-2 rounded text-[10px] text-white font-bold"
                      >
                        Cemitério
                      </button>
                    </div>
                  )}
                  <CardView card={state.fieldSpell} />
                </div>
              )}
            </div>

            <MonsterZone
              cards={state.monsterZone}
              isOpponent={false}
              pendingEquip={state.pendingEquip}
              pendingSelection={state.pendingSelection}
              attackerInfo={state.attackerInfo}
              activeFieldCardId={activeFieldCardId}
              attackingAnimId={state.attackingAnimId}
              attackTrajectory={state.attackTrajectory}
              fieldSpells={[state.fieldSpell, state.opponentFieldSpell]}
              getMonsterEquips={actions.getMonsterEquips}
              onHover={handleEquipHover}
              onLeave={() =>
                setActiveEquipLine((prev) =>
                  prev?.type === "attack" ? prev : null,
                )
              }
              currentPlayer={state.currentPlayer}
              currentPhase={state.currentPhase}
              attackedMonsters={state.attackedMonsters}
              usedEffectsThisTurn={state.usedEffectsThisTurn}
              canActivateEffect={(c) =>
                checkMonsterActivatedEffect(c, state.hand.length).canActivate
              }
              onSlotClick={(
                cardInZone,
                index,
                isDirectAttackTarget,
                isEquipTarget,
                isSelectableTarget,
              ) => {
                if (state.pendingPrompt) return;
                if (state.pendingSelection) {
                  if (isSelectableTarget && cardInZone)
                    state.pendingSelection.onSelect(cardInZone.id);
                  else alert("Alvo inválido!");
                  return;
                }
                if (state.pendingEquip) {
                  if (isEquipTarget && cardInZone)
                    handleEquipToMonster(cardInZone, index, false);
                  else alert("Alvo inválido!");
                  return;
                }
                if (cardInZone) {
                  selectCardWithFlash(cardInZone);
                  setActiveFieldCardId(cardInZone.id);
                  setActiveHandCardId(null);
                }
              }}
              onAttackAction={(card, index) => {
                actions.setAttackerInfo({ card, index });
                setActiveFieldCardId(null);
              }}
              onGraveyardAction={(card, index) =>
                handleSendToGraveyard(card, "monster", index)
              }
              onEffectAction={(cardInZone) => {
                actions.setUsedEffectsThisTurn((prev: any) => [
                  ...prev,
                  cardInZone.id,
                ]);
                const effect = checkMonsterActivatedEffect(
                  cardInZone,
                  state.hand.length,
                );
                actions.setPendingDiscard({
                  message: effect.message!,
                  onDiscard: (discardId: string) => {
                    const cardToDiscard = state.hand.find(
                      (c: Card) => c.id === discardId,
                    )!;
                    actions.setHand((prev: any) =>
                      prev.filter((c: Card) => c.id !== discardId),
                    );
                    actions.setGraveyard((prev: any) => [
                      ...prev,
                      { ...cardToDiscard, isFaceDown: false },
                    ]);
                    actions.setPendingDiscard(null);
                    const validCards = state.deck.filter(effect.filter!);
                    actions.setPendingDeckSearch({
                      message: "Escolha o seu reforço:",
                      validCards,
                      onSelect: (searchId: string) => {
                        const found = state.deck.find(
                          (c: Card) => c.id === searchId,
                        )!;
                        actions.setHand((prev: any) => [...prev, found]);
                        actions.setDeck((prev: any) =>
                          prev
                            .filter((c: Card) => c.id !== searchId)
                            .sort(() => Math.random() - 0.5),
                        );
                        actions.setPendingDeckSearch(null);
                      },
                      onCancel: () => actions.setPendingDeckSearch(null),
                    });
                  },
                });
                setActiveFieldCardId(null);
              }}
            />

            <div
              className="w-[100px] h-[145px] border-2 border-gray-600 bg-gray-800 rounded-sm flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors shadow-inner relative overflow-hidden"
              onClick={() => setShowGraveyardModal(true)}
            >
              {state.graveyard.length === 0 ? (
                <div className="flex flex-col items-center">
                  <span className="text-gray-500 font-bold text-[10px]">
                    CEMITÉRIO
                  </span>
                  <span className="text-xl font-black text-gray-600 mt-1">
                    0
                  </span>
                </div>
              ) : (
                <div className="absolute inset-0 pointer-events-none">
                  <CardView
                    card={state.graveyard[state.graveyard.length - 1]}
                    disableDrag={true}
                  />
                  <div className="absolute bottom-0 right-0 bg-black/90 text-white text-[10px] font-bold px-2 py-1 rounded-tl-md border-t border-l border-gray-500 z-50 shadow-lg">
                    {state.graveyard.length}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-8 justify-center">
            <div className="w-[100px] h-[145px] border-2 border-dashed border-purple-500/50 bg-purple-500/10 rounded-sm flex items-center justify-center">
              <span className="text-purple-500/50 text-[10px] font-bold text-center">
                EXTRA
                <br />
                DECK
              </span>
            </div>
            <div className="flex gap-6">
              {state.spellZone.map((cardInZone, index) => (
                <div
                  key={`p-s-${index}`}
                  id={`my-spell-${index}`}
                  className={`w-[100px] h-[145px] border-2 border-dashed border-emerald-500/50 bg-emerald-500/10 rounded-sm flex items-center justify-center relative transition-transform hover:-translate-y-2 hover:scale-105 ${activeFieldCardId === cardInZone?.id ? "z-[9999]" : "z-10"}`}
                  onMouseEnter={() => {
                    if (cardInZone && cardInZone.cardType === "EquipSpell")
                      handleEquipHover(cardInZone.id, "spell");
                  }}
                  onMouseLeave={() =>
                    setActiveEquipLine((prev) =>
                      prev?.type === "attack" ? prev : null,
                    )
                  }
                >
                  {!cardInZone ? (
                    <span className="text-emerald-500/50 text-[10px] font-bold">
                      MÁGICA
                    </span>
                  ) : (
                    <div
                      className="absolute inset-0 z-10 flex items-center justify-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {state.resolvingEffectId === cardInZone.id && (
                        <div className="absolute inset-0 border-4 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,1)] rounded z-0 animate-pulse pointer-events-none"></div>
                      )}

                      {/* 👇 CORREÇÃO AQUI: Botão Ativar não aparece mais em Armadilhas */}
                      {activeFieldCardId === cardInZone.id &&
                        state.currentPhase !== "draw" && (
                          <div className="absolute -top-[50px] left-1/2 -translate-x-1/2 flex gap-2 bg-gray-800 border-2 border-gray-600 p-2 rounded-lg z-50 shadow-2xl">
                            {cardInZone.isFaceDown &&
                              (cardInZone.cardType === "Spell" ||
                                cardInZone.cardType === "EquipSpell") &&
                              state.currentPlayer === "player" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    actions.executeActivateSpell(
                                      cardInZone,
                                      index,
                                    );
                                    setActiveFieldCardId(null);
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-500 p-1 px-2 rounded text-[10px] text-white font-bold transition"
                                >
                                  Ativar
                                </button>
                              )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendToGraveyard(
                                  cardInZone,
                                  "spell",
                                  index,
                                );
                              }}
                              className="bg-red-900 hover:bg-red-800 p-1 px-2 rounded text-[10px] text-white font-bold transition"
                            >
                              Cemitério
                            </button>
                          </div>
                        )}
                      <CardView
                        card={cardInZone}
                        onClick={(c) => {
                          if (state.pendingEquip)
                            return alert("Conclua o Equipamento!");
                          selectCardWithFlash(c);
                          setActiveFieldCardId(c.id);
                          setActiveHandCardId(null);
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div
              onClick={actions.drawCard}
              className={`relative w-[100px] h-[145px] border-4 rounded-sm bg-amber-900 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.2)_10px,rgba(0,0,0,0.2)_20px)] flex flex-col items-center justify-center shadow-xl cursor-pointer transition-transform ${state.currentPhase === "draw" && state.currentPlayer === "player" ? "border-yellow-400 animate-pulse scale-105 shadow-[0_0_20px_rgba(250,204,21,0.6)]" : "border-white hover:scale-105"}`}
            >
              <div className="w-[70px] h-[110px] border-[2px] border-amber-600 rounded-sm bg-amber-800 flex items-center justify-center shadow-inner">
                <div className="w-[40px] h-[40px] rounded-full bg-amber-500/50 flex items-center justify-center border-2 border-amber-400">
                  <span className="text-amber-200 font-bold text-[10px] transform -rotate-45 font-serif">
                    DECK
                  </span>
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-black text-white text-[12px] font-bold px-2 py-1 rounded-full border-2 border-gray-500 z-50">
                {state.deck.length}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 left-6 z-20 flex gap-4 pointer-events-none">
          <div
            id="player-lp-hud"
            className="bg-blue-950/80 border-2 border-blue-900 rounded-lg py-2 px-6 flex gap-4 items-center shadow-lg pointer-events-auto"
          >
            <span className="text-blue-400 font-bold uppercase tracking-widest text-sm">
              Jogador 1
            </span>
            <span className="text-3xl font-black text-blue-500 font-mono drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]">
              {state.playerLP}
            </span>
          </div>
          <div className="bg-blue-950/80 border-2 border-cyan-400 rounded-lg py-2 px-6 flex gap-4 items-center shadow-[0_0_15px_rgba(34,211,238,0.6)] pointer-events-auto">
            <span className="text-cyan-200 font-bold uppercase tracking-widest text-sm">
              Energia
            </span>
            <span className="text-3xl font-black text-white">
              {state.playerMana}/8
            </span>
          </div>
        </div>

        <PlayerHand
          hand={state.hand}
          playerMana={state.playerMana}
          monsterZone={state.monsterZone}
          spellZone={state.spellZone}
          hasSummonedThisTurn={state.hasSummonedThisTurn}
          currentPlayer={state.currentPlayer}
          currentPhase={state.currentPhase}
          activeHandCardId={activeHandCardId}
          pendingEquip={state.pendingEquip !== null}
          canActivateEquip={(card) => {
            const allMonsters = [
              ...state.monsterZone,
              ...state.opponentMonsterZone,
            ].filter((c) => c !== null) as Card[];
            return allMonsters.some((m) => isValidEquipTarget(card, m));
          }}
          onSelectCard={(c) => {
            if (state.pendingEquip) return alert("Equipe o feitiço primeiro!");
            selectCardWithFlash(c);
            setActiveHandCardId(c.id);
            setActiveFieldCardId(null);
          }}
          onPlayCard={actions.executePlayCard}
        />

        <GraveyardModal
          isOpen={showGraveyardModal}
          isOpponent={false}
          cards={state.graveyard}
          onClose={() => setShowGraveyardModal(false)}
          onCardClick={selectCardWithFlash}
        />
        <GraveyardModal
          isOpen={showOpponentGraveyardModal}
          isOpponent={true}
          cards={state.opponentGraveyard}
          onClose={() => setShowOpponentGraveyardModal(false)}
          onCardClick={selectCardWithFlash}
        />
        <SpecialSummonModal
          data={state.pendingSpecialSummon}
          hand={state.hand}
          graveyard={state.graveyard}
          onClose={() => actions.setPendingSpecialSummon(null)}
        />
      </div>

      <TurnPhaseHUD
        currentTurn={state.currentTurn}
        currentPlayer={state.currentPlayer}
        currentPhase={state.currentPhase}
        onNextPhase={() =>
          actions.nextPhase(() => actions.setAttackedMonsters([]))
        }
        isDisabled={
          state.pendingEquip !== null ||
          state.attackingAnimId !== null ||
          state.resolvingEffectId !== null ||
          state.currentPhase === "draw"
        }
      />

      {(state.attackingAnimId || state.resolvingEffectId) &&
        !state.pendingPrompt &&
        !state.pendingSelection &&
        !state.pendingDiscard &&
        !state.pendingDeckSearch && (
          <div
            className="fixed inset-0 z-[9000] cursor-wait"
            onClick={(e) => e.stopPropagation()}
          ></div>
        )}

      {state.pendingSelection && (
        <div className="absolute top-[35%] left-1/2 transform -translate-x-1/2 bg-gray-900 border-2 border-emerald-400 p-4 rounded-xl z-[9999] text-center shadow-[0_0_30px_rgba(52,211,153,0.5)] animate-pulse pointer-events-none">
          <h3 className="text-emerald-400 font-bold text-xl uppercase tracking-widest">
            {state.pendingSelection.message}
          </h3>
          <p className="text-gray-300 text-xs mt-1">
            Clique em uma carta brilhando verde na mesa
          </p>
        </div>
      )}

      {state.pendingDeckSearch && (
        <div
          className="absolute inset-0 bg-gray-900/95 backdrop-blur-md z-[9900] flex flex-col p-8 border-t-4 border-yellow-500"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full flex justify-between items-center mb-6 border-b-2 border-yellow-600 pb-4">
            <h2 className="text-2xl font-bold text-yellow-500 uppercase tracking-widest">
              {state.pendingDeckSearch.message}
            </h2>
            <button
              onClick={state.pendingDeckSearch.onCancel}
              className="text-gray-400 hover:text-white font-bold text-3xl transition-colors bg-gray-800 w-10 h-10 rounded-full flex items-center justify-center"
            >
              &times;
            </button>
          </div>
          <div className="flex-1 overflow-y-auto flex flex-wrap gap-4 content-start">
            {state.pendingDeckSearch.validCards.map((c, i) => (
              <CardView
                key={`search-${c.id}-${i}`}
                card={{ ...c, id: `${c.id}-search` }}
                disableDrag={true}
                onClick={() => state.pendingDeckSearch!.onSelect(c.id)}
              />
            ))}
          </div>
        </div>
      )}

      {state.pendingPrompt && (
        <div className="fixed inset-0 z-[9999] bg-black/20 backdrop-blur-[2px] flex items-start justify-center pt-24">
          <div className="bg-gray-900/95 border-4 border-red-600 rounded-xl p-6 shadow-[0_0_50px_rgba(220,38,38,0.8)] max-w-md w-full flex flex-col items-center animate-bounce-short">
            <h2 className="text-red-500 font-black text-2xl uppercase tracking-widest mb-4">
              Corrente Ativada!
            </h2>
            <p className="text-white text-center text-lg mb-8 font-serif">
              {state.pendingPrompt.message}
            </p>
            <div className="flex gap-6 w-full">
              <button
                onClick={state.pendingPrompt.onCancel}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded transition-colors"
              >
                Não ativar
              </button>
              <button
                onClick={state.pendingPrompt.onConfirm}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded shadow-[0_0_15px_rgba(220,38,38,0.8)] transition-all"
              >
                Ativar Armadilha!
              </button>
            </div>
          </div>
        </div>
      )}

      {state.pendingDiscard && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[9950] flex flex-col items-center justify-center p-8">
          <div className="bg-gray-900 border-2 border-purple-500 p-6 rounded-xl shadow-2xl max-w-2xl w-full">
            <h2 className="text-purple-400 font-bold text-xl mb-4 text-center uppercase">
              {state.pendingDiscard.message}
            </h2>
            <div className="flex flex-wrap gap-4 justify-center">
              {state.hand.map((c) => (
                <div
                  key={`discard-${c.id}`}
                  className="hover:scale-110 transition-transform cursor-pointer brightness-75 hover:brightness-125"
                >
                  <CardView
                    card={c}
                    onClick={() => state.pendingDiscard!.onDiscard(c.id)}
                    disableDrag={true}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => actions.setPendingDiscard(null)}
              className="mt-6 w-full py-2 bg-gray-800 text-gray-400 font-bold rounded hover:bg-gray-700 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {activeEquipLine && <GameConnectionLine {...activeEquipLine} />}
      </AnimatePresence>
    </main>
  );
}
