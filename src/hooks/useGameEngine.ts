// src/hooks/useGameEngine.ts
import { useState, useCallback, useEffect } from "react";
import { Card } from "../types/card";
import { cardDatabase } from "../data/cards";
import {
  isValidEquipTarget,
  getEffectiveStats,
  checkTriggers,
  checkMonsterSummonEffect,
} from "../utils/rules";

export function useGameEngine() {
  const [playerLP, setPlayerLP] = useState(8000);
  const [opponentLP, setOpponentLP] = useState(8000);

  // 👇 CORREÇÃO: Mana começa em 3!
  const [playerMana, setPlayerMana] = useState(3);
  const [opponentMana, setOpponentMana] = useState(3);

  const [currentTurn, setCurrentTurn] = useState(1);
  const [currentPlayer, setCurrentPlayer] = useState<"player" | "opponent">(
    "player",
  );
  const [currentPhase, setCurrentPhase] = useState<
    "draw" | "main" | "battle" | "end"
  >("main");

  const [hasSummonedThisTurn, setHasSummonedThisTurn] = useState(false);
  const [attackedMonsters, setAttackedMonsters] = useState<string[]>([]);
  const [usedEffectsThisTurn, setUsedEffectsThisTurn] = useState<string[]>([]);

  const [hand, setHand] = useState<Card[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [monsterZone, setMonsterZone] = useState<(Card | null)[]>(
    Array(4).fill(null),
  );
  const [spellZone, setSpellZone] = useState<(Card | null)[]>(
    Array(4).fill(null),
  );
  const [fieldSpell, setFieldSpell] = useState<Card | null>(null);
  const [graveyard, setGraveyard] = useState<Card[]>([]);
  const [banished, setBanished] = useState<Card[]>([]);

  const [opponentHand, setOpponentHand] = useState<Card[]>([]);
  const [opponentDeck, setOpponentDeck] = useState<Card[]>([]);
  const [opponentMonsterZone, setOpponentMonsterZone] = useState<
    (Card | null)[]
  >(Array(4).fill(null));
  const [opponentSpellZone, setOpponentSpellZone] = useState<(Card | null)[]>(
    Array(4).fill(null),
  );
  const [opponentFieldSpell, setOpponentFieldSpell] = useState<Card | null>(
    null,
  );
  const [opponentGraveyard, setOpponentGraveyard] = useState<Card[]>([]);
  const [opponentBanished, setOpponentBanished] = useState<Card[]>([]);

  const [equipLinks, setEquipLinks] = useState<
    { spellId: string; monsterId: string }[]
  >([]);

  // UI State
  const [pendingPrompt, setPendingPrompt] = useState<{
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);
  const [pendingSelection, setPendingSelection] = useState<{
    message: string;
    validTargetIds: string[];
    onSelect: (id: string) => void;
    onCancel: () => void;
  } | null>(null);
  const [pendingDeckSearch, setPendingDeckSearch] = useState<{
    message: string;
    validCards: Card[];
    onSelect: (id: string) => void;
    onCancel: () => void;
  } | null>(null);
  const [pendingDiscard, setPendingDiscard] = useState<{
    message: string;
    onDiscard: (id: string) => void;
  } | null>(null);
  const [pendingSpecialSummon, setPendingSpecialSummon] = useState<{
    message: string;
    validCards: Card[];
    onSelect: (card: Card) => void;
  } | null>(null);

  // Animações
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

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      const shuffle = (array: any[]) => array.sort(() => Math.random() - 0.5);
      const createDeck = (prefix: string) =>
        shuffle([
          ...cardDatabase,
          ...cardDatabase,
          ...cardDatabase,
          ...cardDatabase,
        ])
          .slice(0, 20)
          .map((c, i) => ({ ...c, id: `${prefix}-${c.id}-${i}` }));

      const initialPlayerDeck = createDeck("p1");
      setHand(initialPlayerDeck.slice(0, 15));
      setDeck(initialPlayerDeck.slice(15));

      const initialOpponentDeck = createDeck("opp");
      setOpponentHand(initialOpponentDeck.slice(0, 8));
      setOpponentDeck(initialOpponentDeck.slice(8));

      setIsInitialized(true);
    }
  }, [isInitialized]);

  useEffect(() => {
    // 1. Mapeia quem está vivo na mesa neste momento
    const activeMonsters = [
      ...monsterZone.filter((m) => m !== null).map((m) => m!.id),
      ...opponentMonsterZone.filter((m) => m !== null).map((m) => m!.id),
    ];

    const activeSpells = [
      ...spellZone.filter((s) => s !== null).map((s) => s!.id),
      ...opponentSpellZone.filter((s) => s !== null).map((s) => s!.id),
    ];

    // 2. Descobre se tem alguma mágica apontando pro nada
    const orphanedLinks = equipLinks.filter(
      (link) => !activeMonsters.includes(link.monsterId),
    );
    const brokenLinks = equipLinks.filter(
      (link) => !activeSpells.includes(link.spellId),
    );

    // Se um monstro morreu, varre a mágica dele para o cemitério e apaga a linha
    if (orphanedLinks.length > 0) {
      setEquipLinks((prev) =>
        prev.filter((link) => activeMonsters.includes(link.monsterId)),
      );

      setSpellZone((prevZone) => {
        let newZone = [...prevZone];
        let spellsToGy: Card[] = [];
        orphanedLinks.forEach((link) => {
          const idx = newZone.findIndex((s) => s?.id === link.spellId);
          if (idx !== -1) {
            spellsToGy.push({
              ...newZone[idx]!,
              isFaceDown: false,
              cardPosition: "attack",
            });
            newZone[idx] = null;
          }
        });
        if (spellsToGy.length > 0)
          setGraveyard((prevGy) => [...prevGy, ...spellsToGy]);
        return newZone;
      });

      setOpponentSpellZone((prevZone) => {
        let newZone = [...prevZone];
        let spellsToGy: Card[] = [];
        orphanedLinks.forEach((link) => {
          const idx = newZone.findIndex((s) => s?.id === link.spellId);
          if (idx !== -1) {
            spellsToGy.push({
              ...newZone[idx]!,
              isFaceDown: false,
              cardPosition: "attack",
            });
            newZone[idx] = null;
          }
        });
        if (spellsToGy.length > 0)
          setOpponentGraveyard((prevGy) => [...prevGy, ...spellsToGy]);
        return newZone;
      });
    }
    // Se a mágica foi destruída (ex: clicou em Cemitério), apenas apaga a linha visual
    else if (brokenLinks.length > 0) {
      setEquipLinks((prev) =>
        prev.filter((link) => activeSpells.includes(link.spellId)),
      );
    }
  }, [
    monsterZone,
    opponentMonsterZone,
    spellZone,
    opponentSpellZone,
    equipLinks,
  ]);

  const nextPhase = useCallback(
    (callback?: () => void) => {
      setCurrentPhase((prev) => {
        if (prev === "draw") return "main";
        if (prev === "main") {
          if (currentTurn === 1) return "end";
          return "battle";
        }
        if (prev === "battle") return "end";
        return "end";
      });

      if (currentPhase === "end") {
        setCurrentPlayer((prev) => (prev === "player" ? "opponent" : "player"));
        setCurrentTurn((prev) => prev + 1);
        setCurrentPhase("draw");
        setHasSummonedThisTurn(false);
        setAttackedMonsters([]);
        setUsedEffectsThisTurn([]);
        // 👇 CORREÇÃO: Reseta a Mana para 3 a cada turno novo
        if (currentPlayer === "player") {
          setOpponentMana((prev) => Math.min(prev + 3, 8));
        } else {
          setPlayerMana((prev) => Math.min(prev + 3, 8));
        }

        if (callback) callback();
      }
    },
    [currentPhase, currentPlayer, currentTurn],
  );

  const drawCard = useCallback(() => {
    if (currentPlayer !== "player" || currentPhase !== "draw")
      return alert("Você só pode comprar na sua Fase de Compra (Draw Phase)!");
    if (currentTurn === 1) {
      alert("Regra: O jogador que começa o duelo não compra carta no Turno 1!");
      nextPhase();
      return;
    }
    if (deck.length > 0) {
      setHand((prev) => [...prev, deck[0]]);
      setDeck((prev) => prev.slice(1));
    } else alert("Seu deck acabou! Você perdeu o jogo!");
    nextPhase();
  }, [currentPlayer, currentPhase, currentTurn, deck, nextPhase]);

  const drawOpponentCard = useCallback(() => {
    if (currentTurn === 1) {
      nextPhase();
      return;
    }
    if (opponentDeck.length > 0) {
      setOpponentHand((prev) => [...prev, opponentDeck[0]]);
      setOpponentDeck((prev) => prev.slice(1));
    }
    nextPhase();
  }, [currentTurn, opponentDeck, nextPhase]);

  const getMonsterEquips = useCallback(
    (monsterId: string) => {
      const activeEquips = equipLinks
        .filter((l) => l.monsterId === monsterId)
        .map((l) => l.spellId);
      return spellZone.filter(
        (s) => s && activeEquips.includes(s.id),
      ) as Card[];
    },
    [equipLinks, spellZone],
  );

  const canActivateEquip = (equipCard: Card) => {
    const allMonsters = [...monsterZone, ...opponentMonsterZone].filter(
      (c) => c !== null,
    ) as Card[];
    return allMonsters.some((m) => isValidEquipTarget(equipCard, m));
  };

  const executePlayCard = (
    cardToPlay: Card,
    asFaceDown: boolean = false,
    forcePosition?: "attack" | "defense",
  ) => {
    if (currentPlayer !== "player") return alert("Não é o seu turno!");
    if (currentPhase !== "main")
      return alert("Você só pode invocar/baixar cartas na Fase Principal!");
    if (playerMana < cardToPlay.manaCost)
      return alert(
        `Você precisa de ${cardToPlay.manaCost} Energia para jogar esta carta!`,
      );
    if ("attack" in cardToPlay && hasSummonedThisTurn)
      return alert("Você só pode Invocar UM monstro por turno!");

    const finalIsFaceDown = cardToPlay.cardType === "Trap" ? true : asFaceDown;
    let position: "attack" | "defense" = "attack";
    if ("attack" in cardToPlay) position = forcePosition || "attack";

    const cardWithState = {
      ...cardToPlay,
      isFaceDown: "attack" in cardToPlay ? false : finalIsFaceDown,
      cardPosition: position,
      turnSet: currentTurn,
    };

    if (cardWithState.cardType === "FieldSpell") {
      setPlayerMana((prev) => prev - cardToPlay.manaCost);
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
        setPlayerMana((prev) => prev - cardToPlay.manaCost);
        const newZone = [...spellZone];
        newZone[emptyIndex] = cardWithState;
        setSpellZone(newZone);
        setHand(hand.filter((c) => c.id !== cardToPlay.id));

        if (
          !finalIsFaceDown &&
          (cardWithState.cardType === "Spell" ||
            cardWithState.cardType === "EquipSpell")
        ) {
          executeActivateSpell(cardWithState, emptyIndex, newZone);
        }
      } else alert("Zona de Mágicas/Armadilhas está cheia!");
    } else {
      const level = "level" in cardWithState ? cardWithState.level : 0;
      let tributesNeeded = 0;
      if (level === 5 || level === 6) tributesNeeded = 1;
      if (level >= 7) tributesNeeded = 2;

      const myActiveMonsters = monsterZone.filter((m) => m !== null);
      if (tributesNeeded > 0 && myActiveMonsters.length < tributesNeeded)
        return alert(
          `O monstro ${cardWithState.name} precisa de ${tributesNeeded} tributo(s)!`,
        );

      const executeSummon = (tributedIds: string[]) => {
        setPlayerMana((prev) => prev - cardToPlay.manaCost);
        let newZone = [...monsterZone];
        let newGy = [...graveyard];

        tributedIds.forEach((tId) => {
          const mIdx = newZone.findIndex((m) => m?.id === tId);
          if (mIdx !== -1) {
            const dead = newZone[mIdx]!;
            newZone[mIdx] = null;
            newGy.push({ ...dead, isFaceDown: false, cardPosition: "attack" });
          }
        });

        const emptyIndex = newZone.findIndex((slot) => slot === null);
        if (emptyIndex !== -1) {
          newZone[emptyIndex] = cardWithState;
          setMonsterZone(newZone);
          if (tributedIds.length > 0) setGraveyard(newGy);
          setHand(hand.filter((c) => c.id !== cardToPlay.id));
          setHasSummonedThisTurn(true);
          setResolvingEffectId(cardWithState.id);

          setTimeout(() => {
            setResolvingEffectId(null);
            const resolveMonsterEffect = (onComplete?: () => void) => {
              const effect = checkMonsterSummonEffect(cardWithState);
              if (effect.hasEffect && effect.type === "SEARCH_DECK") {
                const validCards = deck.filter(effect.filter!);
                if (validCards.length > 0) {
                  setPendingDeckSearch({
                    validCards,
                    message: effect.message!,
                    onSelect: (selectedId) => {
                      const cardToAdd = deck.find((c) => c.id === selectedId)!;
                      setHand((prev) => [...prev, cardToAdd]);
                      setDeck((prev) =>
                        prev
                          .filter((c) => c.id !== selectedId)
                          .sort(() => Math.random() - 0.5),
                      );
                      setPendingDeckSearch(null);
                      if (onComplete) onComplete();
                    },
                    onCancel: () => {
                      setPendingDeckSearch(null);
                      if (onComplete) onComplete();
                    },
                  });
                  return;
                }
              }
              if (onComplete) onComplete();
            };

            const trapCheck = checkTriggers(
              "ON_SUMMON",
              cardWithState,
              newZone,
              opponentMonsterZone,
              opponentSpellZone,
              [fieldSpell, opponentFieldSpell],
            );

            if (trapCheck.triggered && trapCheck.effect) {
              alert(
                `O oponente ativou a armadilha: ${trapCheck.trapCard!.name}!\n\n${trapCheck.effect.message}`,
              );
              setOpponentSpellZone((prev) => {
                const nz = [...prev];
                nz[trapCheck.trapIndex!] = {
                  ...trapCheck.trapCard!,
                  isFaceDown: false,
                };
                return nz;
              });

              resolveMonsterEffect(() => {
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
                }, 500);
              });
            } else {
              resolveMonsterEffect();
            }
          }, 1000);
        }
      };

      if (tributesNeeded > 0) {
        let selectedTributes: string[] = [];
        const askForTribute = (tributesLeft: number) => {
          const validIds = monsterZone
            .filter((m) => m !== null && !selectedTributes.includes(m.id))
            .map((m) => m!.id);
          setPendingSelection({
            message: `Selecione um monstro para tributar (${tributesNeeded - tributesLeft + 1}/${tributesNeeded})`,
            validTargetIds: validIds,
            onSelect: (selectedId) => {
              selectedTributes.push(selectedId);
              if (tributesLeft - 1 > 0) askForTribute(tributesLeft - 1);
              else {
                setPendingSelection(null);
                executeSummon(selectedTributes);
              }
            },
            onCancel: () => setPendingSelection(null),
          });
        };
        askForTribute(tributesNeeded);
      } else {
        const emptyIndex = monsterZone.findIndex((slot) => slot === null);
        if (emptyIndex !== -1) executeSummon([]);
        else alert("Sua Zona de Monstros está cheia!");
      }
    }
  };

  const executeActivateSpell = (
    spellCard: Card,
    spellIndex: number,
    currentSpellZone?: (Card | null)[],
  ) => {
    if (resolvingEffectId || attackingAnimId) return;

    // 👇 1. REMOVEMOS os "alerts" que travavam o bot.
    // A própria UI já impede o humano de clicar em "Ativar" na vez do bot!

    setResolvingEffectId(spellCard.id);

    // Identifica de quem é a mágica!
    const isOpponentSpell = currentPlayer === "opponent";

    if (spellCard.isFaceDown) {
      const zoneToUpdate =
        currentSpellZone || (isOpponentSpell ? opponentSpellZone : spellZone);
      const newZone = [...zoneToUpdate];
      newZone[spellIndex] = { ...spellCard, isFaceDown: false };
      if (isOpponentSpell) setOpponentSpellZone(newZone);
      else setSpellZone(newZone);
    }

    if (spellCard.cardType === "EquipSpell") {
      if (!canActivateEquip(spellCard)) {
        if (!isOpponentSpell) alert("Não há alvos válidos para equipar!");
        setResolvingEffectId(null);
        return;
      }

      // 👇 2. INTELIGÊNCIA DO BOT: Ele equipa automaticamente sem precisar do mouse!
      if (isOpponentSpell) {
        // O Bot procura primeiro um monstro válido no lado dele
        const myValid = opponentMonsterZone.filter(
          (m) => m !== null && isValidEquipTarget(spellCard, m),
        ) as Card[];
        if (myValid.length > 0) {
          setEquipLinks((prev) => [
            ...prev,
            { spellId: spellCard.id, monsterId: myValid[0].id },
          ]);
        } else {
          // Se ele não tiver monstros, ele tenta equipar no seu monstro (ex: um buff negativo no futuro)
          const pValid = monsterZone.filter(
            (m) => m !== null && isValidEquipTarget(spellCard, m),
          ) as Card[];
          if (pValid.length > 0) {
            setEquipLinks((prev) => [
              ...prev,
              { spellId: spellCard.id, monsterId: pValid[0].id },
            ]);
          }
        }
        setResolvingEffectId(null);
        return;
      }

      setPendingEquip({ spellCard, spellIndex });
      setResolvingEffectId(null);
      return;
    }

    const resolveSpellEffect = async () => {
      if (spellCard.cardType === "Trap") {
        setTimeout(() => {
          if (isOpponentSpell) {
            setOpponentSpellZone((prev) => {
              const nz = [...prev];
              nz[spellIndex] = null;
              return nz;
            });
            setOpponentGraveyard((prev) => [
              ...prev,
              { ...spellCard, isFaceDown: false, cardPosition: "attack" },
            ]);
          } else {
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
        }

        // 👇 3. CORREÇÃO: Limpa a zona correta e manda pro cemitério do dono da carta!
        if (isOpponentSpell) {
          setOpponentSpellZone((prev) => {
            const nz = [...prev];
            nz[spellIndex] = null;
            return nz;
          });
          setOpponentGraveyard((prev) => [
            ...prev,
            { ...spellCard, isFaceDown: false, cardPosition: "attack" },
          ]);
        } else {
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
      }, 1500);
    };

    const eventType =
      spellCard.cardType === "Trap"
        ? "ON_TRAP_ACTIVATION"
        : "ON_SPELL_ACTIVATION";
    const trapCheck = checkTriggers(
      eventType,
      spellCard,
      monsterZone,
      opponentMonsterZone,
      opponentSpellZone,
      [fieldSpell, opponentFieldSpell],
    );

    if (trapCheck.triggered && trapCheck.effect) {
      // Impede o bot de tomar um alert nosso
      if (!isOpponentSpell) {
        alert(
          `O oponente ativou a armadilha: ${trapCheck.trapCard!.name}!\n\n${trapCheck.effect.message}`,
        );
        setOpponentSpellZone((prev) => {
          const nz = [...prev];
          nz[trapCheck.trapIndex!] = {
            ...trapCheck.trapCard!,
            isFaceDown: false,
          };
          return nz;
        });
      }

      setTimeout(() => {
        if (trapCheck.effect!.negateActivation) {
          if (isOpponentSpell) {
            setOpponentSpellZone((prev) => {
              const nz = [...prev];
              nz[spellIndex] = null;
              return nz;
            });
            setOpponentGraveyard((prev) => [
              ...prev,
              { ...spellCard, isFaceDown: false, cardPosition: "attack" },
            ]);
          } else {
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
        } else {
          resolveSpellEffect();
        }

        if (trapCheck.effect!.destroyTrap) {
          if (!isOpponentSpell) {
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
        }
      }, 1500);
    } else {
      resolveSpellEffect();
    }
  };

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
      [fieldSpell, opponentFieldSpell],
      getMonsterEquips(attackerCard.id),
    );
    const myAtk = myStats
      ? myStats.attack
      : "attack" in attackerCard
        ? attackerCard.attack
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
        if (isPlayerAttacking) {
          setOpponentLP((prev) => prev - (myAtk - oppAtk));
          setOpponentMonsterZone((prev) => {
            const nz = [...prev];
            nz[targetIndex] = null;
            return nz;
          });
          setOpponentGraveyard((prev) => [...prev, cleanCardForGy(targetCard)]);
          setMonsterZone((prev) => {
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
          setPlayerLP((prev) => prev - (myAtk - oppAtk));
          setMonsterZone((prev) => {
            const nz = [...prev];
            nz[targetIndex] = null;
            return nz;
          });
          setGraveyard((prev) => [...prev, cleanCardForGy(targetCard)]);
          setOpponentMonsterZone((prev) => {
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
          setPlayerLP((prev) => prev - (oppAtk - myAtk));
          setMonsterZone((prev) => {
            const nz = [...prev];
            nz[attackerIndex] = null;
            return nz;
          });
          setGraveyard((prev) => [...prev, cleanCardForGy(attackerCard)]);
          setOpponentMonsterZone((prev) => {
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
          setOpponentLP((prev) => prev - (oppAtk - myAtk));
          setOpponentMonsterZone((prev) => {
            const nz = [...prev];
            nz[attackerIndex] = null;
            return nz;
          });
          setOpponentGraveyard((prev) => [
            ...prev,
            cleanCardForGy(attackerCard),
          ]);
          setMonsterZone((prev) => {
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
        setOpponentMonsterZone((prev) => {
          const nz = [...prev];
          nz[isPlayerAttacking ? targetIndex : attackerIndex] = null;
          return nz;
        });
        setOpponentGraveyard((prev) => [
          ...prev,
          cleanCardForGy(isPlayerAttacking ? targetCard : attackerCard),
        ]);
        setMonsterZone((prev) => {
          const nz = [...prev];
          nz[isPlayerAttacking ? attackerIndex : targetIndex] = null;
          return nz;
        });
        setGraveyard((prev) => [
          ...prev,
          cleanCardForGy(isPlayerAttacking ? attackerCard : targetCard),
        ]);
      }
    } else {
      if (myAtk > oppDef) {
        if (isPlayerAttacking) {
          setOpponentMonsterZone((prev) => {
            const nz = [...prev];
            nz[targetIndex] = null;
            return nz;
          });
          setOpponentGraveyard((prev) => [...prev, cleanCardForGy(targetCard)]);
        } else {
          setMonsterZone((prev) => {
            const nz = [...prev];
            nz[targetIndex] = null;
            return nz;
          });
          setGraveyard((prev) => [...prev, cleanCardForGy(targetCard)]);
        }
      } else if (myAtk < oppDef) {
        if (isPlayerAttacking) setPlayerLP((prev) => prev - (oppDef - myAtk));
        else setOpponentLP((prev) => prev - (oppDef - myAtk));
      }
    }
    onComplete();
  };

  const executeAttackMonster = (targetCard: Card, targetIndex: number) => {
    if (currentPlayer !== "player") return alert("Não é o seu turno!");
    if (currentPhase !== "battle")
      return alert("Você só pode atacar na Fase de Batalha!");
    if (currentTurn === 1)
      return alert("Regra: Não é permitido atacar no primeiro turno do jogo!");
    if (!attackerInfo || attackingAnimId) return;

    const executeCombat = () => {
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

      setTimeout(() => {
        executeCombatLogic(
          attackerInfo.card,
          attackerInfo.index,
          targetCard,
          targetIndex,
          true,
          () => {
            setAttackingAnimId(null);
            setAttackTrajectory(null);
            setAttackerInfo(null);
          },
        );
      }, 500);
    };

    const trapCheck = checkTriggers(
      "ON_ATTACK",
      attackerInfo.card,
      monsterZone,
      opponentMonsterZone,
      opponentSpellZone,
      [fieldSpell, opponentFieldSpell],
    );

    if (trapCheck.triggered && trapCheck.effect) {
      alert(
        `O oponente ativou a armadilha: ${trapCheck.trapCard!.name}!\n\n${trapCheck.effect.message}`,
      );
      setOpponentSpellZone((prev) => {
        const nz = [...prev];
        nz[trapCheck.trapIndex!] = {
          ...trapCheck.trapCard!,
          isFaceDown: false,
        };
        return nz;
      });

      setTimeout(() => {
        if ((trapCheck.effect as any).requiresSelfMonsterDestruction) {
          setOpponentMonsterZone((prev) => {
            const nz = [...prev];
            const sIdx = nz.findIndex(
              (m) =>
                m !== null &&
                !m.isFaceDown &&
                "race" in m &&
                m.race === "Soldado",
            );
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
          setMonsterZone((prev) => {
            const nz = [...prev];
            nz[attackerInfo.index] = null;
            return nz;
          });
          setGraveyard((prev) => [
            ...prev,
            { ...attackerInfo.card, isFaceDown: false, cardPosition: "attack" },
          ]);
          setAttackingAnimId(null);
          setAttackTrajectory(null);
          setAttackerInfo(null);
        } else {
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
          }
        }
      }, 1000);
    } else executeCombat();
  };

  const executeDirectAttack = () => {
    if (!attackerInfo || attackingAnimId) return;
    if (currentPlayer !== "player") return alert("Não é o seu turno!");
    if (currentPhase !== "battle")
      return alert("Você só pode atacar na Fase de Batalha (Battle Phase)!");
    if (currentTurn === 1)
      return alert("Regra: Não é permitido atacar no primeiro turno do jogo!");
    if (opponentMonsterZone.some((slot) => slot !== null))
      return alert(
        "Você não pode atacar diretamente se o oponente tem monstros no campo!",
      );

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

  return {
    state: {
      playerLP,
      opponentLP,
      playerMana,
      opponentMana,
      currentTurn,
      currentPlayer,
      currentPhase,
      hasSummonedThisTurn,
      attackedMonsters,
      usedEffectsThisTurn,
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
      pendingSpecialSummon,
      attackerInfo,
      attackTrajectory,
      attackingAnimId,
      resolvingEffectId,
      pendingEquip,
    },
    actions: {
      setPlayerLP,
      setOpponentLP,
      setPlayerMana,
      setOpponentMana,
      setCurrentTurn,
      setCurrentPlayer,
      setCurrentPhase,
      setHasSummonedThisTurn,
      setAttackedMonsters,
      setUsedEffectsThisTurn,
      setHand,
      setDeck,
      setMonsterZone,
      setSpellZone,
      setFieldSpell,
      setGraveyard,
      setBanished,
      setOpponentHand,
      setOpponentDeck,
      setOpponentMonsterZone,
      setOpponentSpellZone,
      setOpponentFieldSpell,
      setOpponentGraveyard,
      setOpponentBanished,
      setEquipLinks,
      setPendingPrompt,
      setPendingSelection,
      setPendingDeckSearch,
      setPendingDiscard,
      setPendingSpecialSummon,
      setAttackerInfo,
      setAttackTrajectory,
      setAttackingAnimId,
      setResolvingEffectId,
      setPendingEquip,
      nextPhase,
      drawCard,
      drawOpponentCard,
      getMonsterEquips,
      executePlayCard,
      executeActivateSpell,
      executeAttackMonster,
      executeDirectAttack,
    },
  };
}
