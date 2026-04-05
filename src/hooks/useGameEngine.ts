// src/hooks/useGameEngine.ts
import { useState, useEffect } from "react";
import { Card } from "../types/card";
import { cardDatabase } from "../data/cards";

const generateMockDeck = (ownerPrefix: string): Card[] => {
  const deck: Card[] = [];
  for (let i = 0; i < 5; i++) {
    cardDatabase.forEach((card) => {
      deck.push({ ...card, id: `${ownerPrefix}-${card.id}-clone-${i}` });
    });
  }
  return deck.sort(() => Math.random() - 0.5);
};

export function useGameEngine() {
  const [playerLP, setPlayerLP] = useState(8000);
  const [opponentLP, setOpponentLP] = useState(8000);

  // 👇 SISTEMA DE MANA
  const [playerMana, setPlayerMana] = useState(3);
  const [opponentMana, setOpponentMana] = useState(3);

  const [currentTurn, setCurrentTurn] = useState<number>(1);
  const [currentPlayer, setCurrentPlayer] = useState<"player" | "opponent">(
    "player",
  );
  const [currentPhase, setCurrentPhase] = useState<
    "draw" | "main" | "battle" | "end"
  >("main");
  const [hasSummonedThisTurn, setHasSummonedThisTurn] =
    useState<boolean>(false);
  const [attackedMonsters, setAttackedMonsters] = useState<string[]>([]);

  const [pendingPrompt, setPendingPrompt] = useState<{
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);
  const [pendingSelection, setPendingSelection] = useState<{
    validTargetIds: string[];
    message: string;
    onSelect: (cardId: string) => void;
    onCancel: () => void;
  } | null>(null);
  const [pendingDiscard, setPendingDiscard] = useState<{
    message: string;
    onDiscard: (cardId: string) => void;
  } | null>(null);
  const [pendingSpecialSummon, setPendingSpecialSummon] = useState<{
    message: string;
    validCards: Card[];
    onSelect: (card: Card) => void;
    onCancel: () => void;
  } | null>(null);
  const [usedEffectsThisTurn, setUsedEffectsThisTurn] = useState<string[]>([]);
  const [pendingDeckSearch, setPendingDeckSearch] = useState<{
    validCards: Card[];
    message: string;
    onSelect: (cardId: string) => void;
    onCancel: () => void;
  } | null>(null);

  const [hand, setHand] = useState<Card[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);

  // 👇 4 ZONAS NO TABULEIRO
  const [monsterZone, setMonsterZone] = useState<(Card | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [spellZone, setSpellZone] = useState<(Card | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [fieldSpell, setFieldSpell] = useState<Card | null>(null);
  const [graveyard, setGraveyard] = useState<Card[]>([]);
  const [banished, setBanished] = useState<Card[]>([]);

  const [opponentHand, setOpponentHand] = useState<Card[]>([]);
  const [opponentDeck, setOpponentDeck] = useState<Card[]>([]);
  const [opponentMonsterZone, setOpponentMonsterZone] = useState<
    (Card | null)[]
  >([null, null, null, null]);
  const [opponentSpellZone, setOpponentSpellZone] = useState<(Card | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [opponentFieldSpell, setOpponentFieldSpell] = useState<Card | null>(
    null,
  );
  const [opponentGraveyard, setOpponentGraveyard] = useState<Card[]>([]);
  const [opponentBanished, setOpponentBanished] = useState<Card[]>([]);

  const [equipLinks, setEquipLinks] = useState<
    { spellId: string; monsterId: string }[]
  >([]);

  useEffect(() => {
    const myInitialDeck = generateMockDeck("player");
    setHand(myInitialDeck.slice(0, 4));
    setDeck(myInitialDeck.slice(4));

    let oppInitialDeck = generateMockDeck("opp");
    oppInitialDeck = oppInitialDeck.filter((c) => {
      if ("level" in c && c.level >= 7) return false;
      return true;
    });

    const nomesParaMao = ["Batedor", "Campo", "Campo", "Campo"];
    const maoCustomizada: Card[] = [];

    nomesParaMao.forEach((nome) => {
      const index = oppInitialDeck.findIndex((c) => c.name.includes(nome));
      if (index !== -1) {
        maoCustomizada.push(oppInitialDeck[index]);
        oppInitialDeck.splice(index, 1);
      }
    });

    while (maoCustomizada.length < 4 && oppInitialDeck.length > 0) {
      maoCustomizada.push(oppInitialDeck.shift()!);
    }

    setOpponentHand(maoCustomizada);
    setOpponentDeck(oppInitialDeck);
  }, []);

  const nextPhase = (clearUIAttacks: () => void) => {
    if (currentPhase === "draw") return alert("Compre uma carta primeiro!");
    if (currentPhase === "main")
      setCurrentPhase(currentTurn === 1 ? "end" : "battle");
    else if (currentPhase === "battle") setCurrentPhase("end");
    else if (currentPhase === "end") {
      const nextPlayer = currentPlayer === "player" ? "opponent" : "player";
      setCurrentPlayer(nextPlayer);
      setCurrentTurn((prev) => prev + 1);
      setCurrentPhase("draw");
      setHasSummonedThisTurn(false);
      setAttackedMonsters([]);
      setUsedEffectsThisTurn([]);
      clearUIAttacks();

      // RECARGA DE MANA
      if (nextPlayer === "player")
        setPlayerMana((prev) => Math.min(8, prev + 2));
      if (nextPlayer === "opponent")
        setOpponentMana((prev) => Math.min(8, prev + 2));
    }
  };

  const drawCard = () => {
    if (
      currentPlayer !== "player" ||
      currentPhase !== "draw" ||
      deck.length === 0
    )
      return;
    setHand([...hand, deck[0]]);
    setDeck(deck.slice(1));
    setCurrentPhase("main");
  };

  const drawOpponentCard = () => {
    if (
      currentPlayer !== "opponent" ||
      currentPhase !== "draw" ||
      opponentDeck.length === 0
    )
      return;
    setOpponentHand([...opponentHand, opponentDeck[0]]);
    setOpponentDeck(opponentDeck.slice(1));
    setCurrentPhase("main");
  };

  const getMonsterEquips = (monsterId: string) => {
    return equipLinks
      .filter((l) => l.monsterId === monsterId)
      .map((l) =>
        [...spellZone, ...opponentSpellZone].find((s) => s?.id === l.spellId),
      )
      .filter((c) => c !== undefined) as Card[];
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
    },
    actions: {
      setPlayerLP,
      setOpponentLP,
      setPlayerMana,
      setOpponentMana,
      setCurrentPhase,
      setHasSummonedThisTurn,
      setAttackedMonsters,
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
    },
  };
}
