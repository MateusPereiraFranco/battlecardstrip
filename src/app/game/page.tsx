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
import SummonVFX from "../../components/game/animations/SummonVFX";
import PhaseBanner from "../../components/game/animations/PhaseBanner";
import MulliganScreen from "../../components/game/modals/MulliganScreen";
import GameOverScreen from "../../components/game/animations/GameOverScreen";
import BattleLogDrawer from "../../components/game/modals/BattleLogDrawer";
import { playSFX } from "../../utils/audio";
import { cardDatabase } from "../../data/cards";

const getCombatTheme = (card: Card | null) => {
  if (!card || !("race" in card)) return "#e2e8f0"; // Default: Cinza claro/branco

  switch (card.race) {
    case "Dragão":
      return "#ef4444"; // Vermelho (Fogo)
    case "Mago":
      return "#a855f7"; // Roxo (Magia Arcana)
    case "Soldado":
      return "#f97316"; // Laranja (Pólvora/Explosão)
    case "Máquina":
      return "#06b6d4"; // Ciano (Laser Tecnológico)
    case "Guerreiro":
      return "#eab308"; // Amarelo (Aura de Batalha)
    case "Demônio":
      return "#10b981"; // Verde (Fogo Amaldiçoado)
    case "Besta":
      return "#8b5cf6"; // Violeta (Cortes Selvagens)
    default:
      return "#e2e8f0"; // Cinza claro (Impacto Físico padrão)
  }
};

