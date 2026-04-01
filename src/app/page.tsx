// src/app/page.tsx
"use client";

import { useState, useEffect } from "react";
import CardView from "../components/CardView";
import CardDetail from "../components/CardDetail";
import { Card } from "../types/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  isValidEquipTarget,
  getEffectiveStats,
  checkTriggers,
  checkMonsterSummonEffect,
  checkMonsterActivatedEffect,
  checkMonsterFlipEffect,
} from "../utils/rules";
import { useGameEngine } from "../hooks/useGameEngine";

interface GameLineProps {
  monsterId: string;
  targetId: string;
  isOpponent?: boolean;
  type?: "equip" | "attack";
}

const GameConnectionLine = ({
  monsterId,
  targetId,
  isOpponent,
  type = "equip",
}: GameLineProps) => {
  const [coords, setCoords] = useState({ x1: 0, y1: 0, x2: 0, y2: 0 });

  useEffect(() => {
    // Busca os elementos na mesa e calcula as coordenadas
    const monsterElement = document.getElementById(monsterId);
    const targetElement = document.getElementById(targetId);

    if (monsterElement && targetElement) {
      const monsterRect = monsterElement.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();

      setCoords({
        x1: targetRect.left + targetRect.width / 2, // Começa na Mágica ou no Alvo
        y1: targetRect.top + targetRect.height / 2,
        x2: monsterRect.left + monsterRect.width / 2, // Termina no Atacante
        y2: monsterRect.top + monsterRect.height / 2,
      });
    }
  }, [monsterId, targetId]);

  // 👇 LÓGICA DE COR: Vermelho para Ataque/Oponente, Ciano para Equipamento do Jogador
  let lineColor = isOpponent ? "#ef4444" : "#22d3ee";
  if (type === "attack") lineColor = "#ef4444"; // Ataque é sempre vermelho

  return (
    <svg
      className="fixed inset-0 z-[80] pointer-events-none"
      width="100%"
      height="100%"
    >
      <motion.line
        x1={coords.x1}
        y1={coords.y1}
        x2={coords.x2}
        y2={coords.y2}
        stroke={lineColor}
        strokeWidth={type === "attack" ? "5" : "3"} // 👇 Ataque é mais grosso e visível
        strokeDasharray={type === "attack" ? "10 5" : "5 5"} // 👇 Ataque tem tracejado maior
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.7 }}
        exit={{ pathLength: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{ filter: `drop-shadow(0 0 8px ${lineColor})` }} // 👇 Brilho intenso
      />
    </svg>
  );
};

