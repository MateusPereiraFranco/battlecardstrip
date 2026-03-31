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
  // === SISTEMA DE TURNOS E LP ===
  const [playerLP, setPlayerLP] = useState(8000);
  const [opponentLP, setOpponentLP] = useState(8000);
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

  // 👇 NOVO: O Estado que aguarda um jogador clicar em um alvo específico na mesa
  const [pendingSelection, setPendingSelection] = useState<{
    validTargetIds: string[];
    message: string;
    onSelect: (cardId: string) => void;
    onCancel: () => void;
  } | null>(null);

  // === ESTADO DO JOGADOR 1 ===
  // 👇 NOVO: O Estado que abre o Modal para o jogador escolher uma carta do deck
  const [pendingDeckSearch, setPendingDeckSearch] = useState<{
    validCards: Card[];
    message: string;
    onSelect: (cardId: string) => void;
    onCancel: () => void;
  } | null>(null);
  const [hand, setHand] = useState<Card[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [monsterZone, setMonsterZone] = useState<(Card | null)[]>([
    null,
    null,
    null,
  ]);
  const [spellZone, setSpellZone] = useState<(Card | null)[]>([
    null,
    null,
    null,
  ]);
  const [fieldSpell, setFieldSpell] = useState<Card | null>(null);
  const [graveyard, setGraveyard] = useState<Card[]>([]);
  const [banished, setBanished] = useState<Card[]>([]);

  // === ESTADO DO OPONENTE ===
  const [opponentHand, setOpponentHand] = useState<Card[]>([]);
  const [opponentDeck, setOpponentDeck] = useState<Card[]>([]);
  const [opponentMonsterZone, setOpponentMonsterZone] = useState<
    (Card | null)[]
  >([null, null, null]);
  const [opponentSpellZone, setOpponentSpellZone] = useState<(Card | null)[]>([
    null,
    null,
    null,
  ]);
  const [opponentFieldSpell, setOpponentFieldSpell] = useState<Card | null>(
    null,
  );
  const [opponentGraveyard, setOpponentGraveyard] = useState<Card[]>([]);
  const [opponentBanished, setOpponentBanished] = useState<Card[]>([]);

  // === EQUIPAMENTOS ===
  const [equipLinks, setEquipLinks] = useState<
    { spellId: string; monsterId: string }[]
  >([]);

  // === INICIALIZAÇÃO DO JOGO ===
  useEffect(() => {
    // Deck do Jogador
    const myInitialDeck = generateMockDeck("player");
    setHand(myInitialDeck.slice(0, 8));
    setDeck(myInitialDeck.slice(8));

    // Deck do Oponente
    const oppInitialDeck = generateMockDeck("opp");
    setOpponentHand(oppInitialDeck.slice(0, 4));
    setOpponentDeck(oppInitialDeck.slice(4));

    // Cartas falsas para testar o oponente
    const dragaoTeste = cardDatabase.find((c) => c.id === "m-001");
    const zumbiTeste = cardDatabase.find((c) => c.id === "m-003");
    const spellTeste = cardDatabase.find(
      (c) => c.cardType === "Spell" || c.id === "s-001",
    );
    const trapTeste = cardDatabase.find(
      (c) => c.cardType === "Trap" || c.id === "t-001",
    );
    const kamikaze = cardDatabase.find((c) => c.id === "t-003");

    setOpponentMonsterZone([
      dragaoTeste
        ? {
            ...dragaoTeste,
            id: "opp-m1",
            isFaceDown: true,
            cardPosition: "defense",
          }
        : null,
      zumbiTeste
        ? {
            ...zumbiTeste,
            id: "opp-m2",
            isFaceDown: false,
            cardPosition: "defense",
          }
        : null,
      zumbiTeste
        ? {
            ...zumbiTeste,
            id: "opp-m3",
            isFaceDown: false,
            cardPosition: "attack",
          }
        : null,
    ]);

    setOpponentSpellZone([
      spellTeste
        ? {
            ...spellTeste,
            id: "opp-s1",
            isFaceDown: true,
            cardPosition: "attack",
          }
        : null,
      trapTeste
        ? {
            ...trapTeste,
            id: "opp-s2",
            isFaceDown: true,
            cardPosition: "attack",
          }
        : null,
      kamikaze
        ? {
            ...kamikaze,
            id: "opp-s10",
            isFaceDown: true,
            cardPosition: "attack",
          }
        : null,
    ]);
  }, []);

  // === AÇÕES DE MOTOR ===
  const nextPhase = (clearUIAttacks: () => void) => {
    if (currentPhase === "draw")
      return alert("Você é obrigado a comprar uma carta clicando no seu Deck!");
    if (currentPhase === "main") {
      setCurrentPhase(currentTurn === 1 ? "end" : "battle");
    } else if (currentPhase === "battle") {
      setCurrentPhase("end");
    } else if (currentPhase === "end") {
      setCurrentPlayer((prev) => (prev === "player" ? "opponent" : "player"));
      setCurrentTurn((prev) => prev + 1);
      setCurrentPhase("draw");
      setHasSummonedThisTurn(false);
      setAttackedMonsters([]);
      clearUIAttacks();
    }
  };

  const drawCard = () => {
    if (currentPlayer !== "player") return alert("Não é o seu turno!");
    if (currentPhase !== "draw")
      return alert(
        "Você só pode comprar cartas durante a Fase de Compra (Draw Phase)!",
      );
    if (deck.length === 0) return alert("Seu baralho acabou!");

    setHand([...hand, deck[0]]);
    setDeck(deck.slice(1));
    setCurrentPhase("main");
  };

  const drawOpponentCard = () => {
    if (currentPlayer !== "opponent")
      return alert("Não é o turno do oponente!");
    if (currentPhase !== "draw") return alert("Fase incorreta!");
    if (opponentDeck.length === 0)
      return alert("O baralho do oponente acabou!");

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
    },
    actions: {
      setPlayerLP,
      setOpponentLP,
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
    },
  };
}