export default function Home() {
  const { state, actions } = useGameEngine();

  const [showBattleLog, setShowBattleLog] = useState(false);

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

  const [isDeckShuffling, setIsDeckShuffling] = useState(false);

  const [confirmedMulliganIds, setConfirmedMulliganIds] = useState<
    string[] | null
  >(null);

  const startProfessionalShuffle = () => {
    setIsDeckShuffling(true);
    playSFX("shuffle");

    // 👇 Trava a tela por 2 segundos (Tempo do Duel Links)
    setTimeout(() => {
      setIsDeckShuffling(false);
    }, 2000);
  };

  const [hitExplosion, setHitExplosion] = useState<{
    id: number;
    x: number;
    y: number;
    color: string;
  } | null>(null);

  const [summonVFX, setSummonVFX] = useState<{
    id: number;
    x: number;
    y: number;
    color: string;
    soundType: "summonMonster" | "summonSpell";
  } | null>(null);

  const [phaseBanner, setPhaseBanner] = useState<{
    id: number;
    text: string;
    color: string;
  } | null>(null);

  // 👀 Olheiro que detecta mudança de Fase/Turno e dispara o Banner
  useEffect(() => {
    if (state.isMulliganPhase) return;
    let text = "";
    let color = "#3b82f6"; // Azul padrão

    if (state.currentPhase === "draw") {
      text = state.currentPlayer === "player" ? "Seu Turno!" : "Turno Inimigo";
      color = state.currentPlayer === "player" ? "#3b82f6" : "#ef4444"; // Azul vs Vermelho
    } else if (state.currentPhase === "main") {
      text = "Fase Principal";
      color = state.currentPlayer === "player" ? "#10b981" : "#ef4444"; // Esmeralda
    } else if (state.currentPhase === "battle") {
      text = "Fase de Batalha";
      color = state.currentPlayer === "player" ? "#f97316" : "#ef4444"; // Laranja/Fogo
    } else if (state.currentPhase === "end") {
      text = "Fase Final";
      color = "#8b5cf6"; // Violeta para o fim do turno
    }

    setPhaseBanner({ id: Date.now(), text, color });
  }, [state.currentPhase, state.currentPlayer]);

  const triggerActivationVFX = (
    elementId: string,
    card: Card,
    isOpponent: boolean = false,
  ) => {
    const el = document.getElementById(elementId);
    if (el) {
      const rect = el.getBoundingClientRect();
      let color = isOpponent ? "#ef4444" : "#3b82f6";
      let soundType: "summonMonster" | "summonSpell" = "summonMonster"; // 👈 Som Padrão

      // Se NÃO for monstro, muda a cor e O SOM!
      if (!("attack" in card)) {
        soundType = "summonSpell"; // 👈 Troca o som pra Magia!
        if (card.cardType === "Spell" || card.cardType === "EquipSpell")
          color = "#10b981";
        else if (card.cardType === "Trap") color = "#d946ef";
        else if (card.cardType === "FieldSpell") color = "#14b8a6";
      }

      setSummonVFX({
        id: Date.now(),
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        color,
        soundType, // 👈 Envia o som pra animação
      });
    }
  };

  // 👇 NOVO: Escuta os pedidos de VFX do Motor (Armadilhas do Bot)
  useEffect(() => {
    if (state.vfxRequest) {
      triggerActivationVFX(
        state.vfxRequest.id,
        state.vfxRequest.card,
        state.vfxRequest.isOpponent,
      );
      actions.setVfxRequest(null);
    }
  }, [state.vfxRequest]);

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

  let winner: "player" | "opponent" | null = null;
  if (state.opponentLP <= 0) winner = "player";
  else if (state.playerLP <= 0) winner = "opponent";

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
    actions.addLog(
      "player",
      `equipou [${state.pendingEquip!.spellCard.name}] em [${targetCard.name}].`,
      "spell",
    );
    actions.setPendingEquip(null);
  };

  const handleOpponentDirectAttack = (attackerIndex: number) => {
    const attackerCard = state.opponentMonsterZone[attackerIndex]!;
    actions.addLog(
      "opponent",
      `atacou diretamente com [${attackerCard.name}]!`,
      "attack",
    );
    actions.setAttackingAnimId(attackerCard.id);
    actions.setAttackedMonsters((prev: string[]) => [...prev, attackerCard.id]);

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

    setActiveEquipLine({
      monsterId: `player-lp-hud`,
      targetId: `opp-monster-${attackerIndex}`,
      isOpponent: true,
      type: "attack",
      color: getCombatTheme(attackerCard),
    });

    actions.setPendingCombat(() => {
      // 👇 CORREÇÃO: O Bot agora usa a matemática oficial do Motor para Ataque Direto!
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

      actions.setPlayerLP((prev: number) => prev - myAtk);

      setTimeout(() => {
        actions.setAttackTrajectory(null);
      }, 300);

      setTimeout(() => {
        actions.setAttackingAnimId(null);
      }, 600);
    });
  };

  const handleOpponentAttack = (attackerIndex: number, targetIndex: number) => {
    const attackerCard = state.opponentMonsterZone[attackerIndex]!;
    actions.addLog(
      "opponent",
      `ordenou que [${attackerCard.name}] atacasse [${state.monsterZone[targetIndex]!.name}]!`,
      "attack",
    );
    actions.setAttackingAnimId(attackerCard.id);
    actions.setAttackedMonsters((prev: string[]) => [...prev, attackerCard.id]);

    const attackerEl = document.getElementById(`opp-monster-${attackerIndex}`);
    const targetEl = document.getElementById(`my-monster-${targetIndex}`);
    let xOffset = 0,
      yOffset = 250;
    if (attackerEl && targetEl) {
      const aRect = attackerEl.getBoundingClientRect();
      const tRect = targetEl.getBoundingClientRect();
      xOffset = tRect.left - aRect.left;
      yOffset = tRect.top - aRect.top;
    }
    actions.setAttackTrajectory({ x: xOffset, y: yOffset });

    const resolveNormalCombat = () => {
      setActiveEquipLine({
        monsterId: `my-monster-${targetIndex}`,
        targetId: `opp-monster-${attackerIndex}`,
        isOpponent: true,
        type: "attack",
        color: getCombatTheme(attackerCard),
      });

      actions.setPendingCombat(() => {
        const myCard = state.monsterZone[targetIndex]!;
        // 👇 CORREÇÃO: O combate resolve usando o Motor (que tem os 600ms de delay pro cemitério!)
        actions.executeCombatLogic(
          attackerCard,
          attackerIndex,
          myCard,
          targetIndex,
          false,
          () => {
            setTimeout(() => {
              actions.setAttackTrajectory(null);
            }, 300);

            setTimeout(() => {
              actions.setAttackingAnimId(null);
            }, 600);
          },
        );
      });
    };

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
          actions.setPendingPrompt(null);
          actions.addLog(
            "player",
            `ativou a armadilha [${trapCheck.trapCard!.name}]!`,
            "spell",
          );
          setTimeout(() => {
            triggerActivationVFX(
              `my-spell-${trapCheck.trapIndex}`,
              trapCheck.trapCard!,
            );
            actions.setSpellZone((prev: (Card | null)[]) => {
              const nz = [...prev];
              nz[trapCheck.trapIndex!] = {
                ...trapCheck.trapCard!,
                isFaceDown: false,
              };
              return nz;
            });
          }, 300);

          if ((trapCheck.effect as any).requiresSelfMonsterDestruction) {
            actions.addLog(
              "system",
              `A armadilha [${trapCheck.trapCard!.name}] destruiu [${attackerCard.name}]!`,
              "damage",
            );
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
                actions.addLog(
                  "system",
                  `A armadilha [${trapCheck.trapCard!.name}] destruiu [${attackerCard.name}]!`,
                  "damage",
                );
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

    triggerActivationVFX(`opp-monster-${emptyMIdx}`, cardToPlay, true);

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

    actions.addLog("opponent", `invocou [${cardToPlay.name}].`, "summon");

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
            // 1. FECHA O MODAL
            actions.setPendingPrompt(null);
            actions.addLog(
              "player",
              `ativou a armadilha [${trapCheck.trapCard!.name}]!`,
              "spell",
            );

            // 2. ESPERA A TELA LIMPAR
            setTimeout(() => {
              triggerActivationVFX(
                `my-spell-${trapCheck.trapIndex}`,
                trapCheck.trapCard!,
              );
              actions.setSpellZone((prev: (Card | null)[]) => {
                const nz = [...prev];
                nz[trapCheck.trapIndex!] = {
                  ...trapCheck.trapCard!,
                  isFaceDown: false,
                };
                return nz;
              });

              // 3. ESPERA O TEMPO DA ANIMAÇÃO DO RAIO (1.5s) PARA DESTRUIR O MONSTRO
              setTimeout(() => {
                if (trapCheck.effect!.destroyTriggeringCard) {
                  actions.addLog(
                    "system",
                    `A armadilha [${trapCheck.trapCard!.name}] destruiu [${cardWithState.name}]!`,
                    "damage",
                  );
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
              }, 1500);
            }, 300); // <-- Tempo de espera do modal sumir
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

    // 👇 CORREÇÃO: Se for campo, vai pra zona de campo e brilha Ciano!
    if (spellCard.cardType === "FieldSpell") {
      actions.setOpponentFieldSpell({
        ...spellCard,
        isFaceDown: false,
        turnSet: state.currentTurn,
      });
      triggerActivationVFX("opp-field-zone", spellCard, true);
      return;
    }

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

      if (spellCard.cardType !== "Trap") {
        triggerActivationVFX(`opp-spell-${emptySIdx}`, spellCard, true);
      } else {
        playSFX("downCard"); // 👈 NOVO: O Som da armadilha do bot caindo na mesa
        actions.addLog("opponent", `baixou uma armadilha.`, "spell");
      }

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
    personality: "aggro",
  });

  return (
    <>
      {/* 👇 MAGIA CSS: O Tremor da Tela (Screen Shake) 👇 */}
      {/* 👇 MAGIA CSS: O Tremor da Tela e o Embaralhamento (Master Duel Style) 👇 */}
      <style>{`
        @keyframes screenShake {
          0%, 100% { transform: translate(0, 0); }
          20%, 60% { transform: translate(-8px, -4px); }
          40%, 80% { transform: translate(8px, 4px); }
        }
        .animate-screen-shake {
          animation: screenShake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }

        /* 👇 ESTILO MASTER DUEL: Blocos do baralho subindo e intercalando */
        @keyframes deckCutLeft {
          0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); z-index: 10; }
          25% { transform: translateY(-50px) translateX(-20px) rotate(-8deg); z-index: 30; }
          50% { transform: translateY(-15px) translateX(0) rotate(0deg); z-index: 30; }
          75% { transform: translateY(0) translateX(0) rotate(0deg); z-index: 10; }
        }
        @keyframes deckCutRight {
          0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); z-index: 10; }
          25% { transform: translateY(-60px) translateX(20px) rotate(8deg); z-index: 40; }
          50% { transform: translateY(-20px) translateX(0) rotate(0deg); z-index: 40; }
          75% { transform: translateY(0) translateX(0) rotate(0deg); z-index: 20; }
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

          {/* ... (Div do Oponente LP e Mana que você já tem) ... */}
          <div className="absolute top-6 left-6 z-20 flex gap-4 pointer-events-none">
            {/* ... Oponente LP HUD ... */}
          </div>

          {/* 👇 NOVO: O Botão do Histórico no Canto Superior Direito 👇 */}
          <div className="absolute top-6 right-6 z-50 pointer-events-auto">
            <button
              onClick={() => setShowBattleLog(true)}
              className="bg-slate-900/80 border-2 border-slate-600 hover:border-blue-400 rounded-lg py-2 px-4 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all flex items-center gap-2 group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">
                📜
              </span>
              <span className="text-slate-300 font-bold uppercase tracking-widest text-xs hidden md:block">
                Histórico
              </span>
            </button>
          </div>

          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex justify-center -space-x-8 scale-[0.60] z-10">
            {state.opponentHand.length === 0 && (
              <span className="text-gray-500 italic mt-12 text-lg">
                Deck Oponente para simular
              </span>
            )}
            <AnimatePresence>
              {state.opponentHand.map((card: any) => (
                <motion.div
                  key={`opp-hand-${card.id}`}
                  layout
                  initial={{
                    opacity: 0,
                    x: -200,
                    y: 150,
                    scale: 0.2,
                    rotate: 90,
                  }}
                  animate={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: -100 }}
                  transition={{ type: "spring", damping: 25, stiffness: 250 }}
                >
                  <CardView
                    card={{ ...card, isFaceDown: true }}
                    disableDrag={true}
                    isOpponent={true}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
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
                    {!c && (
                      <span className="text-red-500/30 text-[10px] font-bold">
                        MÁGICA
                      </span>
                    )}
                    <AnimatePresence>
                      {c && (
                        <motion.div
                          key={c.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{
                            opacity: 0,
                            scale: 0.5,
                            filter: "brightness(2) blur(4px)",
                          }}
                          transition={{ duration: 0.3 }}
                          className="absolute top-0 left-0 w-full h-full cursor-pointer z-10"
                        >
                          <CardView card={c} isOpponent={true} />
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                id="opp-field-zone"
                className="w-[100px] h-[145px] border-2 border-dashed border-emerald-500/30 bg-emerald-500/5 rounded-sm flex items-center justify-center relative cursor-pointer hover:border-emerald-500/80 transition-colors"
                onClick={() =>
                  state.opponentFieldSpell &&
                  selectCardWithFlash(state.opponentFieldSpell)
                }
              >
                {!state.opponentFieldSpell && (
                  <span className="text-emerald-500/30 text-[10px] font-bold text-center">
                    CAMPO
                    <br />
                    OPONENTE
                  </span>
                )}
                <AnimatePresence>
                  {state.opponentFieldSpell && (
                    <motion.div
                      key={state.opponentFieldSpell.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{
                        opacity: 0,
                        scale: 0.5,
                        filter: "brightness(2) blur(4px)",
                      }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 z-10"
                    >
                      <CardView
                        card={state.opponentFieldSpell}
                        isOpponent={true}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
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
                    if (!("attack" in cardToPlay))
                      return alert(
                        "Você não pode colocar Mágicas e Armadilhas na Zona de Monstros!",
                      );

                    // Passa o slotIndex E o Callback
                    actions.executePlayCard(
                      cardToPlay,
                      false,
                      "attack",
                      slotIndex,
                      (finalIndex) => {
                        // O Drag & Drop já cai meio perto, 150ms é o tempo exato de impacto!
                        setTimeout(() => {
                          triggerActivationVFX(
                            `my-monster-${finalIndex}`,
                            cardToPlay,
                          );
                        }, 150);
                      },
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
                        targetId: `my-monster-${state.attackerInfo!.index}`,
                        monsterId: `opp-monster-${index}`,
                        isOpponent: true,
                        type: "attack",
                        color: getCombatTheme(state.attackerInfo!.card),
                      });
                    });
                  } else if (isDirectAttackTarget) {
                    actions.executeDirectAttack(() => {
                      setActiveEquipLine({
                        targetId: `my-monster-${state.attackerInfo!.index}`,
                        monsterId: `opp-lp-hud`,
                        isOpponent: true,
                        type: "attack",
                        color: getCombatTheme(state.attackerInfo!.card),
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
                      card={{
                        ...state.opponentGraveyard[
                          state.opponentGraveyard.length - 1
                        ],
                      }}
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
                id="my-field-zone"
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

                      actions.executePlayCard(
                        cardToPlay,
                        false,
                        undefined,
                        undefined,
                        () => {
                          setTimeout(() => {
                            triggerActivationVFX("my-field-zone", cardToPlay);
                          }, 150);
                        },
                      );
                    }
                  }
                }}
              >
                {!state.fieldSpell && (
                  <span className="text-emerald-500/50 text-[10px] font-bold text-center pointer-events-none">
                    SEU
                    <br />
                    CAMPO
                  </span>
                )}
                <AnimatePresence>
                  {state.fieldSpell && (
                    <motion.div
                      key={state.fieldSpell.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{
                        opacity: 0,
                        scale: 0.5,
                        filter: "brightness(2) blur(4px)",
                      }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 z-10"
                    >
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
                    </motion.div>
                  )}
                </AnimatePresence>
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
                    if (!("attack" in cardToPlay))
                      return alert(
                        "Você não pode colocar Mágicas e Armadilhas na Zona de Monstros!",
                      );

                    actions.executePlayCard(
                      cardToPlay,
                      false,
                      "attack",
                      slotIndex,
                      (finalIndex) => {
                        // Espera o tempo do drag & drop "bater" na mesa
                        setTimeout(() => {
                          triggerActivationVFX(
                            `my-monster-${finalIndex}`,
                            cardToPlay,
                          );
                        }, 150);
                      },
                    );
                  }
                }}
                currentPlayer={state.currentPlayer}
                currentPhase={state.currentPhase}
                attackedMonsters={state.attackedMonsters}
                usedEffectsThisTurn={state.usedEffectsThisTurn}
                currentTurn={state.currentTurn}
                changedPositionMonsters={state.changedPositionMonsters}
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
                onChangePositionAction={(card, index) => {
                  setActiveFieldCardId(null);
                  actions.executeChangePosition(card.id, index);
                }}
                onEffectAction={(cardInZone) => {
                  actions.setUsedEffectsThisTurn((prev: any) => [
                    ...prev,
                    cardInZone.id,
                  ]);
                  const effect = checkMonsterActivatedEffect(
                    cardInZone,
                    state.hand.length,
                  );
                  actions.addLog(
                    "player",
                    `ativou o efeito de [${cardInZone.name}].`,
                    "spell",
                  );
                  actions.setPendingDiscard({
                    message: effect.message!,
                    onDiscard: (discardId: string) => {
                      const cardToDiscard = state.hand.find(
                        (c: Card) => c.id === discardId,
                      )!;
                      actions.addLog(
                        "player",
                        `descartou [${cardToDiscard.name}].`,
                        "spell",
                      );
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

                          playSFX("shuffle");
                          setIsDeckShuffling(true); // 👈 Treme o baralho na busca!
                          setTimeout(() => setIsDeckShuffling(false), 800);
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
                      card={{
                        ...state.graveyard[state.graveyard.length - 1],
                      }}
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
                          if ("attack" in cardToPlay)
                            return alert(
                              "Você não pode colocar Monstros na Zona de Mágicas/Armadilhas!",
                            );
                          if (cardToPlay.cardType === "FieldSpell")
                            return alert(
                              "Mágicas de Campo devem ser colocadas na Zona de Campo (à esquerda)!",
                            );

                          // Chama o motor passando o índice alvo
                          actions.executePlayCard(
                            cardToPlay,
                            false,
                            "attack",
                            index,
                            (finalIndex) => {
                              // Se for magia, toca o clarão/som de magia. Se for Trap, só deita a carta!
                              if (cardToPlay.cardType !== "Trap") {
                                setTimeout(() => {
                                  triggerActivationVFX(
                                    `my-spell-${finalIndex}`,
                                    cardToPlay,
                                  );
                                }, 150);
                              } else {
                                playSFX("downCard"); // 👈 NOVO: O Som da armadilha caindo na mesa
                              }
                            },
                          );
                        }
                      }
                    }}
                  >
                    {!cardInZone && (
                      <span className="text-emerald-500/50 text-[10px] font-bold">
                        MÁGICA
                      </span>
                    )}
                    <AnimatePresence>
                      {cardInZone && (
                        <motion.div
                          key={cardInZone.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{
                            opacity: 0,
                            scale: 0.5,
                            filter: "brightness(2) blur(4px)",
                          }}
                          transition={{ duration: 0.3 }}
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

                                        setActiveFieldCardId(null);

                                        setTimeout(() => {
                                          triggerActivationVFX(
                                            `my-spell-${index}`,
                                            cardInZone,
                                          );
                                          actions.executeActivateSpell(
                                            cardInZone,
                                            index,
                                          );
                                        }, 200);
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
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
              <div
                id="player-deck"
                onClick={actions.drawCard}
                className={`relative w-[100px] h-[145px] border-4 rounded-sm bg-amber-900 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.2)_10px,rgba(0,0,0,0.2)_20px)] flex flex-col items-center justify-center shadow-xl cursor-pointer transition-transform ${
                  state.currentPhase === "draw" &&
                  state.currentPlayer === "player"
                    ? "border-yellow-400 animate-pulse scale-105 shadow-[0_0_20px_rgba(250,204,21,0.6)]"
                    : "border-white hover:scale-105"
                } ${isDeckShuffling ? "scale-110 border-yellow-400 z-[100] shadow-[0_0_30px_rgba(250,204,21,0.8)]" : ""}`}
              >
                {/* Miolo fixo do Baralho */}
                <div className="w-[70px] h-[110px] border-[2px] border-amber-600 rounded-sm bg-amber-800 flex items-center justify-center shadow-inner relative z-20">
                  <div className="w-[40px] h-[40px] rounded-full bg-amber-500/50 flex items-center justify-center border-2 border-amber-400">
                    <span className="text-amber-200 font-bold text-[10px] transform -rotate-45 font-serif">
                      DECK
                    </span>
                  </div>
                </div>

                {/* Contador numérico */}
                <div className="absolute -bottom-2 -right-2 bg-black text-white text-[12px] font-bold px-2 py-1 rounded-full border-2 border-gray-500 z-50">
                  {state.deck.length}
                </div>

                {/* 👇 A MÁGICA: Blocos falsos que sobem para simular o embaralhamento 👇 */}
                {isDeckShuffling && (
                  <>
                    <div
                      className="absolute inset-0 border-2 border-amber-400 bg-amber-800 rounded-sm shadow-xl overflow-hidden pointer-events-none"
                      style={{
                        animation: "deckCutLeft 0.5s ease-in-out infinite",
                      }}
                    >
                      <div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.2)_10px,rgba(0,0,0,0.2)_20px)] opacity-50" />
                    </div>

                    <div
                      className="absolute inset-0 border-2 border-amber-400 bg-amber-900 rounded-sm shadow-xl overflow-hidden pointer-events-none"
                      style={{
                        animation:
                          "deckCutRight 0.6s ease-in-out infinite 0.15s",
                      }}
                    >
                      <div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.2)_10px,rgba(0,0,0,0.2)_20px)] opacity-50" />
                    </div>
                  </>
                )}
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
            onPlayCard={(card, isFaceDown, forcePosition) => {
              // Chama o Motor e envia o "onSuccess"
              actions.executePlayCard(
                card,
                isFaceDown,
                forcePosition,
                undefined,
                (finalIndex) => {
                  if (isFaceDown) {
                    playSFX("downCard");
                    return;
                  } // Cartas viradas pra baixo não brilham ao entrar

                  // 👇 O Segredo do "Game Feel": Espera 300ms para a carta voar e "bater" na mesa!
                  setTimeout(() => {
                    if ("attack" in card) {
                      triggerActivationVFX(`my-monster-${finalIndex}`, card);
                    } else if (card.cardType === "FieldSpell") {
                      triggerActivationVFX("my-field-zone", card);
                    } else {
                      triggerActivationVFX(`my-spell-${finalIndex}`, card);
                    }
                  }, 300);
                },
              );
            }}
            isMulliganPhase={state.isMulliganPhase}
            confirmedMulliganIds={confirmedMulliganIds}
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
                    activeEquipLine.monsterId,
                  );
                  if (targetEl) {
                    const rect = targetEl.getBoundingClientRect();
                    setHitExplosion({
                      id: Date.now(),
                      x: rect.left + rect.width / 2,
                      y: rect.top + rect.height / 2,
                      color: activeEquipLine.color || "#e2e8f0",
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
              color={hitExplosion.color}
              onComplete={() => setHitExplosion(null)}
            />
          )}
        </AnimatePresence>
        {/* 👇 RENDERIZA O CÍRCULO MÁGICO DE INVOCAÇÃO 👇 */}
        <AnimatePresence>
          {summonVFX && (
            <SummonVFX
              key={summonVFX.id}
              x={summonVFX.x}
              y={summonVFX.y}
              color={summonVFX.color}
              soundType={summonVFX.soundType}
              onComplete={() => setSummonVFX(null)}
            />
          )}
        </AnimatePresence>

        {/* 👇 RENDERIZA O BANNER DE FASES (ESTILO ANIME) 👇 */}
        <AnimatePresence>
          {phaseBanner && (
            <PhaseBanner
              key={phaseBanner.id}
              text={phaseBanner.text}
              color={phaseBanner.color}
              onComplete={() => setPhaseBanner(null)}
            />
          )}
        </AnimatePresence>

        {/* 👇 RENDERIZA A TELA DE MULLIGAN 👇 */}
        <AnimatePresence>
          {state.isMulliganPhase && state.hand.length > 0 && (
            <MulliganScreen
              hand={state.hand}
              onStartShuffle={(keptIds) => {
                // 👈 AGORA RECEBE AS CARTAS QUE FICARAM
                setConfirmedMulliganIds(keptIds);
                startProfessionalShuffle();
              }}
              onConfirm={(swapIds) => actions.executeMulligan(swapIds)}
            />
          )}
        </AnimatePresence>

        {/* 👇 RENDERIZA A TELA DE GAME OVER (EPIC WIN/LOSE) 👇 */}
        <AnimatePresence>
          {winner && (
            <GameOverScreen
              winner={winner}
              onRestart={() => window.location.reload()}
            />
          )}
        </AnimatePresence>

        <BattleLogDrawer
          isOpen={showBattleLog}
          logs={state.battleLogs}
          onClose={() => setShowBattleLog(false)}
          onCardClick={(cardName) => {
            // 👇 MÁGICA: Busca a carta no banco de dados pelo nome e joga na tela da esquerda!
            const foundCard = cardDatabase.find((c) => c.name === cardName);
            if (foundCard) selectCardWithFlash(foundCard);
          }}
        />
      </main>
    </>
  );
}
