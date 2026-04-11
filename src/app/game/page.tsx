// src/app/game/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
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
import TrapPromptModal from "../../components/game/modals/TrapPromptModal";
import SelectionModal from "../../components/game/modals/SelectionModal";
import DeckSearchModal from "../../components/game/modals/DeckSearchModal";
import DiscardModal from "../../components/game/modals/DiscardModal";
import FloatingDamage from "../../components/game/animations/FloatingDamage";
import HitExplosion from "../../components/game/animations/HitExplosion";

export default function Home() {
  const { state, actions } = useGameEngine();

  // 👇 ESTADOS DE ANIMAÇÃO DE DANO 👇
  const [playerDamage, setPlayerDamage] = useState<{
    id: number;
    amount: number;
  } | null>(null);
  const [opponentDamage, setOpponentDamage] = useState<{
    id: number;
    amount: number;
  } | null>(null);

  const [isShaking, setIsShaking] = useState(false);
  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  };

  const [hitExplosion, setHitExplosion] = useState<{
    id: number;
    x: number;
    y: number;
  } | null>(null);

  const prevPlayerLP = useRef(state.playerLP);
  const prevOpponentLP = useRef(state.opponentLP);

  useEffect(() => {
    if (state.playerLP < prevPlayerLP.current) {
      setPlayerDamage({
        id: Date.now(),
        amount: prevPlayerLP.current - state.playerLP,
      });
    }
    prevPlayerLP.current = state.playerLP;
  }, [state.playerLP]);

  useEffect(() => {
    if (state.opponentLP < prevOpponentLP.current) {
      setOpponentDamage({
        id: Date.now(),
        amount: prevOpponentLP.current - state.opponentLP,
      });
    }
    prevOpponentLP.current = state.opponentLP;
  }, [state.opponentLP]);
  // 👆 FIM DOS ESTADOS DE DANO 👆

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
    const link = state.equipLinks.find((l: any) =>
      type === "spell" ? l.spellId === cardId : l.monsterId === cardId,
    );
    if (!link) return;

    let mId = "";
    const myMIdx = state.monsterZone.findIndex(
      (m: any) => m?.id === link.monsterId,
    );
    if (myMIdx !== -1) mId = `my-monster-${myMIdx}`;
    else {
      const oppMIdx = state.opponentMonsterZone.findIndex(
        (m: any) => m?.id === link.monsterId,
      );
      if (oppMIdx !== -1) mId = `opp-monster-${oppMIdx}`;
    }

    let sId = "";
    let isOpp = false;
    const mySIdx = state.spellZone.findIndex(
      (s: any) => s?.id === link.spellId,
    );
    if (mySIdx !== -1) {
      sId = `my-spell-${mySIdx}`;
      isOpp = false;
    } else {
      const oppSIdx = state.opponentSpellZone.findIndex(
        (s: any) => s?.id === link.spellId,
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
    actions.setAttackingAnimId(attackerCard.id);
    actions.setAttackedMonsters((prev: string[]) => [...prev, attackerCard.id]);

    // 👇 NOVO: Rota de voo direto para o seu placar de vida!
    const attackerEl = document.getElementById(`opp-monster-${attackerIndex}`);
    const targetEl = document.getElementById(`player-lp-hud`);
    let xOffset = 0,
      yOffset = 450;
    if (attackerEl && targetEl) {
      const aRect = attackerEl.getBoundingClientRect();
      const tRect = targetEl.getBoundingClientRect();
      xOffset = tRect.left + tRect.width / 2 - (aRect.left + aRect.width / 2);
      yOffset = tRect.top - aRect.top;
    }
    actions.setAttackTrajectory({ x: xOffset, y: yOffset });
    // 👆 ==================================================== 👆

    setActiveEquipLine({
      monsterId: `player-lp-hud`,
      targetId: `opp-monster-${attackerIndex}`,
      isOpponent: true,
      type: "attack",
    });

    actions.setPendingCombat(() => {
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

      // 👇 HIT STOP: Segura a carta lá por 300ms enquanto a tela treme, depois ela recua!
      setTimeout(() => {
        actions.setAttackingAnimId(null);
        actions.setAttackTrajectory(null);
      }, 300);
    });
  };

  // 👇 Lógica central de Combate! (Subiu para ser acessada pelo Bot e pelo Jogador)
  const executeCombatLogic = (
    attackerCard: Card,
    attackerIndex: number,
    targetCard: Card,
    targetIndex: number,
    isPlayerAttacking: boolean,
    onComplete: () => void,
  ) => {
    const myStats = getEffectiveStats(
      attackerCard,
      [state.fieldSpell, state.opponentFieldSpell],
      actions.getMonsterEquips(attackerCard.id),
    );
    const myAtk = myStats
      ? myStats.attack
      : "attack" in attackerCard
        ? attackerCard.attack
        : 0;

    const oppStats = getEffectiveStats(
      targetCard,
      [state.fieldSpell, state.opponentFieldSpell],
      actions.getMonsterEquips(targetCard.id),
    );
    const oppAtk = oppStats
      ? oppStats.attack
      : "attack" in targetCard
        ? targetCard.attack
        : 0;
    const oppDef = oppStats
      ? oppStats.defense
      : "defense" in targetCard
        ? targetCard.defense
        : 0;

    const cleanCardForGy = (c: Card) => ({
      ...c,
      isFaceDown: false,
      cardPosition: "attack" as const,
    });

    if (targetCard.cardPosition === "attack") {
      if (myAtk > oppAtk) {
        if (isPlayerAttacking) {
          actions.setOpponentLP((prev: number) => prev - (myAtk - oppAtk));
          actions.setOpponentMonsterZone((prev: any) => {
            const nz = [...prev];
            nz[targetIndex] = null;
            return nz;
          });
          actions.setOpponentGraveyard((prev: any) => [
            ...prev,
            cleanCardForGy(targetCard),
          ]);
          actions.setMonsterZone((prev: any) => {
            const nz = [...prev];
            if (nz[attackerIndex] && "attack" in nz[attackerIndex]!) {
              nz[attackerIndex] = {
                ...nz[attackerIndex]!,
                attack: Math.max(
                  0,
                  (nz[attackerIndex]! as any).attack - oppAtk,
                ),
              };
            }
            return nz;
          });
        } else {
          actions.setPlayerLP((prev: number) => prev - (myAtk - oppAtk));
          actions.setMonsterZone((prev: any) => {
            const nz = [...prev];
            nz[targetIndex] = null;
            return nz;
          });
          actions.setGraveyard((prev: any) => [
            ...prev,
            cleanCardForGy(targetCard),
          ]);
          actions.setOpponentMonsterZone((prev: any) => {
            const nz = [...prev];
            if (nz[attackerIndex] && "attack" in nz[attackerIndex]!) {
              nz[attackerIndex] = {
                ...nz[attackerIndex]!,
                attack: Math.max(
                  0,
                  (nz[attackerIndex]! as any).attack - oppAtk,
                ),
              };
            }
            return nz;
          });
        }
      } else if (myAtk < oppAtk) {
        if (isPlayerAttacking) {
          actions.setPlayerLP((prev: number) => prev - (oppAtk - myAtk));
          actions.setMonsterZone((prev: any) => {
            const nz = [...prev];
            nz[attackerIndex] = null;
            return nz;
          });
          actions.setGraveyard((prev: any) => [
            ...prev,
            cleanCardForGy(attackerCard),
          ]);
          actions.setOpponentMonsterZone((prev: any) => {
            const nz = [...prev];
            if (nz[targetIndex] && "attack" in nz[targetIndex]!) {
              nz[targetIndex] = {
                ...nz[targetIndex]!,
                attack: Math.max(0, (nz[targetIndex]! as any).attack - myAtk),
              };
            }
            return nz;
          });
        } else {
          actions.setOpponentLP((prev: number) => prev - (oppAtk - myAtk));
          actions.setOpponentMonsterZone((prev: any) => {
            const nz = [...prev];
            nz[attackerIndex] = null;
            return nz;
          });
          actions.setOpponentGraveyard((prev: any) => [
            ...prev,
            cleanCardForGy(attackerCard),
          ]);
          actions.setMonsterZone((prev: any) => {
            const nz = [...prev];
            if (nz[targetIndex] && "attack" in nz[targetIndex]!) {
              nz[targetIndex] = {
                ...nz[targetIndex]!,
                attack: Math.max(0, (nz[targetIndex]! as any).attack - myAtk),
              };
            }
            return nz;
          });
        }
      } else {
        actions.setOpponentMonsterZone((prev: any) => {
          const nz = [...prev];
          nz[isPlayerAttacking ? targetIndex : attackerIndex] = null;
          return nz;
        });
        actions.setOpponentGraveyard((prev: any) => [
          ...prev,
          cleanCardForGy(isPlayerAttacking ? targetCard : attackerCard),
        ]);
        actions.setMonsterZone((prev: any) => {
          const nz = [...prev];
          nz[isPlayerAttacking ? attackerIndex : targetIndex] = null;
          return nz;
        });
        actions.setGraveyard((prev: any) => [
          ...prev,
          cleanCardForGy(isPlayerAttacking ? attackerCard : targetCard),
        ]);
      }
    } else {
      if (myAtk > oppDef) {
        if (isPlayerAttacking) {
          actions.setOpponentMonsterZone((prev: any) => {
            const nz = [...prev];
            nz[targetIndex] = null;
            return nz;
          });
          actions.setOpponentGraveyard((prev: any) => [
            ...prev,
            cleanCardForGy(targetCard),
          ]);
        } else {
          actions.setMonsterZone((prev: any) => {
            const nz = [...prev];
            nz[targetIndex] = null;
            return nz;
          });
          actions.setGraveyard((prev: any) => [
            ...prev,
            cleanCardForGy(targetCard),
          ]);
        }
      } else if (myAtk < oppDef) {
        if (isPlayerAttacking)
          actions.setPlayerLP((prev: number) => prev - (oppDef - myAtk));
        else actions.setOpponentLP((prev: number) => prev - (oppDef - myAtk));
      }
    }
    onComplete();
  };

  const handleOpponentAttack = (attackerIndex: number, targetIndex: number) => {
    const attackerCard = state.opponentMonsterZone[attackerIndex]!;
    actions.setAttackingAnimId(attackerCard.id);
    actions.setAttackedMonsters((prev: string[]) => [...prev, attackerCard.id]);

    // 👇 NOVO: Calculando a rota de voo da carta do Oponente!
    const attackerEl = document.getElementById(`opp-monster-${attackerIndex}`);
    const targetEl = document.getElementById(`my-monster-${targetIndex}`);
    let xOffset = 0,
      yOffset = 250; // O yOffset é positivo porque ele ataca para baixo!
    if (attackerEl && targetEl) {
      const aRect = attackerEl.getBoundingClientRect();
      const tRect = targetEl.getBoundingClientRect();
      xOffset = tRect.left - aRect.left;
      yOffset = tRect.top - aRect.top;
    }
    actions.setAttackTrajectory({ x: xOffset, y: yOffset });
    // 👆 ==================================================== 👆

    const resolveNormalCombat = () => {
      setActiveEquipLine({
        monsterId: `my-monster-${targetIndex}`,
        targetId: `opp-monster-${attackerIndex}`,
        isOpponent: true,
        type: "attack",
      });

      actions.setPendingCombat(() => {
        const myCard = state.monsterZone[targetIndex]!;
        executeCombatLogic(
          attackerCard,
          attackerIndex,
          myCard,
          targetIndex,
          false,
          () => {
            // 👇 HIT STOP: Segura a carta lá por 300ms enquanto a tela treme, depois ela recua!
            setTimeout(() => {
              actions.setAttackingAnimId(null);
              actions.setAttackTrajectory(null);
            }, 300);
          },
        );
      });
    };

    // ... (o código do trapCheck continua igual daqui para baixo!)

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
          actions.setSpellZone((prev: (Card | null)[]) => {
            const nz = [...prev];
            nz[trapCheck.trapIndex!] = {
              ...trapCheck.trapCard!,
              isFaceDown: false,
            };
            return nz;
          });
          actions.setPendingPrompt(null);

          if ((trapCheck.effect as any).requiresSelfMonsterDestruction) {
            const validSoldiersIds = state.monsterZone
              .filter(
                (m: Card | null) =>
                  m !== null &&
                  !m.isFaceDown &&
                  "race" in m &&
                  m.race === "Soldado",
              )
              .map((m: any) => m.id);

            actions.setPendingSelection({
              message: "Selecione qual Soldado sacrificar para a Kamikaze!",
              validTargetIds: validSoldiersIds,
              onSelect: (selectedId: string) => {
                const selectedIdx = state.monsterZone.findIndex(
                  (m: Card | null) => m?.id === selectedId,
                );
                const selectedSoldier = state.monsterZone[selectedIdx]!;

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
      resolveNormalCombat();
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
      const trapCheck = checkTriggers(
        "ON_SUMMON",
        cardWithState,
        newZone,
        state.monsterZone,
        state.spellZone,
        [state.fieldSpell, state.opponentFieldSpell],
      );

      if (trapCheck.triggered && trapCheck.effect) {
        actions.setPendingPrompt({
          message: trapCheck.effect.message,
          onConfirm: () => {
            actions.setSpellZone((prev: (Card | null)[]) => {
              const nz = [...prev];
              nz[trapCheck.trapIndex!] = {
                ...trapCheck.trapCard!,
                isFaceDown: false,
              };
              return nz;
            });

            setTimeout(() => {
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

  const executeAttackMonster = (targetCard: Card, targetIndex: number) => {
    if (state.currentPlayer !== "player") return alert("Não é o seu turno!");
    if (state.currentPhase !== "battle")
      return alert("Você só pode atacar na Fase de Batalha!");
    if (state.currentTurn === 1)
      return alert("Regra: Não é permitido atacar no primeiro turno do jogo!");
    if (!state.attackerInfo || state.attackingAnimId) return;

    const executeCombat = () => {
      const attackerEl = document.getElementById(
        `my-monster-${state.attackerInfo!.index}`,
      );
      const targetEl = document.getElementById(`opp-monster-${targetIndex}`);
      let xOffset = 0,
        yOffset = -250;

      if (attackerEl && targetEl) {
        const aRect = attackerEl.getBoundingClientRect();
        const tRect = targetEl.getBoundingClientRect();
        xOffset = tRect.left - aRect.left;
        yOffset = tRect.top - aRect.top;
      }

      actions.setAttackTrajectory({ x: xOffset, y: yOffset });
      actions.setAttackingAnimId(state.attackerInfo!.card.id);
      actions.setAttackedMonsters((prev: string[]) => [
        ...prev,
        state.attackerInfo!.card.id,
      ]);

      setTimeout(() => {
        triggerShake();
        executeCombatLogic(
          state.attackerInfo!.card,
          state.attackerInfo!.index,
          targetCard,
          targetIndex,
          true,
          () => {
            actions.setAttackingAnimId(null);
            actions.setAttackTrajectory(null);
            actions.setAttackerInfo(null);
          },
        );
      }, 500);
    };

    const trapCheck = checkTriggers(
      "ON_ATTACK",
      state.attackerInfo!.card,
      state.monsterZone,
      state.opponentMonsterZone,
      state.opponentSpellZone,
      [state.fieldSpell, state.opponentFieldSpell],
    );

    if (trapCheck.triggered && trapCheck.effect) {
      alert(
        `O oponente ativou a armadilha: ${trapCheck.trapCard!.name}!\n\n${trapCheck.effect.message}`,
      );
      actions.setOpponentSpellZone((prev: any) => {
        const nz = [...prev];
        nz[trapCheck.trapIndex!] = {
          ...trapCheck.trapCard!,
          isFaceDown: false,
        };
        return nz;
      });

      setTimeout(() => {
        if ((trapCheck.effect as any).requiresSelfMonsterDestruction) {
          actions.setOpponentMonsterZone((prev: any) => {
            const nz = [...prev];
            const sIdx = nz.findIndex(
              (m: any) =>
                m !== null &&
                !m.isFaceDown &&
                "race" in m &&
                m.race === "Soldado",
            );
            if (sIdx !== -1) {
              const dead = nz[sIdx]!;
              nz[sIdx] = null;
              actions.setOpponentGraveyard((gy: any) => [
                ...gy,
                { ...dead, isFaceDown: false, cardPosition: "attack" },
              ]);
            }
            return nz;
          });
          actions.setOpponentSpellZone((prev: any) => {
            const nz = [...prev];
            nz[trapCheck.trapIndex!] = null;
            return nz;
          });
          actions.setOpponentGraveyard((prev: any) => [
            ...prev,
            {
              ...trapCheck.trapCard!,
              isFaceDown: false,
              cardPosition: "attack",
            },
          ]);

          actions.setMonsterZone((prev: any) => {
            const nz = [...prev];
            nz[state.attackerInfo!.index] = null;
            return nz;
          });
          actions.setGraveyard((prev: any) => [
            ...prev,
            {
              ...state.attackerInfo!.card,
              isFaceDown: false,
              cardPosition: "attack",
            },
          ]);

          actions.setAttackingAnimId(null);
          actions.setAttackTrajectory(null);
          actions.setAttackerInfo(null);
        } else {
          if ((trapCheck.effect as any).destroyTrap) {
            actions.setOpponentSpellZone((prev: any) => {
              const nz = [...prev];
              nz[trapCheck.trapIndex!] = null;
              return nz;
            });
            actions.setOpponentGraveyard((prev: any) => [
              ...prev,
              {
                ...trapCheck.trapCard!,
                isFaceDown: false,
                cardPosition: "attack",
              },
            ]);
          }
          if ((trapCheck.effect as any).negateActivation) {
            actions.setMonsterZone((prev: any) => {
              const nz = [...prev];
              nz[state.attackerInfo!.index] = null;
              return nz;
            });
            actions.setGraveyard((prev: any) => [
              ...prev,
              {
                ...state.attackerInfo!.card,
                isFaceDown: false,
                cardPosition: "attack",
              },
            ]);

            actions.setAttackingAnimId(null);
            actions.setAttackTrajectory(null);
            actions.setAttackerInfo(null);
          }
        }
      }, 1000);
    } else executeCombat();
  };

  const executeDirectAttack = () => {
    if (!state.attackerInfo || state.attackingAnimId) return;
    if (state.currentPlayer !== "player") return alert("Não é o seu turno!");
    if (state.currentPhase !== "battle")
      return alert("Você só pode atacar na Fase de Batalha (Battle Phase)!");
    if (state.currentTurn === 1)
      return alert("Regra: Não é permitido atacar no primeiro turno do jogo!");
    if (state.opponentMonsterZone.some((slot: any) => slot !== null))
      return alert(
        "Você não pode atacar diretamente se o oponente tem monstros no campo!",
      );

    const attackerEl = document.getElementById(
      `my-monster-${state.attackerInfo.index}`,
    );
    const targetEl = document.getElementById(`opp-lp-hud`);
    let xOffset = 0,
      yOffset = -450;
    if (attackerEl && targetEl) {
      const aRect = attackerEl.getBoundingClientRect();
      const tRect = targetEl.getBoundingClientRect();
      xOffset = tRect.left + tRect.width / 2 - (aRect.left + aRect.width / 2);
      yOffset = tRect.top - aRect.top;
    }

    actions.setAttackTrajectory({ x: xOffset, y: yOffset });
    actions.setAttackingAnimId(state.attackerInfo.card.id);
    actions.setAttackedMonsters((prev: string[]) => [
      ...prev,
      state.attackerInfo!.card.id,
    ]);

    setTimeout(() => {
      triggerShake();
      const myStats = getEffectiveStats(
        state.attackerInfo!.card,
        [state.fieldSpell, state.opponentFieldSpell],
        actions.getMonsterEquips(state.attackerInfo!.card.id),
      );
      const myAtk = myStats
        ? myStats.attack
        : "attack" in state.attackerInfo!.card
          ? state.attackerInfo!.card.attack
          : 0;
      actions.setOpponentLP((prev: number) => prev - myAtk);
      actions.setAttackingAnimId(null);
      actions.setAttackTrajectory(null);
      actions.setAttackerInfo(null);
    }, 500);
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
    <>
      {/* 👇 MAGIA CSS: O Tremor da Tela (Screen Shake) 👇 */}
      <style>{`
        @keyframes screenShake {
          0%, 100% { transform: translate(0, 0); }
          20%, 60% { transform: translate(-8px, -4px); }
          40%, 80% { transform: translate(8px, 4px); }
        }
        .animate-screen-shake {
          animation: screenShake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
      <main
        onClick={() => {
          if (state.pendingEquip)
            return alert(
              "Selecione um alvo válido (iluminado em amarelo) para equipar a carta!",
            );
          setActiveHandCardId(null);
          setActiveFieldCardId(null);
        }}
        className={`h-screen w-screen flex bg-gray-950 overflow-hidden font-sans text-white ${
          isShaking ? "animate-screen-shake" : ""
        }`}
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
                  // Passamos a ordem de desenhar o laser no novo "onConfirm"!
                  actions.executeDirectAttack(() => {
                    setActiveEquipLine({
                      monsterId: `my-monster-${state.attackerInfo!.index}`,
                      targetId: `opp-lp-hud`,
                      isOpponent: true,
                      type: "attack",
                    });
                  });
                }
              }}
              className={`bg-red-950/80 border-2 rounded-lg py-2 px-6 flex gap-4 items-center shadow-lg transition-all relative ${
                state.attackerInfo &&
                !state.opponentMonsterZone.some((c: any) => c !== null)
                  ? "border-red-500 scale-110 cursor-crosshair pointer-events-auto animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.8)]"
                  : "border-red-900 pointer-events-auto"
              } ${opponentDamage ? "!bg-red-800 border-red-500 shadow-[0_0_30px_rgba(220,38,38,0.8)] z-[9999]" : ""}`}
            >
              {/* 👇 ANIMAÇÃO DO NÚMERO SUBINDO 👇 */}
              <AnimatePresence>
                {opponentDamage && (
                  <FloatingDamage
                    key={opponentDamage.id}
                    amount={opponentDamage.amount}
                    onComplete={() => setOpponentDamage(null)}
                  />
                )}
              </AnimatePresence>
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
            {state.opponentHand.map((card: any) => (
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
                {state.opponentSpellZone.map((c: any, i: number) => (
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
                    <CardView
                      card={state.opponentFieldSpell}
                      isOpponent={true}
                    />
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
                onDropCard={(cardId, slotIndex) => {
                  const cardToPlay = state.hand.find((c) => c.id === cardId);
                  if (cardToPlay) {
                    // 👇 Proteção: Impede o jogador de jogar magias nos quadrados errados
                    if (!("attack" in cardToPlay)) {
                      return alert(
                        "Você não pode colocar Mágicas e Armadilhas na Zona de Monstros!",
                      );
                    }

                    actions.executePlayCard(
                      cardToPlay,
                      false,
                      "attack",
                      slotIndex,
                    );
                  }
                }}
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
                    actions.executeAttackMonster(cardInZone, index, () => {
                      setActiveEquipLine({
                        monsterId: `my-monster-${state.attackerInfo!.index}`,
                        targetId: `opp-monster-${index}`,
                        isOpponent: true,
                        type: "attack",
                      });
                    });
                  } else if (isDirectAttackTarget) {
                    actions.executeDirectAttack(() => {
                      setActiveEquipLine({
                        monsterId: `my-monster-${state.attackerInfo!.index}`,
                        targetId: `opp-lp-hud`,
                        isOpponent: true,
                        type: "attack",
                      });
                    });
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
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  const draggedCardId =
                    e.dataTransfer.getData("text/plain") ||
                    (window as any).fallbackCardId;

                  if (draggedCardId) {
                    (window as any).fallbackCardId = null;
                    const cardToPlay = state.hand.find(
                      (c: Card) => c.id === draggedCardId,
                    );

                    if (cardToPlay) {
                      if (cardToPlay.cardType !== "FieldSpell") {
                        return alert(
                          "Apenas Mágicas de Campo podem ser colocadas nesta zona!",
                        );
                      }
                      actions.executePlayCard(cardToPlay, false);
                    }
                  }
                }}
              >
                {!state.fieldSpell ? (
                  <span className="text-emerald-500/50 text-[10px] font-bold text-center pointer-events-none">
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
                onDropCard={(cardId, slotIndex) => {
                  const cardToPlay = state.hand.find((c) => c.id === cardId);
                  if (cardToPlay) {
                    if (!("attack" in cardToPlay)) {
                      return alert(
                        "Você não pode colocar Mágicas e Armadilhas na Zona de Monstros!",
                      );
                    }
                    actions.executePlayCard(
                      cardToPlay,
                      false,
                      "attack",
                      slotIndex,
                    );
                  }
                }}
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
                {state.spellZone.map((cardInZone: any, index: number) => (
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
                    onDragOver={(e) => {
                      if (cardInZone === null) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.dataTransfer.dropEffect = "move";
                      }
                    }}
                    onDragEnter={(e) => {
                      if (cardInZone === null) {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      if (cardInZone !== null) return;

                      const draggedCardId =
                        e.dataTransfer.getData("text/plain") ||
                        (window as any).fallbackCardId;

                      if (draggedCardId) {
                        (window as any).fallbackCardId = null;
                        const cardToPlay = state.hand.find(
                          (c: Card) => c.id === draggedCardId,
                        );

                        if (cardToPlay) {
                          // Trava de segurança contra monstros
                          if ("attack" in cardToPlay) {
                            return alert(
                              "Você não pode colocar Monstros na Zona de Mágicas/Armadilhas!",
                            );
                          }
                          if (cardToPlay.cardType === "FieldSpell") {
                            return alert(
                              "Mágicas de Campo devem ser colocadas na Zona de Campo (à esquerda)!",
                            );
                          }

                          // Joga a carta no slot exato
                          actions.executePlayCard(
                            cardToPlay,
                            false,
                            "attack",
                            index,
                          );
                        }
                      }
                    }}
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
              className={`bg-blue-950/80 border-2 border-blue-900 rounded-lg py-2 px-6 flex gap-4 items-center shadow-lg pointer-events-auto transition-all relative ${
                playerDamage
                  ? "!bg-red-900 border-red-500 shadow-[0_0_30px_rgba(220,38,38,0.8)] z-[9999]"
                  : ""
              }`}
            >
              {/* 👇 ANIMAÇÃO DO NÚMERO SUBINDO 👇 */}
              <AnimatePresence>
                {playerDamage && (
                  <FloatingDamage
                    key={playerDamage.id}
                    amount={playerDamage.amount}
                    onComplete={() => setPlayerDamage(null)}
                  />
                )}
              </AnimatePresence>
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
              if (state.pendingEquip)
                return alert("Equipe o feitiço primeiro!");
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

        <SelectionModal selection={state.pendingSelection} />
        <TrapPromptModal prompt={state.pendingPrompt} />
        <DeckSearchModal search={state.pendingDeckSearch} />
        <DiscardModal
          discard={state.pendingDiscard}
          hand={state.hand}
          onCancel={() => actions.setPendingDiscard(null)}
        />

        <AnimatePresence>
          {activeEquipLine && (
            <GameConnectionLine
              {...activeEquipLine}
              onComplete={() => {
                if (activeEquipLine.type === "attack") {
                  triggerShake(); // 1. Treme a tela

                  // 👇 2. CÁLCULO DA EXPLOSÃO: Acha onde o inimigo está e solta a bomba!
                  const targetEl = document.getElementById(
                    activeEquipLine.targetId,
                  );
                  if (targetEl) {
                    const rect = targetEl.getBoundingClientRect();
                    setHitExplosion({
                      id: Date.now(),
                      x: rect.left + rect.width / 2,
                      y: rect.top + rect.height / 2,
                    });
                  }

                  actions.resolveCombat(); // 3. Tira a vida (Executa a fila)
                  setTimeout(() => setActiveEquipLine(null), 150);
                }
              }}
            />
          )}
        </AnimatePresence>

        {/* 👇 RENDERIZA A EXPLOSÃO POR CIMA DE TUDO 👇 */}
        <AnimatePresence>
          {hitExplosion && (
            <HitExplosion
              key={hitExplosion.id}
              x={hitExplosion.x}
              y={hitExplosion.y}
              onComplete={() => setHitExplosion(null)}
            />
          )}
        </AnimatePresence>
      </main>
    </>
  );
}