export default function Home() {
  // === IMPORTANDO O MOTOR DE JOGO ===
  const { state, actions } = useGameEngine();
  const {
    playerLP,
    opponentLP,
    currentTurn,
    currentPlayer,
    currentPhase,
    hasSummonedThisTurn,
    attackedMonsters,
    hand,
    deck,
    monsterZone,
    spellZone,
    fieldSpell,
    graveyard,
    banished,
    opponentHand,
    opponentDeck,
    opponentMonsterZone,
    opponentSpellZone,
    opponentFieldSpell,
    opponentGraveyard,
    opponentBanished,
    equipLinks,
    pendingPrompt,
    pendingSelection,
    pendingDeckSearch,
    pendingDiscard,
    usedEffectsThisTurn,
    pendingSpecialSummon,
  } = state;

  const {
    setPlayerLP,
    setOpponentLP,
    setHasSummonedThisTurn,
    setAttackedMonsters,
    setHand,
    setDeck,
    setMonsterZone,
    setSpellZone,
    setFieldSpell,
    setGraveyard,
    setOpponentMonsterZone,
    setOpponentSpellZone,
    setOpponentGraveyard,
    setEquipLinks,
    nextPhase,
    drawCard,
    drawOpponentCard,
    getMonsterEquips,
    setPendingPrompt,
    setPendingSelection,
    setPendingDeckSearch,
    setPendingDiscard,
    setUsedEffectsThisTurn,
    setPendingSpecialSummon,
  } = actions;

  // === ESTADOS EXCLUSIVOS DA UI (Interface Visual) ===
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

  const [attackerInfo, setAttackerInfo] = useState<{
    card: Card;
    index: number;
  } | null>(null);
  const [attackTrajectory, setAttackTrajectory] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [attackingAnimId, setAttackingAnimId] = useState<string | null>(null);
  const [resolvingEffectId, setResolvingEffectId] = useState<string | null>(
    null,
  );
  const [pendingEquip, setPendingEquip] = useState<{
    spellCard: Card;
    spellIndex: number;
  } | null>(null);

  const selectCardWithFlash = (c: Card | null) => {
    setSelectedCard(c);
    if (c) setDetailsKey((prev) => prev + 1);
  };

  const handleEquipHover = (cardId: string, type: "monster" | "spell") => {
    if (activeEquipLine?.type === "attack" || pendingPrompt) return;
    const link = equipLinks.find((l) =>
      type === "spell" ? l.spellId === cardId : l.monsterId === cardId,
    );
    if (!link) return;

    let mId = "";
    const myMIdx = monsterZone.findIndex((m) => m?.id === link.monsterId);
    if (myMIdx !== -1) mId = `my-monster-${myMIdx}`;
    else {
      const oppMIdx = opponentMonsterZone.findIndex(
        (m) => m?.id === link.monsterId,
      );
      if (oppMIdx !== -1) mId = `opp-monster-${oppMIdx}`;
    }

    let sId = "";
    let isOpp = false;
    const mySIdx = spellZone.findIndex((s) => s?.id === link.spellId);
    if (mySIdx !== -1) {
      sId = `my-spell-${mySIdx}`;
      isOpp = false;
    } else {
      const oppSIdx = opponentSpellZone.findIndex(
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

  const isMonsterZoneFull = !monsterZone.some((slot) => slot === null);
  const isSpellZoneFull = !spellZone.some((slot) => slot === null);

  const canActivateEquip = (equipCard: Card) => {
    const allMonsters = [...monsterZone, ...opponentMonsterZone].filter(
      (c) => c !== null,
    ) as Card[];
    return allMonsters.some((m) => isValidEquipTarget(equipCard, m));
  };

  // 👁️ O OLHO MÁGICO VIGIA O CAMPO (Remove equipamentos se monstro morrer)
  useEffect(() => {
    const activeMonsterIds = [...monsterZone, ...opponentMonsterZone]
      .filter((c) => c !== null)
      .map((c) => c!.id);
    equipLinks.forEach((link) => {
      if (!activeMonsterIds.includes(link.monsterId)) {
        const spellIdx = spellZone.findIndex((s) => s?.id === link.spellId);
        if (spellIdx !== -1) {
          const deadSpell = spellZone[spellIdx]!;
          setSpellZone((prev) => {
            const nz = [...prev];
            nz[spellIdx] = null;
            return nz;
          });
          setGraveyard((prev) => [
            ...prev,
            { ...deadSpell, isFaceDown: false, cardPosition: "attack" },
          ]);
        }
        setEquipLinks((prev) => prev.filter((l) => l.spellId !== link.spellId));
      }
    });
  }, [
    monsterZone,
    opponentMonsterZone,
    equipLinks,
    spellZone,
    setSpellZone,
    setGraveyard,
    setEquipLinks,
  ]);

  // === ORQUESTRAÇÃO DE AÇÕES ===
  const handlePlayCard = (cardToPlay: Card, isFaceDown: boolean = false) => {
    if (currentPlayer !== "player") return alert("Não é o seu turno!");
    if (currentPhase !== "main")
      return alert(
        "Você só pode invocar/baixar cartas na Fase Principal (Main Phase)!",
      );
    if ("attack" in cardToPlay && hasSummonedThisTurn)
      return alert("Você só pode Invocar ou Baixar UM monstro por turno!");

    setActiveHandCardId(null);
    const finalIsFaceDown = cardToPlay.cardType === "Trap" ? true : isFaceDown;
    let position: "attack" | "defense" = "attack";
    if (finalIsFaceDown && "attack" in cardToPlay) position = "defense";

    const cardWithState = {
      ...cardToPlay,
      isFaceDown: finalIsFaceDown,
      cardPosition: position,
      turnSet: currentTurn,
    };

    if (cardWithState.cardType === "FieldSpell") {
      if (fieldSpell)
        setGraveyard((prev) => [
          ...prev,
          { ...fieldSpell, isFaceDown: false, cardPosition: "attack" },
        ]);
      setFieldSpell(cardWithState);
      setHand(hand.filter((c) => c.id !== cardToPlay.id));
    } else if (
      cardWithState.cardType === "Spell" ||
      cardWithState.cardType === "Trap" ||
      cardWithState.cardType === "EquipSpell"
    ) {
      const emptyIndex = spellZone.findIndex((slot) => slot === null);
      if (emptyIndex !== -1) {
        if (!finalIsFaceDown && cardWithState.cardType === "EquipSpell") {
          if (!canActivateEquip(cardWithState))
            return alert(
              "Não há alvos válidos no campo para este equipamento!",
            );
        }
        const newZone = [...spellZone];
        newZone[emptyIndex] = cardWithState;
        setSpellZone(newZone);
        setHand(hand.filter((c) => c.id !== cardToPlay.id));

        if (
          !finalIsFaceDown &&
          (cardWithState.cardType === "Spell" ||
            cardWithState.cardType === "EquipSpell")
        ) {
          handleActivateSpell(cardWithState, emptyIndex, newZone);
        }
      } else alert("Zona de Mágicas/Armadilhas está cheia!");
    } else {
      const emptyIndex = monsterZone.findIndex((slot) => slot === null);
      if (emptyIndex !== -1) {
        const newZone = [...monsterZone];
        newZone[emptyIndex] = cardWithState;
        setMonsterZone(newZone);
        setHand(hand.filter((c) => c.id !== cardToPlay.id));
        setHasSummonedThisTurn(true);

        // 🪤 O MOTOR VERIFICA AS ARMADILHAS PASSANDO OS CAMPOS!
        // 🪤 O MOTOR VERIFICA AS ARMADILHAS PASSANDO OS CAMPOS!
        // 1. CHECA AS ARMADILHAS INIMIGAS PRIMEIRO!
        const trapCheck = checkTriggers(
          "ON_SUMMON",
          cardWithState,
          monsterZone,
          opponentMonsterZone,
          opponentSpellZone,
          [fieldSpell, opponentFieldSpell],
        );

        // 2. EMPACOTA O EFEITO DO MONSTRO (Só roda depois da armadilha, se o monstro sobreviver)
        const resolveMonsterEffect = () => {
          const effect = checkMonsterSummonEffect(cardWithState);

          if (effect.hasEffect && effect.type === "SEARCH_DECK") {
            const validCards = deck.filter(effect.filter!);
            if (validCards.length > 0) {
              setPendingDeckSearch({
                validCards,
                message: effect.message!,
                onSelect: (selectedId) => {
                  const cardToAdd = deck.find((c) => c.id === selectedId)!;
                  setHand((prev) => [...prev, cardToAdd]); // Vai pra mão
                  setDeck((prev) =>
                    prev
                      .filter((c) => c.id !== selectedId)
                      .sort(() => Math.random() - 0.5),
                  ); // Remove do deck e embaralha
                  setPendingDeckSearch(null);
                },
                onCancel: () => setPendingDeckSearch(null),
              });
            }
          }
        };

        // 3. RESOLUÇÃO DA CORRENTE:
        if (trapCheck.triggered && trapCheck.effect) {
          setTimeout(() => {
            setPendingPrompt({
              message: trapCheck.effect!.message,
              onConfirm: () => {
                setOpponentSpellZone((prev) => {
                  const nz = [...prev];
                  nz[trapCheck.trapIndex!] = {
                    ...trapCheck.trapCard!,
                    isFaceDown: false,
                  };
                  return nz;
                });
                setTimeout(() => {
                  if (trapCheck.effect!.destroyTriggeringCard) {
                    setMonsterZone((prev) => {
                      const nz = [...prev];
                      nz[emptyIndex] = null;
                      return nz;
                    });
                    setGraveyard((prev) => [
                      ...prev,
                      {
                        ...cardWithState,
                        isFaceDown: false,
                        cardPosition: "attack",
                      },
                    ]);
                  } else {
                    resolveMonsterEffect(); // Se a armadilha não destruiu o monstro, ativa o efeito!
                  }

                  if (trapCheck.effect!.destroyTrap) {
                    setOpponentSpellZone((prev) => {
                      const nz = [...prev];
                      nz[trapCheck.trapIndex!] = null;
                      return nz;
                    });
                    setOpponentGraveyard((prev) => [
                      ...prev,
                      {
                        ...trapCheck.trapCard!,
                        isFaceDown: false,
                        cardPosition: "attack",
                      },
                    ]);
                  }
                  setPendingPrompt(null);
                }, 1500);
              },
              onCancel: () => {
                setPendingPrompt(null);
                resolveMonsterEffect(); // Inimigo ignorou a armadilha, ativa o efeito!
              },
            });
          }, 400);
        } else {
          resolveMonsterEffect(); // Sem armadilhas, vai direto pro efeito!
        }
      } else alert("Zona de Monstros cheia!");
    }
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
    setGraveyard([...graveyard, resetCard]);
    if (zone === "monster") {
      const newZone = [...monsterZone];
      newZone[index] = null;
      setMonsterZone(newZone);
    } else if (zone === "spell") {
      const newZone = [...spellZone];
      newZone[index] = null;
      setSpellZone(newZone);
    } else if (zone === "field") {
      setFieldSpell(null);
    }
    setActiveFieldCardId(null);
    selectCardWithFlash(null);
  };

  const handleEquipToMonster = (
    targetCard: Card,
    targetIndex: number,
    isOpponent: boolean,
  ) => {
    if (!pendingEquip) return;
    if (!("attack" in targetCard)) return;
    if (!isValidEquipTarget(pendingEquip.spellCard, targetCard)) return;

    setEquipLinks((prev) => [
      ...prev,
      { spellId: pendingEquip!.spellCard.id, monsterId: targetCard.id },
    ]);
    setPendingEquip(null);
  };

  const handleActivateSpell = (
    spellCard: Card,
    spellIndex: number,
    currentSpellZone?: (Card | null)[],
  ) => {
    if (resolvingEffectId || attackingAnimId) return;
    if (currentPhase === "draw")
      return alert("Não é permitido ativar efeitos durante a Fase de Compra!");
    if (spellCard.cardType !== "Trap" && currentPlayer !== "player")
      return alert(
        "Você só pode ativar Cartas Mágicas durante o seu próprio turno!",
      );

    setResolvingEffectId(spellCard.id);

    // Vira a carta ativada para cima
    if (spellCard.isFaceDown) {
      const zoneToUpdate = currentSpellZone || spellZone;
      const newZone = [...zoneToUpdate];
      newZone[spellIndex] = { ...spellCard, isFaceDown: false };
      setSpellZone(newZone);
    }

    if (spellCard.cardType === "EquipSpell") {
      if (!canActivateEquip(spellCard)) {
        alert("Não há alvos válidos para equipar!");
        setResolvingEffectId(null);
        setActiveFieldCardId(null);
        return;
      }
      setPendingEquip({ spellCard, spellIndex });
      setResolvingEffectId(null);
      setActiveFieldCardId(null);
      return;
    }

    // 📦 EMPACOTAMENTO DA AÇÃO: O que a carta faz se ninguém impedir?
    const resolveSpellEffect = async () => {
      if (spellCard.cardType === "Trap") {
        setTimeout(() => {
          setSpellZone((prev) => {
            const nz = [...prev];
            nz[spellIndex] = null;
            return nz;
          });
          setGraveyard((prev) => [
            ...prev,
            { ...spellCard, isFaceDown: false, cardPosition: "attack" },
          ]);
          setResolvingEffectId(null);
          setActiveFieldCardId(null);
        }, 1500);
        return;
      }

      setTimeout(async () => {
        if (spellCard.name === "Buraco Negro Dimensional") {
          const myTargets = monsterZone
            .map((c, i) => ({ card: c, index: i, owner: "me" }))
            .filter((t) => t.card !== null);
          const oppTargets = opponentMonsterZone
            .map((c, i) => ({ card: c, index: i, owner: "opp" }))
            .filter((t) => t.card !== null);
          const allTargets = [...myTargets, ...oppTargets];

          for (let i = 0; i < allTargets.length; i++) {
            const target = allTargets[i];
            if (target.owner === "opp") {
              setOpponentMonsterZone((prev) => {
                const nz = [...prev];
                nz[target.index] = null;
                return nz;
              });
              setOpponentGraveyard((prev) => [
                ...prev,
                { ...target.card!, isFaceDown: false, cardPosition: "attack" },
              ]);
            } else {
              setMonsterZone((prev) => {
                const nz = [...prev];
                nz[target.index] = null;
                return nz;
              });
              setGraveyard((prev) => [
                ...prev,
                { ...target.card!, isFaceDown: false, cardPosition: "attack" },
              ]);
            }
            await new Promise((resolve) => setTimeout(resolve, 80));
          }

          setSpellZone((prev) => {
            const nz = [...prev];
            nz[spellIndex] = null;
            return nz;
          });
          setGraveyard((prev) => [
            ...prev,
            { ...spellCard, isFaceDown: false, cardPosition: "attack" },
          ]);
        }
        setResolvingEffectId(null);
        setActiveFieldCardId(null);
      }, 1500);
    };

    // 🪤 ANTES DE RESOLVER, O JOGO ESCUTA AS CORRENTES!
    // 🪤 ANTES DE RESOLVER, O JOGO ESCUTA AS CORRENTES!
    const eventType =
      spellCard.cardType === "Trap"
        ? "ON_TRAP_ACTIVATION"
        : "ON_SPELL_ACTIVATION";
    const trapCheck = checkTriggers(
      eventType,
      spellCard,
      monsterZone, // 👇 1. Adicionado: Sua zona de monstros
      opponentMonsterZone, // 👇 2. Adicionado: Zona de monstros inimiga
      opponentSpellZone,
      [fieldSpell, opponentFieldSpell],
    );

    if (trapCheck.triggered && trapCheck.effect) {
      setTimeout(() => {
        setPendingPrompt({
          message: trapCheck.effect!.message,
          onConfirm: () => {
            // Vira a armadilha inimiga (Oponente aceitou ativar)
            setOpponentSpellZone((prev) => {
              const nz = [...prev];
              nz[trapCheck.trapIndex!] = {
                ...trapCheck.trapCard!,
                isFaceDown: false,
              };
              return nz;
            });

            setTimeout(() => {
              if (trapCheck.effect!.negateActivation) {
                // ANULADO! A Mágica falha miseravelmente e vai para o cemitério!
                setSpellZone((prev) => {
                  const nz = [...prev];
                  nz[spellIndex] = null;
                  return nz;
                });
                setGraveyard((prev) => [
                  ...prev,
                  { ...spellCard, isFaceDown: false, cardPosition: "attack" },
                ]);
                setResolvingEffectId(null);
                setActiveFieldCardId(null);
              } else {
                resolveSpellEffect(); // Armadilha não anulou, a Mágica segue!
              }

              if (trapCheck.effect!.destroyTrap) {
                setOpponentSpellZone((prev) => {
                  const nz = [...prev];
                  nz[trapCheck.trapIndex!] = null;
                  return nz;
                });
                setOpponentGraveyard((prev) => [
                  ...prev,
                  {
                    ...trapCheck.trapCard!,
                    isFaceDown: false,
                    cardPosition: "attack",
                  },
                ]);
              }
              setPendingPrompt(null);
            }, 1500);
          },
          onCancel: () => {
            setPendingPrompt(null);
            resolveSpellEffect(); // Inimigo ignorou, a Mágica segue!
          },
        });
      }, 400); // Pequeno delay pro jogador ver a mágica ativada
    } else {
      resolveSpellEffect(); // Nenhuma armadilha, a Mágica segue!
    }
  };

  const handleAttackMonster = (targetCard: Card, targetIndex: number) => {
    if (currentPlayer !== "player") return alert("Não é o seu turno!");
    if (currentPhase !== "battle")
      return alert("Você só pode atacar na Fase de Batalha!");
    if (!attackerInfo || attackingAnimId) return;
    if (pendingPrompt || pendingSelection) return; // Trava de segurança

    // 👇 1. A LINHA VERMELHA NASCE AGORA! E o monstro fica PARADO.
    setActiveEquipLine({
      monsterId: `opp-monster-${targetIndex}`, // Alvo
      targetId: `my-monster-${attackerInfo.index}`, // Atacante
      isOpponent: true,
      type: "attack",
    });

    // 📦 EMPACOTAMENTO DA ANIMAÇÃO E COMBATE (Só roda se a armadilha não for ativada)
    const executeCombat = () => {
      // SÓ AGORA A ANIMAÇÃO COMEÇA!
      const attackerEl = document.getElementById(
        `my-monster-${attackerInfo.index}`,
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

      setAttackTrajectory({ x: xOffset, y: yOffset });
      setAttackingAnimId(attackerInfo.card.id);
      setAttackedMonsters((prev) => [...prev, attackerInfo.card.id]);

      // Vira a carta atacada se estiver para baixo
      if (targetCard.isFaceDown) {
        setOpponentMonsterZone((prev) => {
          const nz = [...prev];
          if (nz[targetIndex])
            nz[targetIndex] = { ...nz[targetIndex]!, isFaceDown: false };
          return nz;
        });
      }

      // Calcula o dano depois da animação
      setTimeout(() => {
        const myStats = getEffectiveStats(
          attackerInfo.card,
          [fieldSpell, opponentFieldSpell],
          getMonsterEquips(attackerInfo.card.id),
        );
        const myAtk = myStats
          ? myStats.attack
          : "attack" in attackerInfo.card
            ? attackerInfo.card.attack
            : 0;

        const oppStats = getEffectiveStats(
          targetCard,
          [fieldSpell, opponentFieldSpell],
          getMonsterEquips(targetCard.id),
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
            setOpponentLP((prev) => prev - (myAtk - oppAtk));
            setOpponentMonsterZone((prev) => {
              const nz = [...prev];
              nz[targetIndex] = null;
              return nz;
            });
            setOpponentGraveyard((prev) => [
              ...prev,
              cleanCardForGy(targetCard),
            ]);
          } else if (myAtk < oppAtk) {
            setPlayerLP((prev) => prev - (oppAtk - myAtk));
            setMonsterZone((prev) => {
              const nz = [...prev];
              nz[attackerInfo.index] = null;
              return nz;
            });
            setGraveyard((prev) => [
              ...prev,
              cleanCardForGy(attackerInfo.card),
            ]);
          } else {
            setOpponentMonsterZone((prev) => {
              const nz = [...prev];
              nz[targetIndex] = null;
              return nz;
            });
            setOpponentGraveyard((prev) => [
              ...prev,
              cleanCardForGy(targetCard),
            ]);
            setMonsterZone((prev) => {
              const nz = [...prev];
              nz[attackerInfo.index] = null;
              return nz;
            });
            setGraveyard((prev) => [
              ...prev,
              cleanCardForGy(attackerInfo.card),
            ]);
          }
        } else {
          if (myAtk > oppDef) {
            setOpponentMonsterZone((prev) => {
              const nz = [...prev];
              nz[targetIndex] = null;
              return nz;
            });
            setOpponentGraveyard((prev) => [
              ...prev,
              cleanCardForGy(targetCard),
            ]);
          } else if (myAtk < oppDef) {
            setPlayerLP((prev) => prev - (oppDef - myAtk));
          }
        }

        // Fim do Combate: Limpa a linha vermelha e os status de ataque
        setAttackingAnimId(null);
        setAttackTrajectory(null);
        setAttackerInfo(null);
        setActiveEquipLine(null);
      }, 500);
    };

    // 🪤 ANTES DA ANIMAÇÃO, O JOGO ESCUTA AS CORRENTES!
    const trapCheck = checkTriggers(
      "ON_ATTACK",
      attackerInfo.card,
      monsterZone,
      opponentMonsterZone,
      opponentSpellZone,
      [fieldSpell, opponentFieldSpell],
    );

    if (trapCheck.triggered && trapCheck.effect) {
      // Dá um tempinho mínimo (400ms) só pra linha vermelha piscar antes do prompt abrir
      setTimeout(() => {
        setPendingPrompt({
          message: trapCheck.effect!.message,
          onConfirm: () => {
            // SE SIM: Vira a armadilha do oponente para cima
            setOpponentSpellZone((prev) => {
              const nz = [...prev];
              nz[trapCheck.trapIndex!] = {
                ...trapCheck.trapCard!,
                isFaceDown: false,
              };
              return nz;
            });
            setPendingPrompt(null); // Fecha a caixinha de pergunta

            // 👇 NOVA LÓGICA: Verifica se precisa escolher um sacrifício (Kamikaze) ou se resolve automático
            if ((trapCheck.effect as any).requiresSelfMonsterDestruction) {
              // 1. Acha todos os Soldados válidos na mesa do oponente
              const validSoldiers = opponentMonsterZone
                .filter(
                  (m) =>
                    m !== null &&
                    !m.isFaceDown &&
                    "race" in m &&
                    m.race === "Soldado",
                )
                .map((m) => m!.id);

              // 2. Abre a tela de seleção (Os monstros vão brilhar verde na mesa!)
              setPendingSelection({
                message: "Selecione um Soldado seu para sacrificar!",
                validTargetIds: validSoldiers,
                onSelect: (selectedId) => {
                  // QUANDO CLICAR NO MONSTRO VERDE:

                  // A. Destrói o soldado escolhido pelo clique
                  setOpponentMonsterZone((prev) => {
                    const nz = [...prev];
                    const sIdx = nz.findIndex((m) => m?.id === selectedId);
                    if (sIdx !== -1) {
                      const dead = nz[sIdx]!;
                      nz[sIdx] = null;
                      setOpponentGraveyard((gy) => [
                        ...gy,
                        { ...dead, isFaceDown: false, cardPosition: "attack" },
                      ]);
                    }
                    return nz;
                  });

                  // B. Destrói a armadilha (pois já cumpriu seu efeito)
                  setOpponentSpellZone((prev) => {
                    const nz = [...prev];
                    nz[trapCheck.trapIndex!] = null;
                    return nz;
                  });
                  setOpponentGraveyard((prev) => [
                    ...prev,
                    {
                      ...trapCheck.trapCard!,
                      isFaceDown: false,
                      cardPosition: "attack",
                    },
                  ]);

                  // C. Destrói o Monstro Atacante (Seu)
                  setMonsterZone((prev) => {
                    const nz = [...prev];
                    nz[attackerInfo.index] = null;
                    return nz;
                  });
                  setGraveyard((prev) => [
                    ...prev,
                    {
                      ...attackerInfo.card,
                      isFaceDown: false,
                      cardPosition: "attack",
                    },
                  ]);

                  // Limpa a UI (incluindo a linha vermelha e o modo de seleção)
                  setAttackingAnimId(null);
                  setAttackTrajectory(null);
                  setAttackerInfo(null);
                  setActiveEquipLine(null);
                  setPendingSelection(null);
                },
                onCancel: () => {
                  setPendingSelection(null);
                  executeCombat(); // Se cancelar, o combate continua
                },
              });
            } else {
              // 👇 SE NÃO FOR KAMIKAZE: Dá 1 segundo para armadilhas genéricas resolverem sozinhas
              setTimeout(() => {
                // 1. Destrói a armadilha
                if ((trapCheck.effect as any).destroyTrap) {
                  setOpponentSpellZone((prev) => {
                    const nz = [...prev];
                    nz[trapCheck.trapIndex!] = null;
                    return nz;
                  });
                  setOpponentGraveyard((prev) => [
                    ...prev,
                    {
                      ...trapCheck.trapCard!,
                      isFaceDown: false,
                      cardPosition: "attack",
                    },
                  ]);
                }

                // 2. Destrói o Monstro Atacante (Seu)
                if ((trapCheck.effect as any).negateActivation) {
                  setMonsterZone((prev) => {
                    const nz = [...prev];
                    nz[attackerInfo.index] = null;
                    return nz;
                  });
                  setGraveyard((prev) => [
                    ...prev,
                    {
                      ...attackerInfo.card,
                      isFaceDown: false,
                      cardPosition: "attack",
                    },
                  ]);
                  setAttackingAnimId(null);
                  setAttackTrajectory(null);
                  setAttackerInfo(null);
                  setActiveEquipLine(null);
                }
              }, 1000);
            }
          },
          onCancel: () => {
            // SE NÃO: Fecha o prompt e chama a função executeCombat que faz o monstro voar
            setPendingPrompt(null);
            executeCombat();
          },
        });
      }, 400);
    } else {
      // Se não tem armadilha, vai direto pro combate!
      executeCombat();
    }
  };

  const handleDirectAttack = () => {
    if (!attackerInfo || attackingAnimId) return;
    if (currentPlayer !== "player") return alert("Não é o seu turno!");
    if (currentPhase !== "battle")
      return alert("Você só pode atacar na Fase de Batalha (Battle Phase)!");
    if (pendingPrompt || pendingSelection) return;
    if (opponentMonsterZone.some((slot) => slot !== null)) {
      alert(
        "Você não pode atacar diretamente se o oponente tem monstros no campo!",
      );
      setAttackerInfo(null);
      return;
    }

    const attackerEl = document.getElementById(
      `my-monster-${attackerInfo.index}`,
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

    setAttackTrajectory({ x: xOffset, y: yOffset });
    setAttackingAnimId(attackerInfo.card.id);
    setAttackedMonsters((prev) => [...prev, attackerInfo.card.id]);

    setTimeout(() => {
      const myStats = getEffectiveStats(
        attackerInfo.card,
        [fieldSpell, opponentFieldSpell],
        getMonsterEquips(attackerInfo.card.id),
      );
      const myAtk = myStats
        ? myStats.attack
        : "attack" in attackerInfo.card
          ? attackerInfo.card.attack
          : 0;
      setOpponentLP((prev) => prev - myAtk);
      setAttackingAnimId(null);
      setAttackTrajectory(null);
      setAttackerInfo(null);
    }, 500);
  };

  return (
    <main
      onClick={() => {
        if (pendingEquip)
          return alert(
            "Selecione um alvo válido (iluminado em amarelo) para equipar a carta!",
          );
        setActiveHandCardId(null);
        setActiveFieldCardId(null);
      }}
      className="h-screen w-screen flex bg-gray-950 overflow-hidden font-sans text-white"
    >
      {/* 1. PAINEL LATERAL ESQUERDO */}
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
            activeFieldSpells={[fieldSpell, opponentFieldSpell]}
            equipments={selectedCard ? getMonsterEquips(selectedCard.id) : []}
          />
        </div>
      </div>

      {/* 2. TABULEIRO PRINCIPAL */}
      <div className="flex-1 h-full relative flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-gray-900 to-black">
        {/* === HUD OPONENTE === */}
        <div className="absolute top-6 left-6 z-20 pointer-events-none">
          <div
            id="opp-lp-hud"
            onClick={(e) => {
              e.stopPropagation();
              if (pendingEquip)
                return alert("Selecione um alvo válido para o equipamento!");
              if (attackerInfo) handleDirectAttack();
            }}
            className={`bg-red-950/80 border-2 rounded-lg py-2 px-6 flex gap-4 items-center shadow-lg transition-all ${
              attackerInfo && !opponentMonsterZone.some((c) => c !== null)
                ? "border-red-500 scale-110 cursor-crosshair pointer-events-auto animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.8)]"
                : "border-red-900 pointer-events-auto"
            }`}
          >
            <span className="text-red-400 font-bold uppercase tracking-widest text-sm">
              Oponente
            </span>
            <span className="text-3xl font-black text-red-500 font-mono drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
              {opponentLP}
            </span>
          </div>
        </div>

        {/* Mão do Oponente */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex justify-center -space-x-8 scale-[0.60] z-10">
          {opponentHand.length === 0 && (
            <span className="text-gray-500 italic mt-12 text-lg">
              Deck Oponente para simular
            </span>
          )}
          {opponentHand.map((card) => (
            <CardView
              key={`opp-hand-${card.id}`}
              card={{ ...card, isFaceDown: true }}
              disableDrag={true}
              isOpponent={true}
            />
          ))}
        </div>

        {/* === PLAYMAT === */}
        <div className="scale-[0.80] 2xl:scale-95 origin-center flex flex-col gap-3 rounded-xl p-4">
          {/* LINHA 1: OPONENTE */}
          <div className="flex gap-8 justify-center">
            <div
              onClick={() => {
                if (!pendingEquip) drawOpponentCard();
              }}
              className={`w-[100px] h-[145px] border-4 rounded-sm bg-red-900 bg-[repeating-linear-gradient(-45deg,transparent,transparent_10px,rgba(0,0,0,0.3)_10px,rgba(0,0,0,0.3)_20px)] flex flex-col items-center justify-center shadow-xl cursor-pointer transition-transform ${
                currentPhase === "draw" && currentPlayer === "opponent"
                  ? "border-yellow-400 animate-pulse scale-105 shadow-[0_0_20px_rgba(250,204,21,0.6)]"
                  : "border-gray-600 hover:border-gray-400"
              }`}
            >
              <span className="text-red-300/50 font-bold text-[10px]">
                DECK ({opponentDeck.length})
              </span>
            </div>
            <div className="flex gap-6">
              {opponentSpellZone.map((c, i) => (
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

          {/* LINHA 2: OPONENTE */}
          <div className="flex gap-8 justify-center">
            <div className="flex flex-col gap-2 w-[100px] items-center">
              <span className="text-red-500/80 text-[10px] font-bold text-center">
                BANIDAS: {opponentBanished.length}
              </span>
              <div
                onClick={() => {
                  if (pendingEquip)
                    return alert(
                      "Conclua o Equipamento antes de olhar os cemitérios!",
                    );
                  opponentGraveyard.length > 0 &&
                    setShowOpponentGraveyardModal(true);
                }}
                className="relative w-[100px] h-[145px] border-2 border-solid border-gray-700 rounded-sm bg-gray-800 flex flex-col items-center justify-center shadow-inner cursor-pointer hover:border-gray-500 transition-colors"
              >
                {opponentGraveyard.length === 0 ? (
                  <>
                    <span className="text-gray-500 text-[10px] font-bold">
                      CEMITÉRIO
                    </span>
                    <span className="text-red-500/80 text-xs mt-1">0</span>
                  </>
                ) : (
                  <div className="absolute top-0 left-0 z-10 w-full h-full">
                    <CardView
                      card={opponentGraveyard[opponentGraveyard.length - 1]}
                      disableDrag={true}
                      onClick={selectCardWithFlash}
                    />
                    <div className="absolute -bottom-3 right-0 bg-red-950 text-white text-[10px] font-bold px-2 py-1 rounded-full border border-red-700 z-50">
                      {opponentGraveyard.length}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-center gap-4">
              {opponentMonsterZone.map((cardInZone, index) => {
                const isDirectAttackTarget =
                  attackerInfo &&
                  !cardInZone &&
                  !opponentMonsterZone.some((c) => c !== null);
                const isEquipTarget =
                  pendingEquip &&
                  isValidEquipTarget(pendingEquip.spellCard, cardInZone);
                const isSelectableTarget =
                  pendingSelection?.validTargetIds.includes(
                    cardInZone?.id || "",
                  );

                return (
                  <div
                    key={`opp-monster-${index}`}
                    id={`opp-monster-${index}`}
                    className={`w-[100px] h-[145px] border-2 border-dashed rounded-sm flex items-center justify-center relative ${
                      isSelectableTarget
                        ? "z-[9999] border-emerald-400 bg-emerald-500/30 cursor-pointer animate-pulse shadow-[0_0_20px_rgba(52,211,153,0.8)]" // 👇 BRILHO VERDE AQUI
                        : isEquipTarget
                          ? "z-[9999] border-yellow-400 bg-yellow-400/20 cursor-crosshair animate-pulse shadow-[0_0_15px_rgba(250,204,21,0.5)]"
                          : attackerInfo && cardInZone
                            ? "z-[9999] border-red-500/80 bg-red-500/20 cursor-crosshair animate-pulse"
                            : isDirectAttackTarget
                              ? "z-[9999] border-red-500/80 bg-red-500/20 cursor-crosshair animate-pulse"
                              : "border-red-500/30 bg-red-500/5"
                    }`}
                    onMouseEnter={() => {
                      if (cardInZone)
                        handleEquipHover(cardInZone.id, "monster");
                    }}
                    onMouseLeave={() =>
                      setActiveEquipLine((prev) =>
                        prev?.type === "attack" ? prev : null,
                      )
                    }
                    onClick={(e) => {
                      e.stopPropagation();

                      // 👇 TRAVA ABSOLUTA 1: O jogo está pausado pela Corrente!
                      if (pendingPrompt) return;

                      // 👇 TRAVA ABSOLUTA 2: O jogo está pedindo para escolher um sacrifício!
                      if (pendingSelection) {
                        if (isSelectableTarget && cardInZone) {
                          pendingSelection.onSelect(cardInZone.id);
                        } else {
                          // Se clicar em um monstro que não é alvo, ele bloqueia!
                          alert(
                            "Selecione um alvo válido brilhando em verde na mesa!",
                          );
                        }
                        return; // 🛑 Impede que o clique passe para a função de Ataque
                      }

                      // === FLUXO NORMAL DE JOGO SE NÃO TIVER NADA PENDENTE ===
                      if (pendingEquip) {
                        if (isEquipTarget && cardInZone)
                          handleEquipToMonster(cardInZone, index, true);
                        else
                          alert(
                            "Este monstro não é um alvo válido para o equipamento!",
                          );
                        return;
                      }
                      if (attackerInfo && cardInZone)
                        handleAttackMonster(cardInZone, index);
                      else if (isDirectAttackTarget) handleDirectAttack();
                      else if (cardInZone) setSelectedCard(cardInZone);
                    }}
                  >
                    {!cardInZone ? (
                      <span className="text-red-500/30 text-[10px] font-bold">
                        MONSTRO
                      </span>
                    ) : (
                      <div className="absolute top-0 left-0 w-full h-full cursor-pointer">
                        <CardView
                          card={cardInZone}
                          isOpponent={true}
                          activeFieldSpells={[fieldSpell, opponentFieldSpell]}
                          equipments={getMonsterEquips(cardInZone.id)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div
              className="w-[100px] h-[145px] mt-6 border-2 border-dashed border-red-400/30 bg-red-500/5 rounded-sm flex flex-col items-center justify-center relative"
              onClick={(e) => {
                e.stopPropagation();
                if (opponentFieldSpell) selectCardWithFlash(opponentFieldSpell);
              }}
            >
              {!opponentFieldSpell ? (
                <span className="text-red-500/40 text-[10px] font-bold text-center">
                  MAGIA DE
                  <br />
                  CAMPO
                </span>
              ) : (
                <div className="absolute top-0 left-0 w-full h-full cursor-pointer">
                  <CardView card={opponentFieldSpell} isOpponent={true} />
                </div>
              )}
            </div>
          </div>

          <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent my-2 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>

          {/* LINHA 3: JOGADOR 1 */}
          <div className="flex gap-8 justify-center">
            <div className="w-[100px] h-[145px] mt-6 border-2 border-dashed border-emerald-400/50 bg-emerald-500/10 rounded-sm flex flex-col items-center justify-center relative">
              {!fieldSpell && (
                <span className="text-emerald-500/50 text-[10px] font-bold text-center">
                  CAMPO
                </span>
              )}
              {fieldSpell && (
                <div
                  key={`field-${fieldSpell.id}`}
                  className="absolute inset-0 z-10 flex items-center justify-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  {activeFieldCardId === fieldSpell.id && (
                    <div className="absolute -top-[50px] left-1/2 -translate-x-1/2 flex gap-2 bg-gray-800 border-2 border-gray-600 p-2 rounded-lg z-50 shadow-2xl">
                      <button
                        onClick={() =>
                          handleSendToGraveyard(fieldSpell, "field")
                        }
                        className="bg-red-900 hover:bg-red-800 p-1 px-2 rounded text-[10px] text-white font-bold transition"
                      >
                        Cemitério
                      </button>
                    </div>
                  )}
                  <CardView
                    card={fieldSpell}
                    onClick={(c) => {
                      if (pendingEquip)
                        return alert("Selecione o alvo do equipamento!");
                      selectCardWithFlash(c);
                      setActiveFieldCardId(c.id);
                      setActiveHandCardId(null);
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-6">
              {monsterZone.map((cardInZone, index) => {
                const isEquipTarget =
                  pendingEquip &&
                  isValidEquipTarget(pendingEquip.spellCard, cardInZone);
                return (
                  <div
                    key={`p-m-${index}`}
                    id={`my-monster-${index}`}
                    className={`w-[100px] h-[145px] border-2 border-dashed rounded-sm flex items-center justify-center relative ${
                      isEquipTarget
                        ? "z-[9999] border-yellow-400 bg-yellow-400/20 cursor-crosshair animate-pulse shadow-[0_0_15px_rgba(250,204,21,0.5)]"
                        : "border-blue-500/40 bg-blue-500/10"
                    }`}
                    onMouseEnter={() => {
                      if (cardInZone)
                        handleEquipHover(cardInZone.id, "monster");
                    }}
                    onMouseLeave={() =>
                      setActiveEquipLine((prev) =>
                        prev?.type === "attack" ? prev : null,
                      )
                    }
                  >
                    {!cardInZone ? (
                      <span className="text-blue-500/50 text-[10px] font-bold">
                        MONSTRO
                      </span>
                    ) : (
                      <div
                        className="absolute top-0 left-0 z-10 flex items-center justify-center w-full h-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (pendingEquip) {
                            if (isEquipTarget && cardInZone)
                              handleEquipToMonster(cardInZone, index, false);
                            else
                              alert(
                                "Este monstro não é um alvo válido para o equipamento!",
                              );
                            return;
                          }
                        }}
                      >
                        {attackerInfo?.card.id === cardInZone.id && (
                          <div className="absolute inset-0 border-4 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,1)] rounded z-0 animate-pulse pointer-events-none"></div>
                        )}

                        {activeFieldCardId === cardInZone.id && (
                          <div className="absolute -top-[50px] left-1/2 transform -translate-x-1/2 flex gap-2 bg-gray-800 border-2 border-gray-600 p-2 rounded-lg z-50 shadow-2xl">
                            {cardInZone.isFaceDown &&
                              currentPhase === "main" &&
                              currentPlayer === "player" &&
                              cardInZone.turnSet !== undefined &&
                              currentTurn > cardInZone.turnSet && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // 1. Vira a carta normalmente
                                    setMonsterZone((prev) => {
                                      const nz = [...prev];
                                      nz[index] = {
                                        ...nz[index]!,
                                        isFaceDown: false,
                                        cardPosition: "attack",
                                      };
                                      return nz;
                                    });
                                    setActiveFieldCardId(null);

                                    // 2. Verifica se ativa o Efeito Flip
                                    const flipEffect = checkMonsterFlipEffect(
                                      cardInZone,
                                      [fieldSpell, opponentFieldSpell],
                                      isMonsterZoneFull,
                                      hand,
                                      graveyard,
                                    );

                                    if (flipEffect.hasEffect) {
                                      setPendingSpecialSummon({
                                        message: flipEffect.message!,
                                        validCards: flipEffect.targets!,
                                        onSelect: (selectedCard) => {
                                          const emptyIdx =
                                            monsterZone.findIndex(
                                              (s) => s === null,
                                            );
                                          if (emptyIdx !== -1) {
                                            setHand((prev) =>
                                              prev.filter(
                                                (c) => c.id !== selectedCard.id,
                                              ),
                                            );
                                            setGraveyard((prev) =>
                                              prev.filter(
                                                (c) => c.id !== selectedCard.id,
                                              ),
                                            );
                                            setMonsterZone((prev) => {
                                              const nz = [...prev];
                                              nz[emptyIdx] = {
                                                ...selectedCard,
                                                isFaceDown: false,
                                                cardPosition: "attack",
                                              };
                                              return nz;
                                            });
                                          }
                                          setPendingSpecialSummon(null);
                                        },
                                        onCancel: () =>
                                          setPendingSpecialSummon(null),
                                      });
                                    }
                                  }}
                                  className="bg-blue-600 hover:bg-blue-500 p-1 px-2 rounded text-[10px] text-white font-bold transition"
                                >
                                  Virar
                                </button>
                              )}
                            {cardInZone.cardPosition === "attack" &&
                              !cardInZone.isFaceDown &&
                              currentPhase === "battle" &&
                              currentPlayer === "player" &&
                              !attackedMonsters.includes(cardInZone.id) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAttackerInfo({
                                      card: cardInZone,
                                      index,
                                    });
                                    setActiveFieldCardId(null);
                                  }}
                                  className="bg-orange-600 hover:bg-orange-500 p-1 px-2 rounded text-[10px] text-white font-bold transition"
                                >
                                  Atacar
                                </button>
                              )}
                            {/* 👇 BOTÃO DE ATIVAR EFEITO (CAVADOR) */}
                            {!cardInZone.isFaceDown &&
                              currentPhase === "main" &&
                              currentPlayer === "player" &&
                              !usedEffectsThisTurn.includes(cardInZone.id) &&
                              checkMonsterActivatedEffect(
                                cardInZone,
                                hand.length,
                              ).canActivate && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setUsedEffectsThisTurn((prev) => [
                                      ...prev,
                                      cardInZone.id,
                                    ]);
                                    const effect = checkMonsterActivatedEffect(
                                      cardInZone,
                                      hand.length,
                                    );
                                    setPendingDiscard({
                                      message: effect.message!,
                                      onDiscard: (discardId) => {
                                        // 1. Joga a carta escolhida pro cemitério
                                        const cardToDiscard = hand.find(
                                          (c) => c.id === discardId,
                                        )!;
                                        setHand((prev) =>
                                          prev.filter(
                                            (c) => c.id !== discardId,
                                          ),
                                        );
                                        setGraveyard((prev) => [
                                          ...prev,
                                          {
                                            ...cardToDiscard,
                                            isFaceDown: false,
                                          },
                                        ]);
                                        setPendingDiscard(null);

                                        // 2. Abre a busca no deck (reutilizando o que fizemos no Batedor)
                                        const validCards = deck.filter(
                                          effect.filter!,
                                        );
                                        setPendingDeckSearch({
                                          message:
                                            "Escolha o seu reforço (Efeito Cavador):",
                                          validCards,
                                          onSelect: (searchId) => {
                                            const found = deck.find(
                                              (c) => c.id === searchId,
                                            )!;
                                            setHand((prev) => [...prev, found]);
                                            setDeck((prev) =>
                                              prev
                                                .filter(
                                                  (c) => c.id !== searchId,
                                                )
                                                .sort(
                                                  () => Math.random() - 0.5,
                                                ),
                                            );
                                            setPendingDeckSearch(null);
                                          },
                                          onCancel: () =>
                                            setPendingDeckSearch(null),
                                        });
                                      },
                                    });
                                    setActiveFieldCardId(null);
                                  }}
                                  className="bg-purple-600 hover:bg-purple-500 p-1 px-2 rounded text-[10px] text-white font-bold transition"
                                >
                                  Efeito
                                </button>
                              )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendToGraveyard(
                                  cardInZone,
                                  "monster",
                                  index,
                                );
                              }}
                              className="bg-red-900 hover:bg-red-800 p-1 px-2 rounded text-[10px] text-white font-bold transition"
                            >
                              Cemitério
                            </button>
                          </div>
                        )}
                        <div className="z-10">
                          <CardView
                            card={cardInZone}
                            activeFieldSpells={[fieldSpell, opponentFieldSpell]}
                            equipments={getMonsterEquips(cardInZone.id)}
                            isAttacking={attackingAnimId === cardInZone.id}
                            attackTrajectory={
                              attackingAnimId === cardInZone.id
                                ? attackTrajectory
                                : null
                            }
                            onClick={(c) => {
                              selectCardWithFlash(c);
                              setActiveFieldCardId(c.id);
                              setActiveHandCardId(null);
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-2 w-[100px] items-center">
              <span className="text-gray-400 text-[10px] font-bold text-center">
                BANIDAS: {banished.length}
              </span>
              <div
                onClick={() => {
                  if (pendingEquip) return alert("Conclua o Equipamento!");
                  graveyard.length > 0 && setShowGraveyardModal(true);
                }}
                className="relative w-[100px] h-[145px] border-2 border-solid border-gray-600 bg-gray-800 rounded-sm flex flex-col items-center justify-center shadow-inner cursor-pointer hover:border-gray-400"
              >
                {graveyard.length === 0 ? (
                  <span className="text-gray-400 text-[10px] font-bold">
                    CEMITÉRIO (0)
                  </span>
                ) : (
                  <div className="absolute inset-0 z-10">
                    <CardView
                      card={graveyard[graveyard.length - 1]}
                      disableDrag={true}
                      onClick={selectCardWithFlash}
                    />
                    <div className="absolute -bottom-2 -right-2 bg-black text-white text-[12px] font-bold px-2 py-1 rounded-full border-2 border-gray-500 z-50">
                      {graveyard.length}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* LINHA 4: JOGADOR 1 */}
          <div className="flex gap-8 justify-center">
            <div className="w-[100px] h-[145px] border-2 border-dashed border-purple-500/50 bg-purple-500/10 rounded-sm flex items-center justify-center">
              <span className="text-purple-500/50 text-[10px] font-bold text-center">
                EXTRA
                <br />
                DECK
              </span>
            </div>

            <div className="flex gap-6">
              {spellZone.map((cardInZone, index) => (
                <div
                  key={`p-s-${index}`}
                  id={`my-spell-${index}`}
                  className="w-[100px] h-[145px] border-2 border-dashed border-emerald-500/50 bg-emerald-500/10 rounded-sm flex items-center justify-center relative transition-transform hover:-translate-y-2 hover:scale-105"
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
                      {resolvingEffectId === cardInZone.id && (
                        <div className="absolute inset-0 border-4 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,1)] rounded z-0 animate-pulse pointer-events-none"></div>
                      )}

                      {activeFieldCardId === cardInZone.id &&
                        currentPhase !== "draw" && (
                          <div className="absolute -top-[50px] left-1/2 -translate-x-1/2 flex gap-2 bg-gray-800 border-2 border-gray-600 p-2 rounded-lg z-50 shadow-2xl">
                            {cardInZone.isFaceDown &&
                              ((cardInZone.cardType === "Spell" &&
                                currentPlayer === "player") ||
                                (cardInZone.cardType === "EquipSpell" &&
                                  currentPlayer === "player" &&
                                  canActivateEquip(cardInZone)) ||
                                (cardInZone.cardType === "Trap" &&
                                  cardInZone.turnSet !== undefined &&
                                  currentTurn > cardInZone.turnSet)) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleActivateSpell(cardInZone, index);
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
                          if (pendingEquip)
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
              onClick={drawCard}
              className={`relative w-[100px] h-[145px] border-4 rounded-sm bg-amber-900 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.2)_10px,rgba(0,0,0,0.2)_20px)] flex flex-col items-center justify-center shadow-xl cursor-pointer transition-transform ${
                currentPhase === "draw" && currentPlayer === "player"
                  ? "border-yellow-400 animate-pulse scale-105 shadow-[0_0_20px_rgba(250,204,21,0.6)]"
                  : "border-white hover:scale-105"
              }`}
            >
              <div className="w-[70px] h-[110px] border-[2px] border-amber-600 rounded-sm bg-amber-800 flex items-center justify-center shadow-inner">
                <div className="w-[40px] h-[40px] rounded-full bg-amber-500/50 flex items-center justify-center border-2 border-amber-400">
                  <span className="text-amber-200 font-bold text-[10px] transform -rotate-45 font-serif">
                    DECK
                  </span>
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-black text-white text-[12px] font-bold px-2 py-1 rounded-full border-2 border-gray-500 z-50">
                {deck.length}
              </div>
            </div>
          </div>
        </div>

        {/* === HUD JOGADOR 1 === */}
        <div className="absolute bottom-6 left-6 z-20 pointer-events-none">
          <div className="bg-blue-950/80 border-2 border-blue-900 rounded-lg py-2 px-6 flex gap-4 items-center shadow-lg pointer-events-auto">
            <span className="text-blue-400 font-bold uppercase tracking-widest text-sm">
              Jogador 1
            </span>
            <span className="text-3xl font-black text-blue-500 font-mono drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]">
              {playerLP}
            </span>
          </div>
        </div>

        {/* === MÃO DO JOGADOR === */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex justify-center -space-x-4 z-40 p-4">
          {hand.length === 0 && (
            <span className="text-gray-400 italic bg-gray-900/50 px-4 py-2 rounded-full">
              Sua mão está vazia. Clique no Deck para comprar.
            </span>
          )}
          {hand.map((card) => {
            const isMonster = "attack" in card;
            const isSpellOrEquip =
              card.cardType === "Spell" || card.cardType === "EquipSpell";
            const isField = card.cardType === "FieldSpell";
            const isTrap = card.cardType === "Trap";

            const canPlayMonster =
              isMonster && !isMonsterZoneFull && !hasSummonedThisTurn;
            const canPlaySpellOrEquip = isSpellOrEquip && !isSpellZoneFull;
            const canPlayField = isField;
            const canPlayTrap = isTrap && !isSpellZoneFull;
            const canDoSomething =
              canPlayMonster ||
              canPlaySpellOrEquip ||
              canPlayField ||
              canPlayTrap;

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
                      {canPlayMonster && (
                        <>
                          <button
                            onClick={() => handlePlayCard(card, false)}
                            className="flex flex-col items-center justify-center bg-gray-700 hover:bg-gray-600 p-2 rounded w-16 transition-colors"
                          >
                            <div className="w-3 h-5 border border-white bg-blue-400"></div>
                            <span className="text-[10px] text-white mt-1 font-bold">
                              Invocar
                            </span>
                          </button>
                          <button
                            onClick={() => handlePlayCard(card, true)}
                            className="flex flex-col items-center justify-center bg-gray-700 hover:bg-gray-600 p-2 rounded w-16 transition-colors"
                          >
                            <div className="w-5 h-3 border border-white bg-amber-800"></div>
                            <span className="text-[10px] text-white mt-1 font-bold">
                              Baixar
                            </span>
                          </button>
                        </>
                      )}
                      {canPlaySpellOrEquip && (
                        <>
                          {(card.cardType !== "EquipSpell" ||
                            canActivateEquip(card)) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlayCard(card, false);
                              }}
                              className="flex flex-col items-center justify-center bg-gray-700 hover:bg-gray-600 p-2 rounded w-16 transition-colors"
                            >
                              <div className="w-3 h-5 border border-white bg-emerald-500"></div>
                              <span className="text-[10px] text-white mt-1 font-bold">
                                Ativar
                              </span>
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayCard(card, true);
                            }}
                            className="flex flex-col items-center justify-center bg-gray-700 hover:bg-gray-600 p-2 rounded w-16 transition-colors"
                          >
                            <div className="w-3 h-5 border border-white bg-amber-800"></div>
                            <span className="text-[10px] text-white mt-1 font-bold">
                              Baixar
                            </span>
                          </button>
                        </>
                      )}
                      {canPlayField && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayCard(card, false);
                            }}
                            className="flex flex-col items-center justify-center bg-gray-700 hover:bg-gray-600 p-2 rounded w-16 transition-colors"
                          >
                            <div className="w-3 h-5 border border-white bg-emerald-500"></div>
                            <span className="text-[10px] text-white mt-1 font-bold">
                              Ativar
                            </span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayCard(card, true);
                            }}
                            className="flex flex-col items-center justify-center bg-gray-700 hover:bg-gray-600 p-2 rounded w-16 transition-colors"
                          >
                            <div className="w-3 h-5 border border-white bg-amber-800"></div>
                            <span className="text-[10px] text-white mt-1 font-bold">
                              Baixar
                            </span>
                          </button>
                        </>
                      )}
                      {canPlayTrap && (
                        <button
                          onClick={() => handlePlayCard(card, true)}
                          className="flex flex-col items-center justify-center bg-gray-700 hover:bg-gray-600 p-2 rounded w-16 transition-colors"
                        >
                          <div className="w-3 h-5 border border-white bg-amber-800"></div>
                          <span className="text-[10px] text-white mt-1 font-bold">
                            Baixar
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                <CardView
                  card={card}
                  onClick={(c) => {
                    if (pendingEquip)
                      return alert("Equipe o feitiço primeiro!");
                    selectCardWithFlash(c);
                    setActiveHandCardId(c.id);
                    setActiveFieldCardId(null);
                  }}
                  onPlayCard={(c) => {
                    if (pendingEquip) return;
                    handlePlayCard(c, false);
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* === MODAIS DE CEMITÉRIO === */}
        {showGraveyardModal && (
          <div
            className="absolute inset-0 bg-gray-900/95 backdrop-blur-md z-[100] flex flex-col p-8 border-l-4 border-blue-900"
            onClick={() => setShowGraveyardModal(false)}
          >
            <div className="w-full flex justify-between items-center mb-6 border-b-2 border-blue-900 pb-4">
              <h2 className="text-2xl font-bold text-blue-500 uppercase tracking-widest">
                Cemitério ({graveyard.length})
              </h2>
              <button className="text-white font-bold text-3xl bg-gray-800 hover:bg-gray-700 rounded-full w-10 h-10 flex items-center justify-center transition">
                &times;
              </button>
            </div>
            <div
              className="flex-1 overflow-y-auto flex flex-wrap gap-4 content-start"
              onClick={(e) => e.stopPropagation()}
            >
              {[...graveyard].reverse().map((c, i) => (
                <CardView
                  key={`gy-${c.id}-${i}`}
                  card={{ ...c, id: `${c.id}-modal` }}
                  disableDrag={true}
                  onClick={() => selectCardWithFlash(c)}
                />
              ))}
            </div>
          </div>
        )}

        {showOpponentGraveyardModal && (
          <div
            className="absolute inset-0 bg-gray-900/95 backdrop-blur-md z-[100] flex flex-col p-8 border-r-4 border-red-900"
            onClick={() => setShowOpponentGraveyardModal(false)}
          >
            <div className="w-full flex justify-between items-center mb-6 border-b-2 border-red-900 pb-4 shrink-0">
              <h2 className="text-2xl font-bold text-red-500 uppercase tracking-widest">
                Cemitério Oponente ({opponentGraveyard.length})
              </h2>
              <button
                onClick={() => setShowOpponentGraveyardModal(false)}
                className="text-gray-400 hover:text-white font-bold text-3xl transition-colors bg-gray-800 w-10 h-10 rounded-full flex items-center justify-center"
              >
                &times;
              </button>
            </div>
            <div
              className="flex-1 overflow-y-auto flex flex-wrap gap-4 justify-start content-start p-4 bg-black/30 rounded-xl border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              {[...opponentGraveyard].reverse().map((c, i) => (
                <CardView
                  key={`ogy-${c.id}-${i}`}
                  card={{ ...c, id: `${c.id}-modal` }}
                  disableDrag={true}
                  onClick={() => selectCardWithFlash(c)}
                  isOpponent={false}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* === HUD DE TURNOS === */}
      <div className="absolute right-8 top-1/2 transform -translate-y-1/2 flex flex-col gap-3 items-center z-40 pointer-events-none w-28">
        <div className="bg-gray-900 border-2 border-gray-600 rounded-lg p-3 text-center shadow-[0_0_20px_rgba(0,0,0,0.8)] pointer-events-auto w-full">
          <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">
            Turno
          </div>
          <div className="text-4xl font-black text-white font-mono leading-none">
            {currentTurn}
          </div>
        </div>

        <div
          className={`w-full text-center text-[10px] font-bold uppercase tracking-widest py-2 px-2 rounded border-2 transition-all duration-500 pointer-events-auto ${currentPlayer === "player" ? "bg-blue-900/90 border-blue-500 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.6)]" : "bg-red-900/90 border-red-500 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.6)]"}`}
        >
          {currentPlayer === "player" ? "Sua Vez" : "Oponente"}
        </div>

        <div className="flex flex-col gap-1 w-full mt-2 pointer-events-auto">
          {["draw", "main", "battle", "end"].map((phase) => (
            <div
              key={phase}
              className={`text-center py-1 px-1 text-[10px] font-bold uppercase tracking-widest rounded border transition-all ${currentPhase === phase ? "bg-yellow-500 text-black border-yellow-300 shadow-[0_0_10px_rgba(234,179,8,0.8)] scale-110 z-10" : "bg-gray-800 text-gray-500 border-gray-700 opacity-50"}`}
            >
              {phase}
            </div>
          ))}
        </div>

        <button
          onClick={() => nextPhase(() => actions.setAttackedMonsters([]))}
          disabled={
            pendingEquip !== null ||
            attackingAnimId !== null ||
            resolvingEffectId !== null ||
            currentPhase === "draw"
          }
          className={`mt-2 border-2 font-black uppercase tracking-widest py-3 px-2 rounded-xl transition-all pointer-events-auto shadow-xl flex flex-col items-center justify-center gap-1 w-full ${currentPhase === "draw" ? "bg-gray-900 border-gray-800 text-gray-600 opacity-50 cursor-not-allowed" : "bg-gray-800 hover:bg-gray-700 border-gray-500 hover:border-white text-gray-300 hover:text-white active:scale-95"}`}
        >
          <span className="text-[10px] text-gray-400">
            {currentPhase === "end" ? "Passar" : "Próxima"}
          </span>
          <span className="text-sm leading-none">
            {currentPhase === "end" ? "Turno" : "Fase"}
          </span>
        </button>
      </div>

      {(attackingAnimId || resolvingEffectId) && (
        <div
          className="fixed inset-0 z-[9000] cursor-wait"
          onClick={(e) => e.stopPropagation()}
        ></div>
      )}

      {pendingSelection && (
        <div className="absolute top-[35%] left-1/2 transform -translate-x-1/2 bg-gray-900 border-2 border-emerald-400 p-4 rounded-xl z-[9999] text-center shadow-[0_0_30px_rgba(52,211,153,0.5)] animate-pulse pointer-events-none">
          <h3 className="text-emerald-400 font-bold text-xl uppercase tracking-widest">
            {pendingSelection.message}
          </h3>
          <p className="text-gray-300 text-xs mt-1">
            Clique em uma carta brilhando verde na mesa
          </p>
        </div>
      )}

      {/* 🃏 MODAL DE BUSCA NO DECK (Efeito de Monstro) 🃏 */}
      {pendingDeckSearch && (
        <div
          className="absolute inset-0 bg-gray-900/95 backdrop-blur-md z-[9900] flex flex-col p-8 border-t-4 border-yellow-500"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full flex justify-between items-center mb-6 border-b-2 border-yellow-600 pb-4">
            <h2 className="text-2xl font-bold text-yellow-500 uppercase tracking-widest">
              {pendingDeckSearch.message}
            </h2>
            <button
              onClick={pendingDeckSearch.onCancel}
              className="text-gray-400 hover:text-white font-bold text-3xl transition-colors bg-gray-800 w-10 h-10 rounded-full flex items-center justify-center"
            >
              &times;
            </button>
          </div>
          <div className="flex-1 overflow-y-auto flex flex-wrap gap-4 content-start">
            {pendingDeckSearch.validCards.map((c, i) => (
              <CardView
                key={`search-${c.id}-${i}`}
                card={{ ...c, id: `${c.id}-search` }}
                disableDrag={true}
                onClick={() => pendingDeckSearch.onSelect(c.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 🛑 A NOSSA NOVA JANELA DE CORRENTE / INTERRUPÇÃO 🛑 */}
      {pendingPrompt && (
        // Mudamos o bg-black/80 para bg-black/20 (transparente) e usamos items-start pt-24 para jogá-lo para o topo!
        <div className="fixed inset-0 z-[9999] bg-black/20 backdrop-blur-[2px] flex items-start justify-center pt-24">
          <div className="bg-gray-900/95 border-4 border-red-600 rounded-xl p-6 shadow-[0_0_50px_rgba(220,38,38,0.8)] max-w-md w-full flex flex-col items-center animate-bounce-short">
            <h2 className="text-red-500 font-black text-2xl uppercase tracking-widest mb-4">
              Corrente Ativada!
            </h2>
            <p className="text-white text-center text-lg mb-8 font-serif">
              {pendingPrompt.message}
            </p>
            <div className="flex gap-6 w-full">
              <button
                onClick={pendingPrompt.onCancel}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded transition-colors"
              >
                Não ativar
              </button>
              <button
                onClick={pendingPrompt.onConfirm}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded shadow-[0_0_15px_rgba(220,38,38,0.8)] transition-all"
              >
                Ativar Armadilha!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🗑️ MODAL DE DESCARTE (Custo de Efeito) 🗑️ */}
      {pendingDiscard && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[9950] flex flex-col items-center justify-center p-8">
          <div className="bg-gray-900 border-2 border-purple-500 p-6 rounded-xl shadow-2xl max-w-2xl w-full">
            <h2 className="text-purple-400 font-bold text-xl mb-4 text-center uppercase">
              {pendingDiscard.message}
            </h2>
            <div className="flex flex-wrap gap-4 justify-center">
              {hand.map((c) => (
                <div
                  key={`discard-${c.id}`}
                  className="hover:scale-110 transition-transform cursor-pointer brightness-75 hover:brightness-125"
                >
                  <CardView
                    card={c}
                    onClick={() => pendingDiscard.onDiscard(c.id)}
                    disableDrag={true}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => setPendingDiscard(null)}
              className="mt-6 w-full py-2 bg-gray-800 text-gray-400 font-bold rounded hover:bg-gray-700 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* 🛡️ MODAL DE INVOCAÇÃO ESPECIAL (Flip) 🛡️ */}
      {pendingSpecialSummon && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-[9960] flex flex-col items-center justify-center p-8">
          <div className="bg-gray-900 border-2 border-emerald-500 p-6 rounded-xl shadow-2xl max-w-5xl w-full flex flex-col max-h-[90vh]">
            <h2 className="text-emerald-400 font-bold text-2xl mb-6 text-center uppercase tracking-widest">
              {pendingSpecialSummon.message}
            </h2>

            {/* CONTAINER DAS DUAS COLUNAS */}
            <div className="flex gap-6 w-full overflow-hidden flex-1">
              {/* COLUNA 1: DA MÃO */}
              <div className="flex-1 border-2 border-emerald-700/50 bg-emerald-900/20 rounded-xl p-4 flex flex-col">
                <h3 className="text-emerald-400 font-bold text-lg mb-4 text-center border-b border-emerald-700/50 pb-2">
                  ✋ DA MÃO
                </h3>
                <div className="flex flex-wrap gap-4 justify-center overflow-y-auto p-2 flex-1 content-start">
                  {pendingSpecialSummon.validCards
                    .filter((c) => hand.some((h) => h.id === c.id)) // Filtra só as que estão na mão
                    .map((c, i) => (
                      <div
                        key={`special-hand-${c.id}-${i}`}
                        className="hover:scale-110 transition-transform cursor-pointer drop-shadow-lg"
                      >
                        <CardView
                          card={c}
                          onClick={() => pendingSpecialSummon.onSelect(c)}
                          disableDrag={true}
                        />
                      </div>
                    ))}
                  {pendingSpecialSummon.validCards.filter((c) =>
                    hand.some((h) => h.id === c.id),
                  ).length === 0 && (
                    <span className="text-emerald-700/50 italic text-sm mt-10">
                      Nenhum soldado disponível na mão.
                    </span>
                  )}
                </div>
              </div>

              {/* COLUNA 2: DO CEMITÉRIO */}
              <div className="flex-1 border-2 border-purple-700/50 bg-purple-900/20 rounded-xl p-4 flex flex-col">
                <h3 className="text-purple-400 font-bold text-lg mb-4 text-center border-b border-purple-700/50 pb-2">
                  🪦 DO CEMITÉRIO
                </h3>
                <div className="flex flex-wrap gap-4 justify-center overflow-y-auto p-2 flex-1 content-start">
                  {pendingSpecialSummon.validCards
                    .filter((c) => graveyard.some((g) => g.id === c.id)) // Filtra só as que estão no cemitério
                    .map((c, i) => (
                      <div
                        key={`special-gy-${c.id}-${i}`}
                        className="hover:scale-110 transition-transform cursor-pointer drop-shadow-lg"
                      >
                        <CardView
                          card={c}
                          onClick={() => pendingSpecialSummon.onSelect(c)}
                          disableDrag={true}
                        />
                      </div>
                    ))}
                  {pendingSpecialSummon.validCards.filter((c) =>
                    graveyard.some((g) => g.id === c.id),
                  ).length === 0 && (
                    <span className="text-purple-700/50 italic text-sm mt-10">
                      Nenhum soldado no cemitério.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setPendingSpecialSummon(null)}
              className="mt-6 w-full py-3 bg-gray-800 text-gray-300 font-bold uppercase tracking-widest rounded-lg hover:bg-red-900 hover:text-white border border-gray-700 hover:border-red-500 transition-all"
            >
              Cancelar Invocação
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
